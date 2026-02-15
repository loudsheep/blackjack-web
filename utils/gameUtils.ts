import { Card } from "@/app/types";

export const CARD_VALUES: Record<string, number> = {
  Two: 2, Three: 3, Four: 4, Five: 5, Six: 6,
  Seven: 7, Eight: 8, Nine: 9, Ten: 10,
  Jack: 10, Queen: 10, King: 10, Ace: 11,
};

export function calculateHandValue(cards: Card[]): number {
  if (!cards || !Array.isArray(cards)) return 0;

  let value = 0;
  let aces = 0;

  for (const card of cards) {
    if (!card || !card.rank) continue;
    if (card.rank === "Ace") aces++;
    value += CARD_VALUES[card.rank] || 0;
  }

  while (value > 21 && aces > 0) {
    value -= 10;
    aces--;
  }

  return value;
}
