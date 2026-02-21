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

const NUM_STRIPS = 50;
const STRIP_GAP = 0.5; // px between strips
const STRIP_PERIOD = 5; // seconds for full sine cycle
const STRIP_AMPLITUDE = 3; // max px offset

const SPOTLIGHT_RADIUS = 130;
const SPOTLIGHT_RINGS = 8;
const SPOTLIGHT_FADE_DELAY = 1000; // ms before fade starts
const SPOTLIGHT_FADE_DURATION = 500; // ms to fully fade

const DOT_SPACING = 40;
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

interface MouseState {
  x: number;
  y: number;
  active: boolean;
  lastMoveTime: number;
  spotlightOpacity: number;
}

interface HeroCanvasProps {
  imageSrc: string;
  className?: string;
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

export default function HeroCanvas({ imageSrc, className }: HeroCanvasProps) {
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
  });
  const stripPhasesRef = useRef<number[]>(
    Array.from({ length: NUM_STRIPS }, () => Math.random() * Math.PI * 2),
  );
  const dotsRef = useRef<Dot[]>([]);
  const sizeRef = useRef({ width: 0, height: 0 });
  const visibleRef = useRef(false);
  const resizeTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const reducedMotionRef = useRef(false);
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

    function onMouseMove(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
      mouseRef.current.active = true;
      mouseRef.current.lastMoveTime = performance.now();
      mouseRef.current.spotlightOpacity = 1;
    }
    function onMouseLeave() {
      mouseRef.current.active = false;
    }
    function onTouchStart(e: TouchEvent) {
      const rect = canvas!.getBoundingClientRect();
      const t = e.touches[0];
      mouseRef.current.x = t.clientX - rect.left;
      mouseRef.current.y = t.clientY - rect.top;
      mouseRef.current.active = true;
      mouseRef.current.lastMoveTime = performance.now();
      mouseRef.current.spotlightOpacity = 1;
    }
    function onTouchMove(e: TouchEvent) {
      const rect = canvas!.getBoundingClientRect();
      const t = e.touches[0];
      mouseRef.current.x = t.clientX - rect.left;
      mouseRef.current.y = t.clientY - rect.top;
      mouseRef.current.lastMoveTime = performance.now();
    }
    function onTouchEnd() {
      mouseRef.current.active = false;
      // Trigger faster fade on touch release
      mouseRef.current.lastMoveTime = performance.now() - SPOTLIGHT_FADE_DELAY + 200;
    }

    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseleave', onMouseLeave);
    canvas.addEventListener('touchstart', onTouchStart, { passive: true });
    canvas.addEventListener('touchmove', onTouchMove, { passive: true });
    canvas.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseleave', onMouseLeave);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onTouchEnd);
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
      const elapsed = performance.now() - m.lastMoveTime;
      if (elapsed > SPOTLIGHT_FADE_DELAY) {
        const fadeProgress = Math.min(
          (elapsed - SPOTLIGHT_FADE_DELAY) / SPOTLIGHT_FADE_DURATION,
          1,
        );
        m.spotlightOpacity = Math.max(0, 1 - fadeProgress);
      } else if (m.active) {
        m.spotlightOpacity = 1;
      }

      const time = timestamp / 1000;
      const dark = isDarkRef.current;
      const palette = dark ? COLORS.dark : COLORS.light;

      // Layer 1: Particle grid
      renderDots(ctx, w, h, palette, m);

      // Layer 2: Image strips (desaturated)
      renderStrips(ctx, time, w, h);

      // Layer 3: Spotlight reveal
      if (m.spotlightOpacity > 0.01) {
        renderSpotlight(ctx, time, w, h, m, palette);
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

    // Image occupies right portion of canvas
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
    const drawY = (areaH - drawH) / 2;

    return { drawX, drawY, drawW, drawH };
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

    const geo = getImageGeometry(w, h);
    if (!geo) return;

    const { drawX, drawY, drawW, drawH } = geo;
    const stripW = drawW / NUM_STRIPS;
    const srcStripW = img.naturalWidth / NUM_STRIPS;
    const reduced = reducedMotionRef.current;

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

  // ── Layer 3: Spotlight reveal ────────────────────────────────────────────

  function renderSpotlight(
    ctx: CanvasRenderingContext2D,
    time: number,
    w: number, h: number,
    m: MouseState,
    palette: typeof COLORS.light,
  ) {
    const img = imageRef.current;
    if (!img) return;

    const geo = getImageGeometry(w, h);
    if (!geo) return;

    const { drawX, drawY, drawW, drawH } = geo;
    const stripW = drawW / NUM_STRIPS;
    const srcStripW = img.naturalWidth / NUM_STRIPS;
    const reduced = reducedMotionRef.current;

    // Draw full-color strips in concentric rings (soft edge)
    for (let ring = SPOTLIGHT_RINGS - 1; ring >= 0; ring--) {
      const ringRadius = SPOTLIGHT_RADIUS * ((ring + 1) / SPOTLIGHT_RINGS);
      const ringAlpha = m.spotlightOpacity * (1 - ring / SPOTLIGHT_RINGS);

      if (ringAlpha < 0.01) continue;

      ctx.save();
      ctx.beginPath();
      ctx.arc(m.x, m.y, ringRadius, 0, Math.PI * 2);
      ctx.clip();
      ctx.globalAlpha = ringAlpha;

      // Draw full-color strips at same positions as Layer 2
      for (let i = 0; i < NUM_STRIPS; i++) {
        const phase = stripPhasesRef.current[i];
        const yOff = reduced
          ? 0
          : Math.sin(time * (2 * Math.PI / STRIP_PERIOD) + phase) * STRIP_AMPLITUDE;

        const destX = drawX + i * (stripW + STRIP_GAP);

        // Only draw strips that could intersect the ring
        if (destX + stripW < m.x - ringRadius || destX > m.x + ringRadius) continue;

        ctx.drawImage(
          img,
          Math.round(i * srcStripW), 0,
          Math.round(srcStripW), img.naturalHeight,
          destX, drawY + yOff,
          stripW, drawH,
        );
      }

      ctx.restore();
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────

  if (!mounted) {
    return <div className={`w-full h-full ${className || ''}`} />;
  }

  return (
    <div ref={containerRef} className={`relative w-full h-full ${className || ''}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ display: isLoaded ? 'block' : 'none' }}
      />
      {hasError && (
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
