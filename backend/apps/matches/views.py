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
def fetch_site_source(request):
    try:
        url = request.query_params.get('url')
        
        if not url:
            return Response({
                'error': 'URL parameter is required',
            }, status=400)
            
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        }
        
        response = requests.get(url, headers=headers, timeout=10)
        status_code = response.status_code
        
        html_source = response.text
        
        return Response({
            'source': html_source,
            'status': status_code,
            'url': url
        })
            
    except Exception as e:
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

@api_view(['GET'])
def get_stream_embed(request):
    try:
        home_team = request.query_params.get('home_team')
        away_team = request.query_params.get('away_team')
        match_date_str = request.query_params.get('match_date')
        
        if not home_team or not away_team or not match_date_str:
            return Response({
                'error': 'home_team, away_team, and match_date parameters are required',
            }, status=400)
            
        targetUrl = "https://techcabal.net/schedule/soccerstreams/"
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        }
        
        response = requests.get(targetUrl, headers=headers, timeout=10)
        
        if response.status_code != 200:
            return Response({
                'error': f'Failed to fetch stream source: {response.status_code}',
            }, status=response.status_code)
        
        html_source = response.text
        soup = BeautifulSoup(html_source, 'html.parser')
        
        tables = soup.find_all('table')
        
        if not tables or len(tables) == 0:
            return Response({
                'stream_url': None
            })
        
        matchDate = datetime.datetime.fromisoformat(match_date_str.replace('Z', '+00:00'))
        timeToFind = matchDate.strftime('%H:%M')
        
        home_first_letter = home_team[0].lower()
        away_first_letter = away_team[0].lower()
        
        rows = tables[0].find_all('tr')
        
        streamId = None
        
        for i, row in enumerate(rows):
            row_text = row.get_text().strip().lower()
            
            if timeToFind in row_text and home_first_letter in row_text and away_first_letter in row_text:
                links = row.find_all('a')
                for link in links:
                    href = link.get('href', '')
                    if href and '/s' in href:
                        matchUrl = href.split('/s')
                        if len(matchUrl) > 1:
                            streamId = matchUrl[1].split('.')[0].replace('/', '')
                            break
                if streamId:
                    break
        
        if streamId:
            stream_url = f"https://techcabal.net/clip/s{streamId}.html"
            return Response({
                'stream_url': stream_url
            })
        else:
            return Response({
                'stream_url': None
            })
            
    except Exception as e:
        return Response({
            'error': str(e),
            'stream_url': None
        }, status=500)