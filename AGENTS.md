# AGENTS.md — canvas-quiz design notes

Guidance for Claude Code (and humans) working in this repo. Read this before any
non-trivial change. `README.md` covers user-facing behavior.

## What this is

A dependency-free widget that turns a Markdown "module" into an interactive
Canvas LMS page: collapsible sections, embeds, a glossary, and interleaved
self-check quizzes. It is meant to be dropped into a Canvas page as two static
files (`canvas-quiz.js`, `canvas-quiz.css`).

## Hard rules

1. **No build step, no bundler, no framework.** `src/canvas-quiz.js` and
   `src/canvas-quiz.css` are shipped as-is. Keep it that way — Canvas pages
   reference them directly.
2. **`npm test` must be green before every commit.**
3. **Bump `version` in `package.json`** for user-visible changes (semver:
   patch for fixes, minor for features, major for format/API breaks). The
   authoring format is a public contract once modules exist in the wild.
4. **`parse()` stays pure** — `string -> { html, glossary }`, no DOM access.
   All DOM/interaction wiring lives in `render()` and the `wire*` helpers so the
   parser remains testable under Node with no jsdom.
5. **Escape everything.** Author content and glossary defs are escaped before
   hitting `innerHTML`. Never interpolate raw user text into markup. When adding
   a new block type, run its content through `escapeHtml`/`inline`, and its
   attributes through `escapeAttr`.

## Architecture

- **`src/canvas-quiz.js`** — one IIFE exposing `{ parse, render, autoInit }`,
  plus ESM named exports for tests.
  - `parse()` — two passes: (1) `collectGlossary()` scans all `:::glossary`
    blocks so inline `[[term]]` refs resolve regardless of definition order;
    (2) `renderBlocks()` walks lines and emits HTML.
  - `renderBlocks()` — a line-based block parser. Recognizes `:::name` fences,
    ` ``` ` code fences, headings, lists, blank lines, then paragraphs as the
    fallback. Headings ≥ level 2 open a `<details>` section; a `sectionStack`
    closes open sections when a heading of equal/higher level appears.
  - `inline()` — code spans are extracted to placeholders **first** (so their
    contents aren't re-parsed), then the text is HTML-escaped, then links,
    glossary refs, bold, and italic are applied, then code spans restored.
  - `render()` — injects `html`, then `wireQuizzes()` and `wireGlossary()`.
  - `autoInit()` — renders every `[data-canvas-quiz]` element from `data-src`
    (fetched) or an inline `<script type="text/markdown">` child.
- **`src/canvas-quiz.css`** — all scoped under `.cq-root` so Canvas's own styles
  don't collide. Supports `prefers-color-scheme: dark`.
- **`test/parser.test.js`** — node `--test` over `parse()`. DOM-free.
- **`examples/`** — `module.md` exercises every feature; `index.html` renders it
  standalone and tracks a running score via the `onAnswer` callback.

## Conventions & gotchas

- **Collapse is native `<details>`**, not JS. This is deliberate: accessible,
  keyboard-friendly, and works even if the quiz JS fails to load. Don't replace
  it with a custom toggle.
- **`node --test test/` fails on this Node build** — it resolves `test/` as a
  file, not a dir. The `test` script uses the glob `'test/**/*.test.js'`
  (quoted so the shell doesn't expand it). Keep the quotes.
- **Quiz correctness lives in the DOM** as `data-cq-correct="1"` on inputs, and
  grading compares each input's `checked` state to it. When Canvas grading lands
  we may need to hide correct answers from the DOM (server-side check) — noted
  for the LTI milestone.
- **`inline()` italic regex** requires a non-`*` char (or start) before the `*`
  to avoid clobbering `**bold**`. If you touch the bold/italic rules, add a test
  for `**a** and *b*` on the same line.
- **Embeds are iframes** with `referrerpolicy="no-referrer"`. We do not sandbox
  yet because YouTube needs scripts; revisit if we allow arbitrary embed URLs
  from untrusted authors.

## Roadmap / open questions

- **Canvas grading** is the big next piece. Options: LTI 1.3 launch + AGS
  (Assignment & Grade Services), or the Submissions API with a token. This
  decides whether we need a small backend or can stay purely client-side.
  Until decided, quizzes are self-check only.
- Additional question types (short answer, matching, ordering).
- Progress persistence (localStorage first, Canvas state later).
