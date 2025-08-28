# urls.py для основного веб-приложения
from django.urls import path
from . import views

urlpatterns = [
    path('', views.CategoryListView.as_view(), name='category_list'),  # Просмотр всех категорий
    path('create/', views.CategoryCreateView.as_view(), name='category_create'),  # Создание категории
    path('<slug:slug>/', views.CategoryDetailView.as_view(), name='category_detail'),  # Просмотр одной категории
    path('<slug:slug>/edit/', views.CategoryUpdateView.as_view(), name='category_update'),  # Редактирование категории
    path('<slug:slug>/delete/', views.CategoryDeleteView.as_view(), name='category_delete'),  # Удаление категории
]

