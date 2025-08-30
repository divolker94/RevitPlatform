from rest_framework import serializers
from .models import Post, Comment
from django.utils import timezone

class CommentSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.username', read_only=True)
    author_full_name = serializers.SerializerMethodField()
    created_at_formatted = serializers.SerializerMethodField()
    updated_at_formatted = serializers.SerializerMethodField()
    likes_count = serializers.SerializerMethodField()
    is_liked_by_current_user = serializers.SerializerMethodField()
    can_edit = serializers.SerializerMethodField()
    
    class Meta:
        model = Comment
        fields = [
            'id', 'post', 'author', 'author_name', 'author_full_name',
            'content', 'created_at', 'created_at_formatted',
            'updated_at', 'updated_at_formatted', 'is_edited',
            'likes_count', 'is_liked_by_current_user', 'can_edit'
        ]
        read_only_fields = [
            'id', 'post', 'author', 'author_name', 'author_full_name',
            'created_at', 'created_at_formatted', 'updated_at', 
            'updated_at_formatted', 'is_edited', 'likes_count',
            'is_liked_by_current_user', 'can_edit'
        ]

    def get_author_full_name(self, obj):
        if obj.author.first_name and obj.author.last_name:
            return f"{obj.author.first_name} {obj.author.last_name}"
        return obj.author.username

    def get_created_at_formatted(self, obj):
        return obj.created_at.strftime('%d.%m.%Y %H:%M')

    def get_updated_at_formatted(self, obj):
        return obj.updated_at.strftime('%d.%m.%Y %H:%M')

    def get_likes_count(self, obj):
        return obj.get_likes_count()

    def get_is_liked_by_current_user(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.is_liked_by_user(request.user)
        return False

    def get_can_edit(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.author == request.user
        return False

class PostSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.username', read_only=True)
    author_full_name = serializers.SerializerMethodField()
    created_at_formatted = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Post
        fields = [
            'id', 'title', 'content', 'preview', 'category', 'author',
            'author_name', 'author_full_name', 'image', 'created_at',
            'created_at_formatted', 'updated_at', 'comments_count'
        ]
        read_only_fields = [
            'id', 'author', 'author_name', 'author_full_name',
            'created_at', 'created_at_formatted', 'updated_at', 'comments_count'
        ]

    def get_author_full_name(self, obj):
        if obj.author.first_name and obj.author.last_name:
            return f"{obj.author.first_name} {obj.author.last_name}"
        return obj.author.username

    def get_created_at_formatted(self, obj):
        return obj.created_at.strftime('%d.%m.%Y %H:%M')

    def get_comments_count(self, obj):
        return obj.comments.count()
