from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import SpecialistProfile

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'first_name', 'last_name')
        read_only_fields = ('id',)

class SpecialistProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = SpecialistProfile
        fields = (
            'id',
            'user',
            'specialization',
            'experience',
            'availability',
            'hourly_rate',
            'about',
            'portfolio',
            'certificates',
            'created_at',
            'updated_at'
        )
        read_only_fields = ('id', 'user', 'created_at', 'updated_at')

    def validate_hourly_rate(self, value):
        if value and value != '':
            try:
                # Преобразуем в число для валидации
                num_value = float(value)
                if num_value <= 0:
                    raise serializers.ValidationError('Hourly rate must be greater than zero')
                return num_value  # Возвращаем как число
            except (ValueError, TypeError):
                raise serializers.ValidationError('Hourly rate must be a valid number')
        return value

    def validate_experience(self, value):
        if value and value != '':
            try:
                # Преобразуем в число для валидации
                num_value = int(value)
                if num_value < 0:
                    raise serializers.ValidationError('Experience cannot be negative')
                return str(num_value)  # Возвращаем как строку
            except (ValueError, TypeError):
                raise serializers.ValidationError('Experience must be a valid number')
        return value

    def validate_portfolio(self, value):
        # Если поле пустое, возвращаем None
        if value == '':
            return None
        return value

    def validate_certificates(self, value):
        # Если поле пустое, возвращаем None
        if value == '':
            return None
        return value

    def validate_availability(self, value):
        # Если поле пустое, возвращаем None
        if value == '':
            return None
        return value

    def create(self, validated_data):
        # Автоматически устанавливаем пользователя из request
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)