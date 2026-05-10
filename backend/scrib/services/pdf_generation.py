import uuid
from io import BytesIO

from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from PIL import Image
from reportlab.lib.pagesizes import letter
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas

from .image_generation import generate_handwritten_image_bytes, ImageGenerationError


class PdfGenerationError(Exception):
    pass


def _save_pdf_bytes(pdf_bytes):
    filename = f"scrib/packs/{uuid.uuid4().hex}.pdf"
    content = ContentFile(pdf_bytes)
    saved_path = default_storage.save(filename, content)
    return default_storage.url(saved_path)


def _topics_to_prompt(topics):
    clean = [str(item).strip() for item in topics if str(item).strip()]
    if not clean:
        return 'General study notes'
    return ', '.join(clean)


def _images_to_pdf(images):
    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=letter)
    page_width, page_height = letter
    margin = 36

    for image_bytes in images:
        image = Image.open(BytesIO(image_bytes)).convert('RGB')
        image_width, image_height = image.size
        max_width = page_width - margin * 2
        max_height = page_height - margin * 2
        scale = min(max_width / image_width, max_height / image_height)
        draw_width = image_width * scale
        draw_height = image_height * scale
        x = (page_width - draw_width) / 2
        y = (page_height - draw_height) / 2
        pdf.drawImage(ImageReader(image), x, y, draw_width, draw_height)
        pdf.showPage()

    pdf.save()
    return buffer.getvalue()


def generate_study_pack_pdf(pages, title):
    if not pages:
        raise PdfGenerationError('No pages provided')

    placeholder_url = getattr(settings, 'SCRIB_PLACEHOLDER_PDF_URL', '')
    if placeholder_url:
        return {'pdf_url': placeholder_url, 'total_pages': len(pages)}

    try:
        images = []
        for page_topics in pages:
            prompt = _topics_to_prompt(page_topics)
            images.append(generate_handwritten_image_bytes(prompt))
    except ImageGenerationError as exc:
        raise PdfGenerationError(str(exc)) from exc

    pdf_bytes = _images_to_pdf(images)
    pdf_url = _save_pdf_bytes(pdf_bytes)
    return {'pdf_url': pdf_url, 'total_pages': len(pages)}
