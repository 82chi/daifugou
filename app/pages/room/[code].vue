<template>
  <div class="min-h-screen bg-green-900 text-white p-4">
    <div class="max-w-2xl mx-auto">
      <!-- ヘッダー -->
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold">🃏 {{ $t('room.title') }}</h1>
        <div class="flex items-center gap-2">
          <span class="text-sm text-green-300">{{ $t('room.code') }}:</span>
          <span class="font-mono font-bold text-lg tracking-widest bg-green-800 px-3 py-1 rounded-lg">{{ code }}</span>
          <button @click="copyLink" class="text-green-300 hover:text-white transition">📋</button>
        </div>
      </div>

      <!-- TODO: PlayerList -->
      <!-- TODO: RuleSettings (ホストのみ) -->
      <!-- TODO: CPU追加 -->
      <!-- TODO: ChatPanel -->
      <!-- TODO: 開始ボタン -->

      <div class="bg-green-800 rounded-xl p-6 text-center text-green-300">
        {{ $t('room.waiting') }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const code = computed(() => (route.params.code as string).toUpperCase())

function copyLink() {
  navigator.clipboard.writeText(window.location.href)
}
</script>
