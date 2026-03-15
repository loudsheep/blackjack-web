import Image from "next/image";

// Repository Configurations
const CREATOR_USERNAME = "loudsheep";
const FRONTEND_REPO = `${CREATOR_USERNAME}/blackjack-web`;
const BACKEND_REPO = `${CREATOR_USERNAME}/blackjack-backend`;
const FRONTEND_URL = `https://github.com/${FRONTEND_REPO}`;
const BACKEND_URL = `https://github.com/${BACKEND_REPO}`;

async function getRepoData(repoPath: string) {
  try {
    const [repoRes, contribRes] = await Promise.all([
      fetch(`https://api.github.com/repos/${repoPath}`, { next: { revalidate: 3600 } }),
      fetch(`https://api.github.com/repos/${repoPath}/contributors`, { next: { revalidate: 3600 } })
    ]);

    const repoDetails = repoRes.ok ? await repoRes.json() : null;
    const contributors = contribRes.ok ? await contribRes.json() : [];

    return {
      stars: repoDetails?.stargazers_count || 0,
      contributors: Array.isArray(contributors) ? contributors : []
    };
  } catch (e) {
    return { stars: 0, contributors: [] };
  }
}

async function getUserData(username: string) {
  try {
    const res = await fetch(`https://api.github.com/users/${username}`, { next: { revalidate: 3600 } });
    return res.ok ? await res.json() : null;
  } catch (e) {
    return null;
  }
}

export default async function About() {
  const [frontendData, backendData, creatorData] = await Promise.all([
    getRepoData(FRONTEND_REPO),
    getRepoData(BACKEND_REPO),
    getUserData(CREATOR_USERNAME)
  ]);

  // Combine, deduplicate, and sum contributions, excluding the creator
  const contribMap = new Map();
  [...frontendData.contributors, ...backendData.contributors].forEach(c => {
    if (c.login && c.login.toLowerCase() !== CREATOR_USERNAME.toLowerCase() && c.type === "User") {
      if (contribMap.has(c.login)) {
        contribMap.get(c.login).contributions += (c.contributions || 0);
      } else {
        contribMap.set(c.login, { ...c });
      }
    }
  });
  
  const contributors = Array.from(contribMap.values()).sort((a, b) => (b.contributions || 0) - (a.contributions || 0));
  const totalStars = frontendData.stars + backendData.stars;

  return (
    <div className="w-full max-w-4xl mt-12 sm:mt-16 flex flex-col gap-8">
      {/* Header Section */}
      <div className="glass-panel p-8 sm:p-12 rounded-3xl w-full border border-white/10 relative overflow-hidden text-center shadow-2xl">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-primary/20 blur-[100px] pointer-events-none rounded-full" />
        
        <div className="bg-primary/10 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-primary/20 shadow-[0_0_30px_rgba(13,242,128,0.3)] relative z-10">
           <span className="material-symbols-outlined text-primary text-5xl">info</span>
        </div>
        
        <h1 className="text-4xl sm:text-5xl font-black mb-4 tracking-tight italic uppercase drop-shadow-lg relative z-10">
          About <span className="text-primary drop-shadow-[0_0_20px_rgba(13,242,128,0.4)]">VIP Blackjack</span>
        </h1>
        
        <p className="text-lg text-white/70 font-medium max-w-xl mx-auto leading-relaxed relative z-10">
          A premium, multiplayer blackjack experience built with modern web technologies, designed for friends to play together.
        </p>

        <div className="flex items-center justify-center gap-6 mt-6 relative z-10">
            <div className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-xl border border-white/10">
                <span className="material-symbols-outlined text-yellow-500 text-[20px]">star</span>
                <span className="font-bold text-white">{totalStars} total stars</span>
            </div>
            <div className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-xl border border-white/10">
                <span className="material-symbols-outlined text-blue-400 text-[20px]">fork_right</span>
                <span className="font-bold text-white">Open Source</span>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Creator & Contributors */}
        <div className="glass-panel p-8 rounded-3xl border border-white/10 relative overflow-hidden flex flex-col gap-6">
            <h2 className="text-xl font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <span className="material-symbols-outlined">group</span> Team
            </h2>
            
            <div>
               <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest mb-3 border-b border-white/5 pb-2">Creator</h3>
               <div className="flex items-center gap-4 bg-black/20 p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                   {creatorData?.avatar_url ? (
                     <Image 
                       src={creatorData.avatar_url} 
                       alt={CREATOR_USERNAME} 
                       width={48} 
                       height={48} 
                       className="rounded-full shadow-lg shrink-0 border-2 border-primary/50"
                     />
                   ) : (
                     <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-primary to-green-700 flex items-center justify-center text-background-dark font-black text-xl shadow-lg shrink-0">
                         {CREATOR_USERNAME.charAt(0).toUpperCase()}
                     </div>
                   )}
                   <div>
                       <div className="font-bold text-lg text-white">{CREATOR_USERNAME}</div>
                       <a href={`https://github.com/${CREATOR_USERNAME}`} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline hover:text-white transition-colors">
                           @{CREATOR_USERNAME} on GitHub
                       </a>
                   </div>
               </div>
            </div>

            <div>
               <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest mb-3 border-b border-white/5 pb-2">Contributors ({contributors.length})</h3>
               {contributors.length > 0 ? (
                 <div className="flex flex-wrap gap-2">
                   {contributors.map(c => (
                     <a 
                       key={c.id} 
                       href={c.html_url} 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="group relative"
                       title={c.login}
                     >
                       <Image 
                         src={c.avatar_url} 
                         alt={c.login} 
                         width={40} 
                         height={40} 
                         className="rounded-full border-2 border-white/10 group-hover:border-primary transition-colors cursor-pointer"
                       />
                     </a>
                   ))}
                 </div>
               ) : (
                 <div className="bg-black/20 p-4 rounded-2xl border border-white/5 text-sm text-white/70 italic flex items-center gap-3">
                     <span className="material-symbols-outlined text-white/50">volunteer_activism</span>
                     Open to contributions! Join the project on GitHub.
                 </div>
               )}
            </div>
        </div>

        {/* Tech Stack */}
        <div className="glass-panel p-8 rounded-3xl border border-white/10 relative overflow-hidden flex flex-col gap-6">
            <h2 className="text-xl font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <span className="material-symbols-outlined">code</span> Tech Stack
            </h2>
            
            <div className="flex flex-col gap-3">
               {[
                   { name: "Next.js", desc: "Frontend React Framework", icon: "dataset" },
                   { name: "Rust", desc: "High Performance Backend", icon: "memory" },
                   { name: "WebSockets", desc: "Realtime Communication", icon: "sync_alt" },
                   { name: "Tailwind CSS", desc: "Component Styling", icon: "format_paint" }, 
               ].map(tech => (
                   <div key={tech.name} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                       <div className="flex items-center gap-3">
                           <span className="material-symbols-outlined text-white/50">{tech.icon}</span>
                           <span className="font-bold text-sm text-white/90">{tech.name}</span>
                       </div>
                       <span className="text-xs text-white/50 font-mono text-right">{tech.desc}</span>
                   </div>
               ))}
            </div>
        </div>
      </div>

      {/* GitHub Links */}
      <div className="glass-panel p-8 rounded-3xl w-full border border-white/10 relative overflow-hidden flex flex-col sm:flex-row items-center gap-6 justify-between">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[80px] pointer-events-none rounded-full" />
            
            <div className="flex items-center gap-4 relative z-10 w-full sm:w-auto">
                <span className="material-symbols-outlined text-5xl text-white/80 shrink-0">hub</span>
                <div>
                   <h2 className="text-xl font-black uppercase tracking-widest text-white">Open Source</h2>
                   <p className="text-sm text-white/50 mt-1">This project is split across two core repositories.</p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto relative z-10 shrink-0">
                <a 
                   href={BACKEND_URL}
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="flex justify-between items-center gap-3 py-3 px-6 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-all font-bold text-sm tracking-wider action-button"
                >
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">dns</span>
                        Backend
                    </div>
                    {backendData.stars > 0 && <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full font-mono">★ {backendData.stars}</span>}
                </a>
                <a 
                   href={FRONTEND_URL}
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="flex justify-between items-center gap-3 py-3 px-6 bg-primary text-background-dark rounded-xl transition-all font-black uppercase text-sm tracking-wider action-button shadow-[0_0_15px_rgba(13,242,128,0.2)]"
                >
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">laptop</span>
                        Frontend
                    </div>
                    {frontendData.stars > 0 && <span className="text-xs bg-background-dark/20 px-2 py-0.5 rounded-full font-mono text-background-dark">★ {frontendData.stars}</span>}
                </a>
            </div>
      </div>
    </div>
  );
}
