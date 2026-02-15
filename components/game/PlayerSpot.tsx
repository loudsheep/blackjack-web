import { Player } from "@/app/types";
import { Hand } from "./Hand";
import { calculateHandValue } from "../../utils/gameUtils";

// Local utility removed in favor of shared import



interface PlayerSpotProps {
  player: Player;
  isMe: boolean;
  isCurrentTurn: boolean;
  turnDuration?: number; // seconds
}

export function PlayerSpot({ player, isMe, isCurrentTurn, turnDuration = 30 }: PlayerSpotProps) {
  // Normalize hands structure (handling legacy array-of-arrays or new object structure)
  const hands = player.hands || [];
  
  return (
    <div className={`
      relative flex flex-col items-center p-4 rounded-xl transition-all duration-300
      ${!player.is_connected ? 'opacity-50 grayscale' : ''}
      ${isCurrentTurn ? 'ring-2 ring-yellow-400/50 bg-yellow-900/10' : ''}
    `}>
      
      {/* Player Info (Above Hands) */}
      <div className="flex flex-col items-center mb-4 z-10">
        <div className="relative">
            {/* Avatar Placeholder */}
            <div className={`
                w-16 h-16 rounded-full border-4 flex items-center justify-center text-2xl font-bold
                shadow-lg bg-gradient-to-br
                ${isMe ? 'from-blue-600 to-indigo-800 border-blue-400' : 'from-gray-700 to-gray-900 border-gray-500'}
                ${isCurrentTurn ? 'animate-pulse ring-4 ring-yellow-400/30' : ''}
            `}>
                {player.name.charAt(0).toUpperCase()}
                {player.is_admin && <span className="absolute -top-1 -right-1 text-xs">👑</span>}
            </div>

            {/* Offline Badge */}
            {!player.is_connected && (
                <div className="absolute bottom-0 right-0 bg-red-600 text-white text-[10px] px-1 rounded border border-white">
                    OFF
                </div>
            )}
        </div>
        
        <div className="mt-1 text-center">
            <div className={`font-bold text-sm ${isMe ? 'text-blue-300' : 'text-gray-200'}`}>
                {player.name}
            </div>
            <div className="text-xs text-yellow-400 font-mono">
                ${player.chips}
            </div>
        </div>
      </div>

      {/* Turn Timer Bar (if active) */}
      {isCurrentTurn && (
         <div className="absolute top-0 left-4 right-4 h-1 bg-gray-700 rounded-full overflow-hidden">
            <div 
                className="h-full bg-yellow-400 animate-shrink origin-left"
                style={{ animationDuration: `${turnDuration}s` }}
            />
         </div>
      )}

      {/* Hands Container */}
      <div className="flex gap-4 items-start justify-center">
        {hands.map((handObj: any, index) => {
           // Defensive coding for hand structure
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

           const isActiveHand = index === player.active_hand_index;
           const score = calculateHandValue(cards);

           return (
             <Hand 
                key={index}
                cards={cards}
                score={score}
                status={status as any}
                bet={bet}
                isActive={isCurrentTurn && isActiveHand}
             />
           );
        })}

        {/* Empty State / Sitting Out */}
        {hands.length === 0 && (
             <div className="text-white/30 text-xs italic mt-4">
                 {player.status === 'Sitting' ? 'Sitting Out' : 'Waiting for round...'}
             </div>
        )}
      </div>
      
      {/* Player Status Text */}
      <div className="text-[10px] uppercase tracking-widest text-green-400/50 mt-2 font-bold">
          {player.status}
      </div>

    </div>
  );
}
