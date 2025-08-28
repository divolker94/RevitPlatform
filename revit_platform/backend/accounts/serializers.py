from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
import re

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    re_password = serializers.CharField(write_only=True)
    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=True)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'password', 're_password',
            'user_type', 'first_name', 'last_name', 'avatar'
        ]
        extra_kwargs = {
            'password': {'write_only': True},
            'email': {'required': True},
            'user_type': {'required': False}  # Сделаем необязательным для базовой регистрации
        }

    def validate_password(self, value):
        if len(value) < 6:
            raise ValidationError("Пароль должен содержать минимум 6 символов")
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise ValidationError("Пользователь с таким email уже существует")
        return value

    def validate(self, data):
        if data.get('password') != data.get('re_password'):
            raise ValidationError({"re_password": "Пароли не совпадают"})

        return data

    def create(self, validated_data):
        # Удаляем re_password перед созданием пользователя
        validated_data.pop('re_password')
        password = validated_data.pop('password')
        
        # Устанавливаем user_type по умолчанию если не указан
        if 'user_type' not in validated_data:
            validated_data['user_type'] = 'individual'
        
        # Создаем пользователя
        user = User.objects.create(**validated_data)
        user.set_password(password)
        user.save()
        
        return user

class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'user_type', 'avatar'
        ]