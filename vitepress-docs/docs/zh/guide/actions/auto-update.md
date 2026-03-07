# 后端自动部署说明

::: warning 注意
有问题请通过 `GitHub Issues` 反馈，感谢。
自动部署不会执行 D1 数据库的 SQL 文件，当数据库 schema 变动时，需要手动执行。
:::

1. 将代码 push 或 merge 到 `main` 分支。
2. GitHub Actions 会自动触发 `Backend Auto Deploy`。
3. 如需手动执行，可在 `Actions` -> `Backend Auto Deploy` -> `Run workflow` 中触发。
