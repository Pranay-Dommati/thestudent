#!/usr/bin/env python
"""Test AWS SES API email sending"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from authentication.views import send_email_via_ses

def test_ses_api():
    print("🧪 Testing AWS SES API Email Sending...")
    print("=" * 60)
    
    # Test email
    test_email = "gourishettyvarun@gmail.com"
    subject = "AWS SES API Test - EasyLearnova"
    html_content = """
    <html>
    <body>
        <h2>🎉 AWS SES API Test Successful!</h2>
        <p>This email was sent using <strong>AWS SES API (boto3)</strong> instead of SMTP.</p>
        <p><strong>Benefits:</strong></p>
        <ul>
            <li>✅ Works on Render free tier (uses HTTPS, not SMTP ports)</li>
            <li>✅ Faster delivery</li>
            <li>✅ Better reliability</li>
            <li>✅ No port blocking issues</li>
        </ul>
        <p>If you received this email, AWS SES API is working perfectly! 🚀</p>
        <p>— EasyLearnova Team</p>
    </body>
    </html>
    """
    
    print(f"📧 Sending test email to: {test_email}")
    print(f"📝 Subject: {subject}")
    print()
    
    # Send email
    success = send_email_via_ses(test_email, subject, html_content)
    
    print()
    print("=" * 60)
    if success:
        print("✅ SUCCESS! Email sent via AWS SES API")
        print(f"📬 Check inbox: {test_email}")
        print()
        print("🎯 Next Steps:")
        print("1. Check the email inbox for the test message")
        print("2. Verify the email headers show 'amazonses.com'")
        print("3. Try signing up with OTP to test in production")
        print("4. Deploy to Render - it will work on free tier!")
    else:
        print("❌ FAILED! Check the logs above for errors")
        print()
        print("💡 Troubleshooting:")
        print("1. Verify AWS credentials in .env file")
        print("2. Ensure sender email is verified in AWS SES")
        print("3. Check AWS SES sandbox mode restrictions")
    print("=" * 60)

if __name__ == "__main__":
    test_ses_api()
