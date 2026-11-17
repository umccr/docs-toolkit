import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, test } from 'node:test';
import { runInThisContext } from 'node:vm';

/**
 * The chat panel's Markdown renderer, in the theme's umccr.js: OrcaSonar's answers are Markdown, and the panel builds
 * them into elements itself. These check the tree it builds from, which the panel turns into elements and text nodes,
 * and how the panel reads an answer's event stream and gives up on one that stalls.
 *
 * Node's own test runner, with no dependencies: `node --test tests/js/*.test.mjs` (`make test`).
 *
 * A tree node is a string, which the panel adds as text, or `{ tag, children, href?, start?, ref? }`.
 */

const SCRIPT = new URL('../../src/umccr_docs/theme/assets/umccr/umccr.js', import.meta.url);

/** The script as Node sees it: no window, so it exports the renderer instead of drawing a page. */
const load = () => {
  const sandbox = { exports: {} };
  const run = runInThisContext(`(function (module) {${readFileSync(SCRIPT, 'utf8')}\n})`);
  run(sandbox);
  return sandbox.exports;
};

const { markdownTree, closeOpenMarks, safeHref, readEvents, watchdog } = load();

/** A tree as compact markup, for readable expectations. Text is escaped, so a `<` it holds shows as `&lt;`. */
const html = (nodes) =>
  nodes
    .map((node) => {
      if (typeof node === 'string') {
        return node.replace(/&/g, '&amp;').replace(/</g, '&lt;');
      }
      if (node.tag === 'cite') {
        return `<cite ${node.ref}>`;
      }
      const href = node.href ? ` href="${node.href}"` : '';
      const start = node.start ? ` start="${node.start}"` : '';
      return `<${node.tag}${href}${start}>${html(node.children)}</${node.tag}>`;
    })
    .join('');

const render = (markdown) => html(markdownTree(markdown));

describe('chat panel Markdown', () => {
  test('renders an answer with a numbered list, bold, citation markers and a link', () => {
    const answer = [
      'The active projects are:',
      '',
      '1. **data-sharing-2026**: high priority [3]',
      '2. **file-manager-2**: high priority [3][4]',
      '',
      'See [Priorities](https://docs.umccr.org/management-knowledgebase/Priorities/).',
    ].join('\n');
    assert.equal(
      render(answer),
      '<p>The active projects are:</p>' +
        '<ol><li><strong>data-sharing-2026</strong>: high priority <cite 3></li>' +
        '<li><strong>file-manager-2</strong>: high priority <cite 3><cite 4></li></ol>' +
        '<p>See <a href="https://docs.umccr.org/management-knowledgebase/Priorities/">Priorities</a>.</p>'
    );
  });

  test('nests lists, keeps where a numbered list starts, and keeps a loose list together', () => {
    assert.equal(render('- a\n  - b\n- c'), '<ul><li>a<ul><li>b</li></ul></li><li>c</li></ul>');
    assert.equal(render('3. three\n\n4. four'), '<ol start="3"><li>three</li><li>four</li></ol>');
    assert.equal(render('Steps:\n1. one\n2. two'), '<p>Steps:</p><ol><li>one</li><li>two</li></ol>');
    assert.equal(
      render('1. Build\n   ```sh\n   make test\n   ```'),
      '<ol><li>Build<pre><code>make test</code></pre></li></ol>'
    );
  });

  test('renders code, emphasis, quotes, rules, headings and line breaks', () => {
    assert.equal(
      render('Run `umccr-docs check`, *then* ~~not~~ __this__ or ***both***.'),
      '<p>Run <code>umccr-docs check</code>, <em>then</em> <del>not</del> <strong>this</strong> or ' +
        '<em><strong>both</strong></em>.</p>'
    );
    assert.equal(
      render('> quoted\n\n---\n\n## Steps\n\none\ntwo'),
      '<blockquote><p>quoted</p></blockquote><hr></hr><h4>Steps</h4><p>one<br></br>two</p>'
    );
    assert.equal(
      render('```\n<b>kept</b> **as is**\n```'),
      '<pre><code>&lt;b>kept&lt;/b> **as is**</code></pre>'
    );
  });

  test('leaves snake_case, globs and arithmetic alone', () => {
    assert.equal(
      render('Set doc_id and site_url; 2 * 3 * 4.'),
      '<p>Set doc_id and site_url; 2 * 3 * 4.</p>'
    );
  });

  test('renders a table', () => {
    assert.equal(
      render('| Name | Lead |\n| --- | :---: |\n| `alpha` | Ada \\| Grace |'),
      '<table><thead><tr><th>Name</th><th>Lead</th></tr></thead>' +
        '<tbody><tr><td><code>alpha</code></td><td>Ada | Grace</td></tr></tbody></table>'
    );
  });

  test('a number in brackets is a citation marker, unless it is a link', () => {
    assert.equal(
      render('See [1](https://example.org/) and [12], not [123] or [a].'),
      '<p>See <a href="https://example.org/">1</a> and <cite 12>, not [123] or [a].</p>'
    );
  });

  test('keeps HTML in an answer as text', () => {
    assert.equal(
      render('<script>alert(1)</script>\n\n<img src=x onerror=alert(1)> and <b>bold</b>'),
      '<p>&lt;script>alert(1)&lt;/script></p><p>&lt;img src=x onerror=alert(1)> and &lt;b>bold&lt;/b></p>'
    );
  });

  test('links only to http(s), mailto and paths on this site', () => {
    assert.equal(
      render(
        '[a](javascript:alert) [b](data:text/html,x) [c](//evil.example.com/) [d](/\\evil.example.com/) ' +
          '![e](javascript:alert)'
      ),
      '<p>a b c d e</p>'
    );
    assert.equal(
      render('[docs](/platform/) <https://github.com/umccr> and https://docs.umccr.org/x/.'),
      '<p><a href="/platform/">docs</a> <a href="https://github.com/umccr">https://github.com/umccr</a> and ' +
        '<a href="https://docs.umccr.org/x/">https://docs.umccr.org/x/</a>.</p>'
    );
    assert.equal(safeHref('mailto:platform@example.org'), 'mailto:platform@example.org');
    assert.equal(safeHref('JavaScript:alert(1)'), null);
  });

  test('builds from a fixed set of elements only', () => {
    const tags = new Set();
    const walk = (nodes) =>
      nodes.forEach((node) => {
        if (typeof node !== 'string') {
          tags.add(node.tag);
          walk(node.children);
        }
      });
    walk(
      markdownTree(
        '# h\n\n> q\n\n- a\n1. b\n\n```\nc\n```\n\n| x |\n| - |\n| y |\n\n---\n\n' +
          '**s** *e* ~~d~~ `c` [l](https://x.org/) [1]\nbr <iframe src=x></iframe> <svg onload=x>'
      )
    );
    const allowed = [
      ...['p', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'table'],
      ...['thead', 'tbody', 'tr', 'th', 'td', 'hr', 'br', 'strong', 'em', 'del', 'a', 'cite'],
    ];
    assert.deepEqual(
      [...tags].filter((tag) => !allowed.includes(tag)),
      []
    );
  });

  test('closes what a partly shown answer has opened on its last line', () => {
    assert.equal(closeOpenMarks('Intro\n1. **data-sh'), 'Intro\n1. **data-sh**');
    assert.equal(closeOpenMarks('Then **'), 'Then ');
    assert.equal(closeOpenMarks('Run `make'), 'Run `make`');
    assert.equal(closeOpenMarks('Run `'), 'Run ');
    assert.equal(closeOpenMarks('See [Priorities](https://docs.um'), 'See Priorities');
    assert.equal(closeOpenMarks('**done** and `code`'), '**done** and `code`');
    assert.equal(closeOpenMarks('```sh\nmake **'), '```sh\nmake **');
  });
});

/** A response whose body yields `chunks`, then ends, or with `open`, never does; it records a cancel. */
const streamed = (chunks, open = false) => {
  const encoder = new TextEncoder();
  const reads = { cancelled: false };
  let next = 0;
  const response = {
    body: {
      getReader: () => ({
        read: () =>
          next < chunks.length
            ? Promise.resolve({ done: false, value: encoder.encode(chunks[next++]) })
            : open
              ? new Promise(() => undefined)
              : Promise.resolve({ done: true }),
        cancel: () => {
          reads.cancelled = true;
          return Promise.resolve();
        },
      }),
    },
  };
  return { response, reads };
};

describe('answer stream', () => {
  test('reads events split across chunks, and reports every chunk', async () => {
    const { response } = streamed([
      'event: meta\ndata: {"exchangeId":"x1"}\n',
      '\nevent: delta\ndata: {"text":"Hi"}\n\n',
    ]);
    const events = [];
    let chunks = 0;
    await readEvents(
      response,
      (name, data) => {
        events.push([name, data]);
      },
      () => chunks++
    );
    assert.deepEqual(events, [
      ['meta', { exchangeId: 'x1' }],
      ['delta', { text: 'Hi' }],
    ]);
    assert.equal(chunks, 2);
  });

  test('stops at the event that ends the answer, though the server keeps the stream open', async () => {
    const { response, reads } = streamed(
      [
        'event: delta\ndata: {"text":"Hi"}\n\nevent: done\ndata: {}\n\n',
        'event: delta\ndata: {"text":"late"}\n\n',
      ],
      true
    );
    const names = [];
    await readEvents(response, (name) => {
      names.push(name);
      return name === 'done';
    });
    assert.deepEqual(names, ['delta', 'done']);
    assert.equal(reads.cancelled, true);
  });
});

describe('stall watchdog', () => {
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  test('aborts once the time passes without a kick', async () => {
    const controller = new AbortController();
    watchdog(controller, 10);
    await sleep(30);
    assert.equal(controller.signal.aborted, true);
  });

  test('starts the time again at each kick, and does nothing once stopped', async () => {
    const controller = new AbortController();
    const watch = watchdog(controller, 30);
    await sleep(20);
    watch.kick();
    await sleep(20);
    assert.equal(controller.signal.aborted, false);
    watch.stop();
    await sleep(40);
    assert.equal(controller.signal.aborted, false);
  });
});
