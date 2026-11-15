import React from 'react';
import { Link } from 'react-router-dom';
import { HeartPulse, ArrowLeft, ShieldCheck, Lock, CheckCircle2 } from 'lucide-react';

export const AuthLayout = ({
  title,
  subtitle,
  children,
  badgeText = 'Secure Healthcare Portal',
}) => {
  return (
    <div className="min-h-screen bg-warm-50 flex flex-col justify-between selection:bg-primary-500 selection:text-white">
      {/* Top Bar with Back Link */}
      <header className="px-4 sm:px-8 py-5 flex items-center justify-between max-w-7xl w-full mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-primary-800 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Back to Home</span>
        </Link>

        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>HIPAA & Encrypted Session</span>
        </div>
      </header>

      {/* Main Authentication Grid */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-5xl bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* Left / Top Form Area */}
          <div className="p-6 sm:p-10 lg:p-12 lg:col-span-7 flex flex-col justify-center">
            {/* Brand Logo */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-primary-700 text-white flex items-center justify-center shadow-md shadow-primary-700/20">
                <HeartPulse className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xl font-extrabold tracking-tight text-slate-900">SeniSync</span>
                <span className="block text-[11px] font-bold text-primary-700 uppercase tracking-widest">
                  Connected Care, Simplified
                </span>
              </div>
            </div>

            {/* Header Content */}
            <div className="mb-6">
              <span className="inline-block text-xs font-bold text-primary-800 uppercase tracking-wider bg-primary-50 px-2.5 py-1 rounded-lg border border-primary-200/80 mb-2">
                {badgeText}
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {title}
              </h1>
              {subtitle && (
                <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
                  {subtitle}
                </p>
              )}
            </div>

            {/* Form Slot */}
            {children}
          </div>

          {/* Right Reassurance Panel (Visible on Desktop) */}
          <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-primary-800 via-primary-900 to-slate-900 p-10 text-white flex-col justify-between relative overflow-hidden">
            <div className="relative z-10 space-y-6">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                <Lock className="w-6 h-6 text-emerald-300" />
              </div>

              <div>
                <h3 className="text-2xl font-bold tracking-tight text-white mb-2">
                  Connected Care, Simplified.
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Join thousands of families, doctors, and seniors managing daily medications and emergency care on one intelligent platform.
                </p>
              </div>

              <div className="space-y-3 pt-4 border-t border-white/10">
                {[
                  'Zero confusing interfaces for seniors',
                  'Instant push & SMS notifications on missed doses',
                  'HIPAA-conscious data encryption',
                  'One-touch SOS emergency escalation tree',
                ].map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 text-xs text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Senior Quote / Trust Card */}
            <div className="relative z-10 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 mt-8">
              <p className="text-xs text-slate-200 italic leading-relaxed">
                "SeniSync gives me back my independence. The big buttons make my pills impossible to mix up, and my daughter never has to worry."
              </p>
              <div className="flex items-center gap-2.5 mt-3">
                <div className="w-7 h-7 rounded-full bg-emerald-400 text-slate-950 font-bold flex items-center justify-center text-xs">
                  EV
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Eleanor Vance, 81</p>
                  <p className="text-[10px] text-slate-300">Oakridge Senior Resident</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-500">
        SeniSync Platform • Medical Grade Encryption • Respecting Senior Privacy & Autonomy
      </footer>
    </div>
  );
};

export default AuthLayout;
