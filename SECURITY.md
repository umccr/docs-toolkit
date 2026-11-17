# Security

## Reporting

If you find a vulnerability in the toolkit or its theme, or sensitive material committed here by mistake (a key, a
token, private documentation), report it to **services at umccr dot org** as soon as possible. Please do not
open a public issue.

For material committed by mistake, the platform team rotates the affected credential first and then removes it
from history. Deleting it in a later commit does not remove it from history.

## What this repository must never contain

This repository is public. It holds code and documentation, and synthetic examples. It must never contain:

- private documentation, generated sites, search indexes or build output from any site;
- credentials, tokens, signing keys, Cognito client secrets or identity-provider metadata with secrets;
- user data, access lists, logs, security findings or threat models.

AWS account IDs, ARNs, bucket names and other resource identifiers are not secrets, and may appear where they are
needed. The toolkit itself reads bucket names and role ARNs at run time, from SSM or its arguments.

Credentials are caught by detect-secrets and pre-commit's key checks, on each commit and in CI, and by GitHub secret
scanning and GitGuardian on each push; reviewers check the rest.

## What the toolkit enforces

Every site on docs.umccr.org shares one browser origin, where the sign-in page keeps the reader's tokens. So a site
must not be able to run code of its own: the theme and its one script are the platform's, `umccr-docs check` and
`build` refuse scripts, event handlers, frames and `javascript:` URLs in a site's Markdown, configuration and files,
and `verify-site` checks the built pages again. `publish`, as the site pipeline runs it, narrows the publisher role to
the release's own site with a session policy.

Sign-in, the edge checks and the pipelines belong to umccr/docs-platform; see its
[SECURITY.md](https://github.com/umccr/docs-platform/blob/main/SECURITY.md).
