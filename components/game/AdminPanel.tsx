import { GameSettings, Player } from "@/app/types";
import { useState, useEffect } from "react";

interface AdminPanelProps {
    isOpen: boolean;
    onClose: () => void;
    settings: GameSettings;
    players: Player[];
    onUpdateSettings: (settings: GameSettings) => void;
    onStartGame: () => void;
    onNextRound: () => void;
    onKick: (id: string) => void;
    onUpdateBalance: (id: string, amount: number) => void;
    onApprove: (id: string) => void;
}

export function AdminPanel({ 
    isOpen, onClose, settings, players, 
    onUpdateSettings, onStartGame, onNextRound, onKick, onUpdateBalance, onApprove 
}: AdminPanelProps) {
    
    const [localSettings, setLocalSettings] = useState<GameSettings>(settings);

    useEffect(() => {
        setLocalSettings(settings); // Sync when parent updates
    }, [settings]);

    if (!isOpen) return null;

    const pendingPlayers = players.filter(p => p.status === 'PendingApproval');
    const activePlayers = players.filter(p => p.status !== 'PendingApproval');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur p-4 animate-fade-in">
            <div className="bg-gray-800 p-6 rounded-2xl w-full max-w-lg border border-gray-700 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-2">
                    <h2 className="text-xl font-bold text-yellow-500">Admin Control Information</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-xl cursor-pointer">✕</button>
                </div>
                
                <div className="space-y-6">
                    {/* Game Flow Actions */}
                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={onStartGame} className="bg-green-700 hover:bg-green-600 py-2 rounded-lg font-bold text-white text-sm shadow">
                            Force Start Game
                        </button>
                        <button onClick={onNextRound} className="bg-blue-700 hover:bg-blue-600 py-2 rounded-lg font-bold text-white text-sm shadow">
                            Force Next Round
                        </button>
                    </div>

                    {/* Pending Approvals */}
                    {pendingPlayers.length > 0 && (
                        <div className="bg-yellow-900/20 border border-yellow-600/30 p-4 rounded-lg">
                             <h3 className="text-sm font-bold text-yellow-500 mb-2 uppercase tracking-wider">Pending Requests</h3>
                             {pendingPlayers.map(p => (
                                 <div key={p.id} className="flex justify-between items-center bg-black/30 p-2 rounded mb-1">
                                     <span className="text-sm text-white">{p.name}</span>
                                     <div className="flex gap-2">
                                          <button onClick={() => onApprove(p.id)} className="text-xs bg-green-600 px-2 py-1 rounded text-white font-bold">Approve</button>
                                          <button onClick={() => onKick(p.id)} className="text-xs bg-red-600 px-2 py-1 rounded text-white font-bold">Deny</button>
                                     </div>
                                 </div>
                             ))}
                        </div>
                    )}

                    {/* Game Settings Form */}
                    <div className="bg-black/20 p-4 rounded-lg border border-white/5">
                        <h3 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">Game Rules</h3>
                        <div className="space-y-3 text-sm">
                            <div>
                                <label className="block text-gray-500 text-xs mb-1">Initial Chips</label>
                                <input 
                                    type="number" 
                                    className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white"
                                    value={localSettings.initial_chips}
                                    onChange={(e) => setLocalSettings({...localSettings, initial_chips: parseInt(e.target.value)})}
                                />
                            </div>
                            <div>
                                <label className="block text-gray-500 text-xs mb-1">Max Players</label>
                                <input 
                                    type="number" 
                                    className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white"
                                    value={localSettings.max_players}
                                    onChange={(e) => setLocalSettings({...localSettings, max_players: parseInt(e.target.value)})}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="checkbox" 
                                    id="chk_approval"
                                    checked={localSettings.approval_required}
                                    onChange={(e) => setLocalSettings({...localSettings, approval_required: e.target.checked})}
                                />
                                <label htmlFor="chk_approval" className="text-gray-300">Approval Required</label>
                            </div>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="checkbox" 
                                    id="chk_chat"
                                    checked={localSettings.chat_enabled}
                                    onChange={(e) => setLocalSettings({...localSettings, chat_enabled: e.target.checked})}
                                />
                                <label htmlFor="chk_chat" className="text-gray-300">Enable Chat</label>
                            </div>
                            <button 
                                onClick={() => onUpdateSettings(localSettings)}
                                className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-bold py-2 rounded mt-2 transition-colors shadow"
                            >
                                Update Settings
                            </button>
                        </div>
                    </div>

                    {/* Player Management */}
                    <div className="bg-black/20 p-4 rounded-lg border border-white/5">
                        <h3 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">Player Management</h3>
                        {activePlayers.map(p => (
                            <div key={p.id} className="flex justify-between items-center text-sm py-2 border-b border-gray-700 last:border-0 hover:bg-white/5 px-2 rounded transition-colors">
                                <span className={p.is_connected ? "text-white" : "text-gray-500"}>
                                    {p.name} {!p.is_connected && "(Offline)"}
                                </span>
                                <div className="flex gap-2">
                                    <button onClick={() => onUpdateBalance(p.id, 1000)} className="text-xs text-green-400 hover:text-green-300 bg-green-900/30 px-2 py-1 rounded border border-green-800 cursor-pointer">+1k</button>
                                    <button onClick={() => onUpdateBalance(p.id, -1000)} className="text-xs text-red-400 hover:text-red-300 bg-red-900/30 px-2 py-1 rounded border border-red-800 cursor-pointer">-1k</button>
                                    <button onClick={() => onKick(p.id)} className="text-xs text-red-200 hover:text-white bg-red-600 px-2 py-1 rounded font-bold cursor-pointer">Kick</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
