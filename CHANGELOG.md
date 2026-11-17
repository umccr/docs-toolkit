# Changelog

All notable changes to `umccr-docs`, the toolkit, and its theme. A site picks a release up when its entry in the site
registry in umccr/docs-platform (`toolkitRef`) moves to it. Each release's notes on GitHub are its section here.

Releases up to `v0.3.1` were tagged in [umccr/docs-platform](https://github.com/umccr/docs-platform), and their notes
are in its [changelog](https://github.com/umccr/docs-platform/blob/main/docs/site/changelog.md). This repository has
the same history, and the tags from `v0.2.0` on the same files.

## Unreleased

The toolkit and its theme move to this repository, out of `toolkit/` in umccr/docs-platform
([ADR-0010](https://github.com/umccr/docs-platform/blob/main/docs/design/adr/0010-toolkit-repository.md)). Nothing
changes for sites: the package, its command and the theme are the same, and so is every page they build.

- The repository's own CI, a release workflow that makes each tag's GitHub release, the MIT licence file the package
  already declared, and notes for contributors and on security.
- The theme script's tests, which docs-platform ran with jest, run with Node's own test runner (`tests/js/`), so the
  repository needs no npm packages.
- The examples link to this repository, and comments name the docs-platform pages and write-ups they mean.
- `uv.lock` and the package's `dev` extra are gone. Nothing used them, and the lock had drifted from the pins:
  `requirements/` holds the only ones.
