# Questions

Short answers to common questions about docs-toolkit, each with a link to the detail.

## Using the toolkit

### How do I install it to preview my site?

Install the release your site builds with, the latest unless its registry entry pins one, then run `umccr-docs serve`
beside your `mkdocs.yml`:

```sh
git clone --branch v0.3.2 https://github.com/umccr/docs-toolkit.git   # the latest release on 2026-11-19
python3.12 -m venv .venv && source .venv/bin/activate
pip install --require-hashes --no-deps -r docs-toolkit/requirements/build.txt
pip install --no-deps ./docs-toolkit
```

`curl -fsS -o /dev/null -w '%{redirect_url}\n' https://github.com/umccr/docs-toolkit/releases/latest` prints the
latest release.

### Why does `check` reject a key in my `mkdocs.yml`?

The platform owns the theme, the extensions, the scripts and the output, so a site sets content keys only. The message
names the key ([Checks and errors](checks.md#the-contract)).

### Can my site add JavaScript, analytics or an iframe?

No. Every site shares one origin, which holds the reader's sign-in tokens. HTML inside a code block or inline code is
fine: it is shown, not run.

### Why does my local preview differ from CI?

The toolkit builds every file git would commit, including new files not committed yet, and skips ignored files and
dotfiles. CI has only what was pushed.

### Why does my Mermaid diagram show as text?

It does not parse, and the browser's console says why. No build check catches it, so preview with
`umccr-docs serve`.

### Why does an image from another site not show?

The Content Security Policy loads images only from docs.umccr.org. Copy the image into `docs_dir`.

### How do I link to a file outside `docs_dir`?

Write a relative link, such as `[README](../README.md)`. The build points it at the file on GitHub.

### Does a wikilink to a missing note fail the build?

No. It warns, and the link shows as `[[text]]`. Ambiguous links, embeds and block references do fail
([Checks and errors](checks.md#obsidian-vaults)).

## Releases and tags

### How do I release a new version?

Set the version in `pyproject.toml` and `src/umccr_docs/__init__.py`, rename `## Unreleased` in `CHANGELOG.md` to the
new version, merge, and push a `vX.Y.Z` tag on the merge commit ([Runbook](runbook.md#release)).

### Which release does a site build with, and when does it move?

The one its `toolkitRef` names: `latest` by default, resolved when each site release starts, or a pinned tag or
commit. An unpinned site moves at its next push ([Runbook](runbook.md#how-a-site-chooses-its-release)).

### Why is my release not marked Latest?

A higher version is already released, or the tag has a suffix, which makes it a pre-release
([Runbook](runbook.md#which-release-is-latest)).

### How do I hold a site back, or roll a release back?

Pin the site's `toolkitRef` in docs-platform to hold it back. Mark the previous release Latest to move every unpinned
site back at its next push ([Runbook](runbook.md#roll-back-a-release)).

### Can I move or delete a tag?

No: sites build with tags. Fix the cause on `main` and release the next patch.

### Which release built a site?

The site pipeline run's `TOOLKIT_REF`, and its Build log line `umccr-docs <version>`.

## How it works

### What does `export-kb` produce?

A Markdown file and a `.metadata.json` per published page, which OrcaSonar indexes for the chat panel
([Structure](structure.md#from-source-to-published-site)).

### Can one site's build write to another site?

No. The build has no write access, and `publish` narrows the publisher role to the site's own prefixes
([Structure](structure.md#aws-resources)).

### What is specific to docs.umccr.org?

The origin and slug rules, the theme and its branding, the S3 layout, the SSM parameters, the publisher role, the
links in exported documents, and the theme script's account menu, catalogue and chat panel
([Product](product.md#open-items)).
