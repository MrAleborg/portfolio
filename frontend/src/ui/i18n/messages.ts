import type { Localized } from '@/domain/i18n/Locale'

/** French elides "de" before a vowel (or a mute h). */
const STARTS_WITH_VOWEL = /^[aeiouyhàâäéèêëîïôöùûü]/i

interface Messages {
  navLabel: string
  navHome: string
  navResume: string
  resumeTitle: string
  comingSoon: string
  loadingProfile: string
  profileUnavailable: string
  avatarAlt: (fullName: string) => string
  /** Label of the button that switches to the other language, written in that language. */
  switchLanguage: string
}

export const messages: Localized<Messages> = {
  en: {
    navLabel: 'Main',
    navHome: 'Home',
    navResume: 'Resume',
    resumeTitle: 'Resume',
    comingSoon: 'This page is coming soon.',
    loadingProfile: 'Loading…',
    profileUnavailable:
      'The profile could not be loaded. Please try again later.',
    avatarAlt: (fullName) => `Portrait of ${fullName}`,
    switchLanguage: 'Français',
  },
  fr: {
    navLabel: 'Principale',
    navHome: 'Accueil',
    navResume: 'CV',
    resumeTitle: 'CV',
    comingSoon: 'Cette page arrive bientôt.',
    loadingProfile: 'Chargement…',
    profileUnavailable: 'Le profil n’a pas pu être chargé. Réessayez plus tard.',
    avatarAlt: (fullName) =>
      `Portrait ${STARTS_WITH_VOWEL.test(fullName) ? 'd’' : 'de '}${fullName}`,
    switchLanguage: 'English',
  },
}
