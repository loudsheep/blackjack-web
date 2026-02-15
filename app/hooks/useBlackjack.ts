import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
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
    const [lastPingTime, setLastPingTime] = useState<number>(0);
    const [latency, setLatency] = useState<number | null>(null);
    const [connectionError, setConnectionError] = useState<{title: string, msg: string} | null>(null);

    const socketRef = useRef<WebSocket | null>(null);
    const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Toast helper
    const addToast = useCallback((msg: string, type: 'error' | 'info' = 'info') => {
        const id = Math.random().toString(36).substring(7);
        setToasts(prev => [...prev, { id, msg, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    }, []);

    const lastPingTimeRef = useRef(0);

    const sendPing = useCallback(() => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            lastPingTimeRef.current = Date.now();
            socketRef.current.send(JSON.stringify({ action: "Ping", payload: null }));
        }
    }, []);

    const sendMessage = useCallback((msg: any) => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            console.log("Sending WebSocket message:", msg);
            socketRef.current.send(JSON.stringify(msg));
        } else {
             console.warn("Cannot send message, WebSocket not open. State:", socketRef.current?.readyState);
        }
    }, []);

    useEffect(() => {
        // Setup ping interval
        const intervalMs = parseInt(process.env.NEXT_PUBLIC_PING_INTERVAL_MS || "5000", 10);
        pingIntervalRef.current = setInterval(() => {
            if (socketRef.current?.readyState === WebSocket.OPEN) {
               sendPing();
            }
        }, intervalMs);

        return () => {
            if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        };
    }, [sendPing]);
    
    // Actions
    const startGame = useCallback(() => sendMessage({ action: "StartGame", payload: null }), [sendMessage]);
    const nextRound = useCallback(() => sendMessage({ action: "NextRound", payload: null }), [sendMessage]);
    const placeBet = useCallback((amount: number) => sendMessage({ action: "PlaceBet", payload: { amount } }), [sendMessage]);
    const sendGameAction = useCallback((type: "Hit" | "Stand" | "Double" | "Split") => sendMessage({ action: "GameAction", payload: { action_type: type } }), [sendMessage]);
    const sendChat = useCallback((message: string) => sendMessage({ action: "Chat", payload: { message } }), [sendMessage]);
    
    // Admin Actions
    const approvePlayer = useCallback((player_id: string) => {
        sendMessage({ action: "ApprovePlayer", payload: { player_id } });
        setPendingRequests(prev => prev.filter(p => p.id !== player_id)); // Optimistic remove
    }, [sendMessage]);
    const kickPlayer = useCallback((player_id: string) => sendMessage({ action: "KickPlayer", payload: { player_id } }), [sendMessage]);
    const updateSettings = useCallback((settings: GameSettings) => sendMessage({ action: "UpdateSettings", payload: { settings } }), [sendMessage]);
    const updateBalance = useCallback((target_id: string, change_chips: number) => sendMessage({ action: "AdminUpdateBalance", payload: { target_id, change_chips } }), [sendMessage]);
    const disconnect = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.close();
            setGameState(null);
            setIsConnected(false);
        }
    }, []);

    const connect = useCallback((gameId: string, username?: string) => {
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
                if(username) {
                    console.log("Sending JoinGame:", { username });
                    sendMessage({ action: "JoinGame", payload: { username } });
                } else {
                    console.warn("Connected but no username provided and not reconnecting. Waiting for JoinGame.");
                }
            } else {
                 console.log("Reconnecting with existing session");
                 addToast("Resuming session...", 'info');
                 // Trigger immediate ping to verify
                 ws.send(JSON.stringify({ action: "Ping", payload: null }));
            }
        };

        ws.onmessage = (event) => {
            try {
                // Ignore messages that are not JSON
                if (typeof event.data !== 'string') return;
                
                // Log all messages except Pong to reduce noise
                const msg: any = JSON.parse(event.data);
                if (msg.event !== 'Pong') {
                    console.log(`[WS RX] ${msg.event}`, msg.data);
                }

                if (msg.event) {
                     // Handle JoinedLobby specially here to save to localStorage since handleServerEvent logic was moved
                     if (msg.event === "JoinedLobby") {
                        console.log("Handling JoinedLobby event", msg.data);
                        const { your_id, secret, is_admin } = msg.data;
                        if (your_id && secret) {
                            console.log("Saving auth credentials to localStorage");
                            localStorage.setItem(`blackjack_auth_${gameId}`, JSON.stringify({ id: your_id, secret }));
                            setMyPlayerId(your_id);
                        }
                     }
                     if (msg.event === "Pong") {
                        setLatency(Date.now() - lastPingTimeRef.current);
                     } else {
                         handleServerEvent(msg, gameId);
                     }
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

            // Handle Kicked Specifics
            // Code 4000 or reason containing "Kicked" are common conventions or server implementations
            // If the server sends a generic close, we might rely on a prior message or just reason text.
            if (event.code === 4000 || event.reason.toLowerCase().includes("kick")) {
                console.warn("Player was kicked by admin.");
                setConnectionError({
                    title: "You Have Been Kicked",
                    msg: "An administrator has removed you from the game room."
                });
                localStorage.removeItem(`blackjack_auth_${gameId}`);
                return;
            }

            // 403 Forbidden usually means full or invalid reconnection
            if (event.code === 403 || event.reason.includes("Forbidden")) {
                 console.warn("Connection rejected (403 Forbidden). Clearing auth.");
                 addToast("Connection rejected (Full or Invalid)", 'error');
                 setConnectionError({
                     title: "Connection Rejected",
                     msg: "The game room is full or access was denied. Please ask an administrator to increase the player limit or try again later."
                 });
                 localStorage.removeItem(`blackjack_auth_${gameId}`);
            } else {
                 addToast("Disconnected from server", 'error');
            }
        };

        ws.onerror = (err) => {
            console.error("WebSocket error", err);
            addToast("WebSocket connection error", 'error');
        };
    }, [addToast, sendMessage, lastPingTime]); // lastPingTime dependency is problematic for connect, but we will fix handler.

    const handleServerEvent = (msg: any, gameId: string) => {
        switch (msg.event) {
            case "GameStateSnapshot":
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
                // Handle "Kicked" message if server sends it as an Error event before closing
                if (msg.data.msg && msg.data.msg.toLowerCase().includes("kick")) {
                    setConnectionError({
                        title: "You Have Been Kicked",
                        msg: "An administrator has removed you from the game room."
                    });
                    if (gameId) localStorage.removeItem(`blackjack_auth_${gameId}`); // Prevent auto-reconnect
                    if (socketRef.current) socketRef.current.close();
                } else {
                    addToast(msg.data.msg, 'error');
                }
                break;
        }
    };
    
// removed duplicate sendPing

    // Update the Pong handler inside the onmessage or handleServerEvent to use the ref
    // We'll move the specific Pong handling logic into the onmessage block in `connect` or ensure handleServerEvent reads the ref.
    // Actually simplicity: modify handleServerEvent to just do nothing for Pong, but handle it in onMessage where we can setLatency based on Ref.
    
    // Re-writing connect to be cleaner and use the Ref approach for pong.

    const actions = useMemo(() => ({
        startGame,
        nextRound,
        placeBet,
        sendGameAction,
        sendChat,
        approvePlayer,
        kickPlayer,
        updateSettings,
        updateBalance,
        disconnect
    }), [startGame, nextRound, placeBet, sendGameAction, sendChat, approvePlayer, kickPlayer, updateSettings, updateBalance, disconnect]);

    return {
        isConnected,
        gameState,
        myPlayerId,
        isAdmin,
        chatMessages,
        pendingRequests,
        toasts,
        latency,
        connectionError,
        connect,
        actions
    };
}
