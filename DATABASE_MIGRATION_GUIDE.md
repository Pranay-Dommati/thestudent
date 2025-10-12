# DATABASE MIGRATION GUIDE
## Local MySQL → Remote Hostinger MySQL

## 📋 Overview
This guide explains how to migrate data from your local MySQL Docker container to the remote Hostinger MySQL database.

---

## 🎯 Migration Options

### Option 1: Django-Based Migration (Recommended)
**Best for:** When you want Django to handle the migration

**Pros:**
- ✅ Works with Django models
- ✅ Handles relationships automatically
- ✅ Can migrate specific apps/models
- ✅ Platform independent

**Cons:**
- ⚠️ Slower for large databases
- ⚠️ Requires Django setup

**Steps:**

1. **Ensure local database is configured**
   ```bash
   # In .env file - should point to LOCAL database
   DB_HOST=localhost
   DB_NAME=easylearnovadb
   DB_USER=root
   DB_PASSWORD=your_local_password
   ```

2. **Export data from local database**
   ```bash
   cd backend
   python manage.py dumpdata --natural-foreign --natural-primary --indent 2 > ../local_data_backup.json
   ```

3. **Or use the automated script**
   ```bash
   python migrate_local_to_remote.py
   ```
   This will create:
   - `local_data_backup.json` (all data)
   - `courses_backup.json` (courses only)
   - `users_backup.json` (users only)

4. **Switch to remote database**
   ```bash
   # In .env file - change to REMOTE database
   DB_HOST=srv1990.hstgr.io
   DB_NAME=u787111463_easylearnovadb
   DB_USER=u787111463_teamlearnova
   DB_PASSWORD=EasyLearnova@pranay.23
   ```

5. **Run migrations on remote database**
   ```bash
   cd backend
   python manage.py migrate
   ```

6. **Import data to remote database**
   ```bash
   python manage.py loaddata ../local_data_backup.json
   ```

7. **Verify the migration**
   ```bash
   python manage.py shell -c "
   from courses.models import SchoolCourse, EngineeringCourse
   print(f'School Courses: {SchoolCourse.objects.count()}')
   print(f'Engineering Courses: {EngineeringCourse.objects.count()}')
   "
   ```

---

### Option 2: Direct MySQL Migration (Faster)
**Best for:** Full database copy with all data

**Pros:**
- ✅ Very fast
- ✅ Complete database copy
- ✅ Preserves all MySQL-specific features

**Cons:**
- ⚠️ Requires MySQL client tools
- ⚠️ All-or-nothing approach

**Steps:**

1. **Install MySQL client tools** (if not already installed)
   - Windows: [Download MySQL Installer](https://dev.mysql.com/downloads/installer/)
   - Or use Git Bash with MySQL in PATH

2. **Update the script with your LOCAL database credentials**
   Edit `migrate_mysql_direct.py` lines 11-15:
   ```python
   LOCAL_HOST = "localhost"
   LOCAL_DB = "easylearnovadb"
   LOCAL_USER = "root"
   LOCAL_PASSWORD = "your_local_password"
   ```

3. **Run the migration script**
   ```bash
   python migrate_mysql_direct.py
   ```

4. **Or manually with mysqldump**
   ```bash
   # Export from local
   mysqldump -h localhost -u root -p easylearnovadb > backup.sql

   # Import to remote
   mysql -h srv1990.hstgr.io -u u787111463_teamlearnova -p u787111463_easylearnovadb < backup.sql
   ```

---

### Option 3: Manual Table-by-Table Migration
**Best for:** Migrating specific tables or selective data

**Steps:**

1. **Export specific tables**
   ```bash
   # Export courses
   cd backend
   python manage.py dumpdata courses --indent 2 > courses_backup.json

   # Export users
   python manage.py dumpdata authentication --indent 2 > users_backup.json
   ```

2. **Switch to remote database in .env**

3. **Import specific tables**
   ```bash
   python manage.py loaddata courses_backup.json
   python manage.py loaddata users_backup.json
   ```

---

## 🔍 Verification Steps

After migration, verify the data:

```bash
# Check database connection
python manage.py dbshell

# In MySQL shell:
SHOW TABLES;
SELECT COUNT(*) FROM courses_schoolcourse;
SELECT COUNT(*) FROM courses_engineeringcourse;
SELECT COUNT(*) FROM authentication_user;
```

Or use Django:

```bash
python manage.py shell -c "
from courses.models import SchoolCourse, EngineeringCourse
from authentication.models import User

print('📊 Database Statistics:')
print(f'  School Courses: {SchoolCourse.objects.count()}')
print(f'  Engineering Courses: {EngineeringCourse.objects.count()}')
print(f'  Users: {User.objects.count()}')

# Show some sample data
print('\n📚 Sample School Courses:')
for course in SchoolCourse.objects.all()[:3]:
    print(f'  - {course.title}')
"
```

---

## ⚠️ Important Considerations

### Before Migration:
- [ ] **Backup remote database** (just in case)
- [ ] **Verify local data** is complete and correct
- [ ] **Check disk space** on remote server
- [ ] **Test connection** to remote database

### During Migration:
- [ ] **Don't interrupt** the process
- [ ] **Monitor for errors** in console output
- [ ] **Check network stability** if using direct MySQL migration

### After Migration:
- [ ] **Verify all data** was migrated
- [ ] **Test application** with remote database
- [ ] **Update .env** to point to remote permanently
- [ ] **Restart Django server** to use new database
- [ ] **Keep backup files** safe

---

## 🐛 Troubleshooting

### Error: "Authentication failed"
**Solution:** Check database credentials in .env file

### Error: "Table doesn't exist"
**Solution:** Run `python manage.py migrate` on remote database first

### Error: "Duplicate entry"
**Solution:** Remote database already has data. Either:
- Clear remote database first
- Use `--ignore` flag with loaddata
- Manually resolve conflicts

### Error: "Connection timeout"
**Solution:**
- Check internet connection
- Verify remote host allows your IP
- Try increasing timeout in database settings

### Slow migration
**Solution:**
- Use direct MySQL migration instead
- Split into smaller chunks
- Use `--database-transactions` flag

---

## 📝 Migration Checklist

```
□ Step 1: Backup local database
□ Step 2: Verify local data exists
□ Step 3: Export local data (choose a method)
□ Step 4: Update .env to remote database
□ Step 5: Run migrations on remote
□ Step 6: Import data to remote
□ Step 7: Verify data integrity
□ Step 8: Test application
□ Step 9: Update production .env
□ Step 10: Keep backups safe
```

---

## 🎯 Quick Start (Most Common)

For most users, this is the fastest way:

```bash
# 1. Export from local
cd C:/Users/banny/OneDrive/Documents/Desktop/easylearnva-deployment/thestudent
python migrate_local_to_remote.py

# 2. Change .env to remote database
# Edit .env: Set DB_HOST=srv1990.hstgr.io

# 3. Migrate remote database schema
cd backend
python manage.py migrate

# 4. Import data
python manage.py loaddata ../local_data_backup.json

# 5. Verify
python manage.py shell -c "from courses.models import *; print(f'Courses: {SchoolCourse.objects.count()}')"
```

---

## 📞 Need Help?

If you encounter issues:
1. Check the error message carefully
2. Verify database credentials
3. Ensure migrations are up to date
4. Check network connectivity
5. Review Django logs for details

Common commands for debugging:
```bash
# Test database connection
python manage.py dbshell

# Check migration status
python manage.py showmigrations

# View database configuration
python manage.py shell -c "from django.conf import settings; print(settings.DATABASES)"
```