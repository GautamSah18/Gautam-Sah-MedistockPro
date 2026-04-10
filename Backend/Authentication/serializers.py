from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.files.storage import default_storage
from django.utils import timezone

from .models import CustomUser, OTP


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        validators=[validate_password]
    )

    class Meta:
        model = CustomUser
        fields = ['email', 'password', 'role']

    def create(self, validated_data):
        user = CustomUser.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            role=validated_data['role'],
            is_approved=False,
            registration_complete=False,
            is_active=True,
        )
        return user


# ==========================
# Login Serializer
# ==========================
class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()
    role = serializers.CharField()

    def validate(self, data):
        user = authenticate(
            email=data['email'],
            password=data['password']
        )

        if not user:
            raise serializers.ValidationError("Invalid email or password")

        if user.role != data['role']:
            raise serializers.ValidationError("Role mismatch")

        if not user.can_login():
            raise serializers.ValidationError(
                "Account not approved or registration incomplete"
            )

        data['user'] = user
        return data


# ==========================
# User Profile Serializer
# ==========================
class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = [
            'email',
            'first_name',
            'last_name',
            'phone',
            'address',
            'bio',
            'profile_picture',
            'updated_at',
        ]
        read_only_fields = ['email', 'updated_at']

    def update(self, instance, validated_data):
        # Update text fields
        for field in ['first_name', 'last_name', 'phone', 'address', 'bio']:
            if field in validated_data:
                setattr(instance, field, validated_data[field])

        # Replace profile picture safely
        if 'profile_picture' in validated_data:
            if instance.profile_picture:
                try:
                    if default_storage.exists(instance.profile_picture.name):
                        default_storage.delete(instance.profile_picture.name)
                except Exception:
                    pass
            instance.profile_picture = validated_data['profile_picture']

        instance.save()
        return instance


# ==========================
# OTP Verification Serializer
# ==========================
class OTPVerificationSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(max_length=6)

    def validate_code(self, value):
        if len(value) != 6 or not value.isdigit():
            raise serializers.ValidationError("OTP code must be 6 digits.")
        return value

    def validate(self, data):
        try:
            user = CustomUser.objects.get(email=data['email'])
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError("User not found")

        try:
            otp = OTP.objects.filter(
                user=user,
                is_verified=False
            ).latest('created_at')
        except OTP.DoesNotExist:
            raise serializers.ValidationError("OTP not found or expired")

        if otp.is_expired():
            raise serializers.ValidationError("OTP has expired")

        # Increase attempts
        otp.attempts += 1
        otp.last_attempt_at = timezone.now()
        otp.save(update_fields=['attempts', 'last_attempt_at'])

        if otp.attempts > 5:
            raise serializers.ValidationError("Too many invalid attempts")

        if otp.code != data['code']:
            raise serializers.ValidationError("Invalid OTP")

        # Mark OTP as verified
        otp.is_verified = True
        otp.save(update_fields=['is_verified'])

        data['user'] = user
        return data



# Resend OTP Serializer

class ResendOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate(self, data):
        try:
            user = CustomUser.objects.get(email=data['email'])
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError("User not found")

        # Optional: prevent spamming
        recent_otp = OTP.objects.filter(
            user=user,
            is_verified=False,
            created_at__gte=timezone.now() - timezone.timedelta(minutes=1)
        ).first()

        if recent_otp:
            raise serializers.ValidationError(
                "Please wait before requesting a new OTP"
            )

        data['user'] = user
        return data

# ==========================
# Forgot Password Serializers
# ==========================

class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        if not CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("User with this email does not exist.")
        return value


class ResetPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6)
    new_password = serializers.CharField(write_only=True, validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        
        try:
            user = CustomUser.objects.get(email=data['email'])
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError("User not found")

        try:
            otp = OTP.objects.filter(
                user=user,
                code=data['otp'],
                is_verified=True
            ).latest('created_at')
        except OTP.DoesNotExist:
            raise serializers.ValidationError("Invalid or unverified OTP")

        if otp.is_expired():
            raise serializers.ValidationError("OTP has expired")

        data['user'] = user
        data['otp_obj'] = otp
        return data
