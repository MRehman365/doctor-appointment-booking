"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { ServiceCard } from "@/components/services/ServiceCard";
import { cn } from "@/lib/utils/cn";
import type { Service } from "@/lib/api/site";

const GAP = 24; // matches gap-6
const AUTOPLAY_MS = 4000;
const SLIDE_MS = 500;

/**
 * Infinite, auto-playing slider.
 * The list is rendered three times; the active window lives in the middle copy and the
 * position is silently reset after each slide, so it loops forever in both directions.
 */
export function ServicesSlider({ services }: { services: Service[] }) {
  const n = services.length;

  const viewportRef = useRef<HTMLDivElement>(null);
  const firstItemRef = useRef<HTMLDivElement>(null);
  const busyRef = useRef(false);
  const measuredRef = useRef(false);
  const indexRef = useRef(0);
  const dragStartX = useRef<number | null>(null);

  const [index, setIndex] = useState(0); // logical index, may leave 0..n-1 briefly
  const [step, setStep] = useState(0); // item width + gap in px
  const [perView, setPerView] = useState(1);
  const [animate, setAnimate] = useState(true);
  const [hovering, setHovering] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Only slide when there are more services than visible at once
  const canSlide = n > perView;
  const playing = canSlide && !userPaused && !hovering && !reducedMotion;

  // Measure item width / items per view
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const measure = () => {
      const item = firstItemRef.current;
      if (!item) return;
      const nextStep = item.offsetWidth + GAP;
      if (!measuredRef.current) {
        // Place the track on the middle copy instantly on first measure (no slide-in on load)
        measuredRef.current = true;
        setAnimate(false);
        requestAnimationFrame(() => requestAnimationFrame(() => setAnimate(true)));
      }
      setStep(nextStep);
      setPerView(Math.max(1, Math.round((viewport.clientWidth + GAP) / nextStep)));
    };

    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);

  // Respect "reduce motion"
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReducedMotion(query.matches);
    query.addEventListener("change", onChange);
    // Initial value is read asynchronously to avoid a synchronous setState in the effect body.
    const raf = requestAnimationFrame(onChange);
    return () => {
      cancelAnimationFrame(raf);
      query.removeEventListener("change", onChange);
    };
  }, []);

  const commit = useCallback((next: number) => {
    indexRef.current = next;
    setIndex(next);
  }, []);

  // After sliding into a clone region, jump back to the real copy without animation
  const normalize = useCallback(() => {
    const current = indexRef.current;
    if (n === 0 || (current >= 0 && current < n)) return;
    const normalized = ((current % n) + n) % n;
    setAnimate(false);
    commit(normalized);
    requestAnimationFrame(() => requestAnimationFrame(() => setAnimate(true)));
  }, [n, commit]);

  const slideBy = useCallback(
    (delta: number) => {
      if (!canSlide || busyRef.current || delta === 0) return;
      busyRef.current = true;
      setAnimate(true);
      commit(indexRef.current + delta);
      // Safety net: if transitionend never fires (hidden tab, interrupted transition)
      window.setTimeout(() => {
        busyRef.current = false;
        normalize();
      }, SLIDE_MS + 150);
    },
    [canSlide, commit, normalize],
  );

  const move = useCallback((direction: 1 | -1) => slideBy(direction), [slideBy]);
  // Autoplay
  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) move(1);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [playing, move]);

  function onTransitionEnd(e: React.TransitionEvent<HTMLDivElement>) {
    if (e.target !== e.currentTarget) return;
    busyRef.current = false;
    normalize();
  }

  function goTo(target: number) {
    const current = ((indexRef.current % n) + n) % n;
    slideBy(target - current);
  }
  const activeDot = ((index % n) + n) % n;
  const position = n + index; // position inside the tripled list

  const items = canSlide ? [0, 1, 2] : [1];

  const arrowClass =
    "grid h-11 w-11 place-items-center rounded-full border border-navy/30 bg-white text-navy transition-colors hover:border-navy hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/40 disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div
      role="group"
      aria-roledescription="carousel"
      aria-label="Services"
      onPointerEnter={(e) => {
        if (e.pointerType === "mouse") setHovering(true);
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === "mouse") setHovering(false);
      }}
    >
      <div
        ref={viewportRef}
        className="touch-pan-y overflow-hidden"
        aria-live={playing ? "off" : "polite"}
        onPointerDown={(e) => {
          dragStartX.current = e.clientX;
        }}
        onPointerUp={(e) => {
          if (dragStartX.current === null) return;
          const dx = e.clientX - dragStartX.current;
          dragStartX.current = null;
          if (Math.abs(dx) > 50) move(dx < 0 ? 1 : -1);
        }}
        onPointerCancel={() => {
          dragStartX.current = null;
        }}
      >
        <div
          className="flex gap-6"
          onTransitionEnd={onTransitionEnd}
          style={{
            transform: canSlide && step ? `translate3d(${-position * step}px, 0, 0)` : undefined,
            transition: animate ? `transform ${SLIDE_MS}ms cubic-bezier(0.22, 1, 0.36, 1)` : "none",
          }}
        >
          {items.map((copy) =>
            services.map((service, i) => {
              const itemPosition = (canSlide ? copy * n : 0) + i;
              const visible =
                !canSlide || (itemPosition >= position && itemPosition < position + perView);
              const isFirst = copy === items[0] && i === 0;
              const isClone = canSlide && copy !== 1;

              return (
                <div
                  key={`${service._id}-${copy}`}
                  ref={isFirst ? firstItemRef : undefined}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${i + 1} of ${n}`}
                  aria-hidden={isClone ? true : undefined}
                  inert={!visible}
                  className="min-w-0 shrink-0 basis-full sm:basis-[calc(50%-12px)] lg:basis-[calc(33.333%-16px)]"
                >
                  <ServiceCard service={service} />
                </div>
              );
            }),
          )}
        </div>
      </div>

      {canSlide ? (
        <div className="mt-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-1">
            {services.map((service, i) => (
              <button
                key={service._id}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Go to service ${i + 1}`}
                aria-current={i === activeDot}
                className="grid h-6 w-6 place-items-center"
              >
                <span
                  className={cn(
                    "block h-2 rounded-full transition-all duration-200",
                    i === activeDot ? "w-6 bg-navy" : "w-2 bg-navy/25 hover:bg-navy/50",
                  )}
                />
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setUserPaused((v) => !v)}
              aria-label={userPaused ? "Start automatic sliding" : "Pause automatic sliding"}
              className={arrowClass}
            >
              {userPaused || reducedMotion ? <Play size={18} /> : <Pause size={18} />}
            </button>
            <button
              type="button"
              onClick={() => move(-1)}
              aria-label="Previous services"
              className={arrowClass}
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={() => move(1)}
              aria-label="Next services"
              className={arrowClass}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
