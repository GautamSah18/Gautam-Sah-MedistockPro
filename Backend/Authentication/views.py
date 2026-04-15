from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser

from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.cache import cache
from django.core.mail import send_mail
from django.conf import settings

import logging

from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import serializers

from .models import CustomUser, OTP, PharmacyDocument
from .serializers import (
    UserProfileSerializer,
    OTPVerificationSerializer,
    ResendOTPSerializer,
    ForgotPasswordSerializer,
    ResetPasswordSerializer,
)
from .forms import RegistrationStep1Form, RegistrationStep2Form, LoginForm

logger = logging.getLogger(__name__)


# Registration Step 1
@api_view(['POST'])
@permission_classes([AllowAny])
def registration_step1(request):
    form = RegistrationStep1Form(request.data)

    if request.data.get('role') == 'admin':
        return Response({"error": "Admin registration not allowed"}, status=400)

    if not form.is_valid():
        return Response(form.errors, status=400)

    try:
        user = form.save(commit=True)
        user.is_active = False
        user.save()

        otp = OTP.generate_otp(user)

        print("Generated registration OTP:", otp.code)
        print("Sending registration OTP to:", user.email)

        send_mail(
            "Medistock OTP Verification",
            f"Your OTP is {otp.code}. It expires in 10 minutes.",
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
        )

        print("Registration OTP email sent successfully")

        return Response(
            {
                "message": "Registration successful. Please check your email for the OTP.",
                "user_id": user.id,
                "email": user.email,
            },
            status=201
        )

    except Exception as e:
        print("Registration OTP send failed:", str(e))
        return Response(
            {"error": f"Failed to send OTP: {str(e)}"},
            status=500
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def send_otp(request):
    serializer = ResendOTPSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    try:
        user = CustomUser.objects.get(email=serializer.validated_data['email'])
        otp = OTP.generate_otp(user)

        print("Generated resend OTP:", otp.code)
        print("Sending resend OTP to:", user.email)

        send_mail(
            "Medistock OTP",
            f"Your OTP is {otp.code}. It expires in 10 minutes.",
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
        )

        print("Resend OTP email sent successfully")

        return Response({"message": "OTP resent"}, status=200)

    except CustomUser.DoesNotExist:
        return Response({"error": "User not found"}, status=404)
    except Exception as e:
        print("Resend OTP failed:", str(e))
        return Response({"error": f"Failed to resend OTP: {str(e)}"}, status=500)


# Verify OTP
@api_view(['POST'])
@permission_classes([AllowAny])
def verify_otp(request):
    serializer = OTPVerificationSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    user = serializer.validated_data['user']

    # Activate user
    user.is_active = True

    # Auto-approve delivery persons and provide tokens for auto-login
    if user.role == 'delivery':
        user.registration_complete = True
        user.is_approved = True
        user.save(update_fields=["is_active", "registration_complete", "is_approved"])

        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "message": "OTP verified! You are now logged in.",
                "next_step": "delivery_dashboard",
                "user_id": user.id,
                "role": user.role,
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "role": user.role,
                }
            },
            status=200
        )

    user.save(update_fields=["is_active"])

    # Allow step 2 (upload documents) for others
    cache.set(f"registration_{user.id}", user.id, timeout=3600)

    return Response(
        {
            "message": "OTP verified successfully",
            "next_step": "upload_documents",
            "user_id": user.id,
            "role": user.role
        },
        status=200
    )


# Registration Step 2
@api_view(['POST'])
@permission_classes([AllowAny])
@parser_classes([MultiPartParser, FormParser])
def registration_step2(request):
    user_id = request.data.get("user_id")

    if not cache.get(f"registration_{user_id}"):
        return Response({"error": "Session expired"}, status=400)

    user = CustomUser.objects.get(id=user_id)

    if not user.otps.filter(is_verified=True).exists():
        return Response({"error": "OTP not verified"}, status=400)

    form = RegistrationStep2Form(request.data, request.FILES)

    if not form.is_valid():
        return Response(form.errors, status=400)

    docs = form.save(commit=False)
    docs.user = user
    docs.save()

    user.registration_complete = True
    user.save(update_fields=["registration_complete"])

    cache.delete(f"registration_{user_id}")

    return Response(
        {"message": "Documents uploaded successfully"},
        status=201
    )


# Login (JWT)
@api_view(['POST'])
@permission_classes([AllowAny])
def user_login(request):
    logger.info(f"Login attempt for email: {request.data.get('email')}, role: {request.data.get('role')}")

    form = LoginForm(request.data)

    if not form.is_valid():
        logger.warning(f"Login form validation failed: {form.errors}")
        return Response(form.errors, status=400)

    user = authenticate(
        request,
        username=form.cleaned_data['email'],
        password=form.cleaned_data['password']
    )

    if not user:
        try:
            existing = CustomUser.objects.get(email=form.cleaned_data['email'])
            if not existing.is_active:
                logger.warning(f"Login failed: account not active for {form.cleaned_data['email']}")
                return Response({"error": "Account is not active. Please verify your email first."}, status=400)
            logger.warning(f"Login failed: wrong password for {form.cleaned_data['email']}")
        except CustomUser.DoesNotExist:
            logger.warning(f"Login failed: no user found with email {form.cleaned_data['email']}")
        return Response({"error": "Invalid email or password"}, status=400)

    if user.role != form.cleaned_data['role']:
        logger.warning(f"Login failed: role mismatch for {user.email} (expected {form.cleaned_data['role']}, got {user.role})")
        return Response({"error": f"This account is registered as '{user.role}', not '{form.cleaned_data['role']}'"}, status=400)

    # Admin must log in before any other user can log in
    admin_logged_in_before = CustomUser.objects.filter(role='admin', last_login__isnull=False).exists()
    if user.role != 'admin' and not admin_logged_in_before:
        logger.warning(f"Login blocked: admin has not logged in yet. User={user.email}")
        return Response(
            {"error": "Admin must log in first before other users can access the system."},
            status=403
        )

    if not user.can_login():
        logger.warning(f"Login failed: can_login() returned False for {user.email} (approved={user.is_approved}, reg_complete={user.registration_complete})")
        return Response({"error": "Account not approved yet. Please wait for admin approval."}, status=403)

    refresh = RefreshToken.for_user(user)

    logger.info(f"Login successful for {user.email}")
    return Response({
        "access": str(refresh.access_token),
        "refresh": str(refresh),
        "user": {
            "id": user.id,
            "email": user.email,
            "role": user.role,
        }
    })


# Dashboard
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard(request):
    return Response({
        "id": request.user.id,
        "email": request.user.email,
        "role": request.user.role,
    })


# Logout
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    token = RefreshToken(request.data.get("refresh"))
    token.blacklist()
    return Response({"message": "Logged out"}, status=205)


# User Profile
@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def user_profile(request):
    user = request.user

    # GET profile
    if request.method == 'GET':
        serializer = UserProfileSerializer(user)
        data = serializer.data
        data['id'] = user.id
        data['role'] = user.role
        data['profile_picture'] = (
            request.build_absolute_uri(user.profile_picture.url)
            if user.profile_picture else None
        )
        return Response(data, status=200)

    # UPDATE profile
    serializer = UserProfileSerializer(
        user,
        data=request.data,
        partial=True
    )
    serializer.is_valid(raise_exception=True)
    serializer.save()

    data = serializer.data
    data['id'] = user.id
    data['role'] = user.role
    data['profile_picture'] = (
        request.build_absolute_uri(user.profile_picture.url)
        if user.profile_picture else None
    )

    return Response(data, status=200)


# Change Password
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    user = request.user

    if not user.check_password(request.data.get("current_password")):
        return Response({"error": "Wrong password"}, status=400)

    validate_password(request.data.get("new_password"), user=user)
    user.set_password(request.data.get("new_password"))
    user.save()

    return Response({"message": "Password updated"}, status=200)


# Admin User Management
class PharmacyUserAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'email', 'role', 'is_active', 'is_staff', 'is_approved', 'registration_complete']


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_user_list(request):
    if request.user.role != 'admin':
        return Response({"error": "Admin access required"}, status=403)

    users = CustomUser.objects.all().order_by('-created_at')
    data = []
    for u in users:
        data.append({
            'id': u.id,
            'email': u.email,
            'role': u.role,
            'is_active': u.is_active,
            'is_staff': u.is_staff,
            'is_approved': u.is_approved,
            'registration_complete': u.registration_complete
        })
    return Response(data, status=200)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def admin_user_detail(request, pk):
    if request.user.role != 'admin':
        return Response({"error": "Admin access required"}, status=403)

    try:
        user = CustomUser.objects.get(pk=pk)
    except CustomUser.DoesNotExist:
        return Response({"error": "User not found"}, status=404)

    if request.method == 'GET':
        user_data = {
            'id': user.id,
            'email': user.email,
            'role': user.role,
            'is_active': user.is_active,
            'is_staff': user.is_staff,
            'is_approved': user.is_approved,
            'registration_complete': user.registration_complete,
            'documents': None
        }

        try:
            docs = PharmacyDocument.objects.get(user=user)
            user_data['documents'] = {
                'pharmacy_license': request.build_absolute_uri(docs.pharmacy_license.url) if docs.pharmacy_license else None,
                'pan_number': request.build_absolute_uri(docs.pan_number.url) if docs.pan_number else None,
                'citizenship': request.build_absolute_uri(docs.citizenship.url) if docs.citizenship else None,
                'status': docs.status,
                'admin_notes': docs.admin_notes,
                'uploaded_at': docs.uploaded_at,
                'reviewed_at': docs.reviewed_at
            }
        except PharmacyDocument.DoesNotExist:
            pass

        return Response(user_data, status=200)

    elif request.method == 'PUT':
        if 'is_active' in request.data:
            user.is_active = request.data['is_active']
        if 'is_staff' in request.data:
            user.is_staff = request.data['is_staff']
        if 'is_approved' in request.data:
            user.is_approved = request.data['is_approved']
        if 'registration_complete' in request.data:
            user.registration_complete = request.data['registration_complete']

        user.save()

        if 'document_status' in request.data or 'admin_notes' in request.data:
            try:
                docs = PharmacyDocument.objects.get(user=user)
                if 'document_status' in request.data:
                    docs.status = request.data['document_status']
                if 'admin_notes' in request.data:
                    docs.admin_notes = request.data['admin_notes']
                docs.save()
            except PharmacyDocument.DoesNotExist:
                pass

        return Response({"message": "User updated successfully"}, status=200)

    elif request.method == 'DELETE':
        user.delete()
        return Response({"message": "User deleted successfully"}, status=204)


# Forgot Password
@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password_request(request):
    serializer = ForgotPasswordSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    try:
        email = serializer.validated_data['email']
        user = CustomUser.objects.get(email=email)

        otp = OTP.generate_otp(user)

        print("Generated forgot password OTP:", otp.code)
        print("Sending forgot password OTP to:", user.email)

        send_mail(
            "Medistock Password Reset OTP",
            f"Your OTP for password reset is {otp.code}. It expires in 10 minutes.",
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
        )

        print("Forgot password OTP email sent successfully")

        return Response(
            {"message": "OTP sent to your email address."},
            status=status.HTTP_200_OK
        )

    except CustomUser.DoesNotExist:
        return Response({"error": "User not found"}, status=404)
    except Exception as e:
        print("Forgot password OTP send failed:", str(e))
        return Response(
            {"error": f"Failed to send password reset OTP: {str(e)}"},
            status=500
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password_verify(request):
    serializer = OTPVerificationSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    return Response(
        {"message": "OTP verified successfully. You can now reset your password."},
        status=status.HTTP_200_OK
    )


@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password_reset(request):
    serializer = ResetPasswordSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    user = serializer.validated_data['user']
    new_password = serializer.validated_data['new_password']
    otp_obj = serializer.validated_data['otp_obj']

    user.set_password(new_password)
    user.save()

    otp_obj.delete()

    return Response(
        {"message": "Password reset successfully. You can now log in with your new password."},
        status=status.HTTP_200_OK
    )