# Quick Start Guide - MySQL Setup

## First Time Setup

### 1. Install MySQL Python Client
```bash
pip install -r requirements.txt
```

### 2. Start MySQL Docker Container
```bash
docker-compose up -d
```

### 3. Wait for MySQL to be Ready
```bash
# Check container status
docker ps

# Check logs
docker logs studentshub_mysql
```

### 4. Run Django Migrations
```bash
cd backend
python manage.py migrate
```

### 5. Create Superuser (Optional)
```bash
python manage.py createsuperuser
```

### 6. Start Django Server
```bash
python manage.py runserver
```

## Daily Workflow

### Start Everything
```bash
# Start MySQL
docker-compose up -d

# Start Django
cd backend
python manage.py runserver
```

### Stop Everything
```bash
# Stop Django (Ctrl+C in terminal)

# Stop MySQL
docker-compose down
```

## Database Backup & Restore

### Share Your Database
```bash
# Create backup
./dump.sh

# Commit and push
git add db_backup.sql
git commit -m "Update database backup"
git push
```

### Load Teammate's Database
```bash
# Pull latest changes
git pull

# Load database
./load.sh
```

## Common Commands

### Check MySQL is Running
```bash
docker ps | grep mysql
```

### Access MySQL Shell
```bash
docker exec -it studentshub_mysql mysql -u studentshub_user -pstudentshub123 studentshub_db
```

### View Database Tables
```sql
SHOW TABLES;
```

### Check Table Counts
```sql
SELECT 'courses_engineeringcourse' AS table_name, COUNT(*) FROM courses_engineeringcourse
UNION ALL
SELECT 'courses_prolearningcourse', COUNT(*) FROM courses_prolearningcourse
UNION ALL
SELECT 'courses_lesson', COUNT(*) FROM courses_lesson;
```

### View Container Logs
```bash
docker logs -f studentshub_mysql
```

### Restart MySQL Container
```bash
docker-compose restart
```

## Troubleshooting

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :3306

# Linux/Mac
lsof -i :3306

# Kill the process or change port in docker-compose.yml
```

### Container Won't Start
```bash
# Check logs
docker logs studentshub_mysql

# Remove and recreate
docker-compose down -v
docker-compose up -d
```

### Can't Connect to Database
```bash
# Verify .env file exists and has correct settings
cat .env | grep DB_

# Test connection
docker exec studentshub_mysql mysqladmin ping -u studentshub_user -pstudentshub123
```

### Migration Errors
```bash
# Reset migrations (CAUTION: loses data)
cd backend
python manage.py migrate --fake-initial

# Or drop and recreate database
./load.sh
```

## Environment Variables

Required in `.env`:
```bash
DB_ENGINE=mysql
DB_NAME=studentshub_db
DB_USER=studentshub_user
DB_PASSWORD=studentshub123
DB_ROOT_PASSWORD=rootpass123
DB_HOST=localhost
DB_PORT=3306
```

## Production Deployment

Update `.env` with production credentials:
```bash
DB_HOST=your-production-mysql-host.com
DB_USER=production_user
DB_PASSWORD=secure_production_password
DB_SSL_REQUIRE=true
```

Then run:
```bash
python manage.py migrate
python manage.py collectstatic --noinput
```

---

**Need help?** Check `MYSQL_MIGRATION_GUIDE.md` for detailed information.
