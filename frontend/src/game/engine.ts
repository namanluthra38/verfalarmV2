import type { GameState, GameConfig, Dustbin, FallingProduct, Particle } from './types';
import { getRandomProduct } from './products';

export const DEFAULT_CONFIG: GameConfig = {
    numBins: 4,
    initialLives: 3,
    initialSpawnInterval: 75, // frames (~1.25s at 60fps)
    initialSpeed: 2.8,
    speedIncrement: 0.25,
    spawnIntervalDecrement: 8,
    minSpawnInterval: 25,
    maxSpeed: 7.5,
    levelUpThreshold: 5,
};

export function createDustbins(
    canvasWidth: number,
    canvasHeight: number,
    numBins: number
): Dustbin[] {
    const bins: Dustbin[] = [];
    const totalPadding = canvasWidth * 0.12;
    const usableWidth = canvasWidth - totalPadding;
    const binWidth = usableWidth / numBins;
    const binHeight = canvasHeight * 0.1;
    const startX = totalPadding / 2;

    for (let i = 0; i < numBins; i++) {
        bins.push({
            x: startX + i * binWidth + binWidth * 0.1,
            y: canvasHeight - binHeight - 10,
            width: binWidth * 0.8,
            height: binHeight,
            index: i,
        });
    }
    return bins;
}

export function initGameState(
    canvasWidth: number,
    canvasHeight: number,
    config: GameConfig = DEFAULT_CONFIG
): GameState {
    const dustbins = createDustbins(canvasWidth, canvasHeight, config.numBins);
    return {
        score: 0,
        lives: config.initialLives,
        maxLives: config.initialLives,
        level: 1,
        products: [],
        particles: [],
        shieldBinIndex: Math.floor(config.numBins / 2),
        isGameOver: false,
        wasted: 0,
        spawnTimer: 0,
        spawnInterval: config.initialSpawnInterval,
        baseSpeed: config.initialSpeed,
        canvasWidth,
        canvasHeight,
        dustbins,
        nextProductId: 0,
        totalSaved: 0,
        totalWasted: 0,
    };
}

export function spawnProduct(state: GameState): FallingProduct {
    const binIndex = Math.floor(Math.random() * state.dustbins.length);
    const bin = state.dustbins[binIndex];
    const productType = getRandomProduct();
    const width = bin.width * 0.4;
    const height = width;

    return {
        id: state.nextProductId++,
        type: productType,
        binIndex,
        x: bin.x + bin.width / 2 - width / 2,
        y: -height - Math.random() * 40,
        speed: state.baseSpeed + (Math.random() - 0.5) * 0.5,
        width,
        height,
        opacity: 1,
    };
}

function createParticles(
    x: number,
    y: number,
    color: string,
    count: number
): Particle[] {
    const particles: Particle[] = [];
    for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
        const speed = 1.5 + Math.random() * 3;
        particles.push({
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 2,
            life: 1,
            maxLife: 30 + Math.random() * 20,
            color,
            size: 3 + Math.random() * 4,
        });
    }
    return particles;
}

export function updateGame(
    state: GameState,
    config: GameConfig = DEFAULT_CONFIG
): GameState {
    if (state.isGameOver) return state;

    const newState = { ...state };
    newState.products = [...state.products];
    newState.particles = [...state.particles];

    // Spawn products
    newState.spawnTimer++;
    if (newState.spawnTimer >= newState.spawnInterval) {
        newState.spawnTimer = 0;
        newState.products.push(spawnProduct(newState));

        // At higher scores, sometimes spawn 2 at once
        if (newState.score >= 10 && Math.random() < 0.3) {
            newState.products.push(spawnProduct(newState));
        }
        if (newState.score >= 20 && Math.random() < 0.2) {
            newState.products.push(spawnProduct(newState));
        }
    }

    // Update products
    const aliveProducts: FallingProduct[] = [];
    for (const product of newState.products) {
        const updated = { ...product };
        updated.y += updated.speed;

        const binBottom = newState.dustbins[0].y;

        // Check if product reached the bins
        if (updated.y + updated.height >= binBottom) {
            if (updated.binIndex === newState.shieldBinIndex) {
                // SAVED!
                newState.score++;
                newState.totalSaved++;
                newState.particles.push(
                    ...createParticles(
                        updated.x + updated.width / 2,
                        binBottom,
                        '#2ECC40',
                        12
                    )
                );

                // Gradually increase difficulty every 5 saves
                if (
                    newState.score > 0 &&
                    newState.score % config.levelUpThreshold === 0
                ) {
                    newState.baseSpeed = Math.min(
                        config.maxSpeed,
                        newState.baseSpeed + config.speedIncrement
                    );
                    newState.spawnInterval = Math.max(
                        config.minSpawnInterval,
                        newState.spawnInterval - config.spawnIntervalDecrement
                    );
                }
            } else {
                // WASTED
                newState.lives--;
                newState.totalWasted++;
                newState.particles.push(
                    ...createParticles(
                        updated.x + updated.width / 2,
                        binBottom,
                        '#ff4444',
                        10
                    )
                );
                if (newState.lives <= 0) {
                    newState.lives = 0;
                    newState.isGameOver = true;
                }
            }
            continue; // remove product
        }

        aliveProducts.push(updated);
    }
    newState.products = aliveProducts;

    // Update particles
    newState.particles = newState.particles
        .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.1,
            life: p.life - 1 / p.maxLife,
            size: p.size * 0.97,
        }))
        .filter((p) => p.life > 0);

    return newState;
}

export function moveShield(state: GameState, direction: 'left' | 'right'): GameState {
    if (state.isGameOver) return state;
    const newIndex =
        direction === 'left'
            ? Math.max(0, state.shieldBinIndex - 1)
            : Math.min(state.dustbins.length - 1, state.shieldBinIndex + 1);
    return { ...state, shieldBinIndex: newIndex };
}

export function setShieldIndex(state: GameState, index: number): GameState {
    if (state.isGameOver) return state;
    const clamped = Math.max(0, Math.min(state.dustbins.length - 1, index));
    return { ...state, shieldBinIndex: clamped };
}
