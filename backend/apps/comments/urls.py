from django.urls import path
from . import views

urlpatterns = [
    path('<str:match_id>/', views.comment_list, name='comment-list'),
]