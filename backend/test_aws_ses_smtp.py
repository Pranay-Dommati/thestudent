#!/usr/bin/env python3
"""
Test script to verify AWS SES SMTP credentials
"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# AWS SES SMTP Configuration
SMTP_HOST = "email-smtp.ap-south-2.amazonaws.com"
SMTP_PORT = 587
SMTP_USERNAME = "AKIAWEBLRWIXNZEPOR65"  # Access Key ID
SMTP_PASSWORD = "enEQgQGq+NbY/3PbuyD5vIl9xY/oktgBTxwRVXXI"  # Secret Access Key

# Email configuration
SENDER_EMAIL = "info@easylearnova.com"  # Must be verified in AWS SES
RECIPIENT_EMAIL = "info@easylearnova.com"  # Test recipient (use verified email in sandbox)

def test_smtp_connection():
    """Test AWS SES SMTP connection and send a test email"""
    
    print("=" * 60)
    print("AWS SES SMTP Connection Test")
    print("=" * 60)
    print(f"SMTP Host: {SMTP_HOST}")
    print(f"SMTP Port: {SMTP_PORT}")
    print(f"Username: {SMTP_USERNAME}")
    print(f"Using TLS: Yes")
    print("=" * 60)
    
    try:
        # Create message
        msg = MIMEMultipart()
        msg['From'] = SENDER_EMAIL
        msg['To'] = RECIPIENT_EMAIL
        msg['Subject'] = "AWS SES SMTP Test - EasyLearnova"
        
        body = """
        This is a test email from EasyLearnova backend.
        
        If you received this email, AWS SES SMTP configuration is working correctly!
        
        Configuration Details:
        - SMTP Host: email-smtp.ap-south-2.amazonaws.com
        - Port: 587
        - TLS: Enabled
        - Region: ap-south-2 (Hyderabad)
        
        Regards,
        EasyLearnova Team
        """
        
        msg.attach(MIMEText(body, 'plain'))
        
        print("\n✅ Step 1: Creating SMTP connection...")
        # Create SMTP session
        server = smtplib.SMTP(SMTP_HOST, SMTP_PORT)
        
        print("✅ Step 2: Starting TLS encryption...")
        # Enable TLS
        server.starttls()
        
        print("✅ Step 3: Authenticating with credentials...")
        # Login with credentials
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        
        print("✅ Step 4: Sending test email...")
        # Send email
        server.send_message(msg)
        
        print("✅ Step 5: Closing connection...")
        # Close connection
        server.quit()
        
        print("\n" + "=" * 60)
        print("✅ SUCCESS! Email sent successfully!")
        print("=" * 60)
        print(f"\nTest email sent to: {RECIPIENT_EMAIL}")
        print("Check your inbox to confirm delivery.")
        print("\n⚠️  NOTE: If you're in SES Sandbox mode, you can only send")
        print("   emails to verified email addresses.")
        print("=" * 60)
        
        return True
        
    except smtplib.SMTPAuthenticationError as e:
        print("\n" + "=" * 60)
        print("❌ AUTHENTICATION FAILED!")
        print("=" * 60)
        print(f"Error: {e}")
        print("\nPossible causes:")
        print("1. Incorrect Access Key ID or Secret Access Key")
        print("2. SMTP credentials not generated from IAM user")
        print("3. IAM user lacks SES sending permissions")
        print("=" * 60)
        return False
        
    except smtplib.SMTPRecipientsRefused as e:
        print("\n" + "=" * 60)
        print("❌ RECIPIENT EMAIL REJECTED!")
        print("=" * 60)
        print(f"Error: {e}")
        print("\nPossible causes:")
        print("1. Sender email not verified in AWS SES")
        print("2. Recipient email not verified (if in Sandbox mode)")
        print("3. Domain not verified in AWS SES")
        print("\nAction needed:")
        print("- Verify sender email in AWS SES Console")
        print("- If in Sandbox, verify recipient email too")
        print("- Or request production access to send to any email")
        print("=" * 60)
        return False
        
    except smtplib.SMTPException as e:
        print("\n" + "=" * 60)
        print("❌ SMTP ERROR!")
        print("=" * 60)
        print(f"Error: {e}")
        print("=" * 60)
        return False
        
    except Exception as e:
        print("\n" + "=" * 60)
        print("❌ UNEXPECTED ERROR!")
        print("=" * 60)
        print(f"Error type: {type(e).__name__}")
        print(f"Error: {e}")
        print("=" * 60)
        return False

if __name__ == "__main__":
    print("\n")
    test_smtp_connection()
    print("\n")
