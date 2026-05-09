from django.urls import path
from . import views

urlpatterns = [
    path("create/", views.CreateGameView.as_view()),
    path("join/", views.JoinGameView.as_view()),
    path("<str:code>/", views.GameDetailView.as_view()),
]
