from rest_framework import serializers
from .models import LegalEntityClient, IndividualClient

class LegalEntitySerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)

    class Meta:
        model = LegalEntityClient
        fields = [
            'id', 'email', 'first_name', 'last_name',
            'company_name', 'inn', 'kpp', 'ogrn',
            'bik', 'account_number', 'bank_name',
            'contact_person', 'phone',
            'legal_address', 'actual_address', 'position', 'signature_type'
        ]
        read_only_fields = ['id', 'email', 'first_name', 'last_name']
        extra_kwargs = {
            'company_name': {'required': True},
            'inn': {'required': True},
            'kpp': {'required': True},
            'ogrn': {'required': True},
            'bik': {'required': True},
            'account_number': {'required': True},
            'bank_name': {'required': True},
            'contact_person': {'required': True},
            'phone': {'required': True},

            'legal_address': {'required': False, 'allow_null': True, 'allow_blank': True},
            'actual_address': {'required': False, 'allow_null': True, 'allow_blank': True},
            'position': {'required': False, 'allow_null': True, 'allow_blank': True},
            'signature_type': {'required': False, 'allow_null': True, 'allow_blank': True},
        }

class IndividualClientSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)

    class Meta:
        model = IndividualClient
        fields = [
            'id', 'email', 'first_name', 'last_name',
            'middle_name', 'birth_date', 'address',
            'payment_method', 'phone'
        ]
        read_only_fields = ['id', 'email', 'first_name', 'last_name']
        extra_kwargs = {
            'phone': {'required': True},
            'middle_name': {'required': False, 'allow_null': True, 'allow_blank': True},
            'birth_date': {'required': False, 'allow_null': True},
            'address': {'required': False, 'allow_null': True, 'allow_blank': True},
            'payment_method': {'required': False, 'allow_null': True, 'allow_blank': True},
        }