import type { Localized } from '@/domain/i18n/Locale'

interface Messages {
  underConstruction: string
  /** Label of the button that switches to the other language, written in that language. */
  switchLanguage: string
}

export const messages: Localized<Messages> = {
  en: {
    underConstruction: 'This site is under construction. Come back soon!',
    switchLanguage: 'Français',
  },
  fr: {
    underConstruction: 'Ce site est en construction. Revenez bientôt !',
    switchLanguage: 'English',
  },
}
