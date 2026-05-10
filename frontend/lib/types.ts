export type Suit = "spades" | "hearts" | "diamonds" | "clubs";

export interface Card {
  suit: Suit;
  rank: string;
  deck_id: number;
  hidden?: boolean;
}

export interface PlayerState {
  seat: number;
  username: string;
  bid: number;
  tricks_won: number;
  total_score: number;
  hand_count: number;
  hand: Card[];
  is_connected: boolean;
}

export interface TrickCard {
  suit: Suit;
  rank: string;
  deck_id: number;
  player_seat: number;
  player_name: string;
  play_order: number;
}

export type GameStatus = "waiting" | "bidding" | "playing" | "finished";

export interface GameState {
  type: "state";
  game_code: string;
  host_username: string;
  status: GameStatus;
  current_round: number;
  max_rounds: number;
  trump_suit: Suit | "";
  current_player_index: number;
  lead_player_index: number;
  num_decks: number;
  players: PlayerState[];
  current_trick: TrickCard[];
}

export interface RoundScore {
  username: string;
  bid: number;
  tricks_won: number;
  delta: number;
}
