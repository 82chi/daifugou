import type { Player, GameState, Card, Rank } from '~/types'

function getComboRank(cards: Card[]): Rank {
  const nonJoker = cards.filter(c => !c.isJoker)
  if (nonJoker.length === 0) return 16
  return nonJoker[0].rank as Rank
}

// Client-side CPU AI reference (actual AI runs server-side)
export function useCpuAi() {
  async function think(player: Player, state: GameState): Promise<Card[] | null> {
    const delay = { weak: 2000, normal: 1200, strong: 600 }[player.cpuLevel ?? 'normal']
    await new Promise(r => setTimeout(r, delay + Math.random() * 800))
    return null
  }

  return { think }
}

