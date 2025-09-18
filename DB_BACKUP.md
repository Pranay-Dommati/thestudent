PostgreSQL Data Sharing via Git

- Dump: `./dump.sh` writes `db_backup.dump` (custom format) at repo root. Commit it.
- Load: `./load.sh` restores from `db_backup.dump` with `--clean --create`.

Notes
- Reads connection settings from root `.env` (`DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`).
- Works with Docker container `studentshub_postgres` or local PostgreSQL tools (pg_dump/pg_restore).
- If using Docker, ensure the container is up: `docker compose up -d postgres`.

Windows (Git Bash) Note
- On Windows, Git Bash/MSYS can rewrite POSIX-style paths in Docker args, which can break `docker cp/exec` paths.
- The scripts now automatically disable this path conversion for Docker commands, so just run them normally:
	- `./dump.sh` to create `db_backup.dump`
	- Commit and push the file
	- `./load.sh` on another machine to restore
