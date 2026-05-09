import random
import string
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Game, Player
from .serializers import GameSerializer


def gen_code():
    while True:
        code = "".join(random.choices(string.ascii_uppercase, k=6))
        if not Game.objects.filter(code=code).exists():
            return code


class CreateGameView(APIView):
    def post(self, request):
        num_decks = int(request.data.get("num_decks", 1))
        game = Game.objects.create(
            code=gen_code(),
            host=request.user,
            num_decks=num_decks,
        )
        Player.objects.create(game=game, user=request.user, seat=0)
        return Response(GameSerializer(game).data, status=status.HTTP_201_CREATED)


class JoinGameView(APIView):
    def post(self, request):
        code = request.data.get("code", "").upper()
        try:
            game = Game.objects.get(code=code, status=Game.STATUS_WAITING)
        except Game.DoesNotExist:
            return Response({"error": "Game not found or already started."}, status=404)

        if game.players.filter(user=request.user).exists():
            return Response(GameSerializer(game).data)

        if game.players.count() >= 7:
            return Response({"error": "Game is full (max 7 players)."}, status=400)

        seat = game.players.count()
        Player.objects.create(game=game, user=request.user, seat=seat)
        return Response(GameSerializer(game).data)


class GameDetailView(APIView):
    def get(self, request, code):
        try:
            game = Game.objects.get(code=code.upper())
        except Game.DoesNotExist:
            return Response({"error": "Not found."}, status=404)
        return Response(GameSerializer(game).data)
