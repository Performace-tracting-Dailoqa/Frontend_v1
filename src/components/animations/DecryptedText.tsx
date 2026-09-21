"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, useInView } from "framer-motion";

interface DecryptedTextProps {
  text: string;
  speed?: number;
  maxIterations?: number;
  sequential?: boolean;
  revealDirection?: "start" | "end" | "center";
  useOriginalCharsOnly?: boolean;
  characters?: string;
  className?: string;
  encryptedClassName?: string;
  parentClassName?: string;
  animateOn?: "view" | "hover" | "mount";
}

export default function DecryptedText({
  text,
  speed = 50,
  maxIterations = 10,
  sequential = true,
  revealDirection = "start",
  useOriginalCharsOnly = false,
  characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+~`|}{[]:;?><,./-=",
  className = "",
  encryptedClassName = "text-[#818cf8] opacity-80",
  parentClassName = "",
  animateOn = "hover",
}: DecryptedTextProps) {
  const [displayText, setDisplayText] = useState<string>(text);
  const [isHovering, setIsHovering] = useState<boolean>(false);
  const [isScrambling, setIsScrambling] = useState<boolean>(false);
  const [revealedIndices, setRevealedIndices] = useState<Set<number>>(new Set());
  const containerRef = useRef<HTMLSpanElement>(null);
  const isInView = useInView(containerRef, { once: false });

  const getAvailableChars = () => {
    if (useOriginalCharsOnly) {
      const unique = Array.from(new Set(text.split(""))).filter((c) => c !== " ");
      return unique.length > 0 ? unique.join("") : characters;
    }
    return characters;
  };

  const getRandomChar = () => {
    const chars = getAvailableChars();
    return chars[Math.floor(Math.random() * chars.length)];
  };

  const getNextIndex = (revealed: Set<number>) => {
    const textLen = text.length;
    switch (revealDirection) {
      case "start":
        return revealed.size;
      case "end":
        return textLen - 1 - revealed.size;
      case "center": {
        const middle = Math.floor(textLen / 2);
        const offset = Math.floor(revealed.size / 2);
        const next = revealed.size % 2 === 0 ? middle + offset : middle - offset;
        if (next >= 0 && next < textLen && !revealed.has(next)) return next;
        for (let i = 0; i < textLen; i++) {
          if (!revealed.has(i)) return i;
        }
        return 0;
      }
      default:
        return revealed.size;
    }
  };

  const scramble = () => {
    setIsScrambling(true);
    let currentIteration = 0;
    const currentRevealed = new Set<number>();

    const interval = setInterval(() => {
      if (sequential) {
        if (currentRevealed.size < text.length) {
          const nextIdx = getNextIndex(currentRevealed);
          currentRevealed.add(nextIdx);
          setRevealedIndices(new Set(currentRevealed));
        } else {
          clearInterval(interval);
          setIsScrambling(false);
          setDisplayText(text);
          return;
        }
      } else {
        currentIteration++;
        if (currentIteration >= maxIterations) {
          clearInterval(interval);
          setIsScrambling(false);
          setDisplayText(text);
          return;
        }
      }

      setDisplayText(
        text
          .split("")
          .map((char, index) => {
            if (char === " ") return " ";
            if (currentRevealed.has(index)) return text[index];
            return getRandomChar();
          })
          .join("")
      );
    }, speed);

    return () => clearInterval(interval);
  };

  useEffect(() => {
    if (animateOn === "mount") {
      scramble();
    }
  }, []);

  useEffect(() => {
    if (animateOn === "view" && isInView) {
      scramble();
    }
  }, [isInView]);

  useEffect(() => {
    if (animateOn === "hover" && isHovering && !isScrambling) {
      scramble();
    }
  }, [isHovering]);

  return (
    <motion.span
      ref={containerRef}
      className={`inline-block whitespace-pre-wrap cursor-pointer ${parentClassName}`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onClick={scramble}
    >
      {displayText.split("").map((char, index) => {
        const isRevealed = revealedIndices.has(index) || !isScrambling;
        return (
          <span
            key={index}
            className={isRevealed ? className : `${className} ${encryptedClassName}`}
          >
            {char}
          </span>
        );
      })}
    </motion.span>
  );
}
