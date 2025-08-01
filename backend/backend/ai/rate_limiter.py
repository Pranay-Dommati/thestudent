"""
Rate limiting system for ProLearning topic creation
Implements daily and per-request limits for topic generation
"""
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.utils import timezone
from datetime import datetime, timedelta
import json

User = get_user_model()

# Rate limiting constants
MAX_TOPICS_PER_DAY = 16
MAX_TOPICS_PER_REQUEST = 4

class TopicRateLimiter:
    """Rate limiter for topic creation in ProLearning"""
    
    def __init__(self, user=None, user_ip=None):
        self.user = user
        self.user_ip = user_ip
        self.cache_key_prefix = "topic_rate_limit"
    
    def get_cache_key(self, suffix=""):
        """Generate cache key for rate limiting"""
        if self.user and self.user.is_authenticated:
            identifier = f"user_{self.user.id}"
        else:
            identifier = f"ip_{self.user_ip}"
        
        today = timezone.now().strftime('%Y-%m-%d')
        return f"{self.cache_key_prefix}_{identifier}_{today}{suffix}"
    
    def get_daily_usage(self):
        """Get current daily usage for the user/IP"""
        cache_key = self.get_cache_key("_daily")
        usage_data = cache.get(cache_key, {
            'count': 0,
            'requests': [],
            'first_request': None
        })
        return usage_data
    
    def check_request_limit(self, requested_topics):
        """Check if the current request exceeds per-request limit"""
        if len(requested_topics) > MAX_TOPICS_PER_REQUEST:
            return False, f"Maximum {MAX_TOPICS_PER_REQUEST} topics allowed per request. You requested {len(requested_topics)} topics."
        return True, ""
    
    def check_daily_limit(self, requested_topics):
        """Check if the request would exceed daily limit"""
        usage_data = self.get_daily_usage()
        current_count = usage_data['count']
        new_total = current_count + len(requested_topics)
        
        if new_total > MAX_TOPICS_PER_DAY:
            remaining = MAX_TOPICS_PER_DAY - current_count
            return False, f"Daily limit exceeded. You have {remaining} topics remaining today. You requested {len(requested_topics)} topics."
        
        return True, ""
    
    def is_request_allowed(self, requested_topics):
        """Check if the request is allowed based on both limits"""
        # Check per-request limit
        allowed, message = self.check_request_limit(requested_topics)
        if not allowed:
            return False, message, self.get_daily_usage()
        
        # Check daily limit
        allowed, message = self.check_daily_limit(requested_topics)
        if not allowed:
            return False, message, self.get_daily_usage()
        
        return True, "", self.get_daily_usage()
    
    def record_usage(self, topics_created):
        """Record topic creation usage"""
        cache_key = self.get_cache_key("_daily")
        usage_data = self.get_daily_usage()
        
        # Update usage data
        now = timezone.now()
        usage_data['count'] += len(topics_created)
        usage_data['requests'].append({
            'timestamp': now.isoformat(),
            'topics': len(topics_created),
            'topic_names': [topic.get('name', '') for topic in topics_created]
        })
        
        if not usage_data['first_request']:
            usage_data['first_request'] = now.isoformat()
        
        # Keep only last 20 requests for debugging
        if len(usage_data['requests']) > 20:
            usage_data['requests'] = usage_data['requests'][-20:]
        
        # Cache until end of day (midnight + 1 hour buffer)
        tomorrow = now.replace(hour=1, minute=0, second=0, microsecond=0) + timedelta(days=1)
        cache_timeout = int((tomorrow - now).total_seconds())
        
        cache.set(cache_key, usage_data, timeout=cache_timeout)
        
        return usage_data
    
    def get_usage_stats(self):
        """Get usage statistics for the user"""
        usage_data = self.get_daily_usage()
        
        return {
            'daily_used': usage_data['count'],
            'daily_limit': MAX_TOPICS_PER_DAY,
            'daily_remaining': MAX_TOPICS_PER_DAY - usage_data['count'],
            'per_request_limit': MAX_TOPICS_PER_REQUEST,
            'first_request_today': usage_data.get('first_request'),
            'recent_requests': usage_data.get('requests', [])[-5:],  # Last 5 requests
            'reset_time': self._get_reset_time()
        }
    
    def _get_reset_time(self):
        """Get time when limits reset (midnight)"""
        now = timezone.now()
        tomorrow = now.replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)
        return tomorrow.isoformat()

def get_user_ip(request):
    """Extract user IP address from request"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR', '127.0.0.1')
    return ip

def check_topic_rate_limit(request, requested_topics):
    """
    Convenience function to check rate limits
    Returns (allowed: bool, message: str, usage_stats: dict)
    """
    user = getattr(request, 'user', None)
    user_ip = get_user_ip(request)
    
    limiter = TopicRateLimiter(user=user, user_ip=user_ip)
    allowed, message, usage_data = limiter.is_request_allowed(requested_topics)
    
    usage_stats = limiter.get_usage_stats()
    
    return allowed, message, usage_stats

def record_topic_creation(request, topics_created):
    """
    Convenience function to record topic creation
    Returns updated usage stats
    """
    user = getattr(request, 'user', None)
    user_ip = get_user_ip(request)
    
    limiter = TopicRateLimiter(user=user, user_ip=user_ip)
    usage_data = limiter.record_usage(topics_created)
    
    return limiter.get_usage_stats()
