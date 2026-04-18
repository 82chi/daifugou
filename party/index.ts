import type * as Party from 'partykit/server'
import type {
  GameState, ClientMessage, ServerMessage, Card, Player,
  RuleConfig, Rank, Suit, Avatar, CpuLevel, TitleRank,
  FieldState, ExchangePhaseState, ChatMessage, Exchange,
} from '../types'
import { DEFAULT_RULES } from '../utils/rules'
import { createDeck, shuffle } from '../utils/deck'
import { getRandomCpuName } from '../utils/cpuNames'

// ============================================================
// Card Logic (server-side pure functions)
// ============================================================

function getComboRank(cards: Card[]): Rank {
  const nonJoker = cards.filter(c => !c.isJoker)
  if (nonJoker.length === 0) return 16
  return nonJoker[0].rank
}

function isValidCombo(cards: Card[]): boolean {
  if (cards.length === 0) return false
  const nonJoker = cards.filter(c => !c.isJoker)
  if (nonJoker.length === 0) return true
  const firstRank = nonJoker[0].rank
  return nonJoker.every(c => c.rank === firstRank)
}

function isSandstorm(cards: Card[]): boolean {
  return cards.length === 3 && cards.every(c => !c.isJoker && c.rank === 3)
}

function isSpadeThree(cards: Card[]): boolean {
  return cards.length === 1 && !cards[0].isJoker &&
    cards[0].rank === 3 && cards[0].suit === 'spades'
}

function isNineFlush(cards: Card[]): boolean {
  return cards.length === 2 && cards.every(c => !c.isJoker && c.rank === 9)
}

function isSixFlush(cards: Card[]): boolean {
  return cards.length === 2 && cards.every(c => !c.isJoker && c.rank === 6)
}

function isFourStop(cards: Card[], field: FieldState): boolean {
  if (field.currentCards.length !== 1) return false
  const fc = field.currentCards[0]
  if (fc.isJoker || fc.rank !== 8) return false
  return cards.length === 2 && cards.every(c => !c.isJoker && c.rank === 4)
}

function isActuallyReversed(field: FieldState): boolean {
  return field.isReversed !== field.elevenBackActive
}

function canPlayCards(cards: Card[], field: FieldState, rules: RuleConfig): boolean {
  if (cards.length === 0) return false
  const fieldEmpty = field.currentCards.length === 0

  if (fieldEmpty) return isValidCombo(cards)

  if (rules.sandstorm && isSandstorm(cards)) return true
  if (rules.spadeThreeReturn &&
    field.currentCards.length === 1 && field.currentCards[0].isJoker &&
    isSpadeThree(cards)) return true
  if (rules.nineFlush && isNineFlush(cards)) return true
  if (rules.sixFlush && isSixFlush(cards)) return true
  if (rules.fourStop && isFourStop(cards, field)) return true

  if (cards.length !== field.currentCards.length) return false
  if (!isValidCombo(cards)) return false

  const fieldRank = getComboRank(field.currentCards)
  const playRank = getComboRank(cards)
  const reversed = isActuallyReversed(field)

  if (!reversed) {
    if (playRank <= fieldRank) return false
  } else {
    if (playRank >= fieldRank) return false
  }

  if (field.fieldLock === 'suit' && field.lockSuit) {
    const nonJoker = cards.filter(c => !c.isJoker)
    if (!nonJoker.every(c => c.suit === field.lockSuit)) return false
  }

  if (field.fieldLock === 'rank') {
    const fieldCardRank = field.currentCards.find(c => !c.isJoker)?.rank
    const playCardRank = cards.find(c => !c.isJoker)?.rank
    if (fieldCardRank && playCardRank && fieldCardRank !== playCardRank) return false
  }

  return true
}

function getValidPlays(hand: Card[], field: FieldState, rules: RuleConfig): Card[][] {
  const plays: Card[][] = []
  const jokers = hand.filter(c => c.isJoker)
  const nonJokers = hand.filter(c => !c.isJoker)

  const byRank = new Map<Rank, Card[]>()
  for (const card of nonJokers) {
    const arr = byRank.get(card.rank) ?? []
    arr.push(card)
    byRank.set(card.rank, arr)
  }

  if (jokers.length > 0) {
    const jp = [jokers[0]]
    if (canPlayCards(jp, field, rules)) plays.push(jp)
  }

  for (const [, cards] of byRank) {
    for (let count = 1; count <= Math.min(cards.length, 4); count++) {
      const combo = cards.slice(0, count)
      if (canPlayCards(combo, field, rules)) plays.push([...combo])
      if (jokers.length > 0 && count < 4) {
        const jCombo = [...combo, jokers[0]]
        if (canPlayCards(jCombo, field, rules)) plays.push(jCombo)
      }
    }
  }

  return plays
}

function cpuChoosePlay(player: Player, state: GameState): Card[] | null {
  const plays = getValidPlays(player.hand, state.field, state.rules)
  if (plays.length === 0) return null

  if (player.cpuLevel === 'weak') {
    return plays[Math.floor(Math.random() * plays.length)]
  }

  const byWeakest = [...plays].sort((a, b) => {
    const dr = getComboRank(a) - getComboRank(b)
    return dr !== 0 ? dr : a.length - b.length
  })

  if (player.cpuLevel === 'normal') return byWeakest[0]

  // strong
  const opponents = state.players.filter(p => p.id !== player.id && p.status === 'playing')
  const minOpponent = Math.min(...opponents.map(p => p.handCount))
  if (minOpponent <= 3) {
    return [...plays].sort((a, b) => getComboRank(b) - getComboRank(a))[0]
  }
  return byWeakest[0]
}

function cpuThinkDelay(level?: CpuLevel): number {
  const base = { weak: 2000, normal: 1200, strong: 600 }[level ?? 'normal']
  return base + Math.random() * 800
}

// ============================================================
// Title assignment
// ============================================================

function assignTitles(finishOrder: string[], players: Player[]): void {
  const n = finishOrder.length
  finishOrder.forEach((pid, idx) => {
    const p = players.find(pl => pl.id === pid)
    if (!p) return
    p.finishOrder = idx + 1
    if (idx === 0) p.titleRank = 'daifugo'
    else if (idx === n - 1) p.titleRank = 'daihinmin'
    else if (n >= 4 && idx === 1) p.titleRank = 'fugo'
    else if (n >= 4 && idx === n - 2) p.titleRank = 'hinmin'
    else p.titleRank = 'heimin'
  })
}

// ============================================================
// Pending action types
// ============================================================

interface PendingSevenPass {
  type: 'seven_pass'
  playerId: string
  cardCount: number
  targetPlayerId: string
}
interface PendingTenDiscard {
  type: 'ten_discard'
  playerId: string
  cardCount: number
}
interface PendingQueenBomber {
  type: 'queen_bomber'
  playerId: string
}
type PendingAction = PendingSevenPass | PendingTenDiscard | PendingQueenBomber

// ============================================================
// PartyKit Server
// ============================================================

export default class DaifugouServer implements Party.Server {
  private state: GameState | null = null
  // connectionId -> playerId
  private connToPlayer = new Map<string, string>()
  private pendingAction: PendingAction | null = null
  private cpuTimer: ReturnType<typeof setTimeout> | null = null
  private finishOrder: string[] = []
  // Exchange tracking
  private exchangeSent = new Map<string, Card[]>()
  private exchangeReturned = new Map<string, Card[]>()

  constructor(readonly room: Party.Room) {}

  onConnect(conn: Party.Connection) {
    if (this.state) {
      conn.send(JSON.stringify({
        type: 'state_update',
        payload: this.sanitizeStateForBroadcast(),
      } satisfies ServerMessage))
      const pid = this.connToPlayer.get(conn.id)
      if (pid) {
        const p = this.state.players.find(pl => pl.id === pid)
        if (p && p.hand.length > 0) {
          conn.send(JSON.stringify({ type: 'hand_update', payload: { hand: p.hand } } satisfies ServerMessage))
        }
      }
    }
  }

  onMessage(message: string, sender: Party.Connection) {
    try {
      const msg: ClientMessage = JSON.parse(message)
      switch (msg.type) {
        case 'join': this.handleJoin(sender, msg.payload); break
        case 'reconnect': this.handleReconnect(sender, msg.payload); break
        case 'add_cpu': this.handleAddCpu(sender, msg.payload); break
        case 'remove_cpu': this.handleRemoveCpu(sender, msg.payload); break
        case 'update_rules': this.handleUpdateRules(sender, msg.payload); break
        case 'start_game': this.handleStartGame(sender); break
        case 'play_cards': this.handlePlayCards(sender, msg.payload); break
        case 'pass': this.handlePass(sender); break
        case 'exchange_cards': this.handleExchangeCards(sender, msg.payload); break
        case 'seven_pass': this.handleSevenPass(sender, msg.payload); break
        case 'ten_discard': this.handleTenDiscard(sender, msg.payload); break
        case 'queen_bomber': this.handleQueenBomber(sender, msg.payload); break
        case 'chat': this.handleChat(sender, msg.payload); break
        case 'stamp': this.handleStamp(sender, msg.payload); break
        case 'rematch': this.handleRematch(sender); break
      }
    } catch (e) {
      sender.send(JSON.stringify({ type: 'error', payload: { message: String(e) } } satisfies ServerMessage))
    }
  }

  onClose(conn: Party.Connection) {
    if (!this.state) return
    const pid = this.connToPlayer.get(conn.id)
    if (!pid) return
    const p = this.state.players.find(pl => pl.id === pid)
    if (!p) return
    p.isConnected = false

    if (p.isHost) {
      const next = this.state.players.find(pl => pl.id !== pid && !pl.isCpu && pl.isConnected)
      if (next) {
        p.isHost = false
        next.isHost = true
      }
    }

    if (this.state.phase === 'playing' && this.state.currentTurnPlayerId === pid) {
      setTimeout(() => this.autoPassForDisconnected(pid), 500)
    }

    this.broadcastState()
  }

  // ============================================================
  // Handlers
  // ============================================================

  private handleJoin(conn: Party.Connection, payload: { name: string; isHost: boolean; avatar: Avatar }) {
    if (!this.state) {
      this.state = this.createInitialState()
    }
    if (this.state.phase !== 'waiting') {
      conn.send(JSON.stringify({ type: 'error', payload: { message: 'Game already started' } } satisfies ServerMessage))
      return
    }
    if (this.state.players.length >= 6) {
      conn.send(JSON.stringify({ type: 'error', payload: { message: 'Room full' } } satisfies ServerMessage))
      return
    }
    const player: Player = {
      id: conn.id,
      name: payload.name,
      isCpu: false,
      hand: [],
      handCount: 0,
      status: 'waiting',
      isHost: payload.isHost && this.state.players.length === 0,
      isConnected: true,
      avatar: payload.avatar,
    }
    this.state.players.push(player)
    this.connToPlayer.set(conn.id, conn.id)
    this.broadcastState()
  }

  private handleReconnect(conn: Party.Connection, payload: { name: string }) {
    if (!this.state) return
    const p = this.state.players.find(pl => pl.name === payload.name && !pl.isCpu)
    if (!p) {
      conn.send(JSON.stringify({ type: 'error', payload: { message: 'Player not found' } } satisfies ServerMessage))
      return
    }
    this.connToPlayer.delete(p.id)
    this.connToPlayer.set(conn.id, p.id)
    p.isConnected = true
    conn.send(JSON.stringify({ type: 'state_update', payload: this.sanitizeStateForBroadcast() } satisfies ServerMessage))
    if (p.hand.length > 0) {
      conn.send(JSON.stringify({ type: 'hand_update', payload: { hand: p.hand } } satisfies ServerMessage))
    }
    this.broadcastState()
  }

  private handleAddCpu(conn: Party.Connection, payload: { level: CpuLevel }) {
    if (!this.state || !this.isHost(conn)) return
    if (this.state.players.length >= 6) return
    if (this.state.phase !== 'waiting') return
    const cpu: Player = {
      id: `cpu-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: getRandomCpuName(payload.level),
      isCpu: true,
      cpuLevel: payload.level,
      hand: [],
      handCount: 0,
      status: 'waiting',
      isHost: false,
      isConnected: true,
      avatar: Math.random() < 0.5 ? 'male' : 'female',
    }
    this.state.players.push(cpu)
    this.broadcastState()
  }

  private handleRemoveCpu(conn: Party.Connection, payload: { cpuId: string }) {
    if (!this.state || !this.isHost(conn)) return
    this.state.players = this.state.players.filter(p => p.id !== payload.cpuId)
    this.broadcastState()
  }

  private handleUpdateRules(conn: Party.Connection, payload: { rules: RuleConfig }) {
    if (!this.state || !this.isHost(conn)) return
    this.state.rules = payload.rules
    this.broadcastState()
  }

  private handleStartGame(conn: Party.Connection) {
    if (!this.state || !this.isHost(conn)) return
    if (this.state.players.length < 2) return
    if (this.state.phase !== 'waiting') return
    this.startRound()
  }

  private startRound() {
    if (!this.state) return
    const deck = createDeck(this.state.rules.jokerCount)
    const players = this.state.players
    const n = players.length

    players.forEach(p => {
      p.hand = []
      p.status = 'playing'
      p.handCount = 0
    })
    deck.forEach((card, i) => {
      players[i % n].hand.push(card)
    })
    players.forEach(p => { p.handCount = p.hand.length })

    let firstPlayerId = ''
    if (this.state.roundNumber === 0) {
      const d3owner = players.find(p => p.hand.some(c => c.suit === 'diamonds' && c.rank === 3))
      firstPlayerId = d3owner?.id ?? players[0].id
    } else {
      const daihinmin = players.find(p => p.titleRank === 'daihinmin')
      firstPlayerId = daihinmin?.id ?? players[0].id
    }

    const turnOrder = players.map(p => p.id)
    const fi = turnOrder.indexOf(firstPlayerId)
    const rotated = [...turnOrder.slice(fi), ...turnOrder.slice(0, fi)]

    this.state.roundNumber += 1
    this.state.turnOrder = rotated
    this.state.currentTurnPlayerId = firstPlayerId
    this.state.field = this.emptyField()
    this.finishOrder = []

    if (this.state.roundNumber > 1) {
      this.startExchangePhase()
    } else {
      this.state.phase = 'playing'
      this.broadcastState()
      this.sendAllHands()
      this.scheduleCpuIfNeeded()
    }
  }

  private startExchangePhase() {
    if (!this.state) return
    const players = this.state.players

    const daihinmin = players.find(p => p.titleRank === 'daihinmin')
    if (daihinmin) {
      const allLow = daihinmin.hand.every(c => !c.isJoker && c.rank >= 3 && c.rank <= 10)
      if (allLow) {
        const daifugo = players.find(p => p.titleRank === 'daifugo')
        const fugo = players.find(p => p.titleRank === 'fugo')
        const hinmin = players.find(p => p.titleRank === 'hinmin')
        if (daifugo && daihinmin) {
          const tmp = daifugo.hand; daifugo.hand = daihinmin.hand; daihinmin.hand = tmp
          daifugo.handCount = daifugo.hand.length; daihinmin.handCount = daihinmin.hand.length
        }
        if (fugo && hinmin) {
          const tmp = fugo.hand; fugo.hand = hinmin.hand; hinmin.hand = tmp
          fugo.handCount = fugo.hand.length; hinmin.handCount = hinmin.hand.length
        }
        this.state.phase = 'playing'
        this.broadcastState()
        this.sendAllHands()
        this.scheduleCpuIfNeeded()
        return
      }
    }

    this.state.phase = 'card_exchange'
    this.exchangeSent.clear()
    this.exchangeReturned.clear()
    const exchanges: Exchange[] = []
    const daifugo = players.find(p => p.titleRank === 'daifugo')
    const fugo = players.find(p => p.titleRank === 'fugo')
    const dhinmin = players.find(p => p.titleRank === 'daihinmin')
    const hinmin = players.find(p => p.titleRank === 'hinmin')
    if (daifugo && dhinmin) exchanges.push({ fromPlayerId: dhinmin.id, toPlayerId: daifugo.id })
    if (fugo && hinmin) exchanges.push({ fromPlayerId: hinmin.id, toPlayerId: fugo.id })

    this.state.exchangePhase = { pendingExchanges: exchanges, completedExchanges: [] }
    this.broadcastState()
    this.sendAllHands()

    for (const ex of exchanges) {
      const from = players.find(p => p.id === ex.fromPlayerId)
      if (from?.isCpu) {
        const count = ex.fromPlayerId === dhinmin?.id ? 2 : 1
        const worstCards = [...from.hand]
          .sort((a, b) => getComboRank([a]) - getComboRank([b]))
          .slice(0, count)
        setTimeout(() => this.processExchangeGive(ex.fromPlayerId, worstCards), 500)
      }
    }
  }

  private handleExchangeCards(conn: Party.Connection, payload: { cards: Card[] }) {
    if (!this.state || this.state.phase !== 'card_exchange') return
    const pid = this.connToPlayer.get(conn.id)
    if (!pid) return

    const pendingEx = this.state.exchangePhase?.pendingExchanges
    if (!pendingEx) return

    const asGiver = pendingEx.find(ex => ex.fromPlayerId === pid && !this.exchangeSent.has(pid))
    const asReceiver = pendingEx.find(ex => ex.toPlayerId === pid && this.exchangeSent.has(ex.fromPlayerId) && !this.exchangeReturned.has(pid))

    if (asGiver) {
      this.processExchangeGive(pid, payload.cards)
    } else if (asReceiver) {
      this.processExchangeReturn(pid, payload.cards)
    }
  }

  private processExchangeGive(fromId: string, cards: Card[]) {
    if (!this.state) return
    const players = this.state.players
    const pendingEx = this.state.exchangePhase?.pendingExchanges
    if (!pendingEx) return

    const ex = pendingEx.find(e => e.fromPlayerId === fromId)
    if (!ex) return

    const from = players.find(p => p.id === fromId)
    const to = players.find(p => p.id === ex.toPlayerId)
    if (!from || !to) return

    const cardIds = new Set(cards.map(c => c.id))
    from.hand = from.hand.filter(c => !cardIds.has(c.id))
    to.hand = [...to.hand, ...cards]
    from.handCount = from.hand.length
    to.handCount = to.hand.length
    this.exchangeSent.set(fromId, cards)

    this.sendHand(fromId)

    if (to.isCpu) {
      const count = ex.fromPlayerId === this.state.players.find(p => p.titleRank === 'daihinmin')?.id ? 2 : 1
      const bestCards = [...to.hand]
        .sort((a, b) => getComboRank([b]) - getComboRank([a]))
        .slice(0, count)
      setTimeout(() => this.processExchangeReturn(ex.toPlayerId, bestCards), 500)
    } else {
      this.sendHand(ex.toPlayerId)
      this.broadcastState()
    }
  }

  private processExchangeReturn(toId: string, cards: Card[]) {
    if (!this.state) return
    const players = this.state.players
    const pendingEx = this.state.exchangePhase?.pendingExchanges
    if (!pendingEx) return

    const ex = pendingEx.find(e => e.toPlayerId === toId)
    if (!ex) return

    const to = players.find(p => p.id === toId)
    const from = players.find(p => p.id === ex.fromPlayerId)
    if (!to || !from) return

    const cardIds = new Set(cards.map(c => c.id))
    to.hand = to.hand.filter(c => !cardIds.has(c.id))
    from.hand = [...from.hand, ...cards]
    to.handCount = to.hand.length
    from.handCount = from.hand.length
    this.exchangeReturned.set(toId, cards)

    this.sendHand(toId)
    this.sendHand(ex.fromPlayerId)

    if (this.state.exchangePhase) {
      this.state.exchangePhase.completedExchanges.push(ex.fromPlayerId)
    }

    if (pendingEx.every(e => this.exchangeReturned.has(e.toPlayerId))) {
      this.state.phase = 'playing'
      this.state.exchangePhase = undefined
      this.broadcastState()
      this.scheduleCpuIfNeeded()
    } else {
      this.broadcastState()
    }
  }

  private handlePlayCards(conn: Party.Connection, payload: { cards: Card[] }) {
    if (!this.state || this.state.phase !== 'playing') return
    const pid = this.connToPlayer.get(conn.id)
    if (!pid || pid !== this.state.currentTurnPlayerId) return
    const player = this.state.players.find(p => p.id === pid)
    if (!player) return

    const cards = payload.cards
    if (!canPlayCards(cards, this.state.field, this.state.rules)) {
      conn.send(JSON.stringify({ type: 'error', payload: { message: 'Invalid play' } } satisfies ServerMessage))
      return
    }

    this.applyPlay(player, cards)
  }

  private applyPlay(player: Player, cards: Card[]) {
    if (!this.state) return

    const cardIds = new Set(cards.map(c => c.id))
    player.hand = player.hand.filter(c => !cardIds.has(c.id))
    player.handCount = player.hand.length

    const field = this.state.field
    const rules = this.state.rules
    let flush = false

    field.currentCards = cards
    field.currentPlayerId = player.id
    field.lastPlayerId = player.id
    field.passCount = 0

    // Revolution: 4+ same rank (non-joker)
    const nonJokerCards = cards.filter(c => !c.isJoker)
    if (rules.revolution && nonJokerCards.length >= 4 && isValidCombo(nonJokerCards)) {
      field.isReversed = !field.isReversed
      this.broadcastRule('革命！')
    }

    // Nana-san revolution: 7×3
    if (rules.sevenRevolution && cards.length === 3 && cards.every(c => !c.isJoker && c.rank === 7)) {
      field.isReversed = !field.isReversed
      this.broadcastRule('ななさん革命！')
      const nextPid = this.getNextActivePid(player.id, 1)
      if (nextPid && player.hand.length > 0) {
        this.pendingAction = { type: 'seven_pass', playerId: player.id, cardCount: 3, targetPlayerId: nextPid }
        this.broadcastState()
        this.sendHand(player.id)
        if (player.isCpu) this.cpuHandlePending(player)
        this.checkGameOver()
        return
      }
    }

    // 8-cut
    if (rules.eightCut && !isFourStop(cards, field) && cards.every(c => !c.isJoker && c.rank === 8)) {
      flush = true
      this.broadcastRule('8切り！')
    }

    // Sandstorm
    if (rules.sandstorm && isSandstorm(cards)) {
      flush = true
      this.broadcastRule('砂嵐！')
    }

    // 99車
    if (rules.nineFlush && isNineFlush(cards)) {
      flush = true
      this.broadcastRule('99車！')
    }

    // Rokuro-kubi
    if (rules.sixFlush && isSixFlush(cards)) {
      flush = true
      this.broadcastRule('ろくろ首！')
    }

    // 4-stop
    if (rules.fourStop && isFourStop(cards, field)) {
      flush = true
    }

    // SpadeThree return
    if (rules.spadeThreeReturn && isSpadeThree(cards)) {
      flush = true
    }

    // Eleven-back (single J)
    if (rules.elevenBack && cards.length === 1 && !cards[0].isJoker && cards[0].rank === 11) {
      field.elevenBackActive = !field.elevenBackActive
      this.broadcastRule('イレブンバック！')
    }

    // Suit lock
    if (rules.suitLock) {
      const nj = cards.filter(c => !c.isJoker)
      if (nj.length >= rules.suitLockCount) {
        const suit = nj[0].suit
        if (nj.every(c => c.suit === suit)) {
          field.fieldLock = 'suit'
          field.lockSuit = suit
        }
      }
    }

    // Rank lock
    if (rules.rankLock && cards.length > 1) {
      field.fieldLock = 'rank'
    }

    // Nine reverse (single 9, not nineFlush)
    if (rules.nineReverse && cards.length === 1 && !cards[0].isJoker && cards[0].rank === 9) {
      this.state.turnOrder = [...this.state.turnOrder].reverse()
    }

    // Forbidden win check
    const isForbiddenWin = rules.forbiddenWin && player.hand.length === 0 &&
      cards.some(c => c.isJoker || c.rank === 15)
    if (isForbiddenWin) {
      player.hand = [...player.hand, ...cards]
      player.handCount = player.hand.length
      field.currentCards = []
      this.broadcastState()
      this.sendHand(player.id)
      this.advanceTurn(player.id, false, false)
      return
    }

    // Check win
    if (player.hand.length === 0) {
      player.status = 'finished'
      this.finishOrder.push(player.id)
    }

    if (flush) this.flushField(player.id)

    // Pending actions
    if (!flush && rules.sevenPass && cards.every(c => !c.isJoker && c.rank === 7)) {
      const nextPid = this.getNextActivePid(player.id, 1)
      if (nextPid && player.hand.length > 0) {
        this.pendingAction = { type: 'seven_pass', playerId: player.id, cardCount: cards.length, targetPlayerId: nextPid }
        this.broadcastState()
        this.sendHand(player.id)
        if (player.isCpu) this.cpuHandlePending(player)
        this.checkGameOver()
        return
      }
    }

    if (!flush && rules.tenDiscard && cards.every(c => !c.isJoker && c.rank === 10)) {
      if (player.hand.length > 0) {
        this.pendingAction = { type: 'ten_discard', playerId: player.id, cardCount: cards.length }
        this.broadcastState()
        this.sendHand(player.id)
        if (player.isCpu) this.cpuHandlePending(player)
        return
      }
    }

    if (!flush && rules.queenBomber && cards.every(c => !c.isJoker && c.rank === 12)) {
      this.pendingAction = { type: 'queen_bomber', playerId: player.id }
      this.broadcastState()
      if (player.isCpu) this.cpuHandlePending(player)
      return
    }

    let skipCount = 0
    if (rules.fiveSkip && cards.every(c => !c.isJoker && c.rank === 5)) {
      skipCount = rules.fiveSkipMulti === 'each' ? cards.length : 1
    }

    this.broadcastState()
    this.sendHand(player.id)
    if (this.checkGameOver()) return
    this.advanceTurn(player.id, flush, false, skipCount)
  }

  private handlePass(conn: Party.Connection) {
    if (!this.state || this.state.phase !== 'playing') return
    const pid = this.connToPlayer.get(conn.id)
    if (!pid || pid !== this.state.currentTurnPlayerId) return
    this.processPass(pid)
  }

  private processPass(pid: string) {
    if (!this.state) return
    const field = this.state.field
    field.passCount++

    const activePlayers = this.state.players.filter(p => p.status === 'playing')
    if (field.passCount >= activePlayers.length - 1 && field.currentCards.length > 0) {
      const lastPlayerId = field.lastPlayerId
      this.flushField(lastPlayerId)
      this.broadcastState()
      this.scheduleCpuForPlayer(lastPlayerId)
      return
    }

    this.broadcastState()
    this.advanceTurn(pid, false, false)
  }

  private handleSevenPass(conn: Party.Connection, payload: { cards: Card[] }) {
    if (!this.state) return
    const pid = this.connToPlayer.get(conn.id)
    if (!pid) return
    if (!this.pendingAction || this.pendingAction.type !== 'seven_pass') return
    if (this.pendingAction.playerId !== pid) return
    this.processSevenPass(this.pendingAction, payload.cards)
  }

  private processSevenPass(pending: PendingSevenPass, cards: Card[]) {
    if (!this.state) return
    const players = this.state.players
    const from = players.find(p => p.id === pending.playerId)
    const to = players.find(p => p.id === pending.targetPlayerId)
    if (!from || !to) return

    const give = cards.slice(0, pending.cardCount)
    const cardIds = new Set(give.map(c => c.id))
    from.hand = from.hand.filter(c => !cardIds.has(c.id))
    to.hand = [...to.hand, ...give]
    from.handCount = from.hand.length
    to.handCount = to.hand.length

    this.pendingAction = null
    this.sendHand(pending.playerId)
    this.sendHand(pending.targetPlayerId)
    this.broadcastState()
    if (this.checkGameOver()) return
    this.advanceTurn(pending.playerId, false, false)
  }

  private handleTenDiscard(conn: Party.Connection, payload: { cards: Card[] }) {
    if (!this.state) return
    const pid = this.connToPlayer.get(conn.id)
    if (!pid) return
    if (!this.pendingAction || this.pendingAction.type !== 'ten_discard') return
    if (this.pendingAction.playerId !== pid) return
    this.processTenDiscard(this.pendingAction, payload.cards)
  }

  private processTenDiscard(pending: PendingTenDiscard, cards: Card[]) {
    if (!this.state) return
    const player = this.state.players.find(p => p.id === pending.playerId)
    if (!player) return

    const discard = cards.slice(0, pending.cardCount)
    const cardIds = new Set(discard.map(c => c.id))
    player.hand = player.hand.filter(c => !cardIds.has(c.id))
    player.handCount = player.hand.length

    this.pendingAction = null
    this.sendHand(pending.playerId)

    if (player.hand.length === 0) {
      player.status = 'finished'
      this.finishOrder.push(player.id)
    }

    this.broadcastState()
    if (this.checkGameOver()) return
    this.advanceTurn(pending.playerId, false, false)
  }

  private handleQueenBomber(conn: Party.Connection, payload: { declaredRank: Rank }) {
    if (!this.state) return
    const pid = this.connToPlayer.get(conn.id)
    if (!pid) return
    if (!this.pendingAction || this.pendingAction.type !== 'queen_bomber') return
    if (this.pendingAction.playerId !== pid) return
    this.processQueenBomber(this.pendingAction, payload.declaredRank)
  }

  private processQueenBomber(pending: PendingQueenBomber, rank: Rank) {
    if (!this.state) return
    const players = this.state.players

    players.forEach(p => {
      if (p.status !== 'playing') return
      const before = p.hand.length
      p.hand = p.hand.filter(c => c.isJoker || c.rank !== rank)
      p.handCount = p.hand.length
      if (before !== p.hand.length) this.sendHand(p.id)
      if (p.hand.length === 0 && p.status === 'playing') {
        p.status = 'finished'
        this.finishOrder.push(p.id)
      }
    })

    this.pendingAction = null
    this.broadcastState()
    if (this.checkGameOver()) return
    this.advanceTurn(pending.playerId, false, false)
  }

  private handleChat(conn: Party.Connection, payload: { content: string }) {
    if (!this.state) return
    const pid = this.connToPlayer.get(conn.id)
    const player = this.state.players.find(p => p.id === pid)
    if (!player) return

    const msg: ChatMessage = {
      id: `${Date.now()}-${Math.random()}`,
      playerId: pid ?? conn.id,
      playerName: player.name,
      type: 'chat',
      content: payload.content.slice(0, 200),
      timestamp: Date.now(),
    }
    this.state.chatMessages = [...this.state.chatMessages.slice(-49), msg]
    this.room.broadcast(JSON.stringify({ type: 'chat_message', payload: msg } satisfies ServerMessage))
  }

  private handleStamp(conn: Party.Connection, payload: { emoji: string }) {
    if (!this.state) return
    const pid = this.connToPlayer.get(conn.id)
    const player = this.state.players.find(p => p.id === pid)
    if (!player || player.status === 'spectating') return

    const msg: ChatMessage = {
      id: `${Date.now()}-${Math.random()}`,
      playerId: pid ?? conn.id,
      playerName: player.name,
      type: 'stamp',
      content: payload.emoji,
      timestamp: Date.now(),
    }
    this.state.chatMessages = [...this.state.chatMessages.slice(-49), msg]
    this.room.broadcast(JSON.stringify({ type: 'chat_message', payload: msg } satisfies ServerMessage))
  }

  private handleRematch(conn: Party.Connection) {
    if (!this.state || !this.isHost(conn)) return
    if (this.state.phase !== 'game_end') return

    this.state.players.forEach(p => {
      p.hand = []
      p.handCount = 0
      p.status = 'waiting'
      p.finishOrder = undefined
    })
    this.state.phase = 'waiting'
    this.state.roundNumber = 0
    this.state.field = this.emptyField()
    this.state.chatMessages = []
    this.finishOrder = []
    this.pendingAction = null
    this.broadcastState()
  }

  // ============================================================
  // Game flow helpers
  // ============================================================

  private flushField(nextPlayerId: string) {
    if (!this.state) return
    const field = this.state.field
    field.currentCards = []
    field.passCount = 0
    field.fieldLock = null
    field.lockSuit = undefined
    field.elevenBackActive = false
    this.state.currentTurnPlayerId = nextPlayerId
  }

  private advanceTurn(fromId: string, wasFlush: boolean, _skipTurn: boolean, skipCount = 0) {
    if (!this.state) return
    const activePlayers = this.state.players.filter(p => p.status === 'playing')
    if (activePlayers.length === 0) return

    if (!wasFlush) {
      const order = this.state.turnOrder
      let idx = order.indexOf(fromId)
      let steps = 1 + skipCount
      while (steps > 0) {
        idx = (idx + 1) % order.length
        const pid = order[idx]
        const p = this.state.players.find(pl => pl.id === pid)
        if (p && p.status === 'playing') steps--
        if (order.every(id => {
          const pl = this.state!.players.find(pl => pl.id === id)
          return !pl || pl.status !== 'playing'
        })) break
      }
      this.state.currentTurnPlayerId = order[idx]
    }

    this.broadcastState()
    this.scheduleCpuIfNeeded()
  }

  private getNextActivePid(fromId: string, steps: number): string | null {
    if (!this.state) return null
    const order = this.state.turnOrder
    let idx = order.indexOf(fromId)
    let count = steps
    while (count > 0) {
      idx = (idx + 1) % order.length
      const pid = order[idx]
      const p = this.state.players.find(pl => pl.id === pid)
      if (p && p.status === 'playing') count--
    }
    return order[idx] ?? null
  }

  private checkGameOver(): boolean {
    if (!this.state) return false
    const activePlayers = this.state.players.filter(p => p.status === 'playing')

    if (activePlayers.length <= 1) {
      if (activePlayers.length === 1) {
        activePlayers[0].status = 'finished'
        this.finishOrder.push(activePlayers[0].id)
      }
      this.endRound()
      return true
    }
    return false
  }

  private endRound() {
    if (!this.state) return
    assignTitles(this.finishOrder, this.state.players)
    this.state.phase = 'game_end'
    this.broadcastState()
  }

  private scheduleCpuIfNeeded() {
    if (!this.state || this.state.phase !== 'playing') return
    const pid = this.state.currentTurnPlayerId
    const player = this.state.players.find(p => p.id === pid)
    if (!player || !player.isCpu) return

    const delay = cpuThinkDelay(player.cpuLevel)
    if (this.cpuTimer) clearTimeout(this.cpuTimer)
    this.cpuTimer = setTimeout(() => this.cpuTakeTurn(player), delay)
  }

  private scheduleCpuForPlayer(pid: string) {
    if (!this.state) return
    const player = this.state.players.find(p => p.id === pid)
    if (!player || !player.isCpu) return
    this.state.currentTurnPlayerId = pid
    const delay = cpuThinkDelay(player.cpuLevel)
    if (this.cpuTimer) clearTimeout(this.cpuTimer)
    this.cpuTimer = setTimeout(() => this.cpuTakeTurn(player), delay)
  }

  private cpuTakeTurn(player: Player) {
    if (!this.state || this.state.phase !== 'playing') return
    if (this.state.currentTurnPlayerId !== player.id) return

    if (this.pendingAction) {
      this.cpuHandlePending(player)
      return
    }

    const play = cpuChoosePlay(player, this.state)
    if (play) {
      this.applyPlay(player, play)
    } else {
      this.processPass(player.id)
    }
  }

  private cpuHandlePending(player: Player) {
    if (!this.state || !this.pendingAction) return

    if (this.pendingAction.type === 'seven_pass') {
      const p = this.pendingAction
      const give = [...player.hand]
        .sort((a, b) => getComboRank([a]) - getComboRank([b]))
        .slice(0, p.cardCount)
      this.processSevenPass(p, give)
    } else if (this.pendingAction.type === 'ten_discard') {
      const p = this.pendingAction
      const discard = [...player.hand]
        .sort((a, b) => getComboRank([a]) - getComboRank([b]))
        .slice(0, p.cardCount)
      this.processTenDiscard(p, discard)
    } else if (this.pendingAction.type === 'queen_bomber') {
      const opponents = this.state.players.filter(pl => pl.id !== player.id && pl.status === 'playing')
      const rankCounts = new Map<Rank, number>()
      opponents.forEach(opp => {
        opp.hand.forEach(c => {
          if (!c.isJoker) rankCounts.set(c.rank, (rankCounts.get(c.rank) ?? 0) + 1)
        })
      })
      let bestRank: Rank = 3
      let bestCount = 0
      rankCounts.forEach((count, rank) => {
        if (count > bestCount) { bestCount = count; bestRank = rank }
      })
      this.processQueenBomber(this.pendingAction, bestRank)
    }
  }

  private autoPassForDisconnected(pid: string) {
    if (!this.state || this.state.currentTurnPlayerId !== pid) return
    this.processPass(pid)
  }

  // ============================================================
  // Helpers
  // ============================================================

  private createInitialState(): GameState {
    return {
      roomCode: this.room.id,
      phase: 'waiting',
      players: [],
      currentTurnPlayerId: '',
      turnOrder: [],
      field: this.emptyField(),
      rules: { ...DEFAULT_RULES },
      roundNumber: 0,
      chatMessages: [],
    }
  }

  private emptyField(): FieldState {
    return {
      currentCards: [],
      currentPlayerId: '',
      passCount: 0,
      isReversed: false,
      fieldLock: null,
      elevenBackActive: false,
      luckySevenPending: false,
      lastPlayerId: '',
    }
  }

  private isHost(conn: Party.Connection): boolean {
    if (!this.state) return false
    const pid = this.connToPlayer.get(conn.id)
    const player = this.state.players.find(p => p.id === pid)
    return player?.isHost ?? false
  }

  private sendHand(playerId: string) {
    if (!this.state) return
    const player = this.state.players.find(p => p.id === playerId)
    if (!player || player.isCpu) return
    for (const [connId, pid] of this.connToPlayer) {
      if (pid === playerId) {
        const conn = this.room.getConnection(connId)
        if (conn) {
          conn.send(JSON.stringify({ type: 'hand_update', payload: { hand: player.hand } } satisfies ServerMessage))
        }
        break
      }
    }
  }

  private sendAllHands() {
    if (!this.state) return
    this.state.players.forEach(p => {
      if (!p.isCpu) this.sendHand(p.id)
    })
  }

  private sanitizeStateForBroadcast(): GameState {
    if (!this.state) throw new Error('No state')
    return {
      ...this.state,
      players: this.state.players.map(p => ({
        ...p,
        hand: [],
      })),
    }
  }

  private broadcastState() {
    if (!this.state) return
    const base = this.sanitizeStateForBroadcast()
    this.room.broadcast(JSON.stringify({ type: 'state_update', payload: base } satisfies ServerMessage))
  }

  private broadcastRule(message: string) {
    this.broadcast({ type: 'rule_triggered', payload: { rule: message, message } })
  }

  private broadcast(msg: ServerMessage) {
    this.room.broadcast(JSON.stringify(msg))
  }
}
