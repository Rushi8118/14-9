import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { isChunkLoadError, reloadForNewDeploy } from '@/lib/chunk-reload'

type Props = { children: ReactNode }
type State = { hasError: boolean; message: string }

export class AdminErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error?.message || 'Something went wrong in this admin view.',
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (isChunkLoadError(error) && reloadForNewDeploy()) return
    console.error('[AdminErrorBoundary]', error, info.componentStack)
  }

  private handleRetry = () => {
    this.setState({ hasError: false, message: '' })
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-600">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">This page hit an error</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            The rest of the admin panel is still available. You can retry this view or open another
            section from the sidebar.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <Button onClick={this.handleRetry} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Try again
            </Button>
            <Button variant="outline" onClick={() => window.location.assign(window.location.pathname.startsWith('/dashboard') ? '/dashboard' : '/admin')}>
              Back to dashboard
            </Button>
          </div>
        </div>
      </div>
    )
  }
}
