"""
Earn While Learning — Pricing & Reward Constants
=================================================
All share-related pricing and reward values live here.
Every API view imports from this module — no hardcoded numbers in views.

To change the reward or price, update ONE value here and redeploy.
No migration required for price/reward changes.
"""
import secrets
import string
from decimal import Decimal

# ── Pricing ───────────────────────────────────────────────────────────────────
SHARE_PRICE_PER_PAGE = Decimal("5.00")      # ₹5 charged to the buyer per page

# ── Rewards ───────────────────────────────────────────────────────────────────
SHARE_REWARD_PER_PAGE = Decimal("0.50")     # 0.5 units awarded to the sharer per page
SHARE_REWARD_TYPE = "credits"               # "credits" in V1 — change to "cash" in V2

# ── Share Code ────────────────────────────────────────────────────────────────
_SHARE_CODE_ALPHABET = string.ascii_uppercase + string.digits   # A-Z + 0-9  (Base36)
SHARE_CODE_LENGTH = 8                       # e.g. "SCR8F2KD"
SHARE_CODE_MAX_RETRIES = 10                 # collision retry attempts

# ── Preview Token ─────────────────────────────────────────────────────────────
PREVIEW_TOKEN_TTL_SECONDS = 300             # 5-minute short-lived JWT for preview access


def generate_share_code(length: int = SHARE_CODE_LENGTH) -> str:
    """Return a cryptographically random Base36 share code.

    Uses secrets.choice for unpredictability.
    Example output: 'SCR8F2KD', '3K7X9QPA'
    """
    return ''.join(secrets.choice(_SHARE_CODE_ALPHABET) for _ in range(length))
