from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User  # pyrefly: ignore [missing-import]
from django.contrib.auth import authenticate
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from .models import EmailOTP  # pyrefly: ignore [missing-import]
import re

class UserSerializer(serializers.ModelSerializer):
    credit_balance = serializers.SerializerMethodField()

    def get_credit_balance(self, obj):
        """Compute credit balance from CreditTransaction records."""
        try:
            from django.db.models import Sum
            from scrib.models import CreditTransaction
            # Admin users get unlimited credits
            if getattr(obj, 'is_staff', False) or getattr(obj, 'is_superuser', False):
                return 10 ** 9
            
            credits_in = CreditTransaction.objects.filter(
                user=obj, direction=CreditTransaction.DIRECTION_CREDIT
            ).aggregate(total=Sum('credits'))['total'] or 0
            
            credits_out = CreditTransaction.objects.filter(
                user=obj, direction=CreditTransaction.DIRECTION_DEBIT
            ).aggregate(total=Sum('credits'))['total'] or 0
            
            return int(credits_in - credits_out)
        except Exception:
            return 0

    class Meta:
        model = User
        fields = ('id', 'email', 'full_name', 'auth_method', 'agreed_to_terms', 'has_seen_onboarding', 'credit_balance')

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ('email', 'full_name', 'password', 'confirm_password', 'agreed_to_terms', 'signup_source')
        extra_kwargs = {
            'agreed_to_terms': {'required': True}
        }

    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError("Password fields didn't match.")
        if not attrs.get('agreed_to_terms'):
            raise serializers.ValidationError("You must agree to the Terms and Conditions.")
        return attrs

    def create(self, validated_data):
        validated_data.pop('confirm_password', None)
        user = User.objects.create_user(
            email=validated_data['email'],
            full_name=validated_data['full_name'],
            password=validated_data['password'],
            agreed_to_terms=validated_data.get('agreed_to_terms', False),
            signup_source=validated_data.get('signup_source', 'main')
        )
        return user

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True)

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        if email and password:
            user = authenticate(request=self.context.get('request'),
                              email=email, password=password)
            
            if not user:
                msg = _('Unable to log in with provided credentials.')
                raise serializers.ValidationError(msg, code='authorization')
            
            if not user.is_active:
                msg = _('User account is disabled.')
                raise serializers.ValidationError(msg, code='authorization')
        else:
            msg = _('Must include "email" and "password".')
            raise serializers.ValidationError(msg, code='authorization')

        attrs['user'] = user
        return attrs


class OTPSignupSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=255)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, validators=[validate_password])
    agreed_to_terms = serializers.BooleanField()
    signup_source = serializers.CharField(required=False, allow_blank=True, max_length=50)

    def validate_email(self, value):
        value = value.strip().lower()
        if User.objects.filter(email__iexact=value, is_active=True).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value

    def validate_full_name(self, value):
        if len(value.strip()) < 2:
            raise serializers.ValidationError("Please provide your full name.")
        return value.strip()

    def validate(self, attrs):
        if not attrs.get('agreed_to_terms'):
            raise serializers.ValidationError("You must agree to the Terms and Conditions.")
        return attrs


class OTPVerifySerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(max_length=6)

    def validate(self, attrs):
        email = attrs['email'].strip().lower()
        code = attrs['code'].strip()
        if not re.fullmatch(r"\d{6}", code):
            raise serializers.ValidationError("Invalid OTP code format.")
        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            raise serializers.ValidationError("User not found for this email.")
        attrs['user'] = user
        return attrs


class OTPResendSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        value = value.strip().lower()
        try:
            user = User.objects.get(email__iexact=value)
        except User.DoesNotExist:
            raise serializers.ValidationError("No pending signup for this email.")
        if user.is_active:
            raise serializers.ValidationError("User is already verified.")
        self.context['user'] = user
        return value