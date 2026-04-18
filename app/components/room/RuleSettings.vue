<template>
  <div class="space-y-3">
    <h3 class="text-white font-bold text-sm">{{ t('room.rules') }}</h3>

    <!-- Joker count -->
    <div class="flex items-center justify-between">
      <span class="text-green-200 text-sm">{{ t('rules.jokerCount') }}</span>
      <div class="flex gap-1">
        <button
          v-for="n in [1, 2]"
          :key="n"
          @click="update('jokerCount', n)"
          :class="['px-3 py-1 rounded-lg text-sm font-bold transition', localRules.jokerCount === n ? 'bg-green-400 text-green-900' : 'bg-green-700 text-green-200 hover:bg-green-600']"
        >{{ n }}</button>
      </div>
    </div>

    <!-- Toggle rules -->
    <div v-for="rule in toggleRules" :key="rule.key" class="flex items-center justify-between">
      <span class="text-green-200 text-sm">{{ t(`rules.${rule.key}`) }}</span>
      <button
        @click="toggleRule(rule.key as keyof RuleConfig)"
        :class="['relative w-10 h-5 rounded-full transition', (localRules as any)[rule.key] ? 'bg-green-400' : 'bg-green-700']"
      >
        <span
          :class="['absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform', (localRules as any)[rule.key] ? 'translate-x-5' : 'translate-x-0.5']"
        />
      </button>
    </div>

    <!-- Suit lock count (shown if suitLock enabled) -->
    <div v-if="localRules.suitLock" class="flex items-center justify-between pl-4">
      <span class="text-green-300 text-xs">{{ t('rules.suitLockCount') }}</span>
      <div class="flex gap-1">
        <button
          v-for="n in [2, 3]"
          :key="n"
          @click="update('suitLockCount', n)"
          :class="['px-2 py-0.5 rounded text-xs font-bold transition', localRules.suitLockCount === n ? 'bg-green-400 text-green-900' : 'bg-green-700 text-green-200']"
        >{{ n }}</button>
      </div>
    </div>

    <!-- Five skip multi (shown if fiveSkip enabled) -->
    <div v-if="localRules.fiveSkip" class="flex items-center justify-between pl-4">
      <span class="text-green-300 text-xs">{{ t('rules.fiveSkipMulti') }}</span>
      <div class="flex gap-1">
        <button
          v-for="mode in ['each', 'chain']"
          :key="mode"
          @click="update('fiveSkipMulti', mode)"
          :class="['px-2 py-0.5 rounded text-xs font-bold transition', localRules.fiveSkipMulti === mode ? 'bg-green-400 text-green-900' : 'bg-green-700 text-green-200']"
        >{{ t(`rules.fiveSkipMulti_${mode}`) }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RuleConfig } from '~/types'

const props = defineProps<{
  modelValue: RuleConfig
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [rules: RuleConfig]
}>()

const { t } = useI18n()

const localRules = ref<RuleConfig>({ ...props.modelValue })

watch(() => props.modelValue, (v) => { localRules.value = { ...v } }, { deep: true })

const toggleRules = [
  { key: 'revolution' }, { key: 'eightCut' }, { key: 'spadeThreeReturn' },
  { key: 'forbiddenWin' }, { key: 'suitLock' }, { key: 'rankLock' },
  { key: 'elevenBack' }, { key: 'queenBomber' }, { key: 'sandstorm' },
  { key: 'nineFlush' }, { key: 'sixFlush' }, { key: 'fourStop' },
  { key: 'fiveSkip' }, { key: 'sevenPass' }, { key: 'tenDiscard' },
  { key: 'nineReverse' }, { key: 'sevenRevolution' },
]

function toggleRule(key: keyof RuleConfig) {
  if (props.disabled) return
  ;(localRules.value as any)[key] = !(localRules.value as any)[key]
  emit('update:modelValue', { ...localRules.value })
}

function update(key: keyof RuleConfig, value: any) {
  if (props.disabled) return
  ;(localRules.value as any)[key] = value
  emit('update:modelValue', { ...localRules.value })
}
</script>
