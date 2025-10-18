#!/usr/bin/env python3
"""
Ingest Engineering courses into the database (Hostinger MySQL supported)

Supports JSON (nested) and CSV (courses-only) inputs.

JSON schema (recommended):
{
  "courses": [
    {
      "id": "optional uuid",
      "title": "Data Structures",
      "short_description": "...",
      "description": "...",
      "duration": "40",
      "is_published": true,
      "subject": "CS",
      "sources": "NPTEL; MIT OCW",
      "proficiency": "beginner|intermediate|advanced",
      "project_based": true,
      "learning_points": ["..."],
      "requirements": ["..."],
      "category": "Programming",
      "sections": [
        {"name": "Arrays", "order": 1, "lessons": [
          {
            "title": "Intro to Arrays",
            "type": "video|article|quiz|resources",
            "video_url": "https://...",
            "description": "...",
            "about_lesson": "...",
            "order": 1,
            "resources": [
              {"type": "internet|downloadable", "title": "Docs", "url": "https://...", "description": "..."}
            ],
            "quiz": [
              {"question": "...", "options": ["A","B"], "correct_answer": "A"}
            ]
          }
        ]}
      ]
    }
  ]
}

CSV (simple courses list): columns = title,short_description,description,duration,is_published,subject,sources,proficiency,project_based,learning_points,requirements,category
Where learning_points and requirements are semicolon-separated lists. This mode does NOT import sections/lessons.
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
# Ensure project root is importable (so 'backend' package resolves)
sys.path.insert(0, ROOT_DIR)
sys.path.insert(0, BACKEND_DIR)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

import django  # type: ignore
django.setup()

from django.db import transaction
from courses.models import EngineeringCourse, CourseSection, Lesson, LessonResource, QuizQuestion  # type: ignore


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
    # CSV: semicolon separated
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
                'subject': row.get('subject', '').strip() or None,
                'sources': row.get('sources', '').strip() or None,
                'proficiency': (row.get('proficiency') or 'beginner').strip().lower(),
                'project_based': _to_bool(row.get('project_based')),
                'learning_points': _split_list(row.get('learning_points')),
                'requirements': _split_list(row.get('requirements')),
                'category': row.get('category', '').strip() or None,
            })
    return {"courses": courses}


def upsert_engineering_course(course_data: Dict[str, Any], replace_children: bool = False, dry_run: bool = False, verbose: bool = False) -> EngineeringCourse:
    # Identify course by id (uuid) or by title
    course = None
    identifier = course_data.get('id') or course_data.get('title')
    if verbose:
        print(f"Processing course: {identifier}")

    if course_data.get('id'):
        course = EngineeringCourse.objects.filter(id=course_data['id']).first()
    if course is None and course_data.get('title'):
        course = EngineeringCourse.objects.filter(title=course_data['title']).first()

    fields = {
        'title': course_data.get('title'),
        'short_description': course_data.get('short_description', ''),
        'description': course_data.get('description', ''),
        'duration': course_data.get('duration', ''),
        'is_published': bool(course_data.get('is_published', False)),
        'subject': course_data.get('subject'),
        'sources': course_data.get('sources'),
        'proficiency': (course_data.get('proficiency') or 'beginner').lower(),
        'project_based': bool(course_data.get('project_based', False)),
        'learning_points': course_data.get('learning_points') or [],
        'requirements': course_data.get('requirements') or [],
        'category': course_data.get('category'),
    }

    if dry_run:
        print(f"[DRY-RUN] Would {'update' if course else 'create'} EngineeringCourse: {fields['title']}")
        # No DB writes in dry-run
        return course or EngineeringCourse(**fields)  # type: ignore

    if course is None:
        course = EngineeringCourse.objects.create(**fields)
        if verbose:
            print(f"Created EngineeringCourse: {course.title}")
    else:
        for k, v in fields.items():
            setattr(course, k, v)
        course.save()
        if verbose:
            print(f"Updated EngineeringCourse: {course.title}")

    # Sections and lessons (only if present in data)
    sections = course_data.get('sections', []) or []
    if sections:
        existing_sections_by_name = {s.name: s for s in course.sections.all()}
        if replace_children:
            # Remove existing children to avoid duplication
            course.sections.all().delete()
            existing_sections_by_name = {}
        for s_idx, s in enumerate(sections, start=1):
            sec_name = s.get('name') or f"Section {s_idx}"
            order = int(s.get('order') or s_idx)
            section = existing_sections_by_name.get(sec_name)
            if section is None:
                section = CourseSection.objects.create(engineering_course=course, name=sec_name, order=order)
            else:
                section.name = sec_name
                section.order = order
                section.save()

            # Lessons
            lessons = s.get('lessons', []) or []
            # Replace all lessons in this section to keep deterministic order/content
            section.lessons.all().delete()
            for l_idx, l in enumerate(lessons, start=1):
                lesson = Lesson.objects.create(
                    section=section,
                    title=l.get('title') or f"Lesson {l_idx}",
                    type=(l.get('type') or 'video'),
                    video_url=l.get('video_url', ''),
                    description=l.get('description', ''),
                    about_lesson=l.get('about_lesson', ''),
                    order=int(l.get('order') or l_idx),
                )

                # Resources
                for r in l.get('resources', []) or []:
                    LessonResource.objects.create(
                        lesson=lesson,
                        type=(r.get('type') or 'internet'),
                        title=r.get('title') or 'Resource',
                        description=r.get('description', ''),
                        url=r.get('url', ''),
                    )

                # Quiz
                for q_idx, q in enumerate(l.get('quiz', []) or [], start=1):
                    QuizQuestion.objects.create(
                        lesson=lesson,
                        question=q.get('question') or f"Question {q_idx}",
                        options=q.get('options') or [],
                        correct_answer=q.get('correct_answer') or '',
                    )

    return course


def main():
    parser = argparse.ArgumentParser(description='Ingest Engineering courses from JSON or CSV.')
    parser.add_argument('--file', required=True, help='Path to input file (.json or .csv)')
    parser.add_argument('--replace', action='store_true', help='Replace sections/lessons entirely rather than merging')
    parser.add_argument('--dry-run', action='store_true', help='Validate and print changes without writing to DB')
    parser.add_argument('--verbose', action='store_true', help='Verbose logging')
    args = parser.parse_args()

    path = args.file
    if not os.path.exists(path):
        print(f"Input file not found: {path}")
        sys.exit(1)

    ext = os.path.splitext(path)[1].lower()
    if ext == '.json':
        data = load_json(path)
    elif ext == '.csv':
        data = load_csv_courses(path)
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
            upsert_engineering_course(c, replace_children=args.replace, dry_run=True, verbose=args.verbose)
        print(f"[DRY-RUN] Processed {len(courses)} courses. No database changes made.")
        return

    with transaction.atomic():
        for c in courses:
            exists = None
            if c.get('id'):
                exists = EngineeringCourse.objects.filter(id=c['id']).exists()
            elif c.get('title'):
                exists = EngineeringCourse.objects.filter(title=c['title']).exists()
            upsert_engineering_course(c, replace_children=args.replace, dry_run=False, verbose=args.verbose)
            if exists:
                updated += 1
            else:
                created += 1

    print(f"Done. Courses processed: {len(courses)} | Created: {created} | Updated: {updated}")


if __name__ == '__main__':
    main()
