from django.urls import path
from .views import DocumentVerificationAPIView

urlpatterns = [
    path("verify-documents/", DocumentVerificationAPIView.as_view()),
]