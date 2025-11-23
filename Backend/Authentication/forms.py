from django import forms
from .models import CustomUser, PharmacyDocument


class RegistrationStep1Form(forms.ModelForm):
    """Step 1: Email, and password registration"""
    password = forms.CharField(
        widget=forms.PasswordInput(attrs={'class': 'form-control', 'placeholder': 'Enter your password'}),
        min_length=8,
        help_text='Password must be at least 8 characters long.'
    )
    password_confirm = forms.CharField(
        widget=forms.PasswordInput(attrs={'class': 'form-control', 'placeholder': 'Confirm your password'}),
        label='Confirm Password'
    )

    class Meta:
        model = CustomUser
        fields = ['email', 'password']
        widgets = {
            'email': forms.EmailInput(attrs={'class': 'form-control', 'placeholder': 'Enter your email'}),
            
        }

    def clean_email(self):
        email = self.cleaned_data.get('email')
        if CustomUser.objects.filter(email=email).exists():
            raise forms.ValidationError('A user with this email already exists.')
        return email

    def clean_password_confirm(self):
        password = self.cleaned_data.get('password')
        password_confirm = self.cleaned_data.get('password_confirm')
        if password and password_confirm and password != password_confirm:
            raise forms.ValidationError("Passwords don't match.")
        return password_confirm

    def save(self, commit=True):
        user = super().save(commit=False)
        user.set_password(self.cleaned_data['password'])
        if commit:
            user.save()
        return user


class RegistrationStep2Form(forms.ModelForm):
    """Step 2: Document upload"""
    class Meta:
        model = PharmacyDocument
        fields = ['pharmacy_license', 'pan_number', 'citizenship']
        widgets = {
            'pharmacy_license': forms.FileInput(attrs={'class': 'form-control', 'accept':'.jpg,.jpeg,.png'}),
            'pan_number': forms.FileInput(attrs={'class': 'form-control', 'accept':'.jpg,.jpeg,.png'}),
            'citizenship': forms.FileInput(attrs={'class': 'form-control', 'accept':'.jpg,.jpeg,.png'}),
        }
        labels = {
            'pharmacy_license': 'Pharmacy License Document',
            'pan_number': 'PAN Card Document',
            'citizenship': 'Citizenship Document',
        }
        help_texts = {
            'pharmacy_license': 'Upload a valid pharmacy license document (PDF, JPG, PNG)',
            'pan_number': 'Upload your PAN card document (PDF, JPG, PNG)',
            'citizenship': 'Upload your citizenship document (PDF, JPG, PNG)',
        }


class LoginForm(forms.Form):
    """Login form using email"""
    email = forms.EmailField(widget=forms.EmailInput(attrs={'class': 'form-control', 'placeholder': 'Enter your email'}))
    password = forms.CharField(widget=forms.PasswordInput(attrs={'class': 'form-control', 'placeholder': 'Enter your password'}))
