"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Card from "./Card";
import Scoreboard from "./Scoreboard";
import TrumpIndicator from "./TrumpIndicator";
import BidPanel from "./BidPanel";
import RoundSummary from "./RoundSummary";
import VoiceChat from "./VoiceChat";
import type { GameState, Card as CardType } from "@/lib/types";

interface Props {
  state: GameState;
  username: string;
  gameCode: string;
  onStartGame: () => void;
  onBid: (bid: number) => void;
  onPlayCard: (card: CardType) => void;
}

export default function GameBoard({ state, username, gameCode, onStartGame, onBid, onPlayCard }: Props) {
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [prevRound, setPrevRound] = useState(state.current_round);

  const me = state.players.find((p) => p.username === username);
  const myTurn = me !== undefined && state.players[state.current_player_index]?.username === username;
  const isHost = state.players[0]?.username === username;

  // Show round summary when round changes (a trick is done)
  useEffect(() => {
    if (state.current_round > prevRound && state.status === "bidding") {
      setShowSummary(true);
    }
    setPrevRound(state.current_round);
  }, [state.current_round, state.status]);

  const cardKey = (c: CardType) => `${c.suit}-${c.rank}-${c.deck_id}`;

  const handleCardClick = (card: CardType) => {
    if (!myTurn || state.status !== "playing") return;
    const key = cardKey(card);
    if (selectedCard === key) {
      onPlayCard(card);
      setSelectedCard(null);
    } else {
      setSelectedCard(key);
    }
  };

  // Sort hand: by suit then rank value
  const SUIT_ORDER: Record<string, number> = { spades: 0, hearts: 1, diamonds: 2, clubs: 3 };
  const RANK_VAL: Record<string, number> = { "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9, "10": 10, J: 11, Q: 12, K: 13, A: 14 };
  const sortedHand = [...(me?.hand ?? [])].sort(
    (a, b) => SUIT_ORDER[a.suit] - SUIT_ORDER[b.suit] || RANK_VAL[a.rank] - RANK_VAL[b.rank]
  );

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: "radial-gradient(ellipse at center, #1a4731 0%, #0d2b1e 60%, #091a12 100%)",
      }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/30 border-b border-white/5">
        <div className="flex items-center gap-3">
          <span className="text-yellow-400 font-bold text-lg tracking-wide">OpenSpades</span>
          <span className="bg-black/40 text-gray-300 text-xs px-2 py-0.5 rounded font-mono border border-white/10">
            {gameCode}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {state.status !== "waiting" && state.status !== "finished" && (
            <span className="text-gray-300 text-sm">
              Round <span className="text-yellow-400 font-bold">{state.current_round}</span>
              <span className="text-gray-500"> / {state.max_rounds}</span>
            </span>
          )}
          <span className="text-gray-400 text-sm">👤 {username}</span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col gap-3 w-56 p-3 bg-black/20 border-r border-white/5 shrink-0">
          <Scoreboard players={state.players} currentPlayerIndex={state.current_player_index} />
          {state.trump_suit && <TrumpIndicator suit={state.trump_suit} />}
          <VoiceChat gameCode={gameCode} username={username} />
        </aside>

        {/* Main table area */}
        <main className="flex-1 flex flex-col items-center justify-between p-4 overflow-y-auto">
          {/* Other players around the table */}
          <OtherPlayers
            players={state.players}
            myUsername={username}
            currentPlayerIndex={state.current_player_index}
          />

          {/* Center trick area */}
          <div className="flex-1 flex flex-col items-center justify-center gap-6 my-4">
            <TrickArea cards={state.current_trick} />

            {/* Waiting/Start */}
            {state.status === "waiting" && isHost && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                onClick={onStartGame}
                className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold px-10 py-3 rounded-full text-lg shadow-xl shadow-yellow-400/20 transition-all"
              >
                Start Game
              </motion.button>
            )}
            {state.status === "waiting" && !isHost && (
              <p className="text-gray-400 animate-pulse">Waiting for host to start…</p>
            )}

            {/* Bidding */}
            {state.status === "bidding" && myTurn && (
              <BidPanel maxBid={state.current_round} onBid={onBid} />
            )}
            {state.status === "bidding" && !myTurn && (
              <p className="text-gray-400 text-sm animate-pulse">
                {state.players[state.current_player_index]?.username} is bidding…
              </p>
            )}

            {/* Playing turn indicator */}
            {state.status === "playing" && myTurn && !selectedCard && (
              <motion.p
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="text-yellow-300 text-sm font-semibold"
              >
                Your turn — tap a card to select, tap again to play
              </motion.p>
            )}
            {state.status === "playing" && myTurn && selectedCard && (
              <p className="text-yellow-400 text-sm font-semibold">Tap the card again to play it</p>
            )}
            {state.status === "playing" && !myTurn && (
              <p className="text-gray-500 text-sm">
                Waiting for {state.players[state.current_player_index]?.username}…
              </p>
            )}

            {/* Game over */}
            {state.status === "finished" && (
              <GameOverBanner players={state.players} />
            )}
          </div>

          {/* Mobile trump + voice */}
          <div className="flex md:hidden gap-3 mb-3 w-full max-w-sm">
            {state.trump_suit && <TrumpIndicator suit={state.trump_suit} />}
            <div className="flex-1">
              <VoiceChat gameCode={gameCode} username={username} />
            </div>
          </div>

          {/* My hand */}
          {me && (
            <div className="w-full max-w-2xl">
              <p className="text-gray-500 text-xs mb-2 text-center">
                Your hand ({me.hand.filter((c) => !c.hidden).length} cards)
                {me.bid >= 0 && (
                  <span className="ml-2 text-yellow-400">· Bid: {me.bid} · Won: {me.tricks_won}</span>
                )}
              </p>
              <div className="flex flex-wrap justify-center gap-1.5">
                {sortedHand.map((card) => (
                  <Card
                    key={cardKey(card)}
                    card={card}
                    selected={selectedCard === cardKey(card)}
                    onClick={
                      state.status === "playing" && myTurn && !card.hidden
                        ? () => handleCardClick(card)
                        : undefined
                    }
                  />
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Mobile scoreboard bottom sheet */}
      <div className="md:hidden border-t border-white/5 bg-black/40 px-3 py-2 overflow-x-auto">
        <div className="flex gap-4 text-xs whitespace-nowrap">
          {[...state.players]
            .sort((a, b) => b.total_score - a.total_score)
            .map((p) => (
              <div key={p.seat} className="flex flex-col items-center">
                <span className={`font-semibold ${p.username === username ? "text-yellow-400" : "text-gray-300"}`}>
                  {p.username}
                </span>
                <span className={p.total_score >= 0 ? "text-emerald-400" : "text-red-400"}>
                  {p.total_score}
                </span>
              </div>
            ))}
        </div>
      </div>

      {showSummary && (
        <RoundSummary
          players={state.players}
          round={prevRound}
          onClose={() => setShowSummary(false)}
        />
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function OtherPlayers({
  players,
  myUsername,
  currentPlayerIndex,
}: {
  players: GameState["players"];
  myUsername: string;
  currentPlayerIndex: number;
}) {
  const others = players.filter((p) => p.username !== myUsername);
  return (
    <div className="flex flex-wrap justify-center gap-4 w-full max-w-2xl">
      {others.map((p, i) => {
        const isActive = players[currentPlayerIndex]?.username === p.username;
        return (
          <motion.div
            key={p.seat}
            animate={isActive ? { boxShadow: ["0 0 0 0 rgba(234,179,8,0)", "0 0 20px 4px rgba(234,179,8,0.5)", "0 0 0 0 rgba(234,179,8,0)"] } : {}}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className={`
              flex flex-col items-center gap-1 px-3 py-2 rounded-xl border transition-all
              ${isActive ? "border-yellow-400 bg-yellow-400/5" : "border-white/10 bg-black/20"}
              ${!p.is_connected ? "opacity-50" : ""}
            `}
          >
            <div className="flex gap-0.5">
              {Array.from({ length: p.hand_count }).map((_, i) => (
                <div key={i} className="w-4 h-6 bg-emerald-800 border border-emerald-600 rounded-sm" />
              ))}
              {p.hand_count === 0 && <div className="w-8 h-6 opacity-0" />}
            </div>
            <span className={`text-xs font-semibold ${isActive ? "text-yellow-400" : "text-gray-300"}`}>
              {p.username}
            </span>
            <div className="flex gap-2 text-xs text-gray-400">
              <span>Bid: {p.bid >= 0 ? p.bid : "—"}</span>
              <span>Won: {p.tricks_won}</span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function TrickArea({ cards }: { cards: GameState["current_trick"] }) {
  if (cards.length === 0) return (
    <div className="w-64 h-36 rounded-2xl border-2 border-dashed border-white/10 flex items-center justify-center">
      <span className="text-gray-600 text-sm">Table</span>
    </div>
  );

  return (
    <div className="relative w-64 h-40 flex items-center justify-center">
      {cards.map((tc, i) => {
        const offsets = [
          { x: 0, y: 0 }, { x: -30, y: -10 }, { x: 30, y: -10 },
          { x: -20, y: 15 }, { x: 20, y: 15 }, { x: 0, y: -20 }, { x: 0, y: 20 },
        ];
        const offset = offsets[i] ?? { x: 0, y: 0 };
        return (
          <motion.div
            key={`${tc.suit}-${tc.rank}-${tc.deck_id}-${tc.play_order}`}
            initial={{ scale: 0, opacity: 0, x: 0, y: 60 }}
            animate={{ scale: 1, opacity: 1, x: offset.x, y: offset.y }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
            className="absolute"
          >
            <div className="relative">
              <Card card={{ suit: tc.suit, rank: tc.rank, deck_id: tc.deck_id }} played />
              <span className="absolute -bottom-4 left-0 right-0 text-center text-[10px] text-gray-400 whitespace-nowrap">
                {tc.player_name}
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function GameOverBanner({ players }: { players: GameState["players"] }) {
  const sorted = [...players].sort((a, b) => b.total_score - a.total_score);
  const winner = sorted[0];
  return (
    <motion.div
      initial={{ scale: 0.7, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="text-center bg-black/60 border border-yellow-500/30 rounded-2xl px-8 py-6 shadow-2xl"
    >
      <p className="text-5xl mb-2">🏆</p>
      <p className="text-yellow-400 text-2xl font-bold">{winner.username} wins!</p>
      <p className="text-gray-400 mt-1 text-sm">{winner.total_score} points</p>
      <div className="mt-4 space-y-1">
        {sorted.map((p, i) => (
          <div key={p.seat} className="flex justify-between text-sm text-gray-300">
            <span>{i + 1}. {p.username}</span>
            <span className={p.total_score >= 0 ? "text-emerald-400" : "text-red-400"}>
              {p.total_score}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
