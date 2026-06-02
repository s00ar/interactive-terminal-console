# Deployment setup

This project can be deployed from GitHub Actions by uploading the site over FTP/FTPS and, when needed, replacing the MySQL content from `data/users.json` and `data/evidence.json`.

## What the pipeline does

1. Lints the PHP entry points.
2. Builds a release bundle in `deploy/build/`.
3. Generates `app_secrets.php` from GitHub Actions secrets so database credentials are not committed.
4. Uploads the production files over FTP or FTPS.
5. Runs a smoke test against the public site.
6. Optionally calls `deploy_sync.php` to replace the production `users` and `evidence` tables with the checked-in JSON data.
7. Runs an API smoke test against `api.php?action=bootstrap`.

The workflow also downloads Git LFS assets before building, which is required for the checked-in `.mp4` evidence files.

## Required GitHub secrets

Create a GitHub Actions environment named `production`, then add these environment secrets before running the workflow:

- `DEPLOY_HOST`
- `DEPLOY_USERNAME`
- `DEPLOY_PASSWORD`
- `DEPLOY_SERVER_DIR`
- `APP_DB_HOST`
- `APP_DB_PORT`
- `APP_DB_NAME`
- `APP_DB_USER`
- `APP_DB_PASSWORD`
- `DEPLOY_HOOK_TOKEN`

Notes:

- `APP_URL` should be the public site root without a trailing slash, for example `https://terminal.afec.space`.
- `DEPLOY_HOOK_TOKEN` can be any long random string. It protects `deploy_sync.php`.
- `APP_DB_*` are the values the uploaded PHP app uses on the server. They do not need to match local development settings.

Add these GitHub Actions environment or repository variables as well:

- `APP_URL`
- `DEPLOY_PROTOCOL`: `ftp`, `ftps`, or `ftps-legacy`
- `DEPLOY_PORT`: usually `21`

## Target path for `terminal.afec.space`

For Hostinger, use the exact folder shown in hPanel for the target website or subdomain. Do not assume that `terminal.afec.space` shares the same document root as `afec.space`.

- `APP_URL`: `https://terminal.afec.space`
- `DEPLOY_HOST`: the FTP IP or hostname shown in hPanel under `Websites -> Dashboard -> FTP Accounts`
- `DEPLOY_USERNAME`: the FTP username for that website or subdomain
- `DEPLOY_PASSWORD`: the FTP password for that FTP account
- `DEPLOY_SERVER_DIR`: the exact `Folder to upload files` shown by Hostinger for `terminal.afec.space`

Typical Hostinger upload paths look like:

- `/home/u12345678/domains/rpg.example.com/public_html`
- `/home/u12345678/public_html`

Use the exact path shown in hPanel instead of guessing. If `terminal.afec.space` is configured as its own subdomain in Hostinger, it may point to a different folder than the main `afec.space` site.

## Recommended workflow usage

- Pushes to `main` deploy files only.
- Use **Run workflow** in GitHub Actions when you want to deploy files and also replace the production database.
- Leave `sync_database` enabled only when the JSON files in `data/` are the source of truth and you want production overwritten with them.
- The deploy job targets the GitHub Actions `production` environment, so you can add approval rules there if needed.

## Local build

You can generate the same deployment bundle locally with PowerShell:

```powershell
./deploy/build-release.ps1 -OutputRoot ./deploy/build -SkipSecretsFile
```

If you want the generated `app_secrets.php` included as well, set the `APP_DB_*` environment variables and run the script without `-SkipSecretsFile`.

## Important behavior

- `deploy_sync.php` only accepts `POST`.
- Database sync is a full replace of the `users` and `evidence` tables.
- The checked-in `deploy/entrega` folder is not used by this workflow.
- This workflow assumes the hosting account accepts file uploads but does not require remote shell execution for deployment.
