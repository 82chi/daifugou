<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      @click.self="$emit('close')"
    >
      <div class="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-hidden shadow-2xl">
        <div class="flex items-center justify-between px-6 py-4 border-b">
          <h2 class="text-xl font-bold text-green-800">{{ t('room.info') }}</h2>
          <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600 text-2xl leading-none">✕</button>
        </div>
        <div class="overflow-y-auto max-h-[60vh] p-4 space-y-4">
          <div v-for="rule in activeRules" :key="rule.key" class="border rounded-xl p-3">
            <div class="flex items-center gap-2 mb-1">
              <span class="bg-green-100 text-green-800 text-xs font-bold px-2 py-0.5 rounded-full">ON</span>
              <span class="font-bold text-gray-800">{{ rule.name }}</span>
            </div>
            <p class="text-sm text-gray-600">{{ rule.description }}</p>
          </div>
          <p v-if="activeRules.length === 0" class="text-gray-500 text-center">{{ t('room.noRules') }}</p>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { RuleConfig } from '~/types'
import { RULE_LIST } from '../../../utils/rules'

const props = defineProps<{
  isOpen: boolean
  rules: RuleConfig
}>()

defineEmits<{ close: [] }>()

const { t } = useI18n()

const activeRules = computed(() =>
  RULE_LIST.filter(r => (props.rules as any)[r.key] === true)
)
</script>
