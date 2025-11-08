#!/usr/bin/env python3
"""
Diagnostic script for AWS SES SMTP connectivity
"""
import socket
import ssl
import smtplib

# AWS SES SMTP Configuration
SMTP_HOST = "email-smtp.ap-south-1.amazonaws.com"
SMTP_PORT = 587
SMTP_USERNAME = "AKIAWEBLRWIXBWW2J65X"
SMTP_PASSWORD = "BAJqr+MIuFWHTTxocuq4DW9d3M8EeGqS+ftMwUNv52zV"

def test_dns_resolution():
    """Test if the SMTP host can be resolved"""
    print("\n" + "=" * 60)
    print("TEST 1: DNS Resolution")
    print("=" * 60)
    try:
        print(f"Resolving: {SMTP_HOST}")
        ip_address = socket.gethostbyname(SMTP_HOST)
        print(f"✅ SUCCESS: Resolved to {ip_address}")
        return True, ip_address
    except socket.gaierror as e:
        print(f"❌ FAILED: {e}")
        print("\nPossible causes:")
        print("1. No internet connection")
        print("2. DNS server not responding")
        print("3. Firewall blocking DNS queries")
        print("4. Incorrect hostname")
        return False, None

def test_port_connectivity(ip_address=None):
    """Test if port 587 is reachable"""
    print("\n" + "=" * 60)
    print("TEST 2: Port Connectivity")
    print("=" * 60)
    
    host = ip_address or SMTP_HOST
    
    try:
        print(f"Testing connection to {host}:{SMTP_PORT}")
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(10)
        result = sock.connect_ex((host, SMTP_PORT))
        sock.close()
        
        if result == 0:
            print(f"✅ SUCCESS: Port {SMTP_PORT} is open and reachable")
            return True
        else:
            print(f"❌ FAILED: Cannot connect to port {SMTP_PORT}")
            print("\nPossible causes:")
            print("1. Firewall blocking outbound connection")
            print("2. Corporate proxy blocking SMTP")
            print("3. AWS SES endpoint not accessible from your location")
            return False
    except Exception as e:
        print(f"❌ FAILED: {e}")
        return False

def test_smtp_banner():
    """Test if we can get SMTP banner"""
    print("\n" + "=" * 60)
    print("TEST 3: SMTP Banner")
    print("=" * 60)
    
    try:
        print(f"Connecting to {SMTP_HOST}:{SMTP_PORT}")
        server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10)
        banner = server.ehlo()
        print(f"✅ SUCCESS: Connected to SMTP server")
        print(f"Server response: {banner}")
        server.quit()
        return True
    except Exception as e:
        print(f"❌ FAILED: {e}")
        return False

def test_starttls():
    """Test STARTTLS encryption"""
    print("\n" + "=" * 60)
    print("TEST 4: STARTTLS Encryption")
    print("=" * 60)
    
    try:
        print("Starting TLS handshake...")
        server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10)
        server.starttls()
        print("✅ SUCCESS: TLS encryption established")
        server.quit()
        return True
    except Exception as e:
        print(f"❌ FAILED: {e}")
        return False

def test_authentication():
    """Test SMTP authentication"""
    print("\n" + "=" * 60)
    print("TEST 5: SMTP Authentication")
    print("=" * 60)
    
    try:
        print(f"Authenticating with username: {SMTP_USERNAME}")
        server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10)
        server.starttls()
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        print("✅ SUCCESS: Authentication successful!")
        server.quit()
        return True
    except smtplib.SMTPAuthenticationError as e:
        print(f"❌ FAILED: Authentication error")
        print(f"Error: {e}")
        print("\nPossible causes:")
        print("1. Incorrect Access Key ID or Secret Access Key")
        print("2. These are not SMTP credentials (need to generate from IAM)")
        print("3. IAM user lacks SES sending permissions")
        return False
    except Exception as e:
        print(f"❌ FAILED: {e}")
        return False

def run_all_tests():
    """Run all diagnostic tests"""
    print("\n" + "=" * 70)
    print("   AWS SES SMTP DIAGNOSTIC TEST SUITE")
    print("=" * 70)
    print(f"Target: {SMTP_HOST}:{SMTP_PORT}")
    print(f"Region: ap-south-1 (Asia Pacific - Mumbai)")
    print("=" * 70)
    
    results = []
    
    # Test 1: DNS Resolution
    dns_ok, ip_address = test_dns_resolution()
    results.append(("DNS Resolution", dns_ok))
    
    if not dns_ok:
        print("\n" + "=" * 70)
        print("⛔ CRITICAL: Cannot proceed without DNS resolution")
        print("=" * 70)
        print("\nTroubleshooting steps:")
        print("1. Check your internet connection")
        print("2. Try: ping google.com")
        print("3. Check your DNS settings")
        print("4. Try using a different network (mobile hotspot)")
        print("=" * 70)
        return False
    
    # Test 2: Port Connectivity
    port_ok = test_port_connectivity(ip_address)
    results.append(("Port Connectivity", port_ok))
    
    if not port_ok:
        print("\n" + "=" * 70)
        print("⚠️  WARNING: Port blocked - cannot proceed further")
        print("=" * 70)
        print("\nTry alternative port (465 with SSL):")
        print("SMTP_HOST = email-smtp.ap-south-2.amazonaws.com")
        print("SMTP_PORT = 465")
        print("USE_SSL = True")
        print("=" * 70)
        return False
    
    # Test 3: SMTP Banner
    banner_ok = test_smtp_banner()
    results.append(("SMTP Banner", banner_ok))
    
    # Test 4: STARTTLS
    tls_ok = test_starttls()
    results.append(("STARTTLS", tls_ok))
    
    # Test 5: Authentication
    auth_ok = test_authentication()
    results.append(("Authentication", auth_ok))
    
    # Summary
    print("\n" + "=" * 70)
    print("   TEST RESULTS SUMMARY")
    print("=" * 70)
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name:<30} {status}")
    print("=" * 70)
    
    all_passed = all(result for _, result in results)
    
    if all_passed:
        print("\n✅ ALL TESTS PASSED!")
        print("Your AWS SES SMTP credentials are working correctly.")
        print("You can now configure Django to use these settings.")
    else:
        print("\n❌ SOME TESTS FAILED!")
        print("Please fix the issues before configuring Django.")
    
    print("\n")
    return all_passed

if __name__ == "__main__":
    run_all_tests()
