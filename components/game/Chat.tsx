import { ChatMessage } from "@/app/types";
import { useEffect, useRef, useState } from "react";

interface ChatProps {
    messages: ChatMessage[];
    onSend: (msg: string) => void;
    isOpen: boolean; // Kept for compatibility but might always be true in desktop
    onToggle: () => void;
}

export function Chat({ messages, onSend, isOpen, onToggle }: ChatProps) {
    const [input, setInput] = useState("");
    const endRef = useRef<HTMLDivElement>(null);

    // Auto-scroll on new messages
    useEffect(() => {
        if (isOpen) {
            endRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isOpen]);

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (input.trim()) {
            onSend(input);
            setInput("");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="glass-panel flex-1 rounded-xl flex flex-col overflow-hidden border border-white/5 shadow-2xl h-full animate-slide-in-right">
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-primary">chat_bubble</span>
                    <span className="text-xs font-bold uppercase tracking-wider text-white">Lounge Chat</span>
                </div>
                {/* Mobile close button if needed, or just hidden on desktop */}
                <button 
                    onClick={onToggle}
                    className="md:hidden material-symbols-outlined text-[18px] text-white/40 hover:text-white transition-colors cursor-pointer"
                >
                    close
                </button>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs custom-scrollbar">
                {messages.length === 0 && (
                    <div className="text-white/30 italic text-center mt-4">No messages yet...</div>
                )}
                {messages.map((m, i) => (
                    <div key={i} className="flex flex-col gap-1 animate-fade-in break-words">
                        <span className={`font-bold ${m.from === 'System' ? 'text-primary' : 'text-white/50'}`}>
                            {m.from}:
                        </span>
                        <span className="text-white/80">{m.msg}</span>
                    </div>
                ))}
                <div ref={endRef} />
            </div>

            <form onSubmit={handleSubmit} className="p-3 bg-black/40 border-t border-white/5">
                <input 
                    className="w-full bg-white/5 border-none rounded-lg text-xs focus:ring-1 focus:ring-primary/50 py-2 px-3 text-white placeholder-white/30 transition-all"
                    placeholder="Type a message..." 
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                />
            </form>
        </div>
    );
}
