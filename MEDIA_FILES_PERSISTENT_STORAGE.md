# Course Thumbnails Keep Disappearing - Solution Guide

## Problem
Course thumbnail images are stored in `backend/media/course_thumbnails/` but they keep disappearing when:
- Server restarts
- Deploying to production (Hostinger)
- Database is migrated/restored

## Root Cause
The current setup stores images in the **local filesystem** (`backend/media/`), which has several issues:

1. **Not Persistent**: When deploying or restarting containers, the media folder can be lost
2. **No Backup**: Media files are not included in database backups
3. **Single Server**: Doesn't work well with load balancers or multiple servers
4. **Hostinger Issues**: Shared hosting can have file permission issues

## Current Configuration

### Settings (`backend/backend/settings.py`)
```python
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
```

### URL Configuration (`backend/backend/urls.py`)
```python
# Development
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# Production
if not settings.DEBUG:
    urlpatterns += [
        re_path(r'^media/(?P<path>.*)$', static_serve, {'document_root': settings.MEDIA_ROOT}),
    ]
```

## Solutions (Choose One)

### Option 1: Cloud Storage (RECOMMENDED) ⭐

Use AWS S3, Cloudinary, or similar for persistent storage.

#### Using Cloudinary (Free tier available)

1. **Install Dependencies**
```bash
pip install django-cloudinary-storage
```

2. **Update `settings.py`**
```python
INSTALLED_APPS = [
    # ...
    'cloudinary_storage',
    'cloudinary',
    # ...
]

# Cloudinary Configuration
CLOUDINARY_STORAGE = {
    'CLOUD_NAME': os.environ.get('CLOUDINARY_CLOUD_NAME', ''),
    'API_KEY': os.environ.get('CLOUDINARY_API_KEY', ''),
    'API_SECRET': os.environ.get('CLOUDINARY_API_SECRET', ''),
}

# Use Cloudinary for media files
DEFAULT_FILE_STORAGE = 'cloudinary_storage.storage.MediaCloudinaryStorage'
```

3. **Update `.env`**
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

4. **Benefits**
- ✅ Images never disappear
- ✅ Fast CDN delivery
- ✅ Automatic image optimization
- ✅ Free tier: 25GB storage, 25GB bandwidth/month
- ✅ Works with any hosting provider

#### Using AWS S3

1. **Install Dependencies**
```bash
pip install boto3 django-storages
```

2. **Update `settings.py`**
```python
INSTALLED_APPS = [
    # ...
    'storages',
    # ...
]

# AWS S3 Configuration
AWS_ACCESS_KEY_ID = os.environ.get('AWS_ACCESS_KEY_ID')
AWS_SECRET_ACCESS_KEY = os.environ.get('AWS_SECRET_ACCESS_KEY')
AWS_STORAGE_BUCKET_NAME = os.environ.get('AWS_STORAGE_BUCKET_NAME')
AWS_S3_REGION_NAME = os.environ.get('AWS_S3_REGION_NAME', 'us-east-1')
AWS_S3_CUSTOM_DOMAIN = f'{AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com'
AWS_S3_FILE_OVERWRITE = False
AWS_DEFAULT_ACL = 'public-read'

# S3 for media files
DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
MEDIA_URL = f'https://{AWS_S3_CUSTOM_DOMAIN}/media/'
```

### Option 2: Database Storage (Quick Fix)

Store images as Base64 in the database (not recommended for production).

**Pros**: Simple, no external dependencies
**Cons**: Database bloat, slower performance, not scalable

```python
# In models.py
class BaseCourse(models.Model):
    # Change from ImageField to TextField
    thumbnail = models.TextField(blank=True, null=True)  # Store Base64
```

### Option 3: Ensure Media Folder Persistence (Temporary Fix)

For Hostinger or VPS deployment:

1. **Create `.gitkeep` in media folders**
```bash
cd backend/media/course_thumbnails
touch .gitkeep
git add -f .gitkeep
```

2. **Update `.gitignore`** (keep structure but not files)
```
# Keep media folders but ignore content
media/*
!media/.gitkeep
!media/course_thumbnails/
media/course_thumbnails/*
!media/course_thumbnails/.gitkeep
```

3. **Backup Media Files Separately**
```bash
# Create backup script
tar -czf media_backup_$(date +%Y%m%d).tar.gz backend/media/
```

4. **On Hostinger**: Ensure media folder permissions
```bash
chmod -R 755 backend/media
chown -R <your_user>:<your_group> backend/media
```

### Option 4: Use External Image URLs

Instead of uploading images, use external URLs (Unsplash, Pexels).

**Update Course Creation to Use External URLs:**

```python
# In course creation form
thumbnail_url = f"https://source.unsplash.com/800x450/?{course_subject}"
```

**Frontend Changes:**
```jsx
// Instead of file upload, use URL input
<input 
  type="url" 
  placeholder="https://images.unsplash.com/..."
  value={thumbnailUrl}
  onChange={(e) => setThumbnailUrl(e.target.value)}
/>
```

## Recommended Implementation Plan

### Phase 1: Immediate Fix (Today)
1. Set up Cloudinary account (free)
2. Install `django-cloudinary-storage`
3. Update settings with Cloudinary credentials
4. Test with one new course

### Phase 2: Migration (This Week)
1. Create script to migrate existing thumbnails to Cloudinary
2. Update all existing course records with new URLs
3. Test thoroughly

### Phase 3: Cleanup (Next Week)
1. Remove local media files
2. Update documentation
3. Monitor for issues

## Migration Script (Cloudinary)

Create `backend/migrate_media_to_cloudinary.py`:

```python
import os
import django
import cloudinary
import cloudinary.uploader

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from courses.models import SchoolCourse, EngineeringCourse

def migrate_thumbnails():
    # Configure Cloudinary
    cloudinary.config(
        cloud_name=os.environ.get('CLOUDINARY_CLOUD_NAME'),
        api_key=os.environ.get('CLOUDINARY_API_KEY'),
        api_secret=os.environ.get('CLOUDINARY_API_SECRET')
    )
    
    # Migrate School Courses
    for course in SchoolCourse.objects.filter(thumbnail__isnull=False):
        if course.thumbnail:
            try:
                # Upload to Cloudinary
                result = cloudinary.uploader.upload(
                    course.thumbnail.path,
                    folder='course_thumbnails',
                    public_id=f'school_{course.id}'
                )
                
                # Update course with Cloudinary URL
                course.thumbnail = result['secure_url']
                course.save()
                print(f"✅ Migrated: {course.title}")
            except Exception as e:
                print(f"❌ Failed: {course.title} - {e}")
    
    # Migrate Engineering Courses
    for course in EngineeringCourse.objects.filter(thumbnail__isnull=False):
        if course.thumbnail:
            try:
                result = cloudinary.uploader.upload(
                    course.thumbnail.path,
                    folder='course_thumbnails',
                    public_id=f'engineering_{course.id}'
                )
                
                course.thumbnail = result['secure_url']
                course.save()
                print(f"✅ Migrated: {course.title}")
            except Exception as e:
                print(f"❌ Failed: {course.title} - {e}")

if __name__ == '__main__':
    migrate_thumbnails()
```

Run with:
```bash
cd backend
python migrate_media_to_cloudinary.py
```

## Verification Checklist

After implementing the solution:

- [ ] Create new course with thumbnail
- [ ] Restart server
- [ ] Verify thumbnail still displays
- [ ] Deploy to staging/production
- [ ] Verify thumbnail displays in production
- [ ] Check browser network tab for 404 errors
- [ ] Test on mobile devices
- [ ] Verify all existing courses show thumbnails

## Hostinger-Specific Notes

If staying with local file storage on Hostinger:

1. **Persistent Storage Location**: Use persistent volume
   ```python
   MEDIA_ROOT = '/home/<username>/persistent/media'
   ```

2. **Permissions**: Ensure web server can read/write
   ```bash
   chmod -R 755 /home/<username>/persistent/media
   ```

3. **Backup Schedule**: Set up cron job
   ```bash
   0 2 * * * tar -czf ~/backups/media_$(date +\%Y\%m\%d).tar.gz ~/persistent/media
   ```

## Contact

For issues or questions:
- Check Django logs: `backend/django.log`
- Check media folder permissions
- Verify MEDIA_URL and MEDIA_ROOT settings
- Test with `python manage.py shell`:
  ```python
  from courses.models import SchoolCourse
  course = SchoolCourse.objects.first()
  print(course.thumbnail.url)  # Should print valid URL
  ```
