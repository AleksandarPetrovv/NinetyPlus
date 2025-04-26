from django.db import models
from django.contrib.auth.models import User
import json

class Comment(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    match_id = models.CharField(max_length=100)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    match_home_team_name = models.CharField(max_length=100, blank=True, null=True)
    match_home_team_shortname = models.CharField(max_length=100, blank=True, null=True)
    match_home_team_crest = models.URLField(max_length=500, blank=True, null=True)
    match_away_team_name = models.CharField(max_length=100, blank=True, null=True)
    match_away_team_shortname = models.CharField(max_length=100, blank=True, null=True)
    match_away_team_crest = models.URLField(max_length=500, blank=True, null=True)
    match_competition_name = models.CharField(max_length=100, blank=True, null=True)
    match_competition_id = models.IntegerField(blank=True, null=True)
    match_date = models.DateTimeField(blank=True, null=True)
    match_status = models.CharField(max_length=50, blank=True, null=True)
    match_score = models.TextField(blank=True, null=True)
    
    def __str__(self):
        return f"{self.user.username} on {self.match_id}"
    
    def get_match_details(self):
        if not self.match_home_team_name:
            return None
            
        score_data = {}
        if self.match_score:
            try:
                score_data = json.loads(self.match_score) 
            except:
                score_data = {"fullTime": {"home": 0, "away": 0}}
        
        return {
            'id': self.match_id,
            'homeTeam': {
                'name': self.match_home_team_name,
                'shortName': self.match_home_team_shortname or self.match_home_team_name,
                'crest': self.match_home_team_crest or ''
            },
            'awayTeam': {
                'name': self.match_away_team_name,
                'shortName': self.match_away_team_shortname or self.match_away_team_name,
                'crest': self.match_away_team_crest or ''
            },
            'competition': {
                'id': self.match_competition_id or 0,
                'name': self.match_competition_name or 'Unknown'
            },
            'utcDate': self.match_date.isoformat() if self.match_date else None,
            'status': self.match_status or 'UNKNOWN',
            'score': score_data
        }