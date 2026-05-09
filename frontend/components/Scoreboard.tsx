"use client";
import type { PlayerState } from "@/lib/types";

interface Props {
  players: PlayerState[];
  currentPlayerIndex: number;
}

export default function Scoreboard({ players, currentPlayerIndex }: Props) {
  const sorted = [...players].sort((a, b) => b.total_score - a.total_score);

  return (
    <div className="bg-black/40 rounded-xl border border-white/10 overflow-hidden">
      <div className="px-3 py-2 bg-black/30 border-b border-white/10">
        <span className="text-yellow-400 font-semibold text-sm uppercase tracking-widest">Scoreboard</span>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-400 text-xs">
            <th className="text-left px-3 py-1">Player</th>
            <th className="px-2 py-1">Bid</th>
            <th className="px-2 py-1">Won</th>
            <th className="px-2 py-1 text-right">Score</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((p) => {
            const isActive = players[currentPlayerIndex]?.username === p.username;
            return (
              <tr
                key={p.seat}
                className={`border-t border-white/5 transition-colors ${
                  isActive ? "bg-yellow-500/10" : ""
                }`}
              >
                <td className="px-3 py-1.5 flex items-center gap-2">
                  {isActive && (
                    <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse inline-block" />
                  )}
                  <span className={`${p.is_connected ? "text-white" : "text-gray-500"} font-medium`}>
                    {p.username}
                  </span>
                  {!p.is_connected && <span className="text-gray-600 text-xs">(away)</span>}
                </td>
                <td className="px-2 py-1.5 text-center text-gray-300">
                  {p.bid >= 0 ? p.bid : "—"}
                </td>
                <td className="px-2 py-1.5 text-center text-gray-300">{p.tricks_won}</td>
                <td className={`px-3 py-1.5 text-right font-bold ${
                  p.total_score >= 0 ? "text-emerald-400" : "text-red-400"
                }`}>
                  {p.total_score > 0 ? `+${p.total_score}` : p.total_score}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
