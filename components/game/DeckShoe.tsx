import React from 'react';

interface DeckShoeProps {
    deckCount: number;
    cardsRemaining: number;
    className?: string;
}

export function DeckShoe({ deckCount, cardsRemaining, className = "" }: DeckShoeProps) {
    const totalCards = deckCount * 52;
    // Ensure we don't divide by zero and clamp percentage
    const percentage = totalCards > 0 ? Math.max(0, Math.min(100, (cardsRemaining / totalCards) * 100)) : 0;
    
    // Calculate approximate decks left for tooltip
    const decksLeft = (cardsRemaining / 52).toFixed(1);

    // Visual calculations for the stack height
    // We'll use a fixed max height for the "cards" inside the shoe
    const MAX_STACK_HEIGHT = 40; // px
    const currentStackHeight = (percentage / 100) * MAX_STACK_HEIGHT;

    return (
        <div className={`group relative flex flex-col items-center ${className}`} title={`~${decksLeft} decks remaining`}>
             {/* Shoe Container */}
            <div className="relative w-24 h-14 bg-gradient-to-b from-emerald-900 to-green-950 rounded-lg border border-emerald-400/20 shadow-xl overflow-hidden transform rotate-[-5deg]">
                
                {/* Shoe Opening/Lip */}
                <div className="absolute right-0 top-0 bottom-0 w-2 bg-black/40 border-l border-white/5"></div>

                {/* Cards Inside (Visual Representation) */}
                <div className="absolute left-2 bottom-2 right-4 flex items-end justify-center">
                    {/* The stack of cards */}
                    <div 
                        className="w-full bg-white rounded-sm shadow-inner transition-all duration-500 ease-out relative"
                        style={{ 
                            height: `${Math.max(2, currentStackHeight)}px`, // Always show at least a sliver if > 0
                            opacity: percentage > 0 ? 1 : 0.2
                        }}
                    >
                         {/* Card patterns/lines to look like a stack */}
                         <div className="absolute inset-0 w-full h-full opacity-20" 
                              style={{ backgroundImage: 'repeating-linear-gradient(0deg, #000, #000 1px, transparent 1px, transparent 2px)' }}>
                         </div>
                    </div>
                </div>

                {/* Glass reflection effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none"></div>
            </div>

            {/* Label/Tooltip on hover */}
            <div className="absolute -bottom-8 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap pointer-events-none border border-white/10 z-50">
                ~{decksLeft} Decks Left
            </div>
        </div>
    );
}
