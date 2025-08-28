from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BimFamilyViewSet

router = DefaultRouter()
router.register(r'bim-families', BimFamilyViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
