"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function JoinGame() {
  const router = useRouter();
  const [roomId, setRoomId] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomId.trim()) {
      router.push(`/game/${roomId.trim()}`);
    }
  };

  return (
    <div className="w-full max-w-sm mt-12 sm:mt-24">
      <div className="glass-panel p-8 sm:p-10 rounded-3xl shadow-2xl w-full border border-white/10 relative overflow-hidden text-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-blue-500/10 blur-[80px] pointer-events-none rounded-full" />
        
        <div className="flex items-center justify-center gap-3 mb-8 relative z-10">
            <span className="material-symbols-outlined text-blue-400 text-4xl">login</span>
            <h1 className="text-3xl font-black text-white italic uppercase tracking-wider">Join Table</h1>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          <div className="space-y-2 text-left">
             <label className="text-xs font-bold text-white/50 uppercase tracking-widest flex items-center gap-1">
                 <span className="material-symbols-outlined text-[16px]">confirmation_number</span> Room ID
              </label>
              <input
                type="text"
                placeholder="Enter 6-digit code..."
                value={roomId}
                onChange={e => setRoomId(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-xl font-mono text-center text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:outline-none transition-all placeholder:text-white/20"
                autoFocus
                maxLength={6}
              />
          </div>
          <button
            type="submit"
            disabled={!roomId.trim()}
            className="w-full py-4 mt-2 bg-blue-600 text-white rounded-xl font-black text-lg uppercase tracking-widest shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] hover:bg-blue-500 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
          >
            Enter Game
          </button>
        </form>
      </div>
    </div>
  );
}
