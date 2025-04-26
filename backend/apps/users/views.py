from .models import UserProfile
from django.db import transaction
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework import serializers
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authtoken.models import Token
from datetime import timedelta
from apps.comments.models import Comment

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password']
        
    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password']
        )
        return user

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = UserSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        token, created = Token.objects.get_or_create(user=user)
        return Response({'token': token.key}, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    username = request.data.get('username')
    password = request.data.get('password')
    user = authenticate(username=username, password=password)
    if user:
        token, created = Token.objects.get_or_create(user=user)
        return Response({'token': token.key, 'user_id': user.id, 'username': user.username})
    return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['favorite_team_id', 'favorite_team_name', 'favorite_team_crest', 'favorite_team_league', 'favorite_team_country']

@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def user_favorite_team(request):
    profile, created = UserProfile.objects.get_or_create(user=request.user)
    
    if request.method == 'GET':
        serializer = UserProfileSerializer(profile)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = UserProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_details(request):
    user = request.user
    
    local_date = user.date_joined + timedelta(hours=3)
    
    return Response({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'join_date': local_date.strftime('%Y-%m-%d'),
        'join_time': local_date.strftime('%H:%M:%S')
    })

@api_view(['GET'])
def public_profile(request, username):
    try:
        user = User.objects.get(username=username)
        profile, created = UserProfile.objects.get_or_create(user=user)
        
        comment_count = Comment.objects.filter(user=user).count()
        
        local_date = user.date_joined + timedelta(hours=3)
        
        return Response({
            'username': user.username,
            'join_date': local_date.strftime('%Y-%m-%d'),
            'favorite_team': {
                'id': profile.favorite_team_id,
                'name': profile.favorite_team_name,
                'crest': profile.favorite_team_crest,
            },
            'favorite_team_league': profile.favorite_team_league,
            'favorite_team_country': profile.favorite_team_country,
            'comment_count': comment_count
        })
    except User.DoesNotExist:
        return Response({"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND)