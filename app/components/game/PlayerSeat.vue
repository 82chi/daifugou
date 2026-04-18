<template>
  <div
    :class="[
      'flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all min-w-16',
      isCurrentTurn ? 'border-yellow-400 bg-green-700 shadow-lg shadow-yellow-400/30' : 'border-green-700 bg-green-800',
      player.status === 'finished' ? 'opacity-60' : '',
    ]"
  >
    <!-- Avatar -->
    <div class="text-2xl">{{ player.avatar === 'male' ? '🚹' : '🚺' }}</div>

    <!-- Name -->
    <div class="text-xs text-center text-white font-medium truncate max-w-16">
      {{ player.name }}
      <span v-if="player.isCpu" class="text-green-400 text-xs ml-0.5">(CPU)</span>
    </div>

    <!-- Title badge -->
    <span
      v-if="player.titleRank"
      :class="['text-xs px-1.5 py-0.5 rounded-full font-bold', titleBg]"
    >
      {{ t(`title.${player.titleRank}`) }}
    </span>

    <!-- Card count -->
    <div class="text-green-300 text-xs">🃏 ×{{ player.handCount }}</div>

    <!-- Connection status -->
    <div v-if="!player.isConnected" class="text-red-400 text-xs">📵</div>

    <!-- Current turn indicator -->
    <div v-if="isCurrentTurn" class="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
  </div>
</template>

<script setup lang="ts">
import type { Player, TitleRank } from '~/types'

const props = defineProps<{
  player: Player
  isCurrentTurn: boolean
}>()

const { t } = useI18n()
const { getTitleBg } = useGameState()

const titleBg = computed(() => getTitleBg(props.player.titleRank))
</script>
