#!/usr/bin/env bash
set -euo pipefail

# Restore MySQL database from db_backup.sql
# Supports:
# 1) Docker container named 'studentshub_mysql'
# 2) Local mysql client on host

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Require MySQL SQL dump; guide if only Postgres dump is present
if [[ ! -f db_backup.sql ]]; then
  if [[ -f db_backup.dump ]]; then
    echo "[load] Detected db_backup.dump (PostgreSQL custom format) but current database is MySQL." >&2
    echo "[load] This file cannot be imported into MySQL. Please use a MySQL SQL dump named db_backup.sql." >&2
    echo "[load] Alternatives:" >&2
    echo "  - Ask the contributor to run ./dump.sh on a MySQL-backed environment and commit db_backup.sql" >&2
    echo "  - If you have Django fixtures (e.g., backend/sqlite_backup/*.json), you can load them with:" >&2
    echo "      (cd backend && python manage.py loaddata sqlite_backup/sqlite_data.json)" >&2
  else
    echo "[load] db_backup.sql not found in repo root. Aborting." >&2
    echo "[load] Tip: Create one with ./dump.sh on a machine that has the data in MySQL." >&2
  fi
  exit 1
fi

if [[ -f ./.env ]]; then
  set -a
  # shellcheck disable=SC1091
  source ./.env
  set +a
fi

DB_NAME=${DB_NAME:-studentshub_db}
DB_USER=${DB_USER:-studentshub_user}
DB_PASSWORD=${DB_PASSWORD:-}
DB_ROOT_PASSWORD=${DB_ROOT_PASSWORD:-rootpass123}
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-3306}

echo "[load] Restoring to DB: $DB_NAME (user=$DB_USER host=$DB_HOST port=$DB_PORT)"

# Wrap docker to avoid Git Bash/MSYS path conversion on Windows
docker_cmd() {
  MSYS_NO_PATHCONV=1 MSYS2_ARG_CONV_EXCL="*" docker "$@"
}

if command -v docker >/dev/null 2>&1 && docker_cmd ps --format '{{.Names}}' | grep -q '^studentshub_mysql$'; then
  echo "[load] Detected Docker container 'studentshub_mysql'. Restoring inside container..."
  
  # Copy backup file to container
  docker_cmd cp db_backup.sql studentshub_mysql:/tmp/db_backup.sql

  # Wait for MySQL readiness inside the container
  echo "[load] Waiting for MySQL to be ready..."
  docker_cmd exec studentshub_mysql bash -c "until mysqladmin ping -h localhost -u '$DB_USER' -p'$DB_PASSWORD' --silent; do echo '[load] waiting for mysql...'; sleep 1; done"

  # Drop and recreate database using root user to avoid permission issues
  echo "[load] Dropping and recreating database..."
  docker_cmd exec studentshub_mysql mysql -u root -p"$DB_ROOT_PASSWORD" -e "DROP DATABASE IF EXISTS \`$DB_NAME\`; CREATE DATABASE \`$DB_NAME\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
  
  # Grant privileges to user
  docker_cmd exec studentshub_mysql mysql -u root -p"$DB_ROOT_PASSWORD" -e "GRANT ALL PRIVILEGES ON \`$DB_NAME\`.* TO '$DB_USER'@'%'; FLUSH PRIVILEGES;"

  # Restore the database
  echo "[load] Restoring database from backup..."
  docker_cmd exec -i studentshub_mysql mysql -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < db_backup.sql 2>&1 | grep -v "Using a password on the command line" || true

  # Cleanup
  docker_cmd exec studentshub_mysql rm -f /tmp/db_backup.sql >/dev/null 2>&1 || true
  
  echo "[load] Restore completed successfully!"
  echo ""
  echo "⚠️  IMPORTANT: After loading database, you MUST run migrations to ensure schema is up-to-date:"
  echo "    cd backend && python manage.py migrate"
  echo ""
else
  echo "[load] Using local mysql client (ensure MySQL client tools are installed)..."
  
  # Wait for MySQL readiness
  if command -v mysqladmin >/dev/null 2>&1; then
    until mysqladmin ping -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" --silent 2>/dev/null; do
      echo "[load] waiting for mysql at $DB_HOST:$DB_PORT..."; sleep 1
    done
  fi

  # Drop and recreate database using root
  echo "[load] Dropping and recreating database..."
  mysql -h "$DB_HOST" -P "$DB_PORT" -u root -p"$DB_ROOT_PASSWORD" -e "DROP DATABASE IF EXISTS \`$DB_NAME\`; CREATE DATABASE \`$DB_NAME\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>&1 | grep -v "Using a password on the command line" || true
  
  # Grant privileges
  mysql -h "$DB_HOST" -P "$DB_PORT" -u root -p"$DB_ROOT_PASSWORD" -e "GRANT ALL PRIVILEGES ON \`$DB_NAME\`.* TO '$DB_USER'@'%'; FLUSH PRIVILEGES;" 2>&1 | grep -v "Using a password on the command line" || true

  # Restore
  echo "[load] Restoring database from backup..."
  mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < db_backup.sql 2>&1 | grep -v "Using a password on the command line" || true
  
  echo "[load] Restore completed successfully!"
  echo ""
  echo "⚠️  IMPORTANT: After loading database, you MUST run migrations to ensure schema is up-to-date:"
  echo "    cd backend && python manage.py migrate"
  echo ""
fi

# Post-restore quick verification
echo "[load] Verifying presence of key tables and row counts..."

VERIFY_SQL="SELECT 'courses_engineeringcourse' AS table_name, COUNT(*) AS row_count FROM courses_engineeringcourse UNION ALL SELECT 'courses_prolearningcourse', COUNT(*) FROM courses_prolearningcourse UNION ALL SELECT 'courses_lesson', COUNT(*) FROM courses_lesson;"

if command -v docker >/dev/null 2>&1 && docker_cmd ps --format '{{.Names}}' | grep -q '^studentshub_mysql$'; then
  docker_cmd exec studentshub_mysql mysql -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "$VERIFY_SQL" 2>&1 | grep -v "Using a password on the command line" || true
else
  mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "$VERIFY_SQL" 2>&1 | grep -v "Using a password on the command line" || true
fi

echo "[load] Database verification completed!"
