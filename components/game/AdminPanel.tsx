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
    const [adminAmount, setAdminAmount] = useState<number>(100);
    const [saveFeedback, setSaveFeedback] = useState("");

    useEffect(() => {
        setLocalSettings(settings); // Sync when parent updates
    }, [settings]);

    const handleSave = () => {
        onUpdateSettings(localSettings);
        setSaveFeedback("Saved!");
        setTimeout(() => setSaveFeedback(""), 2000);
    };

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity cursor-pointer"
                    onClick={onClose}
                />
            )}

            {/* Slide-over Panel */}
            <div className={`
                fixed right-0 top-0 h-full w-80 glass-panel border-l border-primary/20 
                transform transition-transform duration-500 z-[100]
                ${isOpen ? 'translate-x-0' : 'translate-x-full'}
            `}>
                <div className="p-6 h-full flex flex-col gap-6 overflow-y-auto custom-scrollbar">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-primary uppercase italic">Table Admin</h3>
                        <button 
                            onClick={onClose}
                            className="material-symbols-outlined text-white/50 hover:text-white cursor-pointer transition-colors"
                        >
                            close
                        </button>
                    </div>

                    <div className="space-y-6 flex-1">
                        {/* Game Flow Actions */}
                        <div className="space-y-2">
                             <label className="text-[10px] font-bold uppercase text-white/40 tracking-widest">Game Flow</label>
                             <div className="grid grid-cols-1 gap-3">
                                <button 
                                    onClick={onStartGame} 
                                    className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 flex items-center justify-center gap-3 transition-colors cursor-pointer"
                                >
                                    <span className="material-symbols-outlined text-[20px] text-green-400">play_circle</span>
                                    <span className="text-sm font-bold uppercase">Force Skip Players</span>
                                </button>
                                {/* <button 
                                    onClick={onNextRound} 
                                    className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 flex items-center justify-center gap-3 transition-colors cursor-pointer"
                                >
                                    <span className="material-symbols-outlined text-[20px] text-blue-400">skip_next</span>
                                    <span className="text-sm font-bold uppercase">Force Next Round</span>
                                </button> */}
                            </div>
                        </div>

                         {/* Pending Approvals */}
                        {players.some(p => p.status === 'PendingApproval') && (
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase text-yellow-500 tracking-widest animate-pulse">Pending Requests</label>
                                {players.filter(p => p.status === 'PendingApproval').map(p => (
                                     <div key={p.id} className="bg-white/5 p-3 rounded-lg border border-white/10 flex justify-between items-center">
                                         <span className="font-bold text-sm">{p.name}</span>
                                         <div className="flex gap-2">
                                              <button onClick={() => onApprove(p.id)} className="text-xs bg-green-500/20 hover:bg-green-500/30 text-green-400 px-2 py-1 rounded border border-green-500/30 cursor-pointer">✓</button>
                                              <button onClick={() => onKick(p.id)} className="text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 px-2 py-1 rounded border border-red-500/30 cursor-pointer">✗</button>
                                         </div>
                                     </div>
                                ))}
                            </div>
                        )}

                        {/* Settings */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-bold uppercase text-white/40 tracking-widest">Table Settings</label>
                            
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-white/50 text-xs mb-1">Initial Chips</label>
                                    <input 
                                        type="number" 
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-primary/50 outline-none"
                                        value={localSettings.initial_chips}
                                        onChange={(e) => setLocalSettings({...localSettings, initial_chips: parseInt(e.target.value)})}
                                    />
                                </div>
                                <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10" onClick={() => setLocalSettings({...localSettings, approval_required: !localSettings.approval_required})}>
                                    <span className="text-sm text-gray-300">Approval Req.</span>
                                    <input 
                                        type="checkbox" 
                                        checked={localSettings.approval_required}
                                        readOnly
                                        className="accent-primary cursor-pointer pointer-events-none"
                                    />
                                </div>
                                <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10" onClick={() => setLocalSettings({...localSettings, chat_enabled: !localSettings.chat_enabled})}>
                                    <span className="text-sm text-gray-300">Enable Chat</span>
                                    <input 
                                        type="checkbox" 
                                        checked={localSettings.chat_enabled}
                                        readOnly
                                        className="accent-primary cursor-pointer pointer-events-none"
                                    />
                                </div>
                                <button 
                                    onClick={handleSave}
                                    className={`w-full font-black uppercase py-2 rounded-lg transition-all shadow-lg cursor-pointer ${saveFeedback ? 'bg-green-500 text-white' : 'bg-primary hover:bg-white text-background-dark'}`}
                                >
                                    {saveFeedback || "Save Settings"}
                                </button>
                            </div>
                        </div>

                         {/* Player Management */}
                         <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-[10px] font-bold uppercase text-white/40 tracking-widest">Active Players</label>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-white/50">Amt:</span>
                                    <input 
                                        type="number" 
                                        value={adminAmount} 
                                        onChange={(e) => setAdminAmount(parseInt(e.target.value) || 0)}
                                        className="w-16 bg-white/5 border border-white/10 rounded text-[10px] px-1 py-0.5 text-right outline-none focus:border-primary/50"
                                    />
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                {players.filter(p => p.status !== 'PendingApproval').map(p => (
                                    <div key={p.id} className="bg-white/5 p-3 rounded-lg border border-white/5">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className={`text-sm font-bold ${p.is_connected ? "text-white" : "text-white/50"}`}>
                                                {p.name}
                                            </span>
                                            <span className="text-xs font-mono text-primary">${p.chips}</span>
                                        </div>
                                        <div className="flex gap-2 justify-end">
                                            <button onClick={() => onUpdateBalance(p.id, adminAmount)} className="text-[10px] bg-white/5 hover:bg-white/10 text-green-400 px-2 py-1 rounded border border-white/10 cursor-pointer">+{adminAmount}</button>
                                            <button onClick={() => onUpdateBalance(p.id, -adminAmount)} className="text-[10px] bg-white/5 hover:bg-white/10 text-red-400 px-2 py-1 rounded border border-white/10 cursor-pointer">-{adminAmount}</button>
                                            <button onClick={() => onKick(p.id)} className="text-[10px] bg-red-500/20 hover:bg-red-500/30 text-red-400 px-2 py-1 rounded border border-red-500/30 cursor-pointer">Kick</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

