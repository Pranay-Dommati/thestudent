# MySQL Migration - Action Checklist

## ✅ Pre-Migration (Completed)

- [x] Updated docker-compose.yml for MySQL 8.0
- [x] Updated Django settings.py for MySQL
- [x] Updated requirements.txt (mysqlclient)
- [x] Updated .env file with MySQL settings
- [x] Rewrote dump.sh for MySQL
- [x] Rewrote load.sh for MySQL
- [x] Created comprehensive documentation

## 📋 Immediate Action Required

### 1. Stop Old PostgreSQL Container
```bash
cd /path/to/thestudent
docker-compose down
```

### 2. (Optional) Remove Old PostgreSQL Data
```bash
docker volume rm thestudent_postgres_data
```
⚠️ **Warning**: This deletes all PostgreSQL data. Only do this if you have a backup!

### 3. Install MySQL Python Client
```bash
pip uninstall psycopg2-binary  # Remove PostgreSQL client
pip install -r requirements.txt  # Install mysqlclient
```

**Troubleshooting on Windows**:
If mysqlclient installation fails:
```bash
pip install wheel
pip install mysqlclient
```
Or download Visual C++ Build Tools if needed.

### 4. Start MySQL Container
```bash
docker-compose up -d
```

Verify container is running:
```bash
docker ps | grep mysql
```

Should show:
```
studentshub_mysql   mysql:8.0   Up   0.0.0.0:3306->3306/tcp
```

### 5. Wait for MySQL to Initialize
```bash
docker logs -f studentshub_mysql
```

Wait for message:
```
ready for connections. Version: '8.0.x'
```

Then press `Ctrl+C` to exit logs.

### 6. Run Django Migrations
```bash
cd backend
python manage.py migrate
```

Expected output:
```
Operations to perform:
  Apply all migrations: admin, auth, contenttypes, courses, sessions, users
Running migrations:
  Applying contenttypes.0001_initial... OK
  Applying auth.0001_initial... OK
  ...
```

### 7. Create Superuser (Optional)
```bash
python manage.py createsuperuser
```

### 8. Test Django Server
```bash
python manage.py runserver
```

Open: http://localhost:8000/admin

### 9. Test Database Dump
```bash
cd ..  # Back to project root
./dump.sh
```

Should create `db_backup.sql`

### 10. Test Database Load
```bash
./load.sh
```

Should restore from `db_backup.sql`

## 🧪 Verification Tests

### Test 1: MySQL Connection
```bash
docker exec -it studentshub_mysql mysql -u studentshub_user -pstudentshub123 -e "SELECT VERSION();"
```

Expected: Shows MySQL version 8.0.x

### Test 2: Database Exists
```bash
docker exec -it studentshub_mysql mysql -u studentshub_user -pstudentshub123 -e "SHOW DATABASES;"
```

Expected: Lists `studentshub_db`

### Test 3: Tables Created
```bash
docker exec -it studentshub_mysql mysql -u studentshub_user -pstudentshub123 studentshub_db -e "SHOW TABLES;"
```

Expected: Shows Django tables (auth_user, courses_engineeringcourse, etc.)

### Test 4: Django Admin Works
1. Start server: `cd backend && python manage.py runserver`
2. Open: http://localhost:8000/admin
3. Login with superuser
4. Verify: Admin interface loads

### Test 5: API Works
1. Open: http://localhost:8000/api/
2. Verify: REST framework page loads

### Test 6: Create Course
1. Use Django admin to create a test course
2. Verify: Course saves successfully

### Test 7: Dump & Load
```bash
# Create dump
./dump.sh

# Verify file exists
ls -lh db_backup.sql

# Load dump
./load.sh

# Verify: No errors
```

## 📤 For Team Lead / Project Owner

### Share Migration with Team

1. **Commit Changes**
```bash
git add docker-compose.yml
git add backend/backend/settings.py
git add requirements.txt
git add .env
git add dump.sh
git add load.sh
git add *.md  # Documentation files
git commit -m "Migrate from PostgreSQL to MySQL 8.0"
git push origin main
```

2. **Create Database Backup**
```bash
./dump.sh
git add db_backup.sql
git commit -m "Add MySQL database backup"
git push origin main
```

3. **Notify Team**

Send message to team:
```
🔄 Database Migration: PostgreSQL → MySQL

We've migrated to MySQL 8.0 to match our hosting platform.

Action Required:
1. Pull latest changes: git pull
2. Stop old container: docker-compose down
3. Install MySQL client: pip install -r requirements.txt
4. Start MySQL: docker-compose up -d
5. Run migrations: cd backend && python manage.py migrate
6. Load shared DB: ./load.sh

Docs: See MYSQL_QUICKSTART.md for details

Questions? Check MYSQL_MIGRATION_GUIDE.md
```

## 🚀 For Team Members

### When You Pull Changes

1. **Pull Latest**
```bash
git pull origin main
```

2. **Stop Old Container**
```bash
docker-compose down
```

3. **Update Dependencies**
```bash
pip install -r requirements.txt
```

4. **Start MySQL**
```bash
docker-compose up -d
```

5. **Run Migrations**
```bash
cd backend
python manage.py migrate
```

6. **Load Shared Database** (if available)
```bash
cd ..
./load.sh
```

7. **Start Working**
```bash
cd backend
python manage.py runserver
```

## 🔧 Troubleshooting

### Problem: mysqlclient won't install

**Solution**:
```bash
# Windows
pip install wheel
pip install mysqlclient

# Linux (Ubuntu/Debian)
sudo apt-get install python3-dev default-libmysqlclient-dev build-essential
pip install mysqlclient

# macOS
brew install mysql
pip install mysqlclient
```

### Problem: Port 3306 already in use

**Solution**:
```bash
# Find process using port 3306
# Windows
netstat -ano | findstr :3306

# Linux/Mac
lsof -i :3306

# Kill the process or change port in docker-compose.yml to 3307
```

### Problem: Container keeps restarting

**Solution**:
```bash
# Check logs
docker logs studentshub_mysql

# Common issue: .env file not found or incorrect
cat .env | grep DB_

# Recreate container
docker-compose down -v
docker-compose up -d
```

### Problem: Can't connect to database

**Solution**:
```bash
# Verify container is running
docker ps | grep mysql

# Test connection from inside container
docker exec -it studentshub_mysql mysqladmin ping -u studentshub_user -pstudentshub123

# Check .env file
cat .env
```

### Problem: Migrations fail

**Solution**:
```bash
# Option 1: Fake initial migration
python manage.py migrate --fake-initial

# Option 2: Reset database (CAUTION: loses data)
docker-compose down -v
docker-compose up -d
python manage.py migrate

# Option 3: Load from backup
./load.sh
```

## 📝 Post-Migration Notes

### Remember to Update

1. **CI/CD Pipelines**: Update MySQL credentials
2. **Documentation**: Update README with MySQL info
3. **Deployment Scripts**: Use MySQL connection strings
4. **Monitoring**: Set up MySQL-specific monitoring

### Best Practices

- ✅ Always commit `db_backup.sql` after major changes
- ✅ Run `./dump.sh` before making schema changes
- ✅ Test `./load.sh` works before sharing
- ✅ Keep .env file up to date but DON'T commit passwords
- ✅ Use strong passwords in production

## 🎯 Success Criteria

Migration is successful when:

- [x] Docker container runs without errors
- [x] Django connects to MySQL
- [x] All migrations apply successfully
- [x] Admin panel works
- [x] API endpoints respond
- [x] Users can authenticate
- [x] Courses can be created/read
- [x] `./dump.sh` creates backup
- [x] `./load.sh` restores backup
- [x] Team members can replicate setup

## 📚 Documentation Files

After migration, you have:

1. `MYSQL_MIGRATION_SUMMARY.md` - Complete overview
2. `MYSQL_MIGRATION_GUIDE.md` - Detailed guide
3. `MYSQL_QUICKSTART.md` - Quick reference
4. `DATABASE_README.md` - Database setup info
5. This checklist - Action items

## ✅ Final Sign-Off

Once all items are checked:

- [ ] All verification tests pass
- [ ] Django server runs without errors
- [ ] Database operations work
- [ ] Dump/load scripts work
- [ ] Documentation is complete
- [ ] Team is notified
- [ ] Migration is complete! 🎉

---

**Need Help?**
- Check `MYSQL_MIGRATION_GUIDE.md` for detailed troubleshooting
- Review `MYSQL_QUICKSTART.md` for common commands
- Check Docker logs: `docker logs studentshub_mysql`
- Check Django logs: `backend/django.log`
