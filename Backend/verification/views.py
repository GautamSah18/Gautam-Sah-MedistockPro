import os
import tempfile
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
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
        tmp_files = []

        try:
            for file in [pan, citizenship, license_doc]:
                suffix = os.path.splitext(file.name)[1]
                tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
                for chunk in file.chunks():
                    tmp.write(chunk)
                tmp.close()
                file_paths.append(tmp.name)
                tmp_files.append(tmp.name)

            result = verify_documents(file_paths)
            return Response(result)

        finally:
            for path in tmp_files:
                try:
                    os.unlink(path)
                except Exception:
                    pass