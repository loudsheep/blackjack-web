import Link from "next/link";
import { useState } from "react";

interface LobbyProps {
    roomId: string;
    onJoin: (username: string) => void;
    connectionError?: { title: string; msg: string } | null;
}

export function Lobby({ roomId, onJoin, connectionError }: LobbyProps) {
    const [username, setUsername] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (username.trim()) {
            onJoin(username.trim());
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-green-900 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-green-800 to-black p-4">
            
            <div className="relative w-full max-w-md">
                {/* Decorative Cards Background */}
                <div className="absolute -top-20 -left-20 w-40 h-56 bg-white rounded-xl rotate-[-15deg] opacity-10 pointer-events-none"></div>
                <div className="absolute -bottom-20 -right-20 w-40 h-56 bg-black rounded-xl rotate-[15deg] opacity-20 pointer-events-none"></div>

                <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl p-8 relative z-10 animate-fade-in-up">
                    <div className="text-center mb-8">
                        <div className="text-6xl mb-4 drop-shadow-lg">♠️</div>
                        <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Join Table</h2>
                        <div className="inline-block bg-black/30 px-3 py-1 rounded text-yellow-500 font-mono text-sm border border-yellow-500/20">
                            Room: {roomId}
                        </div>
                    </div>

                    {connectionError ? (
                        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6 text-center animate-shake">
                            <h3 className="font-bold text-red-200 mb-1">{connectionError.title}</h3>
                            <p className="text-red-100/70 text-sm">{connectionError.msg}</p>
                            <Link href="/" className="inline-block mt-4 text-xs underline text-red-300 hover:text-white">
                                Return Home
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-green-200 text-xs font-bold uppercase tracking-widest mb-2 ml-1">
                                    Your Name
                                </label>
                                <input 
                                    autoFocus
                                    className="
                                        w-full bg-black/40 border border-green-500/30 rounded-xl px-4 py-3 text-lg text-white 
                                        focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all
                                        placeholder-green-600/50
                                    "
                                    placeholder="e.g. Maverick"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                            </div>

                            <button 
                                type="submit"
                                disabled={!username.trim()}
                                className="
                                    w-full bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400
                                    text-black font-black text-xl py-4 rounded-xl shadow-lg border-t border-yellow-300/50
                                    transform transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer
                                "
                            >
                                SIT DOWN
                            </button>
                        </form>
                    )}
                    
                    <div className="mt-6 text-center">
                        <Link href="/" className="text-white/40 hover:text-white text-sm transition-colors">
                            ← Back to Menu
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
