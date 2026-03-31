import type { Card, Suit, Rank } from '~/types'

const SUITS: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs']
const RANKS: Rank[] = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]

export function createDeck(jokerCount: 1 | 2 = 1): Card[] {
  const cards: Card[] = []
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      cards.push({ id: `${suit}-${rank}`, suit, rank, isJoker: false })
    }
  }
  for (let i = 0; i < jokerCount; i++) {
    cards.push({ id: `joker-${i}`, suit: 'joker', rank: 16, isJoker: true })
  }
  return shuffle(cards)
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** カードの強さ比較（革命考慮）rank数値が大きいほど強い */
export function compareRank(a: Rank, b: Rank, isReversed: boolean): number {
  return isReversed ? b - a : a - b
}
