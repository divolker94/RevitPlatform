from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register('users', views.UserViewSet, basename='user')

app_name = 'accounts'

urlpatterns = [
    path('', include(router.urls)),
    path('register/', views.RegisterView.as_view(), name='register'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('profile-status/', views.UserViewSet.as_view({'get': 'profile_status'}), name='profile-status'),
    path('select-role/', views.UserViewSet.as_view({'post': 'select_role'}), name='select-role'),
]