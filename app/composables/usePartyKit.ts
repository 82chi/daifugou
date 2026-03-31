import PartySocket from 'partysocket'
import type { ClientMessage, ServerMessage, GameState } from '~/types'

export function usePartyKit(roomCode: string) {
  const config = useRuntimeConfig()
  const gameState = ref<GameState | null>(null)
  const socket = ref<PartySocket | null>(null)

  function connect(playerName: string) {
    socket.value = new PartySocket({
      host: config.public.partyKitHost,
      room: roomCode,
      party: 'daifugou',
    })

    socket.value.addEventListener('message', (event: MessageEvent) => {
      const msg: ServerMessage = JSON.parse(event.data)
      // TODO: ハンドラー実装
      if (msg.type === 'state_update') {
        gameState.value = msg.payload
      }
    })
  }

  function send(msg: ClientMessage) {
    socket.value?.send(JSON.stringify(msg))
  }

  function disconnect() {
    socket.value?.close()
  }

  return { gameState, connect, send, disconnect }
}
