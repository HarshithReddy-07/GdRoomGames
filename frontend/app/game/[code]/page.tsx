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
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("os_username");
    if (!saved) { router.push("/"); return; }
    setUsername(saved);

    // Auto-join (idempotent — server ignores if already in game)
    api.joinGame(saved, code).catch(() => {}).finally(() => setReady(true));
  }, [code, router]);

  const { state, error, connected, startGame, placeBid, playCard } =
    useGameSocket(code, username ?? "");

  if (!ready || !username) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error && !state) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 gap-4">
        <p className="text-red-400 text-center px-4">{error}</p>
        <button onClick={() => router.push("/lobby")} className="text-yellow-400 underline text-sm">
          Back to lobby
        </button>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 gap-3">
        <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-sm">{connected ? "Loading game…" : "Connecting to server…"}</p>
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
