import { Card as CardType, Hand as HandType, HandStatus } from "@/app/types";
import { Card } from "./Card";

interface HandProps {
  cards: CardType[];
  score: number;
  status?: HandStatus;
  isActive?: boolean;
  bet?: number;
  className?: string; // Additional positioning
  isDealer?: boolean;
}

export function Hand({ cards, score, status, isActive, bet, className = "", isDealer = false }: HandProps) {
  // Determine border color based on status/activity
  const getBorderColor = () => {
    if (status === "Blackjack") return "border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.5)]";
    if (status === "Won") return "border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]";
    if (status === "Lost" || status === "Busted") return "border-red-500/50";
    if (status === "Push") return "border-yellow-500/50";
    if (isActive && !isDealer) return "border-primary shadow-[0_0_10px_rgba(13,242,128,0.3)]";
    return "border-transparent";
  };

  return (
    <div className={`flex flex-col items-center transition-all duration-300 ${className}`}>
      {/* Status Badge */}
      {status && status !== "Playing" && (
        <div className={`
          mb-2 px-3 py-0.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest
          animate-bounce shadow-lg z-20
          ${['Won', 'Blackjack'].includes(status) ? 'bg-primary text-background-dark' : ''}
          ${['Lost', 'Busted'].includes(status) ? 'bg-red-600 text-white' : ''}
          ${status === 'Push' ? 'bg-yellow-500 text-black' : ''}
          ${status === 'Doubled' ? 'bg-blue-600 text-white' : ''}
        `}>
          {status}
        </div>
      )}

      {/* Cards Container */}
      <div className={`
        relative flex items-center justify-center
        min-w-[80px] min-h-[100px] sm:min-w-[100px] sm:min-h-[120px]
        rounded-xl p-2 transition-all duration-300
        ${isActive && !isDealer ? 'bg-white/5' : ''}
      `}>
         <div className={`flex ${isDealer ? 'gap-4' : '-space-x-12 hover:-space-x-8'} transition-all duration-300`}>
            {cards.map((card, idx) => (
                <div 
                    key={idx} 
                    className={`transform transition-transform duration-300 ${!isDealer ? 'origin-bottom hover:-translate-y-4' : ''}`}
                    style={{ 
                        zIndex: idx,
                        transform: !isDealer ? `rotate(${(idx - (cards.length - 1) / 2) * 5}deg)` : 'none' // Fan effect only for players
                    }}
                >
                    <Card card={card} />
                </div>
            ))}
            {cards.length === 0 && (
                <div className="w-24 h-36 border-2 border-dashed border-white/10 rounded-lg flex items-center justify-center">
                    <span className="text-white/20 text-xs text-center px-1">Empty Hand</span>
                </div>
            )}
         </div>

         {/* Score Bubble */}
         {cards.length > 0 && (
            <div className={`
                absolute -bottom-4 left-1/2 transform -translate-x-1/2
                px-4 py-1 rounded-lg text-lg font-black shadow-lg
                ${status === 'Busted' ? 'bg-red-900/90 text-red-200' : 'bg-primary text-background-dark'}
                ${isActive ? 'scale-110' : ''}
            `}>
                {score}
            </div>
         )}
      </div>

      {/* Bet Amount (if applicable) */}
      {bet !== undefined && bet > 0 && (
          <div className="mt-6 flex items-center gap-1 text-xs text-primary bg-background-dark px-3 py-1 rounded-full border border-primary/20">
              <span className="font-bold">$</span>
              <span className="font-mono">{bet}</span>
          </div>
      )}
    </div>
  );
}
