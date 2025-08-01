"""
Custom pipeline functions for social authentication
"""
from django.contrib.auth import get_user_model

User = get_user_model()


def create_user(strategy, details, backend, user=None, *args, **kwargs):
    """
    Custom pipeline function to create users that work with our custom User model.
    
    This function handles:
    - Creating new users with email and full_name using our custom UserManager
    - Mapping Google profile data to our User model fields
    - Handling existing users
    - Ensuring compatibility with email-based authentication
    """
    if user:
        return {'is_new': False}
    
    # Extract user data from Google
    email = details.get('email')
    first_name = details.get('first_name', '')
    last_name = details.get('last_name', '')
    
    # Build full_name from available data
    full_name = f"{first_name} {last_name}".strip()
    if not full_name:
        # Fallback to other possible name fields
        full_name = details.get('fullname') or details.get('name', '')
    
    # Final fallback: use email prefix
    if not full_name and email:
        full_name = email.split('@')[0].replace('.', ' ').replace('_', ' ').title()
    
    if not email:
        return None
    
    # Check if user already exists
    try:
        existing_user = User.objects.get(email=email)
        return {
            'is_new': False,
            'user': existing_user
        }
    except User.DoesNotExist:
        pass
    
    # Create new user using our custom UserManager
    try:
        # Use the UserManager.create_user method to ensure proper user creation
        user = User.objects.create_user(
            email=email,
            full_name=full_name,
            agreed_to_terms=True,  # Assume Google users agree to terms
            is_active=True,  # Activate Google users immediately
        )
        return {
            'is_new': True,
            'user': user
        }
    except Exception as e:
        # Log the error for debugging
        print(f"Error creating user in pipeline: {str(e)}")
        return None


def associate_by_email(strategy, details, user=None, *args, **kwargs):
    """
    Associate current social account with a user with the same email address.
    This ensures existing users can sign in with Google using their existing account.
    """
    if user:
        return None
    
    email = details.get('email')
    if email:
        # Case insensitive email lookup to match existing users
        try:
            existing_user = User.objects.get(email__iexact=email)
            return {'user': existing_user}
        except User.DoesNotExist:
            return None
        except User.MultipleObjectsReturned:
            # If multiple users with same email (shouldn't happen with unique constraint)
            # Use the first active one
            existing_user = User.objects.filter(email__iexact=email, is_active=True).first()
            return {'user': existing_user} if existing_user else None
    
    return None
