"use client";

import { useBlackjack } from "./hooks/useBlackjack";
import { Card, Suit, Rank } from "./types";
import { useState, useEffect } from "react";

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

function CardDisplay({ card }: { card: Card }) {
  return (
    <div className={`
      flex flex-col items-center justify-center 
      w-12 h-16 sm:w-16 sm:h-24 
      bg-white border-2 border-gray-300 rounded-lg shadow-sm
      ${SUIT_COLORS[card.suit]}
    `}>
      <span className="text-sm sm:text-xl font-bold">{RANK_MAP[card.rank]}</span>
      <span className="text-lg sm:text-2xl">{SUIT_SYMBOLS[card.suit]}</span>
    </div>
  );
}

export default function Home() {
  const { isConnected, gameState, connect, sendAction, startGame, myPlayerId } = useBlackjack();
  
  const [roomId, setRoomId] = useState("table-1");
  const [username, setUsername] = useState("");

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const url = process.env.NEXT_PUBLIC_BACKEND_URL || "ws://127.0.0.1:3000/ws";
    connect(url, roomId, username);
  };

  if (!isConnected) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-green-800 p-4">
        <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full">
          <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">♠️ Blackjack</h1>
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Username</label>
              <input 
                required
                className="mt-1 block w-full rounded-md border text-black border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Room ID</label>
              <input 
                required
                className="mt-1 block w-full rounded-md border text-black border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
              />
            </div>
            <button 
              type="submit"
              className="w-full rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              Join Table
            </button>
          </form>
        </div>
      </main>
    );
  }

  const isMyTurn = gameState.turn === myPlayerId;
  const myPlayer = myPlayerId ? gameState.players[myPlayerId] : null;
  const otherPlayers = Object.values(gameState.players).filter(p => p.id !== myPlayerId);

  return (
    <main className="min-h-screen bg-green-800 p-4 text-white font-sans">
      {/* Header */}
      <header className="flex justify-between items-center mb-8 p-4 bg-green-900/50 rounded-lg">
        <div>
          <h2 className="text-xl font-bold">Room: {roomId}</h2>
          <p className="text-sm opacity-80">User: {username}</p>
        </div>
        <div className="text-right">
           {gameState.roundResult && (
             <div className="mt-2 text-yellow-300 font-bold text-lg">
                {typeof gameState.roundResult === 'string' 
                   ? `Result: ${gameState.roundResult}` 
                   : `Winners: ${gameState.roundResult.Winners.length > 0 ? gameState.roundResult.Winners.join(', ') : 'None'}`
                }
             </div>
           )}
           {gameState.turn && (
              <div className="text-sm font-mono mt-1">
                 current turn: <span className="font-bold text-yellow-200">
                    {gameState.players[gameState.turn]?.username || gameState.turn}
                 </span>
              </div>
           )}
        </div>
      </header>

      {/* Game Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Logs */}
        <div className="lg:col-span-1 bg-black/20 p-4 rounded-lg h-64 lg:h-96 overflow-y-auto">
           <h3 className="font-bold mb-2 sticky top-0 bg-transparent">Game Log</h3>
           <ul className="space-y-1 text-sm font-mono opacity-80">
              {gameState.logs.map((log, i) => (
                <li key={i}>&gt; {log}</li>
              ))}
           </ul>
        </div>

        {/* Center: Table */}
        <div className="lg:col-span-2 flex flex-col justify-between min-h-[500px]">
           
           {/* Other Players / Dealer area */}
           <div className="flex flex-wrap justify-center gap-4 mb-8">
              {otherPlayers.map(player => (
                <div key={player.id} className="bg-green-900/40 p-4 rounded-lg transform scale-90">
                  <h3 className="text-center font-bold mb-2">{player.username}</h3>
                  <div className="flex -space-x-4">
                    {player.hand.map((card, idx) => (
                       <CardDisplay key={idx} card={card} />
                    ))}
                    {player.hand.length === 0 && <div className="w-12 h-16 border-2 border-dashed border-white/20 rounded-lg"/>}
                  </div>
                </div>
              ))}
           </div>

           {/* My Player Area */}
           <div className="flex flex-col items-center bg-green-900/60 p-8 rounded-xl ring-4 ring-green-700/50">
               <h3 className="text-2xl font-bold mb-4">You ({username})</h3>
               
               <div className="flex gap-2 justify-center mb-8">
                  {myPlayer?.hand.map((card, idx) => (
                     <CardDisplay key={idx} card={card} />
                  ))}
                  {(!myPlayer || myPlayer.hand.length === 0) && (
                     <div className="text-white/50 italic">Waiting for cards...</div>
                  )}
               </div>

               {/* Controls */}
               <div className="flex gap-4">
                  <button
                    disabled={!isMyTurn}
                    onClick={() => sendAction("Hit")}
                    className={`
                      px-8 py-3 rounded-full font-bold text-lg shadow-lg transition-transform
                      ${isMyTurn 
                        ? "bg-blue-600 hover:bg-blue-500 hover:scale-105 active:scale-95" 
                        : "bg-gray-600 opacity-50 cursor-not-allowed"}
                    `}
                  >
                    HIT
                  </button>
                  <button
                    disabled={!isMyTurn}
                    onClick={() => sendAction("Stand")}
                    className={`
                      px-8 py-3 rounded-full font-bold text-lg shadow-lg transition-transform
                      ${isMyTurn 
                        ? "bg-red-600 hover:bg-red-500 hover:scale-105 active:scale-95" 
                        : "bg-gray-600 opacity-50 cursor-not-allowed"}
                    `}
                  >
                    STAND
                  </button>
               </div>
               
               {!gameState.isGameStarted && (
                 <div className="mt-6 flex flex-col items-center gap-2">
                    <div className="text-yellow-200 animate-pulse text-sm">
                        Waiting for game start...
                    </div>
                    <button
                        onClick={startGame}
                        className="px-6 py-2 bg-yellow-600 hover:bg-yellow-500 rounded-full font-bold shadow-lg transition-transform text-white"
                    >
                        START GAME
                    </button>
                    {Object.keys(gameState.players).length < 2 && (
                         <span className="text-xs text-white/50">(Need 2+ players recommended)</span>
                    )}
                 </div>
               )}
           </div>

        </div>
      </div>
    </main>
  );
}

