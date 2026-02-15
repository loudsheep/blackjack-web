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
  style?: React.CSSProperties;
}

export function Card({ card, hidden, className = "", mini = false, style = {} }: CardProps) {
  if (hidden) {
    return (
      <div 
        style={style}
        className={`
          relative flex items-center justify-center 
          bg-background-dark border-2 border-primary/50 rounded-lg shadow-2xl overflow-hidden
          card-shadow
          animate-in zoom-in-50 duration-300 fill-mode-backwards
          ${mini ? 'w-8 h-12' : 'w-24 h-36'}
          ${className}
        `}
      >
        <div 
            className="w-full h-full opacity-30" 
            style={{ backgroundImage: 'repeating-linear-gradient(45deg, #0df280 0px, #0df280 2px, transparent 2px, transparent 10px)' }}
        ></div>
        <span className="absolute material-symbols-outlined text-primary text-3xl opacity-80">lock</span>
      </div>
    );
  }

  return (
    <div 
      style={style}
      className={`
        relative flex flex-col p-2
        bg-white rounded-lg border border-white/20 shadow-xl card-shadow
        transition-transform hover:z-10
        animate-in zoom-in-90 duration-300 fade-in slide-in-from-bottom-2 fill-mode-backwards
        ${mini ? 'w-8 h-12 p-1' : 'w-24 h-36 p-3'}
        ${className}
      `}
    >
      <div className={`flex flex-col text-left leading-none ${SUIT_COLORS[card.suit]}`}>
        <span className={`${mini ? 'text-xs' : 'text-3xl'} font-bold`}>{RANK_MAP[card.rank]}</span>
        <span className={`${mini ? 'text-[10px]' : 'text-2xl'} mt-[-2px]`}>{SUIT_SYMBOLS[card.suit]}</span>
      </div>
      
      {/* Center Suit */}
      <div className={`absolute inset-0 flex items-center justify-center select-none pointer-events-none ${SUIT_COLORS[card.suit]}`}>
          <span className={`${mini ? 'text-xl' : 'text-6xl'}`}>{SUIT_SYMBOLS[card.suit]}</span>
      </div>

      {/* Bottom Right Rank (Inverted) */}
      <div className={`absolute bottom-2 right-2 flex flex-col items-center rotate-180 leading-none ${SUIT_COLORS[card.suit]}`}>
        <span className={`${mini ? 'text-xs' : 'text-3xl'} font-bold`}>{RANK_MAP[card.rank]}</span>
        <span className={`${mini ? 'text-[10px]' : 'text-2xl'} mt-[-2px]`}>{SUIT_SYMBOLS[card.suit]}</span>
      </div>
    </div>
  );
}

