"""
Custom middleware for handling specific security requirements
"""
from django.utils.deprecation import MiddlewareMixin
import os


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
            # Add CSP header to allow iframe embedding from configured frontend origins
            frontend_origins = os.environ.get('FRONTEND_ORIGINS', '').strip()
            if frontend_origins:
                # Expect comma-separated list of origins with scheme
                origins = ' '.join([o.strip() for o in frontend_origins.split(',') if o.strip()])
            else:
                # Dev defaults
                origins = 'http://localhost:5173 http://127.0.0.1:5173'
            response['Content-Security-Policy'] = f"frame-ancestors 'self' {origins}"
            # Ensure proper content type for PDFs
            response['Content-Type'] = 'application/pdf'
            # Add cache control for PDFs
            response['Cache-Control'] = 'public, max-age=3600'
            # Add CORS headers for cross-origin requests
            response['Access-Control-Allow-Origin'] = '*'
            response['Access-Control-Allow-Methods'] = 'GET, HEAD, OPTIONS'
            response['Access-Control-Allow-Headers'] = 'Content-Type'
        
        return response
