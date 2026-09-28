import avatarSrc from '@/assets/avatar.webp'
import type { Profile } from '@/domain/profile/Profile'

/** Static source of the owner's profile until the backend exposes one. */
export const owner: Profile = {
  fullName: 'Alexandre Le Borgne',
  headline: {
    en: 'Senior Software Engineer, PhD',
    fr: 'Ingénieur logiciel senior, PhD',
  },
  avatar: {
    src: avatarSrc,
    alt: {
      en: 'Portrait of Alexandre Le Borgne',
      fr: 'Portrait d’Alexandre Le Borgne',
    },
  },
}
