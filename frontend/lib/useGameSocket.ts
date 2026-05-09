"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import type { GameState, Card } from "./types";

const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";

export function useGameSocket(gameCode: string) {
  const ws = useRef<WebSocket | null>(null);
  const [state, setState] = useState<GameState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = new WebSocket(`${WS_BASE}/ws/game/${gameCode}/`);
    ws.current = socket;

    socket.onopen = () => setConnected(true);
    socket.onclose = () => setConnected(false);
    socket.onerror = () => setError("Connection error");
    socket.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === "state") setState(msg);
      else if (msg.type === "error") setError(msg.message);
    };

    return () => socket.close();
  }, [gameCode]);

  const send = useCallback((data: object) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(data));
    }
  }, []);

  const startGame = useCallback(() => send({ action: "start_game" }), [send]);
  const placeBid = useCallback((bid: number) => send({ action: "place_bid", bid }), [send]);
  const playCard = useCallback((card: Card) => send({ action: "play_card", card }), [send]);

  return { state, error, connected, startGame, placeBid, playCard };
}
