import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck, ArrowRight, Building2, User, ScanLine,
  Shield, QrCode, ChevronRight, Sparkles,
} from 'lucide-react';
import ScrollReveal from './ScrollReveal';
import FloatingShape from './FloatingShape';

export default function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}
      />
      <FloatingShape className="top-20 left-0 w-96 h-96 bg-blue-500" />
      <FloatingShape className="bottom-0 right-0 w-[30rem] h-[30rem] bg-indigo-500" />
      <FloatingShape className="top-1/2 right-1/3 w-64 h-64 bg-cyan-500" />

      <div className="relative mx-auto max-w-7xl px-4 lg:px-8 py-16 md:py-24 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-4 py-1.5 text-xs font-medium text-blue-300 mb-6 backdrop-blur-sm animate-in fade-in duration-700">
              <Sparkles className="h-3.5 w-3.5" />
              W3C Verifiable Credentials &middot; Decentralized Identity
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-white mb-6 animate-in slide-in-from-bottom-2 duration-700">
              Trusted Digital Credentials for{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400">
                Organizations & Professionals
              </span>
            </h1>

            <p className="text-lg md:text-xl text-slate-300 mb-10 leading-relaxed animate-in slide-in-from-bottom-2 duration-700 delay-100">
              Issue, manage, share, and verify secure digital credentials across trusted organizations
              through a decentralized credential ecosystem.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 animate-in slide-in-from-bottom-2 duration-700 delay-200">
              <button
                onClick={() => navigate('/register/organization')}
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-cyan-500 px-8 py-4 text-sm font-semibold text-white shadow-lg shadow-blue-900/40 transition-all hover:shadow-blue-700/50 hover:-translate-y-0.5"
              >
                Get Started <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
              <button
                onClick={() => navigate('/verify')}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 px-8 py-4 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-white/10"
              >
                <ShieldCheck className="h-4 w-4" />
                Verify Credential
              </button>
            </div>

            <div className="mt-12 flex items-center gap-8 text-sm text-slate-400 animate-in slide-in-from-bottom-2 duration-700 delay-300">
              <div>
                <span className="block text-2xl font-bold text-white">10K+</span>
                Credentials Issued
              </div>
              <div className="w-px h-10 bg-slate-700" />
              <div>
                <span className="block text-2xl font-bold text-white">500+</span>
                Organizations
              </div>
              <div className="w-px h-10 bg-slate-700" />
              <div>
                <span className="block text-2xl font-bold text-white">99.9%</span>
                Verification Rate
              </div>
            </div>
          </div>

          <div className="relative animate-in fade-in duration-1000 delay-300">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-blue-900/40 border border-blue-500/20">
              <img
                src="/image.png"
                alt="Digital Credential Platform"
                className="w-full h-auto object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
            </div>

            <div className="absolute -bottom-4 -left-4 bg-white dark:bg-slate-800 rounded-xl shadow-xl p-3 flex items-center gap-3 animate-in slide-in-from-bottom-2 duration-700 delay-500 border border-slate-200 dark:border-slate-700">
              <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                <Shield className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Verified</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Credential</p>
              </div>
            </div>

            <div className="absolute -top-4 -right-4 bg-white dark:bg-slate-800 rounded-xl shadow-xl p-3 flex items-center gap-3 animate-in slide-in-from-bottom-2 duration-700 delay-700 border border-slate-200 dark:border-slate-700">
              <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                <QrCode className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Scan to</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Verify</p>
              </div>
            </div>
          </div>
        </div>

        <ScrollReveal className="mt-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              { label: 'Organization', sub: 'Issuer', icon: Building2, gradient: 'from-blue-600 to-blue-700' },
              { label: 'Credential Issuance', sub: 'Signed VC', icon: ShieldCheck, gradient: 'from-cyan-600 to-cyan-700' },
              { label: 'Digital Wallet', sub: 'Holder', icon: User, gradient: 'from-emerald-600 to-emerald-700' },
              { label: 'Verification', sub: 'Verifier', icon: ScanLine, gradient: 'from-violet-600 to-violet-700' },
            ].map((item, i) => (
              <div key={item.label} className="relative flex flex-col items-center group">
                {i > 0 && (
                  <div className="absolute left-0 top-5 -translate-x-1/2 hidden md:block">
                    <ChevronRight className="h-4 w-4 text-blue-400/60" />
                  </div>
                )}
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${item.gradient} shadow-lg shadow-${item.gradient.split(' ')[0].replace('from-', '')}/30 mb-3 transition-transform group-hover:scale-110 group-hover:rotate-3 duration-300`}>
                  <item.icon className="h-6 w-6 text-white" />
                </div>
                <span className="text-sm font-semibold text-white text-center">{item.label}</span>
                <span className="text-xs text-slate-400 mt-0.5">{item.sub}</span>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
