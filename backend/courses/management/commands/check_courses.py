"""
Management command to check course data in the database
Usage: python manage.py check_courses
"""
from django.core.management.base import BaseCommand
from courses.models import SchoolCourse, EngineeringCourse


class Command(BaseCommand):
    help = 'Check and display courses in the database'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('\n' + '='*80))
        self.stdout.write(self.style.SUCCESS('DATABASE COURSE CHECK'))
        self.stdout.write(self.style.SUCCESS('='*80 + '\n'))

        # Check School Courses
        school_courses = SchoolCourse.objects.all()
        school_count = school_courses.count()
        
        self.stdout.write(self.style.WARNING(f'📚 SCHOOL COURSES: {school_count} found'))
        self.stdout.write('-' * 80)
        
        if school_count > 0:
            for idx, course in enumerate(school_courses[:10], 1):  # Show first 10
                self.stdout.write(f'{idx}. ID: {course.id}')
                self.stdout.write(f'   Title: {course.title}')
                self.stdout.write(f'   Class: {course.class_field}')
                self.stdout.write(f'   Board: {course.board}')
                self.stdout.write(f'   Subject: {course.subject}')
                self.stdout.write('')
            
            if school_count > 10:
                self.stdout.write(self.style.NOTICE(f'   ... and {school_count - 10} more school courses'))
        else:
            self.stdout.write(self.style.ERROR('   ❌ No school courses found in database!'))
        
        self.stdout.write('')

        # Check Engineering Courses
        eng_courses = EngineeringCourse.objects.all()
        eng_count = eng_courses.count()
        
        self.stdout.write(self.style.WARNING(f'🎓 ENGINEERING COURSES: {eng_count} found'))
        self.stdout.write('-' * 80)
        
        if eng_count > 0:
            for idx, course in enumerate(eng_courses[:10], 1):  # Show first 10
                self.stdout.write(f'{idx}. ID: {course.id}')
                self.stdout.write(f'   Title: {course.title}')
                self.stdout.write(f'   Category: {getattr(course, "category", "N/A")}')
                self.stdout.write(f'   Duration: {getattr(course, "duration", "N/A")}')
                self.stdout.write('')
            
            if eng_count > 10:
                self.stdout.write(self.style.NOTICE(f'   ... and {eng_count - 10} more engineering courses'))
        else:
            self.stdout.write(self.style.ERROR('   ❌ No engineering courses found in database!'))

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('='*80))
        self.stdout.write(self.style.SUCCESS(f'TOTAL: {school_count + eng_count} courses in database'))
        self.stdout.write(self.style.SUCCESS('='*80))
        self.stdout.write('')

        # Provide guidance if no courses
        if school_count == 0 and eng_count == 0:
            self.stdout.write(self.style.ERROR('⚠️  DATABASE IS EMPTY!'))
            self.stdout.write('')
            self.stdout.write(self.style.NOTICE('To populate the database, run:'))
            self.stdout.write(self.style.NOTICE('  python manage.py create_sample_courses'))
            self.stdout.write(self.style.NOTICE('OR import data from production'))
