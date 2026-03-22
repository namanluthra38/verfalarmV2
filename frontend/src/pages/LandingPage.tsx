import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-emerald-50 via-white to-amber-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full space-y-16">
        <section className="text-center pt-8">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-slate-100 mb-6">
            Never let your products <span className="text-emerald-600 dark:text-emerald-400">Go to Waste</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-slate-400 max-w-2xl mx-auto">
            Verfalarm is your personal product expiration reminder. We notify you before 
            your food, cosmetics, or medicines expire. Play the mini-game below to see how fast things can go bad!
          </p>
          <div className="flex justify-center mt-8">
            <button
               onClick={() => navigate('/dashboard')}
               className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-10 rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all text-xl flex items-center justify-center gap-3"
            >
               Try Verfalarm <span className="text-2xl pt-0.5">→</span>
            </button>
          </div>
        </section>

        <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl dark:shadow-black/40 border-2 border-emerald-100 dark:border-slate-700 overflow-hidden relative" style={{ height: '600px' }}>
          <div className="absolute inset-0">
            <GameCanvas key={gameKey} onGameOver={handleGameOver} />
            
            {screen === 'gameover' && finalState && (
              <GameOver state={finalState} onRestart={handleRestart} />
            )}
          </div>
        </section>

        <section className="grid md:grid-cols-3 gap-8 pb-12">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg border border-emerald-50 dark:border-slate-700 text-center hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-4 p-4 bg-emerald-50 dark:bg-slate-700 inline-block rounded-full">📅</div>
            <h3 className="text-xl font-bold text-emerald-800 dark:text-emerald-300 mb-3">Smart Tracking</h3>
            <p className="text-gray-600 dark:text-slate-400">Log your products and their expiration dates effortlessly.</p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg border border-emerald-50 dark:border-slate-700 text-center hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-4 p-4 bg-emerald-50 dark:bg-slate-700 inline-block rounded-full">🔔</div>
            <h3 className="text-xl font-bold text-emerald-800 dark:text-emerald-300 mb-3">Timely Alerts</h3>
            <p className="text-gray-600 dark:text-slate-400">Receive notifications days before items expire so you can use them in time.</p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg border border-emerald-50 dark:border-slate-700 text-center hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-4 p-4 bg-emerald-50 dark:bg-slate-700 inline-block rounded-full">🌱</div>
            <h3 className="text-xl font-bold text-emerald-800 dark:text-emerald-300 mb-3">Reduce Waste</h3>
            <p className="text-gray-600 dark:text-slate-400">Save money and the planet by minimizing household waste.</p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
