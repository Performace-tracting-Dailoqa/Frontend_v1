"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface RotatingTextProps {
  texts: string[];
  interval?: number;
  className?: string;
  badgeStyle?: boolean;
}

export default function RotatingText({
  texts,
  interval = 2400,
  className = "",
  badgeStyle = false,
}: RotatingTextProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % texts.length);
    }, interval);
    return () => clearInterval(timer);
  }, [texts.length, interval]);

  return (
    <span
      className={`inline-flex items-center justify-center relative overflow-hidden align-middle ${
        badgeStyle
          ? "px-3 py-1 mx-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 shadow-inner"
          : "px-1"
      } ${className}`}
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={texts[index]}
          initial={{ y: 22, opacity: 0, filter: "blur(4px)" }}
          animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
          exit={{ y: -22, opacity: 0, filter: "blur(4px)" }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="inline-block font-extrabold bg-gradient-to-r from-[#a78bfa] via-[#c084fc] to-[#38bdf8] bg-clip-text text-transparent"
        >
          {texts[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
