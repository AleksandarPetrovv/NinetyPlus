from django.urls import path
from . import views

urlpatterns = [
    path('', views.match_list, name='match-list'),
    path('live/', views.get_matches, name='matches'),
    path('standings/<int:competition_id>/', views.get_standings, name='standings'),
    path('standings/', views.get_standings, name='premier-league-standings'),
    path('match/<int:match_id>/', views.get_match_details, name='match-details'),
    path('fetch-source/', views.fetch_site_source, name='fetch-site-source'),
    path('team/<int:team_id>/', views.get_team_matches, name='team-matches'),
    path('stream-embed/', views.get_stream_embed, name='get-stream-embed'),
    path('match-events/<int:match_id>/', views.get_match_events, name='match-events'),
    path('format-date/', views.format_date, name='format-date'),
]