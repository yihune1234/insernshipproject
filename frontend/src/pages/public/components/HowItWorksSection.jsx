import { Sparkles } from 'lucide-react';
import ScrollReveal from './ScrollReveal';

const journeySteps = [
  { num: '01', title: 'Organization Verifies Member', desc: 'The issuing organization verifies the identity of the credential recipient.' },
  { num: '02', title: 'Credential Is Issued', desc: 'A cryptographically signed credential is generated and sent to the holder.' },
  { num: '03', title: 'Holder Receives Credential', desc: 'The holder stores the credential securely in their digital wallet.' },
  { num: '04', title: 'Credential Is Shared', desc: 'The holder presents the credential via QR code or secure sharing link.' },
  { num: '05', title: 'Verifier Validates Authenticity', desc: 'The verifier checks signature, expiry, revocation status, and issuer trust instantly.' },
];

export default function HowItWorksSection() {
  return (
    <section className="py-20 lg:py-28 px-4 bg-white dark:bg-slate-950">
      <div className="mx-auto max-w-7xl">
        <ScrollReveal>
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 dark:bg-blue-900/40 px-4 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider mb-4">
              <Sparkles className="h-3.5 w-3.5" /> The Process
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              How It{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
                Works
              </span>
            </h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto text-lg">
              A clear, standards-based flow from issuance to verification — transparent at every step.
            </p>
          </div>
        </ScrollReveal>

        <div className="relative max-w-3xl mx-auto">
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-600 via-cyan-500 to-violet-600 hidden md:block" />
          <div className="space-y-6 md:pl-20">
            {journeySteps.map((step, i) => (
              <ScrollReveal key={step.num}>
                <div className="relative group">
                  <div className="absolute -left-[4.75rem] top-1/2 -translate-y-1/2 hidden md:flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-500 shadow-lg shadow-blue-500/30 ring-4 ring-white dark:ring-slate-950 transition-transform group-hover:scale-125 duration-300">
                    <div className="h-2.5 w-2.5 rounded-full bg-white" />
                  </div>
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-6 md:p-8 transition-all duration-300 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-lg hover:shadow-blue-500/5">
                    <div className="flex items-start gap-5">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 shadow-md">
                        <span className="text-base font-bold text-white">{step.num}</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1.5">{step.title}</h3>
                        <p className="text-slate-500 dark:text-slate-400 leading-relaxed">{step.desc}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
