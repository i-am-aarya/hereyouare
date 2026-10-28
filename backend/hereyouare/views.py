# Create your views here.
import asyncio

from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from hereyouare.serializers import (
    EmailLookupSerializer,
    ResponseSerializer,
    UsernameLookupSerializer,
)
from hereyouare.services import lookup_email, lookup_username


@api_view(["POST"])
def email_lookup(request):
    serializer = EmailLookupSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    email = serializer.validated_data["email"]

    results = asyncio.run(lookup_email(email))

    response_data = {"email": email, "results": results}

    output = ResponseSerializer(response_data)

    return Response(data=output.data, status=status.HTTP_200_OK)


@api_view(["POST"])
def username_lookup(request):
    try:
        serializer = UsernameLookupSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        username = serializer.validated_data["username"]
        results = asyncio.run(lookup_username(username))

        response_data = {"username": username, "results": results}

        output = ResponseSerializer(response_data)

        return Response(data=output.data, status=status.HTTP_200_OK)
    except NotImplementedError:
        return Response(
            {
                "detail": "username lookup not implemented yet",
            },
            status=status.HTTP_501_NOT_IMPLEMENTED,
        )
