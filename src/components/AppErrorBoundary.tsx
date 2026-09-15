import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { logger } from '@/lib/logger'
import { isChunkLoadError, reloadForNewDeploy } from '@/lib/chunk-reload'

type Props = { children: ReactNode; resetKey: string }
type State = { hasError: boolean }

/** Last line of defence: a page error shows a recovery card instead of a blank screen. */
export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (isChunkLoadError(error) && reloadForNewDeploy()) return
    logger.error('[AppErrorBoundary]', error, info.componentStack)
  }

  componentDidUpdate(prevProps: Props) {
    // Navigating to another page clears the error so the new page can render.
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false })
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div role="alert" className="flex min-h-[70vh] items-center justify-center bg-background px-4">
        <div className="w-full max-w-md rounded-2xl border border-primary/30 bg-card p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
            <AlertTriangle className="h-6 w-6" aria-hidden="true" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">This page didn't load properly</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            The website may have just been updated. Reloading usually fixes it.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="btn-gold inline-flex h-10 items-center gap-2 rounded-full px-5 text-sm font-semibold"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Reload page
            </button>
            <a
              href="/"
              className="inline-flex h-10 items-center rounded-full border border-primary/50 px-5 text-sm font-semibold text-foreground hover:bg-primary/10"
            >
              Go to homepage
            </a>
          </div>
        </div>
      </div>
    )
  }
}
