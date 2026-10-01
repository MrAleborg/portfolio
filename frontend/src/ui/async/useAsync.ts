import { useEffect, useState } from 'react'

export type AsyncState<T> =
  | { status: 'loading' }
  | { status: 'loaded'; value: T }
  | { status: 'error' }

/**
 * Runs `load` once and follows its result.
 *
 * `load` must be stable across renders (e.g. a repository method), or it runs again.
 */
export function useAsync<T>(load: () => Promise<T>): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({ status: 'loading' })

  useEffect(() => {
    let active = true
    load().then(
      (value) => {
        if (active) setState({ status: 'loaded', value })
      },
      () => {
        if (active) setState({ status: 'error' })
      },
    )
    return () => {
      active = false
    }
  }, [load])

  return state
}
