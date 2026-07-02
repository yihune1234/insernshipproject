import { Building2, User, ScanLine, ShieldCheck, Lock, Globe, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const roleCards = [
  {
    id: 'issuers',
    icon: Building2,
    color: 'bg-blue-600',
    lightBg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-100 dark:border-blue-900/40',
    accentText: 'text-blue-600 dark:text-blue-400',
    label: 'Organization Issuers',
    desc: 'Trusted organizations — universities, governments, employers — that issue cryptographically signed credentials to verified members.',
    points: [
      'Issue credentials to verified members',
      'Maintain full control of organizational records',
      'Define credential types and templates',
      'Revoke credentials at any time if needed',
    ],
  },
  {
    id: 'holders',
    icon: User,
    color: 'bg-emerald-600',
    lightBg: 'bg-emerald-50 dark:bg-emerald-900/20',
    border: 'border-emerald-100 dark:border-emerald-900/40',
    accentText: 'text-emerald-600 dark:text-emerald-400',
    label: 'Credential Holders',
    desc: 'Individuals who receive credentials from trusted issuers and store them securely in their personal digital wallet.',
    points: [
      'Receive and manage credentials securely',
      'Share credentials when and with whom you choose',
      'Full ownership and control of your personal data',
      'Mobile wallet support for offline presentations',
    ],
  },
  {
    id: 'verifiers',
    icon: ScanLine,
    color: 'bg-violet-600',
    lightBg: 'bg-violet-50 dark:bg-violet-900/20',
    border: 'border-violet-100 dark:border-violet-900/40',
    accentText: 'text-violet-600 dark:text-violet-400',
    label: 'Credential Verifiers',
    desc: 'Organizations or individuals who need to confirm the authenticity of a credential without manual verification or paper documents.',
    points: [
      'Instantly verify credential authenticity',
      'Reduce fraud and manual verification processes',
      'No account required for public verification',
      'Automated API-based verification for enterprises',
    ],
  },
];

const pillars = [
  { icon: ShieldCheck, title: 'Security First', desc: 'Every credential is cryptographically signed and independently verifiable without relying on any central authority.' },
  { icon: Lock, title: 'Privacy by Design', desc: 'Holders control what they share and with whom. No personal data is exposed without explicit consent.' },
  { icon: Globe, title: 'Open Standards', desc: 'Built on W3C Verifiable Credentials, DIDs, and OpenID4VCI standards for maximum global interoperability.' },
];

export default function AboutPage() {
  const navigate = useNavigate();

  return (
    <div className="bg-white dark:bg-slate-950">
      {/* ── Page header ────────────────────────────────────────────── */}
      <section className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-16 px-4">
        <div className="mx-auto max-w-4xl text-center">
          <span className="inline-block rounded-full bg-blue-100 dark:bg-blue-900/40 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider mb-5">
            About the Platform
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-5">
            About the Platform
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-3xl mx-auto">
            This platform enables organizations to issue secure digital credentials to verified members while maintaining
            ownership of their own data. Credentials can be stored in digital wallets and verified instantly by trusted
            third parties without relying on paper documents.
          </p>
        </div>
      </section>

      {/* ── Three role cards ───────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-3">
              Three Roles. One Trusted Ecosystem.
            </h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
              The platform connects issuers, holders, and verifiers in a seamless, standards-based credential lifecycle.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {roleCards.map((card) => (
              <div
                key={card.id}
                id={card.id}
                className={`rounded-2xl border ${card.border} ${card.lightBg} p-7 flex flex-col`}
              >
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${card.color} mb-5 shrink-0`}>
                  <card.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">{card.label}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed flex-1">{card.desc}</p>
                <ul className="space-y-2.5">
                  {card.points.map((pt) => (
                    <li key={pt} className="flex items-start gap-2.5 text-sm">
                      <CheckCircle className={`h-4 w-4 mt-0.5 shrink-0 ${card.accentText}`} />
                      <span className="text-slate-700 dark:text-slate-300">{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Mission ────────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-slate-50 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block rounded-full bg-blue-100 dark:bg-blue-900/40 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider mb-5">
                Our Mission
              </span>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-5">
                Enabling a World Where Individuals Own Their Credentials
              </h2>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                To enable a world where individuals own their credentials, organizations can verify trust instantly,
                and the entire process is open, secure, and accessible to all — regardless of geography or institution size.
              </p>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                We believe that credential verification should not rely on centralized gatekeepers. By using open standards
                and cryptographic proofs, we ensure that trust is mathematical, not institutional.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-5">
              {pillars.map((p) => (
                <div key={p.title} className="flex items-start gap-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/30">
                    <p.icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white mb-1">{p.title}</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-blue-700 text-white">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Start Issuing or Verifying Credentials Today</h2>
          <p className="text-blue-100 mb-8 max-w-lg mx-auto">
            Join the growing ecosystem of trusted organizations and credential holders on the platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/register/organization')}
              className="rounded-lg bg-white text-blue-700 px-7 py-3 text-sm font-semibold hover:bg-blue-50 transition-colors"
            >
              Register Organization
            </button>
            <button
              onClick={() => navigate('/verify')}
              className="rounded-lg border border-white/30 bg-white/10 hover:bg-white/20 px-7 py-3 text-sm font-semibold text-white transition-colors"
            >
              Verify a Credential
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
