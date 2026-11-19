# Tech stack and conventions

What docs-toolkit is built with, how it is tested, and the conventions for changing it. Versions are those pinned on
`main` for `v0.3.2`. What the toolkit is for is in [Product](product.md), and how it is laid out in
[Structure](structure.md).

## The stack

| Part | What |
| --- | --- |
| Language | Python 3.12, as CI and the site pipeline use; the package requires 3.11 or later |
| Packaging | Hatchling, with the theme's scripts listed as wheel `artifacts` |
| Dependencies | PyYAML and boto3, pinned at `6.0.3` and `1.43.104` |
| Engine | MkDocs `1.6.1`, Material for MkDocs `9.7.7`, Python-Markdown `3.11`, pymdown-extensions `12.1` and Pygments `2.21.0`: 33 packages in `requirements/build.txt` |
| Candidate engine | Zensical `0.0.66`, in `requirements/zensical.txt` |
| Diagrams | Mermaid `11.17.2`, bundled in the theme |
| Theme | Jinja2 template overrides, one stylesheet and one script with no dependencies; Octicons for icons |
| Tests | pytest `9.1.1`; Node.js 22 or later with `node --test` for the theme's script |
| Lint and format | ruff `0.16.9`, rules E, F, W, I, B, UP, S and SIM, 120 columns |
| Pins | `uv pip compile --generate-hashes --python-version 3.12 --universal` |
| Repository checks | pre-commit `4.7.0`, with pre-commit-hooks `6.0.0`, detect-secrets `1.5.0`, actionlint `1.7.12` and zizmor `1.30.1` |
| CI | GitHub Actions, each action pinned by commit; the `gh` CLI for releases |

`pyproject.toml` declares only PyYAML and boto3. MkDocs, Python-Markdown, pymdown-extensions and pathspec, which the
package also imports, come from `requirements/build.txt`, installed everywhere with `--require-hashes --no-deps`.

## The engine

Material for MkDocs has been in maintenance mode since November 2025, and MkDocs 2.0 drops plugins and theming with no
migration path, so the toolkit stays on MkDocs 1.6 while Zensical is evaluated
([ADR-0003](https://github.com/umccr/docs-platform/blob/main/docs/design/adr/0003-build-engine.md)). The box Material
prints about it at the start of each build is a notice, not a failure. Preprocessing runs before the engine, and the
templates avoid Jinja2's string methods, which Zensical's MiniJinja lacks, so either engine builds the same sites. To
try Zensical, install `requirements/zensical.txt` into the toolkit's virtualenv and pass `--engine zensical`; the site
pipeline never installs it.

The engine builds from `.umccr-docs/mkdocs.yml`, never from the site's own file:

| Setting | Value |
| --- | --- |
| the site's allowed keys | passed through; an `edit_uri` of `edit/...` becomes `blob/...`, so the GitHub link opens the file |
| `docs_dir`, `site_dir`, `use_directory_urls` | `docs`, `site` and `true`, inside the work directory |
| `theme` | Material with the theme as `custom_dir`, system fonts, Octicons, and light and dark schemes |
| `extra_css`, `extra_javascript` | the theme's stylesheet, then the site's; the theme's script alone |
| `plugins` | `search`, and `tags` if the site asks for it |
| `extra` | the site's, plus `homepage: /platform/` and `umccr`: the slug, the home note and the provenance, for the theme |

Two values are Python objects, GitHub-style heading anchors and the Mermaid fence, written as YAML Python tags. A
site's own `mkdocs.yml` cannot use such tags: the toolkit reads it with `yaml.safe_load`.

## Markdown extensions and theme features

Every site gets `abbr`, `admonition`, `attr_list`, `def_list`, `footnotes`, `md_in_html`, `tables` and `toc` (heading
permalinks with GitHub-style anchors), and pymdownx's `details`, `highlight` (a header naming each code block's
language, `terminal` for shell), `inlinehilite`, `keys`, `magiclink` (bare URLs as links), `mark`, `superfences`
(including Mermaid), `tabbed` and `tasklist`. `pymdownx.snippets` is left out on purpose: it can include any file of
the repository into a page.

Material's features: copy buttons on code, section index pages, instant navigation, breadcrumbs, back to top, address
tracking, search highlighting and suggestions, and "On this page" following the reader.

## How the checks work

| Technique | Why |
| --- | --- |
| Pages are rendered with the engine's own extensions, then scanned | attribute lists, entities and front matter reach the page, not the source |
| A second scan of the source, with code blanked out | gives the line; a finding the rendered page lacks is dropped |
| An HTML parser that reads comments, CDATA and `<style>` as markup too | SVG and MathML parse them; a false alarm beats a missed script |
| Documents decoded as strict UTF-8 | a loosely decoded UTF-16 file could hide a script from the scan |
| One content-type table, ignoring the host's `mime.types` | the publisher, the contract and `verify-site` agree on every machine |
| `git ls-files` to choose the files | a local preview matches what CI has |
| A session policy on every publish | a misbehaving build cannot reach another site |

## Tests and CI

| In `tests/` | Covers |
| --- | --- |
| `test_contract.py`, `test_active_content.py` | the contract and the markup scanner |
| `test_preprocess.py`, `test_obsidian.py`, `test_markdown.py` | preprocessing, the Obsidian adapter and the Markdown helpers |
| `test_build_and_verify.py` | strict builds of both examples, the effective configuration, `verify-site` |
| `test_export_kb.py`, `test_publish.py` | the export, and publishing against a fake S3 |
| `test_version.py` | the two version strings agree |
| `js/chat-markdown.test.mjs` | the chat panel's Markdown renderer, event-stream reader and stall watchdog |

On 2026-11-19, pytest runs 323 cases and Node's test runner 14 tests. CI runs four jobs on every pull request and push
to `main`:

| Job | Runs |
| --- | --- |
| Tests and lint | ruff and pytest, with the package installed from its wheel |
| Theme script tests | `node --test tests/js/*.test.mjs` |
| Strict builds of the examples | `check`, `build` and `verify-site` for both examples, from the wheel |
| Workflows and secrets | every pre-commit hook but ruff |

CI installs the wheel rather than an editable checkout, so a file the package leaves out fails there and not on a site
([2026-10-21](https://github.com/umccr/docs-platform/blob/main/docs/issues/2026-10-21-theme-script-missing-from-wheel.md)).

## Commands

| Command | Does |
| --- | --- |
| `make install` | `.venv` with the engine, the dev tools and the toolkit (editable), and the pre-commit git hook |
| `make check` | ruff, then every pre-commit hook on every tracked file |
| `make fix` | ruff's fixes and formatting |
| `make test` | pytest, then the theme script's tests |
| `make sites` | `check`, a strict `build` and `verify-site` for both examples, into `build/sites/` |
| `make serve` | the basic example on `http://127.0.0.1:8000`; `CONFIG=` names another `mkdocs.yml` |
| `make clean` | build output and work directories; `.venv` stays |

## Conventions

- **The repository is public:** no credentials or private content
  ([SECURITY.md](https://github.com/umccr/docs-toolkit/blob/main/SECURITY.md)).
- **Security changes say so.** A pull request that changes `contract.py`, `active_content.py`, `verify.py`,
  `media_types.py` or the theme's script says it is a security change.
- **Releases reach the sites.** A change that needs sites to change ships as a pre-release first.
- **Everything is pinned:** dependencies by hash, hooks and actions by commit with the version in a comment.
- **Author errors are `DocsError`.** Messages name the file and line and say what to do, and `check` reports them all
  in one run.
- **Markdown rewriting goes through `markdown.py`,** which leaves code alone.
- **British English** in messages and documentation.

## Change these together

| When you change | Also change |
| --- | --- |
| the version | `pyproject.toml`, `src/umccr_docs/__init__.py` and `CHANGELOG.md` |
| where the engine pins live | `INSTALL_TOOLKIT` in docs-platform's `sites-pipeline.ts`, which must still install every release a site may name, and its CI's "Install the toolkit" step |
| a command, an option, `UMCCR_DOCS_SOURCE_REPO` or `UMCCR_DOCS_COMMIT` | docs-platform's pipeline commands and CI. They run every release a site may pin, so keep the old ones working |
| the theme's scripts | `artifacts` in `pyproject.toml`, and `THEME_FILES` in `build.py` |
| the copy of Mermaid | its version in `CONTRIBUTING.md`, `CHANGELOG.md` and [The stack](#the-stack); its folder stays excluded from the whitespace and large-file hooks |
| the slug rules | `MAX_SLUG_LENGTH` and `RESERVED_SLUGS` in docs-platform's `infrastructure/sites.ts` |
| SSM names, S3 prefixes or the session policy | docs-platform's hosting stack, and OrcaSonar's stateful stack |
| document metadata or `doc_id` | OrcaSonar, which filters on `site` and cites `doc_id` |
| the paths the theme calls | docs-platform's sign-in page, catalogue data and Content Security Policy, and OrcaSonar's API |
| a contract rule or a message | docs-platform's [Authoring](https://github.com/umccr/docs-platform/blob/main/docs/site/authoring.md) page and [Checks and errors](checks.md) |
| a CI job's name | the checks `main`'s ruleset requires |

## Deliberate, though it can look wrong

- **Not on PyPI.** Git tags serve users who install from git, without an account and a publishing workflow to keep.
- **MkDocs 1.6, not 2.0.** 2.0 breaks plugins and theming.
- **Untracked files are built.** A preview shows a new page before it is committed; a hand publish builds from a clean
  `git archive` instead.
- **The theme's scripts are Hatch `artifacts`.** A wheel once shipped without `umccr.js`, and every page lost its
  catalogue, account menu and chat panel.
- **No `aws s3 sync --delete`.** It never deletes files excluded by a filter, which would leave removed pages online.
- **The release check is not a lock.** Two publishes of one site must not overlap, so the site pipeline runs one site
  release at a time.
- **A wikilink to a missing note only warns.** One unwritten note should not stop a site from publishing.
- **A 3.6 MB Mermaid bundle is committed.** The Content Security Policy blocks the copy Material would load from a CDN.
- **`serve` polls the source every second.** The engine watches the work directory, so the toolkit re-runs
  preprocessing into it.
