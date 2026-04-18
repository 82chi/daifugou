<template>
  <div class="flex flex-wrap gap-1 p-1 border-t border-green-700">
    <button
      v-for="emoji in stamps"
      :key="emoji"
      @click="tryStamp(emoji)"
      :disabled="cooldown"
      class="text-xl hover:scale-125 transition-transform disabled:opacity-40 disabled:cursor-not-allowed"
      :title="cooldown ? `${cooldownSec}s` : ''"
    >
      {{ emoji }}
    </button>
    <span v-if="cooldown" class="text-green-400 text-xs self-center">{{ cooldownSec }}s</span>
  </div>
</template>

<script setup lang="ts">
const stamps = ['👏', '😭', '💀', '🫠', '😏', '🤭', '🙏', '🤝', '🔥']

const emit = defineEmits<{ stamp: [emoji: string] }>()

const cooldown = ref(false)
const cooldownSec = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

function tryStamp(emoji: string) {
  if (cooldown.value) return
  emit('stamp', emoji)
  cooldown.value = true
  cooldownSec.value = 5
  timer = setInterval(() => {
    cooldownSec.value--
    if (cooldownSec.value <= 0) {
      cooldown.value = false
      if (timer) clearInterval(timer)
    }
  }, 1000)
}
</script>
