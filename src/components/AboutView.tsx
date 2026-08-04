// src/components/AboutView.tsx
import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Sparkles, Phone, Users, Code, CheckCircle, ArrowRight } from 'lucide-react';
import Logo from './Logo';

interface AboutViewProps {
  setCurrentRoute: (route: string) => void;
}

export default function AboutView({ setCurrentRoute }: AboutViewProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* ─── HEADER ──────────────────────────────────────────── */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={() => setCurrentRoute('landing')} className="hover:opacity-80 transition">
            <Logo size="sm" />
          </button>
          <button
            onClick={() => setCurrentRoute('landing')}
            className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition"
          >
            <ArrowLeft size={16} />
            Back to Home
          </button>
        </div>
      </header>

      {/* ─── MAIN CONTENT ────────────────────────────────────── */}
      <main className="max-w-4xl mx-auto px-6 py-12 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-12"
        >
          {/* Hero */}
          <div className="space-y-4 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 text-blue-600 text-xs font-bold border border-blue-200/50">
              <Sparkles size={14} /> Building in Public
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              I called plumbers until my ears hurt. 
              <br />
              <span className="text-blue-600">Nobody had time to reply to reviews.</span>
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              So I taught myself to code and built a tool that does it in 2 seconds.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="text-center p-3">
              <p className="text-3xl font-black text-blue-600">900+</p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cold Calls Made</p>
            </div>
            <div className="text-center p-3 border-y md:border-y-0 md:border-x border-slate-100">
              <p className="text-3xl font-black text-blue-600">200+</p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Conversations</p>
            </div>
            <div className="text-center p-3">
              <p className="text-3xl font-black text-blue-600">100+</p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Emails Sent</p>
            </div>
          </div>

          {/* The Full Story */}
          <div className="space-y-6 bg-white rounded-2xl border border-slate-200 p-8 md:p-10 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900">Why I built this</h2>
            
            <div className="space-y-4 text-slate-600 leading-relaxed text-sm md:text-base">
              <p>
                I'm <strong className="text-slate-800">Thomas</strong>. I live in Atlanta.
              </p>
              <p>
                I noticed something weird. Local businesses like plumbers, roofers, and landscapers were losing calls because they had 3.2 stars on Google, while their competitors had 4.5+. 
              </p>
              <p>
                But when I called them to ask about it? They were literally <em>on a roof</em> or under a sink. They don't have time to reply to reviews, and they don't have a system to ask happy customers for reviews.
              </p>
              <p className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-slate-700 italic">
                "I don't have time for that." — Every business owner I spoke to.
              </p>
              <p>
                So I taught myself <strong className="text-slate-800">React, TypeScript, Express, and Supabase</strong>. I built a full-stack SaaS that replies to reviews automatically, sends SMS invites, and auto-replies to positive Google reviews.
              </p>
              <p className="font-medium text-slate-800">
                It's not perfect. I'm still starting off. But it works.
              </p>
            </div>
          </div>

          {/* Tech Stack (Anti-Slop Proof) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-wider mb-4">Built with real code</h3>
            <div className="flex flex-wrap gap-3">
              {['React', 'TypeScript', 'Express.js', 'Supabase', 'Stripe', 'Gemini AI', 'Tailwind CSS', 'Resend'].map((tech) => (
                <span key={tech} className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-mono font-bold rounded-lg border border-slate-200">
                  {tech}
                </span>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-4">
              Not an AI wrapper. Not a template. I built this from scratch.
            </p>
          </div>

          {/* Call to Action */}
          <div className="text-center space-y-4 bg-blue-50/50 border border-blue-100 rounded-2xl p-8">
            <h3 className="text-xl font-bold text-slate-900">Want to get more 5-star reviews?</h3>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              If you run a local service business and hate replying to reviews, I'd love to show you what I built. 
              Free audit. No pressure. Just honest feedback.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a 
                href="https://calendly.com/rewakely/15min" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold transition shadow-sm"
              >
                Book a free chat <ArrowRight size={16} />
              </a>
              <button
                onClick={() => setCurrentRoute('landing')}
                className="inline-flex items-center gap-2 px-6 py-3 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-bold transition"
              >
                See the product
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-8 border-t border-slate-200 text-center text-xs text-slate-400">
            © 2026 Rewakely. Built by Thomas.
          </div>
        </motion.div>
      </main>
    </div>
  );
}