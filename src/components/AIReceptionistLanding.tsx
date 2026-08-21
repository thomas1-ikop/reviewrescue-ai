import React, { useState } from 'react';
import {
  Phone,
  Calendar,
  MessageCircle,
  Clock,
  CheckCircle,
  Zap,
  Shield,
  Users,
  ArrowRight,
  Play,
  X,
  Menu,
  ChevronDown,
  Briefcase,
  Headphones,
  Smartphone,
  Globe,
  Mail,
  MapPin,
  Award,
  ShieldAlert,
  Star
} from 'lucide-react';
import Logo from './Logo';

export default function AIReceptionistLanding() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  const CALENDLY_URL = 'https://calendly.com/rewakely/ai-receptionist';

  return (
    <div className="min-h-screen bg-white">
      
      {/* ─── NAVBAR ─── */}
      <nav className="max-w-7xl w-full mx-auto px-6 py-5 flex items-center justify-between border-b border-slate-150">
        <button onClick={() => window.location.href = '/'} className="hover:opacity-80 transition-opacity">
          <Logo />
        </button>

        <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
  <button 
    onClick={() => {
      const el = document.getElementById('features');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }}
    className="hover:text-slate-900 transition cursor-pointer"
  >
    Features
  </button>
  <button 
    onClick={() => {
      const el = document.getElementById('pricing');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }}
    className="hover:text-slate-900 transition cursor-pointer"
  >
    Pricing
  </button>
  <button 
    onClick={() => {
      const el = document.getElementById('demo');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }}
    className="hover:text-slate-900 transition cursor-pointer"
  >
    Demo
  </button>
  <button 
    onClick={() => window.location.href = '/'}
    className="hover:text-slate-900 transition text-xs text-slate-400"
  >
    ← Back to Rewakely
  </button>
  <a
    href={CALENDLY_URL}
    target="_blank"
    rel="noopener noreferrer"
    className="rounded-xl bg-slate-800 hover:bg-slate-900 text-white px-4.5 py-2 transition shadow-sm"
  >
    Book a Demo
  </a>
</div>

        <button className="md:hidden text-slate-700" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {isMenuOpen && (
  <div className="md:hidden bg-slate-50 border-b border-slate-200 px-6 py-4 flex flex-col gap-4 text-sm font-bold text-slate-600">
    <button 
      onClick={() => {
        setIsMenuOpen(false);
        const el = document.getElementById('features');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }}
      className="text-left hover:text-slate-900 transition cursor-pointer"
    >
      Features
    </button>
    <button 
      onClick={() => {
        setIsMenuOpen(false);
        const el = document.getElementById('pricing');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }}
      className="text-left hover:text-slate-900 transition cursor-pointer"
    >
      Pricing
    </button>
    <button 
      onClick={() => {
        setIsMenuOpen(false);
        const el = document.getElementById('demo');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }}
      className="text-left hover:text-slate-900 transition cursor-pointer"
    >
      Demo
    </button>
    <button onClick={() => { setIsMenuOpen(false); window.location.href = '/'; }} className="text-left text-slate-400 text-xs">
      ← Back to Rewakely
    </button>
    <a
      href={CALENDLY_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="rounded-xl bg-slate-800 text-white py-2.5 text-center px-4"
    >
      Book a Demo
    </a>
  </div>
)}

      {/* ─── HERO SECTION ─── */}
      <header className="relative max-w-5xl w-full mx-auto px-6 pt-16 pb-20 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 backdrop-blur-sm px-3 py-1.5 text-xs font-semibold text-blue-600 border border-blue-200/50 relative z-10">
          <Phone size={14} className="animate-pulse text-blue-500" />
          AI Receptionist — 24/7/365
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.08] max-w-4xl mx-auto mt-4 relative z-10">
          Never Miss a
          <span className="text-blue-600 relative"> Customer Call</span>
          <span className="text-blue-600 relative"> Again</span>
        </h1>

        <p className="text-md md:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed mt-4 relative z-10">
          AI receptionist that answers calls 24/7, books appointments, and forwards urgent calls — all for a fraction of the cost of a human.
        </p>

        <div className="flex items-center justify-center gap-3 mt-4 relative z-10">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-sm font-medium text-slate-600">
            <span className="font-extrabold text-emerald-600">24/7</span> call answering
          </span>
        </div>

        <div className="pt-6 flex flex-col items-center gap-4 relative z-10">
          <a
            href={CALENDLY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-8 py-4 shadow-xl shadow-blue-600/25 flex items-center justify-center gap-2 group transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Book a Demo
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </a>
          
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500">
            <span className="hover:text-slate-700 transition">$500 setup</span>
            <span className="text-slate-300">·</span>
            <span className="hover:text-slate-700 transition font-semibold text-slate-700">$350/month</span>
            <span className="text-slate-300">·</span>
            <span className="text-slate-400">Cancel anytime</span>
          </div>
          
          <p className="text-xs text-slate-400 mt-1">
            No contract. No credit card needed for demo.
          </p>
        </div>
      </header>

      {/* ─── PHONE UI MOCKUP ─── */}
      <div className="max-w-5xl mx-auto px-6 -mt-8 mb-16">
        <div className="bg-slate-900 rounded-3xl p-6 max-w-sm mx-auto shadow-2xl border border-slate-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-full bg-emerald-500 flex items-center justify-center">
              <Phone size={18} className="text-white" />
            </div>
            <div>
              <div className="text-white font-bold text-sm">AI Receptionist</div>
              <div className="text-emerald-400 text-xs flex items-center gap-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                Online • Taking calls
              </div>
            </div>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                <Users size={14} className="text-indigo-400" />
              </div>
              <div>
                <div className="text-white text-sm font-medium">John D.</div>
                <div className="text-slate-400 text-xs">"Hi, I need a plumber, my pipe burst"</div>
                <div className="text-emerald-400 text-xs mt-1 flex items-center gap-1">
                  <CheckCircle size={10} /> Appointment booked
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <Phone size={14} className="text-amber-400" />
              </div>
              <div>
                <div className="text-white text-sm font-medium">Sarah M.</div>
                <div className="text-slate-400 text-xs">"Is my order ready for pickup?"</div>
                <div className="text-emerald-400 text-xs mt-1 flex items-center gap-1">
                  <CheckCircle size={10} /> Answered
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-between items-center text-slate-400 text-xs">
            <span>📞 14 calls today</span>
            <span className="text-emerald-400 font-bold">✅ 0 missed</span>
          </div>
        </div>
      </div>

      {/* ─── FEATURES ─── */}
      <section id="features" className="relative py-20 px-6">
        <div className="max-w-6xl w-full mx-auto relative z-10">
          <div className="text-center space-y-3 mb-16">
            <span className="text-xs font-extrabold text-blue-500 uppercase tracking-widest block">Features</span>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">What Our AI Receptionist Does</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'Answer 100% of Calls',
                desc: 'Never miss a customer call again — even at 3 AM on a Sunday.',
                icon: <Phone className="text-blue-500 h-6 w-6" />,
              },
              {
                title: 'Book Appointments',
                desc: 'Automatically schedules jobs, meetings, and consultations.',
                icon: <Calendar className="text-blue-500 h-6 w-6" />,
              },
              {
                title: 'Smart Call Forwarding',
                desc: 'Urgent calls go straight to your phone — you choose when.',
                icon: <Clock className="text-blue-500 h-6 w-6" />,
              },
              {
                title: 'Custom Scripts',
                desc: 'Tailored to your business — sounds just like your brand.',
                icon: <MessageCircle className="text-blue-500 h-6 w-6" />,
              },
              {
                title: 'No Missed Leads',
                desc: 'Every call is logged and sent to you via SMS or email.',
                icon: <Shield className="text-blue-500 h-6 w-6" />,
              },
              {
                title: 'Easy Setup',
                desc: 'We handle everything — you just start getting calls.',
                icon: <Zap className="text-blue-500 h-6 w-6" />,
              },
            ].map((feat, i) => (
              <div key={i} className="p-8 rounded-2xl bg-white/80 backdrop-blur-sm border border-slate-150 shadow-sm transition hover:shadow-md hover:-translate-y-1">
                <div className="rounded-xl bg-blue-50 p-2.5 w-max mb-6">
                  {feat.icon}
                </div>
                <h3 className="font-bold text-slate-900 text-lg leading-tight mb-2">{feat.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed font-sans">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section id="pricing" className="relative py-20 px-6">
        <div className="max-w-6xl w-full mx-auto relative z-10">
          <div className="text-center space-y-3 mb-16">
            <span className="text-xs font-extrabold text-blue-500 uppercase tracking-widest block">Pricing</span>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Simple, Transparent Pricing</h2>
            <p className="text-sm text-slate-500 max-w-xl mx-auto font-sans">
              One-time setup. Affordable monthly. Cancel anytime.
            </p>
          </div>

          <div className="max-w-lg mx-auto">
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm hover:shadow-md transition relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                Most Popular
              </div>
              <div className="text-center mb-6">
                <div className="text-4xl font-black text-slate-900">$500</div>
                <div className="text-sm text-slate-400">one-time setup</div>
                <div className="text-2xl font-black text-slate-900 mt-4">$350<span className="text-base font-normal text-slate-400">/month</span></div>
                <div className="text-sm text-slate-400">billed monthly</div>
              </div>

              <ul className="space-y-3 mb-6">
                {[
                  '24/7 AI call answering',
                  'Appointment booking',
                  'Custom business scripts',
                  'Call logging & reporting',
                  'Smart call forwarding',
                  'No contract — cancel anytime'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-slate-600">
                    <CheckCircle size={18} className="text-emerald-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>

              <a
                href={CALENDLY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm py-3.5 transition shadow-sm block text-center"
              >
                Book a Demo
              </a>
              <p className="text-center text-xs text-slate-400 mt-3">
                Start with a free demo. No commitment.
              </p>
            </div>
          </div>

          <div className="text-center mt-8">
            <p className="text-sm text-slate-400">
              💡 Save up to 90% compared to a human receptionist
            </p>
          </div>
        </div>
      </section>

      {/* ─── HONEST FOUNDER STATEMENT ─── */}
      <section className="relative py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl border border-blue-200/50 shadow-lg p-8 md:p-12 text-center relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10">
              <div className="flex justify-center mb-5">
                <div className="p-3 bg-blue-50 rounded-full border border-blue-100">
                  <Phone className="h-6 w-6 text-blue-600" />
                </div>
              </div>

              <h3 className="text-xl md:text-2xl font-bold text-slate-900 leading-relaxed max-w-3xl mx-auto">
                "Small business owners lose <span className="text-blue-600">thousands of dollars</span> every year from missed calls. I built this AI receptionist so you never have to worry about that again."
              </h3>

              <p className="mt-6 text-lg font-semibold text-slate-700">
                — Thomas, Founder of Rewakely
              </p>

              <p className="mt-4 text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                Every call answered. Every lead captured. 24/7. No breaks, no sick days.
                <span className="block mt-1 font-medium text-blue-600">Book a free demo and see it in action.</span>
              </p>
              
              <div className="mt-6">
                <a
                  href={CALENDLY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-800 transition border-b-2 border-blue-200 hover:border-blue-600 pb-0.5"
                >
                  Book your free demo now ☕
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA SECTION ─── */}
      <section id="demo" className="py-20 px-6 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-black text-white">
            Ready to Never Miss a Call Again?
          </h2>
          <p className="text-blue-100 text-lg mt-4 max-w-lg mx-auto">
            Book a free demo. No obligation. See how it works.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <a
              href={CALENDLY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white hover:bg-slate-50 text-blue-600 px-8 py-3.5 rounded-xl font-bold text-sm transition shadow-lg shadow-blue-700/30"
            >
              Book a Demo Now
            </a>
            <a
              href="tel:+12292968166"
              className="border-2 border-white/30 hover:border-white/60 text-white px-8 py-3.5 rounded-xl font-bold text-sm transition"
            >
              Call Us: +1 (229) 296-8166
            </a>
          </div>
          <p className="text-blue-200 text-sm mt-6">
            💡 $500 setup • $350/month • Cancel anytime
          </p>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-slate-150 bg-slate-50 py-10 px-6">
        <div className="max-w-6xl w-full mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-sans text-slate-400">
          <Logo size="sm" />
          <div className="flex gap-6">
            <button onClick={() => window.location.href = '/privacy'} className="hover:text-slate-900 transition">Privacy Policy</button>
            <button onClick={() => window.location.href = '/terms'} className="hover:text-slate-900 transition">Terms of Service</button>
            <button onClick={() => window.location.href = '/cookie-policy'} className="hover:text-slate-900 transition">Cookie Policy</button>
            <button onClick={() => window.location.href = '/about'} className="hover:text-slate-900 transition">About</button>
            <button onClick={() => window.location.href = '/'} className="hover:text-slate-900 transition text-indigo-600 font-bold">← Rewakely Reviews</button>
          </div>
          <span>&copy; 2026 Rewakely. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}