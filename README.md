# docs-toolkit

`umccr-docs`, the toolkit that checks, builds, exports and publishes every site on
[docs.umccr.org](https://docs.umccr.org), and the theme they share. It builds a repository's Markdown, or an Obsidian
vault, into a strict Material for MkDocs site with the UMCCR theme, and refuses anything that could run code on the
origin all the sites share.

> **Status:** 2026-11-19. The latest release is `v0.3.2`. The toolkit moved here from
> [umccr/docs-platform](https://github.com/umccr/docs-platform) on 2026-11-11, with its history and its tags from
> `v0.2.0` ([ADR-0010](https://github.com/umccr/docs-platform/blob/main/docs/design/adr/0010-toolkit-repository.md)).
> It is still specific to docs.umccr.org: its address, theme and publishing target are built in.

## Install

Releases are git tags, `vX.Y.Z`; nothing is published to PyPI. Install one as the site pipeline does, the engine from
the release's hash-pinned requirements and then the package:

```sh
git clone --branch v0.3.2 https://github.com/umccr/docs-toolkit.git
python3.12 -m venv .venv && source .venv/bin/activate
pip install --require-hashes --no-deps -r docs-toolkit/requirements/build.txt
pip install --no-deps ./docs-toolkit
```

Python 3.11 or later; the pins are resolved for 3.12.

## Use

From the folder that holds a site's `mkdocs.yml`:

| Command | Does |
| --- | --- |
| `umccr-docs check` | checks `mkdocs.yml` and the pages against the contract: what a site may contain |
| `umccr-docs build` | checks, preprocesses (Obsidian syntax, links that leave `docs_dir`) and builds strictly into `site/` |
| `umccr-docs serve` | the same build on `http://127.0.0.1:8000`, rebuilt as pages change |
| `umccr-docs verify-site <dir>` | checks a built site before it is published |
| `umccr-docs export-kb` | exports the pages as documents for OrcaSonar, the chat panel's search and answer service |
| `umccr-docs publish <dir>` | uploads a built site to its prefix in the docs bucket; the site pipeline runs it |

`--config` names another `mkdocs.yml`, and `--slug` gives the slug when `site_url` is not
`https://docs.umccr.org/<slug>/`. `umccr-docs <command> --help` lists every option. Site owners start from the
[templates](templates/) and docs-platform's
[Onboarding](https://github.com/umccr/docs-platform/blob/main/docs/site/onboarding.md) and
[Authoring](https://github.com/umccr/docs-platform/blob/main/docs/site/authoring.md) pages.

## How docs.umccr.org uses it

Every site builds with this repository's latest release, unless docs-platform's site registry pins a tag or a commit
(`toolkitRef`, [ADR-0011](https://github.com/umccr/docs-platform/blob/main/docs/design/adr/0011-latest-toolkit-release.md)).
The site pipeline installs the release as above, runs `check`, `build`, `verify-site` and `export-kb` with no write
access, then `publish` in each stage. A release here therefore reaches every site that pins none at its next push,
with no change in docs-platform.

## Documentation

[docs/](docs/product.md) is the toolkit's documentation, with `mkdocs.yml` at the root as its site configuration:

| Page | Covers |
| --- | --- |
| [Product](docs/product.md) | what the toolkit does, who uses it, where it stands, and its vocabulary |
| [Structure](docs/structure.md) | the repository, the modules, the theme, build outputs, and the resources the toolkit uses |
| [Tech stack](docs/tech.md) | versions, the engine, tests and CI, conventions, and what to change together |
| [Runbook](docs/runbook.md) | developing, updating pins, releasing, the tag system and rolling back |
| [Checks and errors](docs/checks.md) | each check's message and its fix |
| [Questions](docs/faq.md) | short answers, with links to the detail |

## Development

`make install`, then `make check`, `make test` and `make sites` before pushing; CI runs the same.
[CONTRIBUTING.md](CONTRIBUTING.md) has the setup, the conventions, and how to update the pins and release.

## Licence

MIT: see [LICENSE](LICENSE). The theme's copy of Mermaid is MIT too, with its licence beside it in
`src/umccr_docs/theme/assets/umccr/mermaid/`. To report a vulnerability, see [SECURITY.md](SECURITY.md).
