import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
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
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          {/*
            Light is the app-wide default because every route except /admin is always
            light; the admin area opts into dark itself via RouteThemeSync and its own
            `admin-theme` key. enableSystem is off deliberately — with it on, a visitor
            whose OS is in dark mode had `.dark` applied on load and then stripped again
            once RouteThemeSync ran, which is a flash on every public page for those users.
          */}
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            disableTransitionOnChange
          >
            <App />
            <Toaster position="top-center" richColors />
          </ThemeProvider>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>,
)
