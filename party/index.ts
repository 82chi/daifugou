import type * as Party from 'partykit/server'
import type { GameState, ClientMessage, ServerMessage } from '../types'
import { DEFAULT_RULES } from '../utils/rules'

export default class DaifugouServer implements Party.Server {
  private state: GameState | null = null

  constructor(readonly room: Party.Room) {}

  onConnect(conn: Party.Connection) {
    if (this.state) {
      // 既存の状態を送信（reconnect対応）
      conn.send(JSON.stringify({ type: 'state_update', payload: this.sanitizeState(conn.id) }))
    }
  }

  onMessage(message: string, sender: Party.Connection) {
    const msg: ClientMessage = JSON.parse(message)
    // TODO: 各メッセージのハンドラー実装
    switch (msg.type) {
      case 'join':
        this.handleJoin(sender, msg.payload)
        break
      // ... 他のハンドラーはPhase 2で実装
    }
  }

  onClose(conn: Party.Connection) {
    // TODO: 切断処理（CPU引継ぎ・ホスト移譲）
  }

  private handleJoin(conn: Party.Connection, payload: { name: string; isHost: boolean; avatar: 'male' | 'female' }) {
    if (!this.state) {
      this.state = {
        roomCode: this.room.id,
        phase: 'waiting',
        players: [],
        currentTurnPlayerId: '',
        turnOrder: [],
        field: {
          currentCards: [],
          currentPlayerId: '',
          passCount: 0,
          isReversed: false,
          fieldLock: null,
          elevenBackActive: false,
          luckySevenPending: false,
          lastPlayerId: '',
        },
        rules: { ...DEFAULT_RULES },
        roundNumber: 0,
        chatMessages: [],
      }
    }
    // TODO: プレイヤー追加処理
    this.broadcast({ type: 'state_update', payload: this.state })
  }

  private sanitizeState(connectionId: string): GameState {
    // 他プレイヤーの手札を隠す
    if (!this.state) throw new Error('No state')
    return {
      ...this.state,
      players: this.state.players.map(p => ({
        ...p,
        hand: p.id === connectionId ? p.hand : [],
      })),
    }
  }

  private broadcast(msg: ServerMessage) {
    this.room.broadcast(JSON.stringify(msg))
  }
}
