from rest_framework import serializers
from .models import IndividualClient, LegalEntityClient

class IndividualClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = IndividualClient
        fields = '__all__'
        read_only_fields = ('id', 'user')

class LegalEntityClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = LegalEntityClient
        fields = '__all__'
        read_only_fields = ('id', 'user')