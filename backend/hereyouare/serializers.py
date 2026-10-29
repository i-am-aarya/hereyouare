from rest_framework import serializers


class EmailLookupSerializer(serializers.Serializer):
    email = serializers.EmailField()
