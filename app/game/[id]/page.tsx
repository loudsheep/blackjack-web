"use client";

import { useBlackjack } from "../../hooks/useBlackjack";
import { Card, Suit, Rank, Player, GamePhase, GameSettings } from "../../types";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";

// --- UI Components ---

const SUIT_SYMBOLS: Record<Suit, string> = {
  Hearts: "♥",
  Diamonds: "♦",
  Clubs: "♣",
  Spades: "♠",
};

const SUIT_COLORS: Record<Suit, string> = {
  Hearts: "text-red-500",
  Diamonds: "text-red-500",
  Clubs: "text-black",
  Spades: "text-black",
};

const RANK_MAP: Record<Rank, string> = {
  Two: "2", Three: "3", Four: "4", Five: "5", Six: "6",
  Seven: "7", Eight: "8", Nine: "9", Ten: "10",
  Jack: "J", Queen: "Q", King: "K", Ace: "A",
};

const CARD_VALUES: Record<Rank, number> = {
  Two: 2, Three: 3, Four: 4, Five: 5, Six: 6,
  Seven: 7, Eight: 8, Nine: 9, Ten: 10,
  Jack: 10, Queen: 10, King: 10, Ace: 11,
};

function calculateHandValue(cards: Card[]): number {
    if (!cards || !Array.isArray(cards)) return 0;
    let value = 0;
    let aces = 0;
    for (const card of cards) {
        if (!card || !card.rank) continue; 
        if (card.rank === "Ace") aces++;
        value += CARD_VALUES[card.rank] || 0;
    }
    while (value > 21 && aces > 0) {
        value -= 10;
        aces--;
    }
    return value;
}

function CardDisplay({ card, hidden }: { card: Card, hidden?: boolean }) {
  if (hidden) {
    return (
      <div className="flex items-center justify-center w-12 h-16 sm:w-16 sm:h-24 bg-blue-900 border-2 border-blue-400 rounded-lg shadow-sm">
        <span className="text-2xl text-blue-200">?</span>
      </div>
    );
  }
  return (
    <div className={`
      flex flex-col items-center justify-center 
      w-12 h-16 sm:w-16 sm:h-24 
      bg-white border-2 border-gray-300 rounded-lg shadow-sm select-none
      ${SUIT_COLORS[card.suit]}
    `}>
      <span className="text-sm sm:text-lg font-bold">{RANK_MAP[card.rank]}</span>
      <span className="text-lg sm:text-2xl">{SUIT_SYMBOLS[card.suit]}</span>
    </div>
  );
}

// --- Main Page ---

export default function GameRoom() {
  const params = useParams();
  const roomId = params.id as string;
  const router = useRouter();
  
  const { 
    isConnected, gameState, myPlayerId, isAdmin, chatMessages, pendingRequests, toasts, latency, connect, connectionError, actions 
  } = useBlackjack();

  const [username, setUsername] = useState("");
  const [hasJoined, setHasJoined] = useState(false);
  const [betAmount, setBetAmount] = useState(10);
  const [chatInput, setChatInput] = useState("");
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  // Admin Settings State
  const [editingSettings, setEditingSettings] = useState<GameSettings | null>(null);

  // Auto-scroll chat
  const chatEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    // If not connected and not joined, check if we have creds to auto-join
    if (!isConnected && !hasJoined) {
        const storedAuth = localStorage.getItem(`blackjack_auth_${roomId}`);
        if (storedAuth) {
             connect(roomId);
             setHasJoined(true);
        }
    }
  }, [roomId, isConnected, hasJoined, connect]);

  useEffect(() => {
    if (isConnected && myPlayerId && gameState?.players.find(p => p.id === myPlayerId)) {
        setHasJoined(true);
    }
  }, [isConnected, myPlayerId, gameState]);

  const latestGameStateRef = useRef(gameState);
  useEffect(() => { latestGameStateRef.current = gameState; }, [gameState]);

  // Sync settings when they change from server
  useEffect(() => {
      if (gameState?.settings) {
          setEditingSettings(gameState.settings);
      }
  }, [gameState?.settings]);
  
  // Derived state (moved up for use in effects)
  const myPlayer = gameState?.players.find(p => p.id === myPlayerId);
  // Calculate active hand details for timer reset
  const activeHandIndex = myPlayer?.active_hand_index ?? 0;
  const activeHandObj = myPlayer?.hands?.[activeHandIndex];
  const activeHandCardsCount = activeHandObj 
      ? (Array.isArray(activeHandObj) ? activeHandObj.length : (activeHandObj as any).cards?.length) 
      : 0;
  const totalHandsCount = myPlayer?.hands?.length || 0;

  // Turn Timeout Logic
  const hasAutoStoodRef = useRef(false);

  useEffect(() => {
     // Reset auto-stood flag when turn changes
     if (gameState?.current_turn_player_id !== myPlayerId) {
         hasAutoStoodRef.current = false;
     }

     // Only run timer if it is MY turn
     if (gameState?.phase === "Playing" && gameState.current_turn_player_id === myPlayerId) {
         const timeoutSec = parseInt(process.env.NEXT_PUBLIC_TURN_TIMEOUT_SECONDS || "30");
         setTimeLeft(timeoutSec);
         
         const timer = setInterval(() => {
             setTimeLeft(prev => {
                 const newVal = prev - 0.1;
                 if (newVal <= 0) return 0;
                 return newVal;
             });
         }, 100);
         return () => clearInterval(timer);
     } else {
         setTimeLeft(0);
     }
  }, [gameState?.phase, gameState?.current_turn_player_id, myPlayerId, activeHandCardsCount, totalHandsCount]);

  // Separate effect to handle the timeout action when timeLeft hits 0
  useEffect(() => {
    if (timeLeft === 0 && gameState?.phase === "Playing" && gameState?.current_turn_player_id === myPlayerId && !hasAutoStoodRef.current) {
         // Use a small delay to ensure the UI updates to 0 and the user sees it
         const timeoutId = setTimeout(() => {
             // Double check state is still valid after the delay
             if (latestGameStateRef.current?.current_turn_player_id === myPlayerId && !hasAutoStoodRef.current) {
                 console.log("Auto-standing due to timeout");
                 hasAutoStoodRef.current = true;
                 actions.sendGameAction("Stand");
             }
         }, 1000);
         return () => clearTimeout(timeoutId);
    }
  }, [timeLeft, gameState?.phase, gameState?.current_turn_player_id, myPlayerId, actions]);


  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      connect(roomId, username);
      setHasJoined(true);
    }
  };

  // derived state (other players, etc) - myPlayer moved up
  const otherPlayers = gameState?.players.filter(p => p.id !== myPlayerId) || [];
  const isMyTurn = gameState?.current_turn_player_id === myPlayerId;
  const canBet = gameState?.phase === "Betting" && myPlayer?.status !== "Observing" && myPlayer?.status !== "PendingApproval";

  if (connectionError) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white font-sans p-4">
            <div className="bg-gray-800 p-8 rounded-xl shadow-2xl max-w-lg w-full text-center border border-red-500/30 animate-fade-in">
                <div className="text-6xl mb-6">🚫</div>
                <h2 className="text-3xl font-bold text-red-500 mb-2">{connectionError.title}</h2>
                <p className="text-gray-300 text-lg mb-6">{connectionError.msg}</p>
                 <div className="bg-black/30 p-4 rounded-lg text-sm text-gray-400 mb-6 text-left">
                    <p className="mb-2"><strong>Why am I seeing this?</strong></p>
                    <ul className="list-disc list-inside space-y-1">
                        <li>The room might be full (Max Players reached).</li>
                        <li>The game ID might be invalid.</li>
                        <li>You might be blocked from re-joining.</li>
                    </ul>
                </div>
                <button onClick={() => router.push('/')} className="bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg font-bold transition-colors w-full">
                    Return to Home
                </button>
            </div>
        </div>
    );
  }

  if (!hasJoined || !isConnected ) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-900 p-4">
        <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full">
          <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">Join Room: {roomId}</h2>
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Username</label>
              <input 
                autoFocus
                required
                className="mt-1 block w-full rounded-md border text-black border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your name"
              />
            </div>
            <button 
              type="submit"
              className="w-full rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
            >
              Join Table
            </button>
            <button 
               type="button"
               onClick={() => router.push('/')}
               className="w-full text-sm text-gray-500 hover:text-gray-700 mt-2"
            >
              Back to Home
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!gameState) return <div className="text-white text-center mt-20">Loading game state...</div>;

  return (
    <main className="min-h-screen bg-green-900 text-white font-sans overflow-hidden flex flex-col">
      
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
         {toasts.map(toast => (
             <div key={toast.id} className={`px-4 py-2 rounded shadow-lg text-sm animate-fade-in ${toast.type === 'error' ? 'bg-red-600' : 'bg-blue-600'}`}>
                 {toast.msg}
             </div>
         ))}
      </div>

      {/* Header */}
      <header className="flex justify-between items-center p-4 bg-green-950/50 backdrop-blur-sm border-b border-green-800/50 h-16">
        <div className="flex items-center gap-4">
           <h1 className="font-bold text-lg text-green-100">Room: <span className="font-mono text-yellow-300">{roomId}</span></h1>
           <span className="text-sm bg-green-800 px-2 py-1 rounded">Phase: {gameState.phase}</span>
        </div>
        
        <div className="flex gap-4 items-center">
            {latency !== null && (
                 <div className={`text-xs px-2 py-1 rounded ${latency < 100 ? 'bg-green-800 text-green-200' : latency < 300 ? 'bg-yellow-800 text-yellow-200' : 'bg-red-800 text-red-200'}`}>
                     Ping: {latency}ms
                 </div>
            )}
            <button 
                onClick={() => { actions.disconnect(); router.push('/'); }} 
                className="px-3 py-1 bg-red-800/50 hover:bg-red-700/50 rounded text-sm text-red-200 border border-red-700/50"
            >
                Leave
            </button>
            {isAdmin && (
                <button
                    onClick={() => setShowAdminPanel(!showAdminPanel)}
                    className="px-3 py-1 bg-yellow-600 hover:bg-yellow-500 rounded text-sm font-bold"
                >
                    {showAdminPanel ? "Hide Admin" : "Admin Panel"}
                </button>
            )}
            <div className="text-right">
                <div className="font-bold">{myPlayer?.name || username}</div>
                <div className="text-xs text-yellow-300">Chips: {myPlayer?.chips || 0}</div>
            </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
         
         {/* Left Side: Other Players */}
         <div className="w-64 bg-black/20 p-4 overflow-y-auto border-r border-green-800/30 hidden md:block">
            <h3 className="text-xs font-bold uppercase text-green-300 mb-4">Players ({gameState.players.length})</h3>
            <div className="space-y-4">
               {otherPlayers.map(p => {
                 // Defensive check: access hands array. Hands are objects { cards: [...], ... }
                 // We want the cards from the first hand for visualization if we only show one
                 const hands = p.hands || [];
                 // Check if hands[0] exists and has a 'cards' property (new structure)
                 // or if hands[0] is an array (old structure option)
                 let cards: any[] = [];
                 
                 // Used for keying the animation to reset on action
                 const activeHandIdx = p.active_hand_index || 0;
                 const activeHand = hands[activeHandIdx];
                 let activeHandCardsCount = 0;

                 if (hands.length > 0) {
                     // For display, we might just show first hand or active hand? 
                     // The original code was showing hands[0]. Let's stick to that for now or improve it?
                     // The code below visualizes "cards" which it sets to hands[0].
                     
                     if (Array.isArray(hands[0])) {
                         cards = hands[0];
                     } else if (hands[0] && typeof hands[0] === 'object' && 'cards' in hands[0]) {
                         cards = hands[0].cards;
                     }
                     
                     // Calculate active hand count for the timer key
                     if (activeHand) {
                        if (Array.isArray(activeHand)) {
                            activeHandCardsCount = activeHand.length;
                        } else if (typeof activeHand === 'object' && 'cards' in activeHand) {
                            activeHandCardsCount = activeHand.cards.length;
                        }
                     }
                 }

                 return (
                   <div key={p.id} className={`p-3 rounded-lg border relative overflow-hidden transition-colors duration-300
                       ${!p.is_connected ? 'opacity-50 grayscale bg-gray-900 border-gray-700' : 
                         gameState.current_turn_player_id === p.id ? 'border-yellow-400 bg-yellow-900/20 shadow-glow-yellow' : 'border-transparent bg-green-900/40'}
                   `}>
                       {/* Turn Countdown Progress Bar */}
                       {gameState.current_turn_player_id === p.id && (
                           <div 
                              key={`${p.id}-turn-timer-${activeHandCardsCount}-${hands.length}`} 
                              className="absolute top-0 left-0 h-1 bg-yellow-400 animate-shrink" 
                              style={{ 
                                width: '100%', 
                                animationDuration: `${process.env.NEXT_PUBLIC_TURN_TIMEOUT_SECONDS || 30}s` 
                              }} 
                           />
                       )}

                       <div className="flex justify-between items-center mb-2">
                           <span className="font-bold text-sm truncate flex items-center gap-1">
                               {p.name} 
                               {p.is_admin && '👑'}
                               {!p.is_connected && <span className="text-[10px] text-red-400 uppercase border border-red-500/50 px-1 rounded">Offline</span>}
                           </span>
                           <span className="text-xs text-yellow-200">${p.chips}</span>
                       </div>
                       <div className="flex -space-x-2 overflow-hidden py-2 h-16">
                           {cards.map((c: any, i) => <div key={i} className="transform scale-75 origin-top-left"><CardDisplay card={c} /></div>)}
                           {cards.length === 0 && p.status !== 'Sitting' && !(!p.is_connected) && <span className="text-xs text-white/30 italic">No cards</span>}
                           {p.status === 'Sitting' && <span className="text-xs text-white/30 italic">Sitting out</span>}
                       </div>
                       {cards.length > 0 && <div className="text-xs font-bold text-yellow-300 text-center -mt-2 mb-1">Value: {calculateHandValue(cards)}</div>}
                       {/* Show Hand Result/Status if defined and not just 'Playing' */}
                       {hands.length > 0 && (hands[0] as any).status && (hands[0] as any).status !== 'Playing' && (
                           <div className={`text-xs text-center font-bold uppercase tracking-wider mb-1
                               ${['Won', 'Blackjack'].includes((hands[0] as any).status) ? 'text-green-400' : 
                                 ['Lost', 'Busted'].includes((hands[0] as any).status) ? 'text-red-400' : 
                                 'text-gray-400'}`}>
                               {(hands[0] as any).status}
                           </div>
                       )}
                       <div className="text-xs text-center mt-1 text-green-200 capitalize">{p.status}</div>
                   </div>
                 );
               })}
            </div>
         </div>

         {/* Center: Game Table */}
         <div className="flex-1 flex flex-col relative bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-green-800 to-green-950">
            
            {/* Dealer Area */}
            <div className="flex flex-col items-center justify-center py-8">
                <div className="mb-2 text-green-200 font-bold uppercase tracking-wider text-sm">Dealer</div>
                <div className="flex gap-2 justify-center mb-2">
                    {gameState.dealer_hand.map((card, idx) => (
                        <CardDisplay key={idx} card={card} />
                    ))}
                    
                    {/* Show hidden card back if dealer has exactly 1 card */}
                    {gameState.dealer_hand.length === 1 && (
                         <CardDisplay card={gameState.dealer_hand[0]} hidden={true} />
                    )}

                    {/* Placeholder for empty hand */}
                    {gameState.dealer_hand.length === 0 && (
                        <div className="w-16 h-24 border-2 border-dashed border-green-600/50 rounded-lg flex items-center justify-center text-green-600/50">
                            Empty
                        </div>
                    )}
                </div>
                {gameState.dealer_hand.length > 0 && (
                   <div className="bg-black/40 px-3 py-1 rounded-full text-sm font-bold text-yellow-300 border border-yellow-600/30">
                       {calculateHandValue(gameState.dealer_hand)}
                   </div>
                )}
            </div>

            {/* Notification/Status Area */}
            <div className="flex-1 flex items-center justify-center relative">
                 {gameState.phase === "GameOver" && (
                     <div className="bg-black/50 p-6 rounded-xl backdrop-blur text-center animate-bounce">
                         <h2 className="text-3xl font-bold text-yellow-400">Round Over</h2>
                         {isAdmin && (
                            <button onClick={actions.nextRound} className="mt-4 bg-green-600 hover:bg-green-500 px-6 py-2 rounded-full font-bold shadow-lg">
                                Next Round
                            </button>
                         )}
                     </div>
                 )}
                 {gameState.phase === "Payout" && isAdmin && (
                    <div className="bg-black/50 p-6 rounded-xl backdrop-blur text-center relative z-20">
                        <h2 className="text-2xl font-bold text-yellow-400 mb-4">Payouts Complete</h2>
                        <button onClick={actions.nextRound} className="bg-green-600 hover:bg-green-500 px-6 py-2 rounded-full font-bold shadow-lg animate-pulse">
                            Start Next Round
                        </button>
                    </div>
                 )}
                 {gameState.phase === "Betting" && isAdmin && (
                    <div className="absolute top-10 left-1/2 transform -translate-x-1/2 z-20">
                        <button onClick={actions.startGame} className="bg-yellow-600 hover:bg-yellow-500 px-6 py-2 rounded-full font-bold shadow-lg whitespace-nowrap">
                            Start Round (Deal)
                        </button>
                    </div>
                 )}
                 {gameState.phase === "Lobby" && (
                     <div className="text-center">
                         <h2 className="text-2xl font-bold mb-4">Waiting to start...</h2>
                         {isAdmin && <button onClick={actions.startGame} className="bg-yellow-600 hover:bg-yellow-500 px-8 py-3 rounded-full font-bold shadow-lg">Start Game</button>}
                     </div>
                 )}
            </div>

            {/* My Player Area */}
            <div className="pb-8 px-4">
                <div className="max-w-xl mx-auto bg-black/30 p-6 rounded-2xl border border-green-600/30 backdrop-blur-sm relative">
                    {isMyTurn && <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-black font-bold px-4 py-1 rounded-full text-xs animate-pulse">YOUR TURN</div>}
                    
                    <div className="flex flex-col items-center">
                        <div className="flex gap-4 justify-center mb-6 min-h-[100px]">
                            {(() => {
                                // Defensive logic for hand
                                const hands: any[] = myPlayer?.hands || [];
                                
                                // Determine active hand or just first hand
                                const activeIndex = myPlayer?.active_hand_index ?? 0;
                                const activeHandObj = hands[activeIndex];

                                let cards: any[] = [];
                                
                                if (activeHandObj) {
                                    if (Array.isArray(activeHandObj)) {
                                         // Old structure: hands is array of arrays of cards
                                         cards = activeHandObj;
                                    } else if (activeHandObj && typeof activeHandObj === 'object' && 'cards' in activeHandObj) {
                                         // New structure: Hand object with cards property
                                         cards = activeHandObj.cards;
                                    }
                                }
                                
                                return cards.map((card: any, idx) => (
                                    <div key={idx} className="transform hover:-translate-y-4 transition-transform duration-200">
                                       <CardDisplay card={card} />
                                    </div>
                                ));
                            })()}
                            {/* Hide waiting message if sitting out */}
                            {(!myPlayer?.hands?.length) && myPlayer?.status !== 'Sitting' && myPlayer?.status !== 'Spectating'  && <div className="text-white/30 self-center">Waiting for cards...</div>}
                            {myPlayer?.status === 'Sitting'  && gameState.phase != 'Payout' && <div className="text-yellow-500/50 self-center font-bold uppercase tracking-widest text-sm">Sitting Out</div>}
                        </div>

                        {(() => {
                             const hands: any[] = myPlayer?.hands || [];
                             const activeIndex = myPlayer?.active_hand_index ?? 0;
                             const activeHandObj = hands[activeIndex];
                             let cards: any[] = [];
                             if (activeHandObj) {
                                 if (Array.isArray(activeHandObj)) cards = activeHandObj;
                                 else if (activeHandObj && typeof activeHandObj === 'object' && 'cards' in activeHandObj) cards = activeHandObj.cards;
                             }
                             
                             if (cards.length > 0) {
                                 return (
                                     <>
                                         <div className="mb-2 bg-black/50 px-4 py-1 rounded-full text-xl font-bold text-yellow-300 border border-yellow-500/50">
                                             {calculateHandValue(cards)}
                                         </div>
                                         {(activeHandObj as any)?.status && (activeHandObj as any).status !== 'Playing' && (
                                             <div className={`text-2xl font-black uppercase tracking-widest animate-pulse
                                                 ${['Won', 'Blackjack'].includes((activeHandObj as any).status) ? 'text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.5)]' : 
                                                   ['Lost', 'Busted'].includes((activeHandObj as any).status) ? 'text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 
                                                   'text-gray-300'}`}>
                                                 {(activeHandObj as any).status}
                                             </div>
                                         )}
                                     </>
                                 );
                             }
                             return null;
                        })()}

                        {/* Controls */}
                        {gameState.phase === "Betting" && myPlayer && 
                            // Only show betting controls if player is not spectating or pending
                            !['Spectating', 'PendingApproval'].includes(myPlayer.status) && (
                           <div className="flex gap-2 items-center">
                               <input 
                                  type="number" 
                                  min="1" 
                                  max={myPlayer?.chips} 
                                  value={betAmount} 
                                  onChange={e => setBetAmount(parseInt(e.target.value))}
                                  className="w-24 px-3 py-2 bg-black/40 border border-green-500/50 rounded text-center font-bold"
                               />
                               <button 
                                  onClick={() => actions.placeBet(betAmount)} 
                                  className="bg-yellow-600 hover:bg-yellow-500 px-6 py-2 rounded font-bold shadow-lg"
                               >
                                  PLACE BET
                               </button>
                           </div>
                        )}

                        {gameState.phase === "Playing" && isMyTurn && (
                            <div className="flex flex-col gap-2 items-center">
                                <div className="w-full bg-gray-700 h-1.5 rounded-full overflow-hidden">
                                     <div 
                                        className={`h-full bg-yellow-400 ${timeLeft === parseInt(process.env.NEXT_PUBLIC_TURN_TIMEOUT_SECONDS || "30") ? '' : 'transition-all duration-100 ease-linear'}`} 
                                        style={{ width: `${(timeLeft / (parseInt(process.env.NEXT_PUBLIC_TURN_TIMEOUT_SECONDS || "30"))) * 100}%` }}
                                     />
                                </div>
                                <div className="flex gap-4">
                                    <button onClick={() => actions.sendGameAction("Hit")} className="btn-action bg-green-600 px-6 py-2 rounded font-bold hover:scale-105 transition-transform">HIT</button>
                                    <button 
                                        onClick={() => actions.sendGameAction("Stand")} 
                                        className={`btn-action bg-red-600 px-6 py-2 rounded font-bold hover:scale-105 transition-transform relative overflow-hidden ${timeLeft < 5 ? 'animate-pulse ring-4 ring-red-500/50' : ''}`}
                                    >
                                        STAND
                                        {timeLeft < 10 && <span className="absolute top-0 right-1 text-[10px]">{Math.ceil(timeLeft)}</span>}
                                    </button>
                                    <button onClick={() => actions.sendGameAction("Double")} className="btn-action bg-blue-600 px-6 py-2 rounded font-bold hover:scale-105 transition-transform">DOUBLE</button>
                                    
                                    {/* Split Button Logic */}
                                    {(() => {
                                        if (!activeHandObj) return null;
                                        
                                        // Handle both hand structures (array or object)
                                        let currentCards: Card[] = [];
                                        let currentBet = 0;
                                        
                                        if (Array.isArray(activeHandObj)) {
                                            currentCards = activeHandObj;
                                            // Assume default bet if structure doesn't support it, or derive from logic
                                            currentBet = 0; 
                                        } else if (typeof activeHandObj === 'object') {
                                            currentCards = (activeHandObj as any).cards || [];
                                            currentBet = (activeHandObj as any).bet || 0;
                                        }

                                        // Check split conditions:
                                        // 1. Exactly 2 cards
                                        // 2. Ranks match exactly (e.g. Jack & Jack, not Jack & Queen)
                                        // 3. User has enough chips to cover the new bet
                                        const canSplit = currentCards.length === 2 && 
                                                         currentCards[0].rank === currentCards[1].rank &&
                                                         (myPlayer?.chips || 0) >= currentBet;

                                        if (canSplit) {
                                            return (
                                                <button 
                                                    onClick={() => actions.sendGameAction("Split")} 
                                                    className="btn-action bg-purple-600 px-6 py-2 rounded font-bold hover:scale-105 transition-transform border border-purple-400"
                                                >
                                                    SPLIT
                                                </button>
                                            );
                                        }
                                        return null;
                                    })()}
                                </div>
                            </div>
                        )}
                         
                        <div className="mt-4 text-sm text-green-300">
                            Status: <span className="font-bold text-white capitalize">{myPlayer?.status || "Spectating"}</span>
                        </div>
                    </div>
                </div>
            </div>

         </div>

         {/* Right Side: Chat & Admin */}
         {(isAdmin || gameState.settings.chat_enabled) && (
         <div className="w-80 bg-gray-900 border-l border-gray-800 flex flex-col min-w-[320px]">
            
            {/* Admin Panel (Conditional) */}
            {isAdmin && showAdminPanel && (
               <div className="p-4 bg-gray-800 border-b border-gray-700 max-h-[60%] overflow-y-auto custom-scrollbar">
                   <h3 className="font-bold text-yellow-500 mb-4 border-b border-yellow-500/30 pb-2">Admin Controls</h3>
                   
                   {/* Game Settings Form */}
                   <div className="mb-6 bg-black/40 p-3 rounded">
                       <h4 className="text-xs uppercase text-gray-400 mb-3 font-bold">Game Settings</h4>
                       {editingSettings && (
                           <div className="space-y-3 text-sm">
                               <div>
                                   <label className="block text-gray-500 text-xs mb-1">Initial Chips</label>
                                   <input 
                                       type="number" 
                                       className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1"
                                       value={editingSettings.initial_chips}
                                       onChange={(e) => setEditingSettings({...editingSettings, initial_chips: parseInt(e.target.value)})}
                                   />
                               </div>
                               <div>
                                   <label className="block text-gray-500 text-xs mb-1">Max Players</label>
                                   <input 
                                       type="number" 
                                       className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1"
                                       value={editingSettings.max_players}
                                       onChange={(e) => setEditingSettings({...editingSettings, max_players: parseInt(e.target.value)})}
                                   />
                               </div>
                               <div className="flex items-center gap-2">
                                   <input 
                                       type="checkbox" 
                                       id="chk_approval"
                                       checked={editingSettings.approval_required}
                                       onChange={(e) => setEditingSettings({...editingSettings, approval_required: e.target.checked})}
                                   />
                                   <label htmlFor="chk_approval" className="text-gray-300">Approval Required</label>
                               </div>
                               <div className="flex items-center gap-2">
                                   <input 
                                       type="checkbox" 
                                       id="chk_chat"
                                       checked={editingSettings.chat_enabled}
                                       onChange={(e) => setEditingSettings({...editingSettings, chat_enabled: e.target.checked})}
                                   />
                                   <label htmlFor="chk_chat" className="text-gray-300">Chat Enabled</label>
                               </div>
                               <button 
                                   onClick={() => actions.updateSettings(editingSettings)}
                                   className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-bold py-1 rounded mt-2 transition-colors"
                               >
                                   Update Settings
                               </button>
                           </div>
                       )}
                   </div>

                   {/* Pending Requests */}
                   {(() => {
                       // We derive pending requests directly from the player list to ensure it persists 
                       // across reloads and syncs with game state, rather than relying on transient events.
                       const pendingPlayers = gameState.players.filter(p => p.status === 'PendingApproval');
                       
                       if (gameState.settings.approval_required && pendingPlayers.length > 0) {
                           return (
                               <div className="mb-4 p-2 bg-yellow-900/20 border border-yellow-600/30 rounded">
                                   <h4 className="text-xs uppercase text-yellow-500 font-bold mb-2 flex items-center gap-1">
                                       <span className="animate-pulse">●</span> Pending Requests ({pendingPlayers.length})
                                   </h4>
                                   {pendingPlayers.map(p => (
                                       <div key={p.id} className="flex justify-between items-center bg-black/40 p-2 rounded mb-1 border border-gray-700">
                                           <div className="flex flex-col">
                                                <span className="text-sm font-bold text-white">{p.name}</span>
                                                <span className="text-[10px] text-gray-500">{p.id.split('-')[0]}...</span>
                                           </div>
                                           <div className="flex gap-2">
                                                <button 
                                                    onClick={() => actions.approvePlayer(p.id)} 
                                                    className="text-xs bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded font-bold transition-colors"
                                                >
                                                    Approve
                                                </button>
                                                <button 
                                                    onClick={() => actions.kickPlayer(p.id)} 
                                                    className="text-xs bg-red-900/50 hover:bg-red-800 text-red-200 border border-red-800 px-2 py-1 rounded transition-colors"
                                                >
                                                    Deny
                                                </button>
                                           </div>
                                       </div>
                                   ))}
                               </div>
                           );
                       }
                       return null; 
                   })()}

                   {/* Player Management */}
                   <div className="space-y-2">
                       <h4 className="text-xs uppercase text-gray-400">Manage Players</h4>
                       {gameState.players.map(p => (
                           <div key={p.id} className="flex justify-between items-center bg-gray-700 p-2 rounded text-xs gap-2">
                               <span className="truncate flex-1">{p.name}</span>
                               <button onClick={() => actions.updateBalance(p.id, 100)} className="text-green-400 hover:bg-gray-600 px-1 rounded">+100</button>
                               {p.id !== myPlayerId && (
                                    <button onClick={() => actions.kickPlayer(p.id)} className="text-red-400 hover:bg-gray-600 px-1 rounded">Kick</button>
                               )}
                           </div>
                       ))}
                   </div>
                   
                   <div className="mt-4 pt-4 border-t border-gray-700">
                        <button onClick={actions.startGame} className="w-full mb-2 bg-blue-600 hover:bg-blue-500 py-1 rounded text-sm">Force Start Game</button>
                        <button onClick={actions.nextRound} className="w-full bg-blue-600 hover:bg-blue-500 py-1 rounded text-sm">Force Next Round</button>
                   </div>
               </div>
            )}

            {/* Chat Area */}
            {gameState.settings.chat_enabled && (
               <div className="flex-1 flex flex-col min-h-0 border-t border-gray-700/50">
                  <div className="p-3 bg-gray-800 text-xs font-bold text-gray-400 uppercase tracking-wider flex justify-between items-center">
                      <span>Chat</span>
                      <span className="text-[10px] bg-gray-700 px-1 rounded">Live</span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                      {chatMessages.map((msg, i) => (
                          <div key={i} className="text-sm animate-fade-in">
                              <span className="font-bold text-green-400">{msg.from}: </span>
                              <span className="text-gray-300 break-words">{msg.msg}</span>
                          </div>
                      ))}
                      <div ref={chatEndRef} />
                  </div>
                  <div className="p-3 bg-gray-800 border-t border-gray-700">
                      <input 
                        className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-green-500 text-gray-200 placeholder-gray-500 transition-colors"
                        placeholder="Type a message..."
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && chatInput.trim()) {
                                actions.sendChat(chatInput);
                                setChatInput("");
                            }
                        }}
                      />
                  </div>
               </div>
            )}
         </div>
         )}
      </div>

    </main>
  );
}
