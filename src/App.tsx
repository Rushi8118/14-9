import { Suspense, useEffect, type ReactNode } from 'react'
import { Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom'
import { SiteVisitTracker } from './components/SiteVisitTracker'
import { ProtectedRoute } from './components/ProtectedRoute'
import { RouteProgress } from './components/route-progress'
import { AppErrorBoundary } from './components/AppErrorBoundary'
import { lazyWithReload as lazy } from './lib/chunk-reload'

// Eager-load the most-visited public pages so clicks feel instant
import HomePage from './pages/HomePage'
import StudyVisaPage from './pages/StudyVisaPage'
import WorkVisaPage from './pages/WorkVisaPage'
import AboutPage from './pages/AboutPage'
import VisaConsultantsSuratPage from './pages/VisaConsultantsSuratPage'
import GuidesPage from './pages/GuidesPage'
import StudyInCanadaPage from './pages/StudyInCanadaPage'
import StudyInUKPage from './pages/StudyInUKPage'
import StudyInAustraliaPage from './pages/StudyInAustraliaPage'
import StudyInUSAPage from './pages/StudyInUSAPage'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

/** Never blank the whole viewport — only a thin top bar shows via RouteProgress. */
function SoftFallback() {
  return <div className="min-h-[40vh] bg-background" aria-hidden="true" />
}

function Page({ children }: { children: ReactNode }) {
  return <>{children}</>
}

// Secondary / heavier routes stay lazy
const ServicesPage = lazy(() => import('./pages/ServicesPage'))
const ContactPage = lazy(() => import('./pages/ContactPage'))
const CountriesPage = lazy(() => import('./pages/CountriesPage'))
const CountryPage = lazy(() => import('./pages/CountryPage'))
const ProgramPage = lazy(() => import('./pages/ProgramPage'))
const StudyInGermanyPage = lazy(() => import('./pages/StudyInGermanyPage'))
const StudyInIrelandPage = lazy(() => import('./pages/StudyInIrelandPage'))
const StudyInNewZealandPage = lazy(() => import('./pages/StudyInNewZealandPage'))
const WorkVisaCountryPage = lazy(() => import('./pages/work-visa/WorkVisaCountryPage'))
const StudyInFrancePage = lazy(() => import('./pages/StudyInFrancePage'))
const StudyInSpainPage = lazy(() => import('./pages/StudyInSpainPage'))
const StudyInDubaiPage = lazy(() => import('./pages/StudyInDubaiPage'))
const StudyInSingaporePage = lazy(() => import('./pages/StudyInSingaporePage'))
const SuccessStoriesPage = lazy(() => import('./pages/SuccessStoriesPage'))
const CanadaStudentVisaRequirementsPage = lazy(() => import('./pages/guides/CanadaStudentVisaRequirementsPage'))
const CanadaStudyVisaDocumentsPage = lazy(() => import('./pages/guides/CanadaStudyVisaDocumentsPage'))
const UKStudentVisaRequirementsPage = lazy(() => import('./pages/guides/UKStudentVisaRequirementsPage'))
const AustraliaStudentVisaRequirementsPage = lazy(() => import('./pages/guides/AustraliaStudentVisaRequirementsPage'))
const JapanSswVisaGuidePage = lazy(() => import('./pages/guides/JapanSswVisaGuidePage'))
const VisaRejectionReasonsPage = lazy(() => import('./pages/guides/VisaRejectionReasonsPage'))
const IeltsRequirementsPage = lazy(() => import('./pages/guides/IeltsRequirementsPage'))
const PostStudyWorkComparisonPage = lazy(() => import('./pages/guides/PostStudyWorkComparisonPage'))
const PostStudyWorkVisaPage = lazy(() => import('./pages/PostStudyWorkVisaPage'))
const ReviewsPage = lazy(() => import('./pages/ReviewsPage'))
const TermsPage = lazy(() => import('./pages/TermsPage'))
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'))
const ImmigrationDisclaimerPage = lazy(() => import('./pages/ImmigrationDisclaimerPage'))

const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'))
const AuthCallback = lazy(() => import('./pages/AuthCallback'))

const DashboardShell = lazy(() => import('./components/dashboard/DashboardShell'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const ApplicationsPage = lazy(() => import('./pages/ApplicationsPage'))
const DocumentsPage = lazy(() => import('./pages/DocumentsPage'))
const AppointmentsPage = lazy(() => import('./pages/AppointmentsPage'))
const ChatPage = lazy(() => import('./pages/ChatPage'))
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))

const AdminLayout = lazy(() => import('./components/AdminLayout'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const RealtimeDashboardPage = lazy(() => import('./pages/admin/RealtimeDashboardPage'))
const RolesPage = lazy(() => import('./pages/admin/RolesPage'))
const SessionsPage = lazy(() => import('./pages/admin/SessionsPage'))
const AuditLogsPage = lazy(() => import('./pages/admin/AuditLogsPage'))
const ActivityLogsPage = lazy(() => import('./pages/admin/ActivityLogsPage'))
const AutomationsPage = lazy(() => import('./pages/admin/AutomationsPage'))
const EmailTemplatesPage = lazy(() => import('./pages/admin/EmailTemplatesPage'))
const FileManagerPage = lazy(() => import('./pages/admin/FileManagerPage'))
const AdminUsersPage = lazy(() => import('./pages/admin/UsersPage'))
const AdminUserDetailPage = lazy(() => import('./pages/admin/UserDetailPage'))
const AdminBlogPage = lazy(() => import('./pages/admin/BlogPage'))
const AdminApplicationsPage = lazy(() => import('./pages/admin/AdminApplicationsWorkspace'))
const AdminSettingsPage = lazy(() => import('./pages/admin/SettingsPage'))
const BlogIndexPage = lazy(() => import('./pages/BlogIndexPage'))
const BlogPostPage = lazy(() => import('./pages/BlogPostPage'))
const UrgentRequirementsPage = lazy(() => import('./pages/UrgentRequirementsPage'))
const UrgentRequirementDetailPage = lazy(() => import('./pages/UrgentRequirementDetailPage'))
const UrgentRequirementsAdminPage = lazy(() => import('./pages/admin/UrgentRequirementsAdminPage'))
const AppointmentsAdminPage = lazy(() => import('./pages/admin/AppointmentsAdminPage'))
const CountriesAdminPage = lazy(() => import('./pages/admin/CountriesAdminPage'))
const ForbiddenPage = lazy(() => import('./pages/ForbiddenPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Page><HomePage /></Page>} />
      <Route path="/about" element={<Page><AboutPage /></Page>} />
      <Route path="/services" element={<Page><ServicesPage /></Page>} />
      <Route path="/contact" element={<Page><ContactPage /></Page>} />
      <Route path="/countries" element={<Page><CountriesPage /></Page>} />
      <Route path="/countries/:slug" element={<Page><CountryPage /></Page>} />
      <Route path="/countries/:slug/programs/:programSlug" element={<Page><ProgramPage /></Page>} />
      <Route path="/work-visa" element={<Page><WorkVisaPage /></Page>} />
      <Route path="/study-visa" element={<Page><StudyVisaPage /></Page>} />
      <Route path="/study-in-usa" element={<Page><StudyInUSAPage /></Page>} />
      <Route path="/study-in-uk" element={<Page><StudyInUKPage /></Page>} />
      <Route path="/study-in-canada" element={<Page><StudyInCanadaPage /></Page>} />
      <Route path="/study-in-australia" element={<Page><StudyInAustraliaPage /></Page>} />
      <Route path="/study-in-germany" element={<Page><StudyInGermanyPage /></Page>} />
      <Route path="/study-in-france" element={<Page><StudyInFrancePage /></Page>} />
      <Route path="/study-in-spain" element={<Page><StudyInSpainPage /></Page>} />
      <Route path="/study-in-dubai" element={<Page><StudyInDubaiPage /></Page>} />
      <Route path="/study-in-singapore" element={<Page><StudyInSingaporePage /></Page>} />
      <Route path="/study-in-ireland" element={<Page><StudyInIrelandPage /></Page>} />
      <Route path="/study-in-new-zealand" element={<Page><StudyInNewZealandPage /></Page>} />
      <Route path="/work-visa/:slug" element={<Page><WorkVisaCountryPage /></Page>} />
      <Route path="/visa-consultants-in-surat" element={<Page><VisaConsultantsSuratPage /></Page>} />
      <Route path="/guides" element={<Page><GuidesPage /></Page>} />
      <Route path="/guides/canada-student-visa-requirements" element={<Page><CanadaStudentVisaRequirementsPage /></Page>} />
      <Route path="/guides/canada-study-visa-documents" element={<Page><CanadaStudyVisaDocumentsPage /></Page>} />
      <Route path="/guides/uk-student-visa-requirements" element={<Page><UKStudentVisaRequirementsPage /></Page>} />
      <Route path="/guides/australia-student-visa-requirements" element={<Page><AustraliaStudentVisaRequirementsPage /></Page>} />
      <Route path="/guides/japan-ssw-visa-guide" element={<Page><JapanSswVisaGuidePage /></Page>} />
      <Route path="/guides/visa-rejection-reasons" element={<Page><VisaRejectionReasonsPage /></Page>} />
      <Route path="/guides/ielts-requirements-for-study-abroad" element={<Page><IeltsRequirementsPage /></Page>} />
      <Route path="/guides/post-study-work-visa-comparison" element={<Page><PostStudyWorkComparisonPage /></Page>} />
      <Route path="/success-stories" element={<Page><SuccessStoriesPage /></Page>} />
      <Route path="/post-study-work-visa" element={<Page><PostStudyWorkVisaPage /></Page>} />
      <Route path="/reviews" element={<Page><ReviewsPage /></Page>} />
      <Route path="/blog" element={<Page><BlogIndexPage /></Page>} />
      <Route path="/blog/:slug" element={<Page><BlogPostPage /></Page>} />
      <Route path="/urgent-requirements" element={<Page><UrgentRequirementsPage /></Page>} />
      <Route path="/urgent-requirements/:slug" element={<Page><UrgentRequirementDetailPage /></Page>} />
      <Route path="/terms" element={<Page><TermsPage /></Page>} />
      <Route path="/privacy" element={<Page><PrivacyPage /></Page>} />
      <Route path="/immigration-disclaimer" element={<Page><ImmigrationDisclaimerPage /></Page>} />

      <Route path="/login" element={<Page><LoginPage /></Page>} />
      <Route path="/register" element={<Page><RegisterPage /></Page>} />
      <Route path="/forgot-password" element={<Page><ForgotPasswordPage /></Page>} />
      <Route path="/reset-password" element={<Page><ResetPasswordPage /></Page>} />
      <Route path="/auth/reset-password" element={<Page><ResetPasswordPage /></Page>} />
      <Route path="/auth/callback" element={<AuthCallback />} />

      <Route path="/403" element={<Page><ForbiddenPage /></Page>} />
      <Route path="/404" element={<Page><NotFoundPage /></Page>} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardShell>
              <Outlet />
            </DashboardShell>
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="applications" element={<ApplicationsPage />} />
        <Route path="documents" element={<DocumentsPage />} />
        <Route path="appointments" element={<AppointmentsPage />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="realtime" element={<RealtimeDashboardPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="users/:id" element={<AdminUserDetailPage />} />
        <Route path="roles" element={<RolesPage />} />
        <Route path="applications" element={<AdminApplicationsPage />} />
        <Route path="appointments" element={<AppointmentsAdminPage />} />
        <Route path="urgent-requirements" element={<UrgentRequirementsAdminPage />} />
        <Route path="countries" element={<CountriesAdminPage />} />
        <Route path="blog" element={<AdminBlogPage />} />
        <Route path="sessions" element={<SessionsPage />} />
        <Route path="audit" element={<AuditLogsPage />} />
        <Route path="activity-logs" element={<ActivityLogsPage />} />
        <Route path="automations" element={<AutomationsPage />} />
        <Route path="email-templates" element={<EmailTemplatesPage />} />
        <Route path="files" element={<FileManagerPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  )
}

function App() {
  const { pathname } = useLocation()
  return (
    <>
      <ScrollToTop />
      <RouteProgress />
      <SiteVisitTracker />
      <AppErrorBoundary resetKey={pathname}>
        <Suspense fallback={<SoftFallback />}>
          <AppRoutes />
        </Suspense>
      </AppErrorBoundary>
    </>
  )
}

export default App
