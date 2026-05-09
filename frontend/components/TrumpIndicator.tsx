"use client";
import { motion } from "framer-motion";

const SUIT_SYMBOL: Record<string, string> = {
  spades: "♠",
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
};
const SUIT_COLOR: Record<string, string> = {
  spades: "text-gray-200",
  hearts: "text-red-400",
  diamonds: "text-red-400",
  clubs: "text-gray-200",
};

export default function TrumpIndicator({ suit }: { suit: string }) {
  if (!suit) return null;
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="flex flex-col items-center gap-1 bg-black/30 rounded-xl px-4 py-2 border border-yellow-500/40"
    >
      <span className="text-yellow-400 text-xs font-semibold uppercase tracking-widest">Trump</span>
      <span className={`text-4xl ${SUIT_COLOR[suit]}`}>{SUIT_SYMBOL[suit]}</span>
      <span className="text-gray-300 text-xs capitalize">{suit}</span>
    </motion.div>
  );
}
