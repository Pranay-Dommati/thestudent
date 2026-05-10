from django.conf import settings


class ImageGenerationError(Exception):
    pass


def generate_handwritten_note(prompt):
    if not settings.OPENAI_API_KEY:
        raise ImageGenerationError('OPENAI_API_KEY is not configured')

    placeholder_url = getattr(settings, 'SCRIB_PLACEHOLDER_IMAGE_URL', '')
    if placeholder_url:
        return {'image_url': placeholder_url, 'model': settings.OPENAI_IMAGE_MODEL}

    raise ImageGenerationError('Image generation service is not implemented yet')
