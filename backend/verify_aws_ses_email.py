#!/usr/bin/env python3
"""
Send a test email and verify it's using AWS SES
This will help you confirm the email is sent via AWS SES
"""
import os
import sys
import django

# Setup Django
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.conf import settings
from authentication.views import send_email_via_smtp

def verify_aws_ses_config():
    """Verify current SMTP configuration"""
    print("\n" + "=" * 70)
    print("   CURRENT SMTP CONFIGURATION VERIFICATION")
    print("=" * 70)
    
    smtp_host = getattr(settings, 'SMTP_HOST', 'NOT SET')
    smtp_port = getattr(settings, 'SMTP_PORT', 'NOT SET')
    smtp_username = getattr(settings, 'SMTP_USERNAME', 'NOT SET')
    smtp_use_tls = getattr(settings, 'SMTP_USE_TLS', 'NOT SET')
    smtp_use_ssl = getattr(settings, 'SMTP_USE_SSL', 'NOT SET')
    
    print(f"\n📧 SMTP Settings Loaded:")
    print(f"   Host: {smtp_host}")
    print(f"   Port: {smtp_port}")
    print(f"   Username: {smtp_username}")
    print(f"   Use TLS: {smtp_use_tls}")
    print(f"   Use SSL: {smtp_use_ssl}")
    
    print("\n" + "=" * 70)
    print("   PROVIDER DETECTION")
    print("=" * 70)
    
    # Detect provider based on SMTP host
    if 'amazonaws.com' in str(smtp_host).lower():
        print("\n✅ CONFIRMED: Using AWS SES")
        print(f"   Region: {smtp_host.split('.')[1] if '.' in str(smtp_host) else 'unknown'}")
        print(f"   Service: Amazon Simple Email Service")
        is_aws = True
    elif 'gmail' in str(smtp_host).lower() or 'google' in str(smtp_host).lower():
        print("\n❌ WARNING: Using Gmail/Google SMTP")
        print(f"   This is the OLD configuration!")
        is_aws = False
    elif 'hostinger' in str(smtp_host).lower():
        print("\n⚠️  Using Hostinger SMTP")
        print(f"   This is NOT AWS SES")
        is_aws = False
    elif not smtp_host or smtp_host == 'NOT SET':
        print("\n❌ ERROR: SMTP not configured!")
        print("   No SMTP_HOST found in settings")
        is_aws = False
    else:
        print(f"\n⚠️  Unknown SMTP provider: {smtp_host}")
        is_aws = False
    
    print("\n" + "=" * 70)
    print("   ENVIRONMENT CHECK")
    print("=" * 70)
    
    # Check environment variables directly
    env_host = os.environ.get('SMTP_HOST', 'NOT SET')
    env_port = os.environ.get('SMTP_PORT', 'NOT SET')
    
    print(f"\n🔧 Environment Variables:")
    print(f"   SMTP_HOST: {env_host}")
    print(f"   SMTP_PORT: {env_port}")
    
    if env_host != str(smtp_host):
        print(f"\n⚠️  WARNING: Mismatch between env var and Django setting!")
        print(f"   ENV: {env_host}")
        print(f"   Django: {smtp_host}")
    
    return is_aws

def send_verification_email():
    """Send a test email with clear AWS SES indicators"""
    print("\n" + "=" * 70)
    print("   SENDING TEST EMAIL")
    print("=" * 70)
    
    smtp_host = getattr(settings, 'SMTP_HOST', '')
    
    html_content = f"""
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; padding: 20px; }}
            .header {{ background: #232F3E; color: white; padding: 20px; text-align: center; }}
            .info {{ background: #f0f0f0; padding: 15px; margin: 20px 0; }}
            .aws {{ color: #FF9900; font-weight: bold; }}
            .success {{ color: #28a745; }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>✅ AWS SES Email Verification</h1>
        </div>
        
        <h2>Email Successfully Sent via <span class="aws">AWS SES</span></h2>
        
        <div class="info">
            <h3>📧 SMTP Configuration Used:</h3>
            <ul>
                <li><strong>SMTP Host:</strong> {smtp_host}</li>
                <li><strong>SMTP Port:</strong> {getattr(settings, 'SMTP_PORT', 'N/A')}</li>
                <li><strong>Use TLS:</strong> {getattr(settings, 'SMTP_USE_TLS', 'N/A')}</li>
                <li><strong>Provider:</strong> <span class="aws">Amazon Web Services (AWS SES)</span></li>
                <li><strong>Region:</strong> {smtp_host.split('.')[1] if '.' in smtp_host else 'N/A'}</li>
            </ul>
        </div>
        
        <h3 class="success">✅ How to Verify This Email is from AWS SES:</h3>
        <ol>
            <li><strong>Check Email Headers:</strong>
                <ul>
                    <li>Look for "Return-Path" containing @amazonses.com</li>
                    <li>Look for "X-SES-Outgoing" header</li>
                    <li>Look for "Received" headers from ses.amazonaws.com</li>
                </ul>
            </li>
            <li><strong>Check AWS SES Console:</strong>
                <ul>
                    <li>Go to AWS SES Console → Sending statistics</li>
                    <li>You should see this email in the sent count</li>
                </ul>
            </li>
        </ol>
        
        <div class="info">
            <h4>🔍 Email Headers to Look For:</h4>
            <pre>
Return-Path: &lt;...@amazonses.com&gt;
X-SES-Outgoing: [timestamp]
Received: from ... by email-smtp.amazonaws.com
            </pre>
        </div>
        
        <p><strong>Timestamp:</strong> {__import__('datetime').datetime.now().isoformat()}</p>
        
        <hr>
        <p style="color: #666; font-size: 12px;">
            This is a test email from EasyLearnova to verify AWS SES configuration.
        </p>
    </body>
    </html>
    """
    
    recipient = 'info@easylearnova.com'
    subject = '✅ AWS SES Verification - EasyLearnova'
    
    print(f"\n📧 Sending test email to: {recipient}")
    print(f"   Subject: {subject}")
    
    try:
        success = send_email_via_smtp(recipient, subject, html_content)
        
        if success:
            print("\n✅ EMAIL SENT SUCCESSFULLY!")
            print("\n" + "=" * 70)
            print("   HOW TO VERIFY IT'S FROM AWS SES")
            print("=" * 70)
            print("\n1. CHECK YOUR EMAIL INBOX")
            print("   Look for the test email with AWS SES indicators")
            
            print("\n2. VIEW EMAIL HEADERS (Most Reliable Method):")
            print("   Gmail:")
            print("     - Open email → Click ⋮ → Show original")
            print("     - Look for: Return-Path: ...@amazonses.com")
            print("     - Look for: X-SES-Outgoing header")
            
            print("\n   Outlook/Hotmail:")
            print("     - Open email → ⋯ → View message source")
            print("     - Search for: amazonses.com")
            
            print("\n   Apple Mail:")
            print("     - View → Message → Raw Source")
            print("     - Search for: X-SES-Outgoing")
            
            print("\n3. CHECK AWS SES CONSOLE:")
            print("   - Go to: https://console.aws.amazon.com/ses")
            print("   - Region: Asia Pacific (Mumbai)")
            print("   - View: Sending statistics")
            print("   - You should see: 1 email sent in last hour")
            
            print("\n4. WHAT TO LOOK FOR IN HEADERS:")
            print("   ✅ Return-Path: *@amazonses.com")
            print("   ✅ X-SES-Outgoing: [timestamp]")
            print("   ✅ Received: from ...email-smtp.amazonaws.com")
            print("   ❌ If you see smtp.gmail.com → STILL USING GMAIL")
            print("   ❌ If you see smtp.hostinger.com → STILL USING HOSTINGER")
            
            print("\n" + "=" * 70)
        else:
            print("\n❌ EMAIL SENDING FAILED!")
            print("   Check Django logs for error details")
            
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()

def main():
    print("\n" + "=" * 70)
    print("   AWS SES CONFIGURATION VERIFICATION TOOL")
    print("=" * 70)
    
    # Step 1: Verify configuration
    is_aws = verify_aws_ses_config()
    
    if not is_aws:
        print("\n" + "=" * 70)
        print("   ⚠️  WARNING: NOT USING AWS SES!")
        print("=" * 70)
        print("\nYour Django settings are NOT configured for AWS SES.")
        print("\nPossible reasons:")
        print("1. .env file not loaded")
        print("2. Wrong .env file being used")
        print("3. Environment variables not set")
        print("4. Old configuration still active")
        print("\nTo fix:")
        print("1. Check your .env file has:")
        print("   SMTP_HOST=email-smtp.ap-south-1.amazonaws.com")
        print("2. Restart your Django server")
        print("3. Run this script again")
        print("\n" + "=" * 70)
        
        response = input("\nDo you still want to send a test email? (yes/no): ")
        if response.lower() != 'yes':
            print("\nTest email cancelled.")
            return
    
    # Step 2: Send test email
    send_verification_email()
    
    print("\n✅ VERIFICATION COMPLETE!")
    print("\nNext steps:")
    print("1. Check your email inbox")
    print("2. View email headers to confirm AWS SES")
    print("3. Check AWS SES Console for sending statistics")
    print()

if __name__ == "__main__":
    main()
