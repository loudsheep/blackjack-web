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

        // Check local storage for reconnection credentials
        const storedAuth = localStorage.getItem(`blackjack_auth_${gameId}`);
        let authParams = "";
        let isReconnection = false;

        if (storedAuth) {
            try {
                const { id, secret } = JSON.parse(storedAuth);
                if (id && secret) {
                    authParams = `?player_id=${id}&secret=${secret}`;
                    isReconnection = true;
                    setMyPlayerId(id);
                }
            } catch (e) {
                console.error("Failed to parse stored auth", e);
                localStorage.removeItem(`blackjack_auth_${gameId}`);
            }
        }

        const url = `${ws_url}/${gameId}${authParams}`;
        console.log("Connecting to:", url);
        
        const ws = new WebSocket(url);
        socketRef.current = ws;

        ws.onopen = () => {
            console.log("WebSocket connection opened");
            setIsConnected(true);
            // Only send JoinGame if NOT reconnecting
            if (!isReconnection) {
                console.log("Sending JoinGame:", { username });
                sendMessage({ action: "JoinGame", payload: { username } });
            } else {
                 console.log("Reconnecting with existing session");
                 addToast("Resuming session...", 'info');
            }
        };

        ws.onmessage = (event) => {
            try {
                // Ignore messages that are not JSON
                if (typeof event.data !== 'string') return;
                
                console.log("Received WebSocket message:", event.data);

                const msg: any = JSON.parse(event.data);
                if (msg.event) {
                     // Need to call handleServerEvent in a way that respects the closure or pass gameId
                     // But wait, handleServerEvent is defined outside. We can pass gameId as an argument
                     // if we redefine handleServerEvent to accept it or rely on it being in scope?
                     // Actually, we can just pass msg and handle it. But we need gameId for localStorage.
                     // The connect function has gameId in scope.
                     
                     // Handle JoinedLobby specially here to save to localStorage since handleServerEvent logic was moved
                     if (msg.event === "JoinedLobby") {
                        console.log("Handling JoinedLobby event", msg.data);
                        const { your_id, secret, is_admin } = msg.data;
                        if (your_id && secret) {
                            console.log("Saving auth credentials to localStorage");
                            localStorage.setItem(`blackjack_auth_${gameId}`, JSON.stringify({ id: your_id, secret }));
                        }
                     }

                     handleServerEvent(msg);
                }
            } catch (err) {
                console.error("Failed to parse message", err);
            }
        };

        ws.onclose = (event) => {
            console.log("WebSocket connection closed", event.code, event.reason);
            setIsConnected(false);
            setGameState(null);
            setMyPlayerId(null);
            setIsAdmin(false);

            // 403 Forbidden usually means full or invalid reconnection
            if (event.code === 403 || event.reason.includes("Forbidden")) {
                 console.warn("Connection rejected (403 Forbidden). Clearing auth.");
                 addToast("Connection rejected (Full or Invalid)", 'error');
                 localStorage.removeItem(`blackjack_auth_${gameId}`);
            } else {
                 addToast("Disconnected from server", 'error');
            }
        };

        ws.onerror = (err) => {
            console.error("WebSocket error", err);
            addToast("WebSocket connection error", 'error');
        };
    }, [addToast]);

    const sendMessage = (msg: any) => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            console.log("Sending WebSocket message:", msg);
            socketRef.current.send(JSON.stringify(msg));
        } else {
             console.warn("Cannot send message, WebSocket not open. State:", socketRef.current?.readyState);
        }
    };

    const handleServerEvent = (msg: any) => {
        console.log("Processing Server Event:", msg.event);
        switch (msg.event) {
            case "GameStateSnapshot":
                console.log("GameState:", msg.data);
                setGameState(msg.data);
                if (msg.data.players) {
                     setPendingRequests(prev => prev.filter(req => !msg.data.players.find((p: any) => p.id === req.id)));
                }
                break;
            case "JoinedLobby":
                console.log("Joined Lobby:", msg.data);
                setMyPlayerId(msg.data.your_id);
                setIsAdmin(msg.data.is_admin);
                addToast("Joined game lobby", 'info');
                break;
            case "ChatBroadcast":
                setChatMessages(prev => [...prev, { ...msg.data, timestamp: Date.now() }]);
                break;
            case "PlayerRequest":
                console.log("Player Request:", msg.data);
                setPendingRequests(prev => {
                    if (prev.find(r => r.id === msg.data.id)) return prev;
                    return [...prev, msg.data];
                });
                addToast(`New Join Request: ${msg.data.name}`, 'info');
                break;
            case "Error":
                console.error("Server Error:", msg.data.msg);
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
