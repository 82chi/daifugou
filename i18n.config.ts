import ja from './i18n/locales/ja.json'
import en from './i18n/locales/en.json'

export default defineI18nConfig(() => ({
  legacy: false,
  locale: 'ja',
  messages: { ja, en },
}))
