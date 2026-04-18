<template>
  <div class="min-h-screen bg-green-900 text-white flex flex-col">
    <!-- Loading state -->
    <div v-if="!gameState || gameState.phase === 'waiting'" class="flex items-center justify-center h-screen text-green-300">
      {{ t('game.loading') }}
    </div>

    <template v-else>
      <!-- Rule notification overlay -->
      <Transition name="fade">
        <div v-if="ruleNotification"
          class="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
        >
          <div class="text-4xl font-bold text-yellow-300 drop-shadow-lg bg-black/40 px-8 py-4 rounded-2xl">
            {{ ruleNotification }}
          </div>
        </div>
      </Transition>

      <!-- Card exchange phase -->
      <div v-if="gameState.phase === 'card_exchange'" class="flex items-center justify-center h-screen p-4">
        <div class="bg-green-800 rounded-2xl p-6 max-w-md w-full space-y-4">
          <h2 class="text-xl font-bold text-center">{{ t('game.exchangePhase') }}</h2>
          <p class="text-green-300 text-sm text-center">{{ exchangeInstruction }}</p>

          <div v-if="pendingExchangeAction">
            <CardFan
              :hand="myHand"
              :field="gameState.field"
              :rules="gameState.rules"
              :selected-cards="selectedCards"
              @update:selected-cards="selectedCards = $event"
            />
            <button
              @click="submitExchange"
              :disabled="selectedCards.length !== pendingExchangeCount"
              class="w-full mt-4 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 text-green-900 font-bold py-2 rounded-xl"
            >
              {{ t('game.giveCards', { n: pendingExchangeCount }) }}
            </button>
          </div>
        </div>
      </div>

      <!-- Main game layout -->
      <div v-else-if="gameState.phase === 'playing'" class="flex flex-col h-screen">
        <!-- Top: other players -->
        <div class="flex items-start justify-center gap-2 p-3 flex-wrap">
          <PlayerSeat
            v-for="player in otherPlayers"
            :key="player.id"
            :player="player"
            :is-current-turn="gameState.currentTurnPlayerId === player.id"
          />
        </div>

        <!-- Middle: field -->
        <div class="flex-1 flex flex-col items-center justify-center gap-3 px-4">
          <FieldArea :field="gameState.field" />

          <!-- Turn indicator -->
          <div class="text-sm text-green-300">
            <span v-if="isMyTurn" class="text-yellow-300 font-bold animate-pulse">{{ t('game.yourTurn') }}</span>
            <span v-else>{{ t('game.waitingTurn', { name: currentTurnPlayer?.name ?? '' }) }}</span>
          </div>
        </div>

        <!-- Bottom: my hand + actions -->
        <div class="p-3 space-y-3">
          <!-- My player seat -->
          <div class="flex justify-center">
            <PlayerSeat
              v-if="myPlayer"
              :player="myPlayer"
              :is-current-turn="isMyTurn"
            />
          </div>

          <!-- Hand -->
          <div class="flex justify-center overflow-x-auto">
            <CardFan
              :hand="myHand"
              :field="gameState.field"
              :rules="gameState.rules"
              :selected-cards="selectedCards"
              :disabled="!isMyTurn || !!pendingAction"
              @update:selected-cards="selectedCards = $event"
            />
          </div>

          <!-- Pending action: seven pass -->
          <div v-if="pendingAction?.type === 'seven_pass' && pendingAction.playerId === myPlayerId" class="bg-blue-800 rounded-xl p-3 text-center">
            <p class="text-sm mb-2">{{ t('game.sevenPassInstruction', { n: pendingAction.cardCount }) }}</p>
            <button
              @click="submitSevenPass"
              :disabled="selectedCards.length !== pendingAction.cardCount"
              class="bg-blue-500 hover:bg-blue-400 disabled:opacity-40 text-white px-6 py-2 rounded-xl font-bold"
            >
              {{ t('game.give') }}
            </button>
          </div>

          <!-- Pending action: ten discard -->
          <div v-else-if="pendingAction?.type === 'ten_discard' && pendingAction.playerId === myPlayerId" class="bg-purple-800 rounded-xl p-3 text-center">
            <p class="text-sm mb-2">{{ t('game.tenDiscardInstruction', { n: pendingAction.cardCount }) }}</p>
            <button
              @click="submitTenDiscard"
              :disabled="selectedCards.length !== pendingAction.cardCount"
              class="bg-purple-500 hover:bg-purple-400 disabled:opacity-40 text-white px-6 py-2 rounded-xl font-bold"
            >
              {{ t('game.discard') }}
            </button>
          </div>

          <!-- Pending action: queen bomber -->
          <div v-else-if="pendingAction?.type === 'queen_bomber' && pendingAction.playerId === myPlayerId" class="bg-pink-800 rounded-xl p-3 text-center space-y-2">
            <p class="text-sm">{{ t('game.queenBomberInstruction') }}</p>
            <div class="flex flex-wrap gap-1 justify-center">
              <button
                v-for="rank in rankOptions"
                :key="rank.value"
                @click="submitQueenBomber(rank.value)"
                class="bg-pink-600 hover:bg-pink-500 text-white px-2 py-1 rounded text-sm font-bold"
              >
                {{ rank.display }}
              </button>
            </div>
          </div>

          <!-- Normal play actions -->
          <div v-else-if="isMyTurn" class="flex gap-2 justify-center">
            <button
              @click="playCards"
              :disabled="selectedCards.length === 0 || !canPlaySelected"
              class="bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 text-green-900 font-bold px-8 py-2 rounded-xl"
            >
              {{ t('game.play') }}
            </button>
            <button
              @click="pass"
              :disabled="gameState.field.currentCards.length === 0"
              class="bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white font-bold px-8 py-2 rounded-xl"
            >
              {{ t('game.pass') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Chat sidebar toggle -->
      <div class="fixed right-0 top-1/2 -translate-y-1/2 z-40">
        <button
          @click="showChat = !showChat"
          class="bg-green-700 hover:bg-green-600 text-white p-2 rounded-l-xl"
        >💬</button>
      </div>

      <!-- Chat panel -->
      <Transition name="slide-right">
        <div v-if="showChat" class="fixed right-0 top-0 bottom-0 w-72 bg-green-800 shadow-xl z-40 flex flex-col">
          <div class="flex items-center justify-between p-3 border-b border-green-700">
            <span class="font-bold">{{ t('chat.title') }}</span>
            <button @click="showChat = false" class="text-green-400 hover:text-white">✕</button>
          </div>
          <div class="flex-1 min-h-0">
            <ChatPanel
              :messages="chatMessages"
              :can-stamp="myPlayer?.status !== 'spectating'"
              @chat="sendChat"
              @stamp="sendStamp"
            />
          </div>
        </div>
      </Transition>

      <!-- Info modal -->
      <InfoModal
        :is-open="showInfo"
        :rules="gameState.rules"
        @close="showInfo = false"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import type { Rank } from '~/types'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const code = computed(() => (route.params.code as string).toUpperCase())

const showChat = ref(false)
const showInfo = ref(false)
const selectedCards = ref<any[]>([])

const { gameState, myHand, ruleNotification, chatMessages, isConnected, send, connect } = usePartyKit(code.value)
const { canPlay } = useCardLogic()
const { getRankDisplay } = useCardLogic()

const myPlayerId = ref('')

const myPlayer = computed(() => {
  if (!gameState.value) return null
  return gameState.value.players.find(p => p.id === myPlayerId.value) ?? null
})

const otherPlayers = computed(() => {
  if (!gameState.value) return []
  return gameState.value.players.filter(p => p.id !== myPlayerId.value)
})

const currentTurnPlayer = computed(() => {
  if (!gameState.value) return null
  return gameState.value.players.find(p => p.id === gameState.value!.currentTurnPlayerId) ?? null
})

const isMyTurn = computed(() => {
  if (!gameState.value || !myPlayerId.value) return false
  return gameState.value.currentTurnPlayerId === myPlayerId.value
})

const pendingAction = computed(() => {
  // Infer from state - not directly tracked in state, but we can detect via phase/field
  return null as any // Simplified for now
})

const canPlaySelected = computed(() => {
  if (!gameState.value || selectedCards.value.length === 0) return false
  return canPlay(selectedCards.value, gameState.value.field, gameState.value.rules)
})

// Card exchange helpers
const pendingExchangeAction = computed(() => {
  if (!gameState.value || gameState.value.phase !== 'card_exchange') return null
  const myRole = getMyExchangeRole()
  return myRole
})

const pendingExchangeCount = computed(() => {
  const role = getMyExchangeRole()
  return role?.count ?? 0
})

const exchangeInstruction = computed(() => {
  const role = getMyExchangeRole()
  if (!role) return t('game.exchangeWaiting')
  if (role.type === 'give') return t('game.exchangeGiveInstruction', { n: role.count })
  return t('game.exchangeReturnInstruction', { n: role.count })
})

function getMyExchangeRole(): { type: 'give' | 'return'; count: number } | null {
  if (!gameState.value?.exchangePhase) return null
  const { pendingExchanges } = gameState.value.exchangePhase
  const givePending = pendingExchanges.find(ex => ex.fromPlayerId === myPlayerId.value)
  if (givePending) {
    const isDaihinmin = myPlayer.value?.titleRank === 'daihinmin'
    return { type: 'give', count: isDaihinmin ? 2 : 1 }
  }
  // Check if I'm receiver and giver has already given
  const receivePending = pendingExchanges.find(ex => ex.toPlayerId === myPlayerId.value)
  if (receivePending) {
    const isDaifugo = myPlayer.value?.titleRank === 'daifugo'
    return { type: 'return', count: isDaifugo ? 2 : 1 }
  }
  return null
}

const rankOptions = computed(() => {
  const ranks: Rank[] = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
  return ranks.map(r => ({ value: r, display: getRankDisplay(r) }))
})

watch(gameState, (state) => {
  if (!state) return
  const name = localStorage.getItem('daifugou_name') ?? ''
  const me = state.players.find(p => p.name === name && !p.isCpu)
  if (me) myPlayerId.value = me.id

  if (state.phase === 'game_end') {
    router.push(`/result/${code.value}`)
  }
})

onMounted(() => {
  const name = localStorage.getItem('daifugou_name') ?? 'Player'
  const avatar = (localStorage.getItem('daifugou_avatar') ?? 'male') as 'male' | 'female'
  connect(name, false, avatar)
})

function playCards() {
  if (selectedCards.value.length === 0 || !canPlaySelected.value) return
  send({ type: 'play_cards', payload: { cards: selectedCards.value } })
  selectedCards.value = []
}

function pass() {
  send({ type: 'pass' })
}

function submitExchange() {
  if (selectedCards.value.length !== pendingExchangeCount.value) return
  send({ type: 'exchange_cards', payload: { cards: selectedCards.value } })
  selectedCards.value = []
}

function submitSevenPass() {
  const p = pendingAction.value
  if (!p || p.type !== 'seven_pass') return
  send({ type: 'seven_pass', payload: { cards: selectedCards.value } })
  selectedCards.value = []
}

function submitTenDiscard() {
  send({ type: 'ten_discard', payload: { cards: selectedCards.value } })
  selectedCards.value = []
}

function submitQueenBomber(rank: Rank) {
  send({ type: 'queen_bomber', payload: { declaredRank: rank } })
}

function sendChat(content: string) {
  send({ type: 'chat', payload: { content } })
}

function sendStamp(emoji: string) {
  send({ type: 'stamp', payload: { emoji } })
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.5s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.slide-right-enter-active, .slide-right-leave-active { transition: transform 0.3s ease; }
.slide-right-enter-from, .slide-right-leave-to { transform: translateX(100%); }
</style>
