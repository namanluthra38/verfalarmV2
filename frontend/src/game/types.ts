export interface ProductType {
    id: string;
    emoji: string;
    label: string;
    color: string;
}

export interface FallingProduct {
    id: number;
    type: ProductType;
    binIndex: number;
    x: number;
    y: number;
    speed: number;
    width: number;
    height: number;
    saved?: boolean;
    wasted?: boolean;
    opacity: number;
}

export interface Dustbin {
    x: number;
    y: number;
    width: number;
    height: number;
    index: number;
}

export interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    color: string;
    size: number;
}

export interface GameState {
    score: number;
    lives: number;
    maxLives: number;
    level: number;
    products: FallingProduct[];
    particles: Particle[];
    shieldBinIndex: number;
    isGameOver: boolean;
    wasted: number;
    spawnTimer: number;
    spawnInterval: number;
    baseSpeed: number;
    canvasWidth: number;
    canvasHeight: number;
    dustbins: Dustbin[];
    nextProductId: number;
    totalSaved: number;
    totalWasted: number;
}

export interface GameConfig {
    numBins: number;
    initialLives: number;
    initialSpawnInterval: number;
    initialSpeed: number;
    speedIncrement: number;
    spawnIntervalDecrement: number;
    minSpawnInterval: number;
    maxSpeed: number;
    levelUpThreshold: number;
}
