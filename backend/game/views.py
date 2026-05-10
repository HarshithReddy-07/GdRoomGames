import random
import string
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from .models import Game, Player
from .serializers import GameSerializer


def gen_code():
    while True:
        code = "".join(random.choices(string.ascii_uppercase, k=6))
        if not Game.objects.filter(code=code).exists():
            return code


class CreateGameView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get("username", "").strip()[:50]
        num_decks = int(request.data.get("num_decks", 1))
        if not username:
            return Response({"error": "Username required."}, status=400)

        game = Game.objects.create(code=gen_code(), host_username=username, num_decks=num_decks)
        Player.objects.create(game=game, username=username, seat=0)
        return Response(GameSerializer(game).data, status=status.HTTP_201_CREATED)


class JoinGameView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get("username", "").strip()[:50]
        code = request.data.get("code", "").upper()
        if not username:
            return Response({"error": "Username required."}, status=400)

        try:
            game = Game.objects.get(code=code)
        except Game.DoesNotExist:
            return Response({"error": "Game not found."}, status=404)

        # Player already in this game — allow rejoin (handles page reload mid-game)
        if game.players.filter(username=username).exists():
            return Response(GameSerializer(game).data)

        # New player joining — only allowed while waiting
        if game.status != Game.STATUS_WAITING:
            return Response({"error": "Game has already started."}, status=400)

        if game.players.count() >= 7:
            return Response({"error": "Room is full (max 7 players)."}, status=400)

        # Handle name collision in the same room
        base, n = username, 2
        while game.players.filter(username=username).exists():
            username = f"{base}{n}"
            n += 1

        Player.objects.create(game=game, username=username, seat=game.players.count())
        return Response(GameSerializer(game).data)


class GameDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, code):
        try:
            game = Game.objects.get(code=code.upper())
        except Game.DoesNotExist:
            return Response({"error": "Not found."}, status=404)
        return Response(GameSerializer(game).data)
