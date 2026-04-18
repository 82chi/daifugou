<template>
  <div
    :class="[
      'relative select-none cursor-pointer rounded-lg border-2 shadow-md transition-all duration-150',
      'bg-white flex flex-col items-center justify-between p-1',
      selected ? '-translate-y-3 border-blue-400 shadow-blue-200' : 'border-gray-200 hover:border-gray-400',
      disabled ? 'opacity-40 cursor-not-allowed' : '',
      small ? 'w-10 h-14 text-xs' : 'w-14 h-20 text-sm',
    ]"
    @click="!disabled && $emit('click')"
  >
    <template v-if="card.isJoker">
      <span class="text-lg">🃏</span>
      <span class="text-xs font-bold text-purple-600">JOKER</span>
    </template>
    <template v-else>
      <div :class="['font-bold leading-none', suitColor]">
        <div>{{ rankDisplay }}</div>
        <div class="text-xs">{{ suitSymbol }}</div>
      </div>
      <div :class="['text-lg leading-none', suitColor]">{{ suitSymbol }}</div>
      <div :class="['font-bold leading-none rotate-180', suitColor]">
        <div>{{ rankDisplay }}</div>
        <div class="text-xs">{{ suitSymbol }}</div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { Card, Suit, Rank } from '~/types'

const props = defineProps<{
  card: Card
  selected?: boolean
  disabled?: boolean
  small?: boolean
}>()

defineEmits<{ click: [] }>()

const { getSuitSymbol, getSuitColor, getRankDisplay } = useCardLogic()

const suitSymbol = computed(() => getSuitSymbol(props.card.suit))
const suitColor = computed(() => getSuitColor(props.card.suit))
const rankDisplay = computed(() => getRankDisplay(props.card.rank))
</script>
