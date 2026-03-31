export interface RuleInfo {
  key: string
  name: string
  description: string
}

export const RULE_LIST: RuleInfo[] = [
  { key: 'revolution', name: '革命', description: '同じ数字を4枚同時に出すと革命が起こり、カードの強弱が逆転します。' },
  { key: 'eightCut', name: '8切り', description: '8を出すと場のカードが流れ、出したプレイヤーが新たにカードを出せます。' },
  { key: 'spadeThreeReturn', name: 'スペ3返し', description: 'ジョーカーの単体出しに対して、スペードの3で返すことができます。場が流れ、スペ3を出したプレイヤーが新たにカードを出せます。砂嵐のみスペ3返しに返せます。' },
  { key: 'forbiddenWin', name: '禁止上がり', description: '2またはジョーカーで最後のカードを出して上がることは反則負けになります。' },
  { key: 'suitLock', name: 'マークしばり', description: '設定した枚数以上の同じマーク(スート)のカードを出すと、以降そのマークのみ出せるようになります。場が流れると解除されます。' },
  { key: 'rankLock', name: '数字しばり', description: '複数枚の同じ数字を出すと、以降同じ数字の組み合わせのみ出せるようになります。場が流れると解除されます。' },
  { key: 'elevenBack', name: 'イレブンバック', description: 'J(11)を1枚出すと、カードの強弱が一時的に逆転します。場が流れると解除されます。' },
  { key: 'queenBomber', name: 'クイーンボンバー', description: 'Qを出したプレイヤーが好きな数字を宣言し、その数字を持っているプレイヤー（自分含む）は全員そのカードを捨てます。誰も持っていない場合は何も起きません。' },
  { key: 'sandstorm', name: '砂嵐', description: '3を3枚同時に出すと、どんなカードに対しても返すことができます。特殊ルールの中で最も強く、スペ3返しに対しても返せます。' },
  { key: 'nineFlush', name: '救急車（99車）', description: '9を2枚同時に出すと、どんな状態でも場のカードを流すことができます。9リバースと競合する場合は99車が優先されます。' },
  { key: 'sixFlush', name: 'ろくろ首', description: '6を2枚同時に出すと、どんな状態でも場のカードを流すことができます。' },
  { key: 'fourStop', name: '4止め', description: '8が1枚出ている場面で、4を2枚出して返すことができます。8切りの効果は発動せず、場が流れて4を出したプレイヤーが新たにカードを出せます。' },
  { key: 'fiveSkip', name: '5スキップ', description: '5を出すと次のプレイヤーの順番を飛ばします。複数枚出した場合の挙動はルール設定で変更できます。' },
  { key: 'sevenPass', name: '7渡し', description: '7を出した枚数分だけ、次のプレイヤーに手札のいらないカードを渡せます。渡した結果、手札がなくなれば上がりになります。' },
  { key: 'tenDiscard', name: '10捨て', description: '10を出した枚数分だけ、手札から好きなカードを捨てられます。捨てた結果、手札がなくなれば上がりになります。' },
  { key: 'nineReverse', name: '9リバース', description: '9を1枚出すと、手番の順番が逆転します。99車（9×2枚）と競合する場合は99車が優先されます。' },
  { key: 'sevenRevolution', name: 'ななさん革命', description: '7を3枚同時に出すと革命が起こり、さらに7渡し3枚分の効果も同時に発動します。' },
]

export const DEFAULT_RULES = {
  jokerCount: 1 as const,
  revolution: true,
  eightCut: true,
  spadeThreeReturn: false,
  forbiddenWin: false,
  suitLock: false,
  suitLockCount: 2 as const,
  rankLock: false,
  elevenBack: false,
  queenBomber: false,
  sandstorm: false,
  nineFlush: false,
  sixFlush: false,
  fourStop: false,
  fiveSkip: false,
  fiveSkipMulti: 'each' as const,
  sevenPass: false,
  tenDiscard: false,
  nineReverse: false,
  sevenRevolution: false,
}
