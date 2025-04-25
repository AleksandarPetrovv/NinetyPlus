from django.shortcuts import render
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .models import Comment
from rest_framework import serializers
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authentication import TokenAuthentication
import requests
import os

class CommentSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = Comment
        fields = ['id', 'match_id', 'content', 'created_at', 'username']
        extra_kwargs = {
            'match_id': {'required': False}
        }

class UserCommentSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    match_details = serializers.SerializerMethodField()
    
    class Meta:
        model = Comment
        fields = ['id', 'match_id', 'content', 'created_at', 'username', 'match_details']
    
    def get_match_details(self, obj):
        from django.core.cache import cache
        
        match_id = obj.match_id
        cache_key = f'match_details_{match_id}'
        cached_data = cache.get(cache_key)
        
        if cached_data:
            return cached_data
        
        try:
            FOOTBALL_API_URL = 'https://api.football-data.org/v4'
            FOOTBALL_API_KEY = os.getenv('FOOTBALL_API_KEY')
            
            response = requests.get(
                f'{FOOTBALL_API_URL}/matches/{match_id}',
                headers={'X-Auth-Token': FOOTBALL_API_KEY}
            )
            
            if response.status_code == 200:
                match_data = response.json()
                simplified_data = {
                    'id': match_data.get('id'),
                    'homeTeam': {
                        'name': match_data.get('homeTeam', {}).get('name', ''),
                        'shortName': match_data.get('homeTeam', {}).get('shortName', ''),
                        'crest': match_data.get('homeTeam', {}).get('crest', '')
                    },
                    'awayTeam': {
                        'name': match_data.get('awayTeam', {}).get('name', ''),
                        'shortName': match_data.get('awayTeam', {}).get('shortName', ''),
                        'crest': match_data.get('awayTeam', {}).get('crest', '')
                    },
                    'score': match_data.get('score', {}),
                    'utcDate': match_data.get('utcDate'),
                    'status': match_data.get('status'),
                    'competition': {
                        'id': match_data.get('competition', {}).get('id'),
                        'name': match_data.get('competition', {}).get('name')
                    }
                }
                
                cache.set(cache_key, simplified_data, 60 * 60)
                return simplified_data
                
        except Exception as e:
            print(f"Error fetching match details: {e}")
            
        return {
            'id': match_id,
            'homeTeam': {'name': 'Unknown Team', 'crest': ''},
            'awayTeam': {'name': 'Unknown Team', 'crest': ''}
        }

@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def comment_list(request, match_id):
    if request.method == 'GET':
        comments = Comment.objects.filter(match_id=match_id).order_by('-created_at')
        serializer = CommentSerializer(comments, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        if not request.user.is_authenticated:
            return Response(
                {"detail": "Authentication credentials were not provided."}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
            
        serializer = CommentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user, match_id=match_id)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_comments(request):
    comments = Comment.objects.filter(user=request.user).order_by('-created_at')
    serializer = UserCommentSerializer(comments, many=True)
    return Response(serializer.data)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_comment(request, comment_id):
    try:
        comment = Comment.objects.get(id=comment_id)
        
        if comment.user != request.user:
            return Response(
                {"detail": "You do not have permission to delete this comment."}, 
                status=status.HTTP_403_FORBIDDEN
            )
            
        comment.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    except Comment.DoesNotExist:
        return Response(
            {"detail": "Comment not found."}, 
            status=status.HTTP_404_NOT_FOUND
        )