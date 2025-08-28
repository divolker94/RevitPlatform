"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""


import os
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from .views import get_csrf_token

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/csrf/', get_csrf_token),
    path('api/', include('architectural_projects.urls')),
    path('api/', include('projects.urls')),
    path('api/auth/', include('djoser.urls')),
    path('api/auth/', include('djoser.urls.jwt')),
    path('api/categories/', include('categories.urls')), 
    path('api/categories/', include('categories.api_urls')),
    path('api/projects/', include('projects.urls')),  # Этот URL будет обрабатывать все проекты
    path('api/revit-families/', include('revit_families.urls')),
    path('api/', include('bim_families.urls')),
    path('api/blog/', include('blog.urls')),
    path('api/accounts/', include('accounts.urls')),
    path('api/clients/', include('clients.urls')),
    path('api/specialists/', include('specialists.urls')),  # Добавляем URL для специалистов
    path('api/orders/', include('orders.urls')),  # Добавляем URL для заказов
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    # Добавляем специальный URL для изображений BIM семейств
    from django.views.static import serve
    from django.urls import re_path
    
    urlpatterns += [
        re_path(r'^images/bim_families/(?P<path>.*)$', serve, {
            'document_root': os.path.join(settings.BASE_DIR, '..', 'frontend', 'public', 'images', 'bim_families')
        }),
    ]