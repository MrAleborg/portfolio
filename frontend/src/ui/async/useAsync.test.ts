import { act, renderHook, waitFor } from '@testing-library/react'
import { useAsync } from '@/ui/async/useAsync'

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('useAsync', () => {
  it('reports loading, then the value once load resolves', async () => {
    const result = deferred<string>()
    const load = () => result.promise
    const { result: hook } = renderHook(() => useAsync(load))

    expect(hook.current).toEqual({ status: 'loading' })

    result.resolve('first')

    await waitFor(() =>
      expect(hook.current).toEqual({ status: 'loaded', value: 'first' }),
    )
  })

  it('reports the error when load rejects', async () => {
    const load = () => Promise.reject(new Error('boom'))
    const { result: hook } = renderHook(() => useAsync(load))

    await waitFor(() => expect(hook.current).toEqual({ status: 'error' }))
  })

  it('reports loading again until the result of a new load arrives', async () => {
    const first = deferred<string>()
    const second = deferred<string>()
    const { result: hook, rerender } = renderHook(
      ({ load }) => useAsync(load),
      { initialProps: { load: () => first.promise } },
    )
    first.resolve('first')
    await waitFor(() =>
      expect(hook.current).toEqual({ status: 'loaded', value: 'first' }),
    )

    rerender({ load: () => second.promise })

    expect(hook.current).toEqual({ status: 'loading' })

    second.resolve('second')

    await waitFor(() =>
      expect(hook.current).toEqual({ status: 'loaded', value: 'second' }),
    )
  })

  it('ignores the result of a previous load that settles after a newer one', async () => {
    const first = deferred<string>()
    const second = deferred<string>()
    const { result: hook, rerender } = renderHook(
      ({ load }) => useAsync(load),
      { initialProps: { load: () => first.promise } },
    )
    rerender({ load: () => second.promise })
    second.resolve('second')
    await waitFor(() =>
      expect(hook.current).toEqual({ status: 'loaded', value: 'second' }),
    )

    await act(async () => first.resolve('first'))

    expect(hook.current).toEqual({ status: 'loaded', value: 'second' })
  })
})
