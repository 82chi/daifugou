<template>
  <div class="min-h-screen bg-green-900 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl p-8 w-full max-w-md text-center shadow-xl">
      <h2 class="text-2xl font-bold text-green-800 mb-6">{{ t('result.title') }}</h2>

      <!-- Loading -->
      <div v-if="!gameState || gameState.phase !== 'game_end'" class="text-gray-500 py-8">
        {{ t('result.loading') }}
      </div>

      <template v-else>
        <!-- Rankings -->
        <div class="space-y-2 mb-6">
          <div
            v-for="player in rankedPlayers"
            :key="player.id"
            :class="['flex items-center gap-3 p-3 rounded-xl', titleBgClass(player.titleRank)]"
          >
            <span class="text-2xl font-bold text-white w-8 text-center">{{ player.finishOrder }}</span>
            <span class="text-xl">{{ player.avatar === 'male' ? '🚹' : '🚺' }}</span>
            <div class="flex-1 text-left">
              <div class="font-bold text-white">{{ player.name }}</div>
              <div class="text-xs text-white/80">{{ t(`title.${player.titleRank}`) }}</div>
            </div>
            <span v-if="player.isCpu" class="text-white/70 text-xs">CPU</span>
          </div>
        </div>

        <!-- Actions -->
        <div class="space-y-2">
          <button
            v-if="amHost"
            @click="rematch"
            class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition"
          >
            {{ t('result.rematch') }}
          </button>
          <div v-else-if="gameState" class="text-gray-400 text-sm">
            {{ t('result.waitingHost') }}
          </div>
          <button
            @click="backToTop"
            class="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition"
          >
            {{ t('result.backToTop') }}
          </button>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TitleRank } from '~/types'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const code = computed(() => (route.params.code as string).toUpperCase())

const { gameState, send, connect } = usePartyKit(code.value)

const myPlayerId = ref('')
const amHost = computed(() => {
  if (!gameState.value) return false
  const me = gameState.value.players.find(p => p.id === myPlayerId.value)
  return me?.isHost ?? false
})

const rankedPlayers = computed(() => {
  if (!gameState.value) return []
  return [...gameState.value.players].sort((a, b) => (a.finishOrder ?? 99) - (b.finishOrder ?? 99))
})

function titleBgClass(rank: TitleRank | undefined): string {
  const map: Record<TitleRank, string> = {
    daifugo: 'bg-yellow-500',
    fugo: 'bg-gray-400',
    heimin: 'bg-gray-500',
    hinmin: 'bg-amber-700',
    daihinmin: 'bg-gray-800',
  }
  return rank ? map[rank] : 'bg-gray-500'
}

watch(gameState, (state) => {
  if (!state) return
  const name = localStorage.getItem('daifugou_name') ?? ''
  const me = state.players.find(p => p.name === name && !p.isCpu)
  if (me) myPlayerId.value = me.id

  if (state.phase === 'waiting') {
    router.push(`/room/${code.value}?host=1`)
  } else if (state.phase === 'playing' || state.phase === 'card_exchange') {
    router.push(`/game/${code.value}`)
  }
})

onMounted(() => {
  const name = localStorage.getItem('daifugou_name') ?? 'Player'
  const avatar = (localStorage.getItem('daifugou_avatar') ?? 'male') as 'male' | 'female'
  connect(name, false, avatar)
})

function rematch() {
  send({ type: 'rematch' })
}

function backToTop() {
  router.push('/')
}
</script>
