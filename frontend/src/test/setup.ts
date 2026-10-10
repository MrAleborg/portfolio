import '@testing-library/jest-dom/vitest'

// One test's language choice must not leak into the next.
afterEach(() => {
  localStorage.clear()
})

// jsdom has no matchMedia: by default the OS prefers light.
vi.stubGlobal(
  'matchMedia',
  (query: string) =>
    ({
      matches: false,
      media: query,
      addEventListener() {},
      removeEventListener() {},
    }) as unknown as MediaQueryList,
)

// jsdom has no IntersectionObserver: nothing ever scrolls in tests.
if (!('IntersectionObserver' in globalThis)) {
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return []
      }
    },
  )
}

// jsdom has no ResizeObserver: nothing ever resizes in tests.
if (!('ResizeObserver' in globalThis)) {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
}

// jsdom does not implement scrollTo (it only logs "Not implemented"): nothing scrolls in tests.
vi.stubGlobal('scrollTo', () => {})
