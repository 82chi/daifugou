import type { GameState, Player, Card, TitleRank } from '~/types'

export function useGameState() {
  const state = ref<GameState | null>(null)
  const myHand = ref<Card[]>([])

  const players = computed(() => state.value?.players ?? [])
  const currentPlayer = computed(() =>
    state.value?.players.find(p => p.id === state.value?.currentTurnPlayerId)
  )
  const field = computed(() => state.value?.field)
  const rules = computed(() => state.value?.rules)
  const phase = computed(() => state.value?.phase)
  const isMyTurn = computed(() => {
    if (!state.value) return false
    const myId = localStorage.getItem('daifugou_player_id')
    return state.value.currentTurnPlayerId === myId
  })

  const titleColors: Record<TitleRank, string> = {
    daifugo: 'text-yellow-400',
    fugo: 'text-gray-300',
    heimin: 'text-gray-400',
    hinmin: 'text-amber-700',
    daihinmin: 'text-gray-900',
  }

  const titleBgColors: Record<TitleRank, string> = {
    daifugo: 'bg-yellow-400',
    fugo: 'bg-gray-300',
    heimin: 'bg-gray-400',
    hinmin: 'bg-amber-700',
    daihinmin: 'bg-gray-800',
  }

  function getTitleColor(rank: TitleRank | undefined): string {
    return rank ? titleColors[rank] : 'text-white'
  }

  function getTitleBg(rank: TitleRank | undefined): string {
    return rank ? titleBgColors[rank] : 'bg-green-700'
  }

  return {
    state,
    myHand,
    players,
    currentPlayer,
    field,
    rules,
    phase,
    isMyTurn,
    getTitleColor,
    getTitleBg,
  }
}

