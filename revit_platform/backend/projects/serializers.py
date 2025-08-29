from rest_framework import serializers
from .models import Project, ProjectSection, ProjectSectionFile, ProjectRole, ArchitecturalProject, ProjectComment
from django.contrib.auth import get_user_model

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name']

class ProjectRoleSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source='user',
        write_only=True
    )

    class Meta:
        model = ProjectRole
        fields = ['id', 'project', 'user', 'user_id', 'role', 'assigned_at']
        read_only_fields = ['assigned_at']

class ProjectSectionFileSerializer(serializers.ModelSerializer):
    uploaded_by = UserSerializer(read_only=True)
    thumbnail_url = serializers.SerializerMethodField()

    class Meta:
        model = ProjectSectionFile
        fields = ['id', 'section', 'file', 'title', 'description', 'file_type',
                'thumbnail', 'thumbnail_url', 'uploaded_by', 'uploaded_at']
        read_only_fields = ['uploaded_by', 'uploaded_at', 'thumbnail']

    def get_thumbnail_url(self, obj):
        if obj.thumbnail:
            return obj.thumbnail.url
        return None

class ProjectSectionSerializer(serializers.ModelSerializer):
    files = ProjectSectionFileSerializer(many=True, read_only=True)

    class Meta:
        model = ProjectSection
        fields = ['id', 'project', 'section_type', 'description', 'last_updated', 'files']
        read_only_fields = ['last_updated']

class ProjectSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    sections = ProjectSectionSerializer(many=True, read_only=True)
    roles = ProjectRoleSerializer(many=True, read_only=True)

    class Meta:
        model = Project
        fields = [
            'id', 'name', 'description', 'status', 'author',
            'created_at', 'updated_at', 'sections', 'roles', 'team_members',
            # Поля для BIM-менеджера
            'object_code', 'design_stage', 'construction_queue', 'launch_complexes',
            # ТЭП
            'floors', 'total_area', 'building_area', 'construction_volume', 'structural_system',
            # Архитектурная часть
            'architectural_concept', 'facade_materials', 'interior_finish', 'landscape_design',
            # Конструктивная часть
            'foundation_type', 'wall_materials', 'roof_type', 'seismic_resistance',
            # Водоснабжение и канализация
            'water_supply_system', 'sewerage_system', 'cold_water_system', 'water_consumption',
            # Отопление и вентиляция
            'heating_system', 'ventilation_system', 'air_conditioning', 'heating_load',
            # Электроснабжение
            'electrical_system', 'electrical_load', 'backup_power', 'grounding_system',
            # Сети связи
            'communication_networks', 'security_systems', 'automation_systems', 'it_infrastructure',
            # Пожарная безопасность
            'fire_safety', 'evacuation_routes', 'fire_extinguishing',
            # Экология и энергоэффективность
            'energy_efficiency', 'environmental_impact', 'sustainability_features'
        ]
        read_only_fields = ['author', 'created_at', 'updated_at']

class ProjectCommentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = ProjectComment
        fields = ['id', 'project', 'user', 'text', 'created_at', 'image_coordinates']
        read_only_fields = ['user', 'created_at']

class ArchitecturalProjectSerializer(serializers.ModelSerializer):
    view_3d_url = serializers.SerializerMethodField()
    floor_plans_url = serializers.SerializerMethodField()
    author = UserSerializer(read_only=True)

    class Meta:
        model = ArchitecturalProject
        fields = ['id', 'name', 'slug', 'object_type', 'status',
                'description', 'total_area', 'price', 'price_per_meter',
                'view_3d_url', 'floor_plans_url', 'created_at',
                'updated_at', 'author', 'views_count',
                'comments_count', 'likes_count']
        read_only_fields = ['slug', 'views_count', 'comments_count', 'likes_count']

    def get_view_3d_url(self, obj):
        request = self.context.get('request')
        if request is not None and obj.get_view_3d_url:
            return request.build_absolute_uri(obj.get_view_3d_url)
        return obj.get_view_3d_url

    def get_floor_plans_url(self, obj):
        request = self.context.get('request')
        if obj.get_floor_plans_url:
            if request is not None:
                return request.build_absolute_uri(obj.get_floor_plans_url)
            return obj.get_floor_plans_url
        return None
