from django.contrib import admin
from .models import Project, ProjectSection, ProjectSectionFile, ProjectRole, ArchitecturalProject, ProjectComment

class ProjectSectionInline(admin.TabularInline):
    model = ProjectSection
    extra = 1

class ProjectRoleInline(admin.TabularInline):
    model = ProjectRole
    extra = 1

class ProjectSectionFileInline(admin.TabularInline):
    model = ProjectSectionFile
    extra = 1

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('name', 'author', 'status', 'created_at', 'updated_at')
    list_filter = ('status', 'created_at', 'author')
    search_fields = ('name', 'description')
    inlines = [ProjectRoleInline, ProjectSectionInline]

@admin.register(ProjectSection)
class ProjectSectionAdmin(admin.ModelAdmin):
    list_display = ('project', 'section_type', 'last_updated')
    list_filter = ('section_type', 'last_updated')
    search_fields = ('project__name', 'description')
    inlines = [ProjectSectionFileInline]

@admin.register(ProjectSectionFile)
class ProjectSectionFileAdmin(admin.ModelAdmin):
    list_display = ('title', 'section', 'file_type', 'uploaded_by', 'uploaded_at')
    list_filter = ('file_type', 'uploaded_at', 'section__section_type')
    search_fields = ('title', 'description', 'section__project__name')

@admin.register(ProjectRole)
class ProjectRoleAdmin(admin.ModelAdmin):
    list_display = ('user', 'project', 'role', 'assigned_at')
    list_filter = ('role', 'assigned_at')
    search_fields = ('user__email', 'project__name')

@admin.register(ArchitecturalProject)
class ArchitecturalProjectAdmin(admin.ModelAdmin):
    list_display = ('name', 'object_type', 'status', 'total_area', 'price', 'created_at')
    list_filter = ('object_type', 'status')
    search_fields = ('name', 'description')
    readonly_fields = ('slug', 'views_count', 'comments_count', 'likes_count')

@admin.register(ProjectComment)
class ProjectCommentAdmin(admin.ModelAdmin):
    list_display = ('user', 'project', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('user__email', 'project__name', 'text')
