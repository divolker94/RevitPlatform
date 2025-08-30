from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Post, Comment
from .serializers import PostSerializer, CommentSerializer
from django.shortcuts import get_object_or_404

# Create your views here.

class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def perform_create(self, serializer):
        serializer.save(author=self.request.user)
    
    def get_queryset(self):
        queryset = Post.objects.all()
        
        # Фильтрация по категории
        category = self.request.query_params.get('category', None)
        if category is not None:
            queryset = queryset.filter(category=category)
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def categories(self, request):
        """Получить все доступные категории"""
        categories = [choice[0] for choice in Post.CATEGORY_CHOICES]
        return Response({'categories': categories})
    
    @action(detail=True, methods=['post'])
    def add_comment(self, request, pk=None):
        """Добавить комментарий к посту"""
        post = self.get_object()
        serializer = CommentSerializer(data=request.data, context={'request': request})
        
        if serializer.is_valid():
            serializer.save(post=post, author=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def perform_create(self, serializer):
        serializer.save(author=self.request.user)
    
    def get_queryset(self):
        queryset = Comment.objects.all()
        
        # Фильтрация по посту
        post_id = self.request.query_params.get('post', None)
        if post_id is not None:
            queryset = queryset.filter(post_id=post_id)
        
        return queryset

    @action(detail=True, methods=['post'])
    def toggle_like(self, request, pk=None):
        comment = self.get_object()
        user = request.user
        
        if comment.likes.filter(id=user.id).exists():
            comment.likes.remove(user)
            liked = False
        else:
            comment.likes.add(user)
            liked = True
        
        return Response({
            'liked': liked,
            'likes_count': comment.get_likes_count()
        })

    @action(detail=True, methods=['put', 'patch'])
    def edit(self, request, pk=None):
        comment = self.get_object()
        
        # Проверяем, что пользователь является автором комментария
        if comment.author != request.user:
            return Response(
                {'error': 'Вы можете редактировать только свои комментарии'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = CommentSerializer(
            comment, 
            data=request.data, 
            partial=True,
            context={'request': request}
        )
        
        if serializer.is_valid():
            comment.is_edited = True
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
