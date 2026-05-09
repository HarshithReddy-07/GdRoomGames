"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { api } from "@/lib/api";
import { useGameSocket } from "@/lib/useGameSocket";
import GameBoard from "@/components/GameBoard";

export default function GamePage() {
  const router = useRouter();
  const params = useParams();
  const code = (params?.code as string ?? "").toUpperCase();

  const [username, setUsername] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Auth check + auto-join
  useEffect(() => {
    api.me()
      .then(async (me) => {
        setUsername(me.username);
        // Auto-join the game if not already in it
        try {
          await api.joinGame(code);
        } catch {
          // Already in game or game started — that's fine
        }
        setAuthChecked(true);
      })
      .catch(() => router.push("/"));
  }, [code, router]);

  const { state, error, connected, startGame, placeBid, playCard } = useGameSocket(code);

  if (!authChecked || !username) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-gray-400 animate-pulse">Loading…</div>
      </div>
    );
  }

  if (error && !state) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 gap-4">
        <p className="text-red-400">{error}</p>
        <button onClick={() => router.push("/lobby")} className="text-yellow-400 underline">
          Back to lobby
        </button>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">{connected ? "Loading game…" : "Connecting…"}</p>
        </div>
      </div>
    );
  }

  return (
    <GameBoard
      state={state}
      username={username}
      gameCode={code}
      onStartGame={startGame}
      onBid={placeBid}
      onPlayCard={playCard}
    />
  );
}
