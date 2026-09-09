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
                          file_bytes=None, file_mime_type=None, youtube_url=None,
                          youtube_fps=0.5, youtube_media_resolution='MEDIA_RESOLUTION_MEDIUM',
                          youtube_start_offset_s=None, youtube_end_offset_s=None,
                          model=None, temperature=None, response_schema=None,
                          request_timeout_s=540):
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
    youtube_url : str | None
        A canonical public YouTube URL. When set, Gemini watches the video
        alongside the prompt. Media resolution is forced low so longer videos
        stay within the token budget. Mutually exclusive with ``file_bytes``.
    youtube_fps : float
        Frames per second to sample from the video (default 0.5 = one frame
        every two seconds). Lower = fewer tokens and a faster response.
    youtube_media_resolution : str
        ``MEDIA_RESOLUTION_LOW`` / ``_MEDIUM`` / ``_HIGH``. Medium keeps
        on-screen code and diagrams readable; callers drop to low for long
        videos to stay within the context window.
    youtube_start_offset_s, youtube_end_offset_s : int | None
        Clip the video to this window (seconds). Used to re-watch only the tail
        of a video when a first pass stopped short, instead of paying for the
        whole thing again.
    model : str | None
        Override the default model for this call (e.g. a stronger model for
        video comprehension). Defaults to ``MODEL_NAME``.
    temperature : float | None
        Sampling temperature. The API default is tuned for creative writing; a
        low value (0.1-0.3) is what you want for extraction/classification, both
        for instruction-following and to stop the same input producing wildly
        different output run to run.
    response_schema : dict | None
        A JSON schema the response must conform to. Uses constrained decoding,
        so the reply is structurally valid JSON by construction — no missing
        fields and no stray escape sequences to repair. Requires
        ``response_mime_type='application/json'``.
    request_timeout_s : int
        Client-side timeout for the API call. Video understanding is slow, so
        this defaults high (9 min); callers running synchronously should keep
        it well under any upstream proxy/gunicorn timeout.
    """
    _setup_credentials()

    model_name = model or MODEL_NAME
    logger.info("[SCRIB AI] *** USING GOOGLE VERTEX AI ***")
    logger.info(f"[SCRIB AI] Model: {model_name}")
    logger.info(f"[SCRIB AI] Project: easylearnova | Location: {LOCATION}")

    from google.genai import types as genai_types

    http_options = genai_types.HttpOptions(timeout=int(request_timeout_s * 1000))
    client = genai.Client(
        vertexai=True,
        project="easylearnova",
        location=LOCATION,
        http_options=http_options,
    )

    # Build generation config — always include max_output_tokens to avoid
    # silent truncation at the default limit.
    gen_config = genai_types.GenerateContentConfig(
        max_output_tokens=max_output_tokens,
    )
    if response_mime_type:
        gen_config.response_mime_type = response_mime_type
    if temperature is not None:
        gen_config.temperature = temperature
    if response_schema is not None:
        gen_config.response_schema = response_schema

    if youtube_url:
        # Resolution + sample rate are chosen by the caller from the video's
        # length: medium resolution so on-screen code/diagrams stay legible,
        # dropped to low only for long videos that would otherwise near the
        # context limit.
        # Pass the enum, not the bare string — pydantic warns on every call otherwise.
        gen_config.media_resolution = genai_types.MediaResolution(youtube_media_resolution)
        video_metadata = genai_types.VideoMetadata(fps=youtube_fps)
        if youtube_start_offset_s is not None:
            video_metadata.start_offset = f'{int(youtube_start_offset_s)}s'
        if youtube_end_offset_s is not None:
            video_metadata.end_offset = f'{int(youtube_end_offset_s)}s'
        contents = [
            genai_types.Part(
                file_data=genai_types.FileData(file_uri=youtube_url, mime_type='video/*'),
                video_metadata=video_metadata,
            ),
            prompt,
        ]
    elif file_bytes:
        contents = [
            genai_types.Part.from_bytes(data=file_bytes, mime_type=file_mime_type),
            prompt,
        ]
    else:
        contents = prompt

    response = client.models.generate_content(
        model=model_name,
        contents=contents,
        config=gen_config,
    )

    logger.info(f"[SCRIB AI] SUCCESS - Response received from Vertex AI ({model_name}). No fallback used.")
    return response.text

