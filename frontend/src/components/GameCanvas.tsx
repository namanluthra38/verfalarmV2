import { useRef, useEffect, useCallback, useState } from 'react';
import { initGameState, updateGame, moveShield, setShieldIndex, createDustbins, DEFAULT_CONFIG } from '../game/engine';
import { renderGame } from '../game/renderer';
import type { GameState } from '../game/types';

interface GameCanvasProps {
    onGameOver: (state: GameState) => void;
}

export default function GameCanvas({ onGameOver }: GameCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const stateRef = useRef<GameState | null>(null);
    const frameRef = useRef<number>(0);
    const timeRef = useRef<number>(0);
    const gameOverFired = useRef(false);
    const [started, setStarted] = useState(false);

    const initGame = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        stateRef.current = initGameState(canvas.width, canvas.height);
        gameOverFired.current = false;
        timeRef.current = 0;
    }, []);

    // Game loop
    useEffect(() => {
        if (!started) return;

        initGame();

        const loop = () => {
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext('2d');
            if (!canvas || !ctx || !stateRef.current) return;

            timeRef.current++;
            stateRef.current = updateGame(stateRef.current, DEFAULT_CONFIG);

            renderGame(ctx, stateRef.current, timeRef.current);

            if (stateRef.current.isGameOver && !gameOverFired.current) {
                gameOverFired.current = true;
                if (stateRef.current) onGameOver(stateRef.current);
            }

            frameRef.current = requestAnimationFrame(loop);
        };

        frameRef.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(frameRef.current);
    }, [started, initGame, onGameOver]);

    // Keyboard controls
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (!stateRef.current || stateRef.current.isGameOver) return;
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
                stateRef.current = moveShield(stateRef.current, 'left');
            } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
                stateRef.current = moveShield(stateRef.current, 'right');
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    // Touch / mouse controls
    useEffect(() => {
        if (!started) return;
        
        const canvas = canvasRef.current;
        if (!canvas) return;

        const handlePointer = (clientX: number) => {
            if (!stateRef.current || stateRef.current.isGameOver) return;
            const rect = canvas.getBoundingClientRect();
            const x = (clientX - rect.left) * window.devicePixelRatio;
            const bins = stateRef.current.dustbins;
            let closest = 0;
            let minDist = Infinity;
            bins.forEach((bin, i) => {
                const center = bin.x + bin.width / 2;
                const dist = Math.abs(x - center);
                if (dist < minDist) {
                    minDist = dist;
                    closest = i;
                }
            });
            stateRef.current = setShieldIndex(stateRef.current, closest);
        };

        const onTouch = (e: TouchEvent) => {
            e.preventDefault();
            if (e.touches.length > 0) {
                handlePointer(e.touches[0].clientX);
            }
        };

        const onMouse = (e: MouseEvent) => {
            handlePointer(e.clientX);
        };

        canvas.addEventListener('touchstart', onTouch, { passive: false });
        canvas.addEventListener('touchmove', onTouch, { passive: false });
        canvas.addEventListener('mousemove', onMouse);
        canvas.addEventListener('click', onMouse);

        return () => {
            canvas.removeEventListener('touchstart', onTouch);
            canvas.removeEventListener('touchmove', onTouch);
            canvas.removeEventListener('mousemove', onMouse);
            canvas.removeEventListener('click', onMouse);
        };
    }, [started]);

    // Handle resize
    useEffect(() => {
        const handleResize = () => {
            const canvas = canvasRef.current;
            if (!canvas || !stateRef.current) return;
            const rect = canvas.getBoundingClientRect();
            const newW = rect.width * window.devicePixelRatio;
            const newH = rect.height * window.devicePixelRatio;
            canvas.width = newW;
            canvas.height = newH;

            // Recalculate dustbins positions
            stateRef.current = {
                ...stateRef.current,
                canvasWidth: newW,
                canvasHeight: newH,
                dustbins: createDustbins(newW, newH, DEFAULT_CONFIG.numBins),
            };
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (!started) {
        return (
            <div className="absolute inset-0 flex items-center justify-center bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm z-10 p-4">
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl dark:shadow-black/40 p-8 max-w-md w-full text-center border-2 border-emerald-100 dark:border-slate-700 relative overflow-hidden">
                    <div className="text-6xl mb-6">🛒</div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100 mb-4">
                        Save the <span className="text-emerald-600 dark:text-emerald-400">Products!</span>
                    </h1>
                    <p className="text-gray-600 dark:text-slate-400 mb-8 leading-relaxed">
                        Products are falling toward the bins! Move the <span className="font-semibold text-emerald-600 dark:text-emerald-400">green shield</span> to catch them before they go to waste.
                    </p>
                    <div className="flex justify-center gap-6 mb-8 text-sm text-gray-500 dark:text-slate-400">
                        <div className="flex flex-col items-center gap-2">
                            <span className="px-2 py-1 bg-gray-100 dark:bg-slate-700 rounded text-gray-700 dark:text-slate-200 font-mono font-bold border border-gray-200 dark:border-slate-600 shadow-sm">← →</span>
                            <span>Arrow Keys</span>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <span className="px-2 py-1 bg-gray-100 dark:bg-slate-700 rounded text-gray-700 dark:text-slate-200 font-mono font-bold border border-gray-200 dark:border-slate-600 shadow-sm">👆</span>
                            <span>Tap / Click</span>
                        </div>
                    </div>
                    <button 
                        className="w-full bg-emerald-600 dark:bg-emerald-500 text-white font-bold py-3 px-6 rounded-xl shadow-md hover:shadow-lg hover:bg-emerald-700 dark:hover:bg-emerald-600 transform hover:-translate-y-0.5 transition-all"
                        onClick={() => setStarted(true)}
                    >
                        Start Game
                    </button>
                </div>
            </div>
        );
    }

    return (
        <canvas
            ref={canvasRef}
            className="w-full h-full block"
            style={{ touchAction: 'none' }}
        />
    );
}
