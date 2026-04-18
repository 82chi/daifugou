<template>
  <div class="relative flex items-end justify-center" :style="{ height: `${cardHeight + 40}px`, minWidth: `${fanWidth}px` }">
    <div
      v-for="(card, i) in hand"
      :key="card.id"
      class="absolute"
      :style="cardStyle(i)"
      @click="toggleSelect(card)"
    >
      <CardItem
        :card="card"
        :selected="selectedIds.has(card.id)"
        :disabled="!canPlayFn(card)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Card, FieldState, RuleConfig } from '~/types'

const props = defineProps<{
  hand: Card[]
  field: FieldState
  rules: RuleConfig
  selectedCards: Card[]
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:selectedCards': [cards: Card[]]
}>()

const { canPlay } = useCardLogic()

const cardHeight = 80
const cardWidth = 56
const fanWidth = computed(() => Math.max(200, props.hand.length * 28 + cardWidth))

function cardStyle(i: number) {
  const n = props.hand.length
  const totalAngle = Math.min(n * 6, 60)
  const startAngle = -totalAngle / 2
  const angle = n > 1 ? startAngle + (totalAngle / (n - 1)) * i : 0
  const spread = Math.min(n * 24, fanWidth.value - cardWidth)
  const x = n > 1 ? (spread / (n - 1)) * i : spread / 2
  const yOffset = Math.abs(angle) * 0.5
  return {
    left: `${x}px`,
    bottom: `${yOffset}px`,
    transform: `rotate(${angle}deg)`,
    transformOrigin: 'bottom center',
    zIndex: i,
    transition: 'all 0.15s ease',
  }
}

const selectedIds = computed(() => new Set(props.selectedCards.map(c => c.id)))

function canPlayFn(card: Card): boolean {
  if (props.disabled) return false
  return true
}

function toggleSelect(card: Card) {
  if (props.disabled) return
  const selected = props.selectedCards
  const exists = selected.find(c => c.id === card.id)
  if (exists) {
    emit('update:selectedCards', selected.filter(c => c.id !== card.id))
  } else {
    emit('update:selectedCards', [...selected, card])
  }
}
</script>
