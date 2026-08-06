import os
import json
import tempfile
import logging
from google import genai
from django.conf import settings

logger = logging.getLogger('scrib')
MODEL_NAME = "gemini-3.1-flash-lite"
# gemini-3.1-flash-lite (Preview) is only served from the "global" Vertex AI
# endpoint, not regional ones like us-central1 — confirmed via direct test.
LOCATION = "global"

def _setup_credentials():
    """
    Set up Google Application Credentials.
    - On Render (production): reads JSON from GOOGLE_SERVICE_ACCOUNT_JSON env var.
    - Locally: reads from the JSON key file in the backend directory.
    """
    # Option 1: Render/production — JSON content stored as env var
    service_account_json = os.environ.get("GOOGLE_SERVICE_ACCOUNT_JSON")
    if service_account_json:
        try:
            # Validate it's real JSON
            json.loads(service_account_json)
            # Write to a temp file so google-genai can read it
            tmp = tempfile.NamedTemporaryFile(mode="w", delete=False, suffix=".json")
            tmp.write(service_account_json)
            tmp.flush()
            tmp.close()
            os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = tmp.name
            logger.info("[SCRIB AI] Credentials loaded from GOOGLE_SERVICE_ACCOUNT_JSON env var (Render/production)")
            return
        except (json.JSONDecodeError, Exception) as e:
            logger.error(f"[SCRIB AI] Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON: {e}")
            raise

    # Option 2: Local development — JSON file on disk
    key_path = os.path.join(settings.BASE_DIR, 'easylearnova-5a2456bf394b.json')
    if os.path.exists(key_path):
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = key_path
        logger.info(f"[SCRIB AI] Credentials loaded from local file: {os.path.basename(key_path)}")
        return

    raise RuntimeError(
        "No Google credentials found. "
        "Set GOOGLE_SERVICE_ACCOUNT_JSON env var on Render, "
        "or place easylearnova-5a2456bf394b.json in the backend directory locally."
    )


def call_scrib_vertex_ai(prompt, *, response_mime_type=None, max_output_tokens=65535,
                          file_bytes=None, file_mime_type=None):
    """Call Vertex AI Gemini and return the response text.

    Parameters
    ----------
    prompt : str
        The prompt to send.
    response_mime_type : str | None
        If set (e.g. ``'application/json'``), Gemini is forced to return
        valid output in that format — dramatically reducing truncation and
        markdown-wrapping issues.
    max_output_tokens : int
        Maximum tokens in the response.  Default 65 535 (Gemini 3.1 Flash Lite
        supports up to 65 536 output tokens exclusive).
    file_bytes : bytes | None
        Raw bytes of a file (e.g. a PDF) to send alongside the prompt for
        multimodal document understanding. When set, ``file_mime_type`` must
        also be provided.
    file_mime_type : str | None
        MIME type of ``file_bytes`` (e.g. ``'application/pdf'``).
    """
    _setup_credentials()

    logger.info("[SCRIB AI] *** USING GOOGLE VERTEX AI ***")
    logger.info(f"[SCRIB AI] Model: {MODEL_NAME}")
    logger.info(f"[SCRIB AI] Project: easylearnova | Location: {LOCATION}")

    client = genai.Client(
        vertexai=True,
        project="easylearnova",
        location=LOCATION,
    )

    # Build generation config — always include max_output_tokens to avoid
    # silent truncation at the default limit.
    from google.genai import types as genai_types

    gen_config = genai_types.GenerateContentConfig(
        max_output_tokens=max_output_tokens,
    )
    if response_mime_type:
        gen_config.response_mime_type = response_mime_type

    if file_bytes:
        contents = [
            genai_types.Part.from_bytes(data=file_bytes, mime_type=file_mime_type),
            prompt,
        ]
    else:
        contents = prompt

    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=contents,
        config=gen_config,
    )

    logger.info(f"[SCRIB AI] SUCCESS - Response received from Vertex AI ({MODEL_NAME}). No fallback used.")
    return response.text

