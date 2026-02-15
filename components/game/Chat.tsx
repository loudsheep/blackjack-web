import { ChatMessage } from "@/app/types";
import { useEffect, useRef, useState } from "react";

interface ChatProps {
    messages: ChatMessage[];
    onSend: (msg: string) => void;
    isOpen: boolean;
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

    return (
        <div 
            className={`
                fixed bottom-4 right-4 z-40 flex flex-col items-end pointer-events-none
                ${isOpen ? 'w-80 h-[500px]' : 'w-auto h-auto'}
            `}
        >
            {/* Toggle Button */}
            <button 
                onClick={onToggle}
                className="
                    pointer-events-auto shadow-lg bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-full mb-2
                    border border-gray-600 transition-transform active:scale-95 cursor-pointer
                "
            >
                {isOpen ? '❌' : '💬'} 
                {!isOpen && messages.length > 0 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />}
            </button>

            {/* Chat Window */}
            <div 
                className={`
                    pointer-events-auto bg-gray-900/95 backdrop-blur-md border border-gray-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col w-full h-full
                    transition-all duration-300 origin-bottom-right
                    ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-90 h-0 w-0'}
                `}
            >
                <div className="bg-gray-800 p-3 border-b border-gray-700 font-bold text-gray-300 flex justify-between">
                    <span>Room Chat</span>
                    <span className="text-xs bg-green-900 text-green-300 px-2 py-0.5 rounded-full">Live</span>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                    {messages.map((m, i) => (
                        <div key={i} className="text-sm animate-fade-in break-words">
                            <span className="font-bold text-yellow-500 mr-2">{m.from}:</span>
                            <span className="text-gray-200">{m.msg}</span>
                        </div>
                    ))}
                    <div ref={endRef} />
                </div>

                <form onSubmit={handleSubmit} className="p-3 bg-gray-800 border-t border-gray-700 flex gap-2">
                    <input 
                        className="flex-1 bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500 placeholder-gray-500"
                        placeholder="Say something..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                    />
                    <button 
                        type="submit"
                        className="bg-yellow-600 hover:bg-yellow-500 text-black px-3 rounded font-bold transition-colors cursor-pointer"
                    >
                        ➤
                    </button>
                </form>
            </div>
        </div>
    );
}
