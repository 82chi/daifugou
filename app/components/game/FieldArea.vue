<template>
  <div class="bg-green-800 rounded-2xl p-4 min-h-32 flex flex-col items-center justify-center gap-2">
    <!-- Field cards -->
    <div v-if="field.currentCards.length > 0" class="flex gap-2 items-center justify-center flex-wrap">
      <CardItem
        v-for="card in field.currentCards"
        :key="card.id"
        :card="card"
        :disabled="true"
        :small="false"
      />
    </div>
    <div v-else class="text-green-400 text-sm">
      {{ t('game.fieldEmpty') }}
    </div>

    <!-- Status badges -->
    <div class="flex gap-2 flex-wrap justify-center">
      <span v-if="field.isReversed" class="px-2 py-0.5 bg-red-600 text-white text-xs rounded-full">
        {{ t('game.revolution') }}
      </span>
      <span v-if="field.elevenBackActive" class="px-2 py-0.5 bg-yellow-500 text-black text-xs rounded-full">
        {{ t('game.elevenBack') }}
      </span>
      <span v-if="field.fieldLock === 'suit' && field.lockSuit" class="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
        {{ getSuitSymbol(field.lockSuit) }} {{ t('game.suitLock') }}
      </span>
      <span v-if="field.fieldLock === 'rank'" class="px-2 py-0.5 bg-purple-600 text-white text-xs rounded-full">
        {{ t('game.rankLock') }}
      </span>
    </div>

    <!-- Pass count -->
    <div v-if="field.passCount > 0" class="text-green-400 text-xs">
      PASS ×{{ field.passCount }}
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FieldState, Suit } from '~/types'

defineProps<{ field: FieldState }>()

const { t } = useI18n()
const { getSuitSymbol } = useCardLogic()
</script>
