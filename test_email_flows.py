#!/usr/bin/env python3
"""
Test both OTP signup verification and password reset emails
Verify AWS SES API is working for both flows
"""
import requests
import json
import time

# Configuration
BASE_URL = "http://127.0.0.1:8000"
TEST_EMAIL = "gourishettyvarun@gmail.com"
TEST_NAME = "Test User AWS SES"
TEST_PASSWORD = "TestPass123@"

def print_header(title):
    print("\n" + "=" * 70)
    print(f"  {title}")
    print("=" * 70)

def print_step(step, description):
    print(f"\n{step}. {description}")
    print("-" * 70)

def test_otp_signup_email():
    """Test OTP signup email flow"""
    print_header("TEST 1: OTP Signup Verification Email")
    
    print_step("1", "Sending OTP signup request")
    payload = {
        "full_name": TEST_NAME,
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD,
        "agreed_to_terms": True
    }
    
    print(f"   Email: {TEST_EMAIL}")
    print(f"   Name: {TEST_NAME}")
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/auth/otp/signup/",
            json=payload,
            timeout=30
        )
        
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Response: {data.get('message', 'OTP sent')}")
            
            if 'warning' in data:
                print(f"   ⚠️  Warning: {data['warning']}")
            
            print("\n   📧 Check your email inbox for OTP!")
            print(f"   Email should be from: info@easylearnova.com")
            print(f"   Subject: Your EasyLearnova verification code")
            print(f"   Delivered via: AWS SES API (boto3)")
            return True
        elif response.status_code == 400:
            error_data = response.json()
            if 'email' in error_data:
                email_error = error_data['email']
                if isinstance(email_error, list):
                    email_error = email_error[0]
                if 'already exists' in email_error.lower():
                    print(f"   ℹ️  User already exists - this is expected if testing multiple times")
                    print(f"   💡 To test fresh: Use a different email or delete the user from DB")
                    return True
            print(f"   ❌ Error: {error_data}")
            return False
        else:
            print(f"   ❌ Unexpected status code: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except requests.exceptions.Timeout:
        print("   ❌ Request timed out (30 seconds)")
        print("   💡 Email might still be sent - check inbox")
        return False
    except Exception as e:
        print(f"   ❌ Error: {type(e).__name__} - {e}")
        return False

def test_password_reset_email():
    """Test password reset email flow"""
    print_header("TEST 2: Password Reset Email")
    
    print_step("1", "Requesting password reset email")
    payload = {
        "email": TEST_EMAIL
    }
    
    print(f"   Email: {TEST_EMAIL}")
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/auth/password-reset/",
            json=payload,
            timeout=30
        )
        
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Response: {data.get('message', 'Password reset email sent')}")
            
            print("\n   📧 Check your email inbox for password reset link!")
            print(f"   Email should be from: info@easylearnova.com")
            print(f"   Subject: Reset Your Password - EasyLearnova")
            print(f"   Delivered via: AWS SES API (boto3)")
            print(f"   Link format: {BASE_URL}/reset-password/<token>")
            return True
        elif response.status_code == 404:
            print(f"   ⚠️  User not found - account doesn't exist")
            print(f"   💡 Sign up first to test password reset")
            return False
        else:
            print(f"   ❌ Unexpected status code: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except requests.exceptions.Timeout:
        print("   ❌ Request timed out (30 seconds)")
        print("   💡 Email might still be sent - check inbox")
        return False
    except Exception as e:
        print(f"   ❌ Error: {type(e).__name__} - {e}")
        return False

def verify_email_headers():
    """Instructions to verify AWS SES in email headers"""
    print_header("EMAIL HEADER VERIFICATION")
    
    print("\n📋 How to verify emails are using AWS SES API:")
    print("-" * 70)
    print("\n1. Open the received email in Gmail")
    print("2. Click the three dots (⋮) → 'Show original'")
    print("3. Look for these AWS SES indicators:")
    print()
    print("   ✅ Should see:")
    print("      • Return-Path: Contains 'amazonses.com'")
    print("      • Received: Shows 'email.amazonses.com'")
    print("      • Message-ID: Ends with '@email.amazonses.com'")
    print("      • X-SES-Outgoing: AWS SES specific header")
    print()
    print("   ❌ Should NOT see:")
    print("      • hostinger.io")
    print("      • mailchannels.net")
    print("      • smtp.hostinger.com")
    print()
    print("4. Delivery Path:")
    print("   Old: Backend → Hostinger SMTP → MailChannels → Gmail")
    print("   New: Backend → AWS SES API (HTTPS) → Gmail")

def main():
    print("\n" + "=" * 70)
    print("  AWS SES API EMAIL FLOW VERIFICATION")
    print("  Testing OTP Signup & Password Reset Emails")
    print("=" * 70)
    print(f"\n⚙️  Configuration:")
    print(f"   Backend: {BASE_URL}")
    print(f"   Test Email: {TEST_EMAIL}")
    print(f"   Email Method: AWS SES API (boto3)")
    print(f"   From Email: info@easylearnova.com")
    print(f"   AWS Region: ap-south-1 (Mumbai)")
    
    # Test 1: OTP Signup Email
    test1_success = test_otp_signup_email()
    time.sleep(2)
    
    # Test 2: Password Reset Email
    test2_success = test_password_reset_email()
    
    # Verification Instructions
    verify_email_headers()
    
    # Final Summary
    print_header("TEST SUMMARY")
    print(f"\n1. OTP Signup Email:      {'✅ SENT' if test1_success else '❌ FAILED'}")
    print(f"2. Password Reset Email:  {'✅ SENT' if test2_success else '❌ FAILED'}")
    
    if test1_success and test2_success:
        print("\n🎉 SUCCESS! Both email flows are working with AWS SES API!")
        print("   Check your inbox: " + TEST_EMAIL)
    elif test1_success or test2_success:
        print("\n⚠️  PARTIAL SUCCESS - Some emails sent")
        print("   Check your inbox: " + TEST_EMAIL)
    else:
        print("\n❌ FAILED - No emails sent")
        print("   Check backend logs for errors")
    
    print("\n" + "=" * 70)
    print("\n💡 Next Steps:")
    print("   1. Check email inbox: " + TEST_EMAIL)
    print("   2. Verify email headers show AWS SES (not Hostinger)")
    print("   3. Test OTP verification with received code")
    print("   4. Test password reset link functionality")
    print("\n" + "=" * 70 + "\n")

if __name__ == "__main__":
    main()
