export function Footer() {
  const year = new Date().getFullYear();
  
  return (
    <footer className="w-full py-6 bg-background-dark/80 backdrop-blur-md border-t border-white/5 flex flex-col items-center justify-center gap-2 text-white/40 text-xs font-mono relative z-10">
      <div className="flex items-center gap-4">
        <span>VIP Blackjack &copy; {year}</span>
        <span className="w-1 h-1 rounded-full bg-white/20"></span>
        <span>
          Created by <a href="https://github.com/loudsheep" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 transition-colors">loudsheep</a>
        </span>
      </div>
      <div className="text-[10px] uppercase tracking-widest opacity-50">
        Play Responsibly
      </div>
    </footer>
  );
}
