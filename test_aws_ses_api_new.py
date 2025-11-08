#!/usr/bin/env python3
"""
Test AWS SES API with new IAM credentials
"""
import boto3
from botocore.exceptions import BotoCoreError, ClientError

# New IAM credentials
AWS_ACCESS_KEY_ID = "AKIAWEBLRWIXDGUAFCVW"
AWS_SECRET_ACCESS_KEY = "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"
AWS_REGION = "ap-south-1"
FROM_EMAIL = "info@easylearnova.com"
TEST_EMAIL = "gourishettyvarun@gmail.com"

def test_ses_api():
    """Test AWS SES API email sending"""
    print("🔍 Testing AWS SES API with IAM credentials...")
    print(f"   Access Key: {AWS_ACCESS_KEY_ID}")
    print(f"   Region: {AWS_REGION}")
    print(f"   From: {FROM_EMAIL}")
    print(f"   To: {TEST_EMAIL}")
    print()
    
    try:
        # Create SES client
        print("📡 Creating SES client...")
        ses = boto3.client(
            'ses',
            region_name=AWS_REGION,
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY
        )
        print("✅ SES client created successfully")
        print()
        
        # Test email content
        subject = "AWS SES API Test - EasyLearnova"
        html_body = """
        <html>
        <body>
            <h2>🎉 AWS SES API Test Email</h2>
            <p>This email was sent using <strong>AWS SES API (boto3)</strong> with IAM credentials.</p>
            <p><strong>Why this is better:</strong></p>
            <ul>
                <li>✅ Uses HTTPS instead of SMTP (works on Render free tier)</li>
                <li>✅ Faster and more reliable than SMTP</li>
                <li>✅ Better error handling and logging</li>
                <li>✅ No port blocking issues</li>
            </ul>
            <p>If you received this email, AWS SES API is working perfectly! 🚀</p>
            <hr>
            <p style="color: #666; font-size: 12px;">
                Sent from EasyLearnova Backend<br>
                Region: ap-south-1 (Mumbai)
            </p>
        </body>
        </html>
        """
        
        # Send email
        print("📧 Sending test email...")
        response = ses.send_email(
            Source=FROM_EMAIL,
            Destination={'ToAddresses': [TEST_EMAIL]},
            Message={
                'Subject': {'Data': subject, 'Charset': 'UTF-8'},
                'Body': {
                    'Html': {'Data': html_body, 'Charset': 'UTF-8'}
                }
            }
        )
        
        print("✅ Email sent successfully!")
        print(f"   Message ID: {response.get('MessageId')}")
        print(f"   Request ID: {response.get('ResponseMetadata', {}).get('RequestId')}")
        print()
        print("🎉 SUCCESS! AWS SES API is working with new IAM credentials!")
        print("   Check your inbox at:", TEST_EMAIL)
        return True
        
    except ClientError as e:
        error_code = e.response['Error']['Code']
        error_message = e.response['Error']['Message']
        print(f"❌ AWS SES ClientError: {error_code}")
        print(f"   Message: {error_message}")
        
        if error_code == 'MessageRejected':
            print("\n💡 Possible causes:")
            print("   - Sender email not verified in SES")
            print("   - Account in SES sandbox mode")
            print("   - Recipient email not verified (sandbox mode)")
        elif error_code == 'InvalidParameterValue':
            print("\n💡 Check email addresses format")
        elif 'AccessDenied' in error_code or 'Forbidden' in error_code:
            print("\n💡 IAM credentials don't have SES permissions")
            print("   - Check if IAM user has 'ses:SendEmail' permission")
        
        return False
        
    except BotoCoreError as e:
        print(f"❌ BotoCoreError: {e}")
        print("\n💡 Possible causes:")
        print("   - Network connectivity issue")
        print("   - Invalid AWS region")
        return False
        
    except Exception as e:
        print(f"❌ Unexpected error: {type(e).__name__} - {e}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("AWS SES API Test (New IAM Credentials)")
    print("=" * 60)
    print()
    
    success = test_ses_api()
    
    print()
    print("=" * 60)
    if success:
        print("✅ All tests passed! AWS SES API is ready to use.")
    else:
        print("❌ Tests failed. Check errors above.")
    print("=" * 60)
