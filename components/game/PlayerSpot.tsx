import { Player, Rank } from "@/app/types";
import { Hand } from "./Hand";
import { calculateHandValue } from "../../utils/gameUtils";

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
}

export function PlayerSpot({ player, isMe, isCurrentTurn, turnDuration = 30 }: PlayerSpotProps) {
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

                 return (
                     <div key={index} className="flex flex-col items-center gap-4 group">
                         <Hand 
                            cards={cards}
                            score={calculateHandValue(cards)}
                            status={status as any}
                            bet={bet}
                            isActive={isCurrentTurn && index === player.active_hand_index}
                         />
                         <div className="text-[10px] font-bold text-primary uppercase mt-1 tracking-widest">
                             {hands.length > 1 ? `Hand ${index + 1}` : 'Main Hand'}
                         </div>
                     </div>
                 )
             })}
          </div>
      );
  }

  // --- Other Player Layout (Sidebar) ---
  const primaryHand = hands[0];
  let primaryCards: any[] = [];
  let primaryScore = 0;
  
  if (primaryHand) {
       if (Array.isArray(primaryHand)) {
           primaryCards = primaryHand;
       } else {
           primaryCards = primaryHand.cards;
       }
       primaryScore = calculateHandValue(primaryCards);
  }

  return (
    <div className={`
        glass-panel p-4 rounded-xl flex flex-col gap-3 transition-all
        ${isCurrentTurn ? 'border-l-4 border-l-primary' : 'opacity-80'}
        ${!player.is_connected ? 'opacity-40 grayscale' : ''}
    `}>
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white truncate max-w-[100px]">{player.name}</span>
                <span className={`text-[10px] px-1.5 rounded-full uppercase ${player.is_connected ? 'bg-primary/20 text-primary' : 'bg-red-500/20 text-red-500'}`}>
                    {player.status}
                </span>
            </div>
            <span className="text-xs font-bold text-primary">{primaryScore > 0 ? primaryScore : ''}</span>
        </div>
        
        {/* Mini Hand Preview */}
        <div className="flex gap-1 overflow-x-auto custom-scrollbar pb-1">
             {primaryCards.map((card: any, idx: number) => (
                 <div key={idx} className="w-8 h-12 bg-white rounded-sm border border-black/10 flex flex-col items-center justify-center text-black font-bold text-[10px]">
                     {RANK_MAP[card.rank] || card.rank.charAt(0)}
                     <span className={['Hearts', 'Diamonds'].includes(card.suit) ? 'text-red-600' : 'text-black'}>
                         {card.suit === 'Hearts' ? '♥' : card.suit === 'Diamonds' ? '♦' : card.suit === 'Spades' ? '♠' : '♣'}
                     </span>
                 </div>
             ))}
              {hands.length > 1 && (
                  <div className="text-[10px] text-white/50 flex items-center justify-center w-8">+{(hands.length - 1)}</div>
              )}
        </div>
    </div>
  );
}
