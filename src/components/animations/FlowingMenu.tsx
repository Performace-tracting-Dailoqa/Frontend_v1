"use client";

import React, { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { gsap } from "gsap";

export interface FlowingMenuItem {
  text: string;
  link: string;
  icon: string;
  isActive?: boolean;
}

interface FlowingMenuProps {
  items: FlowingMenuItem[];
  speed?: number;
  textColor?: string;
  activeTextColor?: string;
  marqueeBgColor?: string;
  marqueeTextColor?: string;
  isCollapsed?: boolean;
  onItemClick?: () => void;
  isDark?: boolean;
}

export default function FlowingMenu({
  items,
  speed = 10,
  textColor = "#475569",
  activeTextColor = "#ffffff",
  marqueeBgColor = "#4B2EF5",
  marqueeTextColor = "#ffffff",
  isCollapsed = false,
  onItemClick,
  isDark = false,
}: FlowingMenuProps) {
  return (
    <nav className={`space-y-1.5 ${isCollapsed ? "px-2" : "px-3.5"}`}>
      {items.map((item, idx) => (
        <FlowingMenuItemRow
          key={item.link || idx}
          {...item}
          speed={speed}
          textColor={textColor}
          activeTextColor={activeTextColor}
          marqueeBgColor={marqueeBgColor}
          marqueeTextColor={marqueeTextColor}
          isCollapsed={isCollapsed}
          onItemClick={onItemClick}
          isDark={isDark}
        />
      ))}
    </nav>
  );
}

interface FlowingMenuItemRowProps extends FlowingMenuItem {
  speed: number;
  textColor: string;
  activeTextColor: string;
  marqueeBgColor: string;
  marqueeTextColor: string;
  isCollapsed: boolean;
  onItemClick?: () => void;
  isDark: boolean;
}

function FlowingMenuItemRow({
  text,
  link,
  icon,
  isActive = false,
  speed,
  textColor,
  activeTextColor,
  marqueeBgColor,
  marqueeTextColor,
  isCollapsed,
  onItemClick,
  isDark,
}: FlowingMenuItemRowProps) {
  const itemRef = useRef<HTMLDivElement>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const marqueeInnerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<gsap.core.Tween | null>(null);
  const [repetitions, setRepetitions] = useState(4);

  const animationDefaults = { duration: 0.45, ease: "expo.out" };

  const findClosestEdge = (mouseX: number, mouseY: number, width: number, height: number) => {
    const topEdgeDist = distMetric(mouseX, mouseY, width / 2, 0);
    const bottomEdgeDist = distMetric(mouseX, mouseY, width / 2, height);
    return topEdgeDist < bottomEdgeDist ? "top" : "bottom";
  };

  const distMetric = (x: number, y: number, x2: number, y2: number) => {
    const xDiff = x - x2;
    const yDiff = y - y2;
    return xDiff * xDiff + yDiff * yDiff;
  };

  useEffect(() => {
    if (isCollapsed) return;

    const calculateRepetitions = () => {
      if (!marqueeInnerRef.current) return;
      const marqueeContent = marqueeInnerRef.current.querySelector(".marquee__part") as HTMLElement | null;
      if (!marqueeContent) return;

      const contentWidth = marqueeContent.offsetWidth || 120;
      const containerWidth = marqueeInnerRef.current.parentElement?.offsetWidth || 260;
      const needed = Math.ceil(containerWidth / contentWidth) + 3;
      setRepetitions(Math.max(4, needed));
    };

    calculateRepetitions();
    window.addEventListener("resize", calculateRepetitions);
    return () => window.removeEventListener("resize", calculateRepetitions);
  }, [text, isCollapsed]);

  useEffect(() => {
    if (isCollapsed) return;

    const setupMarquee = () => {
      if (!marqueeInnerRef.current) return;
      const marqueeContent = marqueeInnerRef.current.querySelector(".marquee__part") as HTMLElement | null;
      if (!marqueeContent) return;

      const contentWidth = marqueeContent.offsetWidth;
      if (!contentWidth) return;

      if (animationRef.current) {
        animationRef.current.kill();
      }

      animationRef.current = gsap.to(marqueeInnerRef.current, {
        x: -contentWidth,
        duration: speed,
        ease: "none",
        repeat: -1,
      });
    };

    const timer = setTimeout(setupMarquee, 40);

    return () => {
      clearTimeout(timer);
      if (animationRef.current) {
        animationRef.current.kill();
      }
    };
  }, [text, repetitions, speed, isCollapsed]);

  const handleMouseEnter = (ev: React.MouseEvent<HTMLAnchorElement>) => {
    if (isCollapsed || !itemRef.current || !marqueeRef.current || !marqueeInnerRef.current) return;
    const rect = itemRef.current.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    const y = ev.clientY - rect.top;
    const edge = findClosestEdge(x, y, rect.width, rect.height);

    gsap
      .timeline({ defaults: animationDefaults })
      .set(marqueeRef.current, { y: edge === "top" ? "-101%" : "101%" }, 0)
      .set(marqueeInnerRef.current, { y: edge === "top" ? "101%" : "-101%" }, 0)
      .to([marqueeRef.current, marqueeInnerRef.current], { y: "0%" }, 0);
  };

  const handleMouseLeave = (ev: React.MouseEvent<HTMLAnchorElement>) => {
    if (isCollapsed || !itemRef.current || !marqueeRef.current || !marqueeInnerRef.current) return;
    const rect = itemRef.current.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    const y = ev.clientY - rect.top;
    const edge = findClosestEdge(x, y, rect.width, rect.height);

    gsap
      .timeline({ defaults: animationDefaults })
      .to(marqueeRef.current, { y: edge === "top" ? "-101%" : "101%" }, 0)
      .to(marqueeInnerRef.current, { y: edge === "top" ? "101%" : "-101%" }, 0);
  };

  const isExternal = link.startsWith("http");

  // If collapsed: Render compact icon rail item with floating tooltip
  if (isCollapsed) {
    return (
      <div className="relative group flex justify-center">
        {isExternal ? (
          <a
            href={link}
            target="_blank"
            rel="noreferrer"
            className={`flex items-center justify-center w-11 h-11 rounded-xl transition-all ${
              isDark
                ? "text-slate-400 hover:bg-white/10 hover:text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
            title={text}
          >
            <span className="material-symbols-outlined text-xl text-[#505F76]">{icon}</span>
          </a>
        ) : (
          <Link
            href={link}
            onClick={onItemClick}
            className={`flex items-center justify-center w-11 h-11 rounded-xl transition-all ${
              isActive
                ? "bg-primary text-white font-bold shadow-sm shadow-indigo-500/25"
                : isDark
                ? "text-slate-400 hover:bg-white/10 hover:text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
            title={text}
          >
            <span className="material-symbols-outlined text-xl">{icon}</span>
          </Link>
        )}

        {/* Tooltip on Hover */}
        <div className="hidden lg:group-hover:flex absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xl whitespace-nowrap pointer-events-none items-center gap-1.5 animate-in fade-in zoom-in-95 duration-150">
          <span>{text}</span>
          <span className="w-1.5 h-1.5 bg-slate-900 rotate-45 absolute -left-0.5 top-1/2 -translate-y-1/2" />
        </div>
      </div>
    );
  }

  // Expanded Sidebar item with React Bits Flowing Marquee
  return (
    <div
      ref={itemRef}
      className={`menu__item relative rounded-xl overflow-hidden transition-all group ${
        isActive
          ? "bg-primary text-white font-semibold shadow-sm shadow-indigo-500/25"
          : isDark
          ? "hover:bg-white/5"
          : "hover:bg-slate-50"
      }`}
    >
      {/* Base Navigation Anchor */}
      {isExternal ? (
        <a
          href={link}
          target="_blank"
          rel="noreferrer"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className={`flex items-center px-3.5 py-2.5 w-full text-sm font-medium z-10 relative transition-colors ${
            isDark ? "text-slate-400 group-hover:text-white" : "text-slate-600 group-hover:text-slate-900"
          }`}
        >
          <span className="material-symbols-outlined mr-3 text-xl text-[#505F76]">{icon}</span>
          <span className="truncate">{text}</span>
        </a>
      ) : (
        <Link
          href={link}
          onClick={onItemClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className={`flex items-center px-3.5 py-2.5 w-full text-sm font-medium z-10 relative transition-colors ${
            isActive
              ? "text-white font-bold"
              : isDark
              ? "text-slate-400 group-hover:text-white"
              : "text-slate-600 group-hover:text-slate-900"
          }`}
        >
          <span
            className={`material-symbols-outlined mr-3 text-xl transition-colors ${
              isActive ? "text-white" : "text-slate-500 group-hover:text-primary"
            }`}
          >
            {icon}
          </span>
          <span className="truncate">{text}</span>
        </Link>
      )}

      {/* React Bits Flowing Menu Hover Marquee */}
      <div
        ref={marqueeRef}
        className="marquee absolute inset-0 w-full h-full pointer-events-none overflow-hidden rounded-xl z-20"
        style={{
          backgroundColor: isActive ? "#4326dd" : marqueeBgColor,
          transform: "translate3d(0, 101%, 0)",
        }}
      >
        <div className="h-full w-full overflow-hidden flex items-center">
          <div
            ref={marqueeInnerRef}
            className="marquee__inner flex items-center h-full will-change-transform whitespace-nowrap"
          >
            {[...Array(repetitions)].map((_, idx) => (
              <div
                key={idx}
                className="marquee__part flex items-center shrink-0 pr-4 gap-2"
                style={{ color: marqueeTextColor }}
              >
                <span className="material-symbols-outlined text-lg">{icon}</span>
                <span className="font-bold text-xs uppercase tracking-wider">{text}</span>
                <span className="opacity-30 text-xs mx-0.5">•</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
