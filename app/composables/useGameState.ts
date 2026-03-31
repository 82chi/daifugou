import type { GameState } from '~/types'

export function useGameState() {
  const state = ref<GameState | null>(null)

  // TODO: 各種ゲーム状態のcomputed
  const currentPlayer = computed(() =>
    state.value?.players.find(p => p.id === state.value?.currentTurnPlayerId)
  )

  return { state, currentPlayer }
}
