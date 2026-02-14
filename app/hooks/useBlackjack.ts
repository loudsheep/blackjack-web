import { useRef, useState, useCallback, useEffect } from 'react';
import { 
    ClientAction, ServerEvent, GameState, Player, ChatMessage, PlayerRequest, GameSettings 
} from '../types';

export interface Toast {
    id: string;
    msg: string;
    type: 'error' | 'info';
}

export function useBlackjack() {
    const [isConnected, setIsConnected] = useState(false);
    const [gameState, setGameState] = useState<GameState | null>(null);
    
    // Local player state
    const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    
    // Component state
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [pendingRequests, setPendingRequests] = useState<PlayerRequest[]>([]);
    const [toasts, setToasts] = useState<Toast[]>([]);

    const socketRef = useRef<WebSocket | null>(null);

    // Toast helper
    const addToast = useCallback((msg: string, type: 'error' | 'info' = 'info') => {
        const id = Math.random().toString(36).substring(7);
        setToasts(prev => [...prev, { id, msg, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    }, []);

    const connect = useCallback((gameId: string, username: string) => {
        if (socketRef.current) {
            socketRef.current.close();
        }

        const ws_url = process.env.NEXT_PUBLIC_WS_URL || "ws://127.0.0.1:3000/ws";
        const url = `${ws_url}/${gameId}`;

        console.log("Connecting to:", url);
        const ws = new WebSocket(url);
        socketRef.current = ws;

        ws.onopen = () => {
            setIsConnected(true);
            sendMessage({ action: "JoinGame", payload: { username } });
        };

        ws.onmessage = (event) => {
            try {
                const msg: any = JSON.parse(event.data);
                if (msg.event) {
                    handleServerEvent(msg);
                }
            } catch (err) {
                console.error("Failed to parse message", err);
            }
        };

        ws.onclose = () => {
            setIsConnected(false);
            setGameState(null);
            setMyPlayerId(null);
            setIsAdmin(false);
            addToast("Disconnected from server", 'error');
        };

        ws.onerror = (err) => {
            console.error("WebSocket error", err);
            addToast("WebSocket connection error", 'error');
        };
    }, [addToast]);

    const sendMessage = (msg: any) => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify(msg));
        }
    };

    const handleServerEvent = (msg: any) => {
        switch (msg.event) {
            case "GameStateSnapshot":
                setGameState(msg.data);
                // Also update pending requests if player is approved? 
                if (msg.data.players) {
                     setPendingRequests(prev => prev.filter(req => !msg.data.players.find((p: any) => p.id === req.id)));
                }
                break;
            case "JoinedLobby":
                setMyPlayerId(msg.data.your_id);
                setIsAdmin(msg.data.is_admin);
                addToast("Joined game lobby", 'info');
                break;
            case "ChatBroadcast":
                setChatMessages(prev => [...prev, { ...msg.data, timestamp: Date.now() }]);
                break;
            case "PlayerRequest":
                setPendingRequests(prev => {
                    if (prev.find(r => r.id === msg.data.id)) return prev;
                    return [...prev, msg.data];
                });
                addToast(`New Join Request: ${msg.data.name}`, 'info');
                break;
            case "Error":
                addToast(msg.data.msg, 'error');
                break;
        }
    };

    // Actions
    const startGame = () => sendMessage({ action: "StartGame", payload: null });
    const nextRound = () => sendMessage({ action: "NextRound", payload: null });
    const placeBet = (amount: number) => sendMessage({ action: "PlaceBet", payload: { amount } });
    const sendGameAction = (type: "Hit" | "Stand" | "Double" | "Split") => sendMessage({ action: "GameAction", payload: { action_type: type } });
    const sendChat = (message: string) => sendMessage({ action: "Chat", payload: { message } });
    
    // Admin Actions
    const approvePlayer = (player_id: string) => {
        sendMessage({ action: "ApprovePlayer", payload: { player_id } });
        setPendingRequests(prev => prev.filter(p => p.id !== player_id)); // Optimistic remove
    };
    const kickPlayer = (player_id: string) => sendMessage({ action: "KickPlayer", payload: { player_id } });
    const updateSettings = (settings: GameSettings) => sendMessage({ action: "UpdateSettings", payload: { settings } });
    const updateBalance = (target_id: string, change_chips: number) => sendMessage({ action: "AdminUpdateBalance", payload: { target_id, change_chips } });

    return {
        isConnected,
        gameState,
        myPlayerId,
        isAdmin,
        chatMessages,
        pendingRequests,
        toasts,
        connect,
        actions: {
            startGame,
            nextRound,
            placeBet,
            sendGameAction,
            sendChat,
            approvePlayer,
            kickPlayer,
            updateSettings,
            updateBalance
        }
    };
}
