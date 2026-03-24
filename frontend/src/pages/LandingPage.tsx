import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Bell, Leaf, ArrowRight } from 'lucide-react';
import GameCanvas from '../components/GameCanvas';
import GameOver from '../components/GameOver';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import type { GameState } from '../game/types';
 
type Screen = 'playing' | 'gameover';
 
export default function LandingPage() {
  const navigate = useNavigate();
  const [screen, setScreen] = useState<Screen>('playing');
  const [finalState, setFinalState] = useState<GameState | null>(null);
  const [gameKey, setGameKey] = useState(0);
 
  const handleGameOver = useCallback((state: GameState) => {
    setFinalState(state);
    setScreen('gameover');
  }, []);
 
  const handleRestart = useCallback(() => {
    setFinalState(null);
    setScreen('playing');
    setGameKey((k) => k + 1);
  }, []);
 
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-emerald-50 via-amber-50 to-emerald-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">

      {/* Fixed ambient orbs */}
      <div className="fixed top-20 -left-32 w-96 h-96 bg-emerald-200/20 dark:bg-emerald-700/20 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed top-40 -right-32 w-96 h-96 bg-emerald-300/20 dark:bg-emerald-800/20 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed -bottom-32 left-1/2 w-96 h-96 bg-emerald-100/20 dark:bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />
 
        <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full space-y-20">
 
          {/* ── Hero ── */}
          <section className="text-center pt-8 animate-float-up">
 
            {/* Eyebrow pill */}
            <div className="flex justify-center mb-7">
              <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.15em] uppercase text-emerald-700 dark:text-emerald-400 px-4 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 border border-emerald-200/60 dark:border-emerald-700/50">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                Product Expiration Tracker
              </span>
            </div>
 
            {/* Headline */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 dark:text-slate-100 mb-6 tracking-tight leading-[1.08]">
              Never let your products{' '}
              <span className="text-gradient-emerald">Go to Waste</span>
            </h1>
 
            {/* Subtext */}
            <p className="text-lg md:text-xl text-gray-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed font-medium">
              Verfalarm is your personal product expiration reminder. We notify you before
              your food, cosmetics, or medicines expire. Play the mini-game below to see how fast things can go bad!
            </p>
 
            {/* CTA row */}
            <div className="flex items-center justify-center gap-3 mt-10 flex-wrap">
              <button
                onClick={() => navigate('/dashboard')}
                className="group relative inline-flex items-center justify-center gap-2.5 bg-emerald-400 dark:bg-emerald-600 text-white font-bold py-3.5 px-8 rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(16,185,129,0.3)] dark:hover:shadow-[0_0_40px_rgba(16,185,129,0.2)]"
              >
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-shimmer" />
                <span className="relative z-10 text-base tracking-wide">Try Verfalarm</span>
                <ArrowRight className="relative z-10 w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </button>

              <a
                href="#features"
                className="inline-flex items-center gap-1.5 font-semibold text-gray-600 dark:text-slate-300 px-6 py-3.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm hover:border-emerald-300 dark:hover:border-emerald-600 hover:text-emerald-700 dark:hover:text-emerald-400 transition-all duration-200 text-base"
              >
                Learn more
              </a>
            </div>
          </section>
 
          {/* ── Game canvas ── */}
          <section
            className="relative overflow-hidden rounded-2xl border border-emerald-100 dark:border-emerald-700 bg-white dark:bg-slate-800 shadow-xl dark:shadow-black/40"
            style={{ height: 600 }}
          >
            {/* Top-edge accent line */}
            <div className="absolute top-0 left-0 right-0 h-px z-10 bg-gradient-to-r from-transparent via-emerald-400/50 dark:via-emerald-500/40 to-transparent pointer-events-none" />
 
            <div className="absolute inset-0">
              <GameCanvas key={gameKey} onGameOver={handleGameOver} />
              {screen === 'gameover' && finalState && (
                <GameOver state={finalState} onRestart={handleRestart} />
              )}
            </div>
          </section>
 
          {/* ── Feature cards ── */}
          <section id="features" className="pb-8">
 
            {/* Section label */}
            <div className="flex items-center gap-3 mb-10 justify-center">
              <div className="h-px flex-1 max-w-[80px] bg-gradient-to-r from-transparent to-emerald-200 dark:to-emerald-700" />
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">Why Verfalarm</span>
              <div className="h-px flex-1 max-w-[80px] bg-gradient-to-l from-transparent to-emerald-200 dark:to-emerald-700" />
            </div>
 
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { icon: Calendar, title: 'Smart Tracking', desc: 'Log your products and their expiration dates effortlessly.' },
                { icon: Bell,     title: 'Timely Alerts',  desc: 'Receive notifications days before items expire so you can use them in time.' },
                { icon: Leaf,     title: 'Reduce Waste',   desc: 'Save money and the planet by minimizing household waste.' },
              ].map((card, i) => {
                const Icon = card.icon;
                return (
                  <div
                    key={i}
                    className="group relative bg-white/80 dark:bg-emerald-900/80 backdrop-blur-lg p-7 rounded-2xl border border-emerald-100 dark:border-emerald-700 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_-15px_rgba(16,185,129,0.15)] dark:hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] overflow-hidden animate-fade-in-up"
                    style={{ animationDelay: `${i * 120}ms`, animationFillMode: 'both' }}
                  >
                    {/* Hover wash */}
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-transparent dark:from-emerald-300/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
 
                    {/* Bottom accent line */}
                    <div className="absolute bottom-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-emerald-400/40 dark:via-emerald-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
 
                    {/* Icon */}
                    <div className="relative z-10 mb-5 w-11 h-11 flex items-center justify-center bg-emerald-100 dark:bg-emerald-800 rounded-xl text-emerald-600 dark:text-emerald-300 group-hover:scale-105 transition-transform duration-300">
                      <Icon className="w-5 h-5" strokeWidth={2} />
                    </div>
 
                    <h3 className="relative z-10 text-lg font-bold text-gray-900 dark:text-slate-100 mb-2 tracking-tight">{card.title}</h3>
                    <p className="relative z-10 text-sm leading-relaxed text-gray-500 dark:text-slate-200">{card.desc}</p>
                  </div>
                );
              })}
            </div>
          </section>
 
        </main>
 
        <Footer />
      </div>
    </div>
  );
}