"use client";

import { useBlackjack } from "../../../hooks/useBlackjack";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";

// Components
import { Lobby } from "@/components/game/Lobby";
import { DealerArea } from "@/components/game/DealerArea";
import { PlayerSpot } from "@/components/game/PlayerSpot"; // Will need refactor
import { GameControls } from "@/components/game/GameControls"; // Will need refactor
import { Chat } from "@/components/game/Chat"; // Will need refactor
import { AdminPanel } from "@/components/game/AdminPanel"; 

export default function GameRoom() {
  const params = useParams();
  const roomId = params.id as string;
  const router = useRouter();
  
  const { 
    isConnected, gameState, myPlayerId, isAdmin, chatMessages, 
    toasts, latency, connect, connectionError, actions 
  } = useBlackjack();

  const [hasJoined, setHasJoined] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  // --- Auto-Join Logic ---
  useEffect(() => {
    if (!isConnected && !hasJoined) {
        const storedAuth = localStorage.getItem(`blackjack_auth_${roomId}`);
        if (storedAuth) {
             connect(roomId); 
             // eslint-disable-next-line react-hooks/exhaustive-deps
             setHasJoined(true);
        }
    }
  }, [roomId, isConnected, hasJoined, connect]);

  useEffect(() => {
    if (isConnected && myPlayerId && gameState?.players.find(p => p.id === myPlayerId) && !hasJoined) {
        setHasJoined(true);
    }
  }, [isConnected, myPlayerId, gameState, hasJoined]);

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
  }, [gameState?.phase, gameState?.current_turn_player_id, myPlayerId, myPlayer?.hands, myPlayer?.hands?.length]);

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
          <div className="min-h-screen bg-background-dark flex items-center justify-center text-primary animate-pulse font-mono">
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
    <body className="bg-background-light dark:bg-background-dark font-display text-white overflow-hidden h-screen select-none">
        
        {/* Toast Container - kept from original */}
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-[60] flex flex-col items-center gap-2 w-full max-w-md pointer-events-none">
             {toasts.map(toast => (
                 <div key={toast.id} className={`px-6 py-3 rounded-full shadow-2xl text-sm font-bold animate-fade-in-down border border-white/10 ${toast.type === 'error' ? 'bg-red-600/90 text-white' : 'bg-blue-600/90 text-white'}`}>
                     {toast.msg}
                 </div>
             ))}
        </div>

        {/* Top Navigation Bar */}
        <header className="fixed top-0 w-full z-50 flex items-center justify-between px-8 py-4 glass-panel border-b border-white/5">
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                    <div className="bg-primary p-1.5 rounded-lg">
                        <span className="material-symbols-outlined text-background-dark font-bold">playing_cards</span>
                    </div>
                    <h2 className="text-xl font-bold tracking-tight text-white uppercase italic">VIP Blackjack</h2>
                </div>
                <div className="h-6 w-px bg-white/10"></div>
                <div className="flex items-center gap-6 text-xs font-medium tracking-widest text-white/50 uppercase">
                    <div className="flex items-center gap-2">
                        <span className={`size-2 rounded-full ${latency && latency < 100 ? 'bg-primary' : 'bg-yellow-500'} animate-pulse`}></span>
                        <span>Ping: {latency || '--'}ms</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[14px]">confirmation_number</span>
                        <span>Room: <span className="text-white">{roomId}</span></span>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 glass-panel px-4 py-2 rounded-xl">
                    <span className="material-symbols-outlined text-primary text-[20px]">account_balance_wallet</span>
                    <span className="text-white font-bold">${myPlayer?.chips.toFixed(2) || '0.00'}</span>
                </div>
                <button 
                  onClick={() => setShowAdminPanel(true)}
                  className="flex items-center justify-center p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                >
                    <span className="material-symbols-outlined text-white">settings</span>
                </button>
                 <button 
                    onClick={() => { actions.disconnect(); router.push('/'); }}
                    className="flex items-center justify-center p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-colors"
                    title="Leave Game"
                >
                    <span className="material-symbols-outlined text-red-400">logout</span>
                </button>
                <div 
                    className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 border-2 border-primary/30" 
                    style={{ backgroundImage: `url("https://ui-avatars.com/api/?name=${myPlayer?.name || 'User'}&background=0df280&color=102219")` }}
                ></div>
            </div>
        </header>

        <main className="relative h-full w-full flex items-center justify-center pt-20">
            {/* Background Felt/Table Pattern (Abstract Gradient) */}
            <div className="absolute inset-0 z-0 opacity-40" style={{ background: 'radial-gradient(circle at 50% 120%, rgba(13, 242, 128, 0.15) 0%, transparent 70%)' }}></div>

            {/* Sidebar Left: Other Players */}
            <aside className="absolute left-8 top-28 bottom-8 w-64 flex flex-col gap-4 z-40">
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-primary/60 px-2 mb-2">Live Table Status</div>
                <div className="flex flex-col gap-4 overflow-y-auto custom-scrollbar flex-1 pb-4">
                    {otherPlayers.map(p => (
                        <PlayerSpot 
                            key={p.id}
                            player={p} 
                            isMe={false} 
                            isCurrentTurn={gameState.current_turn_player_id === p.id}
                            turnDuration={parseInt(process.env.NEXT_PUBLIC_TURN_TIMEOUT_SECONDS || "30")}
                        />
                    ))}
                    {otherPlayers.length === 0 && (
                        <div className="text-white/30 text-xs italic px-4">Waiting for players...</div>
                    )}
                </div>
            </aside>

            {/* Sidebar Right: Chat */}
            <aside className="absolute right-8 bottom-8 w-72 h-[450px] flex flex-col z-40 pointer-events-none md:pointer-events-auto">
                 {gameState.settings.chat_enabled && (
                    <Chat 
                        isOpen={true} // Always open in this layout
                        onToggle={() => {}} // No toggle needed
                        messages={chatMessages}
                        onSend={actions.sendChat}
                    />
                )}
            </aside>

            {/* Main Central Table Area */}
            <div className="flex flex-col items-center justify-between h-[85%] w-full max-w-5xl z-10 px-4">
                
                {/* Dealer Section */}
                <DealerArea dealerHand={gameState.dealer_hand} phase={gameState.phase} />

                {/* Active Player Hands (Center) */}
                <div className="flex gap-20 items-end pb-12 flex-1 justify-center">
                    {myPlayer && (
                        <PlayerSpot 
                            player={myPlayer} 
                            isMe={true} 
                            isCurrentTurn={isMyTurn}
                            turnDuration={parseInt(process.env.NEXT_PUBLIC_TURN_TIMEOUT_SECONDS || "30")}
                        />
                    )}
                    
                     {/* Admin Start Button Overlay */}
                     {isAdmin && (gameState.phase === 'Lobby' || gameState.phase === 'Betting') && (
                         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
                             <button 
                                onClick={actions.startGame} 
                                className={`
                                   px-8 py-3 rounded-xl font-black shadow-[0_0_20px_rgba(13,242,128,0.4)] transition-transform hover:scale-105 cursor-pointer border border-primary/20
                                   ${gameState.phase === 'Betting' ? 'bg-primary hover:bg-white text-background-dark' : 'bg-primary hover:bg-white text-background-dark'}
                                `}
                             >
                                 {gameState.phase === 'Betting' ? 'DEAL CARDS (FORCE)' : 'START GAME'}
                             </button>
                         </div>
                     )}
                </div>

                {/* Action Controls & Betting HUD */}
                <div className="w-full flex flex-col items-center gap-8 mb-4 min-h-[140px]">
                    <GameControls 
                        isMyTurn={isMyTurn}
                        canSplit={canSplit}
                        canDouble={canDouble}
                        timeLeft={timeLeft}
                        totalTime={parseInt(process.env.NEXT_PUBLIC_TURN_TIMEOUT_SECONDS || "30")}
                        onAction={handleGameAction}
                        phase={gameState.phase}
                        myPlayer={myPlayer}
                        actions={actions}
                    />
                </div>
            </div>
        </main>

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
        
        {/* Payout Notification - Re-styled */}
         {gameState.phase === "Payout" && (
            <div className="absolute top-32 left-1/2 transform -translate-x-1/2 z-50 glass-panel px-12 py-6 rounded-2xl animate-fade-in-down text-center border-primary/30 glow-primary">
                <h2 className="text-3xl font-black text-primary uppercase tracking-widest mb-1 italic">Round Over</h2>
                <div className="text-white/70 text-sm font-mono">Payouts Completed</div>
                {isAdmin && (
                    <button 
                        onClick={actions.nextRound}
                        className="mt-4 bg-white/10 hover:bg-white/20 text-white px-8 py-2 rounded-lg font-bold text-sm border border-white/10 transition-colors uppercase tracking-wider"
                    >
                        Next Round
                    </button>
                )}
            </div>
        )}

    </body>
  );
}
