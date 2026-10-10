import type { Localized } from '@/domain/i18n/Locale'
import type { ProfileRepository } from '@/domain/profile/ProfileRepository'
import { getJson } from '@/infrastructure/http/getJson'

interface ProfileDto {
  full_name: string
  headline: Localized<string>
  bio: Localized<string>
  /** Missing from an API that predates the field. */
  desired_role?: Localized<string>
}

export function createHttpProfileRepository(
  apiUrl = '',
  fetchFn: typeof fetch = fetch,
): ProfileRepository {
  return {
    async get() {
      const dto = await getJson<ProfileDto>(apiUrl, '/api/v1/profile/', fetchFn)
      return {
        fullName: dto.full_name,
        headline: dto.headline,
        bio: dto.bio,
        desiredRole: dto.desired_role ?? { en: '', fr: '' },
      }
    },
  }
}
