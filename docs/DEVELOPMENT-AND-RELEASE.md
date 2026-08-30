# Development and release policy

This repository is the source history for one independently deployed project. Do not create another Git history, deploy from a ZIP/extraction, or treat a backup as a working copy.

## Local development

The Windows working copy belongs under:

```text
F:\xampp\htdocs\<project-folder>
```

Before cloning, initializing, moving, or replacing a folder, verify its Git root, remote, branch, HEAD, and working-tree status. A similarly named dirty folder must be reconciled; it must not be overwritten.

Work on a short-lived branch. Run the repository's documented install, test, typecheck, lint, security, and build commands before pushing.

## GitHub flow

1. Create a feature or repair branch from the declared canonical branch.
2. Commit only reviewed source and configuration templates.
3. Push the branch and open a pull request.
4. Require the repository-policy check and all project build checks to pass.
5. Resolve review conversations.
6. Merge the reviewed pull request.
7. Never force-push or deploy an unrelated history over the canonical branch.

Secrets, passwords, API keys, private keys, production data, local databases, and `.env` files do not belong in Git.

## Side-by-side environments

Development, staging, and production are separate runtime environments:

- **Development:** the local working copy and local runtime.
- **Staging:** a GitHub/hosting environment containing the candidate commit.
- **Production:** the public or approved private environment.

`staging/` and `production/` are not source folders and are not long-lived branches. Each environment has separate configuration, secrets, databases, storage, URLs, and access controls.

A merge to the canonical branch may deploy the exact commit to staging only after checks pass. Production promotion must use that same verified commit; rebuilding different bytes or copying files manually is not promotion.

## Deployment gate

No deployment is authorized until the repository records:

- the hosting provider and target;
- the staging URL and production URL;
- required environment variables without secret values;
- database and uploaded-file handling;
- health verification;
- rollback to a known commit;
- the person or rule authorized to promote staging to production.

If those facts are absent, local development and CI may continue, but deployment is blocked.

## Recovery

Every deployment must record the Git commit SHA. Roll back by redeploying a previously verified SHA through the same workflow. Do not repair production by editing server files directly.
