import { Card as CardType } from "@/app/types";
import { Hand } from "./Hand";
import { Card } from "./Card";
import { calculateHandValue } from "@/app/utils/gameUtils";

interface DealerAreaProps {
  dealerHand: CardType[];
  phase: string; 
}

export function DealerArea({ dealerHand, phase }: DealerAreaProps) {
  const score = calculateHandValue(dealerHand);

  // If dealer has 1 card visible, we typically show a hidden card next to it
  // unless the game is over or in a phase where we shouldn't.
  // In standard blackjack, dealer peaks or deals one down.
  const showHiddenCard = dealerHand.length === 1 && phase !== "GameOver" && phase !== "Payout";

  return (
    <div className="flex flex-col items-center justify-center py-8 relative w-full">
       <div className="text-yellow-500/30 text-xs font-black uppercase tracking-widest mb-2 select-none">
          Dealer
       </div>
       
       <div className="flex items-center justify-center gap-4 relative z-10 scale-90 sm:scale-100">
           {/* Visible Hand */}
           <Hand 
               cards={dealerHand} 
               score={score} 
               status={phase === "DealerTurn" ? "Playing" : undefined} // Maybe highlight if turn?
               isActive={phase === "DealerTurn"}
           />

           {/* Hidden Card Visualization */}
           {showHiddenCard && (
               <div className="relative -ml-12 sm:-ml-16 transform translate-y-2 z-[-1] animate-fade-in">
                   <Card 
                     card={{ suit: 'Spades', rank: 'Ace' }} // Dummy card prop since it's hidden
                     hidden={true} 
                   />
               </div>
           )}
       </div>

       {/* Dealer Status Message */}
       <div className="mt-4 h-6 text-center">
           {phase === "DealerTurn" && (
               <div className="text-yellow-400 font-bold animate-pulse text-sm uppercase tracking-wide">
                   Dealer's Turn...
               </div>
           )}
           {phase === "GameOver" && (
               <div className="text-gray-400 text-xs">
                   Round Over
               </div>
           )}
       </div>
    </div>
  );
}
