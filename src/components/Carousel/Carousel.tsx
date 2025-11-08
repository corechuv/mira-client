import React, { useEffect, useMemo, useRef, useState } from "react";
import s from "./Carousel.module.scss";
import Icon from "../Icon";

// === Types ===
export type Slide = {
  id?: string | number;
  src: string;
  alt?: string;
  href?: string; // опционально — клик по баннеру
  content?: React.ReactNode; // опционально — оверлейный контент поверх
};

export type CarouselProps = {
  slides: Slide[];
  className?: string;
  startIndex?: number;
  autoPlay?: boolean; // default: true
  interval?: number; // ms, default: 4000
  loop?: boolean; // default: true
  showArrows?: boolean; // default: true
  showDots?: boolean; // default: true
  aspectRatio?: string; // CSS aspect-ratio, например "16/9" | "3/1"; default: "16/9"
  onIndexChange?: (index: number) => void;
};

export default function Carousel({
  slides,
  className,
  startIndex = 0,
  autoPlay = true,
  interval = 4000,
  loop = true,
  showArrows = true,
  showDots = true,
  aspectRatio = "16/9",
  onIndexChange,
}: CarouselProps) {
  const [index, setIndex] = useState(startIndex);
  const [isHover, setIsHover] = useState(false);
  const [isFocusWithin, setIsFocusWithin] = useState(false);
  const [dragPx, setDragPx] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isCoarsePointer, setIsCoarsePointer] = useState(false); // mobile/tablet свайп
  const [hasHover, setHasHover] = useState(false); // для корректной паузы при hover

  const containerRef = useRef<HTMLDivElement | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const startXRef = useRef(0);
  const widthRef = useRef(0);

  const enableSwipe = isCoarsePointer && slides.length > 1; // Desktop: свайп отключён

  // === media capabilities (SSR-safe) ===
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mqCoarse = window.matchMedia("(pointer: coarse)");
    const mqHover = window.matchMedia("(hover: hover)");

    const updateCoarse = () => setIsCoarsePointer(mqCoarse.matches);
    const updateHover = () => setHasHover(mqHover.matches);

    updateCoarse();
    updateHover();

    mqCoarse.addEventListener("change", updateCoarse);
    mqHover.addEventListener("change", updateHover);
    return () => {
      mqCoarse.removeEventListener("change", updateCoarse);
      mqHover.removeEventListener("change", updateHover);
    };
  }, []);

  const prefersReducedMotion = () =>
    typeof window !== "undefined" &&
    !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const canAutoPlay =
    autoPlay &&
    slides.length > 1 &&
    !isFocusWithin &&
    (!hasHover || !isHover) &&
    !prefersReducedMotion();

  // === Autoplay ===
  useEffect(() => {
    if (!canAutoPlay) return;
    const id = window.setInterval(() => goTo(index + 1), interval);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canAutoPlay, index, interval]);

  // === External index notify ===
  useEffect(() => {
    onIndexChange?.(normalized(index));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, slides.length]);

  // === indexing helpers ===
  const last = slides.length - 1;
  const normalized = (i: number) => {
    if (!loop) return clamp(i, 0, last);
    const m = slides.length || 1;
    return ((i % m) + m) % m;
  };

  const goTo = (i: number) => setIndex(() => normalized(i));
  const prev = () => goTo(index - 1);
  const next = () => goTo(index + 1);

  // === track width recalculation ===
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      widthRef.current = el.clientWidth;
    });
    widthRef.current = el.clientWidth;
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // === focus handling ===
  const onFocusIn = () => setIsFocusWithin(true);
  const onFocusOut: React.FocusEventHandler<HTMLDivElement> = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsFocusWithin(false);
  };

  // === keyboard ===
  const onKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    switch (e.key) {
      case "ArrowLeft":
        e.preventDefault();
        prev();
        break;
      case "ArrowRight":
        e.preventDefault();
        next();
        break;
      case "Home":
        e.preventDefault();
        goTo(0);
        break;
      case "End":
        e.preventDefault();
        goTo(slides.length - 1);
        break;
    }
  };

  // === swipe via Pointer Events – only for coarse pointers ===
  const onPointerDown: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (!enableSwipe || slides.length <= 1) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    pointerIdRef.current = e.pointerId;
    startXRef.current = e.clientX;
    setIsDragging(true);
  };

  const onPointerMove: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (!enableSwipe) return;
    if (pointerIdRef.current !== e.pointerId) return;
    const dx = e.clientX - startXRef.current;
    setDragPx(dx);
  };

  const endDrag = () => {
    const w = widthRef.current || 1;
    const dragPercent = Math.abs(dragPx) / w;
    const threshold = 0.2; // 20% ширины
    if (dragPercent > threshold) {
      dragPx < 0 ? next() : prev();
    }
    setDragPx(0);
    pointerIdRef.current = null;
    setIsDragging(false);
  };

  const onPointerUp: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (!enableSwipe) return;
    if (pointerIdRef.current !== e.pointerId) return;
    endDrag();
  };

  const onPointerCancel: React.PointerEventHandler<HTMLDivElement> = () => {
    if (!enableSwipe) return;
    setDragPx(0);
    pointerIdRef.current = null;
    setIsDragging(false);
  };

  // === transform (with drag offset) ===
  const trackStyle = useMemo(() => {
    const w = widthRef.current || 1;
    const dragPercent = (dragPx / w) * 100;
    const base = -normalized(index) * 100;
    const x = base + dragPercent;
    return { transform: `translate3d(${x}%, 0, 0)` } as React.CSSProperties;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragPx, index, slides.length]);

  const current = normalized(index);
  const isPrevDisabled = !loop && current === 0;
  const isNextDisabled = !loop && current === last;

  return (
    <div
      className={[s.carousel, className, isDragging ? s.dragging : ""].filter(Boolean).join(" ")}
      style={{ aspectRatio }}
      ref={containerRef}
      onMouseEnter={() => hasHover && setIsHover(true)}
      onMouseLeave={() => hasHover && setIsHover(false)}
      onFocus={onFocusIn}
      onBlur={onFocusOut}
      onKeyDown={onKeyDown}
      role="region"
      aria-roledescription="carousel"
      aria-label="Баннеры"
      tabIndex={0}
    >
      <div
        className={s.viewport}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
      >
        <ul className={s.track} style={trackStyle} role="list">
          {slides.map((slide, i) => {
            const active = current === i;
            const Img = (
              <img
                className={s.img}
                src={slide.src}
                alt={slide.alt ?? ""}
                loading={active ? "eager" : "lazy"}
                decoding="async"
                fetchPriority={active ? (index === 0 ? "high" : "auto") : "low"}
                draggable={false}
              />
            );

            return (
              <li
                className={s.slide}
                key={slide.id ?? i}
                aria-hidden={!active}
                aria-roledescription="slide"
                aria-label={`Слайд ${i + 1} из ${slides.length}`}
                role="group"
              >
                {slide.href ? (
                  <a href={slide.href} className={s.link} tabIndex={active ? 0 : -1} aria-current={active || undefined}>
                    {Img}
                    {slide.content && <div className={s.overlay}>{slide.content}</div>}
                  </a>
                ) : (
                  <>
                    {Img}
                    {slide.content && <div className={s.overlay}>{slide.content}</div>}
                  </>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {showArrows && slides.length > 1 && (
        <>
          <button
            className={`${s.arrow} ${s.left}`}
            aria-label="Предыдущий слайд"
            onClick={prev}
            disabled={isPrevDisabled}
          >
            <Icon name="arrow-left" size="1.6rem" />
          </button>
          <button
            className={`${s.arrow} ${s.right}`}
            aria-label="Следующий слайд"
            onClick={next}
            disabled={isNextDisabled}
          >
            <Icon name="arrow-right" size="1.6rem" />
          </button>
        </>
      )}

      {showDots && slides.length > 1 && (
        <div className={s.dots} role="tablist" aria-label="Навигация по слайдам">
          {slides.map((_, i) => {
            const active = current === i;
            return (
              <button
                key={i}
                role="tab"
                aria-selected={active}
                aria-label={`Слайд ${i + 1}`}
                className={`${s.dot} ${active ? s.active : ""}`}
                onClick={() => goTo(i)}
                tabIndex={active ? 0 : -1}
              />
            );
          })}
        </div>
      )}

      {/* скрытый live-region для скринридеров */}
      <span className={s.srOnly} aria-live="polite">Слайд {current + 1} из {slides.length}</span>
    </div>
  );
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}