import { Card as CardType } from "@/app/types";
import { Hand } from "./Hand";
import { Card } from "./Card";
import { calculateHandValue } from "@/utils/gameUtils";

interface DealerAreaProps {
  dealerHand: CardType[];
  phase: string; 
}

export function DealerArea({ dealerHand, phase }: DealerAreaProps) {
  const score = calculateHandValue(dealerHand);

  // If dealer has 1 card visible, we typically show a hidden card next to it
  // unless the game is over or in a phase where we shouldn't.
  const showHiddenCard = dealerHand.length === 1 && phase !== "GameOver" && phase !== "Payout";

  return (
    <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-2 text-xs font-bold tracking-[0.3em] uppercase text-white/40">
            <span className="w-8 h-[1px] bg-white/10"></span>
            Dealer Hand
            <span className="w-8 h-[1px] bg-white/10"></span>
        </div>
       
       <div className="flex items-center justify-center gap-4 relative z-10">
           {/* Visible Hand */}
           <Hand 
               cards={dealerHand} 
               score={score} 
               status={phase === "DealerTurn" ? "Playing" : undefined}
               isActive={phase === "DealerTurn"}
               isDealer={true}
           />

           {/* Hidden Card Visualization */}
           {showHiddenCard && (
               <div className="relative -ml-12 transform translate-y-2 z-[-1] animate-fade-in">
                   <Card 
                     card={{ suit: 'Spades', rank: 'Ace' }} // Dummy card
                     hidden={true} 
                   />
               </div>
           )}
       </div>

       {phase === "DealerTurn" && (
           <div className="glass-panel px-4 py-1 rounded-full text-xs font-bold text-primary animate-pulse">
                Dealer's Turn
           </div>
       )}
        {phase === "GameOver" && (
           <div className="glass-panel px-4 py-1 rounded-full text-xs font-bold text-white/50">
                Round Over
           </div>
       )}
    </div>
  );
}
