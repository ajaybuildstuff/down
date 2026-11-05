"use client";

import React, { useEffect, useRef, useCallback } from "react";

interface Dot {
  originX: number;
  originY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  phase: number;
  pulseSpeed: number;
  glowIntensity: number;
  colorIndex: number;
}

interface Shockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  strength: number;
}

// Colir-inspired non-default vibrant RGB palette
const COLIR_ACTIVE_COLORS = [
  "217, 249, 157", // Soft Lime (#d9f99d)
  "56, 189, 248",  // Electric Cyan (#38bdf8)
  "59, 130, 246",  // Royal Blue (#3b82f6)
  "251, 146, 60",  // Warm Coral-Orange (#fb923c)
];

export const DotDistortionShader: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dotsRef = useRef<Dot[]>([]);
  const shockwavesRef = useRef<Shockwave[]>([]);
  const pointerRef = useRef({
    x: -9999,
    y: -9999,
    vx: 0,
    vy: 0,
    speed: 0,
    isActive: false,
  });

  const initGrid = useCallback((width: number, height: number) => {
    const isMobile = width < 768;
    const dotGap = isMobile ? 26 : 22;
    const dots: Dot[] = [];
    const cols = Math.floor(width / dotGap);
    const rows = Math.floor(height / dotGap);
    const offsetX = (width - (cols - 1) * dotGap) / 2;
    const offsetY = (height - (rows - 1) * dotGap) / 2;

    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const x = offsetX + i * dotGap;
        const y = offsetY + j * dotGap;
        dots.push({
          originX: x,
          originY: y,
          x,
          y,
          vx: 0,
          vy: 0,
          phase: Math.random() * Math.PI * 2,
          pulseSpeed: 0.015 + Math.random() * 0.02,
          glowIntensity: 0,
          colorIndex: (i + j) % COLIR_ACTIVE_COLORS.length,
        });
      }
    }
    dotsRef.current = dots;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;

    const handleResize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = parent.getBoundingClientRect();

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initGrid(rect.width, rect.height);
    };

    const updatePointer = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const p = pointerRef.current;

      if (p.isActive) {
        p.vx = x - p.x;
        p.vy = y - p.y;
        p.speed = Math.min(Math.hypot(p.vx, p.vy), 44);
      }
      p.x = x;
      p.y = y;
      p.isActive = true;
    };

    const triggerShockwave = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      shockwavesRef.current.push({
        x: clientX - rect.left,
        y: clientY - rect.top,
        radius: 0,
        maxRadius: window.innerWidth < 768 ? 250 : 400,
        strength: 17,
      });
    };

    const onMouseMove = (e: MouseEvent) => updatePointer(e.clientX, e.clientY);
    const onMouseLeave = () => {
      pointerRef.current.isActive = false;
      pointerRef.current.x = -9999;
      pointerRef.current.y = -9999;
      pointerRef.current.speed = 0;
    };
    const onClick = (e: MouseEvent) => triggerShockwave(e.clientX, e.clientY);

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const t = e.touches[0];
        updatePointer(t.clientX, t.clientY);
        triggerShockwave(t.clientX, t.clientY);
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const t = e.touches[0];
        updatePointer(t.clientX, t.clientY);
      }
    };
    const onTouchEnd = () => onMouseLeave();

    handleResize();
    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("mouseleave", onMouseLeave);
    window.addEventListener("click", onClick);
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);

      const isMobile = rect.width < 768;
      const influenceRadius = isMobile ? 95 : 145;
      const radiusSq = influenceRadius * influenceRadius;
      const distortionStrength = isMobile ? 22 : 30;
      const springStiffness = 0.068;
      const damping = 0.82;
      const baseDotSize = isMobile ? 1.25 : 1.35;

      const p = pointerRef.current;
      p.speed *= 0.9;

      const waves = shockwavesRef.current;
      for (let w = waves.length - 1; w >= 0; w--) {
        waves[w].radius += 8.5;
        waves[w].strength *= 0.95;
        if (waves[w].radius > waves[w].maxRadius) {
          waves.splice(w, 1);
        }
      }

      const dots = dotsRef.current;
      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];

        dot.phase += dot.pulseSpeed;
        if (Math.random() < 0.0005 && dot.glowIntensity < 0.1) {
          dot.glowIntensity = 1;
        }
        dot.glowIntensity *= 0.96;

        let proximityFactor = 0;

        if (p.isActive) {
          const dx = dot.x - p.x;
          const dy = dot.y - p.y;
          const distSq = dx * dx + dy * dy;

          if (distSq < radiusSq && distSq > 0.001) {
            const dist = Math.sqrt(distSq);
            const force = Math.pow(1 - dist / influenceRadius, 2);
            const angle = Math.atan2(dy, dx);
            const velocityBoost = 1 + p.speed * 0.038;
            const push = force * distortionStrength * velocityBoost * 0.14;

            dot.vx += Math.cos(angle) * push + p.vx * force * 0.035;
            dot.vy += Math.sin(angle) * push + p.vy * force * 0.035;
            proximityFactor = force;
          }
        }

        for (let w = 0; w < waves.length; w++) {
          const wave = waves[w];
          const dx = dot.x - wave.x;
          const dy = dot.y - wave.y;
          const dist = Math.hypot(dx, dy);
          const bandWidth = 42;
          const diff = Math.abs(dist - wave.radius);

          if (diff < bandWidth && dist > 0) {
            const waveForce = (1 - diff / bandWidth) * wave.strength * 0.14;
            dot.vx += (dx / dist) * waveForce;
            dot.vy += (dy / dist) * waveForce;
            proximityFactor = Math.max(proximityFactor, 1 - diff / bandWidth);
          }
        }

        const springX = (dot.originX - dot.x) * springStiffness;
        const springY = (dot.originY - dot.y) * springStiffness;

        dot.vx = (dot.vx + springX) * damping;
        dot.vy = (dot.vy + springY) * damping;
        dot.x += dot.vx;
        dot.y += dot.vy;

        const displacement = Math.hypot(dot.x - dot.originX, dot.y - dot.originY);
        const displacementGlow = Math.min(displacement / 16, 1);
        const activeBlend = Math.max(proximityFactor, displacementGlow, dot.glowIntensity);

        const breathingAlpha = 0.22 + 0.14 * Math.sin(dot.phase);
        const finalAlpha = Math.min(breathingAlpha + activeBlend * 0.72, 1);
        const finalRadius = baseDotSize + activeBlend * 1.15 + 0.18 * Math.sin(dot.phase);

        ctx.beginPath();
        ctx.arc(dot.x, dot.y, Math.max(0.5, finalRadius), 0, Math.PI * 2);

        if (activeBlend > 0.14) {
          ctx.fillStyle = `rgba(${COLIR_ACTIVE_COLORS[dot.colorIndex]}, ${finalAlpha})`;
        } else {
          ctx.fillStyle = `rgba(148, 163, 184, ${finalAlpha})`;
        }
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseleave", onMouseLeave);
      window.removeEventListener("click", onClick);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [initGrid]);

  return (
    <>
      <style>{`
        @keyframes floatSlow {
          0%, 100% { transform: translate3d(-50%, 0px, 0) scale(1); }
          50% { transform: translate3d(-48%, 18px, 0) scale(1.06); }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.55; }
          50% { opacity: 0.9; }
        }
        .animate-mesh-float {
          animation: floatSlow 14s ease-in-out infinite;
        }
        .animate-pulse-glow {
          animation: pulseGlow 6s ease-in-out infinite;
        }
      `}</style>

      {/* Colir-Inspired Ambient Mesh Gradients */}
      <div className="pointer-events-none fixed -top-44 left-1/2 z-0 h-[460px] w-[92vw] max-w-[820px] rounded-full bg-gradient-to-tr from-[#d9f99d]/20 via-[#00f5d4]/20 to-[#2563eb]/25 blur-[125px] animate-mesh-float" />
      <div className="pointer-events-none fixed -bottom-48 left-1/4 z-0 h-[360px] w-[70vw] max-w-[540px] rounded-full bg-gradient-to-tr from-[#f97316]/15 via-[#eab308]/10 to-transparent blur-[130px] animate-pulse-glow" />
      <div className="pointer-events-none fixed -bottom-40 right-0 z-0 h-[420px] w-[70vw] max-w-[580px] rounded-full bg-gradient-to-tl from-[#2563eb]/25 via-[#38bdf8]/15 to-transparent blur-[130px]" />

      {/* Interactive Physics Dot Distortion Canvas */}
      <canvas
        ref={canvasRef}
        className="pointer-events-auto fixed inset-0 z-0 h-full w-full"
      />

      {/* Soft Radial Vignette for Sharp Foreground Contrast */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_center,transparent_20%,#050609_92%)]" />
    </>
  );
};
