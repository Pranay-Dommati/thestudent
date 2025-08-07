# 🐘 PostgreSQL Setup Guide for Students Hub

## Prerequisites
- Python 3.8+
- Django project
- PostgreSQL installed

## 📦 Installation Steps

### 1. Install PostgreSQL

#### Windows:
1. Download PostgreSQL from https://www.postgresql.org/download/windows/
2. Run the installer and follow the setup wizard
3. Remember the password you set for the `postgres` user
4. Default port is 5432 (keep this unless you have conflicts)

#### macOS:
```bash
# Using Homebrew
brew install postgresql
brew services start postgresql
```

#### Linux (Ubuntu/Debian):
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2. Create Database and User

Open PostgreSQL command line:
```bash
# Connect to PostgreSQL
sudo -u postgres psql

# Or on Windows, use pgAdmin or command prompt:
psql -U postgres
```

Run these SQL commands:
```sql
-- Create database
CREATE DATABASE studentshub_db;

-- Create user (if not using default postgres user)
CREATE USER studentshub_user WITH ENCRYPTED PASSWORD 'your_secure_password';

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE studentshub_db TO studentshub_user;

-- Exit
\q
```

### 3. Update Environment Variables

Update your `.env` file in the backend directory:
```env
DB_NAME=studentshub_db
DB_USER=postgres  # or studentshub_user if you created a new user
DB_PASSWORD=your_actual_password
DB_HOST=localhost
DB_PORT=5432
```

### 4. Install Python Dependencies

```bash
pip install psycopg2-binary
```

### 5. Run Migration

```bash
# Navigate to your project
cd "C:\Users\banny\OneDrive\Documents\Desktop\STUDENTSHUB\SHPRO\thestudent"

# Run the migration script
python migrate_to_postgresql.py
```

## 🔧 Manual Migration Steps

If you prefer to do it manually:

1. **Backup SQLite data:**
```bash
cd backend
python manage.py dumpdata --natural-foreign --natural-primary -e contenttypes -e auth.Permission > data_backup.json
```

2. **Update settings.py** (already done)

3. **Run migrations:**
```bash
python manage.py makemigrations
python manage.py migrate
```

4. **Load data:**
```bash
python manage.py loaddata data_backup.json
```

5. **Create superuser:**
```bash
python manage.py createsuperuser
```

## ✅ Verification

Test your setup:
```bash
cd backend
python manage.py runserver
```

Visit `http://localhost:8000/admin` and log in to verify everything works.

## 🐛 Troubleshooting

### Connection Issues:
- Verify PostgreSQL is running: `sudo systemctl status postgresql` (Linux) or check Services (Windows)
- Check your `.env` file credentials
- Ensure PostgreSQL is accepting connections on port 5432

### Permission Issues:
```sql
-- Grant additional permissions if needed
GRANT ALL ON ALL TABLES IN SCHEMA public TO your_user;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO your_user;
```

### Data Migration Issues:
- If `loaddata` fails, you might need to recreate some data manually
- Check for any model changes that might conflict
- Consider migrating data table by table if needed

## 🚀 Production Considerations

For production deployment:
1. Use environment variables for all sensitive data
2. Enable SSL connections
3. Use connection pooling (pgbouncer)
4. Set up regular backups
5. Monitor performance and optimize queries

## 📞 Need Help?

- PostgreSQL Documentation: https://www.postgresql.org/docs/
- Django Database Documentation: https://docs.djangoproject.com/en/stable/ref/databases/
- psycopg2 Documentation: https://www.psycopg.org/docs/
