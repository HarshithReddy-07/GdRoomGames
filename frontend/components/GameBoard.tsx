"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Card from "./Card";
import Scoreboard from "./Scoreboard";
import TrumpIndicator from "./TrumpIndicator";
import BidPanel from "./BidPanel";
import RoundSummary from "./RoundSummary";
import VoiceChat from "./VoiceChat";
import type { GameState, Card as CardType, RoundScore } from "@/lib/types";

interface Props {
  state: GameState;
  username: string;
  gameCode: string;
  gameError: string | null;
  roundSummary: { round: number; scores: RoundScore[] } | null;
  onClearSummary: () => void;
  onStartGame: () => void;
  onBid: (bid: number) => void;
  onPlayCard: (card: CardType) => void;
  onEndGame: () => void;
}

export default function GameBoard({
  state,
  username,
  gameCode,
  gameError,
  roundSummary,
  onClearSummary,
  onStartGame,
  onBid,
  onPlayCard,
  onEndGame,
}: Props) {
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  const me = state.players.find((p) => p.username === username);
  const myTurn = !!me && state.players[state.current_player_index]?.username === username;
  const isHost = state.host_username === username;

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

  // Only show MY cards — filter on frontend (all hands arrive from server)
  const SUIT_ORDER: Record<string, number> = { spades: 0, hearts: 1, diamonds: 2, clubs: 3 };
  const RANK_VAL: Record<string, number> = {
    "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7,
    "8": 8, "9": 9, "10": 10, J: 11, Q: 12, K: 13, A: 14,
  };
  const myHand = (me?.hand ?? []).filter((c) => !c.hidden);
  const sortedHand = [...myHand].sort(
    (a, b) => SUIT_ORDER[a.suit] - SUIT_ORDER[b.suit] || RANK_VAL[a.rank] - RANK_VAL[b.rank]
  );

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "radial-gradient(ellipse at center, #1a4731 0%, #0d2b1e 60%, #091a12 100%)" }}
    >
      {/* ── Top bar ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-black/40 border-b border-white/5">
        <div className="flex items-center gap-3">
          <span className="text-yellow-400 font-bold text-base tracking-wide">♠ OpenSpades</span>
          <span className="bg-black/40 text-gray-400 text-xs px-2 py-0.5 rounded font-mono border border-white/10">
            {gameCode}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {state.status !== "waiting" && state.status !== "finished" && (
            <span className="text-gray-300 text-sm">
              Round <span className="text-yellow-400 font-bold">{state.current_round}</span>
              <span className="text-gray-600"> / {state.max_rounds}</span>
            </span>
          )}
          <span className="text-gray-500 text-xs">👤 {username}</span>
          {isHost && state.status !== "waiting" && state.status !== "finished" && (
            <button
              onClick={() => setShowEndConfirm(true)}
              className="text-xs text-red-400/70 hover:text-red-400 border border-red-400/20 hover:border-red-400/50 px-2 py-0.5 rounded transition-all"
            >
              End
            </button>
          )}
        </div>
      </div>

      {/* ── Error toast ───────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {gameError && (
          <motion.div
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            className="bg-red-900/80 border-b border-red-500/30 text-red-300 text-sm text-center py-2 px-4"
          >
            {gameError}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Sidebar (desktop) ─────────────────────────────────────────────── */}
        <aside className="hidden md:flex flex-col gap-3 w-56 p-3 bg-black/20 border-r border-white/5 shrink-0">
          <Scoreboard
            players={state.players}
            currentPlayerIndex={state.current_player_index}
            myUsername={username}
          />
          {state.trump_suit && <TrumpIndicator suit={state.trump_suit} />}
          <VoiceChat gameCode={gameCode} username={username} />
        </aside>

        {/* ── Main table ────────────────────────────────────────────────────── */}
        <main className="flex-1 flex flex-col items-center justify-between p-4 gap-3 overflow-y-auto">

          {/* Other players at the top */}
          <OtherPlayers
            players={state.players}
            myUsername={username}
            currentPlayerIndex={state.current_player_index}
          />

          {/* Center area */}
          <div className="flex-1 flex flex-col items-center justify-center gap-5">
            <TrickArea cards={state.current_trick} trumpSuit={state.trump_suit} />

            {/* Status messages */}
            {state.status === "waiting" && isHost && (
              <div className="flex flex-col items-center gap-3">
                <p className="text-gray-400 text-sm">
                  {state.players.length} / 7 players joined
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
                  onClick={onStartGame}
                  disabled={state.players.length < 2}
                  className="bg-yellow-400 hover:bg-yellow-300 disabled:opacity-40 disabled:cursor-not-allowed text-gray-900 font-bold px-10 py-3 rounded-full text-lg shadow-xl shadow-yellow-400/20 transition-all"
                >
                  Start Game
                </motion.button>
                {state.players.length < 2 && (
                  <p className="text-gray-600 text-xs">Waiting for at least 2 players…</p>
                )}
              </div>
            )}
            {state.status === "waiting" && !isHost && (
              <p className="text-gray-400 animate-pulse">Waiting for host to start…</p>
            )}

            {state.status === "bidding" && myTurn && (
              <BidPanel maxBid={state.current_round} onBid={onBid} />
            )}
            {state.status === "bidding" && !myTurn && (
              <p className="text-gray-400 text-sm animate-pulse">
                {state.players[state.current_player_index]?.username} is bidding…
              </p>
            )}

            {state.status === "playing" && myTurn && (
              <motion.p
                key={selectedCard ? "selected" : "pick"}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-yellow-300 text-sm font-semibold text-center"
              >
                {selectedCard
                  ? "Tap again to play ↓"
                  : "Your turn — tap a card to select"}
              </motion.p>
            )}
            {state.status === "playing" && !myTurn && (
              <p className="text-gray-500 text-sm">
                Waiting for {state.players[state.current_player_index]?.username}…
              </p>
            )}

            {state.status === "finished" && (
              <GameOverBanner players={state.players} onNewGame={() => window.location.href = "/lobby"} />
            )}
          </div>

          {/* Mobile: trump + voice row */}
          <div className="flex md:hidden gap-3 w-full max-w-sm mb-2">
            {state.trump_suit && (
              <div className="shrink-0">
                <TrumpIndicator suit={state.trump_suit} />
              </div>
            )}
            <div className="flex-1">
              <VoiceChat gameCode={gameCode} username={username} />
            </div>
          </div>

          {/* My hand */}
          {me && state.status !== "waiting" && state.status !== "finished" && (
            <div className="w-full max-w-2xl">
              <p className="text-gray-500 text-xs mb-2 text-center">
                Your hand ({myHand.length} cards)
                {me.bid >= 0 && (
                  <span className="ml-2 text-yellow-400">
                    · Bid: {me.bid} · Won: {me.tricks_won}
                  </span>
                )}
              </p>
              {/* Fan layout on mobile, wrap on desktop */}
              <div className="flex flex-wrap justify-center gap-1.5">
                {sortedHand.map((card) => (
                  <Card
                    key={cardKey(card)}
                    card={card}
                    selected={selectedCard === cardKey(card)}
                    onClick={
                      state.status === "playing" && myTurn
                        ? () => handleCardClick(card)
                        : undefined
                    }
                  />
                ))}
                {myHand.length === 0 && state.status === "playing" && (
                  <p className="text-gray-600 text-sm py-4">No cards left</p>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ── Mobile scoreboard strip ──────────────────────────────────────────── */}
      <div className="md:hidden border-t border-white/5 bg-black/50 px-3 py-2 overflow-x-auto">
        <div className="flex gap-5 text-xs whitespace-nowrap">
          {[...state.players]
            .sort((a, b) => b.total_score - a.total_score)
            .map((p) => (
              <div key={p.seat} className="flex flex-col items-center gap-0.5">
                <span
                  className={`font-semibold ${
                    p.username === username
                      ? "text-yellow-400"
                      : state.players[state.current_player_index]?.username === p.username
                      ? "text-white"
                      : "text-gray-400"
                  }`}
                >
                  {p.username}
                </span>
                <span className={p.total_score >= 0 ? "text-emerald-400" : "text-red-400"}>
                  {p.total_score > 0 ? `+${p.total_score}` : p.total_score}
                </span>
              </div>
            ))}
        </div>
      </div>

      {/* ── Round Summary overlay ─────────────────────────────────────────────── */}
      {roundSummary && (
        <RoundSummary
          round={roundSummary.round}
          scores={roundSummary.scores}
          onClose={onClearSummary}
        />
      )}

      {/* ── End game confirmation ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {showEndConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.85 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.85 }}
              className="bg-gray-900 border border-white/10 rounded-2xl p-6 max-w-xs w-full shadow-2xl text-center"
            >
              <p className="text-white font-bold text-lg mb-2">End Game?</p>
              <p className="text-gray-400 text-sm mb-6">
                This will end the game for everyone and show final scores.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowEndConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { onEndGame(); setShowEndConfirm(false); }}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold transition-all"
                >
                  End Game
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

const SUIT_SYMBOL: Record<string, string> = { spades: "♠", hearts: "♥", diamonds: "♦", clubs: "♣" };
const SUIT_COLOR: Record<string, string>  = { spades: "text-gray-200", hearts: "text-red-400", diamonds: "text-red-400", clubs: "text-gray-200" };

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
  if (!others.length) return null;

  return (
    <div className="flex flex-wrap justify-center gap-3 w-full max-w-2xl">
      {others.map((p) => {
        const isActive = players[currentPlayerIndex]?.username === p.username;
        return (
          <motion.div
            key={p.seat}
            animate={
              isActive
                ? { boxShadow: ["0 0 0 0 rgba(234,179,8,0)", "0 0 16px 3px rgba(234,179,8,0.45)", "0 0 0 0 rgba(234,179,8,0)"] }
                : {}
            }
            transition={{ repeat: Infinity, duration: 1.4 }}
            className={`
              flex flex-col items-center gap-1 px-3 py-2 rounded-xl border transition-all
              ${isActive ? "border-yellow-400/60 bg-yellow-400/5" : "border-white/10 bg-black/20"}
              ${!p.is_connected ? "opacity-40" : ""}
            `}
          >
            {/* Card backs representing hand size */}
            <div className="flex gap-0.5 min-h-[24px]">
              {Array.from({ length: Math.min(p.hand_count, 10) }).map((_, i) => (
                <div key={i} className="w-3.5 h-5 bg-emerald-800 border border-emerald-600 rounded-[2px]" />
              ))}
              {p.hand_count > 10 && (
                <span className="text-gray-500 text-xs self-center">+{p.hand_count - 10}</span>
              )}
            </div>
            <span className={`text-xs font-semibold ${isActive ? "text-yellow-300" : "text-gray-300"}`}>
              {p.username}
              {!p.is_connected && " 💤"}
            </span>
            <div className="flex gap-2 text-[11px] text-gray-500">
              <span>Bid {p.bid >= 0 ? p.bid : "—"}</span>
              <span>Won {p.tricks_won}</span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function TrickArea({ cards, trumpSuit }: { cards: GameState["current_trick"]; trumpSuit: string }) {
  if (!cards.length) {
    return (
      <div className="w-64 h-36 rounded-2xl border-2 border-dashed border-white/10 flex items-center justify-center">
        <span className="text-gray-700 text-sm">Table</span>
      </div>
    );
  }

  const offsets = [
    { x: 0, y: 0 },
    { x: -32, y: -8 }, { x: 32, y: -8 },
    { x: -22, y: 14 }, { x: 22, y: 14 },
    { x: 0, y: -22 },  { x: 0, y: 22 },
  ];

  return (
    <div className="relative w-64 h-44 flex items-center justify-center">
      {cards.map((tc, i) => {
        const offset = offsets[i] ?? { x: 0, y: 0 };
        const isTrump = tc.suit === trumpSuit;
        return (
          <motion.div
            key={`${tc.suit}-${tc.rank}-${tc.deck_id}-${tc.play_order}`}
            initial={{ scale: 0.4, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, x: offset.x, y: offset.y }}
            transition={{ type: "spring", stiffness: 340, damping: 24 }}
            className="absolute"
          >
            <div className="relative">
              {isTrump && (
                <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-yellow-400 rounded-full z-10 shadow" />
              )}
              <Card card={{ suit: tc.suit, rank: tc.rank, deck_id: tc.deck_id }} played />
              <span className="absolute -bottom-5 left-0 right-0 text-center text-[10px] text-gray-400 whitespace-nowrap">
                {tc.player_name}
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function GameOverBanner({
  players,
  onNewGame,
}: {
  players: GameState["players"];
  onNewGame: () => void;
}) {
  const sorted = [...players].sort((a, b) => b.total_score - a.total_score);
  const winner = sorted[0];
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="text-center bg-black/60 border border-yellow-500/30 rounded-2xl px-8 py-6 shadow-2xl max-w-xs w-full"
    >
      <p className="text-5xl mb-3">🏆</p>
      <p className="text-yellow-400 text-2xl font-bold">{winner.username} wins!</p>
      <p className="text-gray-500 mt-0.5 text-sm">{winner.total_score} points</p>
      <div className="mt-4 space-y-1.5 mb-6">
        {sorted.map((p, i) => (
          <div key={p.seat} className="flex justify-between text-sm text-gray-300">
            <span>{i + 1}. {p.username}</span>
            <span className={p.total_score >= 0 ? "text-emerald-400" : "text-red-400"}>
              {p.total_score > 0 ? `+${p.total_score}` : p.total_score}
            </span>
          </div>
        ))}
      </div>
      <button
        onClick={onNewGame}
        className="w-full bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold py-2.5 rounded-xl transition-all"
      >
        New Game →
      </button>
    </motion.div>
  );
}
