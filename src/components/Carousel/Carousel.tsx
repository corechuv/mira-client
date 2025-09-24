import React, { useEffect, useMemo, useRef, useState } from "react";
import s from "./Carousel.module.scss";
import Icon from "../Icon";

type Slide = {
  id?: string | number;
  src: string;
  alt?: string;
  href?: string; // опционально — если нужно кликать по баннеру
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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const startXRef = useRef(0);
  const widthRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  const canAutoPlay = autoPlay && !isHover && !isFocusWithin && slides.length > 1 && !prefersReducedMotion();

  function prefersReducedMotion() {
    return typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  // Автоплей
  useEffect(() => {
    if (!canAutoPlay) return;
    const id = window.setInterval(() => goTo(index + 1), interval);
    return () => window.clearInterval(id);
  }, [canAutoPlay, index, interval]);

  // Сообщаем о смене индекса
  useEffect(() => {
    onIndexChange?.(normalized(index));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  // Хелперы индекса
  const last = slides.length - 1;
  const normalized = (i: number) => {
    if (!loop) return clamp(i, 0, last);
    const m = slides.length;
    return ((i % m) + m) % m;
  };

  const goTo = (i: number) => setIndex((prev) => normalized(i));
  const prev = () => goTo(index - 1);
  const next = () => goTo(index + 1);

  // Пересчёт ширины
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

  // Обработчики фокуса
  const onFocusIn = () => setIsFocusWithin(true);
  const onFocusOut = (e: React.FocusEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsFocusWithin(false);
    }
  };

  // Клавиатура
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

  // Свайп (Pointer Events)
  const onPointerDown: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (slides.length <= 1) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    pointerIdRef.current = e.pointerId;
    startXRef.current = e.clientX;
  };

  const onPointerMove: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (pointerIdRef.current !== e.pointerId) return;
    const dx = e.clientX - startXRef.current;
    setDragPx(dx);
  };

  const onPointerUp: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (pointerIdRef.current !== e.pointerId) return;
    const w = widthRef.current || 1;
    const dragPercent = Math.abs(dragPx) / w;
    const threshold = 0.2; // 20% ширины
    if (dragPercent > threshold) {
      dragPx < 0 ? next() : prev();
    }
    setDragPx(0);
    pointerIdRef.current = null;
  };

  // Трансформ трека (с учётом перетаскивания)
  const trackStyle = useMemo(() => {
    const w = widthRef.current || 1;
    const dragPercent = (dragPx / w) * 100;
    const base = -normalized(index) * 100;
    const x = base + dragPercent;
    return { transform: `translate3d(${x}%, 0, 0)` } as React.CSSProperties;
  }, [dragPx, index, slides.length]);

  return (
    <div
      className={[s.carousel, className].filter(Boolean).join(" ")}
      style={{ aspectRatio }}
      ref={containerRef}
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
      onFocus={onFocusIn}
      onBlur={onFocusOut}
      onKeyDown={onKeyDown}
      role="region"
      aria-roledescription="carousel"
      aria-label="Баннеры"
    >
      <div
        className={s.viewport}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <ul className={s.track} style={trackStyle}>
          {slides.map((slide, i) => (
            <li className={s.slide} key={slide.id ?? i} aria-hidden={normalized(index) !== i}>
              {slide.href ? (
                <a href={slide.href} className={s.link} tabIndex={normalized(index) === i ? 0 : -1}>
                  <img className={s.img} src={slide.src} alt={slide.alt ?? ""} loading="lazy" />
                  {slide.content && <div className={s.overlay}>{slide.content}</div>}
                </a>
              ) : (
                <>
                  <img className={s.img} src={slide.src} alt={slide.alt ?? ""} loading="lazy" />
                  {slide.content && <div className={s.overlay}>{slide.content}</div>}
                </>
              )}
            </li>
          ))}
        </ul>
      </div>

      {showArrows && slides.length > 1 && (
        <>
          <button className={`${s.arrow} ${s.left}`} aria-label="Предыдущий слайд" onClick={prev}>
            <Icon name="arrow-left" size="1.6rem" />
          </button>
          <button className={`${s.arrow} ${s.right}`} aria-label="Следующий слайд" onClick={next}>
            <Icon name="arrow-right" size="1.6rem" />
          </button>
        </>
      )}

      {showDots && slides.length > 1 && (
        <div className={s.dots} role="tablist" aria-label="Навигация по слайдам">
          {slides.map((_, i) => {
            const active = normalized(index) === i;
            return (
              <button
                key={i}
                role="tab"
                aria-selected={active}
                aria-label={`Слайд ${i + 1}`}
                className={`${s.dot} ${active ? s.active : ""}`}
                onClick={() => goTo(i)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}
