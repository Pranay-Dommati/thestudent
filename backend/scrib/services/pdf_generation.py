from django.conf import settings


class PdfGenerationError(Exception):
    pass


def generate_study_pack_pdf(pages, title):
    if not pages:
        raise PdfGenerationError('No pages provided')

    placeholder_url = getattr(settings, 'SCRIB_PLACEHOLDER_PDF_URL', '')
    if placeholder_url:
        return {'pdf_url': placeholder_url, 'total_pages': len(pages)}

    raise PdfGenerationError('PDF generation service is not implemented yet')
