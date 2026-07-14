# canvas-quiz

[![CI](https://github.com/mckoss/canvas-quiz/actions/workflows/ci.yml/badge.svg)](https://github.com/mckoss/canvas-quiz/actions/workflows/ci.yml)

Author **Canvas LMS** learning modules in plain **Markdown**, and render them as
rich, interactive pages inside Canvas — with:

- 📚 **Hierarchical expand/collapse** — every `##`/`###` heading becomes a
  collapsible section (native `<details>`, keyboard-accessible, no JS needed to fold).
- 🧩 **Embeds** — drop in YouTube, video, or any iframe-able content.
- 📖 **Glossary** — define terms once; reference them inline with `[[Term]]` for
  hover/tap definitions.
- ✅ **Interleaved quizzes** — multiple-choice and multiple-answer questions with
  instant self-check feedback. (Posting scores to Canvas for grading is the next
  milestone — see [Roadmap](#roadmap).)

No build step, no bundler, no framework. It's one JS file and one CSS file you
drop into a Canvas page.

## Quick start

### Standalone preview (outside Canvas)

```bash
npm install      # only needed for `npm run serve` (no runtime deps)
npm test         # run the parser test suite
npm run serve    # serve repo root; open http://localhost:3000/examples/
```

Open `examples/index.html` to see [`examples/module.md`](examples/module.md)
rendered with all four features.

### Inside a Canvas page

Paste this into a Canvas page's HTML editor (hosting the two files on GitHub
Pages / a CDN):

```html
<link rel="stylesheet" href="https://YOURHOST/canvas-quiz.css">
<div data-canvas-quiz data-src="https://YOURHOST/my-module.md"></div>
<script type="module" src="https://YOURHOST/canvas-quiz.js"></script>
```

Or inline the Markdown instead of fetching it:

```html
<div data-canvas-quiz>
  <script type="text/markdown">
# My Module
...
  </script>
</div>
```

The widget auto-initializes any element with `data-canvas-quiz` on page load.

## Authoring format

It's regular Markdown, plus a few `:::` fenced blocks that survive a plain
Markdown preview:

### Quiz

```
:::quiz {points: 2}
Q: What is 2 + 2?
- ( ) 3
- (x) 4
- ( ) 5
> 4 is correct — shown after answering.
:::
```

- `(x)` marks correct options. Multiple `(x)` → multiple-answer (checkboxes);
  a single `(x)` → single-answer (radio).
- `> …` lines are the explanation, revealed once answered correctly.
- `{points: N}` sets the score weight (default `1`).

### Embed

```
:::embed
https://www.youtube.com/embed/VIDEO_ID
:::
```

### Glossary

```
:::glossary
Photosynthesis: The process by which plants convert light into energy.
:::
```

Reference any defined term inline as `[[Photosynthesis]]`. Undefined terms fall
back to plain text.

## Programmatic use

```js
import CanvasQuiz from './src/canvas-quiz.js';

// Pure, DOM-free: string -> { html, glossary }. Handy for SSR or tests.
const { html } = CanvasQuiz.parse(markdown);

// Browser: render + wire up interactions. onAnswer fires on each check.
CanvasQuiz.render('#module', markdown, {
  onAnswer({ quizId, correct, points }) { /* track score, later post to Canvas */ },
});
```

## Roadmap

- [x] Markdown → interactive HTML (headings, lists, code, links, inline formatting)
- [x] Collapsible hierarchical sections
- [x] Quiz blocks with client-side self-check
- [x] Embeds and glossary
- [ ] Post quiz results to Canvas for grading (LTI 1.3 / Submissions API)
- [ ] Additional question types (short answer, ordering, matching)
- [ ] Progress persistence (resume where you left off)

## License

MIT © Mike Koss
