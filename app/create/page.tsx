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
    deck_count: 1,
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
    <main className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4">
      <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl max-w-md w-full border border-gray-700">
        <h1 className="text-3xl font-bold mb-6 text-center text-green-400">Create New Table</h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded text-red-200 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Initial Chips</label>
              <input
                type="number"
                min="1"
                value={settings.initial_chips}
                onChange={e => setSettings({...settings, initial_chips: parseInt(e.target.value)})}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Deck Count</label>
              <input
                type="number"
                min="1"
                max="8"
                value={settings.deck_count}
                onChange={e => setSettings({...settings, deck_count: parseInt(e.target.value)})}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-400 mb-1">Max Players</label>
             <input
                type="number"
                min="1"
                max="20"
                value={settings.max_players}
                onChange={e => setSettings({...settings, max_players: parseInt(e.target.value)})}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none"
              />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-400">Require Approval</label>
              <input
                type="checkbox"
                checked={settings.approval_required}
                onChange={e => setSettings({...settings, approval_required: e.target.checked})}
                className="w-5 h-5 accent-green-500"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-400">Enable Chat</label>
              <input
                type="checkbox"
                checked={settings.chat_enabled}
                onChange={e => setSettings({...settings, chat_enabled: e.target.checked})}
                className="w-5 h-5 accent-green-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-green-600 hover:bg-green-500 rounded-lg font-bold text-lg shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating..." : "Create Table"}
          </button>
        </form>
      </div>
    </main>
  );
}
