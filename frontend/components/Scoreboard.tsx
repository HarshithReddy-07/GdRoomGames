"use client";
import type { PlayerState } from "@/lib/types";

interface Props {
  players: PlayerState[];
  currentPlayerIndex: number;
  myUsername: string;
}

export default function Scoreboard({ players, currentPlayerIndex, myUsername }: Props) {
  const sorted = [...players].sort((a, b) => b.total_score - a.total_score);
  const activeUsername = players[currentPlayerIndex]?.username;

  return (
    <div className="bg-black/40 rounded-xl border border-white/10 overflow-hidden">
      <div className="px-3 py-2 bg-black/30 border-b border-white/10">
        <span className="text-yellow-400 font-semibold text-xs uppercase tracking-widest">Scoreboard</span>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-600 text-xs">
            <th className="text-left px-3 py-1">Player</th>
            <th className="px-2 py-1 text-center">Bid</th>
            <th className="px-2 py-1 text-center">Won</th>
            <th className="px-2 py-1 text-right">Pts</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((p) => {
            const isActive = p.username === activeUsername;
            const isMe = p.username === myUsername;
            return (
              <tr
                key={p.seat}
                className={`border-t border-white/5 transition-colors ${
                  isActive ? "bg-yellow-400/8" : ""
                }`}
              >
                <td className="px-3 py-1.5">
                  <div className="flex items-center gap-1.5">
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse shrink-0" />
                    )}
                    <span
                      className={`font-medium truncate max-w-[80px] ${
                        isMe ? "text-yellow-300" : p.is_connected ? "text-white" : "text-gray-600"
                      }`}
                      title={p.username}
                    >
                      {p.username}
                    </span>
                    {isMe && <span className="text-gray-600 text-[10px]">(you)</span>}
                  </div>
                </td>
                <td className="px-2 py-1.5 text-center text-gray-400 text-xs">
                  {p.bid >= 0 ? p.bid : "—"}
                </td>
                <td className="px-2 py-1.5 text-center text-gray-400 text-xs">{p.tricks_won}</td>
                <td
                  className={`px-3 py-1.5 text-right font-bold text-sm ${
                    p.total_score > 0
                      ? "text-emerald-400"
                      : p.total_score < 0
                      ? "text-red-400"
                      : "text-gray-400"
                  }`}
                >
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
