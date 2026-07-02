import { Building2, User, ScanLine, CheckCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const actors = [
  {
    id: 'issuer',
    icon: Building2,
    color: 'bg-blue-600',
    lightBg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    badge: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
    label: 'Issuer (Organization)',
    steps: [
      { title: 'Register & Get Approved', desc: 'Apply to join the platform and receive approval from the trust registry administrators.' },
      { title: 'Define Credential Types', desc: 'Create credential templates specifying the fields, validity period, and schema.' },
      { title: 'Issue to Verified Members', desc: 'Issue signed credentials to holders using their national ID or DID.' },
      { title: 'Monitor & Revoke', desc: 'Track issued credentials and revoke them immediately if needed.' },
    ],
  },
  {
    id: 'holder',
    icon: User,
    color: 'bg-emerald-600',
    lightBg: 'bg-emerald-50 dark:bg-emerald-900/20',
    border: 'border-emerald-200 dark:border-emerald-800',
    badge: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300',
    label: 'Holder (Individual)',
    steps: [
      { title: 'Register with National ID', desc: 'Sign up using your national ID — no password required, verified via OTP.' },
      { title: 'Receive Credentials', desc: 'Accept credentials issued to you by trusted, approved organizations.' },
      { title: 'Store Securely', desc: 'Credentials are stored securely in your digital wallet — web or mobile.' },
      { title: 'Share When Needed', desc: 'Present credentials via a QR code or a tamper-proof sharing link.' },
    ],
  },
  {
    id: 'verifier',
    icon: ScanLine,
    color: 'bg-violet-600',
    lightBg: 'bg-violet-50 dark:bg-violet-900/20',
    border: 'border-violet-200 dark:border-violet-800',
    badge: 'bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300',
    label: 'Verifier (Anyone)',
    steps: [
      { title: 'Go to /verify', desc: 'No account required. The public verification page is open to anyone.' },
      { title: 'Enter Credential', desc: 'Scan a QR code, paste a share link, upload a file, or enter a credential ID.' },
      { title: 'Automated Checks Run', desc: 'The platform checks the cryptographic signature, expiry date, revocation status, and issuer trust.' },
      { title: 'See Clear Result', desc: 'Get a clear Valid or Invalid result with detailed check results explained.' },
    ],
  },
];

const verificationChecks = [
  { label: 'Cryptographic Signature', desc: 'Verifies the credential was signed by the claimed issuer and has not been tampered with.' },
  { label: 'Expiry Status', desc: 'Confirms the credential has not passed its expiration date.' },
  { label: 'Revocation Check', desc: 'Checks the Bitstring Status List to ensure the credential has not been revoked.' },
  { label: 'Issuer Trust', desc: 'Confirms the issuing organization is registered in the trusted issuer registry.' },
];

export default function HowItWorksPage() {
  const navigate = useNavigate();

  return (
    <div className="bg-white dark:bg-slate-950">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <section className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-16 px-4">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-block rounded-full bg-blue-100 dark:bg-blue-900/40 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider mb-5">
            The Process
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-5">
            How It Works
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
            CredWallet connects issuers, holders, and verifiers through a secure, standards-based credential ecosystem.
            Each role has a clear, transparent process.
          </p>
        </div>
      </section>

      {/* ── Actor flows ────────────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="mx-auto max-w-5xl space-y-10">
          {actors.map((actor) => (
            <div
              key={actor.id}
              id={actor.id}
              className={`rounded-2xl border ${actor.border} ${actor.lightBg} overflow-hidden`}
            >
              {/* Actor header */}
              <div className="flex items-center gap-4 px-6 py-5 border-b border-inherit">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${actor.color}`}>
                  <actor.icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold mb-1 ${actor.badge}`}>
                    Role
                  </span>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">{actor.label}</h2>
                </div>
              </div>

              {/* Steps grid */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-700">
                {actor.steps.map((step, i) => (
                  <div key={i} className="p-6 flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 shadow-sm">
                        {i + 1}
                      </span>
                      {i < actor.steps.length - 1 && (
                        <ArrowRight className="h-3 w-3 text-slate-300 dark:text-slate-600 hidden lg:block" />
                      )}
                    </div>
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm">{step.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{step.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Verification pipeline ──────────────────────────────────── */}
      <section className="py-20 px-4 bg-slate-50 dark:bg-slate-900">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <span className="inline-block rounded-full bg-blue-100 dark:bg-blue-900/40 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider mb-4">
              Verification Engine
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-3">
              What Happens During Verification?
            </h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
              Every verification request runs through a multi-stage pipeline to ensure complete authenticity and trust.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {verificationChecks.map((check, i) => (
              <div key={check.label} className="flex items-start gap-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/30 text-sm font-bold text-blue-600 dark:text-blue-400">
                  {i + 1}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm">{check.label}</h3>
                    <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{check.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-blue-700 text-white">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">See It in Action</h2>
          <p className="text-blue-100 mb-8">Try verifying a credential now — no login required.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/verify')}
              className="rounded-lg bg-white text-blue-700 px-7 py-3 text-sm font-semibold hover:bg-blue-50 transition-colors"
            >
              Verify a Credential
            </button>
            <button
              onClick={() => navigate('/register/organization')}
              className="rounded-lg border border-white/30 bg-white/10 hover:bg-white/20 px-7 py-3 text-sm font-semibold text-white transition-colors"
            >
              Register as Issuer
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
