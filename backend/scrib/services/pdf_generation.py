import logging
import uuid
from io import BytesIO

from django.conf import settings
from PIL import Image
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas

# pyrefly: ignore [missing-import]
from .image_generation import generate_handwritten_image_bytes, ImageGenerationError

logger = logging.getLogger(__name__)


class PdfGenerationError(Exception):
    pass


# ──────────────────────────────────────────────
# S3 upload
# ──────────────────────────────────────────────

def _upload_to_s3(pdf_bytes, user_id):
    """Upload PDF bytes to S3 under generated/{user_id}/{uuid}.pdf

    Uses SCRIB_S3_ACCESS_KEY_ID / SCRIB_S3_SECRET_ACCESS_KEY from settings
    (separate from the SES keys so permissions can be scoped to the scrib bucket).

    Returns a tuple (presigned_url, s3_key) where s3_key is permanent and
    presigned_url is a short-lived link for the current request.
    """
    import boto3
    from botocore.exceptions import BotoCoreError, ClientError

    bucket = getattr(settings, 'AWS_STORAGE_BUCKET_NAME', '')
    region = getattr(settings, 'AWS_S3_REGION_NAME', 'ap-south-1')
    access_key = getattr(settings, 'SCRIB_S3_ACCESS_KEY_ID', '')
    secret_key = getattr(settings, 'SCRIB_S3_SECRET_ACCESS_KEY', '')

    if not bucket or not access_key or not secret_key:
        raise PdfGenerationError(
            'S3 credentials are not configured. '
            'Set SCRIB_S3_ACCESS_KEY_ID, SCRIB_S3_SECRET_ACCESS_KEY, '
            'and AWS_STORAGE_BUCKET_NAME in your .env file.'
        )

    file_uuid = uuid.uuid4()
    s3_key = f'generated/{user_id}/{file_uuid}.pdf'

    # Presigned URL expiry — configurable via SCRIB_PDF_URL_EXPIRY_SECONDS (default 3600 = 1 h).
    expiry_seconds = int(getattr(settings, 'SCRIB_PDF_URL_EXPIRY_SECONDS', 3600))

    try:
        s3 = boto3.client(
            's3',
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            region_name=region,
        )
        s3.put_object(
            Bucket=bucket,
            Key=s3_key,
            Body=pdf_bytes,
            ContentType='application/pdf',
        )
        # Generate a presigned URL so private-bucket objects are accessible
        # without making the bucket or object publicly readable.
        pdf_url = s3.generate_presigned_url(
            'get_object',
            Params={'Bucket': bucket, 'Key': s3_key},
            ExpiresIn=expiry_seconds,
        )
    except (BotoCoreError, ClientError) as exc:
        logger.error('[scrib] S3 upload failed: %s', exc)
        raise PdfGenerationError(f'Failed to upload PDF to S3: {exc}') from exc

    logger.info('[scrib] PDF saved to S3 (presigned, expires in %ds): %s', expiry_seconds, s3_key)
    return pdf_url, s3_key


# ──────────────────────────────────────────────
# Fallback: local filesystem (development only)
# ──────────────────────────────────────────────

def _save_pdf_locally(pdf_bytes):
    """Save PDF to local /media/ for development when S3 is not configured."""
    import os

    filename = f'{uuid.uuid4().hex}.pdf'
    rel_path = os.path.join('scrib', 'packs', filename)
    abs_dir = os.path.join(settings.MEDIA_ROOT, 'scrib', 'packs')
    os.makedirs(abs_dir, exist_ok=True)
    abs_path = os.path.join(abs_dir, filename)

    with open(abs_path, 'wb') as f:
        f.write(pdf_bytes)

    media_url = settings.MEDIA_URL.rstrip('/')
    return f"{media_url}/{rel_path.replace(os.sep, '/')}"


def _save_pdf_bytes(pdf_bytes, user_id=None):
    """Save PDF — prefers S3, falls back to local filesystem.

    Returns (pdf_url, s3_key). s3_key is None when saved locally.
    """
    bucket = getattr(settings, 'AWS_STORAGE_BUCKET_NAME', '')
    access_key = getattr(settings, 'SCRIB_S3_ACCESS_KEY_ID', '')
    secret_key = getattr(settings, 'SCRIB_S3_SECRET_ACCESS_KEY', '')

    if bucket and access_key and secret_key and user_id is not None:
        return _upload_to_s3(pdf_bytes, user_id)  # returns (url, key)

    logger.warning(
        '[scrib] S3 not configured or user_id missing — saving PDF locally. '
        'Set SCRIB_S3_ACCESS_KEY_ID, SCRIB_S3_SECRET_ACCESS_KEY, AWS_STORAGE_BUCKET_NAME.'
    )
    return _save_pdf_locally(pdf_bytes), None


# ──────────────────────────────────────────────
# PDF assembly
# ──────────────────────────────────────────────

def _topics_to_prompt(topics):
    clean = [str(item).strip() for item in topics if str(item).strip()]
    if not clean:
        return 'General study notes'
    return ', '.join(clean)


def _images_to_pdf(images, title=None):
    buffer = BytesIO()
    pdf = None

    for image_bytes in images:
        # Open with PIL just to get dimensions (avoiding convert('RGB') which strips format info)
        with Image.open(BytesIO(image_bytes)) as img:
            img_width, img_height = img.size

        # Use image pixel dimensions as the PDF page size (1pt = 1px at 72 DPI).
        # This makes the PDF page exactly match the image — no white border, no scaling.
        page_size = (img_width, img_height)

        if pdf is None:
            pdf = canvas.Canvas(buffer, pagesize=page_size)
        else:
            pdf.setPageSize(page_size)

        # Draw image edge-to-edge from bottom-left (0, 0)
        # Pass the raw BytesIO directly to ImageReader. This prevents ReportLab from
        # automatically re-encoding PIL Image objects (often as lossy JPEGs), 
        # preserving the exact original image quality in the PDF.
        pdf.drawImage(ImageReader(BytesIO(image_bytes)), 0, 0, img_width, img_height)
        pdf.showPage()

    if pdf is None:
        raise PdfGenerationError('No images to convert to PDF')

    if title:
        pdf.setTitle(f"{title} Handwritten Notes")
        pdf.setSubject('AI-generated handwritten exam notes')
        pdf.setAuthor('Scrib by EasyLearnova')
        pdf.setKeywords(f"{title} notes, handwritten notes, exam pdf, revision notes")

    pdf.save()
    return buffer.getvalue()


# ──────────────────────────────────────────────
# Public entry point
# ──────────────────────────────────────────────

def generate_study_pack_pdf(pages, title, user_id=None):
    """Generate a multi-page PDF study pack.

    Args:
        pages: List of page-topic lists, e.g. [['Recursion'], ['BFS & DFS']]
        title: Human-readable title (used for logging only)
        user_id: Authenticated user's primary key — used to scope the S3 path
                 to generated/{user_id}/{uuid}.pdf

    Returns:
        dict with 'pdf_url' (str) and 'total_pages' (int)
    """
    if not pages:
        raise PdfGenerationError('No pages provided')

    placeholder_url = getattr(settings, 'SCRIB_PLACEHOLDER_PDF_URL', '')
    if placeholder_url:
        return {'pdf_url': placeholder_url, 's3_key': None, 'total_pages': len(pages)}

    # Generate all page images in BATCHES of 5 with detailed logging.
    # For any number of pages (10, 20, 30), process 5 at a time in parallel,
    # then move to the next batch. Retries on rate-limit (429) errors.
    import time
    from concurrent.futures import ThreadPoolExecutor, as_completed

    BATCH_SIZE = 5
    total_pages = len(pages)
    all_images = [None] * total_pages  # Pre-allocate to maintain order

    logger.info(f'[scrib] ========== PDF GENERATION START ==========')
    logger.info(f'[scrib] Title: "{title}" | Total pages: {total_pages} | Batch size: {BATCH_SIZE}')
    gen_start = time.time()

    def _generate_single_page(index, page_topics):
        """Generate one page image with retry on rate-limit errors."""
        prompt = _topics_to_prompt(page_topics)
        max_retries = 3
        for attempt in range(max_retries):
            page_start = time.time()
            try:
                logger.info(f'[scrib]   Page {index+1}/{total_pages} — sending to OpenAI (attempt {attempt+1})...')
                image_bytes = generate_handwritten_image_bytes(prompt)
                elapsed = time.time() - page_start
                logger.info(f'[scrib]   Page {index+1}/{total_pages} — DONE in {elapsed:.1f}s ({len(image_bytes)} bytes)')
                return index, image_bytes
            except ImageGenerationError as exc:
                elapsed = time.time() - page_start
                err_str = str(exc)
                err_lower = err_str.lower()
                is_rate_limit = '429' in err_lower or 'rate limit' in err_lower or 'too many' in err_lower
                is_timeout = 'timed out' in err_lower or 'timeout' in err_lower
                
                if (is_rate_limit or is_timeout) and attempt < max_retries - 1:
                    wait = (attempt + 1) * 15  # 15s, 30s backoff
                    reason = "RATE LIMITED" if is_rate_limit else "TIMED OUT"
                    logger.warning(f'[scrib]   Page {index+1}/{total_pages} — {reason} after {elapsed:.1f}s, retrying in {wait}s (attempt {attempt+1}/{max_retries})')
                    time.sleep(wait)
                    continue
                logger.error(f'[scrib]   Page {index+1}/{total_pages} — FAILED after {elapsed:.1f}s: {err_str}')
                raise

    try:
        # Process in batches of BATCH_SIZE
        num_batches = (total_pages + BATCH_SIZE - 1) // BATCH_SIZE
        for batch_idx in range(num_batches):
            batch_start_idx = batch_idx * BATCH_SIZE
            batch_end_idx = min(batch_start_idx + BATCH_SIZE, total_pages)
            batch_pages = list(enumerate(pages))[batch_start_idx:batch_end_idx]
            batch_num = batch_idx + 1

            logger.info(f'[scrib]   --- Batch {batch_num}/{num_batches} (pages {batch_start_idx+1}-{batch_end_idx}) ---')
            batch_start = time.time()

            with ThreadPoolExecutor(max_workers=len(batch_pages)) as executor:
                futures = {
                    executor.submit(_generate_single_page, idx, topics): idx
                    for idx, topics in batch_pages
                }
                for future in as_completed(futures):
                    idx = futures[future]
                    index, image_bytes = future.result()  # Raises if the page failed
                    all_images[index] = image_bytes

            batch_elapsed = time.time() - batch_start
            logger.info(f'[scrib]   --- Batch {batch_num}/{num_batches} DONE in {batch_elapsed:.1f}s ---')

    except ImageGenerationError as exc:
        total_elapsed = time.time() - gen_start
        logger.error(f'[scrib] PDF GENERATION FAILED after {total_elapsed:.1f}s: {exc}')
        raise PdfGenerationError(str(exc)) from exc

    total_elapsed = time.time() - gen_start
    logger.info(f'[scrib] All {total_pages} pages generated in {total_elapsed:.1f}s — building PDF...')

    pdf_bytes = _images_to_pdf(all_images, title=title)
    logger.info(f'[scrib] PDF built ({len(pdf_bytes)} bytes) — uploading...')

    pdf_url, s3_key = _save_pdf_bytes(pdf_bytes, user_id=user_id)

    logger.info(f'[scrib] ========== PDF GENERATION COMPLETE ==========')
    logger.info(f'[scrib] Total time: {time.time() - gen_start:.1f}s | Pages: {total_pages} | PDF size: {len(pdf_bytes)} bytes')

    return {'pdf_url': pdf_url, 's3_key': s3_key, 'total_pages': total_pages}
