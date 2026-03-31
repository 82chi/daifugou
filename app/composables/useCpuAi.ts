import type { Player, GameState, Card } from '~/types'

export function useCpuAi() {
  // TODO: CPUの思考ロジック（強さ別）
  async function think(player: Player, state: GameState): Promise<Card[] | null> {
    const delay = { weak: 2000, normal: 1200, strong: 600 }[player.cpuLevel ?? 'normal']
    await new Promise(r => setTimeout(r, delay + Math.random() * 800))
    return null // placeholder: パス
  }

  return { think }
}
