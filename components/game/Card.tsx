import { Suit, Rank, Card as CardType } from "@/app/types";

const SUIT_SYMBOLS: Record<Suit, string> = {
  Hearts: "♥",
  Diamonds: "♦",
  Clubs: "♣",
  Spades: "♠",
};

const SUIT_COLORS: Record<Suit, string> = {
  Hearts: "text-red-600",
  Diamonds: "text-red-600",
  Clubs: "text-slate-900",
  Spades: "text-slate-900",
};

const RANK_MAP: Record<Rank, string> = {
  Two: "2", Three: "3", Four: "4", Five: "5", Six: "6",
  Seven: "7", Eight: "8", Nine: "9", Ten: "10",
  Jack: "J", Queen: "Q", King: "K", Ace: "A",
};

interface CardProps {
  card: CardType;
  hidden?: boolean;
  className?: string;
  mini?: boolean; // For split hands or small previews
}

export function Card({ card, hidden, className = "", mini = false }: CardProps) {
  if (hidden) {
    return (
      <div 
        className={`
          relative flex items-center justify-center 
          bg-blue-900 border-2 border-blue-400/50 rounded-lg shadow-xl
          bg-blue-900 border-2 border-blue-400/50 rounded-lg shadow-xl
          bg-[repeating-linear-gradient(45deg,_#1e3a8a_0,_#1e3a8a_10px,_#172554_10px,_#172554_20px)]
          ${mini ? 'w-8 h-12' : 'w-16 h-24 sm:w-20 sm:h-28'}
          ${className}
        `}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-black/20 rounded-lg pointer-events-none" />
        <span className={`${mini ? 'text-xs' : 'text-2xl'} text-blue-200/50`}>?</span>
      </div>
    );
  }

  return (
    <div 
      className={`
        relative flex flex-col items-center justify-between
        bg-white rounded-lg shadow-xl select-none overflow-hidden
        transition-transform hover:z-10
        ${mini ? 'w-8 h-12 p-1' : 'w-16 h-24 sm:w-20 sm:h-28 p-2'}
        ${className}
      `}
    >
      {/* Top Left Rank */}
      <div className={`self-start leading-none font-bold ${SUIT_COLORS[card.suit]} ${mini ? 'text-[10px]' : 'text-sm sm:text-lg'}`}>
        {RANK_MAP[card.rank]}
      </div>

      {/* Center Suit */}
      <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${SUIT_COLORS[card.suit]} ${mini ? 'text-base' : 'text-2xl sm:text-4xl'}`}>
        {SUIT_SYMBOLS[card.suit]}
      </div>

      {/* Bottom Right Rank (Rotated) */}
      <div className={`self-end leading-none font-bold transform rotate-180 ${SUIT_COLORS[card.suit]} ${mini ? 'text-[10px]' : 'text-sm sm:text-lg'}`}>
        {RANK_MAP[card.rank]}
      </div>

      {/* Gloss/Shine Effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-white/10 pointer-events-none" />
    </div>
  );
}
