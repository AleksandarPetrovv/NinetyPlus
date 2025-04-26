from django.urls import path
from . import views

urlpatterns = [
    path('<int:match_id>/', views.comment_list, name='comment-list'),
    path('user/', views.user_comments, name='user-comments'),
    path('user/<str:username>/', views.user_comments_by_username, name='user-comments-by-username'),
    path('', views.comment_list_all, name='comment-list-all'),
    path('delete/<int:comment_id>/', views.delete_comment, name='delete-comment'),
]