import random
from .models import SUITS, RANKS, RANK_VALUE


def build_deck(num_decks: int = 1) -> list[dict]:
    deck = []
    for deck_id in range(1, num_decks + 1):
        for suit in SUITS:
            for rank in RANKS:
                deck.append({"suit": suit, "rank": rank, "deck_id": deck_id})
    random.shuffle(deck)
    return deck


def deal_cards(num_players: int, cards_per_player: int, num_decks: int = 1) -> list[list[dict]]:
    deck = build_deck(num_decks)
    hands = [[] for _ in range(num_players)]
    for i in range(cards_per_player * num_players):
        hands[i % num_players].append(deck[i])
    return hands


def pick_trump() -> str:
    return random.choice(SUITS)


def max_rounds(num_players: int, num_decks: int = 1) -> int:
    return (52 * num_decks) // num_players


def determine_winner(trick_cards: list[dict], lead_suit: str, trump_suit: str) -> int:
    """
    trick_cards: list of {suit, rank, deck_id, play_order, player_index}
    Returns the index into trick_cards of the winning card.

    Priority:
      1. Highest trump card (tie → first played wins)
      2. If no trump, highest lead-suit card (tie → first played wins)
    """
    trump_cards = [c for c in trick_cards if c["suit"] == trump_suit]
    lead_cards  = [c for c in trick_cards if c["suit"] == lead_suit]

    candidates = trump_cards if trump_cards else lead_cards
    if not candidates:
        candidates = trick_cards

    best = None
    for card in candidates:
        if best is None:
            best = card
        else:
            best_val  = RANK_VALUE[best["rank"]]
            card_val  = RANK_VALUE[card["rank"]]
            if card_val > best_val:
                best = card
            elif card_val == best_val:
                # identical card → first played wins
                if card["play_order"] < best["play_order"]:
                    best = card

    return trick_cards.index(best)


def calculate_round_scores(players_data: list[dict]) -> list[int]:
    """
    players_data: list of {bid, tricks_won}
    Returns list of score deltas (one per player).

    Bid met or exceeded : 10*bid + overtricks
    Bid failed          : -10 * (bid - tricks_won)
    Edge: bid=0 and tricks_won=0 → +10 bonus
    """
    deltas = []
    for p in players_data:
        bid        = p["bid"]
        tricks_won = p["tricks_won"]
        if bid == 0 and tricks_won == 0:
            deltas.append(10)
        elif tricks_won >= bid:
            overtricks = tricks_won - bid
            deltas.append(10 * bid + overtricks)
        else:
            shortfall = bid - tricks_won
            deltas.append(-10 * shortfall)
    return deltas
