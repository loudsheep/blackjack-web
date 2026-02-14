"use client";

import { useBlackjack } from "../../hooks/useBlackjack";
import { Card, Suit, Rank, Player, GamePhase } from "../../types";
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
  Clubs: "text-gray-900 dark:text-gray-100",
  Spades: "text-gray-900 dark:text-gray-100",
};

const RANK_MAP: Record<Rank, string> = {
  Two: "2", Three: "3", Four: "4", Five: "5", Six: "6",
  Seven: "7", Eight: "8", Nine: "9", Ten: "10",
  Jack: "J", Queen: "Q", King: "K", Ace: "A",
};

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
    isConnected, gameState, myPlayerId, isAdmin, chatMessages, pendingRequests, toasts, connect, actions 
  } = useBlackjack();

  const [username, setUsername] = useState("");
  const [hasJoined, setHasJoined] = useState(false);
  const [betAmount, setBetAmount] = useState(10);
  const [chatInput, setChatInput] = useState("");
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  // Auto-scroll chat
  const chatEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      connect(roomId, username);
      setHasJoined(true);
    }
  };

  // derived state
  const myPlayer = gameState?.players.find(p => p.id === myPlayerId);
  const otherPlayers = gameState?.players.filter(p => p.id !== myPlayerId) || [];
  const isMyTurn = gameState?.current_turn_player_id === myPlayerId;
  const canBet = gameState?.phase === "Betting" && myPlayer?.status !== "Observing" && myPlayer?.status !== "PendingApproval";

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
                 // Defensive check: if hands[0] is an array, use it (nested hands), otherwise assume hands itself is the cards array
                 const firstHand = (p.hands && Array.isArray(p.hands[0])) ? p.hands[0] : (p.hands || []);
                 return (
                   <div key={p.id} className={`p-3 rounded-lg border ${gameState.current_turn_player_id === p.id ? 'border-yellow-400 bg-yellow-900/20' : 'border-transparent bg-green-900/40'}`}>
                       <div className="flex justify-between items-center mb-2">
                           <span className="font-bold text-sm truncate">{p.name} {p.is_admin && '👑'}</span>
                           <span className="text-xs text-yellow-200">${p.chips}</span>
                       </div>
                       <div className="flex -space-x-2 overflow-hidden py-2 h-16">
                           {Array.isArray(firstHand) && firstHand.map((c: any, i) => <div key={i} className="transform scale-75 origin-top-left"><CardDisplay card={c} /></div>)}
                           {(!firstHand || firstHand.length === 0) && <span className="text-xs text-white/30 italic">No cards</span>}
                       </div>
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
                <div className="flex gap-2 justify-center">
                    {gameState.dealer_hand.map((card, idx) => (
                        <CardDisplay key={idx} card={card} />
                    ))}
                    {/* Placeholder for hidden card if game active and dealer has 1? Backend usually handles this by sending truncated hand */}
                    {gameState.dealer_hand.length === 0 && (
                        <div className="w-16 h-24 border-2 border-dashed border-green-600/50 rounded-lg flex items-center justify-center text-green-600/50">
                            Empty
                        </div>
                    )}
                </div>
            </div>

            {/* Notification/Status Area */}
            <div className="flex-1 flex items-center justify-center">
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
                                const hands = myPlayer?.hands || [];
                                const currentHand = (hands.length > 0 && Array.isArray(hands[0])) ? hands[0] : hands;
                                if (!Array.isArray(currentHand)) return null; // Should be array of cards
                                
                                return currentHand.map((card: any, idx) => (
                                    <CardDisplay key={idx} card={card} />
                                ));
                            })()}
                            {(!myPlayer?.hands?.length) && <div className="text-white/30 self-center">Waiting for cards...</div>}
                        </div>

                        {/* Controls */}
                        {gameState.phase === "Betting" && (
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
                            <div className="flex gap-4">
                                <button onClick={() => actions.sendGameAction("Hit")} className="btn-action bg-green-600 px-6 py-2 rounded font-bold hover:scale-105 transition-transform">HIT</button>
                                <button onClick={() => actions.sendGameAction("Stand")} className="btn-action bg-red-600 px-6 py-2 rounded font-bold hover:scale-105 transition-transform">STAND</button>
                                <button onClick={() => actions.sendGameAction("Double")} className="btn-action bg-blue-600 px-6 py-2 rounded font-bold hover:scale-105 transition-transform">DOUBLE</button>
                                {/* Split only if logic permits, simplified here */}
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
         <div className="w-80 bg-gray-900 border-l border-gray-800 flex flex-col">
            
            {/* Admin Panel (Conditional) */}
            {isAdmin && showAdminPanel && (
               <div className="p-4 bg-gray-800 border-b border-gray-700 max-h-1/2 overflow-y-auto">
                   <h3 className="font-bold text-yellow-500 mb-2">Admin Controls</h3>
                   
                   {/* Pending Requests */}
                   {gameState.settings.approval_required && pendingRequests.length > 0 && (
                       <div className="mb-4">
                           <h4 className="text-xs uppercase text-gray-400 mb-2">Pending Requests</h4>
                           {pendingRequests.map(req => (
                               <div key={req.id} className="flex justify-between items-center bg-gray-700 p-2 rounded mb-1">
                                   <span className="text-sm">{req.name}</span>
                                   <button onClick={() => actions.approvePlayer(req.id)} className="text-xs bg-green-600 px-2 py-1 rounded">Approve</button>
                               </div>
                           ))}
                       </div>
                   )}

                   {/* Player Management */}
                   <div className="space-y-2">
                       <h4 className="text-xs uppercase text-gray-400">Manage Players</h4>
                       {gameState.players.map(p => (
                           <div key={p.id} className="flex justify-between items-center bg-gray-700 p-2 rounded text-xs gap-2">
                               <span className="truncate flex-1">{p.name}</span>
                               <button onClick={() => actions.updateBalance(p.id, 100)} className="text-green-400 hover:bg-gray-600 px-1 rounded">+100</button>
                               <button onClick={() => actions.kickPlayer(p.id)} className="text-red-400 hover:bg-gray-600 px-1 rounded">Kick</button>
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
            {gameState.settings.chat_enabled ? (
               <div className="flex-1 flex flex-col min-h-0">
                  <div className="p-3 bg-gray-800 text-xs font-bold text-gray-400 uppercase tracking-wider">Chat</div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {chatMessages.map((msg, i) => (
                          <div key={i} className="text-sm">
                              <span className="font-bold text-green-400">{msg.from}: </span>
                              <span className="text-gray-300 break-words">{msg.msg}</span>
                          </div>
                      ))}
                      <div ref={chatEndRef} />
                  </div>
                  <div className="p-3 bg-gray-800">
                      <input 
                        className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-green-500"
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
            ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
                    Chat disabled
                </div>
            )}
         </div>
      </div>

    </main>
  );
}
