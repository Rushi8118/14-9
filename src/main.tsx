import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './components/auth-provider'
import { ThemeProvider } from './components/theme-provider'
import { Toaster } from './components/ui/sonner'
import App from './App'
import { reloadForNewDeploy } from './lib/chunk-reload'
import './index.css'
import { startActivityLogger } from './lib/activity-logger'
import { initAnalytics } from './lib/analytics'

startActivityLogger()
initAnalytics()

// After a deploy, a tab still running the old build asks for chunks that no longer exist.
window.addEventListener('vite:preloadError', (event) => {
  if (reloadForNewDeploy()) event.preventDefault()
})

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="dark"
              enableSystem
              disableTransitionOnChange
            >
              <App />
              <Toaster position="top-center" richColors />
            </ThemeProvider>
          </AuthProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </BrowserRouter>
  </StrictMode>,
)
