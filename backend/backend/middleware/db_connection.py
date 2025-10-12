"""
Middleware to handle MySQL connection persistence issues.
"""
from django.db import connection
from django.utils.deprecation import MiddlewareMixin
import logging

logger = logging.getLogger(__name__)


class DatabaseConnectionMiddleware(MiddlewareMixin):
    """
    Middleware to ensure database connections are healthy before each request.
    Helps prevent "MySQL server has gone away" errors.
    """
    
    def process_request(self, request):
        """
        Close old connections before processing request.
        Django's CONN_HEALTH_CHECKS setting (if enabled) will automatically
        test the connection before reusing it.
        """
        from django.db import close_old_connections
        close_old_connections()
        return None
    
    def process_response(self, request, response):
        """
        Close old connections after processing response.
        """
        from django.db import close_old_connections
        close_old_connections()
        return response
    
    def process_exception(self, request, exception):
        """
        Handle database connection errors by closing and allowing reconnection.
        """
        from django.db.utils import OperationalError
        
        if isinstance(exception, OperationalError):
            error_msg = str(exception).lower()
            if 'server has gone away' in error_msg or '2006' in str(exception):
                logger.warning(f"Database connection lost during request: {error_msg}")
                connection.close()
        
        return None
