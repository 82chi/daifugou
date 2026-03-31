<template>
  <div class="min-h-screen bg-green-900 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl p-8 w-full max-w-sm shadow-xl">
      <h1 class="text-3xl font-bold text-center text-green-800 mb-8">🃏 ダイフゴウ</h1>

      <!-- アバター選択 -->
      <div class="flex justify-center gap-6 mb-6">
        <button
          v-for="av in ['male', 'female']"
          :key="av"
          @click="avatar = av as Avatar"
          :class="['text-4xl p-3 rounded-full border-4 transition', avatar === av ? 'border-green-500' : 'border-transparent']"
        >
          {{ av === 'male' ? '🚹' : '🚺' }}
        </button>
      </div>

      <!-- ニックネーム -->
      <input
        v-model="name"
        type="text"
        :placeholder="$t('top.namePlaceholder')"
        maxlength="10"
        class="w-full border-2 border-gray-200 rounded-xl px-4 py-3 mb-6 text-center text-lg focus:border-green-400 outline-none"
      />

      <!-- ルーム作成 -->
      <button
        @click="createRoom"
        :disabled="!name.trim()"
        class="w-full bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white font-bold py-3 rounded-xl mb-3 transition"
      >
        {{ $t('top.createRoom') }}
      </button>

      <!-- ルームコード入力 -->
      <div class="flex gap-2">
        <input
          v-model="roomCode"
          type="text"
          :placeholder="$t('top.roomCodePlaceholder')"
          maxlength="6"
          class="flex-1 border-2 border-gray-200 rounded-xl px-4 py-3 text-center uppercase tracking-widest focus:border-green-400 outline-none"
        />
        <button
          @click="joinRoom"
          :disabled="!name.trim() || !roomCode.trim()"
          class="bg-blue-500 hover:bg-blue-600 disabled:opacity-40 text-white font-bold px-4 rounded-xl transition"
        >
          {{ $t('top.join') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Avatar } from '~/types'

const name = ref('')
const roomCode = ref('')
const avatar = ref<Avatar>('male')

function generateRoomCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

async function createRoom() {
  if (!name.value.trim()) return
  const code = generateRoomCode()
  localStorage.setItem('daifugou_name', name.value.trim())
  localStorage.setItem('daifugou_avatar', avatar.value)
  await navigateTo(`/room/${code}?host=1`)
}

async function joinRoom() {
  if (!name.value.trim() || !roomCode.value.trim()) return
  localStorage.setItem('daifugou_name', name.value.trim())
  localStorage.setItem('daifugou_avatar', avatar.value)
  await navigateTo(`/room/${roomCode.value.trim().toUpperCase()}`)
}
</script>
