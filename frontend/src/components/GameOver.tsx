import type { GameState } from '../game/types';
import { useNavigate } from 'react-router-dom';

interface GameOverProps {
    state: GameState;
    onRestart: () => void;
}

export default function GameOver({ state, onRestart }: GameOverProps) {
    const navigate = useNavigate();

    return (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-20 p-4 animate-game-over opacity-0">
            <div className="bg-[#081D08] rounded-3xl shadow-2xl shadow-black/60 p-10 max-w-md w-full text-center border border-[#1a8a2e]/40 overflow-hidden relative">
                {/* Decorative glow */}
                <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10">
                    <p className="text-xs font-semibold tracking-widest uppercase text-slate-500 mb-2">Result</p>
                    <h1 className="text-4xl font-extrabold text-slate-100 mb-8 tracking-tight">Game Over</h1>

                    <div className="flex justify-center mb-8">
                        <div className="bg-emerald-900/30 rounded-2xl px-10 py-5 border border-emerald-700/30">
                            <span className="block text-5xl font-extrabold text-emerald-400 mb-1 tracking-tight">{state.totalSaved}</span>
                            <span className="block text-xs font-semibold text-emerald-500 uppercase tracking-widest">Products Saved</span>
                        </div>
                    </div>

                    <div className="mb-8 space-y-2">
                        <p className="text-lg font-semibold text-slate-200 leading-snug tracking-tight">
                            With <span className="text-emerald-400 font-bold">Verfalarm</span>, none of your products would go to waste.
                        </p>
                        <p className="text-sm text-slate-500 leading-relaxed">
                            Get expiration date reminders before your products go bad.
                            Never waste food again.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="group w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-emerald-600/20 hover:shadow-xl transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-wide"
                        >
                            Try Verfalarm <span className="text-base transition-transform group-hover:translate-x-1">→</span>
                        </button>
                        <button
                            className="w-full bg-[#040e04] text-slate-400 font-semibold py-3.5 px-6 rounded-xl hover:bg-[#0b220b] hover:text-slate-300 transition-all border border-[#1a8a2e]/30 text-sm"
                            onClick={onRestart}
                        >
                            Play Again
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
