from django.contrib import admin
from .models import Game, Player, Round, Trick, TrickCard

admin.site.register(Game)
admin.site.register(Player)
admin.site.register(Round)
admin.site.register(Trick)
admin.site.register(TrickCard)
