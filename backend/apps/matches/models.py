from django.db import models

class Match(models.Model):
    match_id = models.CharField(max_length=100, unique=True)
    home_team = models.CharField(max_length=100)
    away_team = models.CharField(max_length=100)
    score = models.CharField(max_length=20, null=True)
    status = models.CharField(max_length=50)
    date = models.DateTimeField()
    
    def __str__(self):
        return f"{self.home_team} vs {self.away_team}"