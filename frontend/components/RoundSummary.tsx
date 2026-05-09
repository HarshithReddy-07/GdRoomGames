"use client";
import { motion, AnimatePresence } from "framer-motion";
import type { PlayerState } from "@/lib/types";

interface Props {
  players: PlayerState[];
  round: number;
  onClose: () => void;
}

export default function RoundSummary({ players, round, onClose }: Props) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      >
        <motion.div
          initial={{ scale: 0.8, y: 40 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.8, y: 40 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="bg-gray-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
        >
          <h2 className="text-yellow-400 text-xl font-bold text-center mb-1">Round {round} Over!</h2>
          <p className="text-gray-400 text-sm text-center mb-5">Here's how everyone did</p>
          <table className="w-full text-sm mb-6">
            <thead>
              <tr className="text-gray-500 text-xs border-b border-white/10">
                <th className="text-left pb-2">Player</th>
                <th className="pb-2">Bid</th>
                <th className="pb-2">Won</th>
                <th className="text-right pb-2">±</th>
              </tr>
            </thead>
            <tbody>
              {players.map((p) => {
                const diff = p.bid >= 0
                  ? (p.tricks_won >= p.bid
                    ? 10 * p.bid + (p.tricks_won - p.bid)
                    : -10 * (p.bid - p.tricks_won))
                  : 0;
                return (
                  <tr key={p.seat} className="border-t border-white/5">
                    <td className="py-1.5 text-white font-medium">{p.username}</td>
                    <td className="py-1.5 text-center text-gray-300">{p.bid}</td>
                    <td className="py-1.5 text-center text-gray-300">{p.tricks_won}</td>
                    <td className={`py-1.5 text-right font-bold ${diff >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {diff > 0 ? `+${diff}` : diff}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <button
            onClick={onClose}
            className="w-full bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold py-2.5 rounded-full transition-all"
          >
            Continue
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
