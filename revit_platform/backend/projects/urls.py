from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'projects', views.ProjectViewSet)
router.register(r'architectural-projects', views.ArchitecturalProjectViewSet)
router.register(r'project-sections', views.ProjectSectionViewSet)
router.register(r'project-section-files', views.ProjectSectionFileViewSet)
router.register(r'project-roles', views.ProjectRoleViewSet)

urlpatterns = [
    path('', include(router.urls)),
]