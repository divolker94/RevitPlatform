from rest_framework import serializers
from .models import ArchitecturalProject, ProjectRating
from django.contrib.auth import get_user_model

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name']

class ProjectRatingSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = ProjectRating
        fields = ['id', 'user', 'rating', 'created_at']
        read_only_fields = ['user', 'created_at']

class ArchitecturalProjectSerializer(serializers.ModelSerializer):
    image_main_url = serializers.SerializerMethodField()
    image_plan_url = serializers.SerializerMethodField()
    image_interior1_url = serializers.SerializerMethodField()
    image_interior2_url = serializers.SerializerMethodField()
    view_3d_url = serializers.SerializerMethodField()
    user_rating = serializers.SerializerMethodField()

    class Meta:
        model = ArchitecturalProject
        fields = [
            'id', 
            'name', 
            'category', 
            'functional_class', 
            'total_area', 
            'design_cost',
            'description',
            'construction_system',
            'building_volume',
            'footprint_area',
            'documentation',
            'design_duration',
            'downloads',
            'user_comments',
            'views_count',
            'rating_average',
            'rating_count',
            'image_main',
            'image_plan',
            'image_interior1',
            'image_interior2',
            'image_main_url',
            'image_plan_url',
            'image_interior1_url',
            'image_interior2_url',
            'view_3d_url',
            'user_rating'
        ]

    def get_user_rating(self, obj):
        """Получаем оценку текущего пользователя для проекта"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            try:
                rating = obj.ratings.filter(user=request.user).first()
                return rating.rating if rating else None
            except:
                return None
        return None

    def get_image_main_url(self, obj):
        request = self.context.get('request')
        if obj.get_image_main_url:
            return request.build_absolute_uri(obj.get_image_main_url) if request else obj.get_image_main_url
        return None

    def get_image_plan_url(self, obj):
        request = self.context.get('request')
        if obj.get_image_plan_url:
            return request.build_absolute_uri(obj.get_image_plan_url) if request else obj.get_image_plan_url
        return None

    def get_image_interior1_url(self, obj):
        request = self.context.get('request')
        if obj.get_image_interior1_url:
            return request.build_absolute_uri(obj.get_image_interior1_url) if request else obj.get_image_interior1_url
        return None

    def get_image_interior2_url(self, obj):
        request = self.context.get('request')
        if obj.get_image_interior1_url:
            return request.build_absolute_uri(obj.get_image_interior2_url) if request else obj.get_image_interior2_url
        return None

    def get_view_3d_url(self, obj):
        request = self.context.get('request')
        return request.build_absolute_uri(obj.get_3d_view_url) if request else obj.get_3d_view_url