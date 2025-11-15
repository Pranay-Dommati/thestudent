# Course Ingestion Pipelines (MySQL – Hostinger)

Two automated pipelines to upload courses using CSV or JSON files:

- Engineering courses: `scripts/ingest_engineering_courses.py`
- School courses: `scripts/ingest_school_courses.py`

Both scripts connect through Django ORM using environment variables. They work against your Hostinger MySQL when `.env` contains your DB settings.

## Data formats

Recommended: JSON with nested structure for sections/chapters and lessons.

- Example engineering JSON: `data/engineering/sample_engineering_courses.json`
- Example school JSON: `data/school/sample_school_courses.json`

CSV is also supported for quick course-only (no lessons) imports. Columns:

- Engineering CSV: `title,short_description,description,duration,is_published,subject,sources,proficiency,project_based,learning_points,requirements,category`
- School CSV: `title,short_description,description,duration,is_published,class_level,board,state,subject,sources,key_topics,learning_points`

List fields use semicolon `;` separators in CSV.

## How it works

- Idempotent upsert by `id` (UUID) when provided, else by `title` (plus identifying fields for School).
- Optional `--replace` to rebuild sections/lessons for engineering and chapters/lessons for school.
- `--dry-run` to validate and preview without writing.

## Prerequisites

1) Python deps

```bash
pip install -r requirements.txt
```

2) Environment variables in `.env` (already in repo). Ensure Hostinger creds are correct:

```
DB_ENGINE=mysql
DB_HOST=your-hostinger-host
DB_PORT=3306
DB_NAME=your_db
DB_USER=your_user
DB_PASSWORD=your_password
DB_SSL_REQUIRE=false
DB_CONN_MAX_AGE=60
```

## Run locally

Engineering (JSON):

```bash
python scripts/ingest_engineering_courses.py --file data/engineering/sample_engineering_courses.json --dry-run --verbose
python scripts/ingest_engineering_courses.py --file data/engineering/sample_engineering_courses.json --replace --verbose
```

School (JSON):

```bash
python scripts/ingest_school_courses.py --file data/school/sample_school_courses.json --dry-run --verbose
python scripts/ingest_school_courses.py --file data/school/sample_school_courses.json --replace --verbose
```

CSV (course-only):

```bash
python scripts/ingest_engineering_courses.py --file data/engineering/engineering_courses.csv
python scripts/ingest_school_courses.py --file data/school/school_courses.csv
```

## GitHub Actions (manual trigger)

Workflow: `.github/workflows/ingest-courses.yml`

- `workflow_dispatch` with inputs: `pipeline` (engineering|school), `data_path` (path in repo), `replace`.
- Uses repo secrets for DB creds so no plaintext passwords in code.

Dispatch examples:

- Engineering: pipeline=engineering, data_path=data/engineering/sample_engineering_courses.json
- School: pipeline=school, data_path=data/school/sample_school_courses.json

## Tips

- For large inputs, run locally first with `--dry-run`.
- Ensure titles are unique per course type to avoid accidental updates when no UUID is specified.
- Re-running with `--replace` will recreate children for deterministic results.
