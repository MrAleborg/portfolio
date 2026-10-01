import '@testing-library/jest-dom/vitest'

// One test's language choice must not leak into the next.
afterEach(() => {
  localStorage.clear()
})
