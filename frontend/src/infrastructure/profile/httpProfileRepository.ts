import type { Localized } from '@/domain/i18n/Locale'
import type { ProfileRepository } from '@/domain/profile/ProfileRepository'

interface ProfileDto {
  full_name: string
  headline: Localized<string>
  bio: Localized<string>
}

export function createHttpProfileRepository(
  apiUrl: string,
  fetchFn: typeof fetch = fetch,
): ProfileRepository {
  return {
    async get() {
      const response = await fetchFn(
        `${apiUrl.replace(/\/$/, '')}/api/v1/profile/`,
      )
      if (!response.ok) {
        throw new Error(`The profile request failed with status ${response.status}`)
      }
      const dto: ProfileDto = await response.json()
      return { fullName: dto.full_name, headline: dto.headline, bio: dto.bio }
    },
  }
}
