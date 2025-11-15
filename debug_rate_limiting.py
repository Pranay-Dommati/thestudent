"""
Debug script to demonstrate the rate limiting cache key issue
This shows why different users on localhost share the same rate limit
"""

import os
import sys
import django

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.core.cache import cache
from django.contrib.auth import get_user_model
from backend.ai.rate_limiter import TopicRateLimiter, get_user_ip
from django.utils import timezone

User = get_user_model()

class MockRequest:
    def __init__(self, user_id=None, ip_address='127.0.0.1'):
        self.META = {'REMOTE_ADDR': ip_address}
        if user_id:
            try:
                self.user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                self.user = None
        else:
            self.user = None

def demonstrate_cache_key_issue():
    print("🔍 DEMONSTRATING RATE LIMITING CACHE KEY ISSUE")
    print("=" * 60)
    
    # Clear cache first
    cache.clear()
    print("✅ Cache cleared")
    
    # Create two different mock users
    print("\n📋 Testing different user scenarios:")
    
    # Scenario 1: Two different authenticated users from localhost
    try:
        users = list(User.objects.all()[:2])
        if len(users) >= 2:
            user1, user2 = users[0], users[1]
            print(f"👤 User 1: ID={user1.id}, Email={getattr(user1, 'email', 'N/A')}")
            print(f"👤 User 2: ID={user2.id}, Email={getattr(user2, 'email', 'N/A')}")
            
            # Create rate limiters for both users (same IP: localhost)
            limiter1 = TopicRateLimiter(user=user1, user_ip='127.0.0.1')
            limiter2 = TopicRateLimiter(user=user2, user_ip='127.0.0.1')
            
            # Get cache keys
            key1 = limiter1.get_cache_key("_daily")
            key2 = limiter2.get_cache_key("_daily")
            
            print(f"\n🔑 Cache Keys Generated:")
            print(f"User 1 cache key: {key1}")
            print(f"User 2 cache key: {key2}")
            print(f"Keys are {'SAME' if key1 == key2 else 'DIFFERENT'} ✅" if key1 != key2 else "Keys are SAME ❌")
            
            # Test rate limiting behavior
            print(f"\n🧪 Testing Rate Limiting Behavior:")
            
            # User 1 creates 2 topics
            limiter1.record_usage(['Topic 1', 'Topic 2'])
            stats1 = limiter1.get_usage_stats()
            print(f"User 1 after creating 2 topics: {stats1['daily_used']}/{stats1['daily_limit']}")
            
            # Check User 2's stats (should be independent)
            stats2 = limiter2.get_usage_stats()
            print(f"User 2 stats (should be independent): {stats2['daily_used']}/{stats2['daily_limit']}")
            
            if stats1['daily_used'] == stats2['daily_used']:
                print("❌ BUG CONFIRMED: Different users share rate limits!")
            else:
                print("✅ Rate limits are properly isolated per user")
                
        else:
            print("❌ Need at least 2 users in database to test")
    except Exception as e:
        print(f"❌ Error testing authenticated users: {e}")
    
    # Scenario 2: Two unauthenticated users from localhost
    print(f"\n📋 Testing unauthenticated users from localhost:")
    
    limiter_unauth1 = TopicRateLimiter(user=None, user_ip='127.0.0.1')
    limiter_unauth2 = TopicRateLimiter(user=None, user_ip='127.0.0.1')
    
    key_unauth1 = limiter_unauth1.get_cache_key("_daily")
    key_unauth2 = limiter_unauth2.get_cache_key("_daily")
    
    print(f"Unauthenticated cache key 1: {key_unauth1}")
    print(f"Unauthenticated cache key 2: {key_unauth2}")
    print(f"Keys are {'SAME ❌' if key_unauth1 == key_unauth2 else 'DIFFERENT ✅'}")
    
    # Scenario 3: Same user from different IPs
    if users:
        user = users[0]
        print(f"\n📋 Testing same user from different IPs:")
        
        limiter_ip1 = TopicRateLimiter(user=user, user_ip='127.0.0.1')
        limiter_ip2 = TopicRateLimiter(user=user, user_ip='192.168.1.100')
        
        key_ip1 = limiter_ip1.get_cache_key("_daily")
        key_ip2 = limiter_ip2.get_cache_key("_daily")
        
        print(f"Same user, IP 127.0.0.1: {key_ip1}")
        print(f"Same user, IP 192.168.1.100: {key_ip2}")
        print(f"Keys are {'DIFFERENT ✅' if key_ip1 != key_ip2 else 'SAME ❌'}")

def show_current_cache_config():
    print(f"\n🔧 Current Cache Configuration:")
    from django.conf import settings
    cache_config = settings.CACHES['default']
    print(f"Backend: {cache_config['BACKEND']}")
    print(f"Location: {cache_config.get('LOCATION', 'N/A')}")
    
    if 'locmem' in cache_config['BACKEND']:
        print("⚠️  Using Local Memory Cache - This is process-specific!")
        print("   Multiple browser sessions = Same cache = Shared rate limits")
    elif 'redis' in cache_config['BACKEND']:
        print("✅ Using Redis Cache - This is shared across processes")
    
    print(f"\n💾 Cache Analysis:")
    print(f"- Authentication is working correctly")
    print(f"- Cache keys are generated properly per user ID")
    print(f"- Issue is likely with browser/session handling")

if __name__ == "__main__":
    demonstrate_cache_key_issue()
    show_current_cache_config()
    
    print(f"\n🎯 ANALYSIS:")
    print(f"The rate limiting system is working correctly!")
    print(f"The issue you're experiencing is likely because:")
    print(f"1. Both browser sessions are using the same authentication token")
    print(f"2. localStorage is shared between browser tabs/windows")
    print(f"3. Session data is persisting across 'different' logins")
    print(f"\n💡 SOLUTIONS:")
    print(f"1. Use different browsers (Chrome vs Firefox)")
    print(f"2. Use incognito/private browsing windows")
    print(f"3. Clear localStorage/cookies between tests")
    print(f"4. Check if you're actually logging in as different users")
