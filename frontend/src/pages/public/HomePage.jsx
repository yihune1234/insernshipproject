import { useNavigate } from 'react-router-dom';
import { Building2, CheckCircle, ArrowRight } from 'lucide-react';
import HeroSection from './components/HeroSection';
import RoleCardsSection from './components/RoleCardsSection';
import HowItWorksSection from './components/HowItWorksSection';
import TrustFeaturesSection from './components/TrustFeaturesSection';
import CTASection from './components/CTASection';
import ScrollReveal from './components/ScrollReveal';

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="bg-white dark:bg-slate-950">
      <HeroSection />
      <RoleCardsSection />
      <HowItWorksSection />
      <TrustFeaturesSection />

      {/* ── FOR ORGANIZATIONS ─────────────────────────────────────── */}
      <section className="py-20 lg:py-28 px-4 bg-white dark:bg-slate-950">
        <div className="mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <ScrollReveal>
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 dark:bg-blue-900/40 px-4 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider mb-4">
                  <Building2 className="h-3.5 w-3.5" /> For Organizations
                </span>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-5 leading-tight">
                  Connect Your{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
                    Member Database
                  </span>{' '}
                  in Minutes
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed text-lg">
                  CredWallet integrates directly with your existing member management system via a simple REST API.
                  No data migration required — your records stay in your system and are verified in real time
                  before every credential is issued.
                </p>
                <ul className="space-y-4 mb-8">
                  {[
                    'Point CredWallet at your member verification endpoint',
                    'Map response fields to credential claims using dot-notation',
                    'Test the connection live before any credential is issued',
                    'Pending credentials auto-deliver when the holder registers',
                  ].map((pt) => (
                    <li key={pt} className="flex items-start gap-3 text-sm">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40">
                        <CheckCircle className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="text-slate-700 dark:text-slate-300">{pt}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate('/documentation')}
                  className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-cyan-500 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-900/30 transition-all hover:shadow-blue-700/50 hover:-translate-y-0.5"
                >
                  Read the Integration Guide <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            </ScrollReveal>

            <ScrollReveal>
              <div className="space-y-6">
                <div className="relative rounded-2xl overflow-hidden shadow-xl shadow-blue-900/20 border border-slate-200 dark:border-slate-800">
                  <img
                    src="/imagecopy3.png"
                    alt="Organization dashboard"
                    className="w-full h-auto object-cover"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Universities & Colleges', desc: 'Degree certificates, student IDs, transcripts' },
                    { label: 'Professional Bodies', desc: 'Membership certificates, licenses, accreditations' },
                    { label: 'Government Agencies', desc: 'Civil service IDs, permits, clearances' },
                    { label: 'Healthcare Institutions', desc: 'Practitioner registration, health worker IDs' },
                  ].map((org) => (
                    <div key={org.label} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-4 hover:border-blue-300 dark:hover:border-blue-700 transition-all hover:shadow-md hover:-translate-y-0.5 cursor-default">
                      <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400 mb-2" />
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-0.5">{org.label}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{org.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      <CTASection />
    </div>
  );
}
