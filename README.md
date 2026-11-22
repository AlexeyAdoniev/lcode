# LCode

The Nest API lives in `apps/api`; `libs/` holds code shared by future apps.

Run `yarn db:seed` with `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_DB` set to create the `problems` table if it does not exist. In the Compose stack, run `docker compose exec api yarn db:seed` after PostgreSQL is ready. Existing tables with UUID IDs require a separate data migration; the seed reports this instead of changing existing IDs.

Problem routes: `POST /problems`, `GET /problems?page=&perPage=`, `GET /problems/:id`, `PATCH /problems/:id`, and `DELETE /problems/:id`.

Tests are stored as PostgreSQL `jsonb`, for example `[{"inputs":["abc",2],"output":3}]`. DTO validation covers `name` and `description`; the `tests` field is not validated yet.
