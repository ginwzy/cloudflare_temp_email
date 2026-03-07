# 通过 GitHub Actions 部署后端

::: warning 注意
当前仓库仅保留一个工作流：`Backend Auto Deploy`。
如有问题请通过 `GitHub Issues` 反馈。

`worker.dev` 域名在中国无法访问，请使用自定义域名。
:::

## 部署步骤

### Fork 仓库并启用 Actions

- 在 GitHub fork 本仓库
- 打开仓库 `Actions` 页面
- 如果 `Backend Auto Deploy` 处于禁用状态，先启用

### 配置 Secrets

在仓库 `Settings` -> `Secrets and variables` -> `Actions` -> `Repository secrets` 添加：

- 公共 `secrets`

  | 名称 | 说明 |
  | --- | --- |
  | `CLOUDFLARE_ACCOUNT_ID` | Cloudflare 账户 ID，[参考文档](https://developers.cloudflare.com/workers/wrangler/ci-cd/#cloudflare-account-id) |
  | `CLOUDFLARE_API_TOKEN` | Cloudflare API Token，[参考文档](https://developers.cloudflare.com/workers/wrangler/ci-cd/#api-token) |

- 后端 `secrets`

  | 名称 | 说明 |
  | --- | --- |
  | `BACKEND_TOML` | Worker 配置文件，[参考此处](/zh/guide/cli/worker.html#修改-wrangler-toml-配置文件) |
  | `DEBUG_MODE` | 可选，配置为 `true` 时输出完整部署日志 |
  | `BACKEND_USE_MAIL_WASM_PARSER` | 可选，配置为 `true` 启用 WASM 邮件解析 |
  | `USE_WORKER_ASSETS` | 可选，配置为 `true` 时将前端资源打包进 Worker |
  | `USE_WORKER_ASSETS_WITH_TELEGRAM` | 可选，与 `USE_WORKER_ASSETS` 配合使用，构建 Telegram 页面资源 |

### 触发部署

- 自动触发：push 或 merge 到 `main`
- 手动兜底：进入 `Actions` -> `Backend Auto Deploy` -> `Run workflow`

## 说明

- 该工作流不会自动执行 D1 数据库 schema 变更 SQL。
- 数据库 schema 变更后，请手动执行对应 SQL。
