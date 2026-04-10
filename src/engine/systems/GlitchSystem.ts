export interface GlitchState {
  active: boolean;
  timer: number;
  intensity: number;
  scanlineOffset: number;
  chromaticShift: number;
  blockGlitches: BlockGlitch[];
}

interface BlockGlitch {
  y: number;
  height: number;
  xOffset: number;
  life: number;
}

export function createGlitchState(): GlitchState {
  return {
    active: false,
    timer: 0,
    intensity: 0,
    scanlineOffset: 0,
    chromaticShift: 0,
    blockGlitches: [],
  };
}

export function triggerGlitch(_state: GlitchState, intensity: number): GlitchState {
  const blocks: BlockGlitch[] = Array.from({ length: Math.floor(2 + intensity * 6) }, () => ({
    y: Math.random() * 600,
    height: 4 + Math.random() * 20,
    xOffset: (Math.random() - 0.5) * 40 * intensity,
    life: 0.1 + Math.random() * 0.2,
  }));

  return {
    active: true,
    timer: 0.2 + intensity * 0.2,
    intensity,
    scanlineOffset: Math.random() * 4,
    chromaticShift: 2 + intensity * 8,
    blockGlitches: blocks,
  };
}

export function updateGlitch(state: GlitchState, dt: number): GlitchState {
  if (!state.active) return state;

  const timer = Math.max(0, state.timer - dt);
  const blocks = state.blockGlitches
    .map(b => ({ ...b, life: b.life - dt }))
    .filter(b => b.life > 0);

  return { ...state, timer, active: timer > 0, blockGlitches: blocks };
}

export function renderGlitch(
  ctx: CanvasRenderingContext2D,
  state: GlitchState,
  canvasW: number,
  canvasH: number,
): void {
  if (!state.active) return;

  const t = state.intensity;

  // Scanlines
  ctx.save();
  ctx.globalAlpha = 0.08 + t * 0.12;
  ctx.fillStyle = '#000';
  for (let y = state.scanlineOffset; y < canvasH; y += 4) {
    ctx.fillRect(0, y, canvasW, 2);
  }

  // Block glitches
  ctx.globalAlpha = 0.4 + t * 0.3;
  state.blockGlitches.forEach(block => {
    const screenY = (block.y / 600) * canvasH;
    const screenH = (block.height / 600) * canvasH;
    // Chromatic R shift
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = `rgba(255,0,100,0.3)`;
    ctx.fillRect(block.xOffset * (canvasW / 800), screenY, canvasW * 0.3, screenH);
    // Chromatic B shift
    ctx.fillStyle = `rgba(0,200,255,0.3)`;
    ctx.fillRect(-block.xOffset * (canvasW / 800), screenY, canvasW * 0.3, screenH);
  });

  // Vignette noise at high corruption
  if (t > 0.6) {
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = (t - 0.6) * 0.3;
    const gradient = ctx.createRadialGradient(
      canvasW / 2, canvasH / 2, canvasH * 0.2,
      canvasW / 2, canvasH / 2, canvasH * 0.8,
    );
    gradient.addColorStop(0, 'transparent');
    gradient.addColorStop(1, `rgba(80,0,120,0.8)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvasW, canvasH);
  }

  ctx.restore();
}

export function renderChromaticAberration(
  ctx: CanvasRenderingContext2D,
  imageSrc: HTMLCanvasElement,
  shift: number,
): void {
  if (shift < 1) return;
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.globalCompositeOperation = 'screen';
  // Red channel shifted left
  ctx.drawImage(imageSrc, -shift, 0);
  // Blue channel shifted right
  ctx.drawImage(imageSrc, shift, 0);
  ctx.restore();
}
