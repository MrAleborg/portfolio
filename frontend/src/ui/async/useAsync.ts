import { useEffect, useState } from 'react'

export type AsyncState<T> =
  | { status: 'loading' }
  | { status: 'loaded'; value: T }
  | { status: 'error' }

/**
 * Runs `load` once and follows its result; a different `load` starts over.
 *
 * `load` must be stable across renders (e.g. a repository method), or it reloads forever and never leaves `loading`.
 */
export function useAsync<T>(load: () => Promise<T>): AsyncState<T> {
  const [settled, setSettled] = useState<{
    load: () => Promise<T>
    state: AsyncState<T>
  }>()

  useEffect(() => {
    let active = true
    load().then(
      (value) => {
        if (active) setSettled({ load, state: { status: 'loaded', value } })
      },
      () => {
        if (active) setSettled({ load, state: { status: 'error' } })
      },
    )
    return () => {
      active = false
    }
  }, [load])

  return settled?.load === load ? settled.state : { status: 'loading' }
}
