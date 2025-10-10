# Database Setup - MySQL

## Quick Start

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Start MySQL container
docker-compose up -d

# 3. Run migrations
cd backend
python manage.py migrate

# 4. Start Django server
python manage.py runserver
```

## Database Sharing Among Contributors

### To Share Your Database
```bash
./dump.sh                    # Creates db_backup.sql
git add db_backup.sql
git commit -m "Update database"
git push
```

### To Load Shared Database
```bash
git pull
./load.sh                    # Loads db_backup.sql
```

## Documentation

- **Quick Start**: See `MYSQL_QUICKSTART.md`
- **Migration Details**: See `MYSQL_MIGRATION_GUIDE.md`
- **Full Summary**: See `MYSQL_MIGRATION_SUMMARY.md`

## Configuration

Database settings in `.env`:
```bash
DB_ENGINE=mysql
DB_NAME=studentshub_db
DB_USER=studentshub_user
DB_PASSWORD=studentshub123
DB_HOST=localhost
DB_PORT=3306
```

## Container Info

- **Container**: `studentshub_mysql`
- **Image**: MySQL 8.0
- **Port**: 3306
- **Volume**: `mysql_data`

## Common Commands

```bash
# Start container
docker-compose up -d

# Stop container
docker-compose down

# View logs
docker logs studentshub_mysql

# Access MySQL shell
docker exec -it studentshub_mysql mysql -u studentshub_user -pstudentshub123 studentshub_db

# Check container status
docker ps
```

## Production Deployment

Update `.env` with production MySQL credentials from your hosting platform:
```bash
DB_HOST=your-mysql-host.com
DB_USER=production_user
DB_PASSWORD=secure_password
DB_SSL_REQUIRE=true
```

Run migrations:
```bash
python manage.py migrate
python manage.py collectstatic --noinput
```
