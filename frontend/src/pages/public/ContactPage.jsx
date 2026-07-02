import { useState } from 'react';
import { Mail, Phone, MapPin, Send, MessageSquare, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const contactInfo = [
  {
    icon: Mail,
    label: 'Email',
    value: 'support@credwallet.io',
    sub: 'We respond within 24 hours',
    href: 'mailto:support@credwallet.io',
  },
  {
    icon: Phone,
    label: 'Phone',
    value: '+1 (800) CRED-WALLET',
    sub: 'Mon–Fri, 9am–6pm EST',
    href: 'tel:+18002733925528',
  },
  {
    icon: MapPin,
    label: 'Address',
    value: '123 Trust Street, Digital City, DC 00001',
    sub: 'Headquarters',
    href: null,
  },
  {
    icon: Clock,
    label: 'Support Hours',
    value: 'Monday – Friday',
    sub: '9:00 AM – 6:00 PM EST',
    href: null,
  },
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    toast.success('Message sent! We will get back to you shortly.');
    setForm({ name: '', email: '', subject: '', message: '' });
    setLoading(false);
  };

  return (
    <div className="bg-white dark:bg-slate-950">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <section className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-16 px-4">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-block rounded-full bg-blue-100 dark:bg-blue-900/40 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider mb-5">
            Get in Touch
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">Contact Us</h1>
          <p className="text-lg text-slate-500 dark:text-slate-400">
            Have a question about integration, credentials, or the platform? We're here to help.
          </p>
        </div>
      </section>

      {/* ── Content ────────────────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="mx-auto max-w-6xl grid md:grid-cols-5 gap-12">
          {/* Left: contact info */}
          <div className="md:col-span-2 space-y-5">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Contact Information</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Reach us through any of the channels below or fill in the form and our team will be in touch.
              </p>
            </div>

            {contactInfo.map((item) => (
              <div
                key={item.label}
                className="flex items-start gap-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/30">
                  <item.icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-0.5">{item.label}</p>
                  {item.href ? (
                    <a href={item.href} className="text-sm font-medium text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      {item.value}
                    </a>
                  ) : (
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{item.value}</p>
                  )}
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{item.sub}</p>
                </div>
              </div>
            ))}

            <div className="rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50 dark:bg-blue-900/20 p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">Enterprise Inquiries</p>
              </div>
              <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
                For enterprise integration, API access, or bulk licensing, please include your organization name and intended use case.
              </p>
            </div>
          </div>

          {/* Right: form */}
          <div className="md:col-span-3">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Send a Message</h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Full Name</label>
                    <input
                      required
                      value={form.name}
                      onChange={set('name')}
                      placeholder="Jane Smith"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email Address</label>
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={set('email')}
                      placeholder="jane@organization.org"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Subject</label>
                  <input
                    required
                    value={form.subject}
                    onChange={set('subject')}
                    placeholder="How can we help?"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Message</label>
                  <textarea
                    required
                    rows={5}
                    value={form.message}
                    onChange={set('message')}
                    placeholder="Tell us about your inquiry, integration needs, or any questions you have…"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-shadow"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 px-6 py-3 text-sm font-semibold text-white transition-colors shadow-sm"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Sending…
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" /> Send Message
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
