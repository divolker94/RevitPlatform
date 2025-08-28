from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import ArchitecturalProjectViewSet

router = DefaultRouter()
router.register('architectural-projects', ArchitecturalProjectViewSet, basename='architectural-projects')

urlpatterns = router.urls 