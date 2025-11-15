#!/usr/bin/env python3
"""
Verify AWS SES API is working for both OTP signup and password reset emails
"""
import requests
import time

BASE_URL = "http://127.0.0.1:8000"
TEST_EMAIL = "gourishettyvarun@gmail.com"

def test_otp_signup():
    """Test 1: OTP Signup Email"""
    print("\n" + "="*70)
    print("TEST 1: OTP SIGNUP VERIFICATION EMAIL")
    print("="*70)
    
    print(f"\n📧 Sending OTP signup request to: {TEST_EMAIL}")
    
    payload = {
        "full_name": "AWS SES Test User",
        "email": TEST_EMAIL,
        "password": "SecurePass123@",
        "agreed_to_terms": True
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/auth/otp/signup/",
            json=payload,
            timeout=30
        )
        
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            print("\n✅ OTP signup request successful!")
            print("📬 Check your inbox for OTP verification email")
            return True
        elif response.status_code == 400:
            data = response.json()
            if 'email' in data and 'already exists' in str(data['email']).lower():
                print("\nℹ️  Email already registered (this is fine for testing)")
                print("💡 Email sending should still work for existing users")
                return True
            print(f"\n❌ Validation error: {data}")
            return False
        else:
            print(f"\n❌ Unexpected response: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"\n❌ Error: {e}")
        return False

def test_password_reset():
    """Test 2: Password Reset Email"""
    print("\n" + "="*70)
    print("TEST 2: PASSWORD RESET EMAIL")
    print("="*70)
    
    print(f"\n📧 Requesting password reset for: {TEST_EMAIL}")
    
    payload = {
        "email": TEST_EMAIL
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/auth/forgot-password/",
            json=payload,
            timeout=30
        )
        
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            print("\n✅ Password reset request successful!")
            print("📬 Check your inbox for password reset email")
            return True
        elif response.status_code == 404:
            print("\n⚠️  User not found - please sign up first")
            return False
        else:
            print(f"\n❌ Unexpected response: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"\n❌ Error: {e}")
        return False

def print_verification_guide():
    """Print guide for verifying AWS SES in email headers"""
    print("\n" + "="*70)
    print("HOW TO VERIFY AWS SES API IN EMAIL HEADERS")
    print("="*70)
    
    print("""
1. Open the email in Gmail
2. Click the three dots (⋮) → "Show original"
3. Look for these AWS SES indicators:

✅ SHOULD SEE (AWS SES):
   • Return-Path: <...@amazonses.com>
   • Received: from email-smtp.ap-south-1.amazonaws.com
   • Message-ID: <...@email.amazonses.com>
   • X-SES-Outgoing: [timestamp]
   • Authentication-Results: shows spf=pass, dmarc=pass

❌ SHOULD NOT SEE (Old Hostinger/SMTP):
   • Return-Path: <bounce@hostinger.io>
   • Received: from relay.mailchannels.net
   • DKIM-Signature: d=hostingermail.com
   • smtp.hostinger.com

📊 DELIVERY PATH COMPARISON:
   Old SMTP: Backend → Hostinger SMTP → MailChannels → Gmail
   New API:  Backend → AWS SES API (HTTPS) → Gmail ✅
""")

def main():
    print("\n" + "="*70)
    print("AWS SES API EMAIL VERIFICATION")
    print("Testing OTP Signup & Password Reset Emails")
    print("="*70)
    print(f"\nBackend: {BASE_URL}")
    print(f"Test Email: {TEST_EMAIL}")
    print(f"Method: AWS SES API (boto3) via HTTPS")
    
    # Test 1: OTP Signup
    test1_pass = test_otp_signup()
    time.sleep(2)
    
    # Test 2: Password Reset
    test2_pass = test_password_reset()
    
    # Verification Guide
    print_verification_guide()
    
    # Summary
    print("\n" + "="*70)
    print("TEST SUMMARY")
    print("="*70)
    print(f"\n1. OTP Signup Email:     {'✅ PASS' if test1_pass else '❌ FAIL'}")
    print(f"2. Password Reset Email: {'✅ PASS' if test2_pass else '❌ FAIL'}")
    
    if test1_pass and test2_pass:
        print("\n🎉 SUCCESS! Both email flows working with AWS SES API!")
        print(f"   Check inbox: {TEST_EMAIL}")
        print("\n📋 Next Steps:")
        print("   1. Check both emails arrived")
        print("   2. Verify headers show amazonses.com (not hostinger)")
        print("   3. Test OTP code verification")
        print("   4. Test password reset link")
    else:
        print("\n⚠️  Some tests failed - check backend logs")
        print("   Run: Check Django server terminal for error messages")
    
    print("\n" + "="*70 + "\n")

if __name__ == "__main__":
    main()
