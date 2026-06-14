import gc
import logging
import time
import uuid
from concurrent.futures import ThreadPoolExecutor, as_completed
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
# Memory logging helper
# ──────────────────────────────────────────────

def _log_memory(label):
    """Log current RSS memory usage so we can spot where spikes occur."""
    try:
        import psutil, os
        process = psutil.Process(os.getpid())
        rss_mb = process.memory_info().rss / 1024 / 1024
        logger.info(f'[scrib][mem] {label}: {rss_mb:.1f} MB RSS')
    except Exception:
        pass  # psutil may not be installed; never block generation


# ──────────────────────────────────────────────
# S3 upload
# ──────────────────────────────────────────────

def _upload_to_s3(pdf_fileobj, user_id):
    """Stream a file-like object directly to S3 — no getvalue() / double-copy.

    Uses upload_fileobj (multipart streaming) instead of put_object(Body=bytes)
    so the PDF is never duplicated in RAM.

    Returns (presigned_url, s3_key).
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

    expiry_seconds = int(getattr(settings, 'SCRIB_PDF_URL_EXPIRY_SECONDS', 3600))

    try:
        s3 = boto3.client(
            's3',
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            region_name=region,
        )
        # Stream directly — no getvalue() / no second copy in RAM
        s3.upload_fileobj(
            pdf_fileobj,
            bucket,
            s3_key,
            ExtraArgs={'ContentType': 'application/pdf'},
        )
        pdf_url = s3.generate_presigned_url(
            'get_object',
            Params={'Bucket': bucket, 'Key': s3_key},
            ExpiresIn=expiry_seconds,
        )
    except (BotoCoreError, ClientError) as exc:
        logger.error('[scrib] S3 upload failed: %s', exc)
        raise PdfGenerationError(f'Failed to upload PDF to S3: {exc}') from exc

    logger.info('[scrib] PDF streamed to S3 (presigned, expires in %ds): %s', expiry_seconds, s3_key)
    return pdf_url, s3_key


# ──────────────────────────────────────────────
# Fallback: local filesystem (development only)
# ──────────────────────────────────────────────

def _save_pdf_locally(pdf_fileobj):
    """Write a file-like PDF object to local /media/ (development fallback)."""
    import os

    filename = f'{uuid.uuid4().hex}.pdf'
    rel_path = os.path.join('scrib', 'packs', filename)
    abs_dir = os.path.join(settings.MEDIA_ROOT, 'scrib', 'packs')
    os.makedirs(abs_dir, exist_ok=True)
    abs_path = os.path.join(abs_dir, filename)

    with open(abs_path, 'wb') as f:
        f.write(pdf_fileobj.read())

    media_url = settings.MEDIA_URL.rstrip('/')
    return f"{media_url}/{rel_path.replace(os.sep, '/')}"


def _save_pdf_bytes(pdf_fileobj, user_id=None):
    """Save PDF from a seekable file-like object — prefers S3 streaming, falls back to local.

    Accepts a BytesIO (already seeked to position 0).
    Returns (pdf_url, s3_key). s3_key is None when saved locally.
    """
    bucket = getattr(settings, 'AWS_STORAGE_BUCKET_NAME', '')
    access_key = getattr(settings, 'SCRIB_S3_ACCESS_KEY_ID', '')
    secret_key = getattr(settings, 'SCRIB_S3_SECRET_ACCESS_KEY', '')

    if bucket and access_key and secret_key and user_id is not None:
        return _upload_to_s3(pdf_fileobj, user_id)  # streams directly — no copy

    logger.warning(
        '[scrib] S3 not configured or user_id missing — saving PDF locally. '
        'Set SCRIB_S3_ACCESS_KEY_ID, SCRIB_S3_SECRET_ACCESS_KEY, AWS_STORAGE_BUCKET_NAME.'
    )
    return _save_pdf_locally(pdf_fileobj), None


# ──────────────────────────────────────────────
# PDF canvas helpers
# ──────────────────────────────────────────────

def _topics_to_prompt(topics):
    clean = [str(item).strip() for item in topics if str(item).strip()]
    if not clean:
        return 'General study notes'
    return ', '.join(clean)


def _append_images_to_canvas(pdf_canvas, buffer, images):
    """Append a list of image-bytes pages to an open ReportLab canvas.

    After this call the caller should `del images` and call gc.collect()
    to free the image buffers from RAM before generating the next batch.
    """
    for image_bytes in images:
        with Image.open(BytesIO(image_bytes)) as img:
            img_width, img_height = img.size

        page_size = (img_width, img_height)
        pdf_canvas.setPageSize(page_size)

        # Draw image edge-to-edge
        pdf_canvas.drawImage(
            ImageReader(BytesIO(image_bytes)), 0, 0, img_width, img_height
        )
        pdf_canvas.showPage()


# ──────────────────────────────────────────────
# Public entry point
# ──────────────────────────────────────────────

def generate_study_pack_pdf(pages, title, user_id=None, progress_callback=None):
    """Generate a multi-page PDF study pack.

    Memory-efficient implementation:
    - Generates images in batches of BATCH_SIZE using parallel threads.
    - After each batch is appended to the PDF canvas the batch images are
      explicitly deleted and gc.collect() is called so the memory is freed
      BEFORE the next batch starts.  This prevents all-images-in-RAM-at-once.

    Args:
        pages: List of page-topic lists, e.g. [['Recursion'], ['BFS & DFS']]
        title: Human-readable title (used for logging only)
        user_id: Authenticated user's primary key — used to scope the S3 path
                 to generated/{user_id}/{uuid}.pdf
        progress_callback: Optional callable(pages_done: int) called after each
                           individual image completes. Used to update DB progress.

    Returns:
        dict with 'pdf_url' (str), 's3_key' (str|None), and 'total_pages' (int)
    """
    if not pages:
        raise PdfGenerationError('No pages provided')

    placeholder_url = getattr(settings, 'SCRIB_PLACEHOLDER_PDF_URL', '')
    if placeholder_url:
        return {'pdf_url': placeholder_url, 's3_key': None, 'total_pages': len(pages)}

    BATCH_SIZE = 4
    total_pages = len(pages)

    logger.info(f'[scrib] ========== PDF GENERATION START ==========')
    logger.info(f'[scrib] Title: "{title}" | Total pages: {total_pages} | Batch size: {BATCH_SIZE}')
    gen_start = time.time()
    _log_memory('start')

    # ── Initialise a single PDF canvas that all batches write into ──
    # This is the key change: we never accumulate all_images[] in memory.
    # Each batch is appended directly to the canvas, then deleted.
    buffer = BytesIO()
    pdf_canvas = canvas.Canvas(buffer)
    if title:
        pdf_canvas.setTitle(f"{title} Handwritten Notes")
        pdf_canvas.setSubject('AI-generated handwritten exam notes')
        pdf_canvas.setAuthor('Scrib by EasyLearnova')
        pdf_canvas.setKeywords(f"{title} notes, handwritten notes, exam pdf, revision notes")

    def _generate_single_page(index, page_topics):
        """Generate one page image with retry on rate-limit / timeout errors."""
        prompt = _topics_to_prompt(page_topics)
        max_retries = 3
        for attempt in range(max_retries):
            page_start = time.time()
            try:
                logger.info(
                    f'[scrib]   Page {index+1}/{total_pages} — sending to OpenAI (attempt {attempt+1})...'
                )
                image_bytes = generate_handwritten_image_bytes(prompt)
                elapsed = time.time() - page_start
                logger.info(
                    f'[scrib]   Page {index+1}/{total_pages} — DONE in {elapsed:.1f}s '
                    f'({len(image_bytes)} bytes)'
                )
                return index, image_bytes
            except ImageGenerationError as exc:
                elapsed = time.time() - page_start
                err_str = str(exc)
                err_lower = err_str.lower()
                is_rate_limit = '429' in err_lower or 'rate limit' in err_lower or 'too many' in err_lower
                is_timeout = 'timed out' in err_lower or 'timeout' in err_lower

                if (is_rate_limit or is_timeout) and attempt < max_retries - 1:
                    wait = (attempt + 1) * 15  # 15s, 30s backoff
                    reason = 'RATE LIMITED' if is_rate_limit else 'TIMED OUT'
                    logger.warning(
                        f'[scrib]   Page {index+1}/{total_pages} — {reason} after {elapsed:.1f}s, '
                        f'retrying in {wait}s (attempt {attempt+1}/{max_retries})'
                    )
                    time.sleep(wait)
                    continue
                logger.error(
                    f'[scrib]   Page {index+1}/{total_pages} — FAILED after {elapsed:.1f}s: {err_str}'
                )
                raise

    try:
        num_batches = (total_pages + BATCH_SIZE - 1) // BATCH_SIZE

        # Thread-safe counter for per-image progress updates.
        # as_completed() fires as each parallel image finishes, so this
        # increments once per image (not once per batch).
        import threading
        _progress_lock = threading.Lock()
        _completed_count = 0

        for batch_idx in range(num_batches):
            batch_start_idx = batch_idx * BATCH_SIZE
            batch_end_idx = min(batch_start_idx + BATCH_SIZE, total_pages)
            batch_pages = list(enumerate(pages))[batch_start_idx:batch_end_idx]
            batch_num = batch_idx + 1

            logger.info(
                f'[scrib]   --- Batch {batch_num}/{num_batches} '
                f'(pages {batch_start_idx+1}-{batch_end_idx}) ---'
            )
            batch_start = time.time()
            _log_memory(f'before batch {batch_num}')

            # ── Generate this batch in parallel ──
            # Collect results into a local list keyed by position within the batch.
            batch_results = [None] * len(batch_pages)

            with ThreadPoolExecutor(max_workers=len(batch_pages)) as executor:
                futures = {
                    executor.submit(_generate_single_page, idx, topics): pos
                    for pos, (idx, topics) in enumerate(batch_pages)
                }
                for future in as_completed(futures):
                    pos = futures[future]
                    _idx, image_bytes = future.result()  # raises on failure
                    batch_results[pos] = image_bytes

                    # Fire progress callback immediately after each image —
                    # one DB write per completed topic so the UI shows live progress.
                    with _progress_lock:
                        _completed_count += 1
                        done_so_far = _completed_count
                    if progress_callback is not None:
                        try:
                            progress_callback(done_so_far)
                        except Exception as cb_exc:
                            logger.warning(f'[scrib] progress_callback error (non-fatal): {cb_exc}')

            batch_elapsed = time.time() - batch_start
            logger.info(
                f'[scrib]   --- Batch {batch_num}/{num_batches} images generated in {batch_elapsed:.1f}s ---'
            )
            _log_memory(f'after generating batch {batch_num}')

            # ── Append this batch to the PDF canvas immediately ──
            _append_images_to_canvas(pdf_canvas, buffer, batch_results)

            # ── FREE the batch images NOW before generating the next batch ──
            del batch_results
            gc.collect()

            _log_memory(f'after appending + freeing batch {batch_num}')
            logger.info(
                f'[scrib]   --- Batch {batch_num}/{num_batches} appended to PDF & memory freed ---'
            )

    except ImageGenerationError as exc:
        total_elapsed = time.time() - gen_start
        logger.error(f'[scrib] PDF GENERATION FAILED after {total_elapsed:.1f}s: {exc}')
        raise PdfGenerationError(str(exc)) from exc

    total_elapsed = time.time() - gen_start
    logger.info(
        f'[scrib] All {total_pages} pages generated in {total_elapsed:.1f}s — saving PDF...'
    )
    _log_memory('before pdf save')

    # Finalise the PDF into the buffer
    pdf_canvas.save()
    _log_memory('after pdf_canvas.save()')

    # ── CRITICAL: seek to start, then stream buffer directly to S3 ──
    # Do NOT call buffer.getvalue() — that creates a second full copy in RAM.
    # upload_fileobj reads from the BytesIO in chunks; peak extra memory ≈ 0.
    del pdf_canvas  # release canvas object before upload
    gc.collect()
    _log_memory('after del canvas, before upload')

    buffer.seek(0)
    logger.info('[scrib] Upload START')
    pdf_url, s3_key = _save_pdf_bytes(buffer, user_id=user_id)
    logger.info('[scrib] Upload END')

    # Free the buffer after upload
    buffer.close()
    del buffer
    gc.collect()

    _log_memory('after upload + buffer freed')
    logger.info(f'[scrib] ========== PDF GENERATION COMPLETE ==========')
    logger.info(
        f'[scrib] Total time: {time.time() - gen_start:.1f}s | Pages: {total_pages}'
    )

    return {'pdf_url': pdf_url, 's3_key': s3_key, 'total_pages': total_pages}
