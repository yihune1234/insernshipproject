import { Building2, User, ScanLine, CheckCircle, Layers } from 'lucide-react';
import ScrollReveal from './ScrollReveal';

const roleCards = [
  {
    icon: Building2,
    gradient: 'from-blue-600 to-blue-800',
    lightBg: 'bg-blue-50 dark:bg-blue-900/20',
    textColor: 'text-blue-600 dark:text-blue-400',
    borderColor: 'border-blue-100 dark:border-blue-900/40',
    glow: 'shadow-blue-500/20',
    title: 'Organization Issuers',
    desc: 'Register your organization, define credential types, and issue tamper-proof digital credentials to verified members at scale.',
    points: ['Issue credentials to verified members', 'Maintain full control of organizational records', 'Revoke or update credentials anytime'],
  },
  {
    icon: User,
    gradient: 'from-emerald-500 to-emerald-700',
    lightBg: 'bg-emerald-50 dark:bg-emerald-900/20',
    textColor: 'text-emerald-600 dark:text-emerald-400',
    borderColor: 'border-emerald-100 dark:border-emerald-900/40',
    glow: 'shadow-emerald-500/20',
    title: 'Credential Holders',
    desc: 'Receive, manage, and share your secure digital credentials from any trusted organization — right from your digital wallet.',
    points: ['Receive and manage credentials securely', 'Share credentials via QR code or secure link', 'Full ownership of your personal data'],
  },
  {
    icon: ScanLine,
    gradient: 'from-violet-500 to-violet-700',
    lightBg: 'bg-violet-50 dark:bg-violet-900/20',
    textColor: 'text-violet-600 dark:text-violet-400',
    borderColor: 'border-violet-100 dark:border-violet-900/40',
    glow: 'shadow-violet-500/20',
    title: 'Credential Verifiers',
    desc: 'Instantly verify credential authenticity without manual processes, paper documents, or lengthy delays.',
    points: ['Instantly verify credential authenticity', 'Reduce fraud and manual verification', 'No account required for basic verification'],
  },
];

export default function RoleCardsSection() {
  return (
    <section className="py-20 lg:py-28 px-4 bg-slate-50 dark:bg-slate-900/50">
      <div className="mx-auto max-w-7xl">
        <ScrollReveal>
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 dark:bg-blue-900/40 px-4 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider mb-4">
              <Layers className="h-3.5 w-3.5" /> The Ecosystem
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              Built for Every Role in the{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
                Credential Journey
              </span>
            </h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto text-lg">
              Whether you issue, hold, or verify credentials — the platform is designed around your specific needs.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-3 gap-8">
          {roleCards.map((card, i) => (
            <ScrollReveal key={card.title}>
              <div
                className={`group relative rounded-2xl border ${card.borderColor} ${card.lightBg} p-8 transition-all duration-300 hover:shadow-xl ${card.glow} hover:-translate-y-2`}
              >
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                <div className={`relative inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${card.gradient} shadow-lg mb-6 transition-transform group-hover:scale-110 duration-300`}>
                  <card.icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{card.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">{card.desc}</p>
                <ul className="space-y-3">
                  {card.points.map((pt) => (
                    <li key={pt} className="flex items-start gap-3 text-sm">
                      <CheckCircle className={`h-4 w-4 mt-0.5 shrink-0 ${card.textColor}`} />
                      <span className="text-slate-700 dark:text-slate-300">{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
