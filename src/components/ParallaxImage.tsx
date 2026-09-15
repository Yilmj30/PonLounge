"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

// A background photo that drifts slightly as the section scrolls through
// the viewport — the "interactive" background treatment used on Hero,
// About, and the Gallery tiles. The image is scaled up so the drift never
// reveals empty edges. Skips the effect entirely for
// prefers-reduced-motion, and is otherwise a static cover photo.
export default function ParallaxImage({
  src,
  alt,
  className = "",
  priority = false,
  sizes = "100vw",
  strength = 26,
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
  strength?: number;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    function update() {
      const el = wrapperRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const viewportMid = window.innerHeight / 2;
      const elMid = rect.top + rect.height / 2;
      // -1 when the section is centered above the viewport's midpoint,
      // +1 when centered below it — drives the drift direction/amount.
      const progress = Math.max(
        -1,
        Math.min(
          1,
          (elMid - viewportMid) / (window.innerHeight / 2 + rect.height / 2),
        ),
      );
      setOffset(progress * strength);
    }
    function onScroll() {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    }

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [strength]);

  return (
    <div ref={wrapperRef} className={`overflow-hidden ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        className="object-cover"
        style={{ transform: `translateY(${offset}px) scale(1.18)` }}
      />
    </div>
  );
}
