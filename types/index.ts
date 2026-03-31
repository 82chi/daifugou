// ============================================================
// カード
// ============================================================
export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs' | 'joker'
// Rank: 3〜15(=2), 16=Joker
export type Rank = 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16
export interface Card {
  id: string
  suit: Suit
  rank: Rank
  isJoker: boolean
}

// ============================================================
// プレイヤー
// ============================================================
export type PlayerStatus = 'waiting' | 'playing' | 'finished' | 'spectating' | 'observing'
export type CpuLevel = 'weak' | 'normal' | 'strong'
export type TitleRank = 'daifugo' | 'fugo' | 'heimin' | 'hinmin' | 'daihinmin'
export type Avatar = 'male' | 'female'

export interface Player {
  id: string
  name: string
  isCpu: boolean
  cpuLevel?: CpuLevel
  hand: Card[]          // 自分のみ。他プレイヤーはhandCount参照
  handCount: number
  status: PlayerStatus
  titleRank?: TitleRank
  finishOrder?: number
  isHost: boolean
  isConnected: boolean
  avatar: Avatar
}

// ============================================================
// ゲームルール設定（17種）
// ============================================================
export interface RuleConfig {
  jokerCount: 1 | 2

  // ① 革命
  revolution: boolean
  // ③ 8切り
  eightCut: boolean
  // ④ スペ3返し
  spadeThreeReturn: boolean
  // ⑤ 禁止上がり（2/ジョーカーで上がると反則負け）
  forbiddenWin: boolean
  // ⑥ マークしばり（発動枚数: 2 or 3）
  suitLock: boolean
  suitLockCount: 2 | 3
  // ⑦ 数字しばり
  rankLock: boolean
  // ⑩ イレブンバック
  elevenBack: boolean
  // ⑪ クイーンボンバー
  queenBomber: boolean
  // ⑫ 砂嵐（3×3枚）
  sandstorm: boolean
  // ⑬ 救急車・99車（9×2枚→場流れ）
  nineFlush: boolean
  // ⑭ ろくろ首（6×2枚→場流れ）
  sixFlush: boolean
  // ⑮ 4止め
  fourStop: boolean
  // ⑯ 5スキップ（複数枚時: each=1人ずつ, chain=連鎖）
  fiveSkip: boolean
  fiveSkipMulti: 'each' | 'chain'
  // ⑰ 7渡し
  sevenPass: boolean
  // ⑱ 10捨て
  tenDiscard: boolean
  // ⑲ 9リバース（99車と競合時は99車優先）
  nineReverse: boolean
  // ⑳ ななさん革命（7×3枚→革命＋7渡し3枚同時発動）
  sevenRevolution: boolean
}

// ============================================================
// 場の状態
// ============================================================
export type FieldLock = 'suit' | 'rank' | null

export interface FieldState {
  currentCards: Card[]
  currentPlayerId: string
  passCount: number
  isReversed: boolean          // 革命中かどうか
  fieldLock: FieldLock
  lockSuit?: Suit
  elevenBackActive: boolean
  luckySevenPending: boolean
  lastPlayerId: string
}

// ============================================================
// ゲームフェーズ
// ============================================================
export type GamePhase =
  | 'waiting'
  | 'card_exchange'
  | 'playing'
  | 'round_end'
  | 'game_end'

// ============================================================
// カード交換フェーズ
// ============================================================
export interface Exchange {
  fromPlayerId: string
  toPlayerId: string
  cardsToGive?: Card[]
}

export interface ExchangePhaseState {
  pendingExchanges: Exchange[]
  completedExchanges: string[]
}

// ============================================================
// チャット
// ============================================================
export type MessageType = 'chat' | 'stamp' | 'system'

export interface ChatMessage {
  id: string
  playerId: string
  playerName: string
  type: MessageType
  content: string
  timestamp: number
}

// ============================================================
// ゲーム状態（全体）
// ============================================================
export interface GameState {
  roomCode: string
  phase: GamePhase
  players: Player[]
  currentTurnPlayerId: string
  turnOrder: string[]
  field: FieldState
  rules: RuleConfig
  roundNumber: number
  exchangePhase?: ExchangePhaseState
  chatMessages: ChatMessage[]
}

// ============================================================
// PartyKit メッセージ型
// ============================================================
export type ClientMessage =
  | { type: 'join';            payload: { name: string; isHost: boolean; avatar: Avatar } }
  | { type: 'reconnect';       payload: { name: string } }
  | { type: 'add_cpu';         payload: { level: CpuLevel } }
  | { type: 'remove_cpu';      payload: { cpuId: string } }
  | { type: 'update_rules';    payload: { rules: RuleConfig } }
  | { type: 'start_game' }
  | { type: 'play_cards';      payload: { cards: Card[] } }
  | { type: 'pass' }
  | { type: 'exchange_cards';  payload: { cards: Card[] } }
  | { type: 'seven_pass';      payload: { cards: Card[] } }
  | { type: 'ten_discard';     payload: { cards: Card[] } }
  | { type: 'queen_bomber';    payload: { declaredRank: Rank } }
  | { type: 'chat';            payload: { content: string } }
  | { type: 'stamp';           payload: { emoji: string } }
  | { type: 'select_spectate'; payload: { targetPlayerId: string } }
  | { type: 'rematch' }

export type ServerMessage =
  | { type: 'state_update';   payload: GameState }
  | { type: 'hand_update';    payload: { hand: Card[] } }
  | { type: 'spectate_hand';  payload: { playerId: string; hand: Card[] } }
  | { type: 'chat_message';   payload: ChatMessage }
  | { type: 'rule_triggered'; payload: { rule: string; message: string } }
  | { type: 'error';          payload: { message: string } }
