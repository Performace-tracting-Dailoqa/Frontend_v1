"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

interface TrueFocusProps {
  sentence?: string;
  manualMode?: boolean;
  blurAmount?: number;
  borderColor?: string;
  glowColor?: string;
  animationDuration?: number;
  pauseBetweenAnimations?: number;
  className?: string;
}

export default function TrueFocus({
  sentence = "Empowering Teachers Inspiring Excellence",
  manualMode = false,
  blurAmount = 4,
  borderColor = "#818cf8",
  glowColor = "rgba(129, 140, 248, 0.45)",
  animationDuration = 0.5,
  pauseBetweenAnimations = 1.2,
  className = "",
}: TrueFocusProps) {
  const words = sentence.split(" ");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lastActiveIndex, setLastActiveIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [focusRect, setFocusRect] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>({ x: 0, y: 0, width: 0, height: 0 });

  useEffect(() => {
    if (!manualMode) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % words.length);
      }, (animationDuration + pauseBetweenAnimations) * 1000);

      return () => clearInterval(interval);
    }
  }, [manualMode, animationDuration, pauseBetweenAnimations, words.length]);

  useEffect(() => {
    if (currentIndex === null || currentIndex === -1) return;

    const updateFocusRect = () => {
      if (!wordRefs.current[currentIndex] || !containerRef.current) return;
      const parentRect = containerRef.current.getBoundingClientRect();
      const activeRect = wordRefs.current[currentIndex]!.getBoundingClientRect();

      setFocusRect({
        x: activeRect.left - parentRect.left,
        y: activeRect.top - parentRect.top,
        width: activeRect.width,
        height: activeRect.height,
      });
    };

    updateFocusRect();
    const timer = setTimeout(updateFocusRect, 50);
    window.addEventListener("resize", updateFocusRect);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updateFocusRect);
    };
  }, [currentIndex, words.length]);

  const handleMouseEnter = (index: number) => {
    if (manualMode) {
      setLastActiveIndex(index);
      setCurrentIndex(index);
    }
  };

  const handleMouseLeave = () => {
    if (manualMode) {
      setCurrentIndex(lastActiveIndex ?? 0);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-wrap items-center gap-2 select-none ${className}`}
    >
      {words.map((word, index) => {
        const isActive = index === currentIndex;
        return (
          <span
            key={index}
            ref={(el) => {
              wordRefs.current[index] = el;
            }}
            className="relative inline-flex items-center cursor-pointer py-1 px-2.5 text-sm sm:text-base font-semibold transition-all duration-300 rounded-md"
            style={{
              filter:
                manualMode
                  ? isActive
                    ? "blur(0px)"
                    : `blur(${blurAmount}px)`
                  : isActive
                  ? "blur(0px)"
                  : `blur(${blurAmount}px)`,
              opacity: isActive ? 1 : 0.45,
            }}
            onMouseEnter={() => handleMouseEnter(index)}
            onMouseLeave={handleMouseLeave}
          >
            {word.replace(/-/g, " ")}
          </span>
        );
      })}

      <motion.div
        className="absolute top-0 left-0 pointer-events-none rounded-lg"
        animate={{
          x: focusRect.x,
          y: focusRect.y,
          width: focusRect.width,
          height: focusRect.height,
          opacity: currentIndex >= 0 && focusRect.width > 0 ? 1 : 0,
        }}
        transition={{
          duration: animationDuration,
          ease: [0.16, 1, 0.3, 1],
        }}
        style={{
          boxShadow: `0 0 20px 2px ${glowColor}`,
        }}
      >
        {/* Glowing border brackets */}
        <span
          className="absolute -top-[2px] -left-[2px] w-2.5 h-2.5 border-t-2 border-l-2 rounded-tl-sm"
          style={{ borderColor }}
        />
        <span
          className="absolute -top-[2px] -right-[2px] w-2.5 h-2.5 border-t-2 border-r-2 rounded-tr-sm"
          style={{ borderColor }}
        />
        <span
          className="absolute -bottom-[2px] -left-[2px] w-2.5 h-2.5 border-b-2 border-l-2 rounded-bl-sm"
          style={{ borderColor }}
        />
        <span
          className="absolute -bottom-[2px] -right-[2px] w-2.5 h-2.5 border-b-2 border-r-2 rounded-br-sm"
          style={{ borderColor }}
        />
      </motion.div>
    </div>
  );
}
