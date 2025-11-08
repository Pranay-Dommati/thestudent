#!/usr/bin/env python3
"""
Django Email Test - Send test email using Django settings
"""
import os
import sys
import django

# Add the backend directory to Python path
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.core.mail import send_mail, EmailMessage
from django.conf import settings

def test_simple_email():
    """Test simple email sending"""
    print("\n" + "=" * 70)
    print("   DJANGO EMAIL TEST - Simple Email")
    print("=" * 70)
    print(f"SMTP Host: {settings.SMTP_HOST}")
    print(f"SMTP Port: {settings.SMTP_PORT}")
    print(f"SMTP User: {settings.SMTP_USERNAME}")
    print(f"Use TLS: {settings.SMTP_USE_TLS}")
    print(f"Use SSL: {settings.SMTP_USE_SSL}")
    print("=" * 70)
    
    try:
        print("\n📧 Sending test email...")
        
        result = send_mail(
            subject='EasyLearnova - Django Email Test',
            message='This is a test email from EasyLearnova Django backend.\n\nIf you receive this, AWS SES is configured correctly!',
            from_email=settings.SMTP_USERNAME if hasattr(settings, 'SMTP_USERNAME') else 'info@easylearnova.com',
            recipient_list=['info@easylearnova.com'],
            fail_silently=False,
        )
        
        if result == 1:
            print("✅ SUCCESS! Email sent successfully!")
            print(f"\nEmail sent to: info@easylearnova.com")
            print("Check your inbox to confirm delivery.")
        else:
            print("❌ FAILED! Email was not sent.")
            
    except Exception as e:
        print(f"❌ ERROR: {e}")
        print(f"\nError type: {type(e).__name__}")
        import traceback
        traceback.print_exc()

def test_html_email():
    """Test HTML email sending"""
    print("\n" + "=" * 70)
    print("   DJANGO EMAIL TEST - HTML Email")
    print("=" * 70)
    
    try:
        print("\n📧 Sending HTML test email...")
        
        html_content = """
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background-color: #f9fafb; }
                .footer { text-align: center; padding: 20px; color: #6b7280; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>EasyLearnova</h1>
                </div>
                <div class="content">
                    <h2>Django HTML Email Test</h2>
                    <p>This is a <strong>HTML formatted</strong> test email from EasyLearnova.</p>
                    <p>✅ If you receive this, AWS SES HTML emails are working correctly!</p>
                    <ul>
                        <li>SMTP Host: email-smtp.ap-south-1.amazonaws.com</li>
                        <li>Port: 587</li>
                        <li>TLS: Enabled</li>
                        <li>Region: Mumbai (ap-south-1)</li>
                    </ul>
                </div>
                <div class="footer">
                    <p>Sent from EasyLearnova Django Backend</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        email = EmailMessage(
            subject='EasyLearnova - HTML Email Test',
            body=html_content,
            from_email=settings.SMTP_USERNAME if hasattr(settings, 'SMTP_USERNAME') else 'info@easylearnova.com',
            to=['info@easylearnova.com'],
        )
        email.content_subtype = 'html'
        email.send()
        
        print("✅ SUCCESS! HTML email sent successfully!")
        print(f"\nEmail sent to: info@easylearnova.com")
        print("Check your inbox to confirm delivery.")
        
    except Exception as e:
        print(f"❌ ERROR: {e}")
        print(f"\nError type: {type(e).__name__}")
        import traceback
        traceback.print_exc()

def main():
    print("\n" + "=" * 70)
    print("   AWS SES EMAIL TEST - DJANGO INTEGRATION")
    print("=" * 70)
    
    # Test 1: Simple text email
    test_simple_email()
    
    # Test 2: HTML email
    test_html_email()
    
    print("\n" + "=" * 70)
    print("   IMPORTANT NOTES")
    print("=" * 70)
    print("\n⚠️  AWS SES Sandbox Mode:")
    print("   - You can only send emails TO verified email addresses")
    print("   - You can only send emails FROM verified email addresses")
    print("   - Daily sending limit: 200 emails")
    print("   - Sending rate: 1 email per second")
    print("\n✅ To remove these limits:")
    print("   1. Go to AWS SES Console")
    print("   2. Request Production Access")
    print("   3. Fill out the form explaining your use case")
    print("   4. Wait for approval (usually 24-48 hours)")
    print("\n📧 Email Verification:")
    print("   - Verify 'info@easylearnova.com' in AWS SES Console")
    print("   - Or verify your domain 'easylearnova.com' for full access")
    print("=" * 70)
    print()

if __name__ == "__main__":
    main()
