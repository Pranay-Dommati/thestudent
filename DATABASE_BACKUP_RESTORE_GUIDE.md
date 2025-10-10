# Database Backup & Restore Guide

## Overview

This guide explains how to properly backup and restore your MySQL database across different machines.

## ⚠️ Critical Understanding

**The MySQL dump contains:**
- ✅ Table structures (CREATE TABLE statements)
- ✅ All data (INSERT statements)
- ✅ Triggers, procedures, and events
- ❌ NOT Django migration history

**After restoring, you MUST run migrations** because:
1. Django's `django_migrations` table tracks which migrations have been applied
2. New code might have migrations that didn't exist when the backup was made
3. Migrations ensure your database schema matches your current Django models

---

## 📦 Backup Database (dump.sh)

### Usage

```bash
./dump.sh
```

### What It Does

1. Reads connection settings from `.env` file
2. Detects if MySQL is running in Docker or locally
3. Creates `db_backup.sql` with:
   - All table structures
   - All data
   - Stored procedures and triggers
4. Suppresses password warnings automatically

### Improvements Made

✅ **Fixed**: Added `--no-tablespaces` flag to avoid "PROCESS privilege" warning
✅ **Fixed**: Added `--add-drop-table` to ensure clean table recreation
✅ **Fixed**: Suppressed "Using a password on command line" warnings

### Output Example

```
[dump] Target DB: studentshub_db (user=studentshub_user host=localhost port=3306)
[dump] Detected Docker container 'studentshub_mysql'. Dumping inside container...
[dump] Dump completed inside container
[dump] Wrote db_backup.sql (commit and push this file).
[dump] File size: 940K
```

---

## 📥 Restore Database (load.sh)

### Usage

```bash
./load.sh
```

### What It Does

1. Reads connection settings from `.env` file
2. Detects if MySQL is running in Docker or locally
3. **Drops and recreates the database** (⚠️ destroys existing data!)
4. Restores all tables and data from `db_backup.sql`
5. Reminds you to run migrations

### ⚠️ IMPORTANT: Migration Step

**After running `./load.sh`, you MUST run:**

```bash
cd backend
python manage.py migrate
```

**Why?**
- The SQL dump doesn't know about new migrations in your code
- Django needs to sync `django_migrations` table with actual applied migrations
- Without this, Django will think migrations aren't applied and cause errors

### Output Example

```
[load] Restoring to DB: studentshub_db (user=studentshub_user host=localhost port=3306)
[load] Detected Docker container 'studentshub_mysql'. Restoring inside container...
[load] Waiting for MySQL to be ready...
[load] Dropping and recreating database...
[load] Restoring database from backup...
[load] Restore completed successfully!

⚠️  IMPORTANT: After loading database, you MUST run migrations to ensure schema is up-to-date:
    cd backend && python manage.py migrate

[load] Verifying presence of key tables and row counts...
[load] Database verification completed!
```

---

## 🔧 Troubleshooting

### Problem: "Table 'X' doesn't exist" after load.sh

**Cause**: You didn't run migrations after restoring

**Solution**:
```bash
cd backend
python manage.py migrate
```

### Problem: "Access denied; you need PROCESS privilege" during dump.sh

**Status**: ✅ FIXED - Added `--no-tablespaces` flag

**Old workaround** (if you still see this):
- This is a warning, not an error
- The dump still completes successfully
- It just means tablespace metadata isn't included (which you don't need)

### Problem: Google login fails after restore

**Cause**: Your `.env` file has different `GOOGLE_OAUTH2_CLIENT_ID` than the machine that created the backup

**Solution**:
1. Ensure `.env` has correct Google OAuth credentials
2. Restart Django server: `cd backend && python manage.py runserver`
3. Clear browser cookies for localhost
4. Try logging in again

### Problem: db_backup.sql not found

**Cause**: You're on a new machine and haven't pulled the latest backup

**Solution**:
```bash
git pull origin pranay-maybe-final
```

If the file still doesn't exist, someone needs to run `./dump.sh` on a machine with data and commit it.

---

## 🔄 Complete Workflow: Moving Data Between Machines

### Machine A (Has Data) → Machine B (Empty)

**On Machine A:**
```bash
# 1. Backup database
./dump.sh

# 2. Commit and push
git add db_backup.sql
git commit -m "chore: update database backup"
git push origin pranay-maybe-final
```

**On Machine B:**
```bash
# 1. Pull latest code and backup
git pull origin pranay-maybe-final

# 2. Ensure MySQL is running
docker-compose up -d mysql  # if using Docker
# OR ensure local MySQL service is running

# 3. Restore database
./load.sh

# 4. Run migrations (CRITICAL!)
cd backend
python manage.py migrate

# 5. Start server
python manage.py runserver
```

---

## 📋 Pre-Flight Checklist

### Before Running dump.sh
- ✅ MySQL server is running
- ✅ You have data you want to backup
- ✅ `.env` file exists with correct DB credentials

### Before Running load.sh
- ✅ MySQL server is running
- ✅ `db_backup.sql` exists in repo root
- ✅ `.env` file exists with correct DB credentials
- ✅ You understand this will **DELETE ALL CURRENT DATA**

### After Running load.sh
- ✅ Run `cd backend && python manage.py migrate`
- ✅ Restart Django server
- ✅ Test login and basic functionality

---

## 🔐 Environment Variables Required

Make sure your `.env` file contains:

```bash
# Database Configuration
DB_NAME=studentshub_db
DB_USER=studentshub_user
DB_PASSWORD=your_password_here
DB_ROOT_PASSWORD=rootpass123
DB_HOST=localhost
DB_PORT=3306

# Google OAuth (for login to work)
GOOGLE_OAUTH2_CLIENT_ID=your_client_id
GOOGLE_OAUTH2_CLIENT_SECRET=your_client_secret

# Django Settings
SECRET_KEY=your_secret_key
DEBUG=True
```

---

## 💡 Best Practices

### When to Run dump.sh
- ✅ Before major code changes
- ✅ After adding important course/user data
- ✅ Before switching branches
- ✅ Weekly backups for active development

### When to Run load.sh
- ✅ Setting up a new development machine
- ✅ After pulling someone else's data backup
- ✅ Recovering from a corrupted database
- ✅ Syncing data between team members

### What to Commit
- ✅ Commit `db_backup.sql` (even if large, it's important)
- ❌ Never commit `.env` file (contains secrets)
- ✅ Commit these scripts: `dump.sh`, `load.sh`

---

## 🆘 Emergency Recovery

If everything is broken:

```bash
# 1. Stop all servers
# Press Ctrl+C in Django terminal

# 2. Rebuild from scratch
docker-compose down -v  # if using Docker
docker-compose up -d mysql

# 3. Restore database
./load.sh

# 4. Migrate
cd backend
python manage.py migrate

# 5. Create superuser if needed
python manage.py createsuperuser

# 6. Start fresh
python manage.py runserver
```

---

## 📝 Summary

| Script | Purpose | After Running |
|--------|---------|---------------|
| `./dump.sh` | Backup current database to `db_backup.sql` | Commit and push the SQL file |
| `./load.sh` | Restore database from `db_backup.sql` | Run `python manage.py migrate` |

**Golden Rule**: `load.sh` → `migrate` → `runserver` ✨
