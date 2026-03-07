# Deploy Backend via GitHub Actions

::: warning Notice
This repository now keeps only one workflow: `Backend Auto Deploy`.
If you encounter issues, please report them in `GitHub Issues`.

The `worker.dev` domain is inaccessible in China, please use a custom domain.
:::

## Deployment Steps

### Fork Repository and Enable Actions

- Fork this repository on GitHub
- Open the repository `Actions` page
- Enable `Backend Auto Deploy` if it is disabled

### Configure Secrets

Go to `Settings` -> `Secrets and variables` -> `Actions` -> `Repository secrets`, then add:

- Common `secrets`

  | Name | Description |
  | --- | --- |
  | `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Account ID, [reference](https://developers.cloudflare.com/workers/wrangler/ci-cd/#cloudflare-account-id) |
  | `CLOUDFLARE_API_TOKEN` | Cloudflare API Token, [reference](https://developers.cloudflare.com/workers/wrangler/ci-cd/#api-token) |

- Backend `secrets`

  | Name | Description |
  | --- | --- |
  | `BACKEND_TOML` | Worker configuration file, [see here](/en/guide/cli/worker.html#modify-wrangler-toml-configuration-file) |
  | `DEBUG_MODE` | Optional. Set `true` to print full deploy logs |
  | `BACKEND_USE_MAIL_WASM_PARSER` | Optional. Set `true` to enable WASM mail parser |
  | `USE_WORKER_ASSETS` | Optional. Set `true` to build frontend assets into Worker |
  | `USE_WORKER_ASSETS_WITH_TELEGRAM` | Optional. Used with `USE_WORKER_ASSETS` to build Telegram pages assets |

### Trigger Deployment

- Automatic: push or merge to `main`
- Manual fallback: open `Actions` -> `Backend Auto Deploy` -> `Run workflow`

## Notes

- D1 schema migration SQL is not automatically executed by this workflow.
- When schema changes, run the SQL patches manually.
