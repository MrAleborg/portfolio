import type { TagKind } from '@/domain/tag/Tag'
import type { Localized } from '@/domain/i18n/Locale'

/** French elides "de" before a vowel (or a mute h). */
const STARTS_WITH_VOWEL = /^[aeiouyhàâäéèêëîïôöùûü]/i

interface Messages {
  navLabel: string
  navHome: string
  navResume: string
  resumeTitle: string
  educationTitle: string
  /** Said after the name of a link that opens in a new tab. */
  opensInNewTab: string
  /** What goes between a link's text and the colon that introduces what it is about. */
  spaceBeforeColon: string
  tagKinds: Record<TagKind, string>
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
    opensInNewTab: '(opens in a new tab)',
    spaceBeforeColon: '',
    tagKinds: { skill: 'Skills', tool: 'Tools', methodology: 'Methodologies' },
    loading: 'Loading…',
    profileUnavailable:
      'The profile could not be loaded. Please try again later.',
    sectionUnavailable:
      'This section could not be loaded. Please try again later.',
    sectionEmpty: 'Nothing to show yet.',
    pageError: 'This page could not be displayed. Reload to try again.',
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
    opensInNewTab: '(s’ouvre dans un nouvel onglet)',
    spaceBeforeColon: ' ',
    tagKinds: { skill: 'Compétences', tool: 'Outils', methodology: 'Méthodologies' },
    loading: 'Chargement…',
    profileUnavailable: 'Le profil n’a pas pu être chargé. Réessayez plus tard.',
    sectionUnavailable:
      'Cette section n’a pas pu être chargée. Réessayez plus tard.',
    sectionEmpty: 'Rien à afficher pour le moment.',
    pageError: 'Cette page n’a pas pu s’afficher. Rechargez pour réessayer.',
    ongoing: 'aujourd’hui',
    avatarAlt: (fullName) =>
      `Portrait ${STARTS_WITH_VOWEL.test(fullName) ? 'd’' : 'de '}${fullName}`,
    switchLanguage: 'English',
  },
}
