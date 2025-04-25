from django.urls import path
from . import views

urlpatterns = [
    path('user/', views.user_comments, name='user-comments'),
    path('delete/<int:comment_id>/', views.delete_comment, name='delete-comment'),
    path('<str:match_id>/', views.comment_list, name='comment-list'),
]