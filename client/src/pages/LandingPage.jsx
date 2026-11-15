import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  HeartPulse,
  ShieldCheck,
  Pill,
  Users,
  Activity,
  Bell,
  CheckCircle2,
  PhoneCall,
  Clock,
  Sparkles,
  ArrowRight,
  Lock,
  ChevronRight,
  Eye,
  Smile,
  Heart,
  Stethoscope,
  Menu,
  X,
} from 'lucide-react';
import Button from '../components/common/Button.jsx';
import Card from '../components/common/Card.jsx';
import { mockElderlyProfile, mockMedications } from '../services/mockData.js';

export const LandingPage = () => {
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-warm-50 text-slate-800 flex flex-col selection:bg-primary-500 selection:text-white">
      {/* 1. Professional Navigation Bar */}
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-primary-700 text-white flex items-center justify-center shadow-md shadow-primary-700/20 group-hover:scale-105 transition-transform">
              <HeartPulse className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-slate-900 block leading-tight">
                SeniSync
              </span>
              <span className="text-[10px] font-bold text-primary-700 uppercase tracking-widest block">
                Connected Care, Simplified
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#features" className="hover:text-primary-800 transition-colors">
              Features
            </a>
            <a href="#ecosystem" className="hover:text-primary-800 transition-colors">
              Ecosystem
            </a>
            <a href="#how-it-works" className="hover:text-primary-800 transition-colors">
              How It Works
            </a>
            <a href="#benefits" className="hover:text-primary-800 transition-colors">
              Benefits
            </a>
            <a href="#security" className="hover:text-primary-800 transition-colors">
              Security & Privacy
            </a>
          </div>

          {/* Nav Actions */}
          <div className="hidden sm:flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link to="/register">
              <Button variant="primary" size="sm" icon={ArrowRight} iconPosition="right">
                Get Started Free
              </Button>
            </Link>
          </div>

          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setMobileNavOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          >
            {mobileNavOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Dropdown */}
        {mobileNavOpen && (
          <div className="md:hidden pt-4 pb-2 border-t border-slate-100 mt-3 space-y-3">
            <div className="flex flex-col space-y-2 text-sm font-semibold text-slate-700">
              <a
                href="#features"
                onClick={() => setMobileNavOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-slate-100"
              >
                Features
              </a>
              <a
                href="#ecosystem"
                onClick={() => setMobileNavOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-slate-100"
              >
                Healthcare Ecosystem
              </a>
              <a
                href="#how-it-works"
                onClick={() => setMobileNavOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-slate-100"
              >
                How It Works
              </a>
              <a
                href="#benefits"
                onClick={() => setMobileNavOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-slate-100"
              >
                Benefits
              </a>
              <a
                href="#security"
                onClick={() => setMobileNavOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-slate-100"
              >
                Security & Privacy
              </a>
            </div>
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <Link to="/login" onClick={() => setMobileNavOpen(false)}>
                <Button variant="outline" fullWidth size="md">
                  Sign In
                </Button>
              </Link>
              <Link to="/register" onClick={() => setMobileNavOpen(false)}>
                <Button variant="primary" fullWidth size="md">
                  Get Started Free
                </Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* 2. Hero Section */}
      <section className="relative pt-12 pb-20 px-4 sm:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Text Column */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-100 text-primary-900 text-xs font-bold border border-primary-200">
              <ShieldCheck className="w-4 h-4 text-primary-700" />
              <span>SeniSync – Intelligent Elderly Care & Medication Management</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.12]">
              Connected Care, Simplified.{' '}
              <span className="text-primary-700 block mt-1">
                Dignified Independence for Seniors.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              SeniSync is an intelligent, interconnected healthcare ecosystem that helps elderly individuals manage medications, appointments and daily wellness while enabling authorized family members and caregivers to collaborate through a secure shared-care platform.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
              <Link to="/register" className="w-full sm:w-auto">
                <Button
                  variant="primary"
                  size="lg"
                  icon={ArrowRight}
                  iconPosition="right"
                  className="w-full sm:w-auto text-base shadow-lg shadow-primary-700/25"
                >
                  Get Started with SeniSync
                </Button>
              </Link>
              <Link to="/login" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  icon={Eye}
                  className="w-full sm:w-auto text-base"
                >
                  Explore Live Demo
                </Button>
              </Link>
            </div>

            {/* Micro Trust Stats */}
            <div className="pt-6 border-t border-slate-200/80 grid grid-cols-3 gap-4 max-w-lg mx-auto lg:mx-0 text-left">
              <div>
                <p className="text-2xl font-black text-slate-900">99.4%</p>
                <p className="text-xs text-slate-500 font-medium">On-Time Adherence</p>
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900">&lt; 30s</p>
                <p className="text-xs text-slate-500 font-medium">SOS Push Escalation</p>
              </div>
              <div>
                <p className="text-2xl font-black text-primary-700">100%</p>
                <p className="text-xs text-slate-500 font-medium">HIPAA-Conscious</p>
              </div>
            </div>
          </div>

          {/* Right Hero Visual Card */}
          <div className="lg:col-span-5 relative">
            <div className="bg-white rounded-3xl border-2 border-slate-200/90 shadow-2xl p-6 sm:p-8 space-y-5 relative">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                    EV
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Grandma Eleanor (81)</h3>
                    <p className="text-xs text-slate-500">Live Bedside Device Feed</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  All Safe
                </span>
              </div>

              {/* Pill Alert Card */}
              <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-amber-900 uppercase tracking-wider">
                    Due at 12:30 PM (With Lunch)
                  </span>
                  <span className="text-xs font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded">
                    Due Now
                  </span>
                </div>
                <h4 className="text-lg font-black text-slate-900">Metformin 500mg</h4>
                <p className="text-xs text-slate-600">
                  White oval tablet • For blood sugar regulation
                </p>
                <div className="pt-2">
                  <div className="w-full bg-emerald-600 text-white font-bold text-sm py-2.5 rounded-xl text-center shadow-sm">
                    ✓ Senior Tapped: "TOOK THIS PILL"
                  </div>
                </div>
              </div>

              {/* Family Sync Ping */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary-700" />
                  <span className="text-slate-600">Sarah Vance (Daughter) notified:</span>
                </div>
                <span className="font-bold text-emerald-700">Instant Confirmed</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Healthcare Ecosystem Section */}
      <section id="ecosystem" className="py-20 px-4 sm:px-8 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto space-y-14">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-bold text-primary-700 uppercase tracking-widest bg-primary-50 px-3 py-1 rounded-full border border-primary-200">
              Interactive Healthcare Ecosystem
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              One Connected Circle, Zero Blind Spots
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              SeniSync links the essential pillars of senior healthcare into a continuous, synchronized loop of medication safety, daily wellness, and emergency readiness.
            </p>
          </div>

          {/* Visual Interactive Care Ecosystem Diagram */}
          <div className="bg-gradient-to-b from-slate-900 via-primary-950 to-slate-900 rounded-3xl p-6 sm:p-12 text-white border-2 border-primary-900 shadow-2xl relative overflow-hidden">
            <div className="relative z-10 max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                {/* Left Pillar: Family Member */}
                <div className="p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-center space-y-2 hover:bg-white/15 transition-all">
                  <div className="w-12 h-12 rounded-full bg-secondary-500 text-white flex items-center justify-center mx-auto shadow-md">
                    <Heart className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-white">Family Caregivers</h4>
                  <p className="text-xs text-secondary-200">
                    Real-time dose confirmations & immediate missed-dose alerts.
                  </p>
                  <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-secondary-400/20 text-secondary-300 border border-secondary-400/30">
                    Instant Push & SMS
                  </span>
                </div>

                {/* Center Hub: Resident Senior with Pulsing Ring */}
                <div className="p-8 rounded-3xl bg-white text-slate-900 text-center space-y-3 shadow-2xl border-4 border-primary-500 relative transform md:scale-105">
                  <div className="relative inline-block">
                    <img
                      src={mockElderlyProfile.avatar}
                      alt={mockElderlyProfile.name}
                      className="w-20 h-20 rounded-full object-cover border-4 border-primary-600 mx-auto"
                    />
                    <span className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white ring-4 ring-emerald-200 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary-700 bg-primary-100 px-2 py-0.5 rounded-full">
                      Central Resident
                    </span>
                    <h3 className="text-xl font-black text-slate-900 mt-1">
                      {mockElderlyProfile.preferredName}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Simplified 1-Touch Screen • Oakridge Residence
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-2 text-xs font-bold text-emerald-700">
                    <Pill className="w-4 h-4" />
                    <span>Lisinopril 10mg Taken (8:14 AM)</span>
                  </div>
                </div>

                {/* Right Pillar: Attending Geriatrician */}
                <div className="p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-center space-y-2 hover:bg-white/15 transition-all">
                  <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-md">
                    <Stethoscope className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-white">Attending Doctors</h4>
                  <p className="text-xs text-emerald-200">
                    Objective adherence charts & vital telemetry trends.
                  </p>
                  <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                    Clinical Chart Sync
                  </span>
                </div>
              </div>

              {/* Bottom Support Tier: Visiting Nurse & Emergency Dispatch */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 max-w-2xl mx-auto">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="text-left text-xs">
                    <p className="font-bold text-white">Visiting Home Nurse</p>
                    <p className="text-slate-300">Pill box refills & shift handoff reports.</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-rose-500 text-white flex items-center justify-center shrink-0">
                    <PhoneCall className="w-5 h-5" />
                  </div>
                  <div className="text-left text-xs">
                    <p className="font-bold text-white">Emergency Response</p>
                    <p className="text-rose-200">One-touch SOS routing with room & allergy notes.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Ecosystem Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-t-4 border-t-primary-600 p-6">
              <div className="w-12 h-12 rounded-2xl bg-primary-100 text-primary-800 flex items-center justify-center mb-4">
                <Smile className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">1. The Senior Resident</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Interacts with simplified high-contrast visual screens with large buttons, pill photographs, and one-tap emergency triggers.
              </p>
            </Card>

            <Card className="border-t-4 border-t-secondary-600 p-6">
              <div className="w-12 h-12 rounded-2xl bg-secondary-100 text-secondary-800 flex items-center justify-center mb-4">
                <Heart className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">2. Family Caregivers</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Receive real-time push and SMS confirmations when doses are taken, with automated alerts if a scheduled pill is missed.
              </p>
            </Card>

            <Card className="border-t-4 border-t-emerald-600 p-6">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-4">
                <Stethoscope className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">3. Attending Doctors</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Review objective timestamped adherence charts and biometric vital trends without relying on patient memory.
              </p>
            </Card>

            <Card className="border-t-4 border-t-amber-600 p-6">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center mb-4">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">4. Visiting Nurses & Aides</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Log home visits, verify pill box inventory refills, and coordinate shift handoffs with family members.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* 4. Feature Overview */}
      <section id="features" className="py-20 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto space-y-14">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-bold text-primary-700 uppercase tracking-widest bg-primary-50 px-3 py-1 rounded-full border border-primary-200">
              Platform Features
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Engineered for Simplicity and Reliability
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Every feature is built around the cognitive and physical accessibility needs of elderly individuals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-7 rounded-3xl border border-slate-200/90 shadow-card hover:shadow-card-hover transition-all space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-700 flex items-center justify-center">
                <Pill className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Visual Pill Identifier & Timing</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Schedules reflect real pill appearances (e.g. "Pink scored tablet") and meal relations (with lunch, before bed) rather than confusing medical codes.
              </p>
            </div>

            <div className="bg-white p-7 rounded-3xl border border-slate-200/90 shadow-card hover:shadow-card-hover transition-all space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-secondary-50 text-secondary-700 flex items-center justify-center">
                <Eye className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Dual Interface Adaptability</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Toggle effortlessly between a clean, multi-metric caregiver telemetry panel and a giant-button, high-contrast interface designed for seniors.
              </p>
            </div>

            <div className="bg-white p-7 rounded-3xl border border-slate-200/90 shadow-card hover:shadow-card-hover transition-all space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center">
                <PhoneCall className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">One-Touch Emergency SOS</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Emergency escalation tree rings the primary daughter first, gerontologist second, and local dispatch with resident room details and allergy alerts.
              </p>
            </div>

            <div className="bg-white p-7 rounded-3xl border border-slate-200/90 shadow-card hover:shadow-card-hover transition-all space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <Bell className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Automated Escalation Engine</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                If a scheduled dose isn't logged within 30 minutes, SeniSync automatically triggers a gentle voice reminder and alerts designated family members.
              </p>
            </div>

            <div className="bg-white p-7 rounded-3xl border border-slate-200/90 shadow-card hover:shadow-card-hover transition-all space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Daily Biometric Vitals Sync</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Track blood pressure, heart rate, fasting glucose, and hydration logs with easy-to-read color thresholds and doctor report exports.
              </p>
            </div>

            <div className="bg-white p-7 rounded-3xl border border-slate-200/90 shadow-card hover:shadow-card-hover transition-all space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-700 flex items-center justify-center">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">HIPAA-Conscious Encryption</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Resident health records and communication trees are protected with 256-bit AES encryption. Data is never shared or commercialized.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. How SeniSync Works */}
      <section id="how-it-works" className="py-20 px-4 sm:px-8 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto space-y-14">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-bold text-primary-700 uppercase tracking-widest bg-primary-50 px-3 py-1 rounded-full border border-primary-200">
              Simple 3-Step Setup
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Up and Running in Less Than 5 Minutes
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              No complicated manuals or expensive proprietary hardware required. Works on any tablet, computer, or smartphone.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="p-8 rounded-3xl bg-warm-50 border border-slate-200/80 space-y-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-primary-700 text-white font-extrabold text-xl flex items-center justify-center mx-auto shadow-md">
                1
              </div>
              <h3 className="text-xl font-bold text-slate-900">Create Circle & Prescriptions</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Add your elderly loved one, invite family members or nurses, and enter their daily prescription regimen.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-warm-50 border border-slate-200/80 space-y-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-primary-700 text-white font-extrabold text-xl flex items-center justify-center mx-auto shadow-md">
                2
              </div>
              <h3 className="text-xl font-bold text-slate-900">Senior Gets Gentle Prompts</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                The resident sees their simplified, distraction-free screen with current pills and taps "Yes, I Took This Pill".
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-warm-50 border border-slate-200/80 space-y-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-primary-700 text-white font-extrabold text-xl flex items-center justify-center mx-auto shadow-md">
                3
              </div>
              <h3 className="text-xl font-bold text-slate-900">Family Stays Fully Reassured</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Everyone in the care circle receives instant live updates. If a dose is missed, automated reminders escalate swiftly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Benefits Section */}
      <section id="benefits" className="py-20 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto space-y-14">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-bold text-primary-700 uppercase tracking-widest bg-primary-50 px-3 py-1 rounded-full border border-primary-200">
              Tangible Benefits
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Designed for Real People in Real Care Situations
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-3xl p-8 border border-slate-200/90 shadow-card space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-800 flex items-center justify-center">
                  <Smile className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">For Elderly Users</h3>
              </div>
              <ul className="space-y-3 text-sm text-slate-600">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Maintains daily autonomy without feeling micromanaged</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Extra-large touch targets and high-contrast colorways</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Instant voice contact with children and doctor</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-slate-200/90 shadow-card space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-secondary-100 text-secondary-800 flex items-center justify-center">
                  <Heart className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">For Family Members</h3>
              </div>
              <ul className="space-y-3 text-sm text-slate-600">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Ends the constant "Did you take your pills?" anxiety calls</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Real-time visibility even when living in another city</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Prescription refill notifications before supply runs out</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-slate-200/90 shadow-card space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">For Healthcare Providers</h3>
              </div>
              <ul className="space-y-3 text-sm text-slate-600">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Actionable adherence logs to verify treatment efficacy</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Early detection of missed doses and vital anomalies</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Streamlined communication with designated family proxies</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Privacy and Security Section */}
      <section id="security" className="py-16 px-4 sm:px-8 bg-white border-y border-slate-200/80">
        <div className="max-w-5xl mx-auto bg-slate-900 rounded-3xl p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-400/30">
              <Lock className="w-3.5 h-3.5" />
              <span>Medical-Grade Security Standards</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Your Family's Health Data is Strictly Protected
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              We know how sensitive medical data is. SeniSync applies zero-trust role-based access controls, automatic session invalidation, and end-to-end data encryption. Only authorized care network members can view resident logs.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-slate-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Encrypted at rest & in transit (TLS 1.3)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Zero advertising or third-party sharing</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Strict caregiver role authorization</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Full resident consent and audit logs</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Clear Call-To-Action (CTA) */}
      <section className="py-20 px-4 sm:px-8 text-center bg-warm-50">
        <div className="max-w-4xl mx-auto space-y-6">
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
            Give Your Loved One the Gift of Safe, Connected Care.
          </h2>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Join families who have eliminated medication stress. Set up your first SeniSync care network in under 5 minutes today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link to="/register" className="w-full sm:w-auto">
              <Button
                variant="primary"
                size="lg"
                icon={ArrowRight}
                iconPosition="right"
                className="w-full sm:w-auto text-base px-8 py-4 shadow-xl shadow-primary-700/25"
              >
                Create Free SeniSync Account
              </Button>
            </Link>
            <Link to="/login" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto text-base"
              >
                Sign In to Account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 9. Professional Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto pt-12 pb-8 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 pb-12 border-b border-slate-100">
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-primary-700 text-white flex items-center justify-center">
                <HeartPulse className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-lg text-slate-900">SeniSync</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              SeniSync – Intelligent Elderly Care & Medication Management Platform. Connected Care, Simplified.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Platform</h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li><a href="#features" className="hover:text-primary-800">Medication Schedules</a></li>
              <li><a href="#features" className="hover:text-primary-800">Elderly Friendly Screen</a></li>
              <li><a href="#features" className="hover:text-primary-800">Real-Time SMS Alerts</a></li>
              <li><a href="#features" className="hover:text-primary-800">Emergency Call Tree</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Authentication</h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li><Link to="/login" className="hover:text-primary-800">Resident / Family Sign In</Link></li>
              <li><Link to="/register" className="hover:text-primary-800">Register New Account</Link></li>
              <li><Link to="/forgot-password" className="hover:text-primary-800">Password Recovery</Link></li>
              <li><Link to="/verify-email" className="hover:text-primary-800">Email Verification</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Medical Disclaimer</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              SeniSync is a supportive coordination tool and does not provide direct medical diagnosis. For life-threatening emergencies, immediately dial 911.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} SeniSync Platform. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#terms" className="hover:text-slate-800">Terms of Service</a>
            <a href="#privacy" className="hover:text-slate-800">Privacy Policy</a>
            <a href="#hipaa" className="hover:text-slate-800">HIPAA Statement</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
