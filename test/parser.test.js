import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parse } from '../src/canvas-quiz.js';

test('renders headings level 1 as <h1>, not collapsible', () => {
  const { html } = parse('# Title');
  assert.match(html, /<h1[^>]*>Title<\/h1>/);
  assert.doesNotMatch(html, /<details[^>]*>[^]*Title/);
});

test('level >= 2 headings become collapsible <details> sections', () => {
  const { html } = parse('## Section\n\nBody text.');
  assert.match(html, /<details class="cq-section cq-level-2" open/);
  assert.match(html, /<summary>.*Section.*<\/summary>/s);
  assert.match(html, /Body text\./);
});

test('nested headings close prior sections at same or higher level', () => {
  const md = '## A\ntext a\n### A1\ntext a1\n## B\ntext b';
  const { html } = parse(md);
  // Two level-2 sections + one level-3 => 3 <details>, 3 </details>
  assert.equal((html.match(/<details/g) || []).length, 3);
  assert.equal((html.match(/<\/details>/g) || []).length, 3);
});

test('inline formatting: bold, italic, code, links', () => {
  const { html } = parse('This is **bold**, *italic*, `code`, and a [link](https://x.com).');
  assert.match(html, /<strong>bold<\/strong>/);
  assert.match(html, /<em>italic<\/em>/);
  assert.match(html, /<code>code<\/code>/);
  assert.match(html, /<a href="https:\/\/x\.com"[^>]*>link<\/a>/);
});

test('code spans are not re-processed as markdown', () => {
  const { html } = parse('Use `**not bold**` literally.');
  assert.match(html, /<code>\*\*not bold\*\*<\/code>/);
  assert.doesNotMatch(html, /<strong>/);
});

test('html is escaped to prevent injection', () => {
  const { html } = parse('A <script>alert(1)</script> tag.');
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /<script>alert/);
});

test('quiz block parses question, options, correctness, and points', () => {
  const md = [
    ':::quiz {points: 2}',
    'Q: What is 2 + 2?',
    '- ( ) 3',
    '- (x) 4',
    '- ( ) 5',
    '> Because arithmetic.',
    ':::',
  ].join('\n');
  const { html } = parse(md);
  assert.match(html, /data-cq-points="2"/);
  assert.match(html, /data-cq-multi="0"/); // single correct => radio/single
  assert.match(html, /type="radio"/);
  assert.match(html, /data-cq-correct="1"[^>]*>\s*<span>4<\/span>|value="1"[^>]*data-cq-correct="1"/);
  assert.match(html, /Because arithmetic\./);
});

test('quiz with multiple correct answers uses checkboxes', () => {
  const md = [
    ':::quiz',
    'Q: Pick the even numbers.',
    '- (x) 2',
    '- ( ) 3',
    '- (x) 4',
    ':::',
  ].join('\n');
  const { html } = parse(md);
  assert.match(html, /data-cq-multi="1"/);
  assert.match(html, /type="checkbox"/);
});

test('embed block produces a sandboxed iframe', () => {
  const { html } = parse(':::embed\nhttps://example.com/video\n:::');
  assert.match(html, /<iframe src="https:\/\/example\.com\/video"/);
});

test('glossary definitions are collected and inline [[term]] gets a tooltip', () => {
  const md = [
    'Learn about [[Osmosis]] here.',
    '',
    ':::glossary',
    'Osmosis: Movement of water across a membrane.',
    ':::',
  ].join('\n');
  const { html, glossary } = parse(md);
  assert.equal(glossary.osmosis, 'Movement of water across a membrane.');
  assert.match(html, /<span class="cq-term"[^>]*data-cq-def="Movement of water across a membrane\."/);
});

test('unknown glossary term renders as plain text, not broken markup', () => {
  const { html } = parse('An [[Undefined Term]] here.');
  assert.match(html, /Undefined Term/);
  assert.doesNotMatch(html, /cq-term/);
});

test('glossary block itself renders no visible content', () => {
  const { html } = parse(':::glossary\nFoo: bar\n:::');
  assert.doesNotMatch(html, /Foo: bar/);
});

test('unordered and ordered lists', () => {
  const ul = parse('- one\n- two').html;
  assert.match(ul, /<ul>\s*<li>one<\/li>\s*<li>two<\/li>\s*<\/ul>/);
  const ol = parse('1. first\n2. second').html;
  assert.match(ol, /<ol>\s*<li>first<\/li>\s*<li>second<\/li>\s*<\/ol>/);
});

test('CRLF line endings are normalized', () => {
  const { html } = parse('# Title\r\n\r\nBody\r\n');
  assert.match(html, /<h1[^>]*>Title<\/h1>/);
  assert.match(html, /Body/);
});
