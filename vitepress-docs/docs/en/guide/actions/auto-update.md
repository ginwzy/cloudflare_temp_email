# Backend Auto-Deploy Behavior

::: warning Notice
If you encounter any issues, please report them via `GitHub Issues`. Thank you.
Auto-deploy will not execute SQL files for the D1 database. When the schema changes, you need to execute them manually.
:::

1. Push or merge commits into the `main` branch.
2. GitHub Actions triggers `Backend Auto Deploy` automatically.
3. If needed, run it manually from `Actions` -> `Backend Auto Deploy` -> `Run workflow`.
