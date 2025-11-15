#!/usr/bin/env python
"""
Diagnostic script to check media files and URLs
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.conf import settings
from courses.models import SchoolCourse, EngineeringCourse

print("=" * 60)
print("MEDIA CONFIGURATION CHECK")
print("=" * 60)

print(f"\n📁 MEDIA_ROOT: {settings.MEDIA_ROOT}")
print(f"🌐 MEDIA_URL: {settings.MEDIA_URL}")
print(f"🐛 DEBUG: {settings.DEBUG}")

# Check if media directory exists
media_exists = os.path.exists(settings.MEDIA_ROOT)
print(f"\n✅ Media directory exists: {media_exists}")

if media_exists:
    thumbnails_dir = os.path.join(settings.MEDIA_ROOT, 'course_thumbnails')
    if os.path.exists(thumbnails_dir):
        files = os.listdir(thumbnails_dir)
        print(f"📸 Thumbnail files found: {len(files)}")
        print(f"   Sample files: {files[:5]}")
    else:
        print("❌ course_thumbnails directory not found!")

# Check courses with thumbnails
print("\n" + "=" * 60)
print("COURSE THUMBNAIL CHECK")
print("=" * 60)

school_courses = SchoolCourse.objects.filter(thumbnail__isnull=False).exclude(thumbnail='')
eng_courses = EngineeringCourse.objects.filter(thumbnail__isnull=False).exclude(thumbnail='')

print(f"\n📚 School Courses with thumbnails: {school_courses.count()}")
print(f"🎓 Engineering Courses with thumbnails: {eng_courses.count()}")

# Sample course details
print("\n" + "=" * 60)
print("SAMPLE COURSE THUMBNAIL DETAILS")
print("=" * 60)

if school_courses.exists():
    course = school_courses.first()
    print(f"\n🏫 School Course: {course.title}")
    print(f"   Thumbnail field value: {course.thumbnail}")
    print(f"   Thumbnail .name: {course.thumbnail.name if course.thumbnail else 'None'}")
    if course.thumbnail:
        print(f"   Thumbnail .url: {course.thumbnail.url}")
        file_path = os.path.join(settings.MEDIA_ROOT, course.thumbnail.name)
        print(f"   Expected file path: {file_path}")
        print(f"   File exists: {os.path.exists(file_path)}")
        if os.path.exists(file_path):
            size = os.path.getsize(file_path)
            print(f"   File size: {size / 1024:.2f} KB")

if eng_courses.exists():
    course = eng_courses.first()
    print(f"\n🎓 Engineering Course: {course.title}")
    print(f"   Thumbnail field value: {course.thumbnail}")
    print(f"   Thumbnail .name: {course.thumbnail.name if course.thumbnail else 'None'}")
    if course.thumbnail:
        print(f"   Thumbnail .url: {course.thumbnail.url}")
        file_path = os.path.join(settings.MEDIA_ROOT, course.thumbnail.name)
        print(f"   Expected file path: {file_path}")
        print(f"   File exists: {os.path.exists(file_path)}")
        if os.path.exists(file_path):
            size = os.path.getsize(file_path)
            print(f"   File size: {size / 1024:.2f} KB")

# Check for orphaned files
print("\n" + "=" * 60)
print("ORPHANED FILES CHECK")
print("=" * 60)

if os.path.exists(thumbnails_dir):
    all_files = set(os.listdir(thumbnails_dir))
    used_files = set()
    
    for course in school_courses:
        if course.thumbnail:
            used_files.add(os.path.basename(course.thumbnail.name))
    
    for course in eng_courses:
        if course.thumbnail:
            used_files.add(os.path.basename(course.thumbnail.name))
    
    orphaned = all_files - used_files - {'.gitkeep'}
    
    print(f"📁 Total files in directory: {len(all_files)}")
    print(f"🔗 Files referenced in database: {len(used_files)}")
    print(f"🗑️  Orphaned files (not in DB): {len(orphaned)}")
    
    if orphaned:
        print(f"\n   First 10 orphaned files:")
        for i, file in enumerate(list(orphaned)[:10], 1):
            print(f"   {i}. {file}")

print("\n" + "=" * 60)
print("RECOMMENDATIONS")
print("=" * 60)

if not media_exists:
    print("❌ CRITICAL: Media directory does not exist!")
    print("   Run: mkdir -p", settings.MEDIA_ROOT)
elif not os.path.exists(thumbnails_dir):
    print("❌ CRITICAL: course_thumbnails directory missing!")
    print("   Run: mkdir -p", thumbnails_dir)
else:
    print("✅ Media directory structure is correct")

if school_courses.count() == 0 and eng_courses.count() == 0:
    print("⚠️  WARNING: No courses have thumbnails assigned")
    print("   Ensure thumbnail field is being saved when creating courses")
else:
    print(f"✅ {school_courses.count() + eng_courses.count()} courses have thumbnails")

print("\n🔍 To test media serving, try accessing:")
if school_courses.exists() and school_courses.first().thumbnail:
    sample_url = school_courses.first().thumbnail.url
    print(f"   http://localhost:8000{sample_url}")
    
print("\n" + "=" * 60)
