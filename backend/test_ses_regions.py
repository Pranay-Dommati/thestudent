#!/usr/bin/env python3
"""
Test AWS SES SMTP with multiple region endpoints
"""
import socket
import smtplib

# AWS SES SMTP Credentials
SMTP_USERNAME = "AKIAWEBLRWIXNZEPOR65"
SMTP_PASSWORD = "enEQgQGq+NbY/3PbuyD5vIl9xY/oktgBTxwRVXXI"
SMTP_PORT = 587

# Common AWS SES SMTP endpoints by region
SES_ENDPOINTS = {
    "us-east-1": "email-smtp.us-east-1.amazonaws.com",  # US East (N. Virginia)
    "us-east-2": "email-smtp.us-east-2.amazonaws.com",  # US East (Ohio)
    "us-west-1": "email-smtp.us-west-1.amazonaws.com",  # US West (N. California)
    "us-west-2": "email-smtp.us-west-2.amazonaws.com",  # US West (Oregon)
    "ap-south-1": "email-smtp.ap-south-1.amazonaws.com",  # Asia Pacific (Mumbai)
    "ap-south-2": "email-smtp.ap-south-2.amazonaws.com",  # Asia Pacific (Hyderabad)
    "ap-northeast-1": "email-smtp.ap-northeast-1.amazonaws.com",  # Asia Pacific (Tokyo)
    "ap-southeast-1": "email-smtp.ap-southeast-1.amazonaws.com",  # Asia Pacific (Singapore)
    "ap-southeast-2": "email-smtp.ap-southeast-2.amazonaws.com",  # Asia Pacific (Sydney)
    "eu-west-1": "email-smtp.eu-west-1.amazonaws.com",  # Europe (Ireland)
    "eu-central-1": "email-smtp.eu-central-1.amazonaws.com",  # Europe (Frankfurt)
}

def test_endpoint(region, endpoint):
    """Test a specific SES endpoint"""
    print(f"\n{'='*70}")
    print(f"Testing: {region}")
    print(f"Endpoint: {endpoint}")
    print(f"{'='*70}")
    
    # Test 1: DNS Resolution
    try:
        ip = socket.gethostbyname(endpoint)
        print(f"✅ DNS Resolution: {ip}")
    except socket.gaierror:
        print(f"❌ DNS Resolution: Failed")
        return False
    
    # Test 2: Port Connectivity
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(5)
        result = sock.connect_ex((endpoint, SMTP_PORT))
        sock.close()
        if result == 0:
            print(f"✅ Port {SMTP_PORT}: Open")
        else:
            print(f"❌ Port {SMTP_PORT}: Closed")
            return False
    except Exception as e:
        print(f"❌ Port test failed: {e}")
        return False
    
    # Test 3: SMTP Connection & Authentication
    try:
        server = smtplib.SMTP(endpoint, SMTP_PORT, timeout=10)
        server.starttls()
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        print(f"✅ Authentication: SUCCESS")
        server.quit()
        return True
    except smtplib.SMTPAuthenticationError as e:
        print(f"❌ Authentication: FAILED - {e}")
        return False
    except Exception as e:
        print(f"❌ SMTP Error: {e}")
        return False

def find_working_endpoint():
    """Test all endpoints and find which one works"""
    print("\n" + "="*70)
    print("  AWS SES SMTP ENDPOINT DISCOVERY")
    print("="*70)
    print(f"Testing {len(SES_ENDPOINTS)} AWS regions...")
    print("This may take a minute...\n")
    
    working_endpoints = []
    
    for region, endpoint in SES_ENDPOINTS.items():
        if test_endpoint(region, endpoint):
            working_endpoints.append((region, endpoint))
            print(f"\n🎉 WORKING ENDPOINT FOUND: {region}")
    
    # Summary
    print("\n" + "="*70)
    print("  SUMMARY")
    print("="*70)
    
    if working_endpoints:
        print(f"\n✅ Found {len(working_endpoints)} working endpoint(s):\n")
        for region, endpoint in working_endpoints:
            print(f"   Region: {region}")
            print(f"   Endpoint: {endpoint}")
            print(f"   Port: {SMTP_PORT}")
            print(f"   Username: {SMTP_USERNAME}")
            print(f"   Use TLS: Yes")
            print()
        
        # Provide Django configuration
        best_region, best_endpoint = working_endpoints[0]
        print("="*70)
        print("  DJANGO CONFIGURATION")
        print("="*70)
        print("\nAdd these to your .env file:\n")
        print(f'SMTP_HOST={best_endpoint}')
        print(f'SMTP_PORT={SMTP_PORT}')
        print(f'SMTP_USERNAME={SMTP_USERNAME}')
        print(f'SMTP_PASSWORD={SMTP_PASSWORD}')
        print('SMTP_USE_TLS=true')
        print('SMTP_USE_SSL=false')
        print("\n" + "="*70)
        
    else:
        print("\n❌ No working endpoints found!")
        print("\nPossible issues:")
        print("1. These credentials may not be valid SMTP credentials")
        print("2. The IAM user may not have SES permissions")
        print("3. SES may not be configured in any region for this account")
        print("\nNext steps:")
        print("1. Go to AWS SES Console")
        print("2. Choose a region (e.g., us-east-1 or ap-south-1)")
        print("3. Generate SMTP credentials from 'SMTP Settings'")
        print("4. Use those credentials instead")
        print("="*70)
    
    return working_endpoints

if __name__ == "__main__":
    find_working_endpoint()
    print()
