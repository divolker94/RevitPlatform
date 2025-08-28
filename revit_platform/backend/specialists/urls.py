from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SpecialistProfileViewSet

router = DefaultRouter()
# Проверьте, что basename соответствует тому, что ожидает фронтенд
router.register(r'', SpecialistProfileViewSet, basename='specialist')

urlpatterns = [
    path('', include(router.urls)),
]