import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User
from .models import Game, Player, Round, Trick, TrickCard
from . import engine


class GameConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.game_code = self.scope["url_route"]["kwargs"]["game_code"]
        self.room_group = f"game_{self.game_code}"
        self.user = self.scope["user"]

        if not self.user.is_authenticated:
            await self.close()
            return

        await self.channel_layer.group_add(self.room_group, self.channel_name)
        await self.accept()
        await self.set_player_connected(True)
        await self.broadcast_state()

    async def disconnect(self, code):
        await self.set_player_connected(False)
        await self.channel_layer.group_discard(self.room_group, self.channel_name)
        await self.broadcast_state()

    async def receive(self, text_data):
        data = json.loads(text_data)
        action = data.get("action")

        handlers = {
            "start_game":  self.handle_start_game,
            "place_bid":   self.handle_place_bid,
            "play_card":   self.handle_play_card,
        }
        handler = handlers.get(action)
        if handler:
            await handler(data)

    # ── Action handlers ──────────────────────────────────────────────────────

    async def handle_start_game(self, data):
        game = await self.get_game()
        if game.host_id != self.user.id or game.status != Game.STATUS_WAITING:
            return
        players = await self.get_players(game)
        if len(players) < 2:
            await self.send_error("Need at least 2 players to start.")
            return

        num_decks = game.num_decks
        num_players = len(players)
        max_r = engine.max_rounds(num_players, num_decks)

        await self.db_start_game(game, max_r)
        await self.start_new_round(game)

    async def handle_place_bid(self, data):
        game = await self.get_game()
        if game.status != Game.STATUS_BIDDING:
            return
        player = await self.get_current_player_for_user(game)
        if player is None:
            return

        bid = int(data.get("bid", 0))
        cards_in_round = game.current_round
        if bid < 0 or bid > cards_in_round:
            await self.send_error(f"Bid must be 0–{cards_in_round}.")
            return

        await self.db_set_bid(player, bid)
        await self.advance_bid_turn(game)

    async def handle_play_card(self, data):
        game = await self.get_game()
        if game.status != Game.STATUS_PLAYING:
            return
        player = await self.get_current_player_for_user(game)
        if player is None:
            return

        card = data.get("card")  # {suit, rank, deck_id}
        if not card:
            return

        valid, reason = await self.validate_card_play(game, player, card)
        if not valid:
            await self.send_error(reason)
            return

        await self.db_play_card(game, player, card)
        await self.advance_play_turn(game)

    # ── Game flow helpers ─────────────────────────────────────────────────────

    async def start_new_round(self, game):
        game = await self.get_game()
        players = await self.get_players(game)
        num_players = len(players)
        cards_per = game.current_round
        trump = engine.pick_trump()

        hands = engine.deal_cards(num_players, cards_per, game.num_decks)
        round_obj = await self.db_create_round(game, trump, cards_per)
        await self.db_deal_hands(players, hands)
        await self.db_reset_bids_and_tricks(players)
        await self.db_update_game(game, status=Game.STATUS_BIDDING, trump_suit=trump,
                                   current_player_index=game.lead_player_index)
        await self.broadcast_state()

    async def advance_bid_turn(self, game):
        game = await self.get_game()
        players = await self.get_players(game)
        all_bid = all(p.bid >= 0 for p in players)
        if all_bid:
            await self.db_update_game(game, status=Game.STATUS_PLAYING,
                                       current_player_index=game.lead_player_index)
            trick = await self.db_create_trick(game)
        else:
            nxt = (game.current_player_index + 1) % len(players)
            await self.db_update_game(game, current_player_index=nxt)
        await self.broadcast_state()

    async def advance_play_turn(self, game):
        game = await self.get_game()
        players = await self.get_players(game)
        trick = await self.get_current_trick(game)
        cards = await self.get_trick_cards(trick)

        if len(cards) < len(players):
            nxt = (game.current_player_index + 1) % len(players)
            await self.db_update_game(game, current_player_index=nxt)
            await self.broadcast_state()
            return

        # Trick complete — determine winner
        trick_data = [
            {"suit": c.suit, "rank": c.rank, "deck_id": c.deck_id,
             "play_order": c.play_order, "player_index": await self.get_player_seat(c.player_id)}
            for c in cards
        ]
        win_idx = engine.determine_winner(trick_data, trick.lead_suit, game.trump_suit)
        winning_seat = trick_data[win_idx]["player_index"]
        winner_player = next(p for p in players if p.seat == winning_seat)

        await self.db_complete_trick(trick, winner_player)

        # Check if round is over
        if game.current_round > 1:
            remaining = any(len(p.hand) > 0 for p in await self.get_players(game))
        else:
            remaining = False

        if not remaining:
            await self.end_round(game, players)
        else:
            await self.db_update_game(game, current_player_index=winning_seat)
            new_trick = await self.db_create_trick(game)
            await self.broadcast_state()

    async def end_round(self, game, players):
        players = await self.get_players(game)
        players_data = [{"bid": p.bid, "tricks_won": p.tricks_won} for p in players]
        deltas = engine.calculate_round_scores(players_data)
        await self.db_apply_scores(players, deltas)
        await self.db_complete_current_round(game)

        game = await self.get_game()
        if game.current_round >= game.max_rounds:
            await self.db_update_game(game, status=Game.STATUS_FINISHED)
            await self.broadcast_state()
            return

        # Rotate lead player clockwise for next round
        num_players = len(players)
        new_lead = (game.lead_player_index + 1) % num_players
        new_round = game.current_round + 1
        await self.db_update_game(game, current_round=new_round, lead_player_index=new_lead)
        await self.start_new_round(game)

    # ── Validation ────────────────────────────────────────────────────────────

    async def validate_card_play(self, game, player, card):
        hand = player.hand
        card_in_hand = any(
            c["suit"] == card["suit"] and c["rank"] == card["rank"] and c["deck_id"] == card["deck_id"]
            for c in hand
        )
        if not card_in_hand:
            return False, "Card not in your hand."

        trick = await self.get_current_trick(game)
        if not trick.lead_suit:
            return True, ""  # first card, anything goes

        if card["suit"] == trick.lead_suit:
            return True, ""

        has_lead = any(c["suit"] == trick.lead_suit for c in hand)
        if has_lead:
            return False, f"Must follow lead suit ({trick.lead_suit})."

        return True, ""

    # ── Broadcast ─────────────────────────────────────────────────────────────

    async def broadcast_state(self):
        state = await self.build_state()
        await self.channel_layer.group_send(
            self.room_group,
            {"type": "game_state", "state": state},
        )

    async def game_state(self, event):
        await self.send(text_data=json.dumps({"type": "state", **event["state"]}))

    async def send_error(self, message):
        await self.send(text_data=json.dumps({"type": "error", "message": message}))

    # ── State builder ─────────────────────────────────────────────────────────

    @database_sync_to_async
    def build_state(self):
        try:
            game = Game.objects.get(code=self.game_code)
        except Game.DoesNotExist:
            return {"error": "Game not found"}

        players = list(game.players.select_related("user").order_by("seat"))

        current_trick_cards = []
        try:
            current_round = game.rounds.filter(is_complete=False).order_by("-number").first()
            if current_round:
                current_trick = current_round.tricks.filter(is_complete=False).order_by("-number").first()
                if current_trick:
                    current_trick_cards = [
                        {
                            "suit": tc.suit,
                            "rank": tc.rank,
                            "deck_id": tc.deck_id,
                            "player_seat": tc.player.seat,
                            "player_name": tc.player.user.username,
                            "play_order": tc.play_order,
                        }
                        for tc in current_trick.cards.select_related("player__user").order_by("play_order")
                    ]
        except Exception:
            pass

        players_state = []
        for p in players:
            hand = p.hand if p.user_id == self.user.id else [{"hidden": True}] * len(p.hand)
            players_state.append({
                "seat": p.seat,
                "username": p.user.username,
                "bid": p.bid,
                "tricks_won": p.tricks_won,
                "total_score": p.total_score,
                "hand_count": len(p.hand),
                "hand": hand,
                "is_connected": p.is_connected,
            })

        return {
            "game_code": game.code,
            "status": game.status,
            "current_round": game.current_round,
            "max_rounds": game.max_rounds,
            "trump_suit": game.trump_suit,
            "current_player_index": game.current_player_index,
            "lead_player_index": game.lead_player_index,
            "num_decks": game.num_decks,
            "players": players_state,
            "current_trick": current_trick_cards,
        }

    # ── DB helpers ────────────────────────────────────────────────────────────

    @database_sync_to_async
    def get_game(self):
        return Game.objects.get(code=self.game_code)

    @database_sync_to_async
    def get_players(self, game):
        return list(game.players.select_related("user").order_by("seat"))

    @database_sync_to_async
    def get_current_player_for_user(self, game):
        players = list(game.players.order_by("seat"))
        if game.current_player_index >= len(players):
            return None
        p = players[game.current_player_index]
        if p.user_id != self.user.id:
            return None
        return p

    @database_sync_to_async
    def get_current_trick(self, game):
        current_round = game.rounds.filter(is_complete=False).order_by("-number").first()
        if not current_round:
            return None
        return current_round.tricks.filter(is_complete=False).order_by("-number").first()

    @database_sync_to_async
    def get_trick_cards(self, trick):
        return list(trick.cards.select_related("player").order_by("play_order"))

    @database_sync_to_async
    def get_player_seat(self, player_id):
        return Player.objects.get(id=player_id).seat

    @database_sync_to_async
    def set_player_connected(self, connected):
        Player.objects.filter(game__code=self.game_code, user=self.user).update(is_connected=connected)

    @database_sync_to_async
    def db_start_game(self, game, max_r):
        game.status = Game.STATUS_BIDDING
        game.current_round = 1
        game.max_rounds = max_r
        game.save()

    @database_sync_to_async
    def db_update_game(self, game, **kwargs):
        for k, v in kwargs.items():
            setattr(game, k, v)
        game.save()

    @database_sync_to_async
    def db_create_round(self, game, trump, cards_per):
        return Round.objects.create(
            game=game, number=game.current_round, trump_suit=trump, cards_per_player=cards_per
        )

    @database_sync_to_async
    def db_deal_hands(self, players, hands):
        for player, hand in zip(players, hands):
            player.hand = hand
            player.save()

    @database_sync_to_async
    def db_reset_bids_and_tricks(self, players):
        for p in players:
            p.bid = -1
            p.tricks_won = 0
            p.save()

    @database_sync_to_async
    def db_set_bid(self, player, bid):
        player.bid = bid
        player.save()

    @database_sync_to_async
    def db_create_trick(self, game):
        current_round = game.rounds.filter(is_complete=False).order_by("-number").first()
        trick_count = current_round.tricks.count()
        return Trick.objects.create(round=current_round, number=trick_count + 1)

    @database_sync_to_async
    def db_play_card(self, game, player, card):
        trick = game.rounds.filter(is_complete=False).order_by("-number").first().tricks.filter(is_complete=False).order_by("-number").first()
        play_order = trick.cards.count()
        if play_order == 0:
            trick.lead_suit = card["suit"]
            trick.save()
        TrickCard.objects.create(
            trick=trick, player=player,
            suit=card["suit"], rank=card["rank"],
            deck_id=card.get("deck_id", 1), play_order=play_order,
        )
        # Remove from hand
        hand = [c for c in player.hand if not (
            c["suit"] == card["suit"] and c["rank"] == card["rank"] and c["deck_id"] == card.get("deck_id", 1)
        )]
        player.hand = hand
        player.save()

    @database_sync_to_async
    def db_complete_trick(self, trick, winner):
        trick.winner = winner
        trick.is_complete = True
        trick.save()
        winner.tricks_won += 1
        winner.save()

    @database_sync_to_async
    def db_apply_scores(self, players, deltas):
        for player, delta in zip(players, deltas):
            player.total_score += delta
            player.save()

    @database_sync_to_async
    def db_complete_current_round(self, game):
        game.rounds.filter(is_complete=False).update(is_complete=True)
