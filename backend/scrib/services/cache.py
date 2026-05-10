from django.utils.text import slugify
from ..models import PreviewNote, GeneratedNote


def normalize_prompt(prompt):
    return ' '.join(prompt.strip().lower().split())


def find_cached_note(normalized_prompt):
    if not normalized_prompt:
        return None

    slug = slugify(normalized_prompt)[:255]
    preview = PreviewNote.objects.filter(is_active=True, slug=slug).first()
    if preview:
        return {
            'image_url': preview.image_url,
            'source': GeneratedNote.SOURCE_PREVIEW,
            'preview': preview,
        }

    generated = GeneratedNote.objects.filter(normalized_prompt=normalized_prompt).order_by('-created_at').first()
    if generated:
        return {
            'image_url': generated.image_url,
            'source': GeneratedNote.SOURCE_CACHE,
            'generated_note': generated,
        }

    return None
