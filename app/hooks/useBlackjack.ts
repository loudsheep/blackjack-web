import { useEffect, useRef, useState, useCallback } from 'react';
import { ClientMessage, ServerMessage, GameEvent, PlayerInfo, Card, RoundResult, ActionType } from '../types';

interface PlayerState extends PlayerInfo {
    hand: Card[];
}

interface GameState {
    players: Record<string, PlayerState>;
    turn: string | null;
    roundResult: RoundResult | null;
    isGameStarted: boolean;
    logs: string[];
}

export function useBlackjack() {
    const [isConnected, setIsConnected] = useState(false);
    const [gameState, setGameState] = useState<GameState>({
        players: {},
        turn: null,
        roundResult: null,
        isGameStarted: false,
        logs: [],
    });
    const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
    const myUsernameRef = useRef<string>("");
    const socketRef = useRef<WebSocket | null>(null);

    const connect = useCallback((url: string, roomId: string, username: string) => {
        myUsernameRef.current = username;
        if (socketRef.current) {
            socketRef.current.close();
        }

        const ws = new WebSocket(url);
        socketRef.current = ws;

        ws.onopen = () => {
            setIsConnected(true);
            addLog("Connected to server");
            // Auto join
            sendMessage({
                type: "Join",
                payload: { room_id: roomId, username }
            });
        };

        ws.onmessage = (event) => {
            try {
                const msg: ServerMessage = JSON.parse(event.data);
                handleServerMessage(msg);
            } catch (err) {
                console.error("Failed to parse message", err);
            }
        };

        ws.onclose = () => {
            setIsConnected(false);
            addLog("Disconnected from server");
        };

        ws.onerror = (err) => {
            console.error("WebSocket error", err);
            addLog("WebSocket Error occurred");
        };
    }, []);

    const sendMessage = (msg: ClientMessage) => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify(msg));
        }
    };

    const sendAction = (action: ActionType) => {
        sendMessage({ type: "Action", payload: action });
    };

    const startGame = () => {
        sendMessage({ type: "StartGame", payload: null });
    };

    const addLog = (msg: string) => {
        setGameState(prev => ({
            ...prev,
            logs: [...prev.logs, msg].slice(-20) // Keep last 20 logs
        }));
    };

    const handleServerMessage = (msg: ServerMessage) => {
        switch (msg.type) {
            case "Error":
                addLog(`Error: ${msg.payload.msg}`);
                break;
            case "Event":
                handleGameEvent(msg.payload);
                break;
            case "GameState":
                // If we implemented full state sync
                 addLog("Received full GameState snapshot (not fully implemented)");
                break;
        }
    };

    const handleGameEvent = (event: GameEvent) => {
        switch (event.type) {
            case "PlayerJoined":
                setGameState(prev => {
                    const isMe = event.payload.username === myUsernameRef.current;
                    if (isMe) {
                        setMyPlayerId(event.payload.id);
                    }
                    return {
                        ...prev,
                        players: {
                            ...prev.players,
                            [event.payload.id]: { ...event.payload, hand: [] }
                        },
                        logs: [...prev.logs, `Player ${event.payload.username} joined`]
                    };
                });
                break;
            case "GameStarted":
                setGameState(prev => ({
                    ...prev,
                    isGameStarted: true,
                    roundResult: null, // Reset previous results
                    logs: [...prev.logs, "Game Started!"]
                }));
                break;
            case "CardDealt":
                setGameState(prev => {
                    const { player_id, card } = event.payload;
                    const player = prev.players[player_id];
                    if (!player) {
                        // Might be dealer if ID not found? Or just a sync issue.
                        // If we assume dealer has a special ID or create one if missing:
                         return {
                             ...prev,
                             players: {
                                 ...prev.players,
                                 [player_id]: { id: player_id, username: player_id === 'dealer' ? 'Dealer' : 'Unknown', hand: [card] }
                             },
                             logs: [...prev.logs, `Card dealt to ${player_id}`]
                         };
                    }
                    return {
                        ...prev,
                        players: {
                            ...prev.players,
                            [player_id]: {
                                ...player,
                                hand: [...player.hand, card]
                            }
                        },
                         logs: [...prev.logs, `Card dealt to ${player.username}`]
                    };
                });
                break;
            case "TurnChanged":
                setGameState(prev => ({
                    ...prev,
                    turn: event.payload.player_id,
                    logs: [...prev.logs, `Turn: Player ${event.payload.player_id}`]
                }));
                break;
            case "RoundEnded":
                setGameState(prev => ({
                    ...prev,
                    roundResult: event.payload,
                    turn: null, // No one's turn
                    logs: [...prev.logs, "Round Ended"]
                }));
                break;
        }
    };

    return {
        isConnected,
        gameState,
        connect,
        sendAction,
        startGame,
        setMyPlayerId, // We might need to manually set this if we can match username
        myPlayerId
    };
}
