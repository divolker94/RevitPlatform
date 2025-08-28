from rest_framework import serializers
from .models import BimFamily, FamilyImage

class FamilyImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = FamilyImage
        fields = '__all__'

class BimFamilySerializer(serializers.ModelSerializer):
    images = FamilyImageSerializer(many=True, read_only=True)
    
    class Meta:
        model = BimFamily
        fields = '__all__'
