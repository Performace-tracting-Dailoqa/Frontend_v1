"use client";

import React, { useEffect, useRef } from "react";
import { motion, useSpring, useMotionValue } from "framer-motion";

interface Particle {
  x: number;
  y: number;
  radius: number;
  baseX: number;
  baseY: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  pulseSpeed: number;
  pulseVal: number;
}

export default function DailoqaInteractiveBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mousePos = useRef({ x: -1000, y: -1000, vx: 0, vy: 0 });
  const lastMousePos = useRef({ x: -1000, y: -1000 });

  // Spring-smoothed mouse coordinates for ambient Dailoqa torch
  const torchX = useMotionValue(-1000);
  const torchY = useMotionValue(-1000);
  const smoothX = useSpring(torchX, { damping: 28, stiffness: 220 });
  const smoothY = useSpring(torchY, { damping: 28, stiffness: 220 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    // Signature Dailoqa palette: Electric Indigo, Vibrant Violet, Sky Cyan, Soft Lavender
    const colors = [
      "rgba(75, 46, 245, ",   // Dailoqa Electric Indigo #4B2EF5
      "rgba(168, 85, 247, ",  // Radiant Violet #a855f7
      "rgba(56, 189, 248, ",  // Cyan Glow #38bdf8
      "rgba(195, 192, 255, ", // Lavender #c3c0ff
    ];

    const particleCount = Math.min(Math.floor(window.innerWidth / 24), 55);
    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      const px = Math.random() * width;
      const py = Math.random() * height;
      particles.push({
        x: px,
        y: py,
        baseX: px,
        baseY: py,
        radius: Math.random() * 2.2 + 1.2,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.6 + 0.25,
        pulseSpeed: Math.random() * 0.03 + 0.01,
        pulseVal: Math.random() * Math.PI * 2,
      });
    }

    const handleMouseMove = (e: MouseEvent) => {
      const currentX = e.clientX;
      const currentY = e.clientY;

      mousePos.current.vx = currentX - lastMousePos.current.x;
      mousePos.current.vy = currentY - lastMousePos.current.y;
      mousePos.current.x = currentX;
      mousePos.current.y = currentY;

      lastMousePos.current = { x: currentX, y: currentY };

      torchX.set(currentX);
      torchY.set(currentY);
    };

    window.addEventListener("mousemove", handleMouseMove);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const mx = mousePos.current.x;
      const my = mousePos.current.y;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Pulse opacity subtly
        p.pulseVal += p.pulseSpeed;
        const currentAlpha = p.alpha + Math.sin(p.pulseVal) * 0.18;

        // Natural drifting motion
        p.x += p.vx;
        p.y += p.vy;

        // Mouse interaction: particles fluidly disperse from mouse cursor
        const dx = p.x - mx;
        const dy = p.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = 160;

        if (dist < maxDist && dist > 0) {
          const force = (1 - dist / maxDist) * 6.5;
          const angle = Math.atan2(dy, dx);
          p.x += Math.cos(angle) * force + (mousePos.current.vx || 0) * 0.12;
          p.y += Math.sin(angle) * force + (mousePos.current.vy || 0) * 0.12;
        }

        // Wrap around boundaries
        if (p.x > width + 10) p.x = -10;
        if (p.x < -10) p.x = width + 10;
        if (p.y > height + 10) p.y = -10;
        if (p.y < -10) p.y = height + 10;

        // Draw particle with soft glow
        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${Math.max(0.1, Math.min(0.9, currentAlpha))})`;
        ctx.shadowColor = `${p.color}0.8)`;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.restore();
      }

      // Connect close particles with subtle neon filaments
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const p1 = particles[i];
          const p2 = particles[j];
          const d = Math.hypot(p1.x - p2.x, p1.y - p2.y);
          if (d < 100) {
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(129, 140, 248, ${(1 - d / 100) * 0.12})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
            ctx.restore();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [torchX, torchY]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Primary Dailoqa Electric Indigo Cursor Torch for Light Theme */}
      <motion.div
        style={{
          x: smoothX,
          y: smoothY,
          translateX: "-50%",
          translateY: "-50%",
        }}
        className="absolute w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(75,46,245,0.08)_0%,rgba(168,85,247,0.05)_35%,rgba(56,189,248,0.03)_55%,transparent_70%)] blur-2xl pointer-events-none"
      />

      {/* Secondary Cyan Core Halo for Cursor Precision */}
      <motion.div
        style={{
          x: smoothX,
          y: smoothY,
          translateX: "-50%",
          translateY: "-50%",
        }}
        className="absolute w-[240px] h-[240px] rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.07)_0%,transparent_65%)] pointer-events-none"
      />

      {/* Interactive Floating Particles & Constellation Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
    </div>
  );
}
