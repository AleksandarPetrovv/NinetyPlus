from django.db import models
from django.contrib.auth.models import User

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    favorite_team_id = models.IntegerField(null=True, blank=True)
    favorite_team_name = models.CharField(max_length=100, null=True, blank=True)
    favorite_team_crest = models.URLField(max_length=500, null=True, blank=True)
    
    def __str__(self):
        return f"{self.user.username}'s profile"