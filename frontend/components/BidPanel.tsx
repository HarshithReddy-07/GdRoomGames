"use client";
import { useState } from "react";
import { motion } from "framer-motion";

interface Props {
  maxBid: number;
  onBid: (bid: number) => void;
}

export default function BidPanel({ maxBid, onBid }: Props) {
  const [selected, setSelected] = useState<number | null>(null);

  const bids = Array.from({ length: maxBid + 1 }, (_, i) => i);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-black/50 border border-yellow-500/30 rounded-2xl p-5 shadow-2xl text-center"
    >
      <p className="text-yellow-400 font-semibold mb-4 text-lg">Place Your Bid</p>
      <div className="flex flex-wrap gap-2 justify-center mb-5">
        {bids.map((b) => (
          <button
            key={b}
            onClick={() => setSelected(b)}
            className={`
              w-10 h-10 rounded-full font-bold text-sm transition-all
              ${selected === b
                ? "bg-yellow-400 text-gray-900 scale-110 shadow-lg shadow-yellow-400/30"
                : "bg-white/10 text-white hover:bg-white/20"
              }
            `}
          >
            {b}
          </button>
        ))}
      </div>
      <button
        disabled={selected === null}
        onClick={() => selected !== null && onBid(selected)}
        className="bg-yellow-400 hover:bg-yellow-300 disabled:opacity-40 disabled:cursor-not-allowed text-gray-900 font-bold px-8 py-2 rounded-full transition-all"
      >
        Confirm Bid
      </button>
    </motion.div>
  );
}
