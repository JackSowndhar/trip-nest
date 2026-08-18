import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { tripsAPI } from '../services/api';
import { Map, Calendar, Coins, Users, Camera, BarChart2, Mountain, Sun, Plane, Pencil, BookOpen, Briefcase, Sparkles, MapPin } from 'lucide-react';

const features = [
  {
    icon: Map,
    title: 'Last Trip Recap',
    desc: 'View where you went, who came along, how long you stayed, and every memory from your most recent adventure.',
    color: 'from-orange-100 to-amber-50',
    accent: 'text-orange-500',
  },
  {
    icon: Calendar,
    title: 'Upcoming Trips',
    desc: 'See all your planned trips at a glance — dates, destinations, and who\'s joining you next.',
    color: 'from-blue-100 to-sky-50',
    accent: 'text-blue-500',
  },
  {
    icon: Coins,
    title: 'Trip Spending',
    desc: 'Track how much you spent on each trip — food, stays, transport — split by member or total.',
    color: 'from-primary-100 to-emerald-50',
    accent: 'text-primary-600',
  },
  {
    icon: Users,
    title: 'Trip Members',
    desc: 'See who joined each trip, manage your travel crew, and split costs between friends easily.',
    color: 'from-purple-100 to-fuchsia-50',
    accent: 'text-purple-500',
  },
  {
    icon: Camera,
    title: 'Trip Timeline',
    desc: 'A day-by-day breakdown of your trip — activities, places visited, and notes you left yourself.',
    color: 'from-rose-100 to-pink-50',
    accent: 'text-rose-500',
  },
  {
    icon: BarChart2,
    title: 'Travel Stats',
    desc: 'How many trips this year, total days traveled, countries visited, and your total spend over time.',
    color: 'from-teal-100 to-cyan-50',
    accent: 'text-teal-600',
  },
];

const previewCards = [
  {
    label: 'Last Trip',
    value: 'Coorg, Karnataka',
    sub: '4 days · 5 members',
    icon: Mountain,
    gradient: 'from-orange-400 to-amber-500',
    offset: '',
  },
  {
    label: 'Total Spent',
    value: '₹18,400',
    sub: '₹3,680 per person',
    icon: Coins,
    gradient: 'from-primary-500 to-emerald-500',
    offset: 'sm:ml-6',
  },
  {
    label: 'Next Trip',
    value: 'Goa',
    sub: 'July 12 · 3 members',
    icon: Sun,
    gradient: 'from-blue-500 to-indigo-500',
    offset: 'sm:ml-2',
  },
];

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-white">

      {/* Hero */}
      <section className="pt-24 sm:pt-28 pb-8 sm:pb-10 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute top-16 right-0 w-[280px] sm:w-[400px] md:w-[520px] h-[280px] sm:h-[400px] md:h-[520px] bg-gradient-to-bl from-primary-50 via-emerald-50 to-transparent rounded-full opacity-70 -z-0" />
        <div className="absolute top-36 right-12 sm:right-24 w-32 sm:w-44 md:w-56 h-32 sm:h-44 md:h-56 bg-primary-100 rounded-full blur-3xl opacity-40 -z-0" />
        <div className="absolute bottom-0 left-0 w-40 sm:w-56 md:w-72 h-40 sm:h-56 md:h-72 bg-blue-50 rounded-full blur-3xl opacity-40 -z-0" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid md:grid-cols-2 gap-10 md:gap-14 items-center">

            {/* Left */}
            <div>
              <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-700 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium mb-5 sm:mb-6 animate-fade-in-up animate-fill-both border border-primary-100">
                <span className="w-2 h-2 bg-primary-500 rounded-full animate-pulse flex-shrink-0" />
                Your personal trip memory book
              </div>

              <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-4 animate-fade-in-up animate-fill-both animate-delay-100">
                All your trips,
                <br />
                <span className="text-primary-600 relative">
                  one place
                  <svg className="absolute -bottom-1 sm:-bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none">
                    <path d="M2 9 C50 3, 100 3, 198 9" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                </span>
              </h1>

              <p className="text-gray-500 text-base sm:text-lg leading-relaxed mb-6 sm:mb-8 max-w-lg animate-fade-in-up animate-fill-both animate-delay-200">
                Track your trips with friends — where you went, who joined, what you spent, and when you're going next. Just for you and your crew.
              </p>

              <div className="flex flex-col xs:flex-row flex-wrap gap-3 sm:gap-4 animate-fade-in-up animate-fill-both animate-delay-300">
                {user ? (
                  <Link
                    to="/dashboard"
                    className="px-6 sm:px-8 py-3 sm:py-3.5 bg-gradient-to-r from-primary-600 to-emerald-500 text-white font-semibold rounded-xl hover:shadow-xl hover:shadow-primary-500/30 hover:-translate-y-1 transition-all duration-300 text-sm text-center"
                  >
                    Open My Trips →
                  </Link>
                ) : (
                  <button
                    onClick={() => document.querySelector('[data-register-btn]')?.click()}
                    className="px-6 sm:px-8 py-3 sm:py-3.5 bg-gradient-to-r from-primary-600 to-emerald-500 text-white font-semibold rounded-xl hover:shadow-xl hover:shadow-primary-500/30 hover:-translate-y-1 transition-all duration-300 text-sm text-center"
                  >
                    Get Started Free →
                  </button>
                )}
                <a
                  href="#features"
                  className="px-6 sm:px-8 py-3 sm:py-3.5 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:border-primary-300 hover:text-primary-600 transition-all duration-300 text-sm text-center"
                >
                  See What's Inside
                </a>
              </div>
            </div>

            {/* Right — staggered preview cards */}
            <div className="relative flex justify-center items-center animate-fade-in-up animate-fill-both animate-delay-200">
              <div className="relative w-full max-w-xs sm:max-w-sm flex flex-col gap-3 sm:gap-4 animate-float">
                {previewCards.map((card, i) => {
                  const CardIcon = card.icon;
                  return (
                    <div
                      key={i}
                      className={`bg-white rounded-2xl shadow-xl border border-gray-100 p-4 sm:p-5 flex items-center gap-3 sm:gap-4 ${card.offset}`}
                    >
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br ${card.gradient} flex items-center justify-center text-white flex-shrink-0 shadow-md`}>
                        <CardIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{card.label}</p>
                        <p className="font-display font-bold text-gray-800 text-base sm:text-lg leading-tight truncate">{card.value}</p>
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{card.sub}</p>
                      </div>
                    </div>
                  );
                })}

                {/* floating badge */}
                <div className="absolute -top-3 -right-2 sm:-right-3 bg-white rounded-2xl shadow-lg border border-gray-100 px-2.5 sm:px-3 py-1.5 sm:py-2 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <div>
                    <p className="text-xs font-semibold text-gray-700">8 trips this year</p>
                    <p className="text-xs text-gray-400">Keep exploring!</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* What you can track */}
      <section id="features" className="py-8 sm:py-10 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-10">
            <p className="text-primary-600 font-semibold text-xs sm:text-sm uppercase tracking-widest mb-2 sm:mb-3">Built for you & your friends</p>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
              Everything about your trips,
              <br />
              <span className="text-primary-600">all in one place</span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            {features.map((f, i) => {
              const FeatureIcon = f.icon;
              return (
                <div
                  key={i}
                  className={`bg-gradient-to-br ${f.color} rounded-2xl p-5 sm:p-6 border border-white hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group`}
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-2xl flex items-center justify-center text-primary-600 mb-3 sm:mb-4 shadow-md group-hover:scale-110 transition-transform">
                    <FeatureIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <h3 className="font-display font-bold text-lg sm:text-xl text-gray-800 mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{f.desc}</p>
                  <button className={`mt-3 sm:mt-4 text-sm font-semibold ${f.accent} flex items-center gap-1 hover:gap-2 transition-all`}>
                    Learn More <span>→</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Strip */}
      <section id='community' className="py-10 sm:py-16 bg-gradient-to-r from-primary-600 to-emerald-500 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full"
            style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center mb-7 sm:mb-10">
            <h2 className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-white">Built around how you actually travel</h2>
            <p className="text-primary-100 mt-2 text-sm sm:text-base">Simple, personal, and just for your group</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
            {[
              { icon: Plane, value: 'Trips', desc: 'Log every trip you take' },
              { icon: Users, value: 'Members', desc: 'Add friends per trip' },
              { icon: Coins, value: 'Spending', desc: 'Track costs & splits' },
              { icon: MapPin, value: 'Places', desc: 'Save every destination' },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.value} className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-3 sm:p-5 border border-white/20 flex flex-col items-center justify-center">
                  <div className="text-white text-2xl sm:text-3xl mb-1.5 sm:mb-2">
                    <Icon className="w-7 h-7 sm:w-9 sm:h-9" />
                  </div>
                  <div className="font-display font-bold text-base sm:text-xl text-white">{s.value}</div>
                  <div className="text-primary-100 text-xs sm:text-sm mt-1">{s.desc}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id='how-it-works' className="py-14 sm:py-20 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10 sm:mb-14">
            <p className="text-primary-600 font-semibold text-xs sm:text-sm uppercase tracking-widest mb-2 sm:mb-3">Simple flow</p>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">How it works</h2>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5 sm:gap-8">
            {[
              { step: '01', icon: Pencil, title: 'Create a Trip', desc: 'Add a trip name, destination, dates, and invite your friends to join.' },
              { step: '02', icon: Coins, title: 'Log Expenses', desc: 'Add what you spent — food, stays, fuel — and see the total split per person.' },
              { step: '03', icon: BookOpen, title: 'Relive It', desc: 'After the trip, revisit the timeline, spending summary, and who was there.' },
            ].map((step, i) => {
              const StepIcon = step.icon;
              return (
                <div key={i} className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 text-center group flex flex-col items-center justify-center">
                  <div className="text-xs font-bold text-primary-500 tracking-widest mb-2 sm:mb-3">{step.step}</div>
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-600 mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                    <StepIcon className="w-6 h-6 sm:w-8 sm:h-8" />
                  </div>
                  <h3 className="font-display font-bold text-base sm:text-lg text-gray-800 mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 sm:py-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-gradient-to-br from-primary-600 to-emerald-500 rounded-3xl p-7 sm:p-12 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '30px 30px' }} />
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white mb-3 sm:mb-4 shadow-lg">
                <Briefcase className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">Ready to log your trips?</h2>
              <p className="text-primary-100 mb-6 sm:mb-8 text-base sm:text-lg">Start tracking your travels — past, present, and upcoming.</p>
              <div className="flex flex-col xs:flex-row flex-wrap justify-center gap-3 sm:gap-4">
                {!user ? (
                  <button
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="px-6 sm:px-8 py-3 sm:py-3.5 bg-white text-primary-600 font-bold rounded-xl hover:bg-primary-50 transition-all shadow-lg hover:shadow-xl text-sm"
                  >
                    Create Your Account →
                  </button>
                ) : (
                  <Link
                    to="/dashboard"
                    className="px-6 sm:px-8 py-3 sm:py-3.5 bg-white text-primary-600 font-bold rounded-xl hover:bg-primary-50 transition-all shadow-lg hover:shadow-xl text-sm"
                  >
                    Go to My Trips →
                  </Link>
                )}
                <a href="#features" className="px-6 sm:px-8 py-3 sm:py-3.5 bg-white/20 border border-white/30 text-white font-semibold rounded-xl hover:bg-white/30 transition-all text-sm backdrop-blur-sm">
                  See Features
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-gray-900 text-gray-400 py-8 sm:py-10 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 sm:gap-6 pb-5 sm:pb-6 border-b border-gray-800 text-center md:text-left">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 text-white">
                <Plane className="w-4 h-4" />
              </div>
              <span className="font-display font-bold text-white text-lg">Trip<span className="text-primary-400">Nest</span></span>
            </div>
            <p className="text-xs sm:text-sm text-gray-500">
              Your ultimate companion for group and personal travel.
            </p>
          </div>
          <p className="text-center text-xs text-gray-600 mt-5 sm:mt-6">
            © {new Date().getFullYear()} TripNest. All rights reserved. · Plan, split, and relive your journeys.
          </p>
        </div>
      </footer>
    </div>
  );
}