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
        image = Image.open(BytesIO(image_bytes)).convert('RGB')
        img_width, img_height = image.size

        # Use image pixel dimensions as the PDF page size (1pt = 1px at 72 DPI).
        # This makes the PDF page exactly match the image — no white border, no scaling.
        page_size = (img_width, img_height)

        if pdf is None:
            pdf = canvas.Canvas(buffer, pagesize=page_size)
        else:
            pdf.setPageSize(page_size)

        # Draw image edge-to-edge from bottom-left (0, 0)
        pdf.drawImage(ImageReader(image), 0, 0, img_width, img_height)
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

    # Generate all page images in PARALLEL — each page calls OpenAI independently,
    # so there is no reason to wait for page N before starting page N+1.
    from concurrent.futures import ThreadPoolExecutor

    def _generate_page(args):
        index, page_topics = args
        prompt = _topics_to_prompt(page_topics)
        image_bytes = generate_handwritten_image_bytes(prompt)
        return index, image_bytes

    try:
        with ThreadPoolExecutor(max_workers=min(len(pages), 5)) as executor:
            results = list(executor.map(_generate_page, enumerate(pages)))
        # Sort by original page index to guarantee correct PDF page order
        # (executor.map preserves order, but explicit sort is defensive).
        results.sort(key=lambda r: r[0])
        images = [img for _, img in results]
    except ImageGenerationError as exc:
        raise PdfGenerationError(str(exc)) from exc

    pdf_bytes = _images_to_pdf(images, title=title)
    pdf_url, s3_key = _save_pdf_bytes(pdf_bytes, user_id=user_id)
    return {'pdf_url': pdf_url, 's3_key': s3_key, 'total_pages': len(pages)}
