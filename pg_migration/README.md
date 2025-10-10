# Temporary Postgres Migration Workspace

This folder is used to spin up a temporary PostgreSQL instance to restore an old
`db_backup.dump` and export Django fixtures for import into the current MySQL DB.

Commands (Git Bash):

```bash
# 1) Start Postgres 15 on port 5433
docker run --name temp_pg -e POSTGRES_PASSWORD=pass -p 5433:5432 -d postgres:15

# 2) Create target DB and restore dump
createdb -h 127.0.0.1 -p 5433 -U postgres studentshub_db
pg_restore -h 127.0.0.1 -p 5433 -U postgres -d studentshub_db --clean --no-owner ../db_backup.dump

# 3) Export fixtures using the provided script
export PG_HOST=127.0.0.1 PG_PORT=5433 PG_USER=postgres PG_PASSWORD=pass PG_DB=studentshub_db
../.venv/Scripts/python.exe ../export_from_postgres.py

# 4) Import into MySQL
../.venv/Scripts/python.exe ../backend/manage.py loaddata ../backend/fixtures_export/all_data.json

# 5) Cleanup
docker rm -f temp_pg
```
