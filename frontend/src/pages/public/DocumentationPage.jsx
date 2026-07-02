import { useState } from 'react';
import { Code, Key, BookOpen, Zap, Link as LinkIcon, Database, CheckCircle, ChevronDown, ChevronRight } from 'lucide-react';

const TABS = [
  { id: 'overview', label: 'API Overview' },
  { id: 'integration', label: 'Member API Integration' },
  { id: 'verification', label: 'Verification API' },
  { id: 'quickstart', label: 'Quick Start' },
];

function CodeBlock({ children }) {
  return (
    <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-mono bg-muted/50 rounded-lg p-4 overflow-x-auto">
      {children}
    </pre>
  );
}

function Section({ icon: Icon, title, children }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-3">
      <div className="flex items-center gap-3">
        <div className="inline-flex rounded-lg bg-primary/10 p-2">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Collapsible({ title, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-foreground bg-muted/40 hover:bg-muted/70 transition-colors"
      >
        {title}
        {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
      </button>
      {open && <div className="p-4 space-y-3 bg-card">{children}</div>}
    </div>
  );
}

function OverviewTab() {
  return (
    <div className="space-y-6">
      <Section icon={BookOpen} title="API Overview">
        <p className="text-sm text-muted-foreground">
          The CredWallet API is a RESTful JSON API. All endpoints are under <code className="font-mono bg-muted px-1 rounded">/api/</code>.
          Authentication uses JWT Bearer tokens obtained from <code className="font-mono bg-muted px-1 rounded">/api/auth/login/</code>.
        </p>
        <CodeBlock>{`POST /api/auth/login/
Body: { "email": "...", "password": "..." }
Returns: { "access": "...", "refresh": "...", "user": {...}, "role": "issuer" }

Authorization: Bearer <access_token>`}</CodeBlock>
      </Section>

      <Section icon={Key} title="Endpoint Map">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-2 font-medium text-muted-foreground">Prefix</th>
                <th className="pb-2 font-medium text-muted-foreground">Purpose</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                ['/api/auth/', 'Login, register, refresh, password reset'],
                ['/api/national-id/', 'NID verification (Fayda / MOSIP)'],
                ['/api/did/', 'DID management, document resolution'],
                ['/api/wallet/', 'Holder wallet — credentials, shares, notifications'],
                ['/api/issuer/', 'Issuer portal — templates, issuance, API config'],
                ['/api/templates/', 'Credential type + template lookup'],
                ['/api/verifier/', 'Verifier dashboard + session verification'],
                ['/api/verification/public/', 'Unauthenticated public credential verification'],
                ['/api/admin/', 'Platform admin — users, orgs, audit, stats'],
              ].map(([path, desc]) => (
                <tr key={path}>
                  <td className="py-2 pr-4 font-mono text-xs text-primary">{path}</td>
                  <td className="py-2 text-muted-foreground">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}

function IntegrationTab() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-5">
        <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">How Federated Member Verification Works</h3>
        <p className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed">
          When an issuer clicks <strong>Issue Credential</strong>, CredWallet calls your organization's
          member verification API in real time. If the member is found and eligible, the credential is issued
          with the data your API returns. If the holder hasn't registered yet, the credential is held as
          <strong> pending delivery</strong> and automatically sent when they join.
        </p>
      </div>

      <Section icon={Database} title="What Your API Must Do">
        <p className="text-sm text-muted-foreground mb-2">
          Your endpoint receives a POST with the member identifier and must return JSON indicating eligibility.
        </p>
        <CodeBlock>{`POST /your-endpoint
Headers:
  Content-Type: application/json
  X-API-Key: <your-configured-key>

Body:
  { "member_id": "EMP-12345" }

Response (eligible member):
{
  "status": "active",
  "member": {
    "name": "Almaz Tadesse",
    "department": "Engineering",
    "joined": "2022-03-01"
  }
}

Response (ineligible):
{
  "status": "inactive",
  "reason": "Membership expired"
}`}</CodeBlock>
      </Section>

      <Section icon={LinkIcon} title="Configuring the Integration">
        <ol className="space-y-3 text-sm text-muted-foreground list-none">
          {[
            { n: 1, t: 'Go to Issuer Portal → Member API in the left sidebar.' },
            { n: 2, t: 'Enter your Base URL (e.g. https://api.yourorg.com) and Verify Endpoint (e.g. /members/verify).' },
            { n: 3, t: 'Set the API Key Header (e.g. X-API-Key) and your secret API key.' },
            { n: 4, t: 'Set the Request ID Field — the JSON key CredWallet sends (e.g. member_id).' },
            { n: 5, t: 'Set Response Eligibility Field using dot-notation: the path to the true/false or "active" value (e.g. data.is_active or status).' },
            { n: 6, t: 'Set Response Name Field — path to the member\'s display name (e.g. member.name).' },
            { n: 7, t: 'Add Field Mappings to pull extra data into credential claims (e.g. member.department → department).' },
            { n: 8, t: 'Click Test Connection — enter a real member ID and verify the result table.' },
          ].map(({ n, t }) => (
            <li key={n} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{n}</span>
              <span>{t}</span>
            </li>
          ))}
        </ol>
      </Section>

      <Section icon={Code} title="Dot-Notation Field Paths">
        <p className="text-sm text-muted-foreground mb-2">
          Use dot-notation to navigate nested JSON. Given this response:
        </p>
        <CodeBlock>{`{
  "data": {
    "is_active": true,
    "member": {
      "name": "Almaz Tadesse",
      "membership_tier": "gold"
    }
  }
}

Eligibility field:  data.is_active
Name field:         data.member.name
Field mapping:      data.member.membership_tier → tier`}</CodeBlock>
      </Section>

      <Section icon={Zap} title="Eligible Values for the Eligibility Field">
        <p className="text-sm text-muted-foreground mb-2">
          CredWallet treats the following values as <strong>eligible</strong>:
        </p>
        <div className="flex flex-wrap gap-2">
          {['true', '1', 'yes', 'active', 'valid', 'eligible'].map((v) => (
            <code key={v} className="rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 text-xs font-mono">
              {v}
            </code>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3">All comparisons are case-insensitive. Any other value (false, inactive, 0, null) is treated as ineligible.</p>
      </Section>

      <Section icon={CheckCircle} title="Testing with the Mock Org API">
        <p className="text-sm text-muted-foreground mb-2">
          The repository includes a ready-to-run Express mock server at <code className="font-mono bg-muted px-1 rounded">mock_org_api/</code>.
        </p>
        <CodeBlock>{`cd mock_org_api
npm install
npm start
# → Listening on http://localhost:3001

# In Issuer Portal → Member API, enter:
Base URL:          http://localhost:3001
Verify Endpoint:   /api/members/verify
API Key Header:    X-API-Key
API Key Value:     mock-api-key-2024
Request ID Field:  member_id

# Test member IDs (see mock_org_api/members.json):
MEM001  → active member   ✓ eligible
MEM002  → active member   ✓ eligible
MEM007  → inactive        ✗ not eligible
MEM010  → suspended       ✗ not eligible`}</CodeBlock>
      </Section>

      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="font-semibold text-foreground mb-4">Frequently Asked Questions</h3>
        <div className="space-y-3">
          <Collapsible title="Does CredWallet store my member data?">
            <p className="text-sm text-muted-foreground">
              No. CredWallet calls your API at issuance time only. The data returned is used to populate the
              credential claims and is not stored beyond the credential itself. Your system remains the source of truth.
            </p>
          </Collapsible>
          <Collapsible title="What if my API is down when a credential is being issued?">
            <p className="text-sm text-muted-foreground">
              The issuance will fail with a clear error explaining the connection problem. No credential is
              issued if your API is unreachable. The issuer can retry once your API is back online.
            </p>
          </Collapsible>
          <Collapsible title="What is Pending Delivery?">
            <p className="text-sm text-muted-foreground">
              If the issuer issues a credential to a member who hasn't created a wallet account yet, the credential
              is stored as <em>pending</em>. As soon as that person registers and verifies their National ID,
              the credential is automatically delivered to their wallet.
            </p>
          </Collapsible>
          <Collapsible title="Can I use HMAC signatures instead of a static API key?">
            <p className="text-sm text-muted-foreground">
              Currently the platform supports a static header-based API key. HMAC request signing is on the roadmap.
              You can rotate your key at any time in the Issuer Portal without re-approving your organization.
            </p>
          </Collapsible>
        </div>
      </div>
    </div>
  );
}

function VerificationTab() {
  return (
    <div className="space-y-6">
      <Section icon={CheckCircle} title="Public Credential Verification (No Auth Required)">
        <p className="text-sm text-muted-foreground mb-2">
          Anyone can verify any credential without logging in.
        </p>
        <CodeBlock>{`POST /api/verification/public/verify/
Body (one of):
  { "token": "share-token-from-qr" }
  { "credential_id": "uuid-here" }
  { "share_link": "https://..." }

Response:
{
  "is_valid": true,
  "checks": {
    "signature": "valid",
    "expiry": "not_expired",
    "revocation": "not_revoked",
    "issuer_trust": "trusted"
  },
  "credential_data": { ... },
  "issuer": { "name": "Addis Ababa University", "did": "did:web:..." }
}`}</CodeBlock>
      </Section>

      <Section icon={Key} title="Verification Methods">
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { method: 'QR Camera Scan', path: 'Scan the QR code printed on a shared credential — CredWallet decodes the share token automatically.' },
            { method: 'Share Link', path: 'Paste the shareable URL the holder sent you.' },
            { method: 'Credential ID', path: 'Enter the raw UUID of the credential if you have it.' },
            { method: 'File Upload', path: 'Upload a .json credential file for offline verification.' },
          ].map(({ method, path }) => (
            <div key={method} className="rounded-lg bg-muted/40 p-4">
              <h4 className="text-sm font-semibold text-foreground mb-1">{method}</h4>
              <p className="text-xs text-muted-foreground">{path}</p>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function QuickstartTab() {
  return (
    <div className="space-y-6">
      <Section icon={Zap} title="Quick Start for Issuers">
        <ol className="space-y-3 text-sm text-muted-foreground">
          {[
            'Register at /register/organization and fill out the registration form.',
            'Upload your supporting documents (registration certificate, authorization letter).',
            'Wait for admin approval — you\'ll receive a welcome email with your login.',
            'In the Issuer Portal, go to Member API and configure your member verification endpoint.',
            'Create a Credential Type to define the kind of credential you issue.',
            'Create a Template — map credential fields to member API response paths.',
            'Go to Issue Credential, enter a member ID, verify them, and issue.',
          ].map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{i + 1}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </Section>

      <Section icon={BookOpen} title="Quick Start for Holders">
        <ol className="space-y-3 text-sm text-muted-foreground">
          {[
            'Register at /register with your email and a password.',
            'Verify your National ID (FIN) to activate your wallet.',
            'Any credentials already issued to your National ID will auto-deliver.',
            'View credentials in your Wallet, share via QR or secure link.',
          ].map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-xs font-bold text-emerald-700 dark:text-emerald-400">{i + 1}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </Section>
    </div>
  );
}

export default function DocumentationPage() {
  const [tab, setTab] = useState('overview');

  return (
    <div className="py-16 px-4 min-h-screen">
      <div className="mx-auto max-w-4xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-foreground mb-3">Documentation</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Everything you need to integrate with CredWallet — API reference, member API setup, and verification endpoints.
          </p>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 bg-muted/50 rounded-xl p-1 mb-8 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 min-w-max rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                tab === t.id
                  ? 'bg-card shadow text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'overview' && <OverviewTab />}
        {tab === 'integration' && <IntegrationTab />}
        {tab === 'verification' && <VerificationTab />}
        {tab === 'quickstart' && <QuickstartTab />}

        <div className="mt-8 rounded-xl bg-primary/5 border border-primary/20 p-6 text-center">
          <h3 className="font-semibold text-foreground mb-2">Interactive API Docs</h3>
          <p className="text-sm text-muted-foreground mb-4">Full OpenAPI docs with live testing available for registered organizations.</p>
          <a href="/api/docs/" target="_blank" rel="noreferrer" className="text-sm font-medium text-primary hover:underline">
            Open Swagger UI →
          </a>
        </div>
      </div>
    </div>
  );
}
