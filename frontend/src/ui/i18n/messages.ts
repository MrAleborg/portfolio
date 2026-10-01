import type { Localized } from '@/domain/i18n/Locale'

/** French elides "de" before a vowel (or a mute h). */
const STARTS_WITH_VOWEL = /^[aeiouyhàâäéèêëîïôöùûü]/i

interface Messages {
  navLabel: string
  navHome: string
  navResume: string
  resumeTitle: string
  educationTitle: string
  loading: string
  profileUnavailable: string
  sectionUnavailable: string
  sectionEmpty: string
  pageError: string
  /** End of a period that is still going on. */
  ongoing: string
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
    educationTitle: 'Education',
    loading: 'Loading…',
    profileUnavailable:
      'The profile could not be loaded. Please try again later.',
    sectionUnavailable:
      'This section could not be loaded. Please try again later.',
    sectionEmpty: 'Nothing to show yet.',
    pageError: 'Something went wrong. Please reload the page.',
    ongoing: 'Present',
    avatarAlt: (fullName) => `Portrait of ${fullName}`,
    switchLanguage: 'Français',
  },
  fr: {
    navLabel: 'Principale',
    navHome: 'Accueil',
    navResume: 'CV',
    resumeTitle: 'CV',
    educationTitle: 'Formation',
    loading: 'Chargement…',
    profileUnavailable: 'Le profil n’a pas pu être chargé. Réessayez plus tard.',
    sectionUnavailable:
      'Cette section n’a pas pu être chargée. Réessayez plus tard.',
    sectionEmpty: 'Rien à afficher pour le moment.',
    pageError: 'Une erreur est survenue. Rechargez la page.',
    ongoing: 'aujourd’hui',
    avatarAlt: (fullName) =>
      `Portrait ${STARTS_WITH_VOWEL.test(fullName) ? 'd’' : 'de '}${fullName}`,
    switchLanguage: 'English',
  },
}
