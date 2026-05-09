"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { api } from "@/lib/api";

export default function LobbyPage() {
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [numDecks, setNumDecks] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.me()
      .then((data) => setUsername(data.username))
      .catch(() => router.push("/"));
  }, [router]);

  async function create() {
    setError("");
    setLoading(true);
    try {
      const game = await api.createGame(numDecks);
      router.push(`/game/${game.code}`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function join(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const game = await api.joinGame(joinCode.trim().toUpperCase());
      router.push(`/game/${game.code}`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    await api.logout().catch(() => {});
    router.push("/");
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{
        background: "radial-gradient(ellipse at center, #1a4731 0%, #0d2b1e 60%, #091a12 100%)",
      }}
    >
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center mb-8"
      >
        <h1 className="text-4xl font-extrabold text-yellow-400">♠ OpenSpades</h1>
        {username && (
          <p className="text-gray-400 mt-1">
            Welcome back, <span className="text-white font-semibold">{username}</span>
          </p>
        )}
      </motion.div>

      <div className="grid gap-4 w-full max-w-sm">
        {/* Create */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-900/80 border border-white/10 rounded-2xl p-6 shadow-xl"
        >
          <h2 className="text-white font-bold text-lg mb-4">Create a Game</h2>
          <div className="flex gap-2 mb-4">
            {[1, 2].map((d) => (
              <button
                key={d}
                onClick={() => setNumDecks(d)}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all border ${
                  numDecks === d
                    ? "bg-yellow-400 text-gray-900 border-yellow-400"
                    : "bg-black/30 text-gray-400 border-white/10 hover:text-white"
                }`}
              >
                {d} Deck{d > 1 ? "s" : ""}
              </button>
            ))}
          </div>
          <button
            onClick={create}
            disabled={loading}
            className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:opacity-60 text-gray-900 font-bold py-3 rounded-xl transition-all"
          >
            {loading ? "Creating…" : "Create Room →"}
          </button>
        </motion.div>

        {/* Join */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-gray-900/80 border border-white/10 rounded-2xl p-6 shadow-xl"
        >
          <h2 className="text-white font-bold text-lg mb-4">Join a Game</h2>
          <form onSubmit={join} className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="Enter room code (e.g. ABCDEF)"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={6}
              required
              className="bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400 uppercase tracking-widest font-mono transition-colors"
            />
            <button
              type="submit"
              disabled={loading || joinCode.length !== 6}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all"
            >
              {loading ? "Joining…" : "Join Room →"}
            </button>
          </form>
        </motion.div>

        {error && (
          <p className="text-red-400 text-sm text-center">{error}</p>
        )}

        <button onClick={logout} className="text-gray-600 hover:text-gray-400 text-sm transition-colors">
          Sign out
        </button>
      </div>
    </div>
  );
}
