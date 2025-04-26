from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.register, name='register'),
    path('login/', views.login, name='login'),
    path('profile/', views.profile, name='profile'),
    path('favorite-team/', views.user_favorite_team, name='favorite-team'),
    path('details/', views.user_details, name='user-details'),
    path('profile/<str:username>/', views.public_profile, name='public-profile'),
]