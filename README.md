# docs-toolkit

`umccr-docs`, the toolkit that checks, builds, exports and publishes every site on
[docs.umccr.org](https://docs.umccr.org), and the theme they share. It builds a repository's Markdown, or an Obsidian
vault, into a strict Material for MkDocs site with the UMCCR theme, and refuses anything that could run code on the
origin all the sites share.

> **Status:** 2026-11-11. Moved here from [umccr/docs-platform](https://github.com/umccr/docs-platform), which hosts
> docs.umccr.org and builds each site with a release of this repository
> ([ADR-0010](https://github.com/umccr/docs-platform/blob/main/docs/design/adr/0010-toolkit-repository.md)). Releases
> up to `v0.3.1` were tagged there; this repository has their history, and their tags from `v0.2.0`. The toolkit is
> still specific to docs.umccr.org: its address, theme and publishing target are built in.

## Install

Releases are git tags, `vX.Y.Z`; nothing is published to PyPI. Install one as the site pipeline does: the
documentation engine from the release's hash-pinned requirements, then the package from the same checkout.

```sh
git clone --branch v0.3.1 https://github.com/umccr/docs-toolkit.git
python3.12 -m venv .venv && source .venv/bin/activate
pip install --require-hashes --no-deps -r docs-toolkit/requirements/build.txt
pip install --no-deps ./docs-toolkit
```

Python 3.11 or later; the pins are resolved for 3.12, which the site pipeline uses.

## Use

From the root of a site's repository, where its `mkdocs.yml` is:

| Command | Does |
| --- | --- |
| `umccr-docs check` | checks `mkdocs.yml` and the Markdown against the contract: what a site may contain |
| `umccr-docs build` | checks, preprocesses (Obsidian syntax, links that leave `docs_dir`) and builds strictly into `site/` |
| `umccr-docs serve` | the same build on `http://127.0.0.1:8000`, rebuilt as pages change |
| `umccr-docs verify-site <dir>` | checks a built site before it is published |
| `umccr-docs export-kb` | exports the pages as documents for OrcaSonar, the chat panel's search and answer service |
| `umccr-docs publish <dir>` | uploads a built site to its prefix in the docs bucket; the site pipeline runs it |

`check`, `build`, `serve` and `export-kb` take `--config` for an `mkdocs.yml` elsewhere, and `--slug` when
`site_url` is not `https://docs.umccr.org/<slug>/`. `umccr-docs <command> --help` lists every option.

Site owners: [Onboarding a repository](https://github.com/umccr/docs-platform/blob/main/docs/site/onboarding.md) says
how to start a site, and [Authoring](https://github.com/umccr/docs-platform/blob/main/docs/site/authoring.md) what a
site may contain. The [templates](templates/) are the `mkdocs.yml` to start from.

## How docs.umccr.org uses it

The site registry in umccr/docs-platform pins the release each site builds with: `toolkitRef`, a release tag or a
full commit. For every release of a site, its site pipeline clones this repository at that ref, installs it as above,
and runs `check`, `build`, `verify-site` and `export-kb` with no write access, then `publish` in each stage. A release
here changes no site until the registry moves to it.

## Layout

```text
src/umccr_docs/     the package: the CLI, the contract, preprocessing and the Obsidian adapter, export, the publisher
  theme/            the theme: Material for MkDocs template overrides, umccr.css, umccr.js and a copy of Mermaid
requirements/       hash-pinned engine (build.txt), test and lint tools (dev.txt), Zensical for the engine bake-off
templates/          mkdocs.yml templates for a site's repository
examples/           synthetic sites CI builds strictly: plain Markdown and an Obsidian vault
tests/              pytest, with strict builds of the examples; js/ runs the theme script with Node's test runner
scripts/            check-boundary.sh, the public-repository information-boundary check
```

## Development

`make install`, then `make check`, `make test` and `make sites`. [CONTRIBUTING.md](CONTRIBUTING.md) has the setup,
the conventions, and how to update the pins and release.

## Licence

MIT: see [LICENSE](LICENSE). The theme's copy of Mermaid is MIT too, with its licence beside it in
`src/umccr_docs/theme/assets/umccr/mermaid/`. To report a vulnerability, see [SECURITY.md](SECURITY.md).
