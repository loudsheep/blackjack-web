import { Player } from "@/app/types";
import { calculateHandValue } from "@/app/utils/gameUtils";

interface PayoutModalProps {
    players: Player[];
    dealerHand: any[]; // Card[]
    onNextRound: () => void;
    isAdmin: boolean;
}

export function PayoutModal({ players, dealerHand, onNextRound, isAdmin }: PayoutModalProps) {
    // Sort players by total winnings? Or just list them? 
    // Since we don't have explicit winnings event, we assume status tells us roughly what happened, 
    // but calculating exact amounts client side is tricky without knowing the bet amounts for each hand reliably if they split etc.
    // However, the backend Player object has 'chips'. We could track delta? 
    // For now, let's just show the status of each hand.
    
    // Helper to get outcome text color
    const getStatusColor = (status: string) => {
        if (['Won', 'Blackjack'].includes(status)) return 'text-green-400';
        if (['Lost', 'Busted'].includes(status)) return 'text-red-400';
        if (['Push'].includes(status)) return 'text-yellow-400';
        return 'text-gray-400';
    };

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
            <div className="bg-gray-900 border border-yellow-500/30 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="p-6 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-b border-gray-800 text-center">
                    <h2 className="text-3xl font-black text-yellow-500 uppercase tracking-widest drop-shadow-md">
                        Round Complete
                    </h2>
                    <div className="text-gray-400 text-sm mt-1">
                        Dealer had: <span className="text-white font-bold">{calculateHandValue(dealerHand)}</span>
                    </div>
                </div>

                {/* Results List */}
                <div className="p-6 overflow-y-auto space-y-4 custom-scrollbar">
                    {players.map(p => (
                        <div key={p.id} className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col gap-2">
                             <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                 <span className="font-bold text-lg">{p.name}</span>
                                 <div className="text-yellow-500 font-mono text-sm">
                                     Current Chips: <span className="font-bold text-white">{p.chips}</span>
                                 </div>
                             </div>
                             
                             {/* Visualize each hand outcome */}
                             <div className="flex gap-4 flex-wrap">
                                 {(p.hands || []).map((h: any, idx) => {
                                     // Defensive check for structure
                                     const status = h.status || (h as any).status || "Playing"; 
                                     const cards = Array.isArray(h) ? h : h.cards;
                                     const val = calculateHandValue(cards);

                                     return (
                                         <div key={idx} className="flex-1 bg-black/20 rounded p-2 flex justify-between items-center min-w-[120px]">
                                             <div className="text-xs text-gray-400">
                                                 Hand {idx + 1} ({val})
                                             </div>
                                             <div className={`font-black uppercase text-sm ${getStatusColor(status)}`}>
                                                 {status}
                                             </div>
                                         </div>
                                     );
                                 })}
                             </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                {isAdmin && (
                    <div className="p-6 border-t border-gray-800 bg-gray-900/50 flex justify-center">
                        <button 
                            onClick={onNextRound}
                            className="
                                bg-yellow-500 hover:bg-yellow-400 text-black 
                                px-8 py-3 rounded-full font-bold text-lg shadow-[0_0_20px_rgba(234,179,8,0.3)]
                                transition-all hover:scale-105 active:scale-95
                            "
                        >
                            Start Next Round
                        </button>
                    </div>
                )}
                {!isAdmin && (
                    <div className="p-4 text-center text-gray-500 text-sm italic">
                        Waiting for host to start next round...
                    </div>
                )}
            </div>
        </div>
    );
}
