from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from .models import User
from .serializers import UserSerializer, UserUpdateSerializer
from specialists.models import SpecialistProfile
from specialists.serializers import SpecialistProfileSerializer
from clients.models import LegalEntityClient, IndividualClient
from clients.serializers import LegalEntityClientSerializer, IndividualClientSerializer

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action in ['update', 'partial_update']:
            return UserUpdateSerializer
        return UserSerializer

    @action(detail=False, methods=['get', 'patch'])
    def me(self, request):
        """Get or update current user data with profile information"""
        user = request.user
        
        if request.method == 'PATCH':
            # Обновляем пользователя
            serializer = UserUpdateSerializer(user, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                user = User.objects.get(id=user.id)  # Обновляем объект пользователя
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        user_data = self.get_serializer(user).data

        # Add profile data based on user type
        if user.user_type == 'specialist' and hasattr(user, 'specialist_profile'):
            profile_data = SpecialistProfileSerializer(user.specialist_profile).data
            user_data['specialist_profile'] = profile_data
        elif user.user_type == 'legal' and hasattr(user, 'legal_entity_client_profile'):
            profile_data = LegalEntityClientSerializer(user.legal_entity_client_profile).data
            user_data['legal_entity_profile'] = profile_data
        elif user.user_type == 'individual' and hasattr(user, 'individual_client_profile'):
            profile_data = IndividualClientSerializer(user.individual_client_profile).data
            user_data['individual_profile'] = profile_data

        return Response(user_data)

    @action(detail=False, methods=['get'])
    def specialists(self, request):
        """Get list of BIM specialists"""
        specialists = User.objects.filter(user_type='specialist')
        serializer = self.get_serializer(specialists, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def select_role(self, request):
        """Select user role (specialist/client) and create corresponding profile"""
        user = request.user
        role = request.data.get('role')

        if role not in ['specialist', 'client']:
            return Response({'error': 'Invalid role'}, status=status.HTTP_400_BAD_REQUEST)

        if user.role_selected:
            return Response({'error': 'Role already selected'}, status=status.HTTP_400_BAD_REQUEST)

        user.user_type = role
        user.role_selected = True
        user.save()

        # Create corresponding profile based on role
        if role == 'specialist':
            SpecialistProfile.objects.create(user=user)

        return Response({
            'message': 'Role selected successfully',
            'user_type': role,
            'profile_complete': False
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def profile_status(self, request):
        """Get user's profile completion status"""
        user = request.user
        profile_complete = False

        if user.user_type == 'specialist' and hasattr(user, 'specialist_profile'):
            profile = user.specialist_profile
            profile_complete = all([
                profile.specialization,
                profile.experience
            ])
        elif user.user_type == 'individual' and hasattr(user, 'individual_client_profile'):
            profile_complete = True  # Профиль создан
        elif user.user_type == 'legal' and hasattr(user, 'legal_entity_client_profile'):
            profile_complete = True  # Профиль создан

        return Response({
            'role_selected': user.role_selected,
            'user_type': user.user_type,
            'profile_complete': profile_complete,
            'has_profile': hasattr(user, f'{user.user_type}_profile') if user.user_type else False
        })

    @action(detail=False, methods=['post'])
    def set_type(self, request):
        """Set user type and create corresponding profile"""
        user = request.user
        user_type = request.data.get('user_type')

        if user_type not in ['specialist', 'individual', 'legal']:
            return Response({'error': 'Недопустимый тип пользователя'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Установка типа пользователя
            user.user_type = user_type
            user.role_selected = True
            user.save()

            # Создаём профиль только для specialist (пустой профиль допустим)
            if user_type == 'specialist' and not hasattr(user, 'specialist_profile'):
                SpecialistProfile.objects.create(user=user)

            # Для legal/individual профиль создаётся при отправке соответствующих форм на их эндпоинты
            return Response({
                'message': 'Тип пользователя успешно установлен',
                'user_type': user_type,
                'profile_created': user_type == 'specialist'
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                'error': f'Ошибка при создании профиля: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        try:
            # Создаем базового пользователя
            serializer = UserSerializer(data=request.data)
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            user = serializer.save()
            
            # Если указан тип пользователя при регистрации, создаем соответствующий профиль
            user_type = request.data.get('user_type')
            if user_type == 'specialist':
                # Создаем профиль специалиста с данными из регистрации
                specialist_profile = SpecialistProfile.objects.create(
                    user=user,
                    specialist_type='executor',  # По умолчанию
                    specialization='Не указано',
                    experience='Не указано',
                    about='Не указано',
                    availability='Не указано',
                    portfolio='',
                    certificates='Не указано'
                )
                
                # Устанавливаем тип пользователя
                user.user_type = user_type
                user.role_selected = True
                user.save()

            return Response({
                'message': 'Пользователь успешно зарегистрирован',
                'user': UserSerializer(user).data,
                'profile_created': user_type == 'specialist'
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data["refresh_token"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"message": "Successfully logged out"}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
