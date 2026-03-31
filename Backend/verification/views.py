from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
import os
from .utils import verify_documents


class DocumentVerificationAPIView(APIView):

    permission_classes = [AllowAny]

    def post(self, request):

        pan = request.FILES.get("pan")
        citizenship = request.FILES.get("citizenship")
        license_doc = request.FILES.get("license")

        if not all([pan, citizenship, license_doc]):
            return Response(
                {"error": "All three documents required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        file_paths = []

        for file in [pan, citizenship, license_doc]:
            file_path = os.path.join(settings.MEDIA_ROOT, file.name)

            with open(file_path, "wb+") as destination:
                for chunk in file.chunks():
                    destination.write(chunk)

            file_paths.append(file_path)

        result = verify_documents(file_paths)

        return Response(result)