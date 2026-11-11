# Security

## Reporting

If you find a vulnerability in the toolkit or its theme, or sensitive material committed here by mistake (a key, a
token, an account identifier, private documentation), report it to **services at umccr dot org** as soon as
possible. Please do not open a public issue.

For material committed by mistake, the platform team rotates the affected credential first and then removes it
from history. Deleting it in a later commit does not remove it from history.

## What this repository must never contain

This repository is public. It holds only generic code and documentation, and synthetic examples. It must never
contain:

- private documentation, generated sites, search indexes or build output from any site;
- AWS account IDs, ARNs, bucket names, distribution IDs or other environment-specific identifiers;
- credentials, tokens, signing keys, Cognito client secrets or identity-provider metadata with secrets;
- user data, access lists, logs, security findings or threat models.

CI enforces part of this with `scripts/check-boundary.sh` and detect-secrets; reviewers enforce the rest. The toolkit
reads bucket names and role ARNs at run time, from SSM or its arguments, so none is written here.

## What the toolkit enforces

Every site on docs.umccr.org shares one browser origin, where the sign-in page keeps the reader's tokens. So a site
must not be able to run code of its own: the theme and its one script are the platform's, `umccr-docs check` and
`build` refuse scripts, event handlers, frames and `javascript:` URLs in a site's Markdown, configuration and files,
and `verify-site` checks the built pages again. `publish`, as the site pipeline runs it, narrows the publisher role to
the release's own site with a session policy.

Sign-in, the edge checks and the pipelines belong to umccr/docs-platform; see its
[SECURITY.md](https://github.com/umccr/docs-platform/blob/main/SECURITY.md).
