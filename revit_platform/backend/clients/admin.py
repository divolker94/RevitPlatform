from django.contrib import admin
from .models import IndividualClient, LegalEntityClient

@admin.register(IndividualClient)
class IndividualClientAdmin(admin.ModelAdmin):
    list_display = ('user', 'get_full_name', 'address', 'payment_method')
    list_filter = ('payment_method', 'birth_date')
    search_fields = ('user__email', 'user__first_name', 'user__last_name', 'address')
    ordering = ('user__email',)
    
    fieldsets = (
        ('User Information', {
            'fields': ('user',)
        }),
        ('Personal Information', {
            'fields': ('middle_name', 'birth_date', 'address', 'payment_method')
        }),
    )
    
    def get_full_name(self, obj):
        return obj.get_full_name()
    get_full_name.short_description = 'Full Name'

@admin.register(LegalEntityClient)
class LegalEntityClientAdmin(admin.ModelAdmin):
    list_display = ('company_name', 'user', 'inn', 'contact_person', 'position')
    list_filter = ('position',)
    search_fields = ('company_name', 'inn', 'user__email', 'contact_person')
    ordering = ('company_name',)
    
    fieldsets = (
        ('User Information', {
            'fields': ('user',)
        }),
        ('Company Information', {
            'fields': ('company_name', 'inn', 'kpp', 'ogrn')
        }),
        ('Addresses', {
            'fields': ('legal_address', 'actual_address')
        }),
        ('Contact Information', {
            'fields': ('contact_person', 'position')
        }),
        ('Bank Information', {
            'fields': ('bik', 'account_number', 'bank_name', 'signature_type')
        }),
    )