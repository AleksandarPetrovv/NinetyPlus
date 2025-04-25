from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/matches/', include('apps.matches.urls')),
    path('api/users/', include('apps.users.urls')),
    path('api/comments/', include('apps.comments.urls')),
]