from rest_framework import viewsets, permissions
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import action
from .models import SpecialistProfile
from .serializers import SpecialistProfileSerializer

class SpecialistProfileViewSet(viewsets.ModelViewSet):
    queryset = SpecialistProfile.objects.all()
    serializer_class = SpecialistProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        Optionally restricts the returned specialists to a given user,
        by filtering against query parameters in the URL.
        """
        queryset = SpecialistProfile.objects.all()
        user_id = self.request.query_params.get('user_id', None)
        specialization = self.request.query_params.get('specialization', None)
        availability = self.request.query_params.get('availability', None)

        if user_id is not None:
            queryset = queryset.filter(user_id=user_id)
        if specialization is not None:
            queryset = queryset.filter(specialization__icontains=specialization)
        if availability is not None:
            queryset = queryset.filter(availability=availability)

        return queryset

    @action(detail=False, methods=['get', 'put', 'patch'])
    def me(self, request):
        """Get or update current user's specialist profile"""
        try:
            profile = SpecialistProfile.objects.get(user=request.user)
            
            if request.method in ['PUT', 'PATCH']:
                # Update existing profile
                serializer = self.get_serializer(profile, data=request.data, partial=request.method == 'PATCH')
                serializer.is_valid(raise_exception=True)
                serializer.save()
                return Response(serializer.data)
            else:
                # Get profile
                serializer = self.get_serializer(profile)
                return Response(serializer.data)
                
        except SpecialistProfile.DoesNotExist:
            if request.method in ['PUT', 'PATCH']:
                return Response(
                    {"detail": "Profile not found. Use POST to create a new profile."},
                    status=status.HTTP_404_NOT_FOUND
                )
            else:
                return Response(
                    {"detail": "Profile not found. Please create a profile first."},
                    status=status.HTTP_404_NOT_FOUND
                )

    def perform_create(self, serializer):
        # Ensure the user is set correctly during creation
        serializer.save(user=self.request.user)

    def create(self, request, *args, **kwargs):
        """Create new specialist profile"""
        # Check if profile already exists for this user
        if SpecialistProfile.objects.filter(user=request.user).exists():
            return Response(
                {"detail": "Profile already exists for this user. Use PUT/PATCH to update."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create new profile
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Check if the user is updating their own profile
        if instance.user != request.user and not request.user.is_staff:
            return Response(
                {"detail": "You do not have permission to update this profile."},
                status=status.HTTP_403_FORBIDDEN
            )
            
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # Check if the user is deleting their own profile
        if instance.user != request.user and not request.user.is_staff:
            return Response(
                {"detail": "You do not have permission to delete this profile."},
                status=status.HTTP_403_FORBIDDEN
            )
            
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)