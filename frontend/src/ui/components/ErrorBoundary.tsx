import { Component, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  /** Shown instead of the children once one of them fails to render. */
  fallback: ReactNode
  children: ReactNode
}

/** Keeps a rendering failure from blanking the whole app. */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  { failed: boolean }
> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}
