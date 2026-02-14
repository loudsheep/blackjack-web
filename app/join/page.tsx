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
    <main className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4">
      <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl max-w-sm w-full border border-gray-700 text-center">
        <h1 className="text-3xl font-bold mb-6 text-green-400">Join Table</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            type="text"
            placeholder="Enter Room ID"
            value={roomId}
            onChange={e => setRoomId(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-3 text-lg font-mono text-center focus:ring-2 focus:ring-green-500 focus:outline-none"
            autoFocus
          />
          <button
            type="submit"
            disabled={!roomId.trim()}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold text-lg shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Enter Game
          </button>
        </form>
      </div>
    </main>
  );
}
