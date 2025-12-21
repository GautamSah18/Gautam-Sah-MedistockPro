from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from django.core.cache import cache
from .models import CustomUser
from .forms import RegistrationStep1Form, RegistrationStep2Form, LoginForm


@api_view(['POST'])
@permission_classes([AllowAny])
def registration_step1(request):
    """Step 1 registration (API)"""
    form = RegistrationStep1Form(request.data)

    role = request.data.get('role')
    if role == 'admin':
        return Response({
            "error": "Admin role cannot be selected during registration.",
            "allowed_roles": ["customer", "delivery"]
        }, status=status.HTTP_400_BAD_REQUEST)
    
    if form.is_valid():
        user = form.save(commit=True)
        user.is_active = True
        # Store registration user ID in cache instead of session
        registration_key = f'registration_{user.id}'
        cache.set(registration_key, user.id, timeout=3600)
        return Response({
            "message": "Account created! Please upload your documents.",
            "user_id": user.id
        }, status=status.HTTP_201_CREATED)
    return Response(form.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def registration_step2(request):
    """Step 2: Document upload (API)"""
    try:
        
        print("Request data:", request.data)
        print("Request FILES:", request.FILES)
        
        # Get and validate user_id
        user_id = request.data.get('user_id')
        print("Raw user_id from request:", user_id, "Type:", type(user_id))
        
        if not user_id:
            return Response({
                "error": "User ID is required.",
                "code": "missing_user_id"
            }, status=status.HTTP_400_BAD_REQUEST)
            
        
        try:
            user_id = int(user_id)
        except (ValueError, TypeError):
            return Response({
                "error": "Invalid user ID format. Must be a number.",
                "code": "invalid_user_id_format"
            }, status=status.HTTP_400_BAD_REQUEST)

        registration_key = f'registration_{user_id}'
        cached_user_id = cache.get(registration_key)
        
        if not cached_user_id:
            # Check if user exists but session expired
            if CustomUser.objects.filter(id=user_id).exists():
                return Response({
                    "error": "Registration session expired. Please start registration again.",
                    "code": "session_expired"
                }, status=status.HTTP_400_BAD_REQUEST)
            else:
                return Response({
                    "error": "Invalid registration session. Please complete step 1 registration first.",
                    "code": "invalid_session"
                }, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = CustomUser.objects.get(id=user_id)
        except CustomUser.DoesNotExist:
            # Clear the cache if user doesn't exist
            cache.delete(registration_key)
            return Response({
                "error": "User not found. Please start registration again.",
                "code": "user_not_found"
            }, status=status.HTTP_404_NOT_FOUND)

        if hasattr(user, 'documents'):
            return Response({
                "message": "Documents already uploaded. Waiting for admin approval.",
                "code": "documents_already_uploaded"
            }, status=status.HTTP_200_OK)

        # Check if required files are present in the request
        required_files = ['pharmacy_license', 'pan_number', 'citizenship']
        missing_files = [field for field in required_files if field not in request.FILES]
        if missing_files:
            return Response({
                "error": "Missing required documents",
                "missing_files": missing_files,
                "details": "Please upload all required documents: Pharmacy License, PAN Card, and Citizenship"
            }, status=status.HTTP_400_BAD_REQUEST)

        # Use both data and files parameters
        form = RegistrationStep2Form(data=request.data, files=request.FILES)
        
        if form.is_valid():
            try:
                documents = form.save(commit=False)
                documents.user = user
                documents.save()
                # Mark registration as complete and clear cache
                user.registration_complete = True
                user.save()
                cache.delete(registration_key)
                return Response({"message": "Documents uploaded successfully. Waiting for admin approval."}, status=status.HTTP_201_CREATED)
            except Exception as e:
                return Response({"error": f"Error saving documents: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:
            # Return form validation errors
            errors = {field: error[0] for field, error in form.errors.items()}
            return Response({
                "error": "Validation error",
                "details": errors
            }, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        return Response({"error": f"An error occurred: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def user_login(request):
    "Login API with JWT"
    form = LoginForm(request.data)

    if form.is_valid():
        
        email = form.cleaned_data['email']
        password = form.cleaned_data['password']
        role = form.cleaned_data['role']
        user = authenticate(request, username=email, password=password)

        if not user:
         return Response(
            {"error": "Invalid email or password."},
            status=status.HTTP_400_BAD_REQUEST
        )
        
        if user.role != role:
         return Response(
            {"error": "Invalid role selected for this account."},
            status=status.HTTP_403_FORBIDDEN
        )
        if user:
            # Admin users can login without document verification
            if user.role == 'admin':
                if user.is_active:
                    refresh = RefreshToken.for_user(user)
                    return Response({
                        "message": f"Welcome, {user.email}!",
                        "access": str(refresh.access_token),
                        "refresh": str(refresh),
                        "user": {
                            "id": user.id,
                            "email": user.email,
                            "role": user.role,
                            "is_approved": user.is_approved,
                            "registration_complete": user.registration_complete
                        }
                    }, status=status.HTTP_200_OK)
                else:
                    return Response({"error": "Account is inactive. Please contact administrator."}, status=status.HTTP_403_FORBIDDEN)
            
            # For non-admin users, check registration and approval status
            if user.can_login():
                refresh = RefreshToken.for_user(user)
                return Response({
                    "message": f"Welcome, {user.email}!",
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                    "user": {
                        "id": user.id,
                        "email": user.email,
                        "role": user.role,
                        "is_approved": user.is_approved,
                        "registration_complete": user.registration_complete
                    }
                }, status=status.HTTP_200_OK)
            elif not user.registration_complete:
                # Store registration user ID in cache
                registration_key = f'registration_{user.id}'
                cache.set(registration_key, user.id, timeout=3600)  # 1 hour expiry
                return Response({
                    "warning": "Complete registration by uploading documents.",
                    "user_id": user.id
                }, status=status.HTTP_200_OK)
            else:
                return Response({"error": "Account pending admin approval. Cannot log in yet."}, status=status.HTTP_403_FORBIDDEN)
        return Response({"error": "Invalid email or password."}, status=status.HTTP_400_BAD_REQUEST)
    return Response(form.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard(request):
    user = request.user

    base_data = {
        "id": user.id,
        "email": user.email,
        "role": user.role
    }

    if user.role == "admin":
        return Response({
            "dashboard": "admin",
            "user": base_data,
        })

    if user.role == "customer":
        documents = getattr(user, 'documents', None)
        return Response({
            "dashboard": "customer",
            "user": base_data,
            "documents_uploaded": bool(documents),
        })

    if user.role == "delivery":
        return Response({
            "dashboard": "delivery",
            "user": base_data,
        })

    return Response(
        {"error": "Invalid role"},
        status=status.HTTP_400_BAD_REQUEST
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """Logout API with JWT token blacklisting"""
    try:
        # Get the refresh token from the request
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response({"error": "Refresh token is required."}, status=status.HTTP_400_BAD_REQUEST)
            
        # Blacklist the refresh token
        token = RefreshToken(refresh_token)
        token.blacklist()
        
        return Response({"message": "Successfully logged out."}, status=status.HTTP_205_RESET_CONTENT)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
