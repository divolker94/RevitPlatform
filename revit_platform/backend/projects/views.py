from django.shortcuts import render
from rest_framework import viewsets, filters, permissions
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.parsers import MultiPartParser, FormParser
from .models import Project, ProjectSection, ProjectSectionFile, ProjectRole, ArchitecturalProject, ProjectComment
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Q
from .serializers import (ProjectSerializer, ProjectSectionSerializer,
    ProjectSectionFileSerializer, ProjectRoleSerializer, ArchitecturalProjectSerializer)

# Create your views here.

class ArchitecturalProjectViewSet(viewsets.ModelViewSet):
    queryset = ArchitecturalProject.objects.all()
    serializer_class = ArchitecturalProjectSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['object_type', 'status']
    search_fields = ['name', 'description']
    ordering_fields = ['created_at', 'price', 'total_area', 'views_count']
    ordering = ['-created_at']

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # Получаем IP адрес пользователя
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip_address = x_forwarded_for.split(',')[0].strip()
        else:
            ip_address = request.META.get('REMOTE_ADDR')
        
        # Добавляем просмотр от пользователя (уникальный)
        instance.add_view_from_user(
            user=request.user if request.user.is_authenticated else None,
            ip_address=ip_address
        )
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)
    queryset = Project.objects.all()

    def get_queryset(self):
        # Return projects where user is either author or team member
        return Project.objects.filter(
            Q(author=self.request.user) |
            Q(team_members=self.request.user)
        ).distinct()

    def perform_create(self, serializer):
        # Only BIM managers and specialists can create projects
        user = self.request.user
        if not hasattr(user, 'specialist_profile'):
            raise PermissionDenied({
                'error': 'User profile not found',
                'detail': 'A specialist profile is required to create projects'
            })

        # Проверяем, содержит ли специализация пользователя разрешенные специализации
        user_specializations = [s.strip().lower() for s in user.specialist_profile.specialization.split(',')]
        allowed_specializations = [
            'bim management', 'bim_manager', 'bim-менеджмент', 'bim менеджмент',
            'architectural design', 'architect', 'архитектурное проектирование',
            'structural engineering', 'constructor', 'конструктивные решения',
            'engineering systems', 'engineer', 'инженерные системы',
            'bim-координация', 'bim координация',
            'генеральное проектирование',
            'проектирование фасадов',
            'проектирование интерьеров',
            'ландшафтное проектирование',
            'проектирование инженерных сетей',
            'проектирование вентиляции и кондиционирования',
            'проектирование электрических систем',
            'проектирование водоснабжения и канализации',
            'проектирование систем безопасности',
            'управление проектами'
        ]
        
        # BIM-менеджеры всегда могут создавать проекты
        if user.specialist_profile.specialist_type == 'manager':
            has_allowed_specialization = True
        else:
            # Проверяем, есть ли хотя бы одна разрешенная специализация для исполнителей
            has_allowed_specialization = any(
                user_spec in allowed_specializations or 
                any(allowed in user_spec for allowed in allowed_specializations)
                for user_spec in user_specializations
            )
        
        if not has_allowed_specialization:
            raise PermissionDenied({
                'error': 'Invalid specialization',
                'detail': f'Your specialization {user.specialist_profile.specialization} is not authorized to create projects. Allowed specializations: BIM management, architectural design, structural engineering, engineering systems, and related fields.'
            })

        try:
            project = serializer.save(author=user)
            return project
        except Exception as e:
            raise serializers.ValidationError({
                'error': 'Project creation failed',
                'detail': str(e)
            })

    @action(detail=True, methods=['post'])
    def add_team_member(self, request, pk=None):
        project = self.get_object()
        user_id = request.data.get('user_id')
        role = request.data.get('role')

        if not user_id or not role:
            return Response({'error': 'Both user_id and role are required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(id=user_id)
            ProjectRole.objects.create(project=project, user=user, role=role)
            return Response({'status': 'Team member added successfully'}, status=status.HTTP_201_CREATED)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class ProjectSectionViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSectionSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = ProjectSection.objects.all()
    
    def get_queryset(self):
        return ProjectSection.objects.filter(
            Q(project__author=self.request.user) |
            Q(project__roles__user=self.request.user)
        ).distinct()

    def perform_create(self, serializer):
        serializer.save(project_id=self.kwargs.get('project_pk'))

class ProjectSectionFileViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSectionFileSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)
    queryset = ProjectSectionFile.objects.all()

    def get_queryset(self):
        return ProjectSectionFile.objects.filter(
            Q(section__project__author=self.request.user) |
            Q(section__project__roles__user=self.request.user)
        ).distinct()

    def perform_create(self, serializer):
        serializer.save(
            section_id=self.kwargs.get('section_pk'),
            uploaded_by=self.request.user
        )

class ProjectRoleViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectRoleSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = ProjectRole.objects.all()

    def get_queryset(self):
        return ProjectRole.objects.filter(
            Q(project__author=self.request.user) |
            Q(user=self.request.user)
        ).distinct()

    def perform_create(self, serializer):
        serializer.save(project_id=self.kwargs.get('project_pk'))

    @action(detail=False, methods=['get'])
    def my_roles(self, request):
        roles = ProjectRole.objects.filter(user=request.user)
        serializer = self.get_serializer(roles, many=True)
        return Response(serializer.data)
