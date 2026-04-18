import type { Card, FieldState, RuleConfig, Rank, Suit } from '~/types'

function getComboRank(cards: Card[]): Rank {
  const nonJoker = cards.filter(c => !c.isJoker)
  if (nonJoker.length === 0) return 16
  return nonJoker[0].rank as Rank
}

function isValidCombo(cards: Card[]): boolean {
  if (cards.length === 0) return false
  const nonJoker = cards.filter(c => !c.isJoker)
  if (nonJoker.length === 0) return true
  const firstRank = nonJoker[0].rank
  return nonJoker.every(c => c.rank === firstRank)
}

function isSandstorm(cards: Card[]): boolean {
  return cards.length === 3 && cards.every(c => !c.isJoker && c.rank === 3)
}

function isSpadeThree(cards: Card[]): boolean {
  return cards.length === 1 && !cards[0].isJoker &&
    cards[0].rank === 3 && cards[0].suit === 'spades'
}

function isNineFlush(cards: Card[]): boolean {
  return cards.length === 2 && cards.every(c => !c.isJoker && c.rank === 9)
}

function isSixFlush(cards: Card[]): boolean {
  return cards.length === 2 && cards.every(c => !c.isJoker && c.rank === 6)
}

function isFourStop(cards: Card[], field: FieldState): boolean {
  if (field.currentCards.length !== 1) return false
  const fc = field.currentCards[0]
  if (fc.isJoker || fc.rank !== 8) return false
  return cards.length === 2 && cards.every(c => !c.isJoker && c.rank === 4)
}

function isActuallyReversed(field: FieldState): boolean {
  return field.isReversed !== field.elevenBackActive
}

export function useCardLogic() {
  function canPlay(cards: Card[], field: FieldState, rules: RuleConfig): boolean {
    if (cards.length === 0) return false
    const fieldEmpty = field.currentCards.length === 0

    if (fieldEmpty) return isValidCombo(cards)

    if (rules.sandstorm && isSandstorm(cards)) return true
    if (rules.spadeThreeReturn &&
      field.currentCards.length === 1 && field.currentCards[0].isJoker &&
      isSpadeThree(cards)) return true
    if (rules.nineFlush && isNineFlush(cards)) return true
    if (rules.sixFlush && isSixFlush(cards)) return true
    if (rules.fourStop && isFourStop(cards, field)) return true

    if (cards.length !== field.currentCards.length) return false
    if (!isValidCombo(cards)) return false

    const fieldRank = getComboRank(field.currentCards)
    const playRank = getComboRank(cards)
    const reversed = isActuallyReversed(field)

    if (!reversed) {
      if (playRank <= fieldRank) return false
    } else {
      if (playRank >= fieldRank) return false
    }

    if (field.fieldLock === 'suit' && field.lockSuit) {
      const nonJoker = cards.filter(c => !c.isJoker)
      if (!nonJoker.every(c => c.suit === field.lockSuit)) return false
    }

    if (field.fieldLock === 'rank') {
      const fieldCardRank = field.currentCards.find(c => !c.isJoker)?.rank
      const playCardRank = cards.find(c => !c.isJoker)?.rank
      if (fieldCardRank && playCardRank && fieldCardRank !== playCardRank) return false
    }

    return true
  }

  function hasAnyValidPlay(hand: Card[], field: FieldState, rules: RuleConfig): boolean {
    const jokers = hand.filter(c => c.isJoker)
    const nonJokers = hand.filter(c => !c.isJoker)

    // Check single joker
    if (jokers.length > 0 && canPlay([jokers[0]], field, rules)) return true

    // Group by rank
    const byRank = new Map<Rank, Card[]>()
    for (const card of nonJokers) {
      const arr = byRank.get(card.rank) ?? []
      arr.push(card)
      byRank.set(card.rank, arr)
    }

    for (const [, cards] of byRank) {
      for (let count = 1; count <= Math.min(cards.length, 4); count++) {
        if (canPlay(cards.slice(0, count), field, rules)) return true
        if (jokers.length > 0 && count < 4) {
          if (canPlay([...cards.slice(0, count), jokers[0]], field, rules)) return true
        }
      }
    }
    return false
  }

  function getSuitSymbol(suit: Suit): string {
    const map: Record<Suit, string> = {
      spades: '♠',
      hearts: '♥',
      diamonds: '♦',
      clubs: '♣',
      joker: '🃏',
    }
    return map[suit]
  }

  function getSuitColor(suit: Suit): string {
    return suit === 'hearts' || suit === 'diamonds' ? 'text-red-500' : 'text-gray-900'
  }

  function getRankDisplay(rank: Rank): string {
    const map: Record<number, string> = {
      11: 'J', 12: 'Q', 13: 'K', 14: 'A', 15: '2', 16: '🃏'
    }
    return map[rank] ?? String(rank)
  }

  return { canPlay, hasAnyValidPlay, getSuitSymbol, getSuitColor, getRankDisplay }
}

