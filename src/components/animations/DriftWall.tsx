"use client";

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export interface QuoteTileItem {
  id?: string | number;
  quote: string;
  author: string;
  role?: string;
  category?: string;
  accentColor?: string;
  bgGradient?: string;
  href?: string;
}

export interface DriftWallProps {
  items?: QuoteTileItem[];
  columns?: number;
  tileWidth?: number;
  tileHeight?: number;
  gap?: number;
  radius?: number;
  tilt?: number;
  turn?: number;
  roll?: number;
  perspective?: number;
  depth?: number;
  speed?: number;
  direction?: "up" | "down";
  variance?: number;
  parallax?: number;
  pauseOnHover?: boolean;
  lift?: number;
  fade?: number;
  dim?: number;
  isDark?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onQuoteSelect?: (quote: QuoteTileItem) => void;
}

export const DEFAULT_QUOTES: QuoteTileItem[] = [
  {
    quote: "Education is not the filling of a pail, but the lighting of a fire.",
    author: "William Butler Yeats",
    role: "Poet & Nobel Laureate",
    category: "INSPIRATION",
    accentColor: "#4B2EF5",
    bgGradient: "from-indigo-50/90 to-white",
  },
  {
    quote: "Tell me and I forget. Teach me and I remember. Involve me and I learn.",
    author: "Benjamin Franklin",
    role: "Polymath & Statesman",
    category: "ACTIVE LEARNING",
    accentColor: "#0284C7",
    bgGradient: "from-sky-50/90 to-white",
  },
  {
    quote: "The delicate art of the teacher is to awaken joy in creative expression and knowledge.",
    author: "Albert Einstein",
    role: "Theoretical Physicist",
    category: "CREATIVITY",
    accentColor: "#9333EA",
    bgGradient: "from-purple-50/90 to-white",
  },
  {
    quote: "Teaching is the one profession that creates all other professions.",
    author: "Unknown",
    role: "Timeless Wisdom",
    category: "FOUNDATION",
    accentColor: "#4B2EF5",
    bgGradient: "from-violet-50/90 to-white",
  },
  {
    quote: "One child, one teacher, one book, one pen can change the world.",
    author: "Malala Yousafzai",
    role: "Nobel Peace Prize Laureate",
    category: "GLOBAL IMPACT",
    accentColor: "#059669",
    bgGradient: "from-emerald-50/90 to-white",
  },
  {
    quote: "Education is the most powerful weapon which you can use to change the world.",
    author: "Nelson Mandela",
    role: "Anti-Apartheid Leader",
    category: "TRANSFORMATION",
    accentColor: "#2563EB",
    bgGradient: "from-blue-50/90 to-white",
  },
  {
    quote: "One looks back with appreciation to the brilliant teachers, but with gratitude to those who touched our human feelings.",
    author: "Carl Jung",
    role: "Psychiatrat & Thinker",
    category: "EMPATHY",
    accentColor: "#7C3AED",
    bgGradient: "from-purple-50/90 to-white",
  },
  {
    quote: "When you learn, teach. When you get, give.",
    author: "Maya Angelou",
    role: "Poet & Civil Rights Leader",
    category: "GENEROSITY",
    accentColor: "#D97706",
    bgGradient: "from-amber-50/90 to-white",
  },
  {
    quote: "The roots of education are bitter, but the fruit is sweet.",
    author: "Aristotle",
    role: "Classical Philosopher",
    category: "PERSEVERANCE",
    accentColor: "#4B2EF5",
    bgGradient: "from-indigo-50/90 to-white",
  },
  {
    quote: "To know how to suggest is the great art of teaching.",
    author: "Henri-Frédéric Amiel",
    role: "Philosopher & Poet",
    category: "GUIDANCE",
    accentColor: "#0891B2",
    bgGradient: "from-cyan-50/90 to-white",
  },
  {
    quote: "A good teacher can inspire hope, ignite the imagination, and instill a love of learning.",
    author: "Brad Henry",
    role: "Statesman",
    category: "IGNITION",
    accentColor: "#E11D48",
    bgGradient: "from-rose-50/90 to-white",
  },
  {
    quote: "The task of the modern educator is not to cut down jungles, but to irrigate deserts.",
    author: "C.S. Lewis",
    role: "Author & Scholar",
    category: "NURTURING",
    accentColor: "#059669",
    bgGradient: "from-emerald-50/90 to-white",
  },
  {
    quote: "I cannot teach anybody anything. I can only make them think.",
    author: "Socrates",
    role: "Philosopher",
    category: "INQUIRY",
    accentColor: "#4B2EF5",
    bgGradient: "from-indigo-50/90 to-white",
  },
  {
    quote: "What the teacher is, is more important than what he teaches.",
    author: "Karl Menninger",
    role: "Psychiatrist & Educator",
    category: "CHARACTER",
    accentColor: "#9333EA",
    bgGradient: "from-purple-50/90 to-white",
  },
  {
    quote: "The greatest sign of success for a teacher is to be able to say, 'The children are now working as if I did not exist.'",
    author: "Maria Montessori",
    role: "Physician & Educator",
    category: "AUTONOMY",
    accentColor: "#0284C7",
    bgGradient: "from-sky-50/90 to-white",
  },
];

const cx = (...parts: (string | boolean | undefined | null)[]) =>
  parts.filter(Boolean).join(" ");

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const columnFactor = (index: number, variance: number) => {
  const pseudo = ((index * 0.6180339887 + 0.35) % 1) * 2 - 1;
  return 1 + variance * pseudo;
};

export default function DriftWall({
  items = DEFAULT_QUOTES,
  columns = 4,
  tileWidth = 280,
  tileHeight = 170,
  gap = 22,
  radius = 20,
  tilt = 12,
  turn = -10,
  roll = 0,
  perspective = 1300,
  depth = 80,
  speed = 32,
  direction = "up",
  variance = 0.35,
  parallax = 0.6,
  pauseOnHover = true,
  lift = 50,
  fade = 0.5,
  dim = 0.88,
  isDark = false,
  className = "",
  style,
  onQuoteSelect,
}: DriftWallProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const planeRef = useRef<HTMLDivElement>(null);
  const trackRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rafRef = useRef<number | null>(null);

  const offsetsRef = useRef<number[]>([]);
  const velocitiesRef = useRef<number[]>([]);
  const hoveredColRef = useRef<number>(-1);
  const wallHoveredRef = useRef<boolean>(false);
  const pointerRef = useRef({ x: 0, y: 0 });
  const pointerDampedRef = useRef({ x: 0, y: 0 });
  const lastTsRef = useRef<number | null>(null);

  const [containerHeight, setContainerHeight] = useState<number>(650);
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeIdRef = useRef<string | null>(null);
  const [reduced, setReduced] = useState<boolean>(false);

  useEffect(() => {
    setReduced(prefersReducedMotion());
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const columnItems = useMemo(() => {
    const cols: QuoteTileItem[][] = Array.from({ length: columns }, () => []);
    items.forEach((item, i) => cols[i % columns].push(item));
    return cols.map((col) => (col.length ? col : items.slice(0, 1)));
  }, [items, columns]);

  const columnMeta = useMemo(() => {
    const unit = tileHeight + gap;
    return columnItems.map((col) => {
      const copyHeight = Math.max(unit, col.length * unit);
      const copies = Math.max(2, Math.ceil((containerHeight * 1.8) / copyHeight) + 1);
      return { copyHeight, copies };
    });
  }, [columnItems, tileHeight, gap, containerHeight]);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(([entry]) => {
      setContainerHeight(entry.contentRect.height || 650);
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const baseVelocities = useMemo(() => {
    const dirSign = direction === "up" ? 1 : -1;
    return columnItems.map((_, c) => {
      const altSign = c % 2 === 0 ? 1 : -1;
      return speed * columnFactor(c, variance) * dirSign * altSign;
    });
  }, [columnItems, speed, direction, variance]);

  useEffect(() => {
    offsetsRef.current = columnMeta.map(
      (meta, c) => meta.copyHeight * ((c * 0.37) % 1)
    );
    velocitiesRef.current = columnItems.map(() => 0);
  }, [columnMeta, columnItems]);

  const applyPlaneTransform = useCallback(
    (px: number, py: number) => {
      const plane = planeRef.current;
      if (!plane) return;
      plane.style.transform =
        `translate(-50%, -50%) scale(1.08) ` +
        `rotateX(${tilt + py}deg) rotateY(${turn + px}deg) rotateZ(${roll}deg) ` +
        `translateZ(${-depth}px)`;
    },
    [tilt, turn, roll, depth]
  );

  useEffect(() => {
    const animate = (ts: number) => {
      if (lastTsRef.current === null) lastTsRef.current = ts;
      const dt = Math.min(0.05, Math.max(0, ts - lastTsRef.current) / 1000);
      lastTsRef.current = ts;

      const maxTilt = parallax * 6;
      const targetX = pointerRef.current.x * maxTilt;
      const targetY = -pointerRef.current.y * maxTilt;
      const damp = 1 - Math.exp(-dt / 0.12);
      pointerDampedRef.current.x += (targetX - pointerDampedRef.current.x) * damp;
      pointerDampedRef.current.y += (targetY - pointerDampedRef.current.y) * damp;
      applyPlaneTransform(pointerDampedRef.current.x, pointerDampedRef.current.y);

      if (!reduced) {
        for (let c = 0; c < trackRefs.current.length; c++) {
          const meta = columnMeta[c];
          if (!meta) continue;
          const paused = wallHoveredRef.current && pauseOnHover;
          const factor = paused || hoveredColRef.current === c ? 0 : 1;
          const target = baseVelocities[c] * factor;

          const ease = 1 - Math.exp(-dt / (target === 0 ? 0.16 : 0.28));
          velocitiesRef.current[c] += (target - velocitiesRef.current[c]) * ease;
          let next = (offsetsRef.current[c] ?? 0) + velocitiesRef.current[c] * dt;
          next = ((next % meta.copyHeight) + meta.copyHeight) % meta.copyHeight;
          offsetsRef.current[c] = next;

          const el = trackRefs.current[c];
          if (el) el.style.transform = `translate3d(0, ${-next}px, 0)`;
        }
      } else {
        for (let c = 0; c < trackRefs.current.length; c++) {
          const el = trackRefs.current[c];
          const meta = columnMeta[c];
          if (el && meta)
            el.style.transform = `translate3d(0, ${-(offsetsRef.current[c] ?? 0)}px, 0)`;
        }
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTsRef.current = null;
    };
  }, [baseVelocities, columnMeta, pauseOnHover, parallax, reduced, applyPlaneTransform]);

  const activate = useCallback(
    (id: string, index: number, item?: QuoteTileItem) => {
      activeIdRef.current = id;
      hoveredColRef.current = index;
      setActiveId(id);
      if (item && onQuoteSelect) onQuoteSelect(item);
    },
    [onQuoteSelect]
  );

  const release = useCallback(() => {
    activeIdRef.current = null;
    hoveredColRef.current = -1;
    setActiveId(null);
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      if (parallax > 0 && !reduced) {
        pointerRef.current = {
          x: (e.clientX - rect.left) / rect.width - 0.5,
          y: (e.clientY - rect.top) / rect.height - 0.5,
        };
      }
      const hit = document.elementFromPoint(e.clientX, e.clientY);
      const tile = hit && hit.closest ? hit.closest("[data-tile-id]") : null;
      if (!tile) return;
      const id = (tile as HTMLElement).dataset.tileId;
      if (!id || id === activeIdRef.current) return;
      activeIdRef.current = id;
      hoveredColRef.current = Number((tile as HTMLElement).dataset.col);
      setActiveId(id);
    },
    [parallax, reduced]
  );

  const handlePointerLeaveWall = useCallback(() => {
    wallHoveredRef.current = false;
    pointerRef.current = { x: 0, y: 0 };
    release();
  }, [release]);

  const maskStyle =
    "radial-gradient(ellipse 85% 85% at 50% 50%, #000 var(--dw-edge), transparent 100%), " +
    "linear-gradient(to top, #000 var(--dw-edge), transparent 100%)";

  const cssVars = useMemo(
    () => ({
      "--dw-tile-w": `${tileWidth}px`,
      "--dw-tile-h": `${tileHeight}px`,
      "--dw-gap": `${gap}px`,
      "--dw-radius": `${radius}px`,
      "--dw-lift": `${lift}px`,
      "--dw-dim": dim,
      "--dw-edge": `${Math.max(0, (1 - fade) * 100)}%`,
      perspective: `${perspective}px`,
      perspectiveOrigin: "50% 50%",
      WebkitMaskImage: maskStyle,
      maskImage: maskStyle,
      WebkitMaskComposite: "source-in",
      maskComposite: "intersect",
      ...style,
    }),
    [tileWidth, tileHeight, gap, radius, lift, dim, fade, perspective, maskStyle, style]
  );

  const tileClass = cx(
    "group/tile relative block flex-none cursor-pointer outline-none",
    "w-full h-[calc(var(--dw-tile-h)+var(--dw-gap))] [transform-style:preserve-3d]"
  );

  const innerClass = cx(
    "pointer-events-none absolute inset-[calc(var(--dw-gap)/2)] block overflow-hidden",
    isDark ? "bg-[#0d0d1b] border border-white/15" : "bg-white border border-slate-200/90",
    "rounded-[var(--dw-radius)] opacity-[var(--dw-dim)] [transform:translateZ(0)] shadow-sm",
    "transition-[transform,opacity,box-shadow,border-color] duration-[380ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
    "group-[.is-active]/tile:opacity-100 group-[.is-active]/tile:[transform:translateZ(var(--dw-lift))]",
    isDark
      ? "group-[.is-active]/tile:shadow-[0_20px_45px_-10px_rgba(75,46,245,0.45)] group-[.is-active]/tile:border-[#818cf8]"
      : "group-[.is-active]/tile:shadow-[0_20px_45px_-10px_rgba(75,46,245,0.25)] group-[.is-active]/tile:border-[#4B2EF5]/60",
    "group-focus-visible/tile:opacity-100 group-focus-visible/tile:[transform:translateZ(var(--dw-lift))]"
  );

  const renderTile = (item: QuoteTileItem, id: string, colIndex: number) => {
    const inner = (
      <div className={innerClass}>
        <div
          className={cx(
            "h-full w-full p-4 sm:p-5 flex flex-col justify-between select-none bg-gradient-to-br",
            isDark
              ? "from-[#111022] to-[#0a0a14]"
              : item.bgGradient || "from-white to-slate-50"
          )}
        >
          {/* Quote Header */}
          <div className="flex items-center justify-between gap-2">
            <span
              className="text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: `${item.accentColor || "#4B2EF5"}18`,
                color: item.accentColor || "#4B2EF5",
                border: `1px solid ${item.accentColor || "#4B2EF5"}35`,
              }}
            >
              {item.category || "WISDOM"}
            </span>
            <span
              className="text-lg font-serif font-bold leading-none select-none opacity-40"
              style={{ color: item.accentColor || "#4B2EF5" }}
            >
              “
            </span>
          </div>

          {/* Quote Text */}
          <p
            className={cx(
              "text-xs sm:text-[13px] font-serif italic leading-snug line-clamp-3 my-auto",
              isDark ? "text-slate-200" : "text-slate-800"
            )}
          >
            &ldquo;{item.quote}&rdquo;
          </p>

          {/* Quote Author */}
          <div
            className={cx(
              "pt-2 border-t flex items-center justify-between",
              isDark ? "border-white/10" : "border-slate-100"
            )}
          >
            <div>
              <h5
                className={cx(
                  "text-[11px] sm:text-xs font-bold leading-tight",
                  isDark ? "text-white" : "text-slate-900"
                )}
              >
                {item.author}
              </h5>
              {item.role && (
                <span
                  className={cx(
                    "text-[10px] line-clamp-1 block",
                    isDark ? "text-slate-400" : "text-slate-500"
                  )}
                >
                  {item.role}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );

    const commonProps = {
      className: cx(tileClass, activeId === id && "is-active"),
      "data-tile-id": id,
      "data-col": colIndex,
      onFocus: () => activate(id, colIndex, item),
      onBlur: release,
    };

    if (item.href) {
      return (
        <a key={id} href={item.href} target="_blank" rel="noreferrer noopener" {...commonProps}>
          {inner}
        </a>
      );
    }
    return (
      <div
        key={id}
        tabIndex={0}
        role="button"
        aria-label={`${item.author}: ${item.quote}`}
        onClick={() => activate(id, colIndex, item)}
        {...commonProps}
      >
        {inner}
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className={cx("relative h-full w-full overflow-hidden select-none", className)}
      style={cssVars as React.CSSProperties}
      onPointerMove={handlePointerMove}
      onPointerEnter={() => {
        wallHoveredRef.current = true;
      }}
      onPointerLeave={handlePointerLeaveWall}
      role="group"
      aria-label="Drifting wall of educational quotes"
    >
      <div
        ref={planeRef}
        className="absolute left-1/2 top-1/2 flex cursor-pointer flex-row [transform-style:preserve-3d] [transform-origin:50%_50%] will-change-transform"
      >
        {columnItems.map((col, c) => {
          const meta = columnMeta[c];
          const copies = Array.from({ length: meta.copies });
          return (
            <div
              className="relative w-[calc(var(--dw-tile-w)+var(--dw-gap))] [transform-style:preserve-3d]"
              key={`col-${c}`}
            >
              <div
                className="flex flex-col [transform-style:preserve-3d] will-change-transform"
                ref={(el) => {
                  trackRefs.current[c] = el;
                }}
              >
                {copies.map((_, copyIndex) =>
                  col.map((item, itemIndex) =>
                    renderTile(item, `${c}-${copyIndex}-${itemIndex}`, c)
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
