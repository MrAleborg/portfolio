import { useEffect, useState } from 'react'
import type { Profile } from '@/domain/profile/Profile'
import type { ProfileRepository } from '@/domain/profile/ProfileRepository'

export type ProfileState =
  | { status: 'loading' }
  | { status: 'loaded'; profile: Profile }
  | { status: 'error' }

export function useProfile(repository: ProfileRepository): ProfileState {
  const [state, setState] = useState<ProfileState>({ status: 'loading' })

  useEffect(() => {
    repository.get().then(
      (profile) => {
        setState({ status: 'loaded', profile })
      },
      () => {
        setState({ status: 'error' })
      },
    )
  }, [repository])

  return state
}
