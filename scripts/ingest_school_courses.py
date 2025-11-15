#!/usr/bin/env python3
"""
Ingest School courses into the database (Hostinger MySQL supported)

Supports JSON (nested with chapters/lessons) and CSV (courses-only) inputs.

JSON schema (recommended):
{
  "courses": [
    {
      "id": "optional uuid",
      "title": "6th Mathematics - CBSE",
      "short_description": "...",
      "description": "...",
      "duration": "50",
      "is_published": true,
      "class_level": "6th",
      "board": "cbse|state|icse",
      "state": "optional for state board",
      "subject": "Mathematics",
      "sources": "NCERT; ...",
      "key_topics": ["..."],
      "learning_points": ["..."],
      "chapters": [
        {"name": "Number System", "order": 1, "lessons": [
          {"title": "Integers", "type": "video|article|quiz|resources", "order": 1, "description": "...", "about_lesson": "..."}
        ]}
      ]
    }
  ]
}

CSV (simple courses list): columns = title,short_description,description,duration,is_published,class_level,board,state,subject,sources,key_topics,learning_points
Where key_topics and learning_points are semicolon-separated lists. This mode does NOT import chapters/lessons.
"""

import argparse
import csv
import json
import os
import sys
from typing import Any, Dict, List

# Configure Django
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND_DIR = os.path.join(ROOT_DIR, 'backend')
sys.path.insert(0, ROOT_DIR)
sys.path.insert(0, BACKEND_DIR)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

import django  # type: ignore
django.setup()

from django.db import transaction
from courses.models import SchoolCourse, CourseChapter, Lesson  # type: ignore


def _to_bool(v: Any) -> bool:
    if isinstance(v, bool):
        return v
    if v is None:
        return False
    return str(v).strip().lower() in {"1", "true", "yes", "y"}


def _split_list(v: Any) -> List[str]:
    if v is None:
        return []
    if isinstance(v, list):
        return v
    return [s.strip() for s in str(v).split(';') if str(s).strip()]


def load_json(path: str) -> Dict[str, Any]:
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


def load_csv_courses(path: str) -> Dict[str, Any]:
    courses: List[Dict[str, Any]] = []
    with open(path, 'r', encoding='utf-8-sig', newline='') as f:
        reader = csv.DictReader(f)
        for row in reader:
            courses.append({
                'title': row.get('title', '').strip(),
                'short_description': row.get('short_description', '').strip(),
                'description': row.get('description', '').strip(),
                'duration': str(row.get('duration', '')).strip(),
                'is_published': _to_bool(row.get('is_published')),
                'class_level': row.get('class_level', '').strip(),
                'board': (row.get('board') or '').strip().lower(),
                'state': row.get('state', '').strip(),
                'subject': row.get('subject', '').strip(),
                'sources': row.get('sources', '').strip(),
                'key_topics': _split_list(row.get('key_topics')),
                'learning_points': _split_list(row.get('learning_points')),
            })
    return {"courses": courses}


def upsert_school_course(course_data: Dict[str, Any], replace_children: bool = False, dry_run: bool = False, verbose: bool = False) -> SchoolCourse:
    # Identify by id or by title + class_level + board + state + subject
    course = None
    if course_data.get('id'):
        course = SchoolCourse.objects.filter(id=course_data['id']).first()
    if course is None:
        filters = {
            'title': course_data.get('title'),
            'class_level': course_data.get('class_level'),
            'board': course_data.get('board'),
            'state': course_data.get('state') or '',
            'subject': course_data.get('subject'),
        }
        course = SchoolCourse.objects.filter(**filters).first()

    fields = {
        'title': course_data.get('title'),
        'short_description': course_data.get('short_description', ''),
        'description': course_data.get('description', ''),
        'duration': course_data.get('duration', ''),
        'is_published': bool(course_data.get('is_published', False)),
        'class_level': course_data.get('class_level'),
        'board': course_data.get('board'),
        'state': course_data.get('state') or '',
        'subject': course_data.get('subject'),
        'sources': course_data.get('sources', ''),
        'key_topics': course_data.get('key_topics') or [],
        'learning_points': course_data.get('learning_points') or [],
    }

    if dry_run:
        print(f"[DRY-RUN] Would {'update' if course else 'create'} SchoolCourse: {fields['title']}")
        return course or SchoolCourse(**fields)  # type: ignore

    if course is None:
        course = SchoolCourse.objects.create(**fields)
        if verbose:
            print(f"Created SchoolCourse: {course.title}")
    else:
        for k, v in fields.items():
            setattr(course, k, v)
        course.save()
        if verbose:
            print(f"Updated SchoolCourse: {course.title}")

    chapters = course_data.get('chapters', []) or []
    if chapters:
        if replace_children:
            course.chapters.all().delete()
        for c_idx, c in enumerate(chapters, start=1):
            chapter = CourseChapter.objects.create(
                school_course=course,
                name=c.get('name') or f"Chapter {c_idx}",
                order=int(c.get('order') or c_idx),
            )

            for l_idx, l in enumerate(c.get('lessons', []) or [], start=1):
                Lesson.objects.create(
                    chapter=chapter,
                    title=l.get('title') or f"Lesson {l_idx}",
                    type=(l.get('type') or 'video'),
                    description=l.get('description', ''),
                    about_lesson=l.get('about_lesson', ''),
                    order=int(l.get('order') or l_idx),
                )

    return course


def main():
    parser = argparse.ArgumentParser(description='Ingest School courses from JSON or CSV.')
    parser.add_argument('--file', required=True, help='Path to input file (.json or .csv)')
    parser.add_argument('--replace', action='store_true', help='Replace chapters/lessons entirely rather than merging')
    parser.add_argument('--dry-run', action='store_true', help='Validate and print changes without writing to DB')
    parser.add_argument('--verbose', action='store_true', help='Verbose logging')
    args = parser.parse_args()

    if not os.path.exists(args.file):
        print(f"Input file not found: {args.file}")
        sys.exit(1)

    ext = os.path.splitext(args.file)[1].lower()
    if ext == '.json':
        data = load_json(args.file)
    elif ext == '.csv':
        data = load_csv_courses(args.file)
    else:
        print('Unsupported file format. Use .json or .csv')
        sys.exit(1)

    courses = data.get('courses', [])
    if not isinstance(courses, list) or not courses:
        print('No courses found in input')
        sys.exit(1)

    created = 0
    updated = 0
    if args.dry_run:
        for c in courses:
            upsert_school_course(c, replace_children=args.replace, dry_run=True, verbose=args.verbose)
        print(f"[DRY-RUN] Processed {len(courses)} courses. No database changes made.")
        return

    with transaction.atomic():
        for c in courses:
            exists = None
            if c.get('id'):
                exists = SchoolCourse.objects.filter(id=c['id']).exists()
            else:
                exists = SchoolCourse.objects.filter(
                    title=c.get('title'),
                    class_level=c.get('class_level'),
                    board=c.get('board'),
                    state=c.get('state') or '',
                    subject=c.get('subject'),
                ).exists()
            upsert_school_course(c, replace_children=args.replace, dry_run=False, verbose=args.verbose)
            if exists:
                updated += 1
            else:
                created += 1

    print(f"Done. Courses processed: {len(courses)} | Created: {created} | Updated: {updated}")


if __name__ == '__main__':
    main()
