'use client';

/**
 * HeroCanvas — Interactive 3-layer canvas hero effect
 *
 * Layer 1: Ambient particle grid (illuminates near cursor with brand colors)
 * Layer 2: Desaturated image sliced into vertical strips with gentle oscillation
 * Layer 3: Mouse spotlight that reveals full-color image
 *
 * Inspired by base.org homepage interaction pattern.
 */

import { useRef, useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import Image from 'next/image';

// ── Constants ──────────────────────────────────────────────────────────────────

const NUM_STRIPS = 100;
const STRIP_GAP = 0.3; // px between strips
const STRIP_PERIOD = 5; // seconds for full sine cycle
const STRIP_AMPLITUDE = 3; // max px offset

const SPOTLIGHT_RADIUS = 70;
const SPOTLIGHT_FADE_DELAY = 1000; // ms before fade starts
const SPOTLIGHT_FADE_DURATION = 500; // ms to fully fade

const TRAIL_DURATION = 3000; // ms trail points live
const TRAIL_SAMPLE_INTERVAL = 30; // ms between trail samples

const DOT_SPACING = 20;
const DOT_RADIUS = 1.5;
const DOT_INFLUENCE = 150; // px range for cursor illumination

const DPR_CAP = 2;

// Brand colors as RGB arrays
const COLORS = {
  light: {
    dotBase: { r: 180, g: 190, b: 200, a: 0.25 },
    highlight1: { r: 27, g: 58, b: 107 },   // am-blue
    highlight2: { r: 232, g: 131, b: 42 },   // am-orange
    imageBaseOpacity: 0.18,
  },
  dark: {
    dotBase: { r: 50, g: 70, b: 100, a: 0.3 },
    highlight1: { r: 43, g: 94, b: 167 },   // am-blue-light
    highlight2: { r: 245, g: 166, b: 35 },  // am-orange-light
    imageBaseOpacity: 0.13,
  },
};

// ── Types ──────────────────────────────────────────────────────────────────────

interface Dot {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  vx: number;
  vy: number;
  baseAlpha: number;
  colorIndex: number; // 0 = highlight1, 1 = highlight2
}

interface TrailPoint {
  x: number;
  y: number;
  time: number;
}

interface MouseState {
  x: number;
  y: number;
  active: boolean;
  lastMoveTime: number;
  spotlightOpacity: number;
  trail: TrailPoint[];
  lastTrailSample: number;
}

interface HeroCanvasProps {
  imageSrc: string;
  className?: string;
  /** Render as a fixed full-viewport background (events tracked on window) */
  fixed?: boolean;
}

// ── Helper: Create desaturated image on offscreen canvas ───────────────────────

function createDesaturatedCanvas(
  img: HTMLImageElement,
  isDark: boolean,
): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  const ctx = c.getContext('2d');
  if (!ctx) return c;

  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, c.width, c.height);
  const d = imageData.data;

  const baseOpacity = isDark
    ? COLORS.dark.imageBaseOpacity
    : COLORS.light.imageBaseOpacity;

  for (let i = 0; i < d.length; i += 4) {
    // Weighted luminance (ITU-R BT.709)
    const lum = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
    // Slight tint: cool blue for dark, warm for light
    if (isDark) {
      d[i] = lum * 0.85;           // R
      d[i + 1] = lum * 0.9;       // G
      d[i + 2] = lum * 1.1;       // B
    } else {
      d[i] = lum * 1.05;          // R
      d[i + 1] = lum * 1.0;       // G
      d[i + 2] = lum * 0.9;       // B
    }
    d[i + 3] = Math.round(d[i + 3] * baseOpacity);
  }
  ctx.putImageData(imageData, 0, 0);
  return c;
}

// ── Helper: Generate dot grid ──────────────────────────────────────────────────

function createDotGrid(w: number, h: number): Dot[] {
  const dots: Dot[] = [];
  const cols = Math.ceil(w / DOT_SPACING);
  const rows = Math.ceil(h / DOT_SPACING);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * DOT_SPACING + DOT_SPACING / 2;
      const y = r * DOT_SPACING + DOT_SPACING / 2;
      dots.push({
        x, y, baseX: x, baseY: y,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        baseAlpha: 0.15 + Math.random() * 0.15,
        colorIndex: Math.random() > 0.5 ? 1 : 0,
      });
    }
  }
  return dots;
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function HeroCanvas({ imageSrc, className, fixed }: HeroCanvasProps) {
  const [mounted, setMounted] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const desaturatedRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number>(0);
  const mouseRef = useRef<MouseState>({
    x: 0, y: 0, active: false, lastMoveTime: 0, spotlightOpacity: 0,
    trail: [], lastTrailSample: 0,
  });
  const spotlightCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const stripPhasesRef = useRef<number[]>(
    Array.from({ length: NUM_STRIPS }, () => Math.random() * Math.PI * 2),
  );
  const spotlightSizeRef = useRef({ width: 0, height: 0 });
  const dotsRef = useRef<Dot[]>([]);
  const sizeRef = useRef({ width: 0, height: 0 });
  const visibleRef = useRef(false);
  const resizeTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const reducedMotionRef = useRef(false);
  const fixedRef = useRef(!!fixed);
  const isDarkRef = useRef(isDark);

  // Keep isDarkRef in sync
  isDarkRef.current = isDark;

  // ── Mount ────────────────────────────────────────────────────────────────

  useEffect(() => { setMounted(true); }, []);

  // ── Reduced motion ───────────────────────────────────────────────────────

  useEffect(() => {
    if (typeof window !== 'undefined') {
      reducedMotionRef.current = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches;
    }
  }, []);

  // ── Image loading ────────────────────────────────────────────────────────

  useEffect(() => {
    if (!mounted) return;
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
    img.onload = () => {
      imageRef.current = img;
      desaturatedRef.current = createDesaturatedCanvas(img, isDarkRef.current);
      setIsLoaded(true);
    };
    img.onerror = () => setHasError(true);
  }, [mounted, imageSrc]);

  // ── Re-create desaturated version on theme change ────────────────────────

  useEffect(() => {
    if (imageRef.current && isLoaded) {
      desaturatedRef.current = createDesaturatedCanvas(
        imageRef.current,
        isDark,
      );
    }
  }, [isDark, isLoaded]);

  // ── Canvas sizing + dot grid + resize ────────────────────────────────────

  useEffect(() => {
    if (!mounted) return;

    function handleResize() {
      clearTimeout(resizeTimerRef.current);
      resizeTimerRef.current = setTimeout(() => {
        const container = containerRef.current;
        const canvas = canvasRef.current;
        if (!container || !canvas) return;

        const rect = container.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);

        canvas.width = Math.round(rect.width * dpr);
        canvas.height = Math.round(rect.height * dpr);
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;

        const ctx = canvas.getContext('2d');
        if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        sizeRef.current = { width: rect.width, height: rect.height };
        dotsRef.current = createDotGrid(rect.width, rect.height);
      }, 100);
    }

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimerRef.current);
    };
  }, [mounted]);

  // ── IntersectionObserver ─────────────────────────────────────────────────

  useEffect(() => {
    if (!mounted || !containerRef.current) return;
    if (fixedRef.current) {
      visibleRef.current = true;
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => { visibleRef.current = entry.isIntersecting; },
      { threshold: 0.05 },
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [mounted]);

  // ── Event listeners ──────────────────────────────────────────────────────

  useEffect(() => {
    if (!mounted) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const isFixed = fixedRef.current;

    function addTrailPoint(x: number, y: number) {
      const now = performance.now();
      const m = mouseRef.current;
      if (now - m.lastTrailSample >= TRAIL_SAMPLE_INTERVAL) {
        m.trail.push({ x, y, time: now });
        m.lastTrailSample = now;
      }
    }

    // In fixed mode clientX/Y map directly to canvas coords (fills viewport).
    // In normal mode we subtract the canvas bounding rect offset.
    function coords(clientX: number, clientY: number): [number, number] {
      if (isFixed) return [clientX, clientY];
      const rect = canvas!.getBoundingClientRect();
      return [clientX - rect.left, clientY - rect.top];
    }

    function onMouseMove(e: MouseEvent) {
      const [mx, my] = coords(e.clientX, e.clientY);
      mouseRef.current.x = mx;
      mouseRef.current.y = my;
      mouseRef.current.active = true;
      mouseRef.current.lastMoveTime = performance.now();
      mouseRef.current.spotlightOpacity = 1;
      addTrailPoint(mx, my);
    }
    function onMouseLeave() {
      const m = mouseRef.current;
      m.trail.push({ x: m.x, y: m.y, time: performance.now() });
      m.active = false;
      m.lastMoveTime = performance.now();
    }
    function onTouchStart(e: TouchEvent) {
      const t = e.touches[0];
      const [mx, my] = coords(t.clientX, t.clientY);
      mouseRef.current.x = mx;
      mouseRef.current.y = my;
      mouseRef.current.active = true;
      mouseRef.current.lastMoveTime = performance.now();
      mouseRef.current.spotlightOpacity = 1;
      addTrailPoint(mx, my);
    }
    function onTouchMove(e: TouchEvent) {
      const t = e.touches[0];
      const [mx, my] = coords(t.clientX, t.clientY);
      mouseRef.current.x = mx;
      mouseRef.current.y = my;
      mouseRef.current.lastMoveTime = performance.now();
      addTrailPoint(mx, my);
    }
    function onTouchEnd() {
      const m = mouseRef.current;
      m.trail.push({ x: m.x, y: m.y, time: performance.now() });
      m.active = false;
      m.lastMoveTime = performance.now() - SPOTLIGHT_FADE_DELAY + 200;
    }

    // Fixed: listen on window so spotlight works even over page content.
    // Normal: listen directly on the canvas element.
    const moveTarget: EventTarget = isFixed ? window : canvas;
    const leaveTarget: EventTarget = isFixed ? document.documentElement : canvas;

    moveTarget.addEventListener('mousemove', onMouseMove as EventListener);
    leaveTarget.addEventListener('mouseleave', onMouseLeave as EventListener);
    moveTarget.addEventListener('touchstart', onTouchStart as EventListener, { passive: true });
    moveTarget.addEventListener('touchmove', onTouchMove as EventListener, { passive: true });
    moveTarget.addEventListener('touchend', onTouchEnd as EventListener, { passive: true });

    return () => {
      moveTarget.removeEventListener('mousemove', onMouseMove as EventListener);
      leaveTarget.removeEventListener('mouseleave', onMouseLeave as EventListener);
      moveTarget.removeEventListener('touchstart', onTouchStart as EventListener);
      moveTarget.removeEventListener('touchmove', onTouchMove as EventListener);
      moveTarget.removeEventListener('touchend', onTouchEnd as EventListener);
    };
  }, [mounted]);

  // ── Animation loop ───────────────────────────────────────────────────────

  useEffect(() => {
    if (!isLoaded) return;

    function renderFrame(timestamp: number) {
      animFrameRef.current = requestAnimationFrame(renderFrame);

      if (!visibleRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!ctx || !canvas) return;

      const { width: w, height: h } = sizeRef.current;
      if (w === 0 || h === 0) return;

      ctx.clearRect(0, 0, w, h);

      // Update spotlight opacity
      const m = mouseRef.current;
      if (m.active) {
        // Cursor is over canvas — always full brightness, even when stationary
        m.spotlightOpacity = 1;
      } else {
        // Cursor has left — fade after delay
        const elapsed = performance.now() - m.lastMoveTime;
        if (elapsed > SPOTLIGHT_FADE_DELAY) {
          const fadeProgress = Math.min(
            (elapsed - SPOTLIGHT_FADE_DELAY) / SPOTLIGHT_FADE_DURATION,
            1,
          );
          m.spotlightOpacity = Math.max(0, 1 - fadeProgress);
        }
      }

      const time = timestamp / 1000;
      const dark = isDarkRef.current;
      const palette = dark ? COLORS.dark : COLORS.light;

      // Layer 1: Particle grid
      renderDots(ctx, w, h, palette, m);

      // Layer 2: Image strips (desaturated)
      renderStrips(ctx, time, w, h);

      // Prune old trail points
      const now = performance.now();
      m.trail = m.trail.filter(p => now - p.time < TRAIL_DURATION);

      // Layer 3: Spotlight reveal (current position + trail)
      const hasTrail = m.trail.length > 0;
      if (m.spotlightOpacity > 0.01 || hasTrail) {
        renderSpotlight(ctx, time, w, h, m);
      }
    }

    animFrameRef.current = requestAnimationFrame(renderFrame);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isLoaded]);

  // ── Layer 1: Dot grid ────────────────────────────────────────────────────

  function renderDots(
    ctx: CanvasRenderingContext2D,
    w: number, h: number,
    palette: typeof COLORS.light,
    m: MouseState,
  ) {
    const dots = dotsRef.current;
    const reduced = reducedMotionRef.current;

    for (let i = 0; i < dots.length; i++) {
      const dot = dots[i];

      // Drift (skip if reduced motion)
      if (!reduced) {
        dot.x += dot.vx;
        dot.y += dot.vy;
        // Soft bounce back to base
        dot.x += (dot.baseX - dot.x) * 0.01;
        dot.y += (dot.baseY - dot.y) * 0.01;
      }

      // Calculate influence from cursor
      const dx = m.x - dot.x;
      const dy = m.y - dot.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const influence = m.active && dist < DOT_INFLUENCE
        ? 1 - dist / DOT_INFLUENCE
        : 0;

      let r: number, g: number, b: number, a: number;

      if (influence > 0) {
        const hl = dot.colorIndex === 0 ? palette.highlight1 : palette.highlight2;
        const base = palette.dotBase;
        const t = influence * influence; // ease-in
        r = base.r + (hl.r - base.r) * t;
        g = base.g + (hl.g - base.g) * t;
        b = base.b + (hl.b - base.b) * t;
        a = dot.baseAlpha + (0.9 - dot.baseAlpha) * t;
      } else {
        r = palette.dotBase.r;
        g = palette.dotBase.g;
        b = palette.dotBase.b;
        a = dot.baseAlpha;
      }

      ctx.beginPath();
      ctx.arc(dot.x, dot.y, DOT_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r | 0},${g | 0},${b | 0},${a})`;
      ctx.fill();
    }
  }

  // ── Layer 2 & 3 shared: calculate image draw geometry ────────────────────

  function getImageGeometry(w: number, h: number) {
    const img = imageRef.current;
    if (!img) return null;

    const areaW = w;
    const areaH = h;
    const imgAspect = img.naturalWidth / img.naturalHeight;
    const areaAspect = areaW / areaH;

    let drawW: number, drawH: number;
    if (imgAspect > areaAspect) {
      drawW = areaW * 0.95;
      drawH = drawW / imgAspect;
    } else {
      drawH = areaH * 0.9;
      drawW = drawH * imgAspect;
    }

    const drawX = (areaW - drawW) / 2;
    let drawY = (areaH - drawH) / 2;

    // Desktop: nudge down to clear the navbar area
    if (fixedRef.current && w >= 768) {
      drawY += 108;
    }

    return { drawX, drawY, drawW, drawH };
  }

  // Mobile fixed mode: 3 image copies at staggered positions
  function getImagePositions(w: number, h: number) {
    const base = getImageGeometry(w, h);
    if (!base) return [];

    if (fixedRef.current && w < 768) {
      return [
        { ...base, drawX: base.drawX - 45 },
        { ...base, drawX: base.drawX + 25 - 45, drawY: base.drawY - base.drawH - 20 },
        { ...base, drawX: base.drawX + 25, drawY: base.drawY + 200 },
      ];
    }

    return [base];
  }

  // ── Layer 2: Desaturated image strips ────────────────────────────────────

  function renderStrips(
    ctx: CanvasRenderingContext2D,
    time: number,
    w: number, h: number,
  ) {
    const desat = desaturatedRef.current;
    const img = imageRef.current;
    if (!desat || !img) return;

    const positions = getImagePositions(w, h);
    const reduced = reducedMotionRef.current;

    for (const { drawX, drawY, drawW, drawH } of positions) {
      const stripW = drawW / NUM_STRIPS;
      const srcStripW = img.naturalWidth / NUM_STRIPS;

      for (let i = 0; i < NUM_STRIPS; i++) {
        const phase = stripPhasesRef.current[i];
        const yOff = reduced
          ? 0
          : Math.sin(time * (2 * Math.PI / STRIP_PERIOD) + phase) * STRIP_AMPLITUDE;

        ctx.drawImage(
          desat,
          Math.round(i * srcStripW), 0,
          Math.round(srcStripW), img.naturalHeight,
          drawX + i * (stripW + STRIP_GAP), drawY + yOff,
          stripW, drawH,
        );
      }
    }
  }

  // ── Layer 3: Spotlight reveal with smooth gradient + trail ───────────────

  function ensureTempCanvases(w: number, h: number) {
    if (!spotlightCanvasRef.current ||
        spotlightSizeRef.current.width !== w ||
        spotlightSizeRef.current.height !== h) {
      const c1 = document.createElement('canvas');
      c1.width = w;
      c1.height = h;
      spotlightCanvasRef.current = c1;
      const c2 = document.createElement('canvas');
      c2.width = w;
      c2.height = h;
      maskCanvasRef.current = c2;
      spotlightSizeRef.current = { width: w, height: h };
    }
    return {
      stripCtx: spotlightCanvasRef.current.getContext('2d'),
      maskCtx: maskCanvasRef.current!.getContext('2d'),
    };
  }

  function drawColorStripsOnCtx(
    ctx: CanvasRenderingContext2D,
    time: number,
    w: number, h: number,
  ) {
    const img = imageRef.current;
    if (!img) return;

    const positions = getImagePositions(w, h);
    const reduced = reducedMotionRef.current;

    for (const { drawX, drawY, drawW, drawH } of positions) {
      const stripW = drawW / NUM_STRIPS;
      const srcStripW = img.naturalWidth / NUM_STRIPS;

      for (let i = 0; i < NUM_STRIPS; i++) {
        const phase = stripPhasesRef.current[i];
        const yOff = reduced
          ? 0
          : Math.sin(time * (2 * Math.PI / STRIP_PERIOD) + phase) * STRIP_AMPLITUDE;

        ctx.drawImage(
          img,
          Math.round(i * srcStripW), 0,
          Math.round(srcStripW), img.naturalHeight,
          drawX + i * (stripW + STRIP_GAP), drawY + yOff,
          stripW, drawH,
        );
      }
    }
  }

  function renderSpotlight(
    ctx: CanvasRenderingContext2D,
    time: number,
    w: number, h: number,
    m: MouseState,
  ) {
    const img = imageRef.current;
    if (!img) return;

    const { stripCtx, maskCtx } = ensureTempCanvases(w, h);
    if (!stripCtx || !maskCtx) return;
    const stripCanvas = spotlightCanvasRef.current!;
    const maskCanvas = maskCanvasRef.current!;

    // ── Step 1: Draw ALL color strips on strip canvas (source-over) ──
    stripCtx.globalCompositeOperation = 'source-over';
    stripCtx.clearRect(0, 0, w, h);
    drawColorStripsOnCtx(stripCtx, time, w, h);

    // ── Step 2: Build gradient mask on mask canvas (source-over) ─────
    // All gradients accumulate additively on a separate canvas.
    maskCtx.globalCompositeOperation = 'source-over';
    maskCtx.clearRect(0, 0, w, h);

    const now = performance.now();

    // Trail point gradients (older = more transparent)
    for (let i = 0; i < m.trail.length; i++) {
      const p = m.trail[i];
      const age = now - p.time;
      const life = 1 - age / TRAIL_DURATION;
      if (life <= 0) continue;

      const alpha = life * life * 0.7;
      const radius = SPOTLIGHT_RADIUS * (0.6 + 0.4 * life);

      const grad = maskCtx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius);
      grad.addColorStop(0, `rgba(255,255,255,${alpha})`);
      grad.addColorStop(0.5, `rgba(255,255,255,${alpha * 0.4})`);
      grad.addColorStop(0.85, `rgba(255,255,255,${alpha * 0.08})`);
      grad.addColorStop(1, 'rgba(255,255,255,0)');

      maskCtx.fillStyle = grad;
      maskCtx.fillRect(p.x - radius, p.y - radius, radius * 2, radius * 2);
    }

    // Current cursor spotlight (brightest)
    if (m.spotlightOpacity > 0.01) {
      const grad = maskCtx.createRadialGradient(m.x, m.y, 0, m.x, m.y, SPOTLIGHT_RADIUS);
      grad.addColorStop(0, `rgba(255,255,255,${m.spotlightOpacity})`);
      grad.addColorStop(0.4, `rgba(255,255,255,${m.spotlightOpacity * 0.55})`);
      grad.addColorStop(0.7, `rgba(255,255,255,${m.spotlightOpacity * 0.15})`);
      grad.addColorStop(0.9, `rgba(255,255,255,${m.spotlightOpacity * 0.03})`);
      grad.addColorStop(1, 'rgba(255,255,255,0)');

      maskCtx.fillStyle = grad;
      maskCtx.fillRect(m.x - SPOTLIGHT_RADIUS, m.y - SPOTLIGHT_RADIUS,
        SPOTLIGHT_RADIUS * 2, SPOTLIGHT_RADIUS * 2);
    }

    // ── Step 3: Apply mask to strips (single destination-in operation) ─
    // destination-in: keep existing strips only where mask has opacity.
    // This is ONE drawImage call, so all strips are masked at once.
    stripCtx.globalCompositeOperation = 'destination-in';
    stripCtx.drawImage(maskCanvas, 0, 0);

    // ── Step 4: Composite result onto main canvas ────────────────────
    stripCtx.globalCompositeOperation = 'source-over';
    ctx.drawImage(stripCanvas, 0, 0);
  }

  // ── Render ───────────────────────────────────────────────────────────────

  const isFixed = fixedRef.current;

  if (!mounted) {
    return (
      <div
        className={
          isFixed
            ? `fixed inset-0 w-screen h-screen pointer-events-none ${className || ''}`
            : `w-full h-full ${className || ''}`
        }
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className={
        isFixed
          ? `fixed inset-0 w-screen h-screen pointer-events-none ${className || ''}`
          : `relative w-full h-full ${className || ''}`
      }
      style={isFixed ? { zIndex: 0 } : undefined}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ display: isLoaded ? 'block' : 'none' }}
      />
      {hasError && !isFixed && (
        <div className="w-full h-full flex items-center justify-center opacity-20">
          <Image
            src={imageSrc}
            alt="Autos MALL"
            width={600}
            height={330}
            className="w-full h-auto"
          />
        </div>
      )}
    </div>
  );
}
