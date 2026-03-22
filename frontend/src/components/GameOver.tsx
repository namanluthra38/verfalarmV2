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
            <div className="bg-[#081D08] rounded-2xl shadow-2xl shadow-black/60 p-8 max-w-md w-full text-center border-2 border-[#1a8a2e]/40 overflow-hidden">
                <h1 className="text-4xl font-bold text-slate-100 mb-6">Game Over!</h1>

                <div className="flex justify-center mb-8">
                    <div className="rounded-xl px-8 py-4 text-center">
                        <span className="block text-4xl font-bold text-emerald-600 dark:text-emerald-400 mb-1">{state.totalSaved}</span>
                        <span className="block text-sm font-semibold text-emerald-800 dark:text-emerald-300">Saved</span>
                    </div>
                </div>

                <div className="mb-8 space-y-3">
                    <p className="text-xl font-semibold text-slate-200">
                        With <span className="text-emerald-400 font-bold">Verfalarm</span>, none of your products would go to waste.
                    </p>
                    <p className="text-slate-400 mt-2">
                        Get expiration date reminders before your products go bad.
                        Never waste food again.
                    </p>
                </div>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                    >
                        Try Verfalarm <span className="text-lg">→</span>
                    </button>
                    <button
                        className="w-full bg-[#040e04] text-slate-300 font-bold py-3 px-6 rounded-xl shadow-sm hover:bg-[#0b220b] transition-all font-medium border border-[#1a8a2e]/40"
                        onClick={onRestart}
                    >
                        Play Again
                    </button>
                </div>
            </div>
        </div>
    );
}
