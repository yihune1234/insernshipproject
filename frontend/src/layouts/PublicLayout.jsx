import { useState, useEffect } from 'react';
import { Link, NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  ShieldCheck, Menu, X, Globe, Link2, Code2, Mail, Phone, MapPin,
} from 'lucide-react';
import useAuthStore from '../store/authStore';

const navLinks = [
  { to: '/', label: 'Home', exact: true },
  { to: '/about', label: 'About' },
  { to: '/how-it-works', label: 'How It Works' },
  { to: '/verify', label: 'Credential Verification' },
  { to: '/contact', label: 'Contact' },
];

const footerSections = [
  {
    title: 'Platform',
    links: [
      { label: 'Home', to: '/' },
      { label: 'About', to: '/about' },
      { label: 'Verification', to: '/verify' },
      { label: 'Contact', to: '/contact' },
    ],
  },
  {
    title: 'Solutions',
    links: [
      { label: 'Organizations', to: '/about#issuers' },
      { label: 'Credential Holders', to: '/about#holders' },
      { label: 'Verifiers', to: '/about#verifiers' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Documentation', to: '/documentation' },
      { label: 'FAQs', to: '/documentation#faq' },
      { label: 'Support', to: '/contact' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', to: '/privacy' },
      { label: 'Terms of Service', to: '/terms' },
    ],
  },
];

export default function PublicLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { isAuthenticated, getDashboard } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-md border-b border-slate-200 dark:border-slate-800'
            : 'bg-white/90 dark:bg-slate-900/90 backdrop-blur border-b border-slate-200/60 dark:border-slate-800/60'
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 shadow-sm group-hover:bg-blue-700 transition-colors">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <span className="text-base font-bold text-slate-900 dark:text-white leading-none">CredWallet</span>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-none mt-0.5 tracking-wide uppercase">Digital Credentials</p>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 lg:flex">
            {navLinks.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.exact}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden items-center gap-2 lg:flex">
            {isAuthenticated ? (
              <button
                onClick={() => navigate(getDashboard())}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
              >
                Dashboard
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className="rounded-md px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Login
                </button>
                <button
                  onClick={() => navigate('/register/organization')}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
                >
                  Get Started
                </button>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="lg:hidden rounded-md p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-4 space-y-1 lg:hidden animate-in slide-in-from-top-2 duration-200">
            {navLinks.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.exact}
                className={({ isActive }) =>
                  `block rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
              {isAuthenticated ? (
                <button
                  onClick={() => navigate(getDashboard())}
                  className="w-full rounded-md bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                >
                  Dashboard
                </button>
              ) : (
                <>
                  <button
                    onClick={() => navigate('/login')}
                    className="w-full rounded-md border border-slate-200 dark:border-slate-700 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => navigate('/register/organization')}
                    className="w-full rounded-md bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                  >
                    Get Started
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          {/* Top grid */}
          <div className="grid grid-cols-2 gap-8 py-14 md:grid-cols-6">
            {/* Brand column */}
            <div className="col-span-2">
              <Link to="/" className="flex items-center gap-2.5 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600">
                  <ShieldCheck className="h-5 w-5 text-white" />
                </div>
                <span className="text-base font-bold text-white">CredWallet</span>
              </Link>
              <p className="text-sm text-slate-400 leading-relaxed mb-6 max-w-xs">
                A trusted Digital Credential Ecosystem for organizations, professionals, and institutions worldwide.
              </p>
              <div className="space-y-2 text-sm text-slate-400">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-slate-500 shrink-0" />
                  <span>support@credwallet.io</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-slate-500 shrink-0" />
                  <span>+1 (800) CRED-WALLET</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-slate-500 shrink-0" />
                  <span>123 Trust Street, Digital City</span>
                </div>
              </div>
            </div>

            {/* Link sections */}
            {footerSections.map((section) => (
              <div key={section.title}>
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">{section.title}</h3>
                <ul className="space-y-2.5">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        to={link.to}
                        className="text-sm text-slate-400 hover:text-white transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div className="border-t border-slate-800 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-500">
              &copy; 2026 Digital Credential Platform. All Rights Reserved.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" aria-label="Twitter" className="text-slate-500 hover:text-white transition-colors">
                <Globe className="h-5 w-5" />
              </a>
              <a href="#" aria-label="LinkedIn" className="text-slate-500 hover:text-white transition-colors">
                <Link2 className="h-5 w-5" />
              </a>
              <a href="#" aria-label="GitHub" className="text-slate-500 hover:text-white transition-colors">
                <Code2 className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
