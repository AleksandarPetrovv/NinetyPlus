import os
import requests
from django.shortcuts import render
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.conf import settings
from .models import Match
from rest_framework import serializers
from django.http import HttpResponse
from django.views import View
import json
from bs4 import BeautifulSoup
import datetime

FOOTBALL_API_URL = 'https://api.football-data.org/v4'
FOOTBALL_API_KEY = os.getenv('FOOTBALL_API_KEY')

class MatchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Match
        fields = ['id', 'match_id', 'home_team', 'away_team', 'score', 'status', 'date']

@api_view(['GET'])
def match_list(request):
    matches = Match.objects.all().order_by('-date')
    serializer = MatchSerializer(matches, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def get_matches(request):
    try:
        response = requests.get(
            f'{FOOTBALL_API_URL}/matches',
            headers={'X-Auth-Token': FOOTBALL_API_KEY}
        )
        return Response(response.json())
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
def get_standings(request, competition_id=2021):
    try:
        response = requests.get(
            f'{FOOTBALL_API_URL}/competitions/{competition_id}/standings',
            headers={'X-Auth-Token': FOOTBALL_API_KEY}
        )
        return Response(response.json())
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
def get_match_details(request, match_id):
    try:
        response = requests.get(
            f'{FOOTBALL_API_URL}/matches/{match_id}',
            headers={'X-Auth-Token': FOOTBALL_API_KEY}
        )
        return Response({'match': response.json()})
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
def find_stream_links(request, home_team, away_team):
    try:
        url = "https://techcabal.net/schedule/soccerstreams/"
        
        response = requests.get(url)
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        home_team_lower = home_team.lower()
        away_team_lower = away_team.lower()
        
        matches = []
        
        for link in soup.find_all('a'):
            text = link.get_text().lower()
            if home_team_lower in text and away_team_lower in text:
                matches.append({
                    'text': link.get_text(),
                    'href': link.get('href', ''),
                })
        
        if not matches:
            for element in soup.find_all(['div', 'p', 'span', 'li']):
                text = element.get_text().lower()
                if home_team_lower in text and away_team_lower in text:
                    parent_link = element.find_parent('a')
                    child_link = element.find('a')
                    
                    link = parent_link or child_link
                    if link:
                        matches.append({
                            'text': element.get_text(),
                            'href': link.get('href', ''),
                        })
        
        return Response({'matches': matches})
    
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def fetch_site_source(request):
    try:
        url = request.query_params.get('url')
        
        if not url:
            return Response({
                'error': 'URL parameter is required',
            }, status=400)
            
        print(f"Backend: Fetching source from: {url}")
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        }
        
        response = requests.get(url, headers=headers, timeout=10)
        status_code = response.status_code
        print(f"Backend: Request status code: {status_code}")
        
        html_source = response.text
        print(f"Backend: Response length: {len(html_source)} bytes")
        
        return Response({
            'source': html_source,
            'status': status_code,
            'url': url
        })
            
    except Exception as e:
        print(f"Backend Exception: {str(e)}")
        return Response({
            'error': str(e),
        }, status=500)

@api_view(['GET'])
def get_team_matches(request, team_id):
    try:
        today = datetime.datetime.now().strftime('%Y-%m-%d')
        thirty_days_later = (datetime.datetime.now() + datetime.timedelta(days=30)).strftime('%Y-%m-%d')
        
        response = requests.get(
            f'{FOOTBALL_API_URL}/teams/{team_id}/matches',
            params={
                'dateFrom': today,
                'dateTo': thirty_days_later,
                'status': 'SCHEDULED,TIMED'
            },
            headers={'X-Auth-Token': FOOTBALL_API_KEY}
        )
        
        if response.status_code == 200:
            return Response(response.json())
        else:
            return Response({
                'error': f"Failed to fetch team matches: {response.status_code}"
            }, status=response.status_code)
    except Exception as e:
        return Response({'error': str(e)}, status=500)