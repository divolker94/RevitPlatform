from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LegalEntityViewSet, IndividualClientViewSet

router = DefaultRouter()
router.register(r'legal-entities', LegalEntityViewSet, basename='legal-entities')
router.register(r'individuals', IndividualClientViewSet, basename='individuals')

urlpatterns = [
    path('', include(router.urls)),
]