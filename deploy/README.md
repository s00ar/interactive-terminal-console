# Deployment setup

This project can be deployed from GitHub Actions by uploading the site over FTP and, when needed, replacing the MySQL content from `data/users.json` and `data/evidence.json`.

## What the pipeline does

1. Lints the PHP entry points.
2. Builds a release bundle in `deploy/build/`.
3. Generates `app_secrets.php` from GitHub Actions secrets so database credentials are not committed.
4. Uploads the production files over FTP.
5. Optionally calls `deploy_sync.php` to replace the production `users` and `evidence` tables with the checked-in JSON data.

## Required GitHub secrets

Add these repository secrets before running the workflow:

- `FTP_SERVER`
- `FTP_USERNAME`
- `FTP_PASSWORD`
- `FTP_SERVER_DIR`
- `APP_DB_HOST`
- `APP_DB_PORT`
- `APP_DB_NAME`
- `APP_DB_USER`
- `APP_DB_PASSWORD`
- `APP_URL`
- `DEPLOY_HOOK_TOKEN`

Notes:

- `APP_URL` should be the public site root without a trailing slash, for example `https://example.com`.
- `DEPLOY_HOOK_TOKEN` can be any long random string. It protects `deploy_sync.php`.
- `APP_DB_*` are the values the uploaded PHP app uses on the server. They do not need to match local development settings.

## Hostinger subdomain values

If this site is deployed to a Hostinger subdomain such as `rpg.example.com`, use these values:

- `APP_URL`: `https://rpg.example.com`
- `FTP_SERVER`: the FTP IP or hostname shown in hPanel under `Websites -> Dashboard -> FTP Accounts`
- `FTP_USERNAME`: the FTP username for that website/subdomain
- `FTP_PASSWORD`: the FTP password for that FTP account
- `FTP_SERVER_DIR`: the exact `Folder to upload files` shown by Hostinger for that subdomain

Typical Hostinger upload paths look like:

- `/home/u12345678/domains/rpg.example.com/public_html`
- `/home/u12345678/public_html`

Use the exact path shown in hPanel instead of guessing.

## Recommended workflow usage

- Pushes to `main` deploy files only.
- Use **Run workflow** in GitHub Actions when you want to deploy files and also replace the production database.
- Leave `sync_database` enabled only when the JSON files in `data/` are the source of truth and you want production overwritten with them.

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
