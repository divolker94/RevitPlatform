from rest_framework import viewsets, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from accounts.models import User
from .models import IndividualClient, LegalEntityClient
from .serializers import LegalEntityClientSerializer, IndividualClientSerializer

class LegalEntityViewSet(viewsets.ModelViewSet):
    serializer_class = LegalEntityClientSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return LegalEntityClient.objects.all()

    def perform_create(self, serializer):
        print(f"Creating LegalEntityClient for user: {self.request.user}")
        print(f"User authenticated: {self.request.user.is_authenticated}")
        print(f"User ID: {self.request.user.id}")
        serializer.save(user=self.request.user)

class IndividualClientViewSet(viewsets.ModelViewSet):
    serializer_class = IndividualClientSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return IndividualClient.objects.all()

    def perform_create(self, serializer):
        print(f"Creating IndividualClient for user: {self.request.user}")
        print(f"User authenticated: {self.request.user.is_authenticated}")
        print(f"User ID: {self.request.user.id}")
        serializer.save(user=self.request.user)