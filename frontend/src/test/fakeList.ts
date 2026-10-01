/** A list method that answers with the given entries. */
export function resolving<T>(entries: T[]) {
  return vi.fn(() => Promise.resolve(entries))
}

/** A list method whose request fails. */
export function failing<T>() {
  return vi.fn((): Promise<T[]> => Promise.reject(new Error('Network error')))
}

/** A list method whose request never answers. */
export function pending<T>() {
  return vi.fn(() => new Promise<T[]>(() => {}))
}
