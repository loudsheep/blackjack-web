import { Player, Rank } from "@/app/types";
import { Hand } from "./Hand";
import { calculateHandValue } from "../../utils/gameUtils";
import { useState } from "react";

const RANK_MAP: Record<string, string> = {
  Two: "2", Three: "3", Four: "4", Five: "5", Six: "6",
  Seven: "7", Eight: "8", Nine: "9", Ten: "10",
  Jack: "J", Queen: "Q", King: "K", Ace: "A",
};

interface PlayerSpotProps {
  player: Player;
  isMe: boolean;
  isCurrentTurn: boolean;
  turnDuration?: number; // seconds
  gamePhase?: string;
}

export function PlayerSpot({ player, isMe, isCurrentTurn, turnDuration = 30, gamePhase }: PlayerSpotProps) {
  const [viewHandIndex, setViewHandIndex] = useState(0);

  // Normalize hands structure (handling legacy array-of-arrays or new object structure)
  const hands = player.hands || [];
  
  // --- Main Player Layout (Center) ---
  if (isMe) {
      return (
          <div className="flex gap-20 items-end">
             {hands.map((handObj: any, index) => {
                 let cards = [];
                 let status = "Playing";
                 let bet = 0;
                 if (Array.isArray(handObj)) {
                     cards = handObj;
                 } else {
                     cards = handObj.cards;
                     status = handObj.status;
                     bet = handObj.bet;
                 }

                 const isHandActive = isCurrentTurn && index === player.active_hand_index;
                 const isMultiHand = hands.length > 1;
                 const shouldBlur = isMultiHand && !isHandActive && gamePhase !== 'Payout';

                 return (
                     <div 
                        key={index} 
                        className={`
                            flex flex-col items-center gap-4 group transition-all duration-300
                            ${shouldBlur ? 'opacity-40 scale-90 blur-[1px]' : 'opacity-100 scale-100'}
                        `}
                     >
                         <Hand 
                            cards={cards}
                            score={calculateHandValue(cards)}
                            status={status as any}
                            bet={bet}
                            isActive={isHandActive}
                         />
                         <div className={`
                            text-[10px] font-bold uppercase mt-1 tracking-widest transition-colors
                            ${isHandActive ? 'text-primary animate-pulse' : 'text-white/30'}
                         `}>
                             {hands.length > 1 ? `Hand ${index + 1}` : 'Main Hand'}
                         </div>
                     </div>
                 )
             })}
          </div>
      );
  }

  // --- Other Player Layout (Sidebar) ---
  // Ensure index is valid
  const safeIndex = viewHandIndex < hands.length ? viewHandIndex : 0;
  const currentHand = hands[safeIndex];
  
  let currentCards: any[] = [];
  let currentStatus = "";
  
  if (currentHand) {
       if (Array.isArray(currentHand)) {
           currentCards = currentHand;
       } else {
           currentCards = currentHand.cards;
           currentStatus = currentHand.status; // e.g. "Busted", "Blackjack"
       }
  }
  const currentScore = calculateHandValue(currentCards);
  const isMulti = hands.length > 1;

  const nextHand = () => setViewHandIndex((prev) => (prev + 1) % hands.length);
  const prevHand = () => setViewHandIndex((prev) => (prev - 1 + hands.length) % hands.length);

  return (
    <div className={`
        glass-panel p-4 rounded-xl flex flex-col gap-3 transition-all
        ${isCurrentTurn ? 'border-l-4 border-l-primary' : 'opacity-80'}
        ${!player.is_connected ? 'opacity-40 grayscale' : ''}
    `}>
        {/* Header: Name & Status */}
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white truncate max-w-[100px]">{player.name}</span>
                <span className={`text-[10px] px-1.5 rounded-full uppercase ${player.is_connected ? 'bg-primary/20 text-primary' : 'bg-red-500/20 text-red-500'}`}>
                    {player.status}
                </span>
            </div>
        </div>
        
        {/* Hand Navigator & Score */}
        <div className="flex items-center justify-between text-xs">
             <div className="flex items-center gap-1 text-white/50">
                 {isMulti && (
                    <button onClick={prevHand} className="hover:text-white cursor-pointer select-none">
                        <span className="material-symbols-outlined text-[14px]">chevron_left</span>
                    </button>
                 )}
                 <span className="font-mono uppercase tracking-wider">{isMulti ? `Hand ${safeIndex + 1}` : 'Hand'}</span>
                 {isMulti && (
                    <button onClick={nextHand} className="hover:text-white cursor-pointer select-none">
                        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                    </button>
                 )}
             </div>
             <div className="flex items-center gap-2">
                 {currentStatus && currentStatus !== 'Playing' && (
                     <span className={`text-[10px] font-black uppercase ${['Busted', 'Lost'].includes(currentStatus) ? 'text-red-500' : 'text-primary'}`}>
                         {currentStatus}
                     </span>
                 )}
                 <span className="font-bold text-white bg-white/10 px-1.5 rounded">{currentScore}</span>
             </div>
        </div>

        {/* Mini Hand Preview */}
        <div className="flex gap-1 overflow-x-auto custom-scrollbar pb-1 min-h-[50px]">
             {currentCards.map((card: any, idx: number) => (
                 <div key={idx} className="w-8 h-12 bg-white rounded-sm border border-black/10 flex flex-col items-center justify-center text-black font-bold text-[10px] animate-fade-in">
                     {RANK_MAP[card.rank] || card.rank.charAt(0)}
                     <span className={['Hearts', 'Diamonds'].includes(card.suit) ? 'text-red-600' : 'text-black'}>
                         {card.suit === 'Hearts' ? '♥' : card.suit === 'Diamonds' ? '♦' : card.suit === 'Spades' ? '♠' : '♣'}
                     </span>
                 </div>
             ))}
             {currentCards.length === 0 && (
                 <div className="text-[10px] text-white/30 italic">No Cards</div>
             )}
        </div>
        
        {/* Pagination Dots (Optional, if many hands) */}
        {isMulti && (
            <div className="flex justify-center gap-1 mt-1">
                {hands.map((_, idx) => (
                    <div key={idx} className={`w-1 h-1 rounded-full ${idx === safeIndex ? 'bg-primary' : 'bg-white/20'}`} />
                ))}
            </div>
        )}
    </div>
  );
}
