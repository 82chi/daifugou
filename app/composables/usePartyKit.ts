import PartySocket from 'partysocket'
import type { ClientMessage, ServerMessage, GameState, Card, ChatMessage } from '~/types'

export function usePartyKit(roomCode: string) {
  const config = useRuntimeConfig()
  const gameState = ref<GameState | null>(null)
  const myHand = ref<Card[]>([])
  const ruleNotification = ref<string | null>(null)
  const errorMessage = ref<string | null>(null)
  const chatMessages = ref<ChatMessage[]>([])
  const socket = ref<PartySocket | null>(null)
  const isConnected = ref(false)

  let notifTimer: ReturnType<typeof setTimeout> | null = null

  function showNotification(msg: string) {
    ruleNotification.value = msg
    if (notifTimer) clearTimeout(notifTimer)
    notifTimer = setTimeout(() => { ruleNotification.value = null }, 3000)
  }

  function connect(playerName: string, isHost = false, avatar: 'male' | 'female' = 'male') {
    socket.value = new PartySocket({
      host: config.public.partyKitHost,
      room: roomCode,
      party: 'daifugou',
    })

    socket.value.addEventListener('open', () => {
      isConnected.value = true
      const savedName = localStorage.getItem('daifugou_name') ?? playerName
      const savedAvatar = (localStorage.getItem('daifugou_avatar') ?? avatar) as 'male' | 'female'
      const hostFlag = new URLSearchParams(window.location.search).has('host')
      send({ type: 'join', payload: { name: savedName, isHost: hostFlag, avatar: savedAvatar } })
    })

    socket.value.addEventListener('message', (event: MessageEvent) => {
      const msg: ServerMessage = JSON.parse(event.data)
      switch (msg.type) {
        case 'state_update':
          gameState.value = msg.payload
          // Merge chat from state
          if (msg.payload.chatMessages) {
            chatMessages.value = msg.payload.chatMessages
          }
          break
        case 'hand_update':
          myHand.value = msg.payload.hand
          break
        case 'chat_message':
          chatMessages.value = [...chatMessages.value.slice(-49), msg.payload]
          break
        case 'rule_triggered':
          showNotification(msg.payload.message)
          break
        case 'error':
          errorMessage.value = msg.payload.message
          setTimeout(() => { errorMessage.value = null }, 3000)
          break
      }
    })

    socket.value.addEventListener('close', () => {
      isConnected.value = false
    })
  }

  function reconnect(playerName: string) {
    socket.value = new PartySocket({
      host: config.public.partyKitHost,
      room: roomCode,
      party: 'daifugou',
    })
    socket.value.addEventListener('open', () => {
      isConnected.value = true
      send({ type: 'reconnect', payload: { name: playerName } })
    })
    socket.value.addEventListener('message', (event: MessageEvent) => {
      const msg: ServerMessage = JSON.parse(event.data)
      if (msg.type === 'state_update') gameState.value = msg.payload
      if (msg.type === 'hand_update') myHand.value = msg.payload.hand
      if (msg.type === 'chat_message') chatMessages.value = [...chatMessages.value.slice(-49), msg.payload]
      if (msg.type === 'rule_triggered') showNotification(msg.payload.message)
    })
  }

  function send(msg: ClientMessage) {
    socket.value?.send(JSON.stringify(msg))
  }

  function disconnect() {
    socket.value?.close()
    isConnected.value = false
  }

  return {
    gameState,
    myHand,
    ruleNotification,
    errorMessage,
    chatMessages,
    isConnected,
    connect,
    reconnect,
    send,
    disconnect,
  }
}

