import base64
import uuid
import logging

import requests
from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage

logger = logging.getLogger(__name__)


class ImageGenerationError(Exception):
    pass


def _build_handwritten_prompt(topic):
    return (
        "Create a clean handwritten study note page on lined paper. "
        "Use headings, bullet points, and short formulas if needed. "
        f"Topic: {topic}."
    )


def _openai_image_bytes(prompt):
    if not settings.OPENAI_API_KEY:
        raise ImageGenerationError('OPENAI_API_KEY is not configured')

    # gpt-image-2 returns b64_json by default and does NOT accept response_format.
    # DALL-E 2/3 accept response_format but gpt-image-2 rejects it as unknown.
    payload = {
        'model': settings.OPENAI_IMAGE_MODEL,
        'prompt': prompt,
        'n': 1,
        'size': '1024x1024',
    }

    try:
        response = requests.post(
            'https://api.openai.com/v1/images/generations',
            headers={
                'Authorization': f"Bearer {settings.OPENAI_API_KEY}",
                'Content-Type': 'application/json',
            },
            json=payload,
            timeout=180,  # gpt-image-2 can take up to 2-3 minutes
        )
    except requests.RequestException as exc:
        raise ImageGenerationError(f'Image generation request failed: {exc}') from exc

    if response.status_code != 200:
        try:
            error_detail = response.json()
        except Exception:
            error_detail = response.text
        logger.error('[scrib] OpenAI API error %s: %s', response.status_code, error_detail)
        raise ImageGenerationError(
            f'Image generation failed ({response.status_code}): {error_detail}'
        )

    data = response.json()
    items = data.get('data') or []
    if not items:
        raise ImageGenerationError('Image generation returned empty data')

    item = items[0]

    # Prefer b64_json (gpt-image-2 default); fall back to url for older models
    b64_data = item.get('b64_json')
    if b64_data:
        try:
            return base64.b64decode(b64_data)
        except Exception as exc:
            raise ImageGenerationError(f'Failed to decode base64 image: {exc}') from exc

    image_url = item.get('url')
    if image_url:
        try:
            img_response = requests.get(image_url, timeout=60)
            img_response.raise_for_status()
            return img_response.content
        except Exception as exc:
            raise ImageGenerationError(f'Failed to download image from url: {exc}') from exc

    raise ImageGenerationError('Image generation returned no b64_json and no url')


def _save_image_bytes(image_bytes):
    """Save image locally for testing generation without S3."""
    import uuid as _uuid
    from django.core.files.base import ContentFile
    from django.core.files.storage import default_storage
    filename = f"scrib/notes/{_uuid.uuid4().hex}.png"
    content = ContentFile(image_bytes)
    saved_path = default_storage.save(filename, content)
    
    # In development, the URL might not be fully qualified, so we return the path 
    # to be combined with the request host in the view.
    return default_storage.url(saved_path)


def generate_handwritten_note(prompt):
    full_prompt = _build_handwritten_prompt(prompt)
    image_bytes = _openai_image_bytes(full_prompt)
    image_url = _save_image_bytes(image_bytes)
    return {
        'image_url': image_url,
        'model': settings.OPENAI_IMAGE_MODEL,
        'bytes': image_bytes,
    }


def generate_handwritten_image_bytes(topic):
    full_prompt = _build_handwritten_prompt(topic)
    return _openai_image_bytes(full_prompt)
