"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import type { GameState, Card, RoundScore } from "./types";

const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";

export function useGameSocket(gameCode: string, username: string) {
  const ws = useRef<WebSocket | null>(null);
  const [state, setState] = useState<GameState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [roundSummary, setRoundSummary] = useState<{ round: number; scores: RoundScore[] } | null>(null);

  useEffect(() => {
    if (!username) return;
    const url = `${WS_BASE}/ws/game/${gameCode}/?username=${encodeURIComponent(username)}`;
    const socket = new WebSocket(url);
    ws.current = socket;

    socket.onopen = () => { setConnected(true); setError(null); };
    socket.onclose = () => setConnected(false);
    socket.onerror = () => setError("Connection lost — check the server is running.");

    socket.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === "state") {
        setState(msg);
      } else if (msg.type === "error") {
        // Show briefly then clear
        setError(msg.message);
        setTimeout(() => setError(null), 3000);
      } else if (msg.type === "round_ended") {
        setRoundSummary({ round: msg.round, scores: msg.scores });
      }
    };

    return () => socket.close();
  }, [gameCode, username]);

  const send = useCallback((data: object) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(data));
    }
  }, []);

  const startGame   = useCallback(() => send({ action: "start_game" }), [send]);
  const placeBid    = useCallback((bid: number) => send({ action: "place_bid", bid }), [send]);
  const playCard    = useCallback((card: Card) => send({ action: "play_card", card }), [send]);
  const endGame     = useCallback(() => send({ action: "end_game" }), [send]);
  const clearSummary = useCallback(() => setRoundSummary(null), []);

  return { state, error, connected, roundSummary, clearSummary, startGame, placeBid, playCard, endGame };
}
