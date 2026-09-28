"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  color: string;
  driftX: number;
}

export default function FloatingParticles({
  count = 25,
  className = "",
}: {
  count?: number;
  className?: string;
}) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const colors = ["#4B2EF5", "#818cf8", "#a855f7", "#38bdf8", "#c084fc"];
    const items: Particle[] = [];
    for (let i = 0; i < count; i++) {
      items.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 4 + 2,
        duration: Math.random() * 5 + 4,
        delay: Math.random() * 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        driftX: (Math.random() - 0.5) * 20,
      });
    }
    const timer = setTimeout(() => {
      setParticles(items);
    }, 0);
    return () => clearTimeout(timer);
  }, [count]);

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, p.driftX, 0],
            opacity: [0.2, 0.9, 0.2],
            scale: [1, 1.4, 1],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
