import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './context/ThemeContext';
import { ProtectedRoute, GuestRoute } from './routes/index';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import AuthLayout from './layouts/AuthLayout';
import HolderLayout from './layouts/HolderLayout';
import IssuerLayout from './layouts/IssuerLayout';
import VerifierLayout from './layouts/VerifierLayout';
import AdminLayout from './layouts/AdminLayout';

// Public pages
import HomePage from './pages/public/HomePage';
import AboutPage from './pages/public/AboutPage';
import HowItWorksPage from './pages/public/HowItWorksPage';
import DocumentationPage from './pages/public/DocumentationPage';
import ContactPage from './pages/public/ContactPage';
import PrivacyPage from './pages/public/PrivacyPage';
import TermsPage from './pages/public/TermsPage';
import VerifyPublicPage from './pages/public/VerifyPublicPage';

// Auth pages
import LoginPage from './pages/auth/LoginPage';
import HolderRegisterPage from './pages/auth/HolderRegisterPage';
import OrgRegisterPage from './pages/auth/OrgRegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';

// Holder pages
import HolderDashboard from './pages/holder/DashboardPage';
import HolderCredentials from './pages/holder/CredentialsPage';
import HolderCredentialDetail from './pages/holder/CredentialDetailPage';
import RequestCredentialPage from './pages/holder/RequestCredentialPage';
import HolderRequestsPage from './pages/holder/RequestsPage';
import PresentationPage from './pages/holder/PresentationPage';
import SharesPage from './pages/holder/SharesPage';
import HolderVerificationHistory from './pages/holder/VerificationHistoryPage';
import HolderNotifications from './pages/holder/NotificationsPage';
import HolderSettings from './pages/holder/SettingsPage';

// Issuer pages
import IssuerDashboard from './pages/issuer/DashboardPage';
import AnalyticsPage from './pages/issuer/AnalyticsPage';
import IntegrationsPage from './pages/issuer/IntegrationsPage';
import SyncPage from './pages/issuer/SyncPage';
import IssuerNotifications from './pages/issuer/NotificationsPage';
import IssuerSettings from './pages/issuer/SettingsPage';
import MembersPage from './pages/issuer/MembersPage';

// Verifier pages
import VerifierDashboard from './pages/verifier/DashboardPage';
import VerifyPage from './pages/verifier/VerifyPage';
import VerifierHistory from './pages/verifier/HistoryPage';
import ApiKeysPage from './pages/verifier/ApiKeysPage';
import VerifierAnalytics from './pages/verifier/AnalyticsPage';
import VerifierNotifications from './pages/verifier/NotificationsPage';
import VerifierSettings from './pages/verifier/SettingsPage';
import ResultDetailPage from './pages/verifier/ResultDetailPage';

// Admin pages
import AdminDashboard from './pages/admin/DashboardPage';
import AdminUsers from './pages/admin/UsersPage';
import AdminOrganizations from './pages/admin/OrganizationsPage';
import AdminOrganizationDetail from './pages/admin/OrganizationDetailPage';
import OrganizationReviewPage from './pages/admin/OrganizationReviewPage';
import AdminIssuers from './pages/admin/IssuersPage';
import AdminIntegrations from './pages/admin/IntegrationsPage';
import AdminCredentials from './pages/admin/CredentialsPage';
import AdminVerifications from './pages/admin/VerificationsPage';
import TrustRegistryPage from './pages/admin/TrustRegistryPage';
import AuditLogsPage from './pages/admin/AuditLogsPage';
import AdminNotifications from './pages/admin/NotificationsPage';
import AdminReports from './pages/admin/ReportsPage';
import AdminSettings from './pages/admin/SettingsPage';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        <Routes>
          {/* Public Routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/documentation" element={<DocumentationPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/verify" element={<VerifyPublicPage />} />
            <Route path="/verify/:token" element={<VerifyPublicPage />} />
          </Route>

          {/* Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
            <Route path="/register" element={<GuestRoute><HolderRegisterPage /></GuestRoute>} />
            <Route path="/register/organization" element={<GuestRoute><OrgRegisterPage /></GuestRoute>} />
            <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
            <Route path="/reset-password" element={<GuestRoute><ResetPasswordPage /></GuestRoute>} />
          </Route>

          {/* Holder Routes */}
          <Route path="/holder" element={<ProtectedRoute allowedRoles={['holder']}><HolderLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<HolderDashboard />} />
            <Route path="credentials" element={<HolderCredentials />} />
            <Route path="credentials/request" element={<RequestCredentialPage />} />
            <Route path="credentials/:id" element={<HolderCredentialDetail />} />
            <Route path="requests" element={<HolderRequestsPage />} />
            <Route path="presentations" element={<PresentationPage />} />
            <Route path="shares" element={<SharesPage />} />
            <Route path="verification-history" element={<HolderVerificationHistory />} />
            <Route path="notifications" element={<HolderNotifications />} />
            <Route path="settings" element={<HolderSettings />} />
          </Route>

          {/* Issuer Routes */}
          <Route path="/issuer" element={<ProtectedRoute allowedRoles={['issuer']}><IssuerLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<IssuerDashboard />} />
            <Route path="integrations" element={<IntegrationsPage />} />
            <Route path="sync" element={<SyncPage />} />
            <Route path="members" element={<MembersPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="notifications" element={<IssuerNotifications />} />
            <Route path="settings" element={<IssuerSettings />} />
          </Route>

          {/* Verifier Routes */}
          <Route path="/verifier" element={<ProtectedRoute allowedRoles={['verifier']}><VerifierLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<VerifierDashboard />} />
            <Route path="verify" element={<VerifyPage />} />
            <Route path="results/:id" element={<ResultDetailPage />} />
            <Route path="history" element={<VerifierHistory />} />
            <Route path="api-keys" element={<ApiKeysPage />} />
            <Route path="analytics" element={<VerifierAnalytics />} />
            <Route path="notifications" element={<VerifierNotifications />} />
            <Route path="settings" element={<VerifierSettings />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="organizations" element={<AdminOrganizations />} />
            <Route path="organizations/:id" element={<AdminOrganizationDetail />} />
            <Route path="organizations/registrations/:id" element={<OrganizationReviewPage />} />
            <Route path="holders" element={<AdminIssuers />} />
            <Route path="integrations" element={<AdminIntegrations />} />
            <Route path="credentials" element={<AdminCredentials />} />
            <Route path="verifications" element={<AdminVerifications />} />
            <Route path="trust-registry" element={<TrustRegistryPage />} />
            <Route path="audit-logs" element={<AuditLogsPage />} />
            <Route path="notifications" element={<AdminNotifications />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
