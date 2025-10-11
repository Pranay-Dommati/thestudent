# 🔧 DATABASE CONNECTION ISSUE - FIX REQUIRED

## Problem Identified ✅

Your `.env` was configured for **PostgreSQL**, but your application needs **MySQL (Hostinger)**.

The 404 errors are happening because:
1. The backend is trying to connect to a non-existent PostgreSQL database
2. Without database connection, Django can't find the course records
3. This causes 404 errors for enrollment endpoints

---

## ⚠️ CRITICAL: Update Database Credentials

I've updated your `.env` file to use MySQL, but you **MUST** add your actual Hostinger MySQL credentials:

### Step 1: Get Your Hostinger MySQL Credentials

Log in to your Hostinger panel and find:
- Database name
- Database username  
- Database password
- Database host (usually your domain or IP)

### Step 2: Update `.env` File

Open: `backend/.env`

Update these lines with your ACTUAL credentials:
```env
DB_ENGINE=mysql
DB_NAME=your_actual_database_name
DB_USER=your_actual_database_user
DB_PASSWORD=your_actual_database_password
DB_HOST=your_hostinger_mysql_host  # e.g., mysql123.hostname.com or IP
DB_PORT=3306
DB_SSL_REQUIRE=false  # Set to true if Hostinger requires SSL
```

### Example (Replace with YOUR values):
```env
DB_ENGINE=mysql
DB_NAME=u123456789_studentshub
DB_USER=u123456789_student
DB_PASSWORD=YourActualPassword123!
DB_HOST=sql123.hostname.com
DB_PORT=3306
DB_SSL_REQUIRE=false
```

---

## 🔄 After Updating Credentials

### 1. Test Database Connection

Run this in a NEW terminal:
```bash
cd c:/Users/Irfan/Desktop/EasyLearnova/thestudent/backend
python manage.py check --database default
```

This will verify if Django can connect to your MySQL database.

### 2. Run Migrations (if needed)

If the database is empty, run:
```bash
python manage.py migrate
```

### 3. Restart Django Server

In a NEW dedicated terminal:
```bash
cd c:/Users/Irfan/Desktop/EasyLearnova/thestudent/backend
python manage.py runserver 0.0.0.0:8000
```

---

## 📋 Why This Matters

**Without correct database credentials:**
- ❌ Django can't connect to MySQL
- ❌ Can't fetch course data
- ❌ All API endpoints return 404 or 500 errors
- ❌ Enrollment endpoints don't work

**With correct credentials:**
- ✅ Django connects to Hostinger MySQL
- ✅ Can fetch course data
- ✅ All API endpoints work
- ✅ Enrollment functionality works

---

## 🔍 Common Hostinger MySQL Settings

If you're not sure about the host, try these common patterns:

### Remote Access (most common):
```env
DB_HOST=mysqlXXX.hostname.com  # Check Hostinger panel for exact host
```

### Localhost (if on Hostinger server):
```env
DB_HOST=localhost
```

### IP Address:
```env
DB_HOST=123.456.789.0  # Your actual server IP
```

---

## ⚠️ Important Notes

1. **Never use PostgreSQL settings** (DB_HOST=db, DB_PORT=5432) for MySQL
2. **Get exact credentials** from Hostinger panel
3. **Enable remote MySQL access** in Hostinger if connecting remotely
4. **Test connection** before starting server

---

## 🆘 Next Steps

1. ✅ Get your Hostinger MySQL credentials
2. ✅ Update `.env` with real values
3. ✅ Test connection: `python manage.py check --database default`
4. ✅ Restart server in NEW terminal
5. ✅ Test your application

Once you have the correct credentials, your 404 errors will be fixed! 🚀
