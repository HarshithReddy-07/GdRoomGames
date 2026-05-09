"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { api } from "@/lib/api";

type Mode = "login" | "register";

export default function Home() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // If already logged in, go to lobby
  useEffect(() => {
    api.me().then(() => router.push("/lobby")).catch(() => {});
  }, [router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "register") {
        await api.register(username, password);
      } else {
        await api.login(username, password);
      }
      router.push("/lobby");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{
        background: "radial-gradient(ellipse at center, #1a4731 0%, #0d2b1e 60%, #091a12 100%)",
      }}
    >
      {/* Logo */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center mb-10"
      >
        <h1 className="text-5xl font-extrabold text-yellow-400 tracking-tight drop-shadow-lg">
          ♠ OpenSpades
        </h1>
        <p className="text-gray-400 mt-2 text-lg">The hostel card game</p>
      </motion.div>

      {/* Card */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-gray-900/80 backdrop-blur border border-white/10 rounded-2xl p-8 w-full max-w-sm shadow-2xl"
      >
        {/* Toggle */}
        <div className="flex rounded-xl bg-black/30 p-1 mb-7">
          {(["login", "register"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(""); }}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${
                mode === m ? "bg-yellow-400 text-gray-900" : "text-gray-400 hover:text-white"
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Username"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400 transition-colors"
          />
          <input
            type="password"
            placeholder="Password"
            autoComplete={mode === "register" ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400 transition-colors"
          />

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="bg-yellow-400 hover:bg-yellow-300 disabled:opacity-60 text-gray-900 font-bold py-3 rounded-xl transition-all mt-1"
          >
            {loading ? "…" : mode === "login" ? "Let's Play →" : "Create Account →"}
          </button>
        </form>
      </motion.div>

      <p className="text-gray-600 text-xs mt-8">Only for the batch 🃏</p>
    </div>
  );
}
