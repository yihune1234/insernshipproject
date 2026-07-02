# API Integration Inventory

## Backend → Frontend → Mobile Endpoint Mapping

### 1. Auth (`/api/auth/`)

| Endpoint | Method | Permission | Frontend Function | Mobile Function | Status |
|----------|--------|------------|-------------------|-----------------|--------|
| `/auth/register/` | POST | AllowAny | `register()` | `authApi.register()` | ✓ |
| `/auth/register/verify-otp/` | POST | AllowAny | `verifyRegistrationOtp()` | `authApi.verifyOTP()` | ✓ |
| `/auth/login/` | POST | AllowAny | `login()` | `authApi.login()` | ✓ |
| `/auth/logout/` | POST | Authenticated | `logout()` | `authApi.logout()` | ✓ |
| `/auth/token/refresh/` | POST | AllowAny | `refreshToken()` | `authApi.refreshToken()` | ✓ |
| `/auth/password/reset/` | POST | AllowAny | `forgotPassword()` | `authApi.requestPasswordReset()` | ✓ |
| `/auth/password/reset/confirm/` | POST | AllowAny | `resetPassword()` | `authApi.confirmPasswordReset()` | ✓ |
| `/auth/me/` | GET | Authenticated | `getMe()` | `authApi.getProfile()` | ✓ |
| `/auth/me/` | PUT | Authenticated | `updateMe()` | `authApi.updateProfile()` | ✓ |
| `/auth/me/password/` | POST | Authenticated | `changePassword()` | `authApi.changePassword()` | ✓ |

### 2. Organizations (`/api/organizations/`)

| Endpoint | Method | Frontend Function | Status |
|----------|--------|-------------------|--------|
| `/organizations/` | GET | `getOrganizationTypes()` | ✓ |
| `/organizations/types/` | GET | `getOrganizationTypes()` | ✓ |
| `/organizations/register/step-1/` | POST | `registrationStep1()` | ✓ |
| `/organizations/register/step-1/verify/` | POST | `registrationStep1Verify()` | ✓ |
| `/organizations/register/step-2/` | POST | `registrationStep2()` | ✓ |
| `/organizations/register/step-3/` | POST | `registrationStep3()` | ✓ |
| `/organizations/register/step-4/` | POST | `registrationStep4()` | ✓ |
| `/organizations/register/step-5/` | POST | `registrationStep5()` | ✓ |
| `/organizations/register/status/<pk>/` | GET | `getRegistrationStatus()` | ✓ |
| `/organizations/profile/` | GET | `getOrganizationProfile()` | ✓ |
| `/organizations/profile/` | PUT | `updateOrganizationProfile()` | ✓ |
| `/organizations/profile/logo/` | POST | `uploadOrgLogo()` | ✓ |
| `/organizations/members/` | GET | `getOrganizationMembers()` | ✓ |
| `/organizations/members/` | POST | `addOrganizationMember()` | ✓ |
| `/organizations/members/<user_id>/` | GET | `getOrganizationMember()` | ✓ |
| `/organizations/members/<user_id>/` | PUT | `updateOrganizationMember()` | ✓ |
| `/organizations/members/<user_id>/` | DELETE | `removeOrganizationMember()` | ✓ |

### 3. Holder/Wallet (`/api/wallet/`)

| Endpoint | Method | Frontend Function | Mobile Function | Status |
|----------|--------|-------------------|-----------------|--------|
| `/wallet/` | GET | `getWallet()` | `authApi.getWallets()` | ✓ |
| `/wallet/credentials/` | GET | `getHolderCredentials()` | - | ✓ |
| `/wallet/credentials/sync/` | POST | `syncCredentials()` | `credentialApi.syncCredentials()` | ✓ |
| `/wallet/credentials/request/` | POST | `requestCredential()` | `credentialApi.createCredentialRequest()` | ✓ |
| `/wallet/credentials/<pk>/` | GET | `getHolderCredential()` | - | ✓ |
| `/wallet/my-credentials/` | GET | `getMyCredentials()` | `credentialApi.listCredentials()` | ✓ |
| `/wallet/my-credentials/<pk>/` | GET | `getMyCredential()` | `credentialApi.getCredential()` | ✓ |
| `/wallet/request-catalog/` | GET | `getRequestCatalog()` | `credentialApi.getRequestCatalog()` | ✓ |
| `/wallet/held/` | GET | `getHeldCredentials()` | - | ✓ |
| `/wallet/held/` | POST | `addHeldCredential()` | - | ✓ |
| `/wallet/held/<pk>/` | DELETE | `removeHeldCredential()` | - | ✓ |
| `/wallet/shares/` | GET | `getShares()` | - | ✓ |
| `/wallet/shares/` | POST | `createShare()` | - | ✓ |
| `/wallet/shares/enable/` | POST | `enableSharing()` | `sharingApi.enableSharing()` | ✓ |
| `/wallet/shares/disable/` | POST | `disableSharing()` | `sharingApi.disableSharing()` | ✓ |
| `/wallet/shares/stats/` | GET | `getShareStats()` | `sharingApi.getShareStats()` | ✓ |
| `/wallet/shares/<token>/` | GET | `getShareByToken()` | - | ✓ |
| `/wallet/shares/<token>/` | DELETE | `deactivateShare()` | - | ✓ |
| `/wallet/presentations/` | GET | `getPresentations()` | `presentationApi.listPresentations()` | ✓ |
| `/wallet/presentations/` | POST | `createPresentation()` | `presentationApi.createPresentation()` | ✓ |
| `/wallet/presentations/<pk>/` | GET | `getPresentation()` | `presentationApi.getPresentation()` | ✓ |

### 4. Credentials (`/api/credentials/`)

| Endpoint | Method | Frontend | Status |
|----------|--------|----------|--------|
| `/credentials/` | GET | `getHolderCredentials()` via wallet | ✓ |
| `/credentials/verify/` | POST | `verifyPublic()` via verification | ✓ |
| `/credentials/sync/` | POST | `syncCredentials()` via wallet | ✓ |
| `/credentials/incoming/` | POST | Org API Key | ✓ (internal) |
| `/credentials/update/` | POST | Org API Key | ✓ (internal) |
| `/credentials/revoke/` | POST | Org API Key | ✓ (internal) |
| `/credentials/<credential_id>/` | GET | - | ✓ |

### 5. Verification (`/api/verification/`)

| Endpoint | Method | Frontend Function | Mobile Function | Status |
|----------|--------|-------------------|-----------------|--------|
| `/verification/verify/` | POST | `createVerification()` | `verificationApi.verifyCredential()` | ✓ |
| `/verification/public/verify/` | POST | `verifyPublic()` | `verificationApi.verifyCredentialPublic()` | ✓ |
| `/verification/history/` | GET | `getVerificationHistory()` | `verificationApi.getVerificationHistory()` | ✓ |
| `/verification/history/<pk>/` | GET | `getVerificationHistoryItem()` | - | ✓ |

### 6. Admin Portal (`/api/admin-portal/`)

| Endpoint | Frontend Function | Status |
|----------|-------------------|--------|
| `/admin-portal/dashboard/` | `getAdminDashboard()` | ✓ |
| `/admin-portal/users/` | `getAdminUsers()` | ✓ |
| `/admin-portal/users/<pk>/` | `getAdminUser()` | ✓ |
| `/admin-portal/users/<pk>/suspend/` | `suspendUser()` | ✓ |
| `/admin-portal/users/<pk>/activate/` | `activateUser()` | ✓ |
| `/admin-portal/organizations/` | `getAdminOrganizations()` | ✓ |
| `/admin-portal/organizations/pending/` | `getPendingOrganizations()` | ✓ |
| `/admin-portal/organizations/<pk>/` | `getAdminOrganization()` | ✓ |
| `/admin-portal/organizations/<pk>/approve/` | `approveOrganization()` | ✓ |
| `/admin-portal/organizations/<pk>/reject/` | `rejectOrganization()` | ✓ |
| `/admin-portal/integrations/` | `getAdminIntegrations()` | ✓ |
| `/admin-portal/integrations/<pk>/` | `getAdminIntegration()` | ✓ |
| `/admin-portal/integrations/<pk>/retry/` | `retryIntegration()` | ✓ |
| `/admin-portal/integrations/<pk>/disable/` | `disableIntegration()` | ✓ |
| `/admin-portal/credentials/synchronized/` | `getAdminSynchronizedCredentials()` | ✓ |
| `/admin-portal/credentials/status/` | `getAdminCredentialStatus()` | ✓ |
| `/admin-portal/holders/` | `getAdminHolders()` | ✓ |
| `/admin-portal/verifications/logs/` | `getAdminVerificationLogs()` | ✓ |
| `/admin-portal/verifications/stats/` | `getAdminVerificationStats()` | ✓ |
| `/admin-portal/verifications/revoked/` | `getAdminRevokedCredentials()` | ✓ |
| `/admin-portal/verifications/expired/` | `getAdminExpiredCredentials()` | ✓ |
| `/admin-portal/reports/synchronization/` | `getSynchronizationReport()` | ✓ |
| `/admin-portal/reports/organizations/` | `getOrganizationReport()` | ✓ |
| `/admin-portal/reports/verifications/` | `getVerificationReport()` | ✓ |
| `/admin-portal/reports/integrations/` | `getIntegrationReport()` | ✓ |
| `/admin-portal/reports/audit/` | `getAuditReport()` | ✓ |

### 7. Integration/Issuer (`/api/integration/`)

| Endpoint | Frontend Function | Status |
|----------|-------------------|--------|
| `/integration/organization/` | `getIssuerOrganization()` | ✓ |
| `/integration/configs/` | `getIntegrationConfigs()` | ✓ |
| `/integration/configs/<org_id>/` | `getIntegrationConfig()` | ✓ |
| `/integration/configs/<org_id>/sync/` | `triggerIntegrationSync()` | ✓ |
| `/integration/configs/<org_id>/health/` | `checkIntegrationHealth()` | ✓ |
| `/integration/sync/` | `triggerLiveSync()` | ✓ |
| `/integration/sync/logs/` | `getSyncLogs()` | ✓ |
| `/integration/analytics/` | `getIntegrationAnalytics()` | ✓ |
| `/integration/analytics/<org_id>/` | `getOrgIntegrationAnalytics()` | ✓ |

### 8. Verifier (`/api/verifier/`)

| Endpoint | Frontend Function | Status |
|----------|-------------------|--------|
| `/verifier/register/` | `registerVerifier()` | ✓ |
| `/verifier/api-keys/` | `getApiKeys()` / `createApiKey()` | ✓ |
| `/verifier/api-keys/<pk>/` | `getApiKey()` / `updateApiKey()` / `deleteApiKey()` | ✓ |
| `/verifier/api-keys/<pk>/rotate/` | `rotateApiKey()` | ✓ |
| `/verifier/analytics/` | `getVerifierAnalytics()` | ✓ |
| `/verifier/verify/` | `getVerifierVerify()` | ✓ |

### 9. Notifications (`/api/notifications/`)

| Endpoint | Frontend Function | Status |
|----------|-------------------|--------|
| `/notifications/` | `getNotifications()` | ✓ |
| `/notifications/mark-read/` | `markNotificationsRead()` | ✓ |
| `/notifications/mark-all-read/` | `markAllNotificationsRead()` | ✓ |
| `/notifications/preferences/` | `getNotificationPreferences()` / `updateNotificationPreferences()` | ✓ |

### 10. Other Endpoints

| Endpoint | App | Status |
|----------|-----|--------|
| `/national-id/initiate/` | National ID | ✓ |
| `/national-id/confirm/` | National ID | ✓ |
| `/national-id/status/` | National ID | ✓ |
| `/did/` | DID | ✓ |
| `/did/<did>/` | DID | ✓ |
| `/did/auth/challenge/` | DID | ✓ |
| `/did/auth/respond/` | DID | ✓ |
| `/trust/accreditations/` | Trust Registry | ✓ |
| `/trust/accreditations/<pk>/` | Trust Registry | ✓ |
| `/trust/accreditations/<pk>/approve/` | Trust Registry | ✓ |
| `/trust/accreditations/<pk>/suspend/` | Trust Registry | ✓ |
| `/trust/check/<org_id>/` | Trust Registry | ✓ |
| `/audit/logs/` | Audit | ✓ |
| `/audit/logs/<pk>/` | Audit | ✓ |
| `/health/` | System | ✓ (internal) |
| `/.well-known/openid-credential-issuer` | OID4VCI | ✓ (protocol) |
| `/.well-known/openid-configuration` | OID4VCI | ✓ (protocol) |
| `/.well-known/jwks/` | OID4VCI | ✓ (protocol) |

## Mock Organization API Endpoints

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/health` | GET | Health check | ✓ |
| `/api/holders/resolve/:national_id` | GET | Phase 8: Holder validation | ✓ |
| `/api/holders/:internal_id/credentials` | GET | Phase 9: Holder credentials | ✓ |
| `/api/credentials/` | GET | All credentials | ✓ |
| `/api/credentials/:credential_id` | GET | Single credential | ✓ |
| `/api/credentials/:credential_id/status` | GET | Credential status | ✓ |
| `/api/credentials/revoked/` | GET | Revoked list | ✓ |
| `/university/members/verify` | POST | University member verify | ✓ |
| `/government/records/verify` | POST | Government record verify | ✓ |
| `/employer/employees/verify` | POST | Employer verify | ✓ |
| `/university/members` | GET | List university members | ✓ |
| `/government/records` | GET | List government records | ✓ |
| `/employer/employees` | GET | List employer records | ✓ |

## Files Modified

### Frontend API Files:
- `frontend/src/api/auth.js` - Corrected all endpoint paths to match backend
- `frontend/src/api/holder.js` - Corrected all endpoint paths to match backend
- `frontend/src/api/admin.js` - Corrected all endpoint paths to backend routes
- `frontend/src/api/issuer.js` - Corrected all endpoint paths to backend routes
- `frontend/src/api/verifier.js` - Corrected all endpoint paths to backend routes
- `frontend/src/api/notifications.js` - Corrected paths to use `/notifications/` prefix

### Frontend Pages:
- `frontend/src/pages/auth/HolderRegisterPage.jsx` - Updated to use real API functions

### Mobile API Files:
- `mobile/services/auth/authApi.ts` - Rewritten to match real backend endpoints
- `mobile/services/auth/holderAuth.ts` - Removed mock data dependency
- `mobile/services/credentials/credentialApi.ts` - Corrected endpoint paths
- `mobile/services/verification/verificationApi.ts` - Corrected endpoint paths
- `mobile/services/presentation/presentationApi.ts` - Corrected endpoint paths
- `mobile/services/sharing/sharingApi.ts` - Corrected endpoint paths
- `mobile/services/nid/nidApi.ts` - Rewritten to match real backend endpoints
- `mobile/services/sync/syncService.ts` - Simplified to use credential sync
- `mobile/services/api.ts` - Updated re-exports

### Mock Org API:
- `mock_org_api/server.js` - Added Phase 8 & 9 endpoints for full integration pipeline
