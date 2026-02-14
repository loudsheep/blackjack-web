export type Suit = "Hearts" | "Diamonds" | "Clubs" | "Spades";
export type Rank = "Two" | "Three" | "Four" | "Five" | "Six" | "Seven" | "Eight" | "Nine" | "Ten" | "Jack" | "Queen" | "King" | "Ace";

export interface Card {
    suit: Suit;
    rank: Rank;
}

export type PlayerStatus = "Playing" | "Stood" | "Busted" | "Blackjack" | "Won" | "Lost" | "Push" | "Surrender";

export interface Player {
    id: string;
    name: string;
    chips: number;
    hands: Card[][]; // Changed to array of hands (arrays of cards)
    status: PlayerStatus;
    is_admin: boolean;
    bet: number;
}

export interface GameSettings {
    initial_chips: number;
    max_players: number;
    deck_count: number;
    approval_required: boolean;
    chat_enabled: boolean;
}

export type GamePhase = "Lobby" | "Betting" | "Playing" | "DealerTurn" | "Payout" | "GameOver";

export interface GameState {
    phase: GamePhase;
    dealer_hand: Card[];
    players: Player[];
    deck_remaining: number;
    current_turn_player_id: string | null;
    settings: GameSettings;
}

export interface ChatMessage {
    from: string;
    msg: string;
    timestamp: number;
}

export interface PlayerRequest {
    id: string;
    name: string;
}

// Client Actions (Frontend -> Backend)
export type ClientAction =
    | { action: "JoinGame"; payload: { username: string } }
    | { action: "StartGame"; payload: null }
    | { action: "NextRound"; payload: null }
    | { action: "PlaceBet"; payload: { amount: number } }
    | { action: "GameAction"; payload: { action_type: "Hit" | "Stand" | "Double" | "Split" } }
    | { action: "Chat"; payload: { message: string } }
    | { action: "ApprovePlayer"; payload: { player_id: string } }
    | { action: "KickPlayer"; payload: { player_id: string } }
    | { action: "UpdateSettings"; payload: { settings: GameSettings } }
    | { action: "AdminUpdateBalance"; payload: { target_id: string; change_chips: number } };

// Server Events (Backend -> Frontend)
export type ServerEvent =
    | { event: "GameStateSnapshot"; data: GameState }
    | { event: "JoinedLobby"; data: { game_id: string; your_id: string; is_admin: boolean } }
    | { event: "ChatBroadcast"; data: { from: string; msg: string } }
    | { event: "PlayerRequest"; data: { id: string; name: string } }
    | { event: "Error"; data: { msg: string } };

