from rest_framework import serializers
from .models import Game, Player


class PlayerSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username")

    class Meta:
        model = Player
        fields = ["seat", "username", "bid", "tricks_won", "total_score", "is_connected"]


class GameSerializer(serializers.ModelSerializer):
    players = PlayerSerializer(many=True, read_only=True)
    host_username = serializers.CharField(source="host.username")

    class Meta:
        model = Game
        fields = [
            "id", "code", "host_username", "status", "num_decks",
            "current_round", "max_rounds", "trump_suit", "players",
        ]
