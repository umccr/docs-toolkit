# Changelog

All notable changes to `umccr-docs`, the toolkit, and its theme. A site picks a release up when its entry in the site
registry in umccr/docs-platform (`toolkitRef`) moves to it. Each release's notes on GitHub are its section here.

Releases up to `v0.3.1` were tagged in [umccr/docs-platform](https://github.com/umccr/docs-platform), and their notes
are in its [changelog](https://github.com/umccr/docs-platform/blob/main/docs/site/changelog.md). This repository has
the same history, and the tags from `v0.2.0` on the same files.

## v0.3.2

The first release from this repository, and a patch release: no site needs a change. Bases blocks can filter on the
note they are in, `this`, as in Obsidian: a domain note lists the projects that link to it with
`domains.contains(link(this.file.name))`. The knowledgebase's domain notes do, and its builds stopped on them. A view's
own `filters` work too. No other page changes.

- `this.file.name`, `this.file.path`, `this.file.folder` and `this.<property>` are the block's own note: a value
  (`type == this.type`), a link target (`link(this.file.name)`, or `link(this.parent)` for a frontmatter link), or the
  property a filter tests. A `this` property with no single value, missing or a list, is reported as a problem rather
  than matching nothing.
- `link("Folder/note")` matches by the note's name, as frontmatter links already did, rather than never.
- A view's own `filters` narrow the block's, as in Obsidian. The build refused them as an unknown view option, though
  it meant to apply them.
- The example vault's domain note lists its projects through `this`, so the strict example build covers it.

The toolkit and its theme move to this repository, out of `toolkit/` in umccr/docs-platform
([ADR-0010](https://github.com/umccr/docs-platform/blob/main/docs/design/adr/0010-toolkit-repository.md)). The
package, its command and the theme are the same.

- The repository's own CI, a release workflow that makes each tag's GitHub release, the MIT licence file the package
  already declared, and notes for contributors and on security.
- The theme script's tests, which docs-platform ran with jest, run with Node's own test runner (`tests/js/`), so the
  repository needs no npm packages.
- The examples link to this repository, and comments name the docs-platform pages and write-ups they mean.
- `uv.lock` and the package's `dev` extra are gone. Nothing used them, and the lock had drifted from the pins:
  `requirements/` holds the only ones.
