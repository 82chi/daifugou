<template>
  <div class="min-h-screen bg-green-900 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl p-8 w-full max-w-sm text-center shadow-xl">
      <h2 class="text-2xl font-bold text-green-800 mb-6">{{ $t('result.title') }}</h2>
      <!-- TODO: 順位・称号表示 -->
      <!-- TODO: もう一度ボタン -->
      <!-- TODO: トップへ戻るボタン -->
      <p class="text-gray-500">{{ $t('result.loading') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const code = computed(() => (route.params.code as string).toUpperCase())
</script>
