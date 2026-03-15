"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateGame() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [settings, setSettings] = useState({
    initial_chips: 200,
    max_players: 10,
    deck_count: 4,
    approval_required: false,
    chat_enabled: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3000";
      const res = await fetch(`${baseUrl}/game/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!res.ok) {
        throw new Error(`Failed to create game: ${res.statusText}`);
      }

      const data = await res.json();
      if (data.game_id) {
        router.push(`/game/${data.game_id}`);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mt-12 sm:mt-16">
      <div className="glass-panel p-8 sm:p-10 rounded-3xl shadow-2xl w-full border border-white/10 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-primary/10 blur-[80px] pointer-events-none rounded-full" />
        
        <div className="flex items-center justify-center gap-3 mb-8 relative z-10">
            <span className="material-symbols-outlined text-primary text-4xl">add_circle</span>
            <h1 className="text-3xl font-black text-center text-white italic uppercase tracking-wider">Create Table</h1>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-200 text-sm font-medium flex items-center gap-2 relative z-10">
            <span className="material-symbols-outlined text-red-400">error</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/50 uppercase tracking-widest flex items-center gap-1">
                 <span className="material-symbols-outlined text-[16px]">monetization_on</span> Chips
              </label>
              <input
                type="number"
                min="1"
                value={settings.initial_chips}
                onChange={e => setSettings({...settings, initial_chips: parseInt(e.target.value)})}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary/50 focus:border-primary focus:outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/50 uppercase tracking-widest flex items-center gap-1">
                 <span className="material-symbols-outlined text-[16px]">layers</span> Decks
              </label>
              <input
                type="number"
                min="1"
                max="8"
                value={settings.deck_count}
                onChange={e => setSettings({...settings, deck_count: parseInt(e.target.value)})}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary/50 focus:border-primary focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
             <label className="text-xs font-bold text-white/50 uppercase tracking-widest flex items-center gap-1">
                 <span className="material-symbols-outlined text-[16px]">group</span> Max Players
              </label>
             <input
                type="number"
                min="1"
                max="20"
                value={settings.max_players}
                onChange={e => setSettings({...settings, max_players: parseInt(e.target.value)})}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary/50 focus:border-primary focus:outline-none transition-all"
              />
          </div>

          <div className="space-y-3 bg-black/20 p-4 rounded-xl border border-white/5">
            <label className="flex items-center justify-between cursor-pointer group">
              <span className="text-sm font-medium text-white/70 group-hover:text-white transition-colors">Require Approval</span>
              <input
                type="checkbox"
                checked={settings.approval_required}
                onChange={e => setSettings({...settings, approval_required: e.target.checked})}
                className="w-5 h-5 rounded border-white/20 bg-black/40 cursor-pointer accent-[#0df280]"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer group">
              <span className="text-sm font-medium text-white/70 group-hover:text-white transition-colors">Enable Chat</span>
              <input
                type="checkbox"
                checked={settings.chat_enabled}
                onChange={e => setSettings({...settings, chat_enabled: e.target.checked})}
                className="w-5 h-5 rounded border-white/20 bg-black/40 cursor-pointer accent-[#0df280]"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 mt-4 bg-primary text-background-dark rounded-xl font-black text-lg uppercase tracking-widest shadow-[0_0_20px_rgba(13,242,128,0.3)] hover:shadow-[0_0_30px_rgba(13,242,128,0.5)] hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
          >
            {loading ? (
                <span className="material-symbols-outlined animate-spin">refresh</span>
            ) : "Create Room"}
          </button>
        </form>
      </div>
    </div>
  );
}
