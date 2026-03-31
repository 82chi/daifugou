<template>
  <div class="min-h-screen bg-green-900 text-white">
    <!-- TODO: FieldArea -->
    <!-- TODO: PlayerSeats -->
    <!-- TODO: CardFan (自分の手札) -->
    <!-- TODO: ActionButtons (出す/パス) -->
    <!-- TODO: ChatPanel -->
    <!-- TODO: InfoModal -->
    <div class="flex items-center justify-center h-screen text-green-300">
      {{ $t('game.loading') }}
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const code = computed(() => (route.params.code as string).toUpperCase())
</script>
