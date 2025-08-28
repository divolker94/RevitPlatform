from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from django_filters import rest_framework as filters
from .models import ArchitecturalProject, ProjectRating
from .serializers import ArchitecturalProjectSerializer, ProjectRatingSerializer

# Create your views here.

class ArchitecturalProjectFilter(filters.FilterSet):
    min_area = filters.NumberFilter(field_name="total_area", lookup_expr='gte')
    max_area = filters.NumberFilter(field_name="total_area", lookup_expr='lte')
    min_cost = filters.NumberFilter(field_name="design_cost", lookup_expr='gte')
    max_cost = filters.NumberFilter(field_name="design_cost", lookup_expr='lte')
    min_rating = filters.NumberFilter(field_name="rating_average", lookup_expr='gte')

    class Meta:
        model = ArchitecturalProject
        fields = {
            'category': ['exact'],
            'functional_class': ['exact'],
            'name': ['icontains'],
        }

class ArchitecturalProjectViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint для просмотра архитектурных проектов.
    Поддерживает фильтрацию по:
    - типу объекта (object_type)
    - площади (area_min, area_max)
    - цене (price_min, price_max)
    - рейтингу (min_rating)
    """
    queryset = ArchitecturalProject.objects.all()
    serializer_class = ArchitecturalProjectSerializer
    permission_classes = [AllowAny]  # Доступ без авторизации
    filterset_class = ArchitecturalProjectFilter
    
    def get_queryset(self):
        queryset = ArchitecturalProject.objects.all()
        
        # Фильтрация по типу объекта
        object_type = self.request.query_params.get('object_type', None)
        if object_type:
            queryset = queryset.filter(category=object_type)

        # Фильтрация по площади
        area_min = self.request.query_params.get('area_min', None)
        area_max = self.request.query_params.get('area_max', None)
        if area_min:
            queryset = queryset.filter(total_area__gte=float(area_min))
        if area_max:
            queryset = queryset.filter(total_area__lte=float(area_max))

        # Фильтрация по цене
        price_min = self.request.query_params.get('price_min', None)
        price_max = self.request.query_params.get('price_max', None)
        if price_min:
            queryset = queryset.filter(design_cost__gte=float(price_min))
        if price_max:
            queryset = queryset.filter(design_cost__lte=float(price_max))

        # Фильтрация по рейтингу
        min_rating = self.request.query_params.get('min_rating', None)
        if min_rating:
            queryset = queryset.filter(rating_average__gte=float(min_rating))

        # Поиск по названию
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | 
                Q(description__icontains=search)
            )

        # Сортировка
        ordering = self.request.query_params.get('ordering', 'name')
        if ordering in ['rating_average', '-rating_average', 'views_count', '-views_count', 'design_cost', '-design_cost', 'total_area', '-total_area']:
            queryset = queryset.order_by(ordering)
        else:
            queryset = queryset.order_by('name')

        return queryset

    def retrieve(self, request, *args, **kwargs):
        """При просмотре детальной страницы увеличиваем счетчик уникальных просмотров"""
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

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def rate(self, request, pk=None):
        """API для оценки проекта пользователем"""
        project = self.get_object()
        rating_value = request.data.get('rating')
        
        if not rating_value:
            return Response(
                {'error': 'Поле rating обязательно'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            rating_value = int(rating_value)
            if rating_value < 1 or rating_value > 5:
                return Response(
                    {'error': 'Рейтинг должен быть от 1 до 5'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        except (ValueError, TypeError):
            return Response(
                {'error': 'Рейтинг должен быть числом'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Создаем или обновляем оценку
        rating, created = ProjectRating.objects.update_or_create(
            project=project,
            user=request.user,
            defaults={'rating': rating_value}
        )

        # Обновляем статистику проекта
        project.update_rating_stats()
        
        message = 'Оценка обновлена' if not created else 'Оценка добавлена'
        return Response({
            'message': message,
            'rating': rating_value,
            'project_rating_average': project.rating_average,
            'project_rating_count': project.rating_count
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def user_rating(self, request, pk=None):
        """Получить оценку текущего пользователя для проекта"""
        project = self.get_object()
        try:
            rating = project.ratings.filter(user=request.user).first()
            if rating:
                serializer = ProjectRatingSerializer(rating)
                return Response(serializer.data)
            else:
                return Response({'rating': None})
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
