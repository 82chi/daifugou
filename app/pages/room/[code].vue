<template>
  <div class="min-h-screen bg-green-900 text-white p-4">
    <div class="max-w-2xl mx-auto space-y-4">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold">🃏 {{ t('room.title') }}</h1>
        <div class="flex items-center gap-2">
          <span class="text-sm text-green-300">{{ t('room.code') }}:</span>
          <span class="font-mono font-bold text-lg tracking-widest bg-green-800 px-3 py-1 rounded-lg">{{ code }}</span>
          <button @click="copyLink" class="text-green-300 hover:text-white transition text-sm">📋</button>
          <button @click="showInfo = true" class="text-green-300 hover:text-white transition text-sm">ℹ️</button>
        </div>
      </div>

      <!-- Connection status -->
      <div v-if="!isConnected" class="bg-yellow-800 rounded-xl p-3 text-center text-yellow-200 text-sm animate-pulse">
        🔄 {{ t('room.connecting') }}
      </div>
      <div v-else-if="errorMessage" class="bg-red-800 rounded-xl p-3 text-center text-red-200 text-sm">
        ⚠️ {{ errorMessage }}
      </div>

      <!-- Player list -->
      <div class="bg-green-800 rounded-xl p-4">
        <PlayerList
          v-if="gameState"
          :players="gameState.players"
          :is-host="amHost"
          @remove-cpu="removeCpu"
        />
        <div v-else class="text-green-400 text-center text-sm py-4">
          {{ t('room.waiting') }}
        </div>
      </div>

      <!-- CPU Add buttons (host only) -->
      <div v-if="amHost && gameState && gameState.players.length < 6" class="flex gap-2 flex-wrap">
        <span class="text-green-300 text-sm self-center">{{ t('room.addCpu') }}:</span>
        <button
          v-for="level in (['weak', 'normal', 'strong'] as const)"
          :key="level"
          @click="addCpu(level)"
          class="bg-green-700 hover:bg-green-600 text-white text-sm px-3 py-1.5 rounded-lg transition"
        >
          {{ t(`cpu.${level}`) }}
        </button>
      </div>

      <!-- Rule settings (host only) -->
      <div v-if="amHost && gameState" class="bg-green-800 rounded-xl p-4">
        <RuleSettings
          v-model="currentRules"
          @update:model-value="onRulesChange"
        />
      </div>
      <div v-else-if="gameState" class="bg-green-800 rounded-xl p-4 text-sm text-green-300">
        <div class="font-bold mb-2">{{ t('room.rules') }}</div>
        <div class="flex flex-wrap gap-1">
          <span v-for="rule in enabledRuleNames" :key="rule" class="bg-green-700 px-2 py-0.5 rounded text-xs">{{ rule }}</span>
        </div>
      </div>

      <!-- Start button (host only) -->
      <button
        v-if="amHost"
        @click="startGame"
        :disabled="!canStart"
        class="w-full bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 text-green-900 font-bold py-3 rounded-xl text-lg transition"
      >
        {{ t('room.startGame') }}
      </button>
      <div v-else class="text-center text-green-400 text-sm">
        {{ t('room.waitingHost') }}
      </div>

      <!-- Chat -->
      <div v-if="gameState" class="bg-green-800 rounded-xl overflow-hidden" style="height: 200px">
        <ChatPanel
          :messages="chatMessages"
          :can-stamp="true"
          @chat="sendChat"
          @stamp="sendStamp"
        />
      </div>
    </div>

    <!-- Info modal -->
    <InfoModal
      v-if="gameState"
      :is-open="showInfo"
      :rules="gameState.rules"
      @close="showInfo = false"
    />
  </div>
</template>

<script setup lang="ts">
import type { CpuLevel, RuleConfig } from '~/types'
import { RULE_LIST, DEFAULT_RULES } from '../../../utils/rules'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const code = computed(() => (route.params.code as string).toUpperCase())

const showInfo = ref(false)
const currentRules = ref<RuleConfig>({ ...DEFAULT_RULES })

const { gameState, chatMessages, isConnected, errorMessage, send, connect } = usePartyKit(code.value)

// Determine if current user is host
const myId = ref('')
const amHost = computed(() => {
  if (!gameState.value) return false
  const me = gameState.value.players.find(p => p.id === myId.value)
  return me?.isHost ?? false
})

const canStart = computed(() => {
  if (!gameState.value) return false
  return gameState.value.players.length >= 2
})

const enabledRuleNames = computed(() => {
  if (!gameState.value) return []
  return RULE_LIST.filter(r => (gameState.value!.rules as any)[r.key] === true).map(r => r.name)
})

watch(gameState, (state) => {
  if (!state) return
  currentRules.value = { ...state.rules }
  // Detect my ID from connection
  const name = localStorage.getItem('daifugou_name') ?? ''
  const me = state.players.find(p => p.name === name && !p.isCpu)
  if (me) myId.value = me.id

  // Navigate to game when started
  if (state.phase === 'playing' || state.phase === 'card_exchange') {
    router.push(`/game/${code.value}`)
  }
})

onMounted(() => {
  const name = localStorage.getItem('daifugou_name') ?? 'Player'
  const avatar = (localStorage.getItem('daifugou_avatar') ?? 'male') as 'male' | 'female'
  connect(name, route.query.host === '1', avatar)
})

onUnmounted(() => {
  // keep socket for game page
})

function copyLink() {
  navigator.clipboard.writeText(window.location.href)
}

function addCpu(level: CpuLevel) {
  send({ type: 'add_cpu', payload: { level } })
}

function removeCpu(id: string) {
  send({ type: 'remove_cpu', payload: { cpuId: id } })
}

function onRulesChange(rules: RuleConfig) {
  send({ type: 'update_rules', payload: { rules } })
}

function startGame() {
  send({ type: 'start_game' })
}

function sendChat(content: string) {
  send({ type: 'chat', payload: { content } })
}

function sendStamp(emoji: string) {
  send({ type: 'stamp', payload: { emoji } })
}
</script>
