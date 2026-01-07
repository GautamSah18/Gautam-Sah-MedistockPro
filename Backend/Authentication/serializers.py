from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import CustomUser
from django.contrib.auth.password_validation import validate_password

class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['email', 'password', 'role']
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def create(self, validated_data):
        user = CustomUser.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            role=validated_data['role'],
            is_approved=False,
            registration_complete=False
        )
        return user
    
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
            raise serializers.ValidationError("Invalid credentials")

        if user.role != data['role']:
            raise serializers.ValidationError("Role mismatch")

        if not user.can_login():
            raise serializers.ValidationError("Account not approved or incomplete")

        data['user'] = user
        return data


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['email', 'first_name', 'last_name', 'profile_picture', 'updated_at']
        read_only_fields = ['email', 'updated_at']
    
    def update(self, instance, validated_data):
        # Only allow updating first_name, last_name, and profile_picture
        if 'first_name' in validated_data:
            instance.first_name = validated_data['first_name']
        if 'last_name' in validated_data:
            instance.last_name = validated_data['last_name']
        if 'profile_picture' in validated_data:
            # Delete old profile picture if exists
            if instance.profile_picture:
                try:
                    if default_storage.exists(instance.profile_picture.name):
                        default_storage.delete(instance.profile_picture.name)
                except:
                    pass  # Ignore errors when deleting old file
            instance.profile_picture = validated_data['profile_picture']
        
        instance.save()
        return instance
