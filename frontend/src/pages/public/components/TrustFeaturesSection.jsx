import { Lock, ShieldCheck, Zap, Globe, Award, CheckCircle, Shield } from 'lucide-react';
import ScrollReveal from './ScrollReveal';

const trustFeatures = [
  { icon: Lock, title: 'Cryptographic Security', desc: 'Every credential is signed with Ed25519 keys — tamper-proof and independently verifiable.' },
  { icon: ShieldCheck, title: 'W3C Standards', desc: 'Built on Verifiable Credentials and DIDs for global interoperability.' },
  { icon: Zap, title: 'Instant Verification', desc: 'Verify any credential in seconds — no account, no manual checks.' },
  { icon: Globe, title: 'Decentralized Identity', desc: 'Data stays with the holder. No central authority controls access.' },
  { icon: Award, title: 'Trust Registry', desc: 'Only approved organizations can issue credentials, backed by a transparent registry.' },
  { icon: CheckCircle, title: 'Revocation Support', desc: 'Real-time revocation checks using Bitstring Status Lists.' },
];

export default function TrustFeaturesSection() {
  return (
    <section className="py-20 lg:py-28 px-4 bg-slate-50 dark:bg-slate-900/50">
      <div className="mx-auto max-w-7xl">
        <ScrollReveal>
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 dark:bg-blue-900/40 px-4 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider mb-4">
              <Shield className="h-3.5 w-3.5" /> Trust & Security
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              Enterprise-Grade{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
                Security
              </span>
            </h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto text-lg">
              Every part of the platform is designed around cryptographic trust, open standards, and privacy-first principles.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {trustFeatures.map((f, i) => (
            <ScrollReveal key={f.title}>
              <div className="group relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-7 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/5 hover:border-blue-300 dark:hover:border-blue-700 hover:-translate-y-1">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/30 mb-5 transition-all duration-300 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 group-hover:shadow-lg group-hover:shadow-blue-500/20">
                  <f.icon className="h-6 w-6 text-blue-600 dark:text-blue-400 transition-transform duration-300 group-hover:scale-110" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
