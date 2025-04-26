from django.shortcuts import render
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .models import Comment
from rest_framework import serializers
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authentication import TokenAuthentication
from django.contrib.auth.models import User
import requests
import os
import json
from django.utils.timezone import make_aware
from datetime import datetime

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
        stored_details = obj.get_match_details()
        if stored_details:
            return stored_details
            
        match_id = obj.match_id
        try:
            FOOTBALL_API_URL = 'https://api.football-data.org/v4'
            FOOTBALL_API_KEY = os.getenv('FOOTBALL_API_KEY')
            
            response = requests.get(
                f'{FOOTBALL_API_URL}/matches/{match_id}',
                headers={'X-Auth-Token': FOOTBALL_API_KEY}
            )
            
            if response.status_code == 200:
                match_data = response.json()
                
                obj.match_home_team_name = match_data.get('homeTeam', {}).get('name', 'Unknown Team')
                obj.match_home_team_shortname = match_data.get('homeTeam', {}).get('shortName', obj.match_home_team_name)
                obj.match_home_team_crest = match_data.get('homeTeam', {}).get('crest', '')
                
                obj.match_away_team_name = match_data.get('awayTeam', {}).get('name', 'Unknown Team')
                obj.match_away_team_shortname = match_data.get('awayTeam', {}).get('shortName', obj.match_away_team_name)
                obj.match_away_team_crest = match_data.get('awayTeam', {}).get('crest', '')
                
                obj.match_competition_name = match_data.get('competition', {}).get('name', 'Unknown')
                obj.match_competition_id = match_data.get('competition', {}).get('id', 0)
                
                if match_data.get('utcDate'):
                    try:
                        utc_date = datetime.strptime(match_data.get('utcDate'), '%Y-%m-%dT%H:%M:%SZ')
                        obj.match_date = make_aware(utc_date)
                    except Exception as e:
                        print(f"Error parsing date: {e}")
                    
                obj.match_status = match_data.get('status', 'UNKNOWN')
                
                try:
                    score_data = match_data.get('score', {"fullTime": {"home": 0, "away": 0}})
                    obj.match_score = json.dumps(score_data)
                except Exception as e:
                    print(f"Error storing score data: {e}")
                    obj.match_score = json.dumps({"fullTime": {"home": 0, "away": 0}})
                    
                obj.save()
                
                return obj.get_match_details()
        except Exception as e:
            print(f"Error fetching match details: {e}")
            
        return {
            'id': match_id,
            'homeTeam': {'name': 'Unknown Team', 'shortName': 'UNK', 'crest': ''},
            'awayTeam': {'name': 'Unknown Team', 'shortName': 'UNK', 'crest': ''},
            'competition': {'id': 0, 'name': 'Unknown'},
            'utcDate': None,
            'status': 'UNKNOWN',
            'score': {"fullTime": {"home": 0, "away": 0}}
        }

@api_view(['GET', 'POST'])
def comment_list(request, match_id):
    if request.method == 'GET':
        comments = Comment.objects.filter(match_id=match_id).order_by('-created_at')
        serializer = CommentSerializer(comments, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        if not request.user.is_authenticated:
            return Response({"detail": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)
        
        serializer = CommentSerializer(data=request.data)
        if serializer.is_valid():
            comment = serializer.save(user=request.user, match_id=match_id)
            
            try:
                FOOTBALL_API_URL = 'https://api.football-data.org/v4'
                FOOTBALL_API_KEY = os.getenv('FOOTBALL_API_KEY')
                
                response = requests.get(
                    f'{FOOTBALL_API_URL}/matches/{match_id}',
                    headers={'X-Auth-Token': FOOTBALL_API_KEY}
                )
                
                if response.status_code == 200:
                    match_data = response.json()
                    
                    comment.match_home_team_name = match_data.get('homeTeam', {}).get('name', 'Unknown Team')
                    comment.match_home_team_shortname = match_data.get('homeTeam', {}).get('shortName', comment.match_home_team_name)
                    comment.match_home_team_crest = match_data.get('homeTeam', {}).get('crest', '')
                    
                    comment.match_away_team_name = match_data.get('awayTeam', {}).get('name', 'Unknown Team')
                    comment.match_away_team_shortname = match_data.get('awayTeam', {}).get('shortName', comment.match_away_team_name)
                    comment.match_away_team_crest = match_data.get('awayTeam', {}).get('crest', '')
                    
                    comment.match_competition_name = match_data.get('competition', {}).get('name', 'Unknown')
                    comment.match_competition_id = match_data.get('competition', {}).get('id', 0)
                    
                    if match_data.get('utcDate'):
                        try:
                            utc_date = datetime.strptime(match_data.get('utcDate'), '%Y-%m-%dT%H:%M:%SZ')
                            comment.match_date = make_aware(utc_date)
                        except Exception as e:
                            print(f"Error parsing date: {e}")
                    
                    comment.match_status = match_data.get('status', 'UNKNOWN')
                    score_data = match_data.get('score', {"fullTime": {"home": 0, "away": 0}})
                    comment.match_score = json.dumps(score_data)
                    comment.save()
            except Exception as e:
                print(f"Error storing match details for comment: {e}")
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_comments(request):
    comments = Comment.objects.filter(user=request.user).order_by('-created_at')
    serializer = UserCommentSerializer(comments, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def comment_list_all(request):
    page_size = int(request.query_params.get('page_size', 20))
    page = int(request.query_params.get('page', 1))
    
    offset = (page - 1) * page_size
    
    comments = Comment.objects.all().order_by('-created_at')[offset:offset+page_size]
    
    serializer = UserCommentSerializer(comments, many=True)

    total_comments = Comment.objects.count()
    
    return Response({
        'results': serializer.data,
        'page': page,
        'page_size': page_size,
        'total': total_comments,
        'total_pages': (total_comments + page_size - 1) // page_size
    })
    
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

@api_view(['GET'])
def user_comments_by_username(request, username):
    try:
        user = User.objects.get(username=username)
        comments = Comment.objects.filter(user=user).order_by('-created_at')
        serializer = UserCommentSerializer(comments, many=True)
        return Response(serializer.data)
    except User.DoesNotExist:
        return Response({"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND)