from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get("username", "").strip()
        password = request.data.get("password", "")
        if not username or not password:
            return Response({"error": "Username and password required."}, status=400)
        if User.objects.filter(username=username).exists():
            return Response({"error": "Username already taken."}, status=400)
        user = User.objects.create_user(username=username, password=password)
        login(request, user)
        return Response({"username": user.username})


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get("username", "")
        password = request.data.get("password", "")
        user = authenticate(request, username=username, password=password)
        if not user:
            return Response({"error": "Invalid credentials."}, status=401)
        login(request, user)
        return Response({"username": user.username})


class LogoutView(APIView):
    def post(self, request):
        logout(request)
        return Response({"ok": True})


class MeView(APIView):
    def get(self, request):
        return Response({"username": request.user.username})
