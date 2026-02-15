"use client";

import { useBlackjack } from "../../hooks/useBlackjack";
import { GameSettings } from "../../types";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";

// Components
import { Lobby } from "@/components/game/Lobby";
import { DealerArea } from "@/components/game/DealerArea";
import { PlayerSpot } from "@/components/game/PlayerSpot";
import { GameControls } from "@/components/game/GameControls";
import { Chat } from "@/components/game/Chat";
// import { PayoutModal } from "@/components/game/PayoutModal"; // Removed per user request
import { AdminPanel } from "@/components/game/AdminPanel"; // New Import

export default function GameRoom() {
  const params = useParams();
  const roomId = params.id as string;
  const router = useRouter();
  
  const { 
    isConnected, gameState, myPlayerId, isAdmin, chatMessages, 
    toasts, latency, connect, connectionError, actions 
  } = useBlackjack();

  const [hasJoined, setHasJoined] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  // --- Auto-Join Logic ---
  useEffect(() => {
    if (!isConnected && !hasJoined) {
        const storedAuth = localStorage.getItem(`blackjack_auth_${roomId}`);
        if (storedAuth) {
             const { id, secret } = JSON.parse(storedAuth); 
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

  // --- Turn Timer Logic ---
  const myPlayer = gameState?.players.find(p => p.id === myPlayerId);
  const latestGameStateRef = useRef(gameState);
  useEffect(() => { latestGameStateRef.current = gameState; }, [gameState]);
  const hasAutoStoodRef = useRef(false);

  useEffect(() => {
     if (gameState?.current_turn_player_id !== myPlayerId) {
         hasAutoStoodRef.current = false;
     }

     if (gameState?.phase === "Playing" && gameState.current_turn_player_id === myPlayerId) {
         const timeoutSec = parseInt(process.env.NEXT_PUBLIC_TURN_TIMEOUT_SECONDS || "30");
         setTimeLeft(timeoutSec);
         
         const timer = setInterval(() => {
             setTimeLeft(prev => {
                 if (prev <= 0) return 0;
                 return prev - 0.1;
             });
         }, 100);
         return () => clearInterval(timer);
     } else {
         setTimeLeft(0);
     }
  }, [gameState?.phase, gameState?.current_turn_player_id, myPlayerId, myPlayer?.hands, myPlayer?.hands?.length]); // Added hand dependencies to reset on Hit/Split

  // Auto-stand
  useEffect(() => {
    if (timeLeft === 0 && gameState?.phase === "Playing" && gameState?.current_turn_player_id === myPlayerId && !hasAutoStoodRef.current) {
         const timeoutId = setTimeout(() => {
             if (latestGameStateRef.current?.current_turn_player_id === myPlayerId && !hasAutoStoodRef.current) {
                 console.log("Auto-standing due to timeout");
                 hasAutoStoodRef.current = true;
                 actions.sendGameAction("Stand");
             }
         }, 1000);
         return () => clearTimeout(timeoutId);
    }
  }, [timeLeft, gameState?.phase, gameState?.current_turn_player_id, myPlayerId, actions]);

  // --- Handlers ---
  const handleJoin = (username: string) => {
      connect(roomId, username);
      setHasJoined(true);
  };

  const handleGameAction = (action: "Hit" | "Stand" | "Double" | "Split") => {
      actions.sendGameAction(action);
  };

  // --- Render ---

  if (connectionError) {
      return <Lobby roomId={roomId} onJoin={handleJoin} connectionError={connectionError} />;
  }

  if (!hasJoined || !isConnected) {
      return <Lobby roomId={roomId} onJoin={handleJoin} />;
  }

  if (!gameState) {
      return (
          <div className="min-h-screen bg-black flex items-center justify-center text-yellow-500 animate-pulse font-mono">
              CONNECTING TO CASINO...
          </div>
      );
  }

  const otherPlayers = gameState.players.filter(p => p.id !== myPlayerId);
  const isMyTurn = gameState.current_turn_player_id === myPlayerId;

  // Helper for split logic
  const activeHand = myPlayer?.hands?.[myPlayer.active_hand_index || 0];
  const activeHandCards = Array.isArray(activeHand) ? activeHand : (activeHand?.cards || []);
  const activeHandBet = !Array.isArray(activeHand) ? activeHand?.bet || 0 : 0;
  
  const canSplit = activeHandCards.length === 2 && 
                   activeHandCards[0].rank === activeHandCards[1].rank &&
                   (myPlayer?.chips || 0) >= activeHandBet;
                   
  const canDouble = (myPlayer?.chips || 0) >= activeHandBet && activeHandCards.length === 2;

  return (
    <main className="min-h-screen relative overflow-hidden font-sans select-none bg-black text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-green-900 via-green-950 to-black z-0 pointer-events-none" />
        
        {/* Toast Container */}
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 flex flex-col items-center gap-2 w-full max-w-md pointer-events-none">
             {toasts.map(toast => (
                 <div key={toast.id} className={`px-6 py-3 rounded-full shadow-2xl text-sm font-bold animate-fade-in-down border border-white/10 ${toast.type === 'error' ? 'bg-red-600/90 text-white' : 'bg-blue-600/90 text-white'}`}>
                     {toast.msg}
                 </div>
             ))}
        </div>

        {/* Header */}
        <header className="relative z-20 flex justify-between items-center p-4 bg-black/20 backdrop-blur-sm border-b border-white/5 h-16">
            <div className="flex items-center gap-4">
                <div className="text-yellow-500 font-black text-xl tracking-tighter">
                   ♠️ VIP BLACKJACK
                </div>
                <div className="text-xs text-gray-500 font-mono hidden sm:block">
                    ID: {roomId}
                </div>
                <div className="text-xs px-2 py-0.5 rounded bg-white/10 text-white/70 uppercase tracking-widest border border-white/5">
                    {gameState.phase}
                </div>
            </div>

            <div className="flex items-center gap-4">
               {latency !== null && (
                   <div className={`text-[10px] font-mono ${latency < 100 ? 'text-green-500' : 'text-red-500'}`}>
                       {latency}ms
                   </div>
               )}
               {isAdmin && (
                   <button 
                       onClick={() => setShowAdminPanel(true)}
                       className="text-xs bg-yellow-600/80 hover:bg-yellow-500 text-black px-3 py-1 rounded font-bold transition-colors cursor-pointer"
                   >
                       ADMIN
                   </button>
               )}
               <button 
                   onClick={() => setShowChat(!showChat)}
                   className="sm:hidden text-2xl cursor-pointer"
               >
                   💬
               </button>
               <button 
                   onClick={() => { actions.disconnect(); router.push('/'); }}
                   className="text-xs bg-red-900/30 hover:bg-red-800/50 text-red-400 border border-red-800/50 px-3 py-1 rounded transition-colors cursor-pointer"
               >
                   LEAVE
               </button>
            </div>
        </header>

        {/* Game Table */}
        <div className="relative z-10 flex-1 flex flex-col h-[calc(100vh-64px)] transition-all">
            <div className="flex-none">
                <DealerArea dealerHand={gameState.dealer_hand} phase={gameState.phase} />
            </div>

            {/* Sidebar for Other Players */}
            <div className="absolute left-0 top-16 bottom-0 w-64 p-4 overflow-y-auto custom-scrollbar z-20 hidden md:flex flex-col gap-4 bg-black/20 backdrop-blur-sm border-r border-white/5">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Other Players</div>
                {otherPlayers.map(p => (
                    <div key={p.id} className="scale-75 origin-top-left mb-[-2rem]">
                        <PlayerSpot 
                            player={p} 
                            isMe={false} 
                            isCurrentTurn={gameState.current_turn_player_id === p.id}
                            turnDuration={parseInt(process.env.NEXT_PUBLIC_TURN_TIMEOUT_SECONDS || "30")}
                        />
                    </div>
                ))}
            </div>

            {/* Mobile: Horizontal Scroll for Other Players (keep for small screens) */}
            <div className="md:hidden flex items-center gap-4 px-4 overflow-x-auto py-2 bg-black/20 backdrop-blur">
                {otherPlayers.map(p => (
                    <div key={p.id} className="scale-75 origin-center shrink-0">
                        <PlayerSpot 
                            player={p} 
                            isMe={false} 
                            isCurrentTurn={gameState.current_turn_player_id === p.id}
                            turnDuration={parseInt(process.env.NEXT_PUBLIC_TURN_TIMEOUT_SECONDS || "30")}
                        />
                    </div>
                ))}
            </div>

            <div className="flex-none pb-8 pt-4 bg-gradient-to-t from-black via-black/80 to-transparent">
                 <div className="max-w-4xl mx-auto flex flex-col items-center">
                     
                     {/* Admin Start Button (Lobby/Betting) */}
                     {isAdmin && (gameState.phase === 'Lobby' || gameState.phase === 'Betting') && (
                         <div className="mb-6 animate-fade-in-up">
                             <button 
                                onClick={actions.startGame} 
                                className={`
                                   px-8 py-3 rounded-full font-black shadow-[0_0_20px_rgba(234,179,8,0.4)] transition-transform hover:scale-105 cursor-pointer
                                   ${gameState.phase === 'Betting' ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-yellow-600 hover:bg-yellow-500 text-black'}
                                `}
                             >
                                 {gameState.phase === 'Betting' ? 'DEAL CARDS (FORCE)' : 'START GAME'}
                             </button>
                         </div>
                     )}

                     {gameState.phase === "Betting" && myPlayer && !['Spectating', 'PendingApproval'].includes(myPlayer.status) && (
                         <div className="mb-6 animate-slide-up bg-black/40 p-4 rounded-2xl border border-yellow-500/20 backdrop-blur-md">
                             <div className="text-yellow-500 text-xs font-bold uppercase tracking-widest mb-2 text-center">Place Your Bet</div>
                             <div className="flex gap-2">
                                 {[10, 50, 100, 500, "All"].map((amt, i) => (
                                     <button 
                                        key={i}
                                        onClick={() => actions.placeBet(amt === "All" ? myPlayer.chips : (amt as number))}
                                        className="
                                            w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-700 
                                            border-2 border-yellow-200 shadow-lg flex items-center justify-center font-bold text-black text-xs sm:text-sm
                                            hover:scale-110 transition-transform active:scale-95 cursor-pointer
                                        "
                                     >
                                         {amt}
                                     </button>
                                 ))}
                             </div>
                         </div>
                     )}

                     {myPlayer && (
                         <div className="relative">
                             <PlayerSpot 
                                 player={myPlayer} 
                                 isMe={true} 
                                 isCurrentTurn={isMyTurn}
                                 turnDuration={parseInt(process.env.NEXT_PUBLIC_TURN_TIMEOUT_SECONDS || "30")}
                             />
                             
                             {gameState.phase === "Playing" && isMyTurn && (
                                 <div className="absolute -top-24 left-1/2 transform -translate-x-1/2 z-30 w-max">
                                     <GameControls 
                                         isMyTurn={isMyTurn}
                                         canSplit={canSplit}
                                         canDouble={canDouble}
                                         timeLeft={timeLeft}
                                         totalTime={parseInt(process.env.NEXT_PUBLIC_TURN_TIMEOUT_SECONDS || "30")}
                                         onAction={handleGameAction}
                                     />
                                 </div>
                             )}
                         </div>
                     )}
                     
                     {!myPlayer && (
                         <div className="text-white/50 italic">Spectating Mode</div>
                     )}
                 </div>
            </div>
        </div>

        {/* Contextual Banners */}
        {gameState.phase === "Payout" && (
            <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-40 bg-black/60 backdrop-blur-md border border-yellow-500/30 px-8 py-4 rounded-2xl animate-fade-in-down text-center">
                <h2 className="text-2xl font-black text-yellow-400 uppercase tracking-widest mb-1">Round Over</h2>
                <div className="text-gray-300 text-xs">Payouts Completed</div>
                {isAdmin && (
                    <button 
                        onClick={actions.nextRound}
                        className="mt-3 bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-full font-bold text-sm shadow-lg"
                    >
                        Next Round
                    </button>
                )}
            </div>
        )}
        
        {gameState.settings.chat_enabled && (
            <Chat 
                isOpen={showChat}
                onToggle={() => setShowChat(!showChat)}
                messages={chatMessages}
                onSend={actions.sendChat}
            />
        )}

        <AdminPanel 
            isOpen={showAdminPanel}
            onClose={() => setShowAdminPanel(false)}
            settings={gameState.settings}
            players={gameState.players}
            onUpdateSettings={actions.updateSettings}
            onStartGame={actions.startGame}
            onNextRound={actions.nextRound}
            onKick={actions.kickPlayer}
            onUpdateBalance={actions.updateBalance}
            onApprove={actions.approvePlayer}
        />

    </main>
  );
}
