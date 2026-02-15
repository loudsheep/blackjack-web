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
  Clubs: "text-black",
  Spades: "text-black",
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
          bg-background-dark border-2 border-primary/20 rounded-lg shadow-2xl overflow-hidden
          card-shadow
          ${mini ? 'w-8 h-12' : 'w-24 h-36'}
          ${className}
        `}
      >
        <div 
            className="w-full h-full opacity-30" 
            style={{ backgroundImage: 'repeating-linear-gradient(45deg, #0df280 0px, #0df280 2px, transparent 2px, transparent 10px)' }}
        ></div>
        <span className="absolute material-symbols-outlined text-primary text-3xl opacity-60">lock</span>
      </div>
    );
  }

  return (
    <div 
      className={`
        relative flex flex-col p-2 text-black
        bg-white rounded-lg border-2 border-white/10 shadow-2xl card-shadow
        transition-transform hover:z-10
        ${mini ? 'w-8 h-12 p-1 text-[10px]' : 'w-24 h-36 p-2'}
        ${className}
      `}
    >
      <div className={`flex flex-col text-left leading-tight ${SUIT_COLORS[card.suit]}`}>
        <span className={`${mini ? 'text-xs' : 'text-xl'} font-black`}>{RANK_MAP[card.rank]}</span>
        <span className={`${mini ? 'text-[10px]' : 'text-lg'}`}>{SUIT_SYMBOLS[card.suit]}</span>
      </div>
      
      <div className={`absolute inset-0 flex items-center justify-center opacity-10 select-none pointer-events-none ${SUIT_COLORS[card.suit]} ${mini ? 'text-xl' : 'text-4xl'}`}>
          {SUIT_SYMBOLS[card.suit]}
      </div>
    </div>
  );
}
