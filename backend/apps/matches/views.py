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
import pytz

FOOTBALL_API_URL = 'https://api.football-data.org/v4'
FOOTBALL_API_KEY = os.getenv('FOOTBALL_API_KEY')

class MatchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Match
        fields = ['id', 'match_id', 'home_team', 'away_team', 'score', 'status', 'date']

@api_view(['GET'])
def format_date(request):
    try:
        utc_date_str = request.query_params.get('utc_date')
        format_type = request.query_params.get('format_type', 'time_only')
        
        if not utc_date_str:
            return Response({'error': 'utc_date parameter is required'}, status=400)

        utc_date = datetime.datetime.fromisoformat(utc_date_str.replace('Z', '+00:00'))
        
        bg_timezone = pytz.timezone('Europe/Sofia')
        bg_date = utc_date.astimezone(bg_timezone)
        
        if format_type == 'time_only':
            formatted_date = bg_date.strftime('%H:%M')
            return Response({'formatted_date': formatted_date})
        elif format_type == 'date_time':
            month_day = bg_date.strftime('%d %b')
            time = bg_date.strftime('%H:%M')
            formatted_date = f"{month_day}, {time}"
            return Response({'formatted_date': formatted_date})
        elif format_type == 'match_status':
            today = datetime.datetime.now(bg_timezone).date()
            tomorrow = today + datetime.timedelta(days=1)
            
            if bg_date.date() == today:
                formatted_date = bg_date.strftime('%H:%M')
            elif bg_date.date() == tomorrow:
                formatted_date = f"Tomorrow, {bg_date.strftime('%H:%M')}"
            else:
                month_day = bg_date.strftime('%d %b')
                time = bg_date.strftime('%H:%M')
                formatted_date = f"{month_day}, {time}"
                
            return Response({'formatted_date': formatted_date})
        else:
            return Response({'error': 'Invalid format_type parameter'}, status=400)
            
    except ValueError as e:
        return Response({'error': f'Invalid date format: {str(e)}'}, status=400)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

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

@api_view(['GET'])
def get_match_events(request, match_id):
    try:
        response = requests.get(
            f'{FOOTBALL_API_URL}/matches/{match_id}',
            headers={'X-Auth-Token': FOOTBALL_API_KEY}
        )
        
        if response.status_code != 200:
            return Response({
                'error': f'Failed to fetch match data: {response.status_code}'
            }, status=response.status_code)
        
        match_data = response.json()
        home_team = match_data.get('homeTeam', {}).get('name', '')
        away_team = match_data.get('awayTeam', {}).get('name', '')

        match_date = datetime.datetime.fromisoformat(match_data.get('utcDate').replace('Z', '+00:00'))
        now = datetime.datetime.now(datetime.timezone.utc)
        
        if match_date > now:
            return Response({
                'homeTeamEvents': [],
                'awayTeamEvents': []
            })

        year = match_date.strftime('%Y')
        month = match_date.strftime('%m')
        day = match_date.strftime('%d')
        formatted_date = f"{year}{month}{day}"
        
        espn_url = f"https://www.espn.com/soccer/scoreboard/_/date/{formatted_date}"

        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        }
        
        espn_response = requests.get(espn_url, headers=headers, timeout=10)
        
        if espn_response.status_code != 200:
            return Response({
                'homeTeamEvents': [],
                'awayTeamEvents': []
            })

        home_events = []
        away_events = []
        
        soup = BeautifulSoup(espn_response.text, 'html.parser')

        card_sections = soup.select('section.Card.gameModules')
        
        for card in card_sections:
            header = card.select_one('header.Card__Header')
            if not header:
                continue
                
            league_label = header.get('aria-label', '')
            if not league_label:
                continue
                
            top5_leagues = [
                "English Premier League",
                "Spanish LALIGA",
                "German Bundesliga",
                "Italian Serie A",
                "French Ligue 1",
                "UEFA Champions League",
                "UEFA Europa League",
            ]
            
            if not any(league in league_label for league in top5_leagues):
                continue
                
            teams = card.select('.SoccerPerformers__Competitor__Team__Name')
            
            for i, team_element in enumerate(teams):
                team_name = team_element.get_text().strip()
                
                if (team_name in home_team or home_team in team_name or 
                    team_name in away_team or away_team in team_name):
                    
                    competitor_section = team_element.find_parent(class_='SoccerPerformers__Competitor')
                    if not competitor_section:
                        continue
                        
                    is_home_team = team_name in home_team or home_team in team_name
                    events_array = home_events if is_home_team else away_events
                    
                    goal_infos = competitor_section.select('.SoccerPerformers__Competitor__Info')
                    
                    for info_section in goal_infos:
                        is_red_card = info_section.select_one('.SoccerPerformers__RedCardIcon')
                        
                        if is_red_card:
                            red_card_items = info_section.select('.SoccerPerformers__Competitor__Info__GoalsList__Item')
                            
                            for item in red_card_items:
                                player_el = item.select_one('.Soccer__PlayerName')
                                time_el = item.select_one('.GoalScore__Time')
                                
                                if player_el and time_el:
                                    player_name = player_el.get_text().strip().replace('-', '')
                                    time = time_el.get_text().strip().replace('-', '').replace(' ', '')
                                    
                                    events_array.append({
                                        'type': 'red',
                                        'player': player_name,
                                        'time': time
                                    })
                        
                        elif info_section.select_one('.SoccerPerformers__GoalIcon'):
                            no_goals = info_section.select_one('.SoccerPerformers__Competitor__Info__GoalsList--noGoals')
                            if no_goals:
                                continue
                                
                            goal_items = info_section.select('.SoccerPerformers__Competitor__Info__GoalsList__Item')
                            
                            for item in goal_items:
                                player_el = item.select_one('.Soccer__PlayerName')
                                time_el = item.select_one('.GoalScore__Time')
                                
                                if player_el and time_el:
                                    player_name = player_el.get_text().strip().replace('-', '')
                                    time = time_el.get_text().strip().replace('-', '').replace(' ', '')
                                    
                                    if 'OG' in time:
                                        events_array.append({
                                            'type': 'own',
                                            'player': player_name,
                                            'time': time.replace('OG', '').strip()
                                        })
                                    else:
                                        events_array.append({
                                            'type': 'goal',
                                            'player': player_name,
                                            'time': time
                                        })
        
        return Response({
            'homeTeamEvents': home_events,
            'awayTeamEvents': away_events
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=500)