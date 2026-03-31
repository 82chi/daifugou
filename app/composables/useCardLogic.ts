import type { Card, FieldState, RuleConfig } from '~/types'

export function useCardLogic() {
  // TODO: 出せるカードの判定ロジック
  function canPlay(cards: Card[], field: FieldState, rules: RuleConfig): boolean {
    return true // placeholder
  }

  return { canPlay }
}
