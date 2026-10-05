import type { CommitmentKind } from '@/domain/commitment/Commitment'
import type { ScientificCommunicationKind } from '@/domain/scientificCommunication/ScientificCommunication'
import type { TagKind } from '@/domain/tag/Tag'
import type { EmploymentType } from '@/domain/professionalExperience/ProfessionalExperience'
import type { Localized } from '@/domain/i18n/Locale'

/** French elides "de" before a vowel (or a mute h). */
const STARTS_WITH_VOWEL = /^[aeiouyhàâäéèêëîïôöùûü]/i

interface Messages {
  navLabel: string
  navHome: string
  navResume: string
  navContact: string
  resumeTitle: string
  contactTitle: string
  contactIntro: string
  contactLinksUnavailable: string
  contactName: string
  contactEmail: string
  contactMessage: string
  contactSend: string
  contactSending: string
  contactSent: (email: string) => string
  contactThrottled: string
  contactUnavailable: string
  expertiseTitle: string
  professionalExperienceTitle: string
  sideProjectsTitle: string
  educationTitle: string
  certificationsTitle: string
  scientificCommunicationsTitle: string
  commitmentsTitle: string
  hobbiesTitle: string
  commitmentKinds: Record<CommitmentKind, string>
  websiteLink: string
  contactLinkKinds: Record<'linkedin' | 'github', string>
  scientificCommunicationKinds: Record<ScientificCommunicationKind, string>
  seeOnline: string
  /** Said after the name of a link that opens in a new tab. */
  opensInNewTab: string
  /** What goes between a link's text and the colon that introduces what it is about. */
  spaceBeforeColon: string
  issued: string
  expires: string
  seeCredential: string
  missions: string
  achievements: string
  projectsLabel: string
  employmentTypes: Record<EmploymentType, string>
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
  /** Labels of the theme button, which name the theme it switches to. */
  switchToDark: string
  switchToLight: string
  /** Label of the button that opens the theme and language switches. */
  settings: string
}

export const messages: Localized<Messages> = {
  en: {
    navLabel: 'Main',
    navHome: 'Home',
    navResume: 'Resume',
    navContact: 'Contact',
    resumeTitle: 'Resume',
    contactTitle: 'Contact',
    contactIntro: 'Write to me, or find me elsewhere.',
    contactLinksUnavailable: 'Links couldn’t be loaded.',
    contactName: 'Name',
    contactEmail: 'Email',
    contactMessage: 'Message',
    contactSend: 'Send message',
    contactSending: 'Sending…',
    contactSent: (email) => `Message sent. I’ll reply to ${email}.`,
    contactThrottled: 'Too many messages; try again in an hour.',
    contactUnavailable: 'Messages can’t be sent right now; use the links above.',
    expertiseTitle: 'Expertise',
    professionalExperienceTitle: 'Professional experience',
    sideProjectsTitle: 'Personal projects',
    educationTitle: 'Education',
    certificationsTitle: 'Certifications',
    scientificCommunicationsTitle: 'Scientific communications',
    commitmentsTitle: 'Commitments',
    hobbiesTitle: 'Hobbies',
    commitmentKinds: {
      association: 'Association',
      conference_organization: 'Conference organization',
      other_event: 'Event',
    },
    websiteLink: 'Website',
    contactLinkKinds: { linkedin: 'LinkedIn', github: 'GitHub' },
    scientificCommunicationKinds: {
      talk: 'Talk',
      poster: 'Poster',
      paper: 'Paper',
      article: 'Article',
    },
    seeOnline: 'See online',
    opensInNewTab: '(opens in a new tab)',
    spaceBeforeColon: '',
    issued: 'Issued',
    expires: 'Expires',
    seeCredential: 'See credential',
    missions: 'Missions',
    achievements: 'Achievements',
    projectsLabel: 'Projects',
    employmentTypes: {
      full_time: 'Full-time',
      part_time: 'Part-time',
      contract: 'Contract',
      freelance: 'Freelance',
      internship: 'Internship',
      apprenticeship: 'Apprenticeship',
    },
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
    switchToDark: 'Switch to dark mode',
    switchToLight: 'Switch to light mode',
    settings: 'Settings',
  },
  fr: {
    navLabel: 'Principale',
    navHome: 'Accueil',
    navResume: 'CV',
    navContact: 'Contact',
    resumeTitle: 'CV',
    contactTitle: 'Contact',
    contactIntro: 'Écrivez-moi, ou retrouvez-moi ailleurs.',
    contactLinksUnavailable: 'Les liens n’ont pas pu être chargés.',
    contactName: 'Nom',
    contactEmail: 'E-mail',
    contactMessage: 'Message',
    contactSend: 'Envoyer le message',
    contactSending: 'Envoi…',
    contactSent: (email) => `Message envoyé. Je vous répondrai à ${email}.`,
    contactThrottled: 'Trop de messages ; réessayez dans une heure.',
    contactUnavailable:
      'Les messages ne peuvent pas être envoyés pour le moment ; utilisez les liens ci-dessus.',
    expertiseTitle: 'Expertise',
    professionalExperienceTitle: 'Expérience professionnelle',
    sideProjectsTitle: 'Projets personnels',
    educationTitle: 'Formation',
    certificationsTitle: 'Certifications',
    scientificCommunicationsTitle: 'Communications scientifiques',
    commitmentsTitle: 'Engagements',
    hobbiesTitle: 'Loisirs',
    commitmentKinds: {
      association: 'Association',
      conference_organization: 'Organisation de conférence',
      other_event: 'Événement',
    },
    websiteLink: 'Site web',
    contactLinkKinds: { linkedin: 'LinkedIn', github: 'GitHub' },
    scientificCommunicationKinds: {
      talk: 'Exposé',
      poster: 'Poster',
      paper: 'Publication',
      article: 'Article',
    },
    seeOnline: 'Voir en ligne',
    opensInNewTab: '(s’ouvre dans un nouvel onglet)',
    spaceBeforeColon: ' ',
    issued: 'Obtenue en',
    expires: 'Expire en',
    seeCredential: 'Voir le certificat',
    missions: 'Missions',
    achievements: 'Réalisations',
    projectsLabel: 'Projets',
    employmentTypes: {
      full_time: 'Temps plein',
      part_time: 'Temps partiel',
      contract: 'CDD',
      freelance: 'Freelance',
      internship: 'Stage',
      apprenticeship: 'Alternance',
    },
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
    switchToDark: 'Passer en mode sombre',
    switchToLight: 'Passer en mode clair',
    settings: 'Préférences',
  },
}
