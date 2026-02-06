from django import forms
from .models import CustomUser, PharmacyDocument


# Registration Step 1

class RegistrationStep1Form(forms.ModelForm):
    # Allowed roles during registration
    ROLE_CHOICES = (
        ('customer', 'Customer'),
        ('delivery', 'Delivery Person'),
    )

    password = forms.CharField(
        widget=forms.PasswordInput(),
        min_length=8
    )
    password_confirm = forms.CharField(
        widget=forms.PasswordInput(),
        label="Confirm Password"
    )
    role = forms.ChoiceField(choices=ROLE_CHOICES)

    class Meta:
        model = CustomUser
        fields = ['email', 'role']

    # Ensure email is unique
    def clean_email(self):
        email = self.cleaned_data['email']
        if CustomUser.objects.filter(email=email).exists():
            raise forms.ValidationError("Email already registered")
        return email

    # Ensure passwords match
    def clean(self):
        cleaned_data = super().clean()
        if cleaned_data.get('password') != cleaned_data.get('password_confirm'):
            raise forms.ValidationError("Passwords do not match")
        return cleaned_data

    # Create user with hashed password
    def save(self, commit=True):
        user = super().save(commit=False)
        user.set_password(self.cleaned_data['password'])
        user.role = self.cleaned_data['role']
        if commit:
            user.save()
        return user


# Registration Step 2

class RegistrationStep2Form(forms.ModelForm):
    class Meta:
        model = PharmacyDocument
        fields = ['pharmacy_license', 'pan_number', 'citizenship']



# Login Form

class LoginForm(forms.Form):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('customer', 'Customer'),
        ('delivery', 'Delivery Person'),
    )

    email = forms.EmailField()
    password = forms.CharField(widget=forms.PasswordInput())
    role = forms.ChoiceField(choices=ROLE_CHOICES)
