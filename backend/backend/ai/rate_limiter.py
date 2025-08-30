"""
Rate limiting system for ProLearning topic creation

Implements:
- Rolling 24-hour window limit (max topics over last 24h)
- Per-request limit
- Secure, cache-backed, and concurrency-safe updates

This behaves like ChatGPT’s quota system: usage spreads across a rolling
24-hour window and slots free up as timestamps expire.
"""
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.utils import timezone
from django.conf import settings
from datetime import datetime, timedelta
import json
import re
import logging
from typing import List, Tuple

# Configure logging for rate limiting
logger = logging.getLogger(__name__)

User = get_user_model()

# Rate limiting constants - configurable via environment
# Max topics per rolling 24-hour window
MAX_TOPICS_PER_DAY = int(getattr(settings, 'MAX_TOPICS_PER_DAY', 16))
# Max topics per single API request
MAX_TOPICS_PER_REQUEST = int(getattr(settings, 'MAX_TOPICS_PER_REQUEST', 4))

# Rolling window config
ROLLING_WINDOW_SECONDS = 24 * 60 * 60  # 24 hours
USAGE_CACHE_TTL_SECONDS = 7 * 24 * 60 * 60  # keep usage keys for up to 7 days

# Security constants
MAX_CACHE_KEY_LENGTH = 250  # Memcached limit
MAX_TOPIC_NAME_LENGTH = 200
ALLOWED_TOPIC_NAME_PATTERN = re.compile(r'^[a-zA-Z0-9\s\-\+\#\.\(\)]+$')

def validate_topic_input(topics):
    """Validate topic input for security"""
    if not isinstance(topics, list):
        raise ValueError("Topics must be a list")
    
    if len(topics) > MAX_TOPICS_PER_REQUEST:
        raise ValueError(f"Too many topics: maximum {MAX_TOPICS_PER_REQUEST} allowed")
    
    for topic in topics:
        if isinstance(topic, dict):
            name = topic.get('name', '')
        elif isinstance(topic, str):
            name = topic
        else:
            raise ValueError("Invalid topic format")
        
        if not name or len(name) > MAX_TOPIC_NAME_LENGTH:
            raise ValueError(f"Topic name must be 1-{MAX_TOPIC_NAME_LENGTH} characters")
        
        if not ALLOWED_TOPIC_NAME_PATTERN.match(name):
            raise ValueError("Topic name contains invalid characters")
    
    return True

def sanitize_cache_key(key):
    """Sanitize cache key to prevent injection attacks"""
    if len(key) > MAX_CACHE_KEY_LENGTH:
        key = key[:MAX_CACHE_KEY_LENGTH]
    
    # Remove any potentially dangerous characters
    key = re.sub(r'[^\w\-\.\:]', '_', key)
    return key

class TopicRateLimiter:
    """Rate limiter for topic creation with rolling 24-hour window.

    Storage model (per user or IP):
    - cache key: topic_usage:{user_id} | topic_usage:ip_{ip}
    - value: list of ISO8601 timestamp strings for each topic creation

    Concurrency:
    - A simple distributed lock via cache.add(lock_key, '1', timeout=5)
      ensures atomic read-modify-write in concurrent requests.
    """

    def __init__(self, user=None, user_ip=None):
        self.user = user
        self.user_ip = user_ip or '127.0.0.1'
        self.cache_key_prefix = "topic_usage"
        if user_ip and not self._is_valid_ip(user_ip):
            logger.warning(f"Invalid IP address provided: {user_ip}")
            self.user_ip = '127.0.0.1'

    def _is_valid_ip(self, ip):
        """Validate IP address format"""
        import ipaddress
        try:
            ipaddress.ip_address(ip)
            return True
        except ValueError:
            return False

    def get_cache_key(self, suffix: str = "") -> str:
        """Generate secure cache key for rate limiting (no date component)."""
        if self.user and getattr(self.user, 'is_authenticated', False):
            identifier = f"user_{self.user.id}"
        else:
            identifier = f"ip_{self.user_ip}"
        cache_key = f"{self.cache_key_prefix}:{identifier}{suffix}"
        return sanitize_cache_key(cache_key)

    # -------- Internal helpers for rolling window --------
    def _lock_key(self) -> str:
        return self.get_cache_key(":lock")

    def _acquire_lock(self, timeout: int = 5) -> bool:
        """Attempt to acquire a short-lived lock for atomic updates."""
        try:
            return cache.add(self._lock_key(), "1", timeout=timeout)
        except Exception as e:
            logger.warning(f"Failed to acquire cache lock: {e}")
            return False

    def _release_lock(self) -> None:
        try:
            cache.delete(self._lock_key())
        except Exception:
            pass

    def _load_timestamps(self) -> List[str]:
        """Load the list of ISO timestamps from cache, fallback to []."""
        key = self.get_cache_key("")
        try:
            data = cache.get(key)
            if not data:
                return []
            if isinstance(data, list):
                return data
            if isinstance(data, dict) and 'timestamps' in data:
                return list(data.get('timestamps') or [])
            if isinstance(data, dict) and 'requests' in data:
                reqs = data.get('requests') or []
                ts: List[str] = []
                for r in reqs:
                    t = r.get('timestamp')
                    n = int(r.get('topics', 0) or 0)
                    if t and n > 0:
                        ts.extend([t] * n)
                return ts
            return []
        except Exception as e:
            logger.error(f"Error loading timestamps: {e}")
            return []

    def _prune_old(self, timestamps: List[str], now_dt: datetime) -> List[str]:
        """Remove timestamps older than the rolling 24-hour window."""
        window_start = now_dt - timedelta(seconds=ROLLING_WINDOW_SECONDS)
        pruned: List[str] = []
        for ts in timestamps:
            try:
                dt = datetime.fromisoformat(ts)
            except Exception:
                continue
            if dt >= window_start:
                pruned.append(ts)
        return pruned

    def _save_timestamps(self, timestamps: List[str]) -> None:
        key = self.get_cache_key("")
        try:
            cache.set(key, timestamps, timeout=USAGE_CACHE_TTL_SECONDS)
        except Exception as e:
            logger.error(f"Error saving timestamps: {e}")

    # -------- Request validation --------
    def check_request_limit(self, requested_topics):
        """Check if the current request exceeds per-request limit"""
        try:
            validate_topic_input(requested_topics)
        except ValueError as e:
            return False, str(e)
        if len(requested_topics) > MAX_TOPICS_PER_REQUEST:
            return False, (
                f"Maximum {MAX_TOPICS_PER_REQUEST} topics allowed per request. "
                f"You requested {len(requested_topics)} topics."
            )
        return True, ""

    def check_daily_limit(self, requested_topics):
        """Check rolling 24-hour limit based on timestamp list."""
        now_dt = timezone.now()
        timestamps = self._prune_old(self._load_timestamps(), now_dt)
        current_count = len(timestamps)
        requested_count = len(requested_topics)
        new_total = current_count + requested_count
        if new_total > MAX_TOPICS_PER_DAY:
            remaining = max(0, MAX_TOPICS_PER_DAY - current_count)
            return False, (
                f"Rolling 24h limit exceeded. You have {remaining} topic(s) remaining in the last 24 hours. "
                f"You requested {requested_count} topic(s)."
            )
        return True, ""

    def is_request_allowed(self, requested_topics):
        """Check if the request is allowed based on per-request and rolling 24h limits."""
        allowed, message = self.check_request_limit(requested_topics)
        if not allowed:
            logger.warning(f"Request limit exceeded for {self.get_cache_key()}: {message}")
            return False, message, self.get_usage_stats()
        allowed, message = self.check_daily_limit(requested_topics)
        if not allowed:
            logger.warning(f"Rolling limit exceeded for {self.get_cache_key()}: {message}")
            return False, message, self.get_usage_stats()
        return True, "", self.get_usage_stats()

    def record_usage(self, topics_created):
        """Record topic creation with rolling 24-hour window and atomic update."""
        try:
            validate_topic_input(topics_created)
        except ValueError as e:
            logger.error(f"Invalid topics in record_usage: {e}")
            raise
        now_dt = timezone.now()
        topics_count = len(topics_created)
        if topics_count > MAX_TOPICS_PER_REQUEST:
            raise ValueError(f"Too many topics: maximum {MAX_TOPICS_PER_REQUEST} allowed")
        if not self._acquire_lock():
            logger.warning("Proceeding without lock due to contention")
        try:
            timestamps = self._prune_old(self._load_timestamps(), now_dt)
            if len(timestamps) + topics_count > MAX_TOPICS_PER_DAY:
                remaining = max(0, MAX_TOPICS_PER_DAY - len(timestamps))
                raise ValueError(
                    f"Rolling 24h limit exceeded. You have {remaining} topic(s) remaining in the last 24 hours."
                )
            now_iso = now_dt.isoformat()
            timestamps.extend([now_iso] * topics_count)
            self._save_timestamps(timestamps)
        finally:
            self._release_lock()
        return {"count": len(timestamps)}

    def get_usage_stats(self):
        """Return usage statistics for the rolling 24-hour window."""
        now_dt = timezone.now()
        timestamps = self._prune_old(self._load_timestamps(), now_dt)
        used = len(timestamps)
        remaining = max(0, MAX_TOPICS_PER_DAY - used)
        if used > 0:
            try:
                oldest_dt = min(datetime.fromisoformat(ts) for ts in timestamps)
                elapsed = (now_dt - oldest_dt).total_seconds()
                reset_in = max(0, int(ROLLING_WINDOW_SECONDS - elapsed))
            except Exception:
                reset_in = 0
        else:
            reset_in = 0
        recent = sorted(timestamps[-5:], reverse=True)
        return {
            'topics_used_24h': used,
            'topics_remaining': remaining,
            'reset_in': reset_in,
            'daily_used': used,
            'daily_limit': MAX_TOPICS_PER_DAY,
            'daily_remaining': remaining,
            'per_request_limit': MAX_TOPICS_PER_REQUEST,
            'request_count_today': used,
            'first_request_today': (min(recent) if recent else None),
            'usage_duration_seconds': (ROLLING_WINDOW_SECONDS - reset_in) if used > 0 else 0,
            'recent_requests': [
                {'timestamp': ts, 'topics': 1, 'topic_names': []} for ts in recent[::-1]
            ],
            'current_time': now_dt.isoformat(),
            'rate_limits': {
                'daily': {
                    'limit': MAX_TOPICS_PER_DAY,
                    'remaining': remaining,
                    'used': used,
                    'percent_used': round((used / MAX_TOPICS_PER_DAY) * 100, 2) if MAX_TOPICS_PER_DAY else 0.0,
                },
                'per_request': {
                    'limit': MAX_TOPICS_PER_REQUEST,
                    'remaining': MAX_TOPICS_PER_REQUEST,
                },
            },
        }
    # Midnight reset helper removed: rolling window uses dynamic reset based on oldest entry

def get_user_ip(request):
    """Extract user IP address from request with security validation"""
    # Check for forwarded IP (behind proxy/load balancer)
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        # Take the first IP in the chain (client IP)
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR', '127.0.0.1')
    
    # Validate IP address
    import ipaddress
    try:
        ipaddress.ip_address(ip)
        return ip
    except ValueError:
        logger.warning(f"Invalid IP address detected: {ip}")
        return '127.0.0.1'  # Fallback to localhost

def check_topic_rate_limit(request, requested_topics):
    """
    Convenience function to check rate limits with enhanced security
    Returns (allowed: bool, message: str, usage_stats: dict)
    """
    try:
        user = getattr(request, 'user', None)
        user_ip = get_user_ip(request)
        
        limiter = TopicRateLimiter(user=user, user_ip=user_ip)
        allowed, message, usage_data = limiter.is_request_allowed(requested_topics)
        
        usage_stats = limiter.get_usage_stats()
        
        return allowed, message, usage_stats
        
    except Exception as e:
        logger.error(f"Error checking rate limits: {e}")
        # Fail closed - deny request on error
        return False, "Rate limiting error occurred", {}

def record_topic_creation(request, topics_created):
    """
    Convenience function to record topic creation with enhanced security
    Returns updated usage stats
    """
    try:
        user = getattr(request, 'user', None)
        user_ip = get_user_ip(request)
        
        limiter = TopicRateLimiter(user=user, user_ip=user_ip)
        usage_data = limiter.record_usage(topics_created)
        
        return limiter.get_usage_stats()
        
    except Exception as e:
        logger.error(f"Error recording topic creation: {e}")
        # Return empty stats on error
        return {}
