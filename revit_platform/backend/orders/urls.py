from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    OrderViewSet, OrderItemViewSet, OrderDocumentViewSet, 
    OrderPaymentViewSet, BIMFamilyCategoryViewSet, OrderFileViewSet, OrderFileCommentViewSet
)

router = DefaultRouter()
router.register(r'orders', OrderViewSet, basename='order')
router.register(r'order-items', OrderItemViewSet, basename='order-item')
router.register(r'order-documents', OrderDocumentViewSet, basename='order-document')
router.register(r'order-payments', OrderPaymentViewSet, basename='order-payment')
router.register(r'bim-family-categories', BIMFamilyCategoryViewSet, basename='bim-family-category')
router.register(r'order-files', OrderFileViewSet, basename='order-file')
router.register(r'order-file-comments', OrderFileCommentViewSet, basename='order-file-comment')

urlpatterns = [
    path('', include(router.urls)),
]