# Contributing

How to work on the toolkit and its theme, and how to release them. Every change reaches `main` through a reviewed
pull request: review there is the only gate before each site that moves to the next release.

## The stack

| Part | What |
| --- | --- |
| Package | Python 3.12 (3.11 or later), packaged with Hatchling; PyYAML and boto3 |
| Documentation engine | Material for MkDocs `9.7.7` on MkDocs `1.6.1`, hash-pinned in `requirements/build.txt`; Zensical `0.0.66` for the engine bake-off ([ADR-0003](https://github.com/umccr/docs-platform/blob/main/docs/design/adr/0003-build-engine.md)) |
| Diagrams | Mermaid `11.17.2`: the npm package's `dist/mermaid.min.js`, in the theme at `assets/umccr/mermaid/`, which Material's own diagram support draws with |
| Tests | pytest `9.1.1`; Node.js 22 or later (`.nvmrc`) with its own test runner for the theme's script |
| Lint and format | ruff `0.16.9` |
| Repository checks | pre-commit; detect-secrets `1.5.0`; actionlint and zizmor `1.30.1` for the workflows; `scripts/check-boundary.sh` |

## Set up

Python 3.12, Node.js 22 or later, and [pre-commit](https://pre-commit.com). The Makefile runs everything, with the
toolkit and its tools in a virtualenv, `.venv`.

| Command | Does |
| --- | --- |
| `make install` | `.venv` with the hash-pinned engine, the dev tools and the toolkit (editable); the pre-commit git hook |
| `make check` | ruff, actionlint and zizmor, and the pre-commit hooks on every tracked file |
| `make test` | pytest, with strict builds of the examples; then the theme script's tests with `node --test` |
| `make sites` | strict builds and pre-publish checks of the examples into `build/sites/`, as CI runs them |
| `make serve` | the basic example on `http://127.0.0.1:8000`, rebuilt as it changes; `CONFIG=` another `mkdocs.yml` |
| `make fix` | ruff's fixes and formatting |
| `make clean` | build output; the virtualenv stays |

To run a toolkit command yourself, use `.venv/bin/umccr-docs`, or `source .venv/bin/activate` first. `make install`
installs the toolkit editable, which reads the theme from the source tree, so a local build cannot show a file the
package leaves out. CI installs the wheel instead, as the site pipeline does
([2026-10-21](https://github.com/umccr/docs-platform/blob/main/docs/issues/2026-10-21-theme-script-missing-from-wheel.md)).

To see a change on a real site before it is released, run `umccr-docs serve` in that site's repository with this
virtualenv active. In umccr/docs-platform, `make toolkit TOOLKIT_REF=<commit>` installs any pushed commit of this
repository for its own `/platform/` site.

## Tests and CI

- **pytest** (`tests/`): the contract, preprocessing and the Obsidian adapter, export, the publisher, the package
  version, and strict builds of the examples.
- **node --test** (`tests/js/`): the chat panel's Markdown renderer, its reader for an answer's event stream and its
  stall watchdog, by running `umccr.js` in a VM, where it exports them instead of drawing a page.
- **CI** (`.github/workflows/ci.yml`), on every pull request and every push to `main`: "Tests and lint", "Theme
  script tests", "Strict builds of the examples", and "Workflows, secrets and information boundary". `main`'s ruleset
  should require all four ([Repository settings](#repository-settings)).
- **Release** (`.github/workflows/release.yml`), on every `v*` tag: the GitHub release ([Release](#release)).

## Conventions

- **This repository is public.** It holds generic code and documentation only: no account IDs, ARNs, bucket names,
  credentials or private content ([SECURITY.md](SECURITY.md)). `scripts/check-boundary.sh` and detect-secrets enforce
  part of this, in CI and in the pre-commit hook; reviewers enforce the rest.
- **Sites cannot run code.** Every site shares one browser origin, where the sign-in keeps its tokens. The theme and
  its one script are the platform's, and the contract (`contract.py`, `active_content.py`) and `verify-site` keep
  scripts, event handlers, frames and script URLs out of every page. A change to them is a security change; say so
  in the pull request.
- **Everything is pinned.** Python dependencies by hash (`requirements/*.txt`, regenerated with `uv pip compile` from
  the `.in` files), every third-party action by full commit SHA with its version in a comment, and the theme's copy
  of Mermaid by version.

## Change these together

| When you change | Also change |
| --- | --- |
| the version | `pyproject.toml` and `src/umccr_docs/__init__.py` together (a test compares them), and `CHANGELOG.md` |
| where the engine pins are, `requirements/build.txt` | in umccr/docs-platform, `INSTALL_TOOLKIT` in `infrastructure/toolchain/sites-pipeline.ts`, which must still install every release a site or a rollback may name, and the Makefile's `toolkit` target |
| the theme's scripts | keep `artifacts` in `pyproject.toml`; `verify-site` refuses a site that lacks one (`THEME_FILES` in `verify.py`) |
| the theme's copy of Mermaid | its version in [The stack](#the-stack) and `CHANGELOG.md`; its folder stays excluded from the large-file and whitespace hooks in `.pre-commit-config.yaml`, which would rewrite it |
| the slug rules in `slug.py` | `MAX_SLUG_LENGTH` and `RESERVED_SLUGS` in umccr/docs-platform's `infrastructure/sites.ts` |
| a CI job's name | the checks `main`'s ruleset requires |

## Update pinned dependencies

- **Engine and runtime**: edit `requirements/build.in` and regenerate `requirements/build.txt` with the command at
  the top of the file. The hashes change with it.
- **Test and lint tools**: `requirements/dev.in` and `requirements/dev.txt`, the same way.
- **Actions**: every third-party action is pinned to a full commit SHA with its version in a comment. Update both.
- **Mermaid**: the theme's copy, `src/umccr_docs/theme/assets/umccr/mermaid/`, is the `mermaid` package's
  `dist/mermaid.min.js` and `LICENSE`, byte for byte. Take the newest release of the major version Material for
  MkDocs loads (Material 9.7.7 asks for `mermaid@11`) that is at least two weeks old. Check the tarball's SHA-512
  against `dist.integrity` from `https://registry.npmjs.org/mermaid/<version>` before copying the two files in (the
  licence as `LICENSE.txt`). Then check a page with each kind of diagram the sites use, in dev, in both colour
  schemes.
- The build engine decision and the MkDocs 1.x pin are recorded in docs-platform's
  [ADR-0003](https://github.com/umccr/docs-platform/blob/main/docs/design/adr/0003-build-engine.md).

## Release

A release is a tag on `main` and the GitHub release the release workflow makes for it. It changes no site: the site
registry in umccr/docs-platform moves sites to it afterwards, one at a time or together.

### 1. Prepare the release

Make sure `main` is green. On a branch off `main`, such as `release/v0.4.0`, change:

| File | Change |
| --- | --- |
| `pyproject.toml`, `src/umccr_docs/__init__.py` | the version, `0.4.0`; `tests/test_version.py` checks that they agree |
| `CHANGELOG.md` | `## Unreleased` becomes `## v0.4.0`, opening with what the release changes for sites: the release's notes are this section |

Run `make check`, `make test` and `make sites`, then open the pull request.

### 2. Merge and tag

Tag the merge commit as soon as it is on `main`. Only the platform owners can create `v*` tags
([repository settings](#repository-settings)).

```sh
git switch main && git pull --ff-only     # HEAD is the merge commit
git tag -s v0.4.0 -m "v0.4.0"             # -a instead of -s without a signing key
git push origin v0.4.0
```

### 3. Check the GitHub release

The release workflow checks that the tag is the package version with a `v` in front, takes the notes from the tag's
section of `CHANGELOG.md`, and creates the release. A tag with a `-`, such as `v0.4.0-rc.1`, makes a pre-release,
and its package version is written the same way, `0.4.0-rc.1`. With release immutability on, the release locks the
tag to its commit. A tag the workflow refuses has no release, and cannot be moved: fix the cause on `main`, and
release the next patch version.

### 4. Move the sites

In umccr/docs-platform: [move sites to a toolkit release](https://github.com/umccr/docs-platform/blob/main/docs/site/runbook.md#move-sites-to-a-toolkit-release),
which changes `DOCS_TOOLKIT_REF` and any site's own `toolkitRef`, then rebuilds the sites that should not wait for
their next push.

## Versioning

- Releases are semantic versions, `vMAJOR.MINOR.PATCH`, and the package version is the tag without its `v`.
- Until `v1.0.0` the toolkit is in initial development, `0.y.z`: the authoring contract and the engine
  ([ADR-0003](https://github.com/umccr/docs-platform/blob/main/docs/design/adr/0003-build-engine.md)) can still
  change. A change that could break an existing site, such as a contract rule, a removed extension or an engine
  change, takes the next minor version (`v0.4.0`) and a migration note; fixes and compatible additions take the next
  patch (`v0.3.2`).
- `v1.0.0` comes once the engine is decided, the first users' feedback is in, and a team outside the platform team
  depends on the contract with a site of its own. From then on, a breaking change needs a new major version.
- docs-platform's registry takes a release tag or a full commit SHA as a site's `toolkitRef`, never a branch, whose
  next merge would change how the site builds without a registry change.

## Repository settings

An organisation owner sets these:

- **Rulesets**, under **Settings → Rules → Rulesets**:
  - **`main`**: require a pull request with one approval, and the `ci` checks to pass ("Tests and lint", "Theme
    script tests", "Strict builds of the examples", "Workflows, secrets and information boundary"); block force
    pushes and deletion.
  - **`v*` tags**: only the platform owners may create them, and nobody may update or delete one: a moved tag would
    change how sites build without a registry change.
- **Release immutability**, under **Settings → General → Releases**, before the first release: each release then
  locks its tag. It covers only releases made after it is on.
- **Code owners**, later: once the owners' team is named, add `.github/CODEOWNERS` with `* @umccr/<team>`, and
  require their review on `main` too.
- **Secret scanning, push protection and Dependabot alerts**, and private vulnerability reporting.
