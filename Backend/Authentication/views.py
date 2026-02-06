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

from rest_framework_simplejwt.tokens import RefreshToken

from .models import CustomUser, OTP
from .serializers import (
    UserProfileSerializer,
    OTPVerificationSerializer,
    ResendOTPSerializer,
)
from .forms import RegistrationStep1Form, RegistrationStep2Form, LoginForm



# Registration Step 1

@api_view(['POST'])
@permission_classes([AllowAny])
def registration_step1(request):
    form = RegistrationStep1Form(request.data)

    if request.data.get('role') == 'admin':
        return Response({"error": "Admin registration not allowed"}, status=400)

    if not form.is_valid():
        return Response(form.errors, status=400)

    user = form.save(commit=True)
    user.is_active = False
    user.save()

    otp = OTP.generate_otp(user)

    send_mail(
        "Medistock OTP Verification",
        f"Your OTP is {otp.code}. It expires in 10 minutes.",
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        fail_silently=False,
    )

    return Response(
        {
            "message": "OTP sent to email",
            "user_id": user.id,
            "email": user.email,
        },
        status=201
    )



# Resend OTP

@api_view(['POST'])
@permission_classes([AllowAny])
def send_otp(request):
    serializer = ResendOTPSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    user = CustomUser.objects.get(email=serializer.validated_data['email'])
    otp = OTP.generate_otp(user)

    send_mail(
        "Medistock OTP",
        f"Your OTP is {otp.code}. It expires in 10 minutes.",
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        fail_silently=False,
    )

    return Response({"message": "OTP resent"}, status=200)



# Verify OTP

@api_view(['POST'])
@permission_classes([AllowAny])
def verify_otp(request):
    serializer = OTPVerificationSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    user = serializer.validated_data['user']

    # Activate user
    user.is_active = True
    user.save(update_fields=["is_active"])

    # Allow step 2 (upload documents)
    cache.set(f"registration_{user.id}", user.id, timeout=3600)

    return Response(
        {
            "message": "OTP verified successfully",
            "next_step": "upload_documents",
            "user_id": user.id,
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
    form = LoginForm(request.data)

    if not form.is_valid():
        return Response(form.errors, status=400)

    user = authenticate(
        request,
        username=form.cleaned_data['email'],
        password=form.cleaned_data['password']
    )

    if not user or user.role != form.cleaned_data['role']:
        return Response({"error": "Invalid credentials"}, status=400)

    if not user.can_login():
        return Response({"error": "Account not approved"}, status=403)

    refresh = RefreshToken.for_user(user)

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
