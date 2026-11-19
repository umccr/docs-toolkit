# Checks and errors

Every check `umccr-docs` runs, the message it prints when a check fails, and the fix, as of `v0.3.2`. Search for the
words in your message: placeholders such as `<page>` and `<slug>` stand for the values it names. Authors read the rules
themselves in docs-platform's [Authoring](https://github.com/umccr/docs-platform/blob/main/docs/site/authoring.md)
page.

## How problems are reported

A failure prints `error:`, what failed, and one problem per line, then exits with status 1. `check` lists every problem
in one run:

```text
error: mkdocs.yml does not meet the docs.umccr.org contract:
  - 'theme' is set by the platform and may not appear in mkdocs.yml
  - plugin 'mermaid2' is not supported; allowed: search, tags
  - docs/bad.md:3: a <script> element is not allowed
  - docs/bad.md:5: an HTML event handler attribute is not allowed
```

Warnings start `warning:` and do not fail. A mistyped option exits with status 2, and an AWS error in `publish`, such
as `AccessDenied`, prints a traceback.

| Command | Checks |
| --- | --- |
| `check` | the configuration and the contract |
| `build` | the configuration, the contract, preprocessing and the engine's strict build; `--no-strict` makes the last two warn |
| `serve` | the configuration and the contract; preprocessing and the engine only warn |
| `export-kb` | the configuration, the contract, strict preprocessing and `exclude_docs` |
| `verify-site` | the built site |
| `publish` | its arguments, the bucket, the live site release, the documents, then the site |

In the site pipeline, any of these stops the site release at Build or publish, and the live site stays as it was.

## Configuration

| Message | Fix |
| --- | --- |
| `<path> does not exist` | run where `mkdocs.yml` is, or pass `--config` |
| `mkdocs.yml is not plain YAML: <error>. Custom tags such as !ENV and !!python/name are not supported.` | fix the YAML, and write values instead of tags |
| `mkdocs.yml must be a mapping`, `docs_dir must be a path` | use `key: value` pairs, and a path for `docs_dir` |
| `extra.platform.<setting> must be ...` | `source_format` is `markdown` or `obsidian`, `engine` is `mkdocs` or `zensical`, `home` a path, `properties` and `obsidian.prefer_folders` lists of strings, `obsidian.sort_orders` a property mapped to a list |
| `Pass --slug, or set site_url to https://docs.umccr.org/<slug>/` | set `site_url` |

## The contract

| Message | Cause and fix |
| --- | --- |
| `Slug '<slug>' must be lowercase letters, digits and inner hyphens, at most 49 characters`, `Slug 'sites' is reserved` | choose a valid slug; it must match the site's registry entry |
| `site_url must be https://docs.umccr.org/<slug>/ (found '<value>')` | set it exactly, with the trailing slash |
| `'<key>' is set by the platform and may not appear in mkdocs.yml` | remove the key, such as `theme`, `markdown_extensions`, `extra_javascript` or `hooks` |
| `use_directory_urls must stay true: the edge serves <page>/index.html` | remove the setting |
| `plugin '<name>' is not supported; allowed: search, tags` | remove the plugin |
| `extra_css entry '<value>' must be a stylesheet inside docs_dir` | copy the stylesheet into `docs_dir` and name its path |
| `'extra.<key>' is set by the platform and may not appear in mkdocs.yml` | remove `extra.polyfills`, `extra.analytics` or `extra.consent`, which add scripts |
| `mkdocs.yml: <where>: <description> is not allowed` | a configuration value or `nav` title, at `<where>` such as `nav[0].Home`, holds markup that could run |
| `docs_dir <path> is outside the repository`, `docs_dir <path> does not exist` | point `docs_dir` at a folder inside the repository |
| `<file> is a symlink leading outside the repository` | copy the file in instead |
| `<docs>/<file>: assets/javascripts/ and assets/umccr/ hold the platform theme's scripts` | move the file to another folder |
| `<docs>/<file>: must be UTF-8 text without NUL characters: it is served, and checked, as UTF-8` | save the HTML, SVG or XML file as UTF-8 |
| `<docs>/<file>: <description> is not allowed` | an HTML, SVG or XML file holds code that could run; readers can open it directly |
| `<docs>/<page>.md:<line>: <description> is not allowed` | markup at that line, outside code |
| `<docs>/<page>.md: the rendered page has <description>, which is not allowed` | markup only the rendered page has: from an attribute list, an entity, front matter or a vault's properties |

`<docs>` is the name of `docs_dir`. To show markup on a page, put it in a code block or inline code, which is shown and
never run.

### What could run code

| Description | Found in |
| --- | --- |
| `a <script> element` | `<script>`, in HTML or SVG |
| `an HTML event handler attribute` | `onclick=`, `onerror=` and the like, in HTML or an attribute list (`{ onclick=... }`), or set by an SVG animation |
| `an embedded frame or object` | `<iframe>`, `<frame>`, `<frameset>`, `<object>`, `<embed>` or `<applet>` |
| `a javascript: URL` | an address starting `javascript:` or `vbscript:`, even after spaces |
| `a <base> element` | `<base>`, which redirects every relative link |
| `an XML stylesheet`, `an XML entity declaration` | `<?xml-stylesheet ...?>` and `<!ENTITY ...>` in XML or SVG |

The scanner reads comments, CDATA and `<style>` contents as markup too, so a handler inside an HTML comment is still
reported.

## Preprocessing

Listed under `<n> problem(s) in <docs_dir>:`, where `<page>` is a path inside `docs_dir`. `--no-strict` makes them
warnings.

| Message | Fix |
| --- | --- |
| `<page>: link <url> leaves docs_dir; set repo_url so it can point at the repository` | set `repo_url`; the link then points at the file on GitHub |
| `<page>: link <url> leaves the repository` | link to the file's address instead |
| `<page>: image <url> is outside docs_dir; move it inside so it is published` | move the image into `docs_dir` |
| `extra.platform.home: <home> is not in docs_dir` | correct `home`, as a path inside `docs_dir` |
| `docs_dir has both index.md and the home note <home>; keep one` | remove one of them |

A link that leaves `docs_dir` goes to `<repo_url>/blob/<branch>/<path>`, with the branch from `edit_uri`, or `main`.
Nothing checks that the file exists there.

## Obsidian vaults

| Message | Fix |
| --- | --- |
| `<note>:<line>: [[<target>]] does not match any note` | a warning: the link shows as text until the note exists. For a front matter link, `<note>: frontmatter [[<target>]] ...` |
| `<note>:<line>: [[<target>]] is ambiguous: it matches <a>, <b>` | write `[[folder/note]]`, or set `prefer_folders` |
| `<note>:<line>: embeds (![[<target>]]) are not supported` | link to the note or image instead |
| `<note>:<line>: [[<target>#^<block>]]: block references are not supported` | link to the heading instead |
| `<note>: frontmatter is not valid YAML (<error>)` | fix the YAML between the `---` lines |
| `<note>:<line>: Bases block: <reason>`, `<note>:<line>: Tasks block: <reason>` | keep the block within the subset below; the reason names what is outside it |

A Bases or Tasks block inside a list or a callout stays a code sample.

- **Bases blocks** support `filters` with `and`, `or` and `not`; `==`, `!=`, `.contains(...)`, `link("note")` and
  `file.inFolder("Folder")`; `this.file.name`, `this.file.path`, `this.file.folder` and `this.<property>`; and `table`
  views with `name`, `filters`, `order`, `sort` and `limit`, plus `properties.<name>.displayName`. Reasons include
  `view type '<type>' is not supported; use table` and `filter expression '<expression>' is not supported`.
- **Tasks blocks** support `done` and `not done`; `includes` and `regex matches` filters, and their negations, on the
  description, path, folder, file name and heading; date filters; `AND`, `OR`, `XOR` and `NOT` with parentheses; and
  `sort by`, `group by`, `limit`, `short mode`, `hide` and `show`. Reasons include `'<line>' is not supported` and
  `'<line>': placeholders are not supported; write the value instead`.

## The engine's strict build

The engine's warnings stop a strict build:

```text
WARNING -  Doc file 'index.md' contains a link 'nowhere.md', but the target is not found among documentation files.
WARNING -  Doc file 'index.md' contains a link 'other.md#no-such-heading', but the doc 'other.md' does not contain an anchor '#no-such-heading'.
WARNING -  A reference to 'missing.md' is included in the 'nav' configuration, which is not found in the documentation files.
Aborted with 3 warnings in strict mode!
error: mkdocs build failed (exit 1); see the output above
```

Fix the link, the anchor or the `nav` entry. A missing anchor is only a warning when `mkdocs.yml` sets
`validation: anchors: warn`, and anchors follow GitHub's rule: lowercase, hyphens for spaces, punctuation dropped.
Pages appear as the engine sees them, so a home note shows as `index.md`. The list of pages missing from `nav`, and
Material's box about MkDocs 2.0, are notices.

## The built site: verify-site

Listed under `<dir> is not safe to publish:`; a clean site prints `<dir> passed the pre-publish checks`.

| Message | Fix |
| --- | --- |
| `index.html is missing from the site root`, `404.html is missing from the site root` | add `index.md`, or set `extra.platform.home` |
| `assets/umccr/<file> is missing: the toolkit was installed without part of its theme` | reinstall a release; in this repository, check `artifacts` in `pyproject.toml` |
| `<file>: hidden files are not published`, `<file>: symlinks are not published` | remove the dotfile or symlink |
| `<file>: this kind of file must not be published` | remove the source map, key or certificate, Terraform state, database, or file named like a credential |
| `<file>: <n> MB is over the 25 MB limit`, `the site is <n> MB, over the 500 MB limit` | remove or shrink large files |
| `<file>: looks like it contains <what>` | remove the text that looks like an AWS key, a GitHub or Slack token or a private key, and rotate it if it is real |
| `<file>: <description> is not allowed` | see [What could run code](#what-could-run-code); HTML pages may carry the theme's scripts only |

## Export and publishing

| Message | Fix |
| --- | --- |
| `exclude_docs must be a multi-line string of gitignore patterns, as MkDocs expects` | write the patterns one per line in a YAML block string; the same goes for `draft_docs` |
| `Pass --bucket, or --role-arn to publish as the stage's docs-publisher role` | give one of them |
| `'<arn>' is not a role ARN` | correct `--role-arn` |
| `/docs/content-bucket-name is missing here; deploy the hosting stack first` | use the right account, or deploy docs-platform's hosting stack there |
| `<dir> has no index.html; refusing to publish an empty or partial site` | publish the directory `build` wrote |
| `The site must not contain _publish.json; the publisher writes it` | rename that file |
| `Publishing would delete <n> of the <m> objects under sites/<slug>/. If that is intended (for example a restructure), rerun with --allow-mass-delete.` | check the build; for a deliberate restructure, the platform team reruns with `--allow-mass-delete`. The same guard covers documents under `docs/<slug>/` |
| `<dir> has no documents; refusing to empty docs/<slug>/`, `<dir> is not a directory; run umccr-docs export-kb first` | run `export-kb`, and check its output |
| `Some stale objects could not be deleted` | check the role's permissions, then publish again |

Two messages are not failures. `Skipping release <n> of <slug>: release <m> is already live` means a newer site release
is live, so nothing is published. `warning: /orcasonar/ingest-bucket-name does not exist in this account, ...` means
OrcaSonar is not deployed in that stage, so the pages publish without documents.

## What no check catches

- **Mermaid diagrams**, which are drawn in the browser: one that does not parse shows as text, with the reason in the
  browser's console. Preview with `umccr-docs serve`.
- **Images from other sites**, which the Content Security Policy blocks. Put images in `docs_dir`.
- **Links to headings**, unless `validation: anchors: warn` is set, and links that leave `docs_dir`.
- **What is fit to publish:** every signed-in UMCCR reader can read every site, and the chat panel can quote it.
