import { Player } from "@/app/types";
import { useState } from "react";
import { calculateHandValue } from "../../utils/gameUtils";

interface GameControlsProps {
    isMyTurn: boolean;
    canSplit: boolean;
    canDouble: boolean;
    onAction: (action: "Hit" | "Stand" | "Double" | "Split") => void;
    phase: string;
    myPlayer?: Player;
    actions?: any;
}

export function GameControls({ isMyTurn, canSplit, canDouble, onAction, phase, myPlayer, actions }: GameControlsProps) {
    const [betAmount, setBetAmount] = useState(100);

    // --- Betting Phase ---
    if (phase === "Betting") {
        if (!myPlayer || ['Spectating', 'PendingApproval'].includes(myPlayer.status)) return null;

        const handlePlaceBet = () => {
             if (actions && actions.placeBet) {
                 actions.placeBet(betAmount);
             }
        };

        const chipValues = [10, 50, 100, 500, 1000];

        return (
            <div className="glass-panel w-full max-w-3xl p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-8 border border-white/10 shadow-inner animate-slide-up bg-black/40 backdrop-blur-md">
                <div className="flex flex-col gap-1 text-center md:text-left">
                    <span className="text-[10px] font-bold uppercase text-white/40 tracking-[0.2em]">Current Bet</span>
                    <span className="text-3xl font-black text-primary drop-shadow-[0_0_10px_rgba(13,242,128,0.5)]">${betAmount}</span>
                </div>
                
                <div className="flex items-center gap-4 flex-1 w-full">
                     <input 
                        type="range" 
                        min="10" 
                        max={myPlayer.chips > 10 ? myPlayer.chips : 100} 
                        step="10"
                        value={betAmount}
                        onChange={(e) => setBetAmount(Number(e.target.value))}
                        className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary hover:accent-green-400 transition-all"
                     />
                </div>

                <div className="flex gap-2 justify-center flex-wrap">
                    {chipValues.map(val => (
                        <button 
                            key={val}
                            onClick={() => setBetAmount(val <= myPlayer.chips ? val : myPlayer.chips)}
                            className="size-12 rounded-full chip-gradient border-2 border-dashed border-white/40 flex items-center justify-center text-[10px] font-black text-background-dark shadow-xl hover:-rotate-12 hover:scale-110 transition-transform active:scale-95 cursor-pointer"
                        >
                            {val >= 1000 ? `${val/1000}K` : val}
                        </button>
                    ))}
                    <button 
                        onClick={handlePlaceBet}
                        className="bg-primary hover:bg-white text-background-dark font-black uppercase rounded-xl px-6 py-3 shadow-[0_0_20px_rgba(13,242,128,0.3)] transition-all hover:scale-105 active:scale-95 cursor-pointer border border-green-400"
                    >
                        Place Bet
                    </button>
                </div>
            </div>
        );
    }

    // --- Playing Phase ---
    const activeHand = myPlayer?.hands?.[myPlayer.active_hand_index || 0];
    const activeHandCards = Array.isArray(activeHand) ? activeHand : (activeHand?.cards || []);
    const handValue = calculateHandValue(activeHandCards);
    const hasBlackjack = handValue === 21 && activeHandCards.length === 2;

    if (!isMyTurn || phase === "Payout" || hasBlackjack) {
        return (
            <div className="text-white/30 text-xs uppercase tracking-widest font-bold animate-pulse">
                {phase === 'Playing' ? 'Waiting for other players...' : ''}
            </div>
        );
    }

    return (
        <div className="flex flex-col md:flex-row items-center gap-8 animate-slide-up">
            {/* Action Buttons */}
            <div className="flex items-center gap-6">
                <button 
                    onClick={() => onAction("Hit")}
                    className="action-button flex flex-col items-center justify-center w-28 h-28 rounded-2xl bg-primary text-background-dark font-black tracking-tighter uppercase cursor-pointer hover:scale-105 transition-transform shadow-[0_0_20px_rgba(13,242,128,0.4)] border-2 border-primary/50"
                >
                    <span className="text-2xl drop-shadow-sm">Hit</span>
                    <span className="material-symbols-outlined text-[32px]">add_circle</span>
                </button>
                
                <button 
                    onClick={() => onAction("Stand")}
                    className="action-button flex flex-col items-center justify-center w-28 h-28 rounded-2xl bg-red-500 text-white font-black tracking-tighter uppercase hover:bg-red-400 cursor-pointer hover:scale-105 transition-transform shadow-[0_0_20px_rgba(239,68,68,0.4)] border-2 border-red-400/50"
                >
                    <span className="text-2xl drop-shadow-sm">Stand</span>
                    <span className="material-symbols-outlined text-[32px]">front_hand</span>
                </button>
                
                <div className="hidden md:block h-16 w-px bg-white/10 mx-2"></div>
                
                <button 
                    onClick={() => onAction("Double")}
                    disabled={!canDouble}
                    className={`
                        action-button flex flex-col items-center justify-center w-24 h-24 rounded-2xl border border-white/20 font-black tracking-tighter uppercase transition-all
                        ${canDouble ? 'bg-blue-600 text-white hover:bg-blue-500 cursor-pointer shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'bg-transparent text-white/20 cursor-not-allowed border-white/5 grayscale'}
                    `}
                >
                    <span className="text-lg">Double</span>
                    <span className="material-symbols-outlined text-[24px]">keyboard_double_arrow_up</span>
                </button>
                
                <button 
                    onClick={() => onAction("Split")}
                    disabled={!canSplit}
                    className={`
                        action-button flex flex-col items-center justify-center w-24 h-24 rounded-2xl border border-white/20 font-black tracking-tighter uppercase transition-all
                        ${canSplit ? 'bg-purple-600 text-white hover:bg-purple-500 cursor-pointer shadow-[0_0_15px_rgba(147,51,234,0.4)]' : 'bg-transparent text-white/20 cursor-not-allowed border-white/5 grayscale'}
                    `}
                >
                    <span className="text-lg">Split</span>
                    <span className="material-symbols-outlined text-[24px]">call_split</span>
                </button>
            </div>
        </div>
    );
}

