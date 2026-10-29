from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from hereyouare.serializers import EmailLookupSerializer
from hereyouare.services import run_lookup


@api_view(["POST"])
def email_lookup(request):
    serializer = EmailLookupSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    email = serializer.validated_data["email"]
    return Response(data=run_lookup(email), status=status.HTTP_200_OK)
