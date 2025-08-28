from rest_framework import serializers
from .models import Order

class OrderSerializer(serializers.ModelSerializer):
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())
    status = serializers.CharField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)
    reference_project_details = serializers.SerializerMethodField()
    calculated_budget = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'id', 'user', 'reference_project', 'project_name', 'description', 
            'budget', 'deadline', 'percentage_change', 'calculated_budget',
            'status', 'created_at', 'updated_at'
        ]

    def get_reference_project_details(self, obj):
        if obj.reference_project:
            return {
                'id': obj.reference_project.id,
                'name': obj.reference_project.name,
                'design_cost': obj.reference_project.design_cost,
                'total_area': obj.reference_project.total_area,
                'category': obj.reference_project.category
            }
        return None

    def get_calculated_budget(self, obj):
        if obj.reference_project and obj.percentage_change:
            base_cost = obj.reference_project.design_cost
            change_multiplier = 1 + (obj.percentage_change / 100)
            return base_cost * change_multiplier
        return obj.budget

    def validate_deadline(self, value):
        from django.utils import timezone
        if value < timezone.now().date():
            raise serializers.ValidationError("Deadline cannot be in the past")
        return value