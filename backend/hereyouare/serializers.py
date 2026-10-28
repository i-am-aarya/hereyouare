from rest_framework import serializers


class EmailLookupSerializer(serializers.Serializer):
    email = serializers.EmailField()


class ProfileSerializer(serializers.Serializer):
    website = serializers.CharField()
    url = serializers.URLField(allow_null=True)


class UsernameLookupSerializer(serializers.Serializer):
    username = serializers.CharField()


class ResponseSerializer(serializers.Serializer):
    email = serializers.EmailField(allow_null=True)
    username = serializers.CharField(allow_null=True)
    results = ProfileSerializer(many=True)
