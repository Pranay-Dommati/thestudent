"""
Rate limiting system for ProLearning topic creation
Implements daily and per-request limits for topic generation with enhanced security
"""
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.utils import timezone
from django.conf import settings
from datetime import datetime, timedelta
import json
import re
import logging

# Configure logging for rate limiting
logger = logging.getLogger(__name__)

User = get_user_model()

# Rate limiting constants - configurable via environment
MAX_TOPICS_PER_DAY = int(getattr(settings, 'MAX_TOPICS_PER_DAY', 16))
MAX_TOPICS_PER_REQUEST = int(getattr(settings, 'MAX_TOPICS_PER_REQUEST', 4))

# Security constants
MAX_CACHE_KEY_LENGTH = 250  # Memcached limit
MAX_TOPIC_NAME_LENGTH = 200
# Allow common safe punctuation in topic names
# Added support for characters used frequently in course topics: &, comma, colon, slash, and apostrophes
ALLOWED_TOPIC_NAME_PATTERN = re.compile(r"^[a-zA-Z0-9\s\-\+\#\.\(\)\&,:\/'’]+$")

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
    """Rate limiter for topic creation in ProLearning with enhanced security"""
    
    def __init__(self, user=None, user_ip=None):
        self.user = user
        self.user_ip = user_ip or '127.0.0.1'
        self.cache_key_prefix = "topic_rate_limit"
        
        # Validate inputs
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
    
    def get_cache_key(self, suffix=""):
        """Generate secure cache key for rate limiting"""
        if self.user and self.user.is_authenticated:
            identifier = f"user_{self.user.id}"
        else:
            identifier = f"ip_{self.user_ip}"
        
        today = timezone.now().strftime('%Y-%m-%d')
        cache_key = f"{self.cache_key_prefix}_{identifier}_{today}{suffix}"
        
        # Sanitize the cache key
        return sanitize_cache_key(cache_key)
    
    def get_daily_usage(self):
        """Get current daily usage for the user/IP with strict time-based validation"""
        cache_key = self.get_cache_key("_daily")
        now = timezone.now()
        
        try:
            usage_data = cache.get(cache_key)
            
            # If no data exists or data is corrupted, initialize new usage data
            if not usage_data or not isinstance(usage_data, dict):
                logger.warning(f"Invalid or missing cache data for key {cache_key}")
                return self._initialize_usage_data(now)
            
            # Check if the stored data is from a previous day
            first_request_time = usage_data.get('first_request')
            if first_request_time:
                try:
                    first_request_dt = datetime.fromisoformat(first_request_time)
                    if first_request_dt.date() < now.date():
                        logger.info(f"Resetting usage data for new day for {cache_key}")
                        return self._initialize_usage_data(now)
                except (ValueError, TypeError) as e:
                    logger.error(f"Invalid timestamp format in usage data: {e}")
                    return self._initialize_usage_data(now)
            
            # Ensure all required fields exist with proper types
            usage_data = {
                'count': max(0, int(usage_data.get('count', 0))),
                'requests': usage_data.get('requests', [])[-20:],  # Keep last 20 requests
                'first_request': usage_data.get('first_request') or now.isoformat(),
                'last_reset': usage_data.get('last_reset') or now.isoformat()
            }
            
            return usage_data
            
        except Exception as e:
            logger.error(f"Error retrieving usage data: {e}")
            return self._initialize_usage_data(now)
            
    def _initialize_usage_data(self, timestamp):
        """Initialize fresh usage data with proper timestamps"""
        return {
            'count': 0,
            'requests': [],
            'first_request': timestamp.isoformat(),
            'last_reset': timestamp.isoformat()
        }
    
    def check_request_limit(self, requested_topics):
        """Check if the current request exceeds per-request limit"""
        try:
            validate_topic_input(requested_topics)
        except ValueError as e:
            return False, str(e)
        
        if len(requested_topics) > MAX_TOPICS_PER_REQUEST:
            return False, f"Maximum {MAX_TOPICS_PER_REQUEST} topics allowed per request. You requested {len(requested_topics)} topics."
        return True, ""
    
    def check_daily_limit(self, requested_topics):
        """Check if the request would exceed daily limit"""
        usage_data = self.get_daily_usage()
        current_count = max(0, int(usage_data.get('count', 0)))  # Ensure non-negative
        new_total = current_count + len(requested_topics)
        
        if new_total > MAX_TOPICS_PER_DAY:
            remaining = max(0, MAX_TOPICS_PER_DAY - current_count)
            return False, f"Daily limit exceeded. You have {remaining} topics remaining today. You requested {len(requested_topics)} topics."
        
        return True, ""
    
    def is_request_allowed(self, requested_topics):
        """Check if the request is allowed based on both limits"""
        # Check per-request limit
        allowed, message = self.check_request_limit(requested_topics)
        if not allowed:
            logger.warning(f"Request limit exceeded for {self.get_cache_key()}: {message}")
            return False, message, self.get_daily_usage()
        
        # Check daily limit
        allowed, message = self.check_daily_limit(requested_topics)
        if not allowed:
            logger.warning(f"Daily limit exceeded for {self.get_cache_key()}: {message}")
            return False, message, self.get_daily_usage()
        
        return True, "", self.get_daily_usage()
    
    def record_usage(self, topics_created):
        """Record topic creation usage with enhanced security and time validation"""
        try:
            validate_topic_input(topics_created)
        except ValueError as e:
            logger.error(f"Invalid topics in record_usage: {e}")
            raise
        
        cache_key = self.get_cache_key("_daily")
        usage_data = self.get_daily_usage()  # This already handles day transitions
        
        # Update usage data with atomic operations
        now = timezone.now()
        topics_count = len(topics_created)
        
        # Double-check daily limits before recording
        new_count = max(0, int(usage_data.get('count', 0)) + topics_count)
        if new_count > MAX_TOPICS_PER_DAY:
            logger.warning(f"Attempted to exceed daily limit for {cache_key}")
            raise ValueError(f"Daily limit exceeded. Limit: {MAX_TOPICS_PER_DAY}, Attempted: {new_count}")
        
        usage_data['count'] = new_count
        
        # Sanitize topic names for storage with strict validation
        sanitized_topics = []
        for topic in topics_created:
            if isinstance(topic, dict):
                name = str(topic.get('name', 'Unknown'))
            else:
                name = str(topic)
            
            # Strict validation of topic names
            if not name or len(name) > MAX_TOPIC_NAME_LENGTH:
                name = name[:MAX_TOPIC_NAME_LENGTH] if name else 'Unknown'
            if not ALLOWED_TOPIC_NAME_PATTERN.match(name):
                # Remove disallowed characters but keep common safe punctuation used in topic names
                name = re.sub(r"[^\w\s\-\+\#\.\(\)\&,:\/'’]", '', name) or 'Invalid_Name'
            sanitized_topics.append(name)
        
        # Record request with precise timestamp
        request_record = {
            'timestamp': now.isoformat(),
            'topics': topics_count,
            'topic_names': sanitized_topics
        }
        
        # Update request history with rotation
        usage_data['requests'] = (usage_data.get('requests', []) + [request_record])[-20:]
        
        # Update first request if not set
        if not usage_data.get('first_request'):
            usage_data['first_request'] = now.isoformat()
        
        # Calculate precise cache timeout
        # Store until next day's midnight plus a small buffer for timezone variations
        tomorrow = (now + timedelta(days=1)).replace(hour=0, minute=5, second=0, microsecond=0)
        cache_timeout = int((tomorrow - now).total_seconds())
        
        try:
            cache.set(cache_key, usage_data, timeout=cache_timeout)
            logger.info(f"Recorded usage for {self.get_cache_key()}: {topics_count} topics")
        except Exception as e:
            logger.error(f"Failed to cache usage data: {e}")
        
        return usage_data
    
    def get_usage_stats(self):
        """Get detailed usage statistics with time-based information"""
        usage_data = self.get_daily_usage()
        now = timezone.now()
        
        # Calculate time-based metrics
        reset_info = self._get_reset_time()
        first_request_time = usage_data.get('first_request')
        
        try:
            first_request_dt = datetime.fromisoformat(first_request_time) if first_request_time else now
            usage_duration = (now - first_request_dt).total_seconds()
        except (ValueError, TypeError):
            usage_duration = 0
            first_request_time = now.isoformat()
        
        # Get recent requests with proper ordering
        recent_requests = sorted(
            usage_data.get('requests', [])[-5:],
            key=lambda x: x.get('timestamp', ''),
            reverse=True
        )
        
        return {
            'daily_used': usage_data['count'],
            'daily_limit': MAX_TOPICS_PER_DAY,
            'daily_remaining': max(0, MAX_TOPICS_PER_DAY - usage_data['count']),
            'per_request_limit': MAX_TOPICS_PER_REQUEST,
            'request_count_today': len(usage_data.get('requests', [])),
            'first_request_today': first_request_time,
            'usage_duration_seconds': int(usage_duration),
            'recent_requests': recent_requests,
            'reset_info': reset_info,
            'current_time': now.isoformat(),
            'rate_limits': {
                'daily': {
                    'limit': MAX_TOPICS_PER_DAY,
                    'remaining': max(0, MAX_TOPICS_PER_DAY - usage_data['count']),
                    'used': usage_data['count'],
                    'percent_used': round((usage_data['count'] / MAX_TOPICS_PER_DAY) * 100, 2)
                },
                'per_request': {
                    'limit': MAX_TOPICS_PER_REQUEST,
                    'remaining': MAX_TOPICS_PER_REQUEST
                }
            }
        }
    
    def _get_reset_time(self):
        """Get precise time when limits reset (next midnight) with timezone handling"""
        now = timezone.now()
        
        # Get next midnight in user's timezone
        # Add 1 minute buffer to ensure we're in the next day
        tomorrow = (now + timedelta(days=1)).replace(
            hour=0,
            minute=1,
            second=0,
            microsecond=0
        )
        
        # Calculate seconds until reset
        self.seconds_until_reset = int((tomorrow - now).total_seconds())
        
        # Include timezone information in the reset time
        return {
            'reset_at': tomorrow.isoformat(),
            'seconds_remaining': self.seconds_until_reset,
            'timezone': str(timezone.get_current_timezone())
        }

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
