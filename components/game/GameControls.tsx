import { Player } from "@/app/types";
import { useState } from "react";

interface GameControlsProps {
    isMyTurn: boolean;
    canSplit: boolean;
    canDouble: boolean;
    timeLeft: number;
    totalTime: number;
    onAction: (action: "Hit" | "Stand" | "Double" | "Split") => void;
    phase: string;
    myPlayer?: Player;
    actions?: any; // Pass the whole actions object or specific functions? Let's use specific plain props if possible, but actions object is easier for now.
}

export function GameControls({ isMyTurn, canSplit, canDouble, timeLeft, totalTime, onAction, phase, myPlayer, actions }: GameControlsProps) {
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
            <div className="glass-panel w-full max-w-3xl p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-8 border border-white/10 shadow-inner animate-slide-up">
                <div className="flex flex-col gap-1 text-center md:text-left">
                    <span className="text-[10px] font-bold uppercase text-white/40 tracking-[0.2em]">Current Bet</span>
                    <span className="text-3xl font-black text-primary">${betAmount}</span>
                </div>
                
                <div className="flex items-center gap-4 flex-1 w-full">
                     <input 
                        type="range" 
                        min="10" 
                        max={myPlayer.chips} 
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
                            className="size-12 rounded-full chip-gradient border-4 border-dashed border-white/40 flex items-center justify-center text-[10px] font-black text-background-dark shadow-xl hover:-rotate-12 transition-transform active:scale-95"
                        >
                            {val >= 1000 ? `${val/1000}K` : val}
                        </button>
                    ))}
                    <button 
                        onClick={handlePlaceBet}
                        className="bg-primary hover:bg-white text-background-dark font-black uppercase rounded-xl px-6 py-2 shadow-lg transition-transform hover:scale-105 active:scale-95"
                    >
                        Place Bet
                    </button>
                </div>
            </div>
        );
    }

    // --- Playing Phase ---
    if (!isMyTurn) return (
        <div className="text-white/50 text-xs uppercase tracking-widest font-bold animate-pulse">
            Waiting for other players...
        </div>
    );

    return (
        <div className="flex flex-col md:flex-row items-center gap-8 animate-slide-up">
            {/* Action Buttons */}
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => onAction("Hit")}
                    className="action-button flex flex-col items-center justify-center w-24 h-24 rounded-2xl bg-primary text-background-dark font-black tracking-tighter uppercase cursor-pointer"
                >
                    <span className="text-xl">Hit</span>
                    <span className="material-symbols-outlined text-[20px]">add_circle</span>
                </button>
                
                <button 
                    onClick={() => onAction("Stand")}
                    className="action-button flex flex-col items-center justify-center w-24 h-24 rounded-2xl bg-white/5 border border-white/20 text-white font-black tracking-tighter uppercase hover:bg-white/10 cursor-pointer"
                >
                    <span className="text-xl">Stand</span>
                    <span className="material-symbols-outlined text-[20px]">front_hand</span>
                </button>
                
                <div className="hidden md:block h-12 w-px bg-white/10 mx-2"></div>
                
                <button 
                    onClick={() => onAction("Double")}
                    disabled={!canDouble}
                    className={`
                        action-button flex flex-col items-center justify-center w-24 h-24 rounded-2xl border border-white/20 font-black tracking-tighter uppercase 
                        ${canDouble ? 'bg-white/5 text-white hover:bg-white/10 cursor-pointer' : 'bg-transparent text-white/20 cursor-not-allowed border-white/5'}
                    `}
                >
                    <span className="text-lg">Double</span>
                    <span className="material-symbols-outlined text-[20px]">keyboard_double_arrow_up</span>
                </button>
                
                <button 
                    onClick={() => onAction("Split")}
                    disabled={!canSplit}
                    className={`
                        action-button flex flex-col items-center justify-center w-24 h-24 rounded-2xl border border-white/20 font-black tracking-tighter uppercase 
                        ${canSplit ? 'bg-white/5 text-white hover:bg-white/10 cursor-pointer' : 'bg-transparent text-white/20 cursor-not-allowed border-white/5'}
                    `}
                >
                    <span className="text-lg">Split</span>
                    <span className="material-symbols-outlined text-[20px]">call_split</span>
                </button>
            </div>

            {/* Turn Timer */}
            <div className="flex flex-col gap-1 items-center md:items-start">
                 <span className="text-[10px] font-bold uppercase text-white/40 tracking-widest">Time Remaining</span>
                 <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div 
                        className={`h-full ${timeLeft < 10 ? 'bg-red-500' : 'bg-primary'} transition-all duration-100 ease-linear`}
                        style={{ width: `${(timeLeft / totalTime) * 100}%` }}
                    />
                 </div>
                 <span className="text-xs font-mono text-white/60">{Math.ceil(timeLeft)}s</span>
            </div>
        </div>
    );
}
