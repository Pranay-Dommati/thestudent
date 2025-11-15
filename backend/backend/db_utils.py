"""
Database utility functions to handle MySQL connection issues.
Optimized for remote MySQL (Hostinger) accessed from Render backend.
"""
from django.db import connection
from django.db.utils import OperationalError, InterfaceError
import logging
import time
from functools import wraps

logger = logging.getLogger(__name__)


def ensure_connection():
    """
    Ensure database connection is alive. 
    Reconnects if connection was closed due to timeout.
    """
    try:
        connection.ensure_connection()
    except OperationalError as e:
        if 'server has gone away' in str(e).lower() or '2006' in str(e):
            logger.warning("Database connection lost. Reconnecting...")
            connection.close()
            connection.ensure_connection()
            logger.info("Database reconnection successful")
        else:
            raise


def close_old_connections_wrapper(func):
    """
    Decorator to ensure database connections are fresh before executing.
    Use this on long-running tasks or API endpoints that might experience timeouts.
    """
    @wraps(func)
    def wrapper(*args, **kwargs):
        from django.db import close_old_connections
        close_old_connections()
        try:
            return func(*args, **kwargs)
        finally:
            close_old_connections()
    
    return wrapper


def db_retry_on_connection_error(max_retries=3, delay=0.5, backoff=2):
    """
    Decorator to retry database operations on connection errors.
    Critical for Render + Hostinger setup where connections may be dropped.
    
    Args:
        max_retries: Maximum number of retry attempts (default: 3)
        delay: Initial delay between retries in seconds (default: 0.5)
        backoff: Multiplier for delay after each retry (default: 2)
    
    Usage:
        @db_retry_on_connection_error(max_retries=3)
        def my_database_function():
            # Your code here
            pass
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            from django.db import close_old_connections
            
            attempt = 0
            current_delay = delay
            last_exception = None
            
            while attempt < max_retries:
                try:
                    # Close old connections before each attempt
                    close_old_connections()
                    
                    # Ensure connection is fresh
                    ensure_connection()
                    
                    # Execute the function
                    result = func(*args, **kwargs)
                    
                    # Success - return result
                    if attempt > 0:
                        logger.info(f"✓ Function {func.__name__} succeeded on attempt {attempt + 1}")
                    return result
                    
                except (OperationalError, InterfaceError) as e:
                    last_exception = e
                    error_msg = str(e).lower()
                    
                    # Check if it's a connection error we should retry
                    if any(keyword in error_msg for keyword in [
                        'server has gone away',
                        'lost connection',
                        'connection was killed',
                        'can\'t connect',
                        '2006',  # MySQL error code: server has gone away
                        '2013',  # MySQL error code: lost connection
                        '2055',  # MySQL error code: lost connection to server at reading initial communication packet
                    ]):
                        attempt += 1
                        
                        if attempt < max_retries:
                            logger.warning(
                                f"⚠ Database connection error in {func.__name__} "
                                f"(attempt {attempt}/{max_retries}): {error_msg[:100]}"
                            )
                            logger.info(f"↻ Retrying in {current_delay}s...")
                            
                            # Close the bad connection
                            connection.close()
                            
                            # Wait before retry
                            time.sleep(current_delay)
                            current_delay *= backoff
                        else:
                            logger.error(
                                f"✗ Database connection error in {func.__name__} "
                                f"after {max_retries} attempts: {error_msg}"
                            )
                            raise
                    else:
                        # Not a connection error, don't retry
                        raise
                        
                except Exception as e:
                    # Not a database connection error, don't retry
                    raise
            
            # If we get here, we've exhausted retries
            if last_exception:
                raise last_exception
        
        return wrapper
    return decorator
