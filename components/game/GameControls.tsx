import { Card } from "@/app/types";

interface GameControlsProps {
    isMyTurn: boolean;
    canSplit: boolean;
    canDouble: boolean;
    timeLeft: number;
    totalTime: number;
    onAction: (action: "Hit" | "Stand" | "Double" | "Split") => void;
}

export function GameControls({ isMyTurn, canSplit, canDouble, timeLeft, totalTime, onAction }: GameControlsProps) {
    if (!isMyTurn) return null; // Or show disabled state?

    return (
        <div className="flex flex-col gap-4 items-center animate-slide-up">
            {/* Timer Bar for visibility near controls */}
            <div className="w-full max-w-sm bg-gray-800 h-1.5 rounded-full overflow-hidden border border-gray-700">
                <div 
                    className={`h-full bg-gradient-to-r from-yellow-600 to-yellow-300 ${timeLeft === totalTime ? '' : 'transition-all duration-100 ease-linear'}`} 
                    style={{ width: `${(timeLeft / totalTime) * 100}%` }}
                />
            </div>

            <div className="flex gap-3 sm:gap-6">
                <button 
                    onClick={() => onAction("Hit")} 
                    className="
                        bg-green-600 hover:bg-green-500 text-white 
                        px-6 py-3 sm:px-8 sm:py-4 rounded-xl 
                        font-black text-lg sm:text-xl shadow-[0_4px_0_rgb(21,128,61)] active:shadow-none active:translate-y-1
                        transition-all hover:scale-105 cursor-pointer
                    "
                >
                    HIT
                </button>
                
                <button 
                    onClick={() => onAction("Stand")} 
                    className={`
                        bg-red-600 hover:bg-red-500 text-white 
                        px-6 py-3 sm:px-8 sm:py-4 rounded-xl 
                        font-black text-lg sm:text-xl shadow-[0_4px_0_rgb(185,28,28)] active:shadow-none active:translate-y-1
                        transition-all hover:scale-105 relative overflow-hidden cursor-pointer
                        ${timeLeft < 5 ? 'animate-pulse ring-4 ring-red-500/50' : ''}
                    `}
                >
                    STAND
                    {timeLeft < 10 && <span className="absolute top-1 right-1 text-[10px] opacity-80">{Math.ceil(timeLeft)}</span>}
                </button>
                
                <button 
                    onClick={() => onAction("Double")} 
                    disabled={!canDouble}
                    className={`
                        bg-blue-600 text-white 
                        px-6 py-3 sm:px-8 sm:py-4 rounded-xl 
                        font-black text-lg sm:text-xl shadow-[0_4px_0_rgb(29,78,216)] active:shadow-none active:translate-y-1
                        transition-all hover:scale-105 cursor-pointer
                        ${!canDouble ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:bg-blue-500'}
                    `}
                >
                    DOUBLE
                </button>
                
                {canSplit && (
                    <button 
                        onClick={() => onAction("Split")} 
                        className="
                            bg-purple-600 hover:bg-purple-500 text-white 
                            px-6 py-3 sm:px-8 sm:py-4 rounded-xl 
                            font-black text-lg sm:text-xl shadow-[0_4px_0_rgb(126,34,206)] active:shadow-none active:translate-y-1
                            transition-all hover:scale-105 border-2 border-purple-400/50 cursor-pointer
                        "
                    >
                        SPLIT
                    </button>
                )}
            </div>
            
            <div className="text-white/50 text-xs uppercase tracking-widest font-bold">
                Your Turn
            </div>
        </div>
    );
}
