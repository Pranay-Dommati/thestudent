# PostgreSQL to MySQL Migration Guide

## Overview
This document describes the migration from PostgreSQL to MySQL for the Students Hub project. The migration maintains the same Docker container setup and custom dump/load scripts for data sharing among contributors.

## What Changed

### 1. Database Server
- **Before**: PostgreSQL 15
- **After**: MySQL 8.0
- **Reason**: Hosting platform provides MySQL database

### 2. Docker Configuration
- **Container name**: `studentshub_mysql` (was `studentshub_postgres`)
- **Port**: 3306 (was 5432)
- **Volume**: `mysql_data` (was `postgres_data`)

### 3. Python Dependencies
- **Removed**: `psycopg2-binary>=2.9.0` (PostgreSQL adapter)
- **Added**: `mysqlclient>=2.2.0` (MySQL adapter)

### 4. Database Backup Format
- **Before**: PostgreSQL custom format (`.dump`)
- **After**: MySQL SQL format (`.sql`)

### 5. Environment Variables
Updated in `.env`:
```bash
DB_ENGINE=mysql                    # was: django.db.backends.postgresql
DB_PORT=3306                       # was: 5432
DB_USER=studentshub_user          # was: postgres
DB_ROOT_PASSWORD=rootpass123      # new: required for MySQL root user
```

## Migration Steps

### For Existing Contributors

#### Step 1: Stop Old PostgreSQL Container
```bash
docker-compose down
docker volume rm thestudent_postgres_data  # Optional: removes old PostgreSQL data
```

#### Step 2: Update Code
```bash
git pull origin main  # Get latest MySQL configuration
```

#### Step 3: Install MySQL Python Client
```bash
pip install -r requirements.txt
# This will install mysqlclient instead of psycopg2-binary
```

#### Step 4: Start MySQL Container
```bash
docker-compose up -d
```

#### Step 5: Run Django Migrations
```bash
cd backend
python manage.py migrate
```

#### Step 6: Load Shared Database (Optional)
If a team member has shared a database dump:
```bash
./load.sh
```

### For New Contributors

#### Step 1: Clone Repository
```bash
git clone <repository-url>
cd thestudent
```

#### Step 2: Install Dependencies
```bash
pip install -r requirements.txt
```

#### Step 3: Start MySQL Container
```bash
docker-compose up -d
```

#### Step 4: Run Migrations
```bash
cd backend
python manage.py migrate
```

#### Step 5: Load Shared Database (Optional)
```bash
./load.sh
```

## Dump & Load Scripts

### Creating a Database Dump

To share your database with team members:

```bash
./dump.sh
```

This creates `db_backup.sql` with:
- All tables and data
- Stored procedures and triggers
- Events
- Consistent snapshot (no table locking)

**Commit and push `db_backup.sql`** to share with the team.

### Loading a Database Dump

To load a database dump from a team member:

```bash
./load.sh
```

This will:
1. Drop the existing database (if any)
2. Create a fresh database
3. Restore all data from `db_backup.sql`
4. Verify key tables

## Script Features

### dump.sh
- ✅ Works with Docker container or local MySQL
- ✅ Uses `--single-transaction` for consistency
- ✅ Includes routines, triggers, and events
- ✅ Windows-compatible (MSYS/Git Bash)
- ✅ Shows file size after dump

### load.sh
- ✅ Works with Docker container or local MySQL
- ✅ Waits for MySQL to be ready
- ✅ Drops/recreates database for clean restore
- ✅ Uses root user to avoid permission issues
- ✅ Verifies restore with table counts
- ✅ Windows-compatible (MSYS/Git Bash)

## MySQL Configuration Details

### Character Set & Collation
- **Character Set**: `utf8mb4` (full Unicode support)
- **Collation**: `utf8mb4_unicode_ci` (case-insensitive)

### Connection Settings
- **Max Age**: 60 seconds (connection pooling)
- **Authentication**: `mysql_native_password`
- **SQL Mode**: `STRICT_TRANS_TABLES` (strict mode for data integrity)

### Docker Health Check
```bash
mysqladmin ping -h localhost -u studentshub_user -pstudentshub123
```

## Important Notes

### 1. Data Type Differences

Some Django field types behave differently in MySQL vs PostgreSQL:

| Field Type | PostgreSQL | MySQL |
|------------|------------|-------|
| TextField | TEXT | LONGTEXT |
| JSONField | JSONB | JSON |
| BooleanField | BOOLEAN | TINYINT(1) |
| DateTimeField | TIMESTAMP | DATETIME |

Django handles these differences automatically.

### 2. Case Sensitivity

**PostgreSQL**: Case-sensitive by default
**MySQL**: Case-insensitive on Windows/macOS, depends on filesystem on Linux

Tables and column names are preserved, but comparisons may behave differently.

### 3. Transaction Isolation

MySQL uses `READ COMMITTED` by default. Django handles this properly.

### 4. Full-Text Search

If using full-text search:
- PostgreSQL: Uses `tsquery` and `tsvector`
- MySQL: Uses `MATCH() AGAINST()`

You may need to update queries if using full-text search.

## Troubleshooting

### Issue: "mysqlclient" installation fails

**Windows**:
```bash
pip install wheel
pip install mysqlclient
```

If still fails, install MySQL Connector/C from Oracle website.

**Linux**:
```bash
sudo apt-get install python3-dev default-libmysqlclient-dev build-essential
pip install mysqlclient
```

**macOS**:
```bash
brew install mysql
pip install mysqlclient
```

### Issue: Container won't start

Check if port 3306 is already in use:
```bash
# Windows
netstat -ano | findstr :3306

# Linux/Mac
lsof -i :3306
```

### Issue: Permission denied during load

Make sure `DB_ROOT_PASSWORD` is set correctly in `.env`:
```bash
DB_ROOT_PASSWORD=rootpass123
```

### Issue: Character encoding problems

Ensure your MySQL container uses utf8mb4:
```bash
docker exec studentshub_mysql mysql -u root -prootpass123 -e "SHOW VARIABLES LIKE 'character_set%';"
```

Should show `utf8mb4` for all character sets.

## Production Deployment

### For Hosting Platform

1. Update `.env` with production MySQL credentials:
```bash
DB_ENGINE=mysql
DB_NAME=production_db_name
DB_USER=production_user
DB_PASSWORD=your_secure_password
DB_HOST=mysql.yourhost.com
DB_PORT=3306
DB_SSL_REQUIRE=true  # Enable SSL for production
```

2. Run migrations:
```bash
python manage.py migrate
```

3. (Optional) Load initial data:
```bash
./load.sh
```

### SSL/TLS Connection

For production with SSL:
```python
# Django settings will use:
'OPTIONS': {
    'ssl': {'ssl_mode': 'REQUIRED'}
}
```

## Rollback Plan

If you need to rollback to PostgreSQL:

1. Checkout previous commit:
```bash
git checkout <commit-before-mysql-migration>
```

2. Remove MySQL container:
```bash
docker-compose down
docker volume rm thestudent_mysql_data
```

3. Restore PostgreSQL:
```bash
docker-compose up -d
./load.sh  # Use old PostgreSQL backup
```

## Testing

After migration, verify:

1. ✅ Django admin works: `http://localhost:8000/admin`
2. ✅ API endpoints work: `http://localhost:8000/api/`
3. ✅ User authentication works
4. ✅ Course creation/retrieval works
5. ✅ Database dump/load works

Run Django tests:
```bash
cd backend
python manage.py test
```

## Support

For issues or questions:
1. Check this migration guide
2. Review Docker logs: `docker logs studentshub_mysql`
3. Check Django logs: `backend/django.log`
4. Contact team lead or create an issue

## Summary

✅ **Docker container**: MySQL 8.0 with utf8mb4 support
✅ **Backup format**: SQL dump files
✅ **Scripts**: Updated dump.sh and load.sh for MySQL
✅ **Python package**: mysqlclient instead of psycopg2-binary
✅ **Port**: 3306 instead of 5432
✅ **Data sharing**: Commit `db_backup.sql` to share database

The migration maintains the same workflow for contributors while adapting to the hosting platform's MySQL requirement.
