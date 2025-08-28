from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, F
from .models import BimFamily
from .serializers import BimFamilySerializer, FamilyImageSerializer

class BimFamilyViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = BimFamily.objects.all()
    serializer_class = BimFamilySerializer
    
    def get_queryset(self):
        queryset = BimFamily.objects.prefetch_related('images').all()
        
        # Поиск по названию и описанию
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(description__icontains=search)
            )
        
        # Фильтрация по категории
        category = self.request.query_params.get('category', None)
        if category and category != 'all':
            queryset = queryset.filter(
                technical_specs__Категория__icontains=category
            )
        
        return queryset.order_by('-created_at')
    
    @action(detail=True, methods=['get'])
    def images(self, request, pk=None):
        family = self.get_object()
        images = family.images.all()
        return Response({
            'family_id': family.id,
            'family_name': family.name,
            'images': FamilyImageSerializer(images, many=True).data
        })
    
    @action(detail=True, methods=['post'])
    def increment_views(self, request, pk=None):
        """Увеличивает счетчик уникальных просмотров от пользователя"""
        try:
            family = self.get_object()
            
            # Получаем IP адрес пользователя
            x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
            if x_forwarded_for:
                ip_address = x_forwarded_for.split(',')[0].strip()
            else:
                ip_address = request.META.get('REMOTE_ADDR')
            
            # Добавляем просмотр от пользователя (уникальный)
            family.add_view_from_user(
                user=request.user if request.user.is_authenticated else None,
                ip_address=ip_address
            )
            
            return Response({
                'success': True,
                'views': family.get_unique_views_count(),
                'message': 'Уникальный просмотр засчитан'
            })
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=400)
    
    @action(detail=True, methods=['post'])
    def set_rating(self, request, pk=None):
        """Устанавливает рейтинг для BIM семейства"""
        try:
            rating = request.data.get('rating')
            if not rating or not isinstance(rating, (int, float)) or rating < 1 or rating > 5:
                return Response({
                    'success': False,
                    'error': 'Рейтинг должен быть числом от 1 до 5'
                }, status=400)
            
            family = self.get_object()
            family.rating = float(rating)
            family.save()
            
            return Response({
                'success': True,
                'rating': family.rating,
                'message': 'Рейтинг обновлен'
            })
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=400)
