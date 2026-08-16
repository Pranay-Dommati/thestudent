# Interview Prep — setup and operations

How the paid subject packs work, what to configure in S3, and how to publish a
pack from the admin panel.

---

## 1. What a pack is

A **pack** is one subject: a full handwritten PDF plus its quizzes. Today that's
OS, DBMS/SQL, CN, OOP and System Design, but nothing is hardcoded — packs are
rows in the database, created from the admin panel.

| Piece | Where it lives |
|---|---|
| Pack metadata (title, price, colour, free-page count) | `ContentPack` |
| The full PDF | S3, key stored on `ContentPack.s3_key` |
| The free-preview PDF (auto-generated) | S3, key on `ContentPack.s3_free_key` |
| Quizzes and questions | `PackQuiz`, `PackQuizQuestion` |
| "Buy everything" offer | `PackBundle` |
| Who owns what | `PackPurchase` |
| Quiz scores | `QuizAttempt` |

### How the paywall actually works

When someone who has not paid opens a pack, the server does **not** send the
full PDF and ask the UI to hide pages. It sends a presigned URL to a *different*
S3 object that only contains the first `free_page_count` pages. The paid pages
never reach the browser.

That preview file is generated automatically — on PDF upload, and again if you
change the free-page count.

---

## 2. S3 configuration

Interview packs reuse the bucket and credentials Scrib already uses for
generated study packs. If study-pack generation works today, **no new setup is
needed** — packs will just work.

### Environment variables

Already in use by Scrib; confirm they are set on the backend:

```
AWS_STORAGE_BUCKET_NAME=your-bucket-name
AWS_S3_REGION_NAME=ap-south-1
SCRIB_S3_ACCESS_KEY_ID=...
SCRIB_S3_SECRET_ACCESS_KEY=...
```

### Key layout

Packs write under their own prefixes, alongside the existing `generated/` and
`previews/` prefixes:

```
interview-packs/<slug>_<random>.pdf          full PDF (paid)
interview-packs/free/<slug>_<random>.pdf     first N pages (public)
```

The random suffix means re-uploading a pack writes a new object rather than
overwriting; the superseded object is deleted afterwards, so old presigned URLs
stop working once a PDF is replaced.

### Bucket permissions

The IAM user behind `SCRIB_S3_*` needs, on `arn:aws:s3:::your-bucket/*`:

- `s3:PutObject` — upload PDFs and generated previews
- `s3:GetObject` — read the source PDF when extracting the preview, and presign
- `s3:DeleteObject` — clean up replaced files

**Keep the bucket private.** Nothing here relies on public objects: every read
goes through a presigned URL. If Block Public Access is on (it should be),
leave it on.

### CORS

The browser loads the PDF directly from S3, so the bucket needs a CORS rule
allowing your frontend origins:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedOrigins": [
      "https://scrib.easylearnova.com",
      "http://localhost:5173"
    ],
    "ExposeHeaders": ["Content-Length", "Content-Type"],
    "MaxAgeSeconds": 3000
  }
]
```

If a pack's pages render blank in the reader but the PDF downloads fine, CORS is
almost always the cause.

---

## 3. Publishing a pack

In the admin panel at `/admin-p` → **Interview Prep**.

1. **New pack.** Give it a title (`OS — Interview Notes`), a subject
   (`Operating Systems`), a price, how many pages stay free, and a card colour.
   The slug is generated from the title and becomes the public URL:
   `/interview-prep/os-interview-notes`.

2. **Upload the PDF.** Open the pack and upload the file. The server counts the
   pages, stores the file in S3 and builds the free preview. The page count on
   the card comes from the file itself — you never type it.

3. **Add quizzes and questions — the fast way.** In the Quizzes section, click
   **Import CSV**. One file fills every quiz in the pack; quizzes are created
   automatically for any `quiz_number` that doesn't exist yet, so there's no
   need to click *Add quiz* ten times first. Click **Template** for a starter
   file with the right headers.

   | Column | Required | Meaning |
   |---|---|---|
   | `quiz_number` | yes | Which quiz (1–10) this question belongs to |
   | `question` | yes | The question text |
   | `option1`, `option2` | yes | At least two answer options |
   | `option3`, `option4` | no | Up to two more options |
   | `answer` | yes | The correct option — see below |
   | `question_number` | no | Order within the quiz (default: file order) |
   | `explanation` | no | Shown to the student after they answer |
   | `quiz_topic` | no | Sets the quiz's topic, from its first row |

   `answer` accepts whatever's already in your spreadsheet — a number (`2`), a
   letter (`B`), or the exact text of the correct option — so existing question
   banks don't need reformatting.

   The whole file is validated before anything is written: one bad row (a typo
   in `answer`, a missing option) rejects the entire upload and lists every
   problem row with its line number, so nothing is ever half-imported.

4. **Add questions one at a time instead.** Each quiz also has its own editor —
   useful for a quick fix, or pasting a JSON array for a single quiz:

   ```json
   [
     {
       "text": "Which scheduling algorithm can cause starvation?",
       "options": ["Round Robin", "Priority scheduling", "FCFS", "SJF (preemptive)"],
       "correct_index": 1,
       "explanation": "Low-priority processes may never be scheduled."
     }
   ]
   ```

   `correct_index` is **0-based** — `1` means the second option. Same
   all-or-nothing behaviour as the CSV importer.

5. **Go live.** Tick *Show this pack on the site*. It appears under Interview
   Picks in the Library and in the homepage strip.

6. **Set up the bundle.** On the Interview Prep home screen, name the bundle,
   price it, and tick which packs it covers. Buying it unlocks every ticked
   pack — including packs you tick later, so you can keep adding to it.

---

## 4. Pricing

Prices are stored in paise on the pack and the bundle, and are read from the
database when the order is created **and** again when the payment is verified.
A tampered client cannot buy a ₹399 bundle for ₹1 — the verification step
rejects any order whose amount doesn't match the item.

Changing a price affects new purchases only; existing owners keep access.

---

## 5. PDF link lifetime

The reader loads the PDF from a **presigned S3 URL**, which is a temporary key —
not the document itself. It is valid for **7 days** by default, matching what
StudyPack reader URLs already use.

Why not something short like 15 minutes? Because browsers stream large PDFs with
HTTP Range requests instead of downloading them up front. A link that expires
mid-session leaves pages the reader has not scrolled to yet failing to load — on
a 40-page pack that is very easy to hit. A page refresh always fetches a fresh
link, but breaking mid-read is not acceptable.

A short expiry would also buy very little: owners can download the file outright,
so the link lifetime is no defence against redistribution. The protection that
actually matters is that a non-owner is served a **different S3 object** which
contains only the free pages.

Override it if you ever need to:

```
SCRIB_PACK_PDF_URL_EXPIRY_SECONDS=604800
```

---

## 6. Analytics

Two separate views, for two separate audiences.

**Students** see a progress card in their own pack's Quizzes tab, once they've
attempted at least one quiz — overall accuracy, weakest and strongest quiz, and
a shortcut to retake the weak one. It only uses data already being recorded
(`QuizAttempt`); nothing new to configure.

**You** see a product overview at the top of `/admin-p` → Interview Prep:
revenue, unique buyers, live pack count, total quiz attempts, and average
score, plus the same numbers broken down per pack so you can see which
subjects are actually selling and being used, not just published.

The average score is the mean of each *attempt's own percentage*, not
`total correct ÷ total questions` — so a 3-question quiz and a 25-question quiz
each count once toward the average rather than the bigger quiz dominating it.

This is deliberately **not** per-question difficulty analysis (which question
in a quiz gets missed most often). That's a more invasive report — it points at
individual questions rather than the product as a whole — and wasn't asked for.
If you want it later, it's a straightforward addition on top of the same
`QuizAttempt.answers` data already being stored.

---

## 7. Things worth knowing

- **Deleting.** A pack that has been bought cannot be deleted — deactivate it
  instead, so buyers keep what they paid for. The API returns `409 has_purchases`.
- **Changing the free-page count** on a pack that already has a PDF rebuilds the
  preview file immediately.
- **Quiz answers** are never sent to the browser before submission. Grading
  happens server-side, and the correct answers plus explanations come back only
  in the response to a submitted attempt.
- **Retakes** are unlimited. Every attempt is stored; the card shows the best score.
- **Replacing a PDF** invalidates the previous file — previously issued
  presigned URLs stop working once the old object is deleted.

---

## 8. Running the tests

The production database user cannot create a test database, so the suite uses a
dedicated settings module backed by in-memory SQLite:

```bash
cd backend
python manage.py test scrib.tests_packs --settings=backend.settings_test
```

This covers entitlement (direct purchase, bundle purchase, bundles that grow,
cross-user isolation) and quiz grading (scoring, junk input, best-score across
retakes), plus the locked-content checks.
