from django.shortcuts import render, get_object_or_404, redirect
from django.http import HttpResponseForbidden
from django.views.generic import ListView, DetailView, CreateView, UpdateView, DeleteView
from django.urls import reverse_lazy, reverse
from .models import Category
from .forms import CategoryForm  # Убедитесь, что форма существует
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from .serializers import CategorySerializer

class CategoryListView(ListView):
    model = Category
    template_name = 'category_list.html'
    context_object_name = 'categories'
    paginate_by = 10  # можно убрать, если пагинация не нужна

    def get_queryset(self):
        return Category.objects.filter(is_active=True).order_by('order', 'name')

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['parent_categories'] = Category.objects.filter(parent__isnull=True, is_active=True)
        return context

# Просмотр одной категории по slug
class CategoryDetailView(DetailView):
    model = Category
    template_name = 'category_detail.html'
    context_object_name = 'category'

    def get_object(self, queryset=None):
        slug = self.kwargs.get('slug')
        return get_object_or_404(Category, slug=slug, is_active=True)

# Создание новой категории
class CategoryCreateView(CreateView):
    model = Category
    template_name = 'category_form.html'
    form_class = CategoryForm

    def form_valid(self, form):
        category = form.save(commit=False)
        category.save()
        return super().form_valid(form)

    def get_success_url(self):
        return reverse('category_detail', kwargs={'slug': self.object.slug})

# Редактирование категории
class CategoryUpdateView(UpdateView):
    model = Category
    template_name = 'category_form.html'
    form_class = CategoryForm

    def get_success_url(self):
        return reverse('category_detail', kwargs={'slug': self.object.slug})

# Удаление категории
class CategoryDeleteView(DeleteView):
    model = Category
    template_name = 'category_confirm_delete.html'

    def dispatch(self, request, *args, **kwargs):
        category = self.get_object()
        if category.children.exists():  # Проверяем, есть ли дочерние категории
            return HttpResponseForbidden("Нельзя удалить категорию, у которой есть подкатегории.")
        return super().dispatch(request, *args, **kwargs)

    def get_success_url(self):
        return reverse_lazy('category_list')

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    lookup_field = 'slug'
    
