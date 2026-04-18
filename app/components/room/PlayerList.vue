<template>
  <div class="space-y-2">
    <div v-for="player in players" :key="player.id"
      class="flex items-center justify-between bg-green-700 rounded-lg px-3 py-2"
    >
      <div class="flex items-center gap-2">
        <span>{{ player.avatar === 'male' ? '🚹' : '🚺' }}</span>
        <span class="text-white text-sm font-medium">{{ player.name }}</span>
        <span v-if="player.isHost" class="text-yellow-400 text-xs">👑</span>
        <span v-if="player.isCpu" class="text-green-400 text-xs">
          CPU ({{ t(`cpu.${player.cpuLevel}`) }})
        </span>
      </div>
      <div class="flex items-center gap-2">
        <span :class="['w-2 h-2 rounded-full', player.isConnected ? 'bg-green-400' : 'bg-red-400']" />
        <button
          v-if="isHost && player.isCpu"
          @click="$emit('removeCpu', player.id)"
          class="text-red-400 hover:text-red-300 text-xs px-1"
        >✕</button>
      </div>
    </div>

    <!-- Empty slots -->
    <div v-for="i in emptySlots" :key="`empty-${i}`"
      class="flex items-center gap-2 bg-green-800 rounded-lg px-3 py-2 border border-dashed border-green-600"
    >
      <span class="text-green-500 text-sm">＋</span>
      <span class="text-green-500 text-sm">{{ t('room.waiting') }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Player } from '~/types'

const props = defineProps<{
  players: Player[]
  isHost: boolean
  maxPlayers?: number
}>()

defineEmits<{ removeCpu: [id: string] }>()

const { t } = useI18n()

const emptySlots = computed(() => {
  const max = props.maxPlayers ?? 6
  return Math.max(0, max - props.players.length)
})
</script>
