# Generated migration to fix CourseSection id AUTO_INCREMENT in MySQL
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('courses', '0011_delete_coursedraft'),
    ]

    operations = [
        migrations.RunSQL(
            sql=[
                # Temporarily disable foreign key checks
                "SET FOREIGN_KEY_CHECKS=0;",
                
                # Modify the id column to add AUTO_INCREMENT
                "ALTER TABLE courses_coursesection MODIFY COLUMN id INT AUTO_INCREMENT;",
                
                # Re-enable foreign key checks
                "SET FOREIGN_KEY_CHECKS=1;",
            ],
            reverse_sql=[
                "SET FOREIGN_KEY_CHECKS=0;",
                "ALTER TABLE courses_coursesection MODIFY COLUMN id INT;",
                "SET FOREIGN_KEY_CHECKS=1;",
            ]
        ),
    ]
