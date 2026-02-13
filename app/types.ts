export type Suit = "Hearts" | "Diamonds" | "Clubs" | "Spades";
export type Rank = "Two" | "Three" | "Four" | "Five" | "Six" | "Seven" | "Eight" | "Nine" | "Ten" | "Jack" | "Queen" | "King" | "Ace";

export interface Card {
    suit: Suit;
    rank: Rank;
}

export interface PlayerInfo {
    id: string;
    username: string;
}

export type ActionType = "Hit" | "Stand" | "Double" | "Split";

export type RoundResult = 
    | { Winners: string[] } 
    | "DealerWins" 
    | "Push";

export type GameEvent =
    | { type: "PlayerJoined"; payload: PlayerInfo }
    | { type: "CardDealt"; payload: { player_id: string; card: Card } }
    | { type: "TurnChanged"; payload: { player_id: string } }
    | { type: "RoundEnded"; payload: RoundResult }
    | { type: "GameStarted"; payload: null };

export type ClientMessage = 
  | { type: "Join"; payload: { room_id: string; username: string } }
  | { type: "Bet"; payload: { amount: number } }
  | { type: "Action"; payload: ActionType }
  | { type: "Chat"; payload: { msg: string } }
  | { type: "StartGame"; payload: null };

export type ServerMessage =
    | { type: "Error"; payload: { msg: string } }
    | { type: "GameState"; payload: any } // Full snapshot if needed
    | { type: "Event"; payload: GameEvent };
