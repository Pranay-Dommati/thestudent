# Debug Load.sh Issue

## For Varun: Manual Test to See Real Error

Run these commands one by one to see what's happening:

```bash
# 1. Check if file was copied to container
docker exec studentshub_mysql ls -lh /tmp/db_backup.sql

# 2. Check first few lines of the SQL file inside container
docker exec studentshub_mysql head -n 20 /tmp/db_backup.sql

# 3. Try restore manually and see FULL error (remove grep filter)
docker exec studentshub_mysql bash -c "mysql -u studentshub_user -pstudentshub_pass studentshub_db < /tmp/db_backup.sql"

# 4. Check if any tables were created
docker exec studentshub_mysql mysql -u studentshub_user -pstudentshub_pass studentshub_db -e "SHOW TABLES;"

# 5. Check database exists
docker exec studentshub_mysql mysql -u root -prootpass123 -e "SHOW DATABASES;"
```

## Expected vs Actual

**Expected after step 3:**
- Should show warnings but complete
- No ERROR messages

**Expected after step 4:**
- Should show list of tables including `courses_engineeringcourse`

**If you see:**
- "Access denied" → Password mismatch in .env
- "Unknown database" → Database wasn't created
- "ERROR at line X" → SQL file has syntax errors or is corrupt
- Empty table list → Restore command isn't reading the file

## Common Issues

### Issue 1: Wrong Password in .env
Your `.env` might have different password than mine.

**Check:**
```bash
grep DB_PASSWORD .env
```

**Should match what's in docker-compose.yml**

### Issue 2: File Path Issue in Git Bash
Git Bash on Windows sometimes has path conversion issues.

**Try:**
```bash
MSYS_NO_PATHCONV=1 docker cp db_backup.sql studentshub_mysql:/tmp/db_backup.sql
MSYS_NO_PATHCONV=1 docker exec studentshub_mysql mysql -u studentshub_user -pstudentshub_pass studentshub_db -e "source /tmp/db_backup.sql"
```

### Issue 3: SQL File is Corrupted
**Check file size:**
```bash
ls -lh db_backup.sql
```

Should be around 940-970 KB. If it's much smaller or different, re-pull from Git.

### Issue 4: Line Ending Issues (Windows)
Git might have converted LF to CRLF in the SQL file.

**Check:**
```bash
file db_backup.sql
```

If it says "with CRLF line terminators", that's the problem.

**Fix in .gitattributes:**
```
*.sql text eol=lf
```

Then re-download the file.

## Report Back

Please run the manual test commands above and share:
1. What you see in step 3 (full error output)
2. What you see in step 4 (table list)
3. Output of `cat .env | grep DB_`

This will tell us exactly what's wrong.
