<template>
  <div class="flex flex-col h-full">
    <!-- Messages -->
    <div ref="messagesEl" class="flex-1 overflow-y-auto space-y-1 p-2 min-h-0">
      <div
        v-for="msg in messages"
        :key="msg.id"
        :class="['text-sm', msg.type === 'system' ? 'text-green-400 text-center text-xs italic' : '']"
      >
        <template v-if="msg.type === 'stamp'">
          <div class="flex items-center gap-1">
            <span class="text-green-300 text-xs">{{ msg.playerName }}</span>
            <span class="text-2xl">{{ msg.content }}</span>
          </div>
        </template>
        <template v-else-if="msg.type === 'chat'">
          <span class="text-green-300 text-xs font-bold">{{ msg.playerName }}: </span>
          <span class="text-white">{{ msg.content }}</span>
        </template>
        <template v-else>
          <span>{{ msg.content }}</span>
        </template>
      </div>
      <div ref="bottomEl" />
    </div>

    <!-- Stamps -->
    <StampPanel v-if="canStamp" @stamp="$emit('stamp', $event)" />

    <!-- Input -->
    <div class="flex gap-1 p-2 border-t border-green-700">
      <input
        v-model="inputText"
        @keydown.enter="sendChat"
        :placeholder="t('chat.placeholder')"
        maxlength="100"
        class="flex-1 bg-green-700 text-white placeholder-green-400 rounded-lg px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-green-400"
      />
      <button
        @click="sendChat"
        :disabled="!inputText.trim()"
        class="bg-green-500 hover:bg-green-400 disabled:opacity-40 text-white px-3 py-1 rounded-lg text-sm font-bold"
      >
        {{ t('chat.send') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ChatMessage } from '~/types'

const props = defineProps<{
  messages: ChatMessage[]
  canStamp?: boolean
}>()

const emit = defineEmits<{
  chat: [content: string]
  stamp: [emoji: string]
}>()

const { t } = useI18n()
const inputText = ref('')
const messagesEl = ref<HTMLElement | null>(null)
const bottomEl = ref<HTMLElement | null>(null)

function sendChat() {
  if (!inputText.value.trim()) return
  emit('chat', inputText.value.trim())
  inputText.value = ''
}

watch(() => props.messages.length, async () => {
  await nextTick()
  bottomEl.value?.scrollIntoView({ behavior: 'smooth' })
})
</script>
