"""
Custom middleware for handling specific security requirements
"""
from django.utils.deprecation import MiddlewareMixin


class CertificateFrameMiddleware(MiddlewareMixin):
    """
    Custom middleware to allow iframe embedding for certificate PDFs
    while maintaining security for other pages
    """
    
    def process_response(self, request, response):
        # Check if this is a certificate PDF request
        if (request.path.startswith('/media/certificates/') and 
            request.path.endswith('.pdf')):
            # Allow iframe embedding for certificate PDFs from same origin and frontend
            response['X-Frame-Options'] = 'SAMEORIGIN'
            # Add CSP header to allow iframe embedding from frontend
            response['Content-Security-Policy'] = "frame-ancestors 'self' localhost:5173 127.0.0.1:5173"
            # Ensure proper content type for PDFs
            response['Content-Type'] = 'application/pdf'
            # Add cache control for PDFs
            response['Cache-Control'] = 'public, max-age=3600'
            # Add CORS headers for cross-origin requests
            response['Access-Control-Allow-Origin'] = '*'
            response['Access-Control-Allow-Methods'] = 'GET, HEAD, OPTIONS'
            response['Access-Control-Allow-Headers'] = 'Content-Type'
        
        return response
