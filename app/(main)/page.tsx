import Link from "next/link";

export default function Home() {
  return (
    <div className="w-full max-w-2xl flex flex-col items-center mt-12 sm:mt-24">
      <div className="glass-panel p-8 sm:p-12 rounded-3xl shadow-2xl text-center w-full border border-white/10 relative overflow-hidden">
        {/* Decorative background glow inside the card */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-primary/20 blur-[100px] pointer-events-none rounded-full" />
        
        <div className="bg-primary/10 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-primary/20 shadow-[0_0_30px_rgba(13,242,128,0.3)]">
           <span className="material-symbols-outlined text-primary text-5xl">playing_cards</span>
        </div>
        
        <h1 className="text-5xl sm:text-6xl font-black mb-6 tracking-tight italic uppercase drop-shadow-lg">
          VIP <span className="text-primary drop-shadow-[0_0_20px_rgba(13,242,128,0.4)]">Blackjack</span>
        </h1>
        
        <p className="text-lg sm:text-lg mb-12 text-white/70 font-medium max-w-lg mx-auto leading-relaxed">
             The classic casino game, reimagined for multiplayer. 
             Create a private room or join friends instantly.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Link 
            href="/create"
            className="group relative flex flex-col items-center justify-center p-8 glass-panel rounded-2xl hover:border-primary/50 transition-all duration-300 action-button overflow-hidden"
          >
             <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
             <span className="material-symbols-outlined text-4xl mb-4 text-white group-hover:text-primary transition-colors duration-300">add_circle</span>
             <span className="text-xl font-bold uppercase tracking-wider text-white">Create Game</span>
             <span className="text-xs text-white/50 mt-2 font-mono uppercase">Host a new table</span>
          </Link>

          <Link 
            href="/join"
            className="group relative flex flex-col items-center justify-center p-8 glass-panel rounded-2xl hover:border-blue-500/50 transition-all duration-300 action-button overflow-hidden"
          >
             <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
             <span className="material-symbols-outlined text-4xl mb-4 text-white group-hover:text-blue-400 transition-colors duration-300">login</span>
             <span className="text-xl font-bold uppercase tracking-wider text-white">Join Game</span>
             <span className="text-xs text-white/50 mt-2 font-mono uppercase">Enter room ID</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

