"use client";
import { motion } from "framer-motion";
import type { Card as CardType } from "@/lib/types";

const SUIT_SYMBOL: Record<string, string> = {
  spades: "♠",
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
};

const SUIT_COLOR: Record<string, string> = {
  spades: "text-gray-900",
  hearts: "text-red-600",
  diamonds: "text-red-600",
  clubs: "text-gray-900",
};

interface Props {
  card: CardType;
  onClick?: () => void;
  selected?: boolean;
  small?: boolean;
  played?: boolean;
}

export default function Card({ card, onClick, selected = false, small = false, played = false }: Props) {
  if (card.hidden) {
    return (
      <div
        className={`
          ${small ? "w-10 h-14" : "w-16 h-24"}
          rounded-lg bg-gradient-to-br from-emerald-800 to-emerald-950
          border-2 border-emerald-600 shadow-md
          flex items-center justify-center
        `}
      >
        <span className="text-emerald-500 text-xs">🂠</span>
      </div>
    );
  }

  const symbol = SUIT_SYMBOL[card.suit] ?? card.suit;
  const color = SUIT_COLOR[card.suit] ?? "text-gray-900";

  return (
    <motion.button
      whileHover={onClick ? { y: -8, scale: 1.05 } : {}}
      whileTap={onClick ? { scale: 0.97 } : {}}
      animate={selected ? { y: -14 } : { y: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      onClick={onClick}
      disabled={!onClick}
      className={`
        relative select-none cursor-${onClick ? "pointer" : "default"}
        ${small ? "w-10 h-14 text-xs" : "w-16 h-24 text-sm"}
        ${played ? "w-14 h-20" : ""}
        rounded-lg bg-white shadow-lg
        border-2 ${selected ? "border-yellow-400 shadow-yellow-400/40 shadow-lg" : "border-gray-200"}
        flex flex-col items-start justify-between p-1
        transition-shadow
      `}
    >
      <span className={`font-bold leading-none ${color} ${small ? "text-xs" : "text-sm"}`}>
        {card.rank}
      </span>
      <span className={`text-center w-full ${color} ${small ? "text-base" : "text-2xl"}`}>
        {symbol}
      </span>
      <span className={`font-bold leading-none rotate-180 self-end ${color} ${small ? "text-xs" : "text-sm"}`}>
        {card.rank}
      </span>
    </motion.button>
  );
}
