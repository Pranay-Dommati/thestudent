import uuid
from io import BytesIO

from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from PIL import Image
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas

from .image_generation import generate_handwritten_image_bytes, ImageGenerationError


class PdfGenerationError(Exception):
    pass


def _save_pdf_bytes(pdf_bytes):
    """Save PDF to local filesystem, bypassing Cloudinary/default_storage.

    Cloudinary returns 401 for private resources when accessed directly by the browser.
    Saving locally lets Django serve it via /media/ which has no auth requirements.
    """
    import os
    from django.conf import settings as _settings

    filename = f"{uuid.uuid4().hex}.pdf"
    rel_path = os.path.join('scrib', 'packs', filename)
    abs_dir = os.path.join(_settings.MEDIA_ROOT, 'scrib', 'packs')
    os.makedirs(abs_dir, exist_ok=True)
    abs_path = os.path.join(abs_dir, filename)

    with open(abs_path, 'wb') as f:
        f.write(pdf_bytes)

    # Return a relative media URL — the view calls ensure_absolute_url() to prefix the host
    media_url = _settings.MEDIA_URL.rstrip('/')
    return f"{media_url}/{rel_path.replace(os.sep, '/')}"


def _topics_to_prompt(topics):
    clean = [str(item).strip() for item in topics if str(item).strip()]
    if not clean:
        return 'General study notes'
    return ', '.join(clean)


def _images_to_pdf(images):
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

    pdf.save()
    return buffer.getvalue()


def generate_study_pack_pdf(pages, title):
    if not pages:
        raise PdfGenerationError('No pages provided')

    placeholder_url = getattr(settings, 'SCRIB_PLACEHOLDER_PDF_URL', '')
    if placeholder_url:
        return {'pdf_url': placeholder_url, 'total_pages': len(pages)}

    # Generate all page images in PARALLEL — each page calls OpenAI independently,
    # so there is no reason to wait for page N before starting page N+1.
    # max_workers=5 caps concurrent OpenAI connections to avoid rate-limit issues.
    # executor.map preserves submission order so page sequence is guaranteed.
    from concurrent.futures import ThreadPoolExecutor

    def _generate_page(args):
        index, page_topics = args
        prompt = _topics_to_prompt(page_topics)
        image_bytes = generate_handwritten_image_bytes(prompt)
        return index, image_bytes

    try:
        with ThreadPoolExecutor(max_workers=min(len(pages), 5)) as executor:
            results = list(executor.map(_generate_page, enumerate(pages)))
        # executor.map already preserves order, so results[0] = page 0, etc.
        images = [img for _, img in results]
    except ImageGenerationError as exc:
        raise PdfGenerationError(str(exc)) from exc

    pdf_bytes = _images_to_pdf(images)
    pdf_url = _save_pdf_bytes(pdf_bytes)
    return {'pdf_url': pdf_url, 'total_pages': len(pages)}

