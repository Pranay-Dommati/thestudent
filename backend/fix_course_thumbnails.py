#!/usr/bin/env python
"""
Fix missing course thumbnails by:
1. Identifying courses with broken thumbnail references
2. Assigning fallback placeholder images
3. Optionally cleaning up orphaned files
"""
import os
import django
import shutil
from pathlib import Path

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.conf import settings
from django.core.files import File
from courses.models import SchoolCourse, EngineeringCourse

print("=" * 70)
print("COURSE THUMBNAIL REPAIR SCRIPT")
print("=" * 70)

def fix_missing_thumbnails():
    """Find courses with missing thumbnail files and fix them"""
    
    fixed_count = 0
    missing_count = 0
    
    # Check School Courses
    print("\n🏫 Checking School Courses...")
    for course in SchoolCourse.objects.all():
        if course.thumbnail:
            file_path = os.path.join(settings.MEDIA_ROOT, course.thumbnail.name)
            if not os.path.exists(file_path):
                print(f"   ❌ Missing: {course.title}")
                print(f"      Expected: {file_path}")
                missing_count += 1
                
                # Option 1: Clear the thumbnail field
                course.thumbnail = None
                course.save()
                print(f"      ✅ Cleared broken thumbnail reference")
                fixed_count += 1
                
                # Option 2: Assign a default placeholder (uncomment if you have one)
                # default_thumb = 'course_thumbnails/default_school.jpg'
                # if os.path.exists(os.path.join(settings.MEDIA_ROOT, default_thumb)):
                #     course.thumbnail = default_thumb
                #     course.save()
                #     print(f"      ✅ Assigned default thumbnail")
                #     fixed_count += 1
    
    # Check Engineering Courses
    print("\n🎓 Checking Engineering Courses...")
    for course in EngineeringCourse.objects.all():
        if course.thumbnail:
            file_path = os.path.join(settings.MEDIA_ROOT, course.thumbnail.name)
            if not os.path.exists(file_path):
                print(f"   ❌ Missing: {course.title}")
                print(f"      Expected: {file_path}")
                missing_count += 1
                
                course.thumbnail = None
                course.save()
                print(f"      ✅ Cleared broken thumbnail reference")
                fixed_count += 1
    
    return fixed_count, missing_count

def list_orphaned_files():
    """List files in media folder that aren't referenced by any course"""
    
    thumbnails_dir = os.path.join(settings.MEDIA_ROOT, 'course_thumbnails')
    if not os.path.exists(thumbnails_dir):
        print("❌ Thumbnails directory doesn't exist!")
        return []
    
    all_files = set(os.listdir(thumbnails_dir))
    used_files = set()
    
    # Get all referenced thumbnails
    for course in SchoolCourse.objects.filter(thumbnail__isnull=False).exclude(thumbnail=''):
        if course.thumbnail:
            used_files.add(os.path.basename(course.thumbnail.name))
    
    for course in EngineeringCourse.objects.filter(thumbnail__isnull=False).exclude(thumbnail=''):
        if course.thumbnail:
            used_files.add(os.path.basename(course.thumbnail.name))
    
    orphaned = all_files - used_files - {'.gitkeep'}
    return orphaned

def cleanup_orphaned_files(dry_run=True):
    """Remove orphaned thumbnail files"""
    
    orphaned = list_orphaned_files()
    thumbnails_dir = os.path.join(settings.MEDIA_ROOT, 'course_thumbnails')
    
    if not orphaned:
        print("\n✅ No orphaned files found!")
        return 0
    
    print(f"\n🗑️  Found {len(orphaned)} orphaned files")
    
    if dry_run:
        print("\n🔍 DRY RUN - Files that would be deleted:")
        for i, file in enumerate(list(orphaned)[:20], 1):
            file_path = os.path.join(thumbnails_dir, file)
            size = os.path.getsize(file_path) / 1024
            print(f"   {i}. {file} ({size:.2f} KB)")
        
        if len(orphaned) > 20:
            print(f"   ... and {len(orphaned) - 20} more files")
        
        total_size = sum(os.path.getsize(os.path.join(thumbnails_dir, f)) for f in orphaned) / (1024 * 1024)
        print(f"\n   Total space to be freed: {total_size:.2f} MB")
        print("\n   To actually delete these files, run:")
        print("   python backend/fix_course_thumbnails.py --cleanup")
    else:
        deleted_count = 0
        for file in orphaned:
            file_path = os.path.join(thumbnails_dir, file)
            try:
                os.remove(file_path)
                deleted_count += 1
            except Exception as e:
                print(f"   ❌ Failed to delete {file}: {e}")
        
        print(f"\n✅ Deleted {deleted_count} orphaned files")
    
    return len(orphaned)

def create_default_thumbnails():
    """Create default placeholder thumbnails if they don't exist"""
    
    thumbnails_dir = Path(settings.MEDIA_ROOT) / 'course_thumbnails'
    thumbnails_dir.mkdir(parents=True, exist_ok=True)
    
    defaults = {
        'default_school.jpg': 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb',
        'default_engineering.jpg': 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97',
    }
    
    print("\n📸 Checking for default thumbnails...")
    for filename, url in defaults.items():
        filepath = thumbnails_dir / filename
        if not filepath.exists():
            print(f"   ℹ️  {filename} not found - you can download from:")
            print(f"      {url}")
        else:
            print(f"   ✅ {filename} exists")

if __name__ == '__main__':
    import sys
    
    # Fix missing thumbnails
    fixed, missing = fix_missing_thumbnails()
    
    print("\n" + "=" * 70)
    print("SUMMARY")
    print("=" * 70)
    print(f"❌ Courses with missing thumbnails: {missing}")
    print(f"✅ Fixed thumbnail references: {fixed}")
    
    # List orphaned files
    orphaned_count = cleanup_orphaned_files(dry_run='--cleanup' not in sys.argv)
    
    # Create default thumbnails
    create_default_thumbnails()
    
    print("\n" + "=" * 70)
    print("NEXT STEPS")
    print("=" * 70)
    print("1. ✅ Fixed courses with broken thumbnail references")
    print("2. 📸 For courses without thumbnails, use frontend to upload new ones")
    print("3. 🗑️  To clean up orphaned files, run:")
    print("   python backend/fix_course_thumbnails.py --cleanup")
    print("\n" + "=" * 70)
