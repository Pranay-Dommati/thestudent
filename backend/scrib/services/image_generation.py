import base64
import logging

import requests
from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage

logger = logging.getLogger(__name__)


class ImageGenerationError(Exception):
    pass


# ──────────────────────────────────────────────
# Modular prompt architecture
# ──────────────────────────────────────────────

def build_layout_context(page: dict) -> str:
    """Build the topic/instruction context portion of the prompt.

    Translates backend packing decisions into layout instructions that
    GPT-image-2 can act on directly — no abstract complexity scores.
    """
    topics = page.get("topics", [])

    lines = ["Topics to include on this page:"]
    for i, t in enumerate(topics, 1):
        if isinstance(t, dict):
            name = (t.get("name") or "").strip()
            instruction = (t.get("instruction") or "").strip()
        else:
            name = str(t).strip()
            instruction = ""

        if not name:
            continue

        lines.append(f"\n{i}. {name}")
        if instruction:
            lines.append(f"   Instruction: {instruction}")

    n = len([t for t in topics if (t.get("name") if isinstance(t, dict) else str(t)).strip()])

    if n >= 2:
        lines.append(
            "\nThis page contains multiple topics. "
            "Allocate roughly equal space to each topic. "
            "Keep explanations concise. "
            "Prefer bullet points over paragraphs. "
            "Include small diagrams only when educationally useful."
        )
    else:
        lines.append(
            "\nThis page contains a single topic. "
            "Use most of the page area. "
            "Provide deeper explanations, examples, diagrams and formulas where appropriate."
        )

    return "\n".join(lines)


def build_visual_prompt():
    return (
    "Generate a handwritten study notes image for the given topic "
    "on a clean white page. "
    "Keep the notes brief, loosely spaced, and easy to read — "
    "do not fill every space on the page."
)

def build_prompt(page: dict) -> str:
    """Merge visual style + layout context into the final prompt.

    Args:
        page: dict with 'topics' list of {'name': str, 'instruction': str}
    """
    visual = build_visual_prompt()
    context = build_layout_context(page)
    return visual + "\n\n" + context


# ──────────────────────────────────────────────
# OpenAI image generation
# ──────────────────────────────────────────────

def _openai_image_bytes(prompt):
    if getattr(settings, 'SCRIB_FAKE_GENERATION', False):
        logger.info(f'[scrib] FAKE GENERATION MODE: bypassing OpenAI for "{prompt[:40]}..."')
        # 1x1 white PNG base64
        return base64.b64decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=")

    if not settings.OPENAI_API_KEY:
        raise ImageGenerationError('OPENAI_API_KEY is not configured')

    # gpt-image-2 returns b64_json by default and does NOT accept response_format.
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
            timeout=6000,
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


# ──────────────────────────────────────────────
# Storage helpers
# ──────────────────────────────────────────────

def _save_image_bytes(image_bytes):
    """Save image locally for testing generation without S3."""
    import uuid as _uuid
    filename = f"scrib/notes/{_uuid.uuid4().hex}.png"
    content = ContentFile(image_bytes)
    saved_path = default_storage.save(filename, content)
    return default_storage.url(saved_path)


# ──────────────────────────────────────────────
# Public API — new page-based interface
# ──────────────────────────────────────────────

def generate_handwritten_image_bytes_page(page: dict) -> bytes:
    """Generate image bytes for a page object.

    Args:
        page: dict with 'topics': [{'name': str, 'instruction': str}, ...]
    """
    return _openai_image_bytes(build_prompt(page))


# ──────────────────────────────────────────────
# Legacy API — kept for backward compatibility
# ──────────────────────────────────────────────

def generate_handwritten_image_bytes(topic: str) -> bytes:
    """Legacy single-topic wrapper. Wraps into a page dict internally."""
    page = {"topics": [{"name": str(topic), "instruction": ""}]}
    return generate_handwritten_image_bytes_page(page)


def generate_handwritten_note(prompt: str) -> dict:
    """Legacy single-topic function. Kept for backward compat."""
    page = {"topics": [{"name": str(prompt), "instruction": ""}]}
    image_bytes = generate_handwritten_image_bytes_page(page)
    image_url = _save_image_bytes(image_bytes)
    return {
        'image_url': image_url,
        'model': settings.OPENAI_IMAGE_MODEL,
        'bytes': image_bytes,
    }
