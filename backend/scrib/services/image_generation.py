import base64
import uuid

import requests
from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage


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

    payload = {
        'model': settings.OPENAI_IMAGE_MODEL,
        'prompt': prompt,
        'size': '1024x1024',
        'response_format': 'b64_json',
    }

    try:
        response = requests.post(
            'https://api.openai.com/v1/images',
            headers={
                'Authorization': f"Bearer {settings.OPENAI_API_KEY}",
                'Content-Type': 'application/json',
            },
            json=payload,
            timeout=120,
        )
    except requests.RequestException as exc:
        raise ImageGenerationError(f'Image generation request failed: {exc}') from exc

    if response.status_code != 200:
        raise ImageGenerationError(f'Image generation failed ({response.status_code})')

    data = response.json()
    items = data.get('data') or []
    b64_data = items[0].get('b64_json') if items else None
    if not b64_data:
        raise ImageGenerationError('Image generation returned empty data')

    try:
        return base64.b64decode(b64_data)
    except Exception as exc:
        raise ImageGenerationError('Failed to decode image data') from exc


def _save_image_bytes(image_bytes):
    filename = f"scrib/notes/{uuid.uuid4().hex}.png"
    content = ContentFile(image_bytes)
    saved_path = default_storage.save(filename, content)
    return default_storage.url(saved_path)


def generate_handwritten_note(prompt):
    placeholder_url = getattr(settings, 'SCRIB_PLACEHOLDER_IMAGE_URL', '')
    if placeholder_url:
        return {'image_url': placeholder_url, 'model': settings.OPENAI_IMAGE_MODEL}

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
