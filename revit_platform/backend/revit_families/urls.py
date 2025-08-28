from django.urls import path
from . import views

app_name = 'revit_families'

urlpatterns = [
    path('families/', views.FamilyListView.as_view(), name='family-list'),
    path('families/<int:pk>/', views.FamilyDetailView.as_view(), name='family-detail'),
    path('categories/', views.CategoryListView.as_view(), name='category-list'),
    path('families/<int:pk>/download/', views.FamilyDownloadView.as_view(), name='family-download'),
]