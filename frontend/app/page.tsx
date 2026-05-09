"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const SUITS = ["♠", "♥", "♦", "♣"];

export default function Home() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [hint, setHint] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("os_username");
    if (saved) router.push("/lobby");
  }, [router]);

  function enter(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) { setHint(true); return; }
    localStorage.setItem("os_username", trimmed);
    router.push("/lobby");
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{ background: "radial-gradient(ellipse at center,#1a4731 0%,#0d2b1e 60%,#091a12 100%)" }}
    >
      {/* Floating suit decorations */}
      {SUITS.map((s, i) => (
        <motion.span
          key={s}
          className="absolute text-6xl select-none pointer-events-none opacity-10"
          style={{ left: `${10 + i * 25}%`, top: `${15 + (i % 2) * 55}%` }}
          animate={{ y: [0, -12, 0] }}
          transition={{ repeat: Infinity, duration: 3 + i * 0.7, ease: "easeInOut" }}
        >
          {s}
        </motion.span>
      ))}

      <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center mb-10 relative z-10">
        <h1 className="text-6xl font-extrabold text-yellow-400 tracking-tight drop-shadow-2xl">
          ♠ OpenSpades
        </h1>
        <p className="text-gray-400 mt-2 text-lg">Judgment · for the batch</p>
      </motion.div>

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-gray-900/80 backdrop-blur border border-white/10 rounded-2xl p-8 w-full max-w-sm shadow-2xl relative z-10"
      >
        <p className="text-gray-300 text-center mb-6 text-sm">What should we call you tonight?</p>
        <form onSubmit={enter} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Your name (e.g. Arch)"
            value={name}
            onChange={(e) => { setName(e.target.value); setHint(false); }}
            maxLength={20}
            autoFocus
            className="bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white text-center text-xl placeholder-gray-600 focus:outline-none focus:border-yellow-400 transition-colors"
          />
          {hint && <p className="text-red-400 text-xs text-center">Enter a name first!</p>}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            type="submit"
            className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-extrabold py-3 rounded-xl text-lg transition-all shadow-lg shadow-yellow-400/20"
          >
            Let's Play →
          </motion.button>
        </form>
      </motion.div>

      <p className="text-gray-700 text-xs mt-8 relative z-10">Only for the batch 🃏</p>
    </div>
  );
}
