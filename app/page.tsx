import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-green-900 text-white p-4">
      <div className="bg-white/10 p-12 rounded-3xl backdrop-blur-sm shadow-2xl text-center max-w-2xl w-full border border-white/20">
        <h1 className="text-6xl font-black mb-8 drop-shadow-lg">♠️ Blackjack</h1>
        <p className="text-xl mb-12 opacity-90">
             The classic casino game, reimagined for multiplayer. 
             Create a private room or join friends instantly.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Link 
            href="/create"
            className="group relative flex flex-col items-center justify-center p-8 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl hover:scale-105 transition-all shadow-lg"
          >
             <div className="text-4xl mb-4">🆕</div>
             <span className="text-2xl font-bold">Create Game</span>
             <span className="text-sm opacity-75 mt-2">Host a new table</span>
          </Link>

          <Link 
            href="/join"
            className="group relative flex flex-col items-center justify-center p-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl hover:scale-105 transition-all shadow-lg"
          >
             <div className="text-4xl mb-4">🚪</div>
             <span className="text-2xl font-bold">Join Game</span>
             <span className="text-sm opacity-75 mt-2">Enter room ID</span>
          </Link>
        </div>
      </div>
    </main>
  );
}

