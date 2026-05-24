"""
Migration: Ensure CourseChapter.id is AUTO_INCREMENT in MySQL

Fixes MySQL error (1364, "Field 'id' doesn't have a default value") when
creating SchoolCourse chapters (affects Class 11/12 flow) by explicitly
adding AUTO_INCREMENT to courses_coursechapter.id. Similar to 0012 migration
for CourseSection.
"""

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('courses', '0015_alter_certification_certificate_id'),
    ]

    operations = [
        migrations.RunSQL(
            sql=[
                # 1) Drop existing FK from courses_lesson.chapter_id to courses_coursechapter(id)
                "SET @fk_name := (SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE "
                "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'courses_lesson' AND COLUMN_NAME = 'chapter_id' "
                "AND REFERENCED_TABLE_NAME = 'courses_coursechapter' LIMIT 1);",
                "SET @drop_sql := IF(@fk_name IS NOT NULL, CONCAT('ALTER TABLE courses_lesson DROP FOREIGN KEY ', @fk_name, ';'), NULL);",
                "SET @s := IF(@drop_sql IS NOT NULL, @drop_sql, 'SELECT 1');",
                "PREPARE stmt FROM @s;",
                "EXECUTE stmt;",
                "DEALLOCATE PREPARE stmt;",

                # 2) Align column types as INT (to match prior inconsistent schemas on some hosts)
                "ALTER TABLE courses_lesson MODIFY COLUMN chapter_id INT NULL;",
                "ALTER TABLE courses_coursechapter MODIFY COLUMN id INT NOT NULL AUTO_INCREMENT;",

                # 3) Recreate the FK with a stable name and ON DELETE CASCADE
                "ALTER TABLE courses_lesson "
                "ADD CONSTRAINT courses_lesson_chapter_id_fk FOREIGN KEY (chapter_id) "
                "REFERENCES courses_coursechapter(id) ON DELETE CASCADE;",
            ],
            reverse_sql=[
                # Reverse: drop our named FK, remove AUTO_INCREMENT flag (keep INT), then try to restore implicit FK
                "ALTER TABLE courses_lesson DROP FOREIGN KEY IF EXISTS courses_lesson_chapter_id_fk;",
                "ALTER TABLE courses_coursechapter MODIFY COLUMN id INT;",
                "ALTER TABLE courses_lesson ADD FOREIGN KEY (chapter_id) REFERENCES courses_coursechapter(id);",
            ],
        ),
    ]
