DEPRECATED: Old PostgreSQL Backup Flow

This project now uses MySQL 8.0. The previous PostgreSQL dump/load instructions are deprecated and kept for historical reference only.

What to use now:
- To export data: run `./dump.sh` — this writes a MySQL-compatible `db_backup.sql` at the repo root.
- To import data: run `./load.sh` — this loads `db_backup.sql` into MySQL.

If you still have an old `db_backup.dump` (PostgreSQL custom format):
- It cannot be imported into MySQL directly.
- Ask the data owner to regenerate a MySQL dump (`db_backup.sql`) from a MySQL-backed environment, or load Django fixtures in `backend/sqlite_backup/` with:
  - `(cd backend && python manage.py loaddata sqlite_backup/sqlite_data.json)`

See also:
- `MYSQL_QUICKSTART.md`
- `MYSQL_MIGRATION_GUIDE.md`
- `DATABASE_README.md`
