import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import ScrollReveal from './ScrollReveal';
import FloatingShape from './FloatingShape';

export default function CTASection() {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden py-20 lg:py-28 px-4">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-600" />
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '30px 30px' }}
      />
      <FloatingShape className="top-0 right-0 w-72 h-72 bg-white opacity-10" />
      <FloatingShape className="bottom-0 left-0 w-96 h-96 bg-cyan-400 opacity-10" />

      <div className="relative mx-auto max-w-3xl text-center">
        <ScrollReveal>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold text-white uppercase tracking-wider mb-6 backdrop-blur-sm border border-white/20">
            <Sparkles className="h-3.5 w-3.5" /> Get Started Today
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
            Ready to Issue Trusted Credentials?
          </h2>
          <p className="text-blue-100 text-lg mb-10 max-w-lg mx-auto leading-relaxed">
            Join organizations worldwide using CredWallet to issue, manage, and verify digital credentials.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/register/organization')}
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 text-sm font-semibold text-blue-700 shadow-lg shadow-blue-900/30 hover:bg-blue-50 transition-all hover:-translate-y-0.5"
            >
              Register Your Organization <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
            <button
              onClick={() => navigate('/register')}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 hover:bg-white/20 px-8 py-4 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              Create Holder Account
            </button>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
