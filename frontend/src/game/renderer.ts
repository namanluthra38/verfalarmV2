import type { GameState } from './types';

export function renderGame(
    ctx: CanvasRenderingContext2D,
    state: GameState,
    time: number
) {
    const { canvasWidth: w, canvasHeight: h } = state;

    ctx.clearRect(0, 0, w, h);
    drawBackground(ctx, w, h, time);

    // Dustbins
    state.dustbins.forEach((bin) => {
        drawDustbin(ctx, bin.x, bin.y, bin.width, bin.height);
    });

    // Shield (above the bins)
    const shieldBin = state.dustbins[state.shieldBinIndex];
    if (shieldBin) {
        drawShield(ctx, shieldBin.x, shieldBin.y, shieldBin.width, shieldBin.height, time);
    }

    // Products (just emojis, no card)
    state.products.forEach((product) => {
        drawProduct(ctx, product.x, product.y, product.width, product.height, product.type.emoji, product.opacity);
    });

    // Particles
    state.particles.forEach((p) => {
        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });

    // Floating texts
    state.floatingTexts.forEach((ft) => {
        drawFloatingText(ctx, ft, w);
    });

    // Screen flash
    if (state.screenFlash) {
        ctx.save();
        ctx.globalAlpha = state.screenFlash.life * 0.8;
        ctx.fillStyle = state.screenFlash.color;
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
    }

    drawHUD(ctx, state, w);
}

/* ===== Background ===== */
function drawBackground(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    time: number
) {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#040e04');
    grad.addColorStop(0.4, '#081808');
    grad.addColorStop(1, '#0b220b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Subtle floating motes
    ctx.save();
    for (let i = 0; i < 40; i++) {
        const x = (i * 137.5 + time * 0.12) % w;
        const y = (i * 97.3 + time * 0.06 * (i % 3 + 1)) % h;
        const size = 0.8 + (i % 3) * 0.6;
        const alpha = 0.06 + Math.sin(time * 0.008 + i) * 0.03;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = i % 3 === 0 ? '#2ECC40' : i % 3 === 1 ? '#FFDC00' : '#1a8a2e';
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

/* ===== Dustbin (sleek glassmorphism) ===== */
function drawDustbin(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number
) {
    ctx.save();

    const radius = 12;

    // Shape: sharp top corners, rounded bottom corners
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.closePath();
    
    // Glass body gradient fill
    const glassGrad = ctx.createLinearGradient(x, y, x, y + h);
    glassGrad.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
    glassGrad.addColorStop(1, 'rgba(255, 255, 255, 0.01)');
    ctx.fillStyle = glassGrad;
    ctx.fill();

    // Glass border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Glowing green top rim (the opening of the bin)
    ctx.beginPath();
    ctx.moveTo(x - 2, y);
    ctx.lineTo(x + w + 2, y);
    ctx.strokeStyle = 'rgba(46, 204, 64, 0.9)';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Top rim glow
    ctx.shadowColor = '#2ECC40';
    ctx.shadowBlur = 12;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Minimalist recycle icon in the center background
    ctx.font = `${Math.min(w * 0.4, 32)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fillText('♻', x + w / 2, y + h * 0.55);

    ctx.restore();
}

/* ===== Shield (above dust bins) ===== */
function drawShield(
    ctx: CanvasRenderingContext2D,
    binX: number,
    binY: number,
    binW: number,
    binH: number,
    time: number
) {
    ctx.save();

    const shieldH = 18;
    const gap = binH * 0.35 + 10;
    const sy = binY - gap;
    const shieldW = binW + 12;
    const sx = binX - 6;
    const pulse = Math.sin(time * 0.04) * 0.12 + 0.88;

    // Outer glow (3 layers)
    const glowColors = [
        `rgba(46, 204, 64, ${0.35 * pulse})`,
        `rgba(46, 204, 64, ${0.15 * pulse})`,
        `rgba(46, 204, 64, ${0.05 * pulse})`,
    ];
    glowColors.forEach((color, i) => {
        const spread = (i + 1) * 8;
        ctx.fillStyle = color;
        ctx.beginPath();
        roundRect(ctx, sx - spread, sy - spread, shieldW + spread * 2, shieldH + spread * 2, 12 + spread);
        ctx.fill();
    });

    // Main shield bar
    const shieldGrad = ctx.createLinearGradient(sx, sy, sx, sy + shieldH);
    shieldGrad.addColorStop(0, `rgba(30, 180, 50, ${pulse})`);
    shieldGrad.addColorStop(0.35, `rgba(46, 204, 64, ${pulse})`);
    shieldGrad.addColorStop(0.5, `rgba(200, 230, 60, ${pulse * 0.95})`);
    shieldGrad.addColorStop(0.65, `rgba(46, 204, 64, ${pulse})`);
    shieldGrad.addColorStop(1, `rgba(30, 160, 45, ${pulse})`);

    ctx.beginPath();
    roundRect(ctx, sx, sy, shieldW, shieldH, 9);
    ctx.fillStyle = shieldGrad;
    ctx.fill();

    // border
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.25 * pulse})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Top highlight strip
    ctx.beginPath();
    roundRect(ctx, sx + 3, sy + 2, shieldW - 6, 5, 3);
    ctx.fillStyle = `rgba(255,255,255,${0.3 * pulse})`;
    ctx.fill();

    // Bottom subtle shadow
    ctx.beginPath();
    roundRect(ctx, sx + 4, sy + shieldH - 4, shieldW - 8, 3, 2);
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fill();

    // Connecting beam from shield to bin (faint dashed line)
    ctx.strokeStyle = `rgba(46, 204, 64, ${0.1 * pulse})`;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.moveTo(binX + binW / 2, sy + shieldH);
    ctx.lineTo(binX + binW / 2, binY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.restore();
}

/* ===== Product (clean emoji only) ===== */
function drawProduct(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    emoji: string,
    opacity: number
) {
    ctx.save();
    ctx.globalAlpha = opacity;

    // Subtle drop shadow glow
    ctx.shadowColor = 'rgba(255,220,0,0.15)';
    ctx.shadowBlur = 12;

    const emojiSize = Math.max(20, Math.min(w * 0.7, h * 0.7));
    ctx.font = `${emojiSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, x + w / 2, y + h / 2);

    ctx.shadowBlur = 0;
    ctx.restore();
}

/* ===== HUD (modern pill badges) ===== */
function drawHUD(
    ctx: CanvasRenderingContext2D,
    state: GameState,
    w: number
) {
    ctx.save();

    const hudH = 56;
    const hudGrad = ctx.createLinearGradient(0, 0, 0, hudH);
    hudGrad.addColorStop(0, 'rgba(0,0,0,0.7)');
    hudGrad.addColorStop(0.8, 'rgba(0,0,0,0.15)');
    hudGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = hudGrad;
    ctx.fillRect(0, 0, w, hudH);

    const fontSize = Math.max(12, Math.min(16, w * 0.025));
    const padding = Math.max(12, w * 0.015);
    const cy = 27;

    // === Score badge (left) ===
    const scoreText = `${state.score}`;
    const scoreLabel = 'SCORE';
    ctx.font = `600 ${fontSize * 0.7}px 'Inter', sans-serif`;
    const labelWidth = ctx.measureText(scoreLabel).width;
    ctx.font = `800 ${fontSize * 1.15}px 'Inter', sans-serif`;
    const numWidth = ctx.measureText(scoreText).width;
    const badgeW = labelWidth + numWidth + 30;
    const badgeH = 30;
    const badgeX = padding;
    const badgeY = cy - badgeH / 2;

    // Badge background
    ctx.beginPath();
    roundRect(ctx, badgeX, badgeY, badgeW, badgeH, badgeH / 2);
    ctx.fillStyle = 'rgba(46, 204, 64, 0.15)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(46, 204, 64, 0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Label
    ctx.font = `600 ${fontSize * 0.65}px 'Inter', sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(46, 204, 64, 0.7)';
    ctx.letterSpacing = '1px';
    ctx.fillText(scoreLabel, badgeX + 12, cy);

    // Number
    ctx.font = `800 ${fontSize * 1.15}px 'Inter', sans-serif`;
    ctx.fillStyle = '#2ECC40';
    ctx.fillText(scoreText, badgeX + 12 + labelWidth + 8, cy);

    // === Lives badge (right) ===
    let livesStr = '';
    for (let i = 0; i < state.maxLives; i++) {
        livesStr += i < state.lives ? '💚' : '🖤';
    }
    ctx.font = `${fontSize * 0.95}px sans-serif`;
    const livesW = ctx.measureText(livesStr).width + 20;
    const livesH = 30;
    const livesX = w - padding - livesW;
    const livesY = cy - livesH / 2;

    ctx.beginPath();
    roundRect(ctx, livesX, livesY, livesW, livesH, livesH / 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(livesStr, livesX + livesW / 2, cy);

    ctx.restore();
}

/* ===== Floating Text ===== */
function drawFloatingText(
    ctx: CanvasRenderingContext2D,
    ft: { x: number; y: number; text: string; color: string; life: number; scale: number },
    canvasWidth: number
) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, ft.life * 1.5);

    const fontSize = Math.max(14, Math.min(22, canvasWidth * 0.028)) * ft.scale;
    ctx.font = `bold ${fontSize}px 'Inter', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Text shadow / outline for readability
    ctx.shadowColor = ft.color;
    ctx.shadowBlur = 10;
    ctx.fillStyle = ft.color;
    ctx.fillText(ft.text, ft.x, ft.y);

    // Second pass with white outline for contrast
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 2;
    ctx.strokeText(ft.text, ft.x, ft.y);
    ctx.fillText(ft.text, ft.x, ft.y);

    ctx.restore();
}

/* ===== Helpers ===== */
function roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
) {
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}
