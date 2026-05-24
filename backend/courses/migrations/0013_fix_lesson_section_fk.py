# Fix Lesson.section_id column type and restore FK constraint
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('courses', '0012_fix_coursesection_id_autoincrement'),
    ]

    operations = [
        migrations.RunSQL(
            sql=[
                # First, set any existing section_id values to NULL if they're invalid
                "UPDATE courses_lesson SET section_id = NULL WHERE section_id IS NOT NULL AND section_id NOT REGEXP '^[0-9]+$';",
                
                # Change section_id from CHAR(36) to INT to match courses_coursesection.id
                "ALTER TABLE courses_lesson MODIFY COLUMN section_id INT NULL;",
                
                # Add the foreign key constraint
                """ALTER TABLE courses_lesson 
                   ADD CONSTRAINT courses_lesson_section_id_fk 
                   FOREIGN KEY (section_id) 
                   REFERENCES courses_coursesection(id) 
                   ON DELETE CASCADE;""",
            ],
            reverse_sql=[
                # Remove FK constraint
                "ALTER TABLE courses_lesson DROP FOREIGN KEY IF EXISTS courses_lesson_section_id_fk;",
                # Revert back to CHAR(36)
                "ALTER TABLE courses_lesson MODIFY COLUMN section_id CHAR(36) NULL;",
            ]
        ),
    ]
