"use client";

import { memo, useCallback, useEffect, useRef } from "react";

type GlowingEffectProps = {
  accent: string;
  inactiveZone?: number;
  proximity?: number;
};

const GlowingEffect = memo(function GlowingEffect({
  accent,
  inactiveZone = 0.56,
  proximity = 44,
}: GlowingEffectProps) {
  const effectRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);
  const lastPointer = useRef({ x: 0, y: 0 });

  const updateEffect = useCallback(
    (event?: PointerEvent) => {
      if (event) lastPointer.current = { x: event.clientX, y: event.clientY };
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);

      frameRef.current = requestAnimationFrame(() => {
        const element = effectRef.current;
        if (!element) return;

        const { left, top, width, height } = element.getBoundingClientRect();
        const { x, y } = lastPointer.current;
        const centerX = left + width / 2;
        const centerY = top + height / 2;
        const distance = Math.hypot(x - centerX, y - centerY);
        const inactiveRadius = Math.min(width, height) * inactiveZone * 0.5;
        const isNearby =
          distance >= inactiveRadius &&
          x > left - proximity &&
          x < left + width + proximity &&
          y > top - proximity &&
          y < top + height + proximity;

        element.style.setProperty("--portrait-glow-active", isNearby ? "1" : "0");
        if (!isNearby) return;

        const angle = (Math.atan2(y - centerY, x - centerX) * 180) / Math.PI + 90;
        element.style.setProperty("--portrait-glow-angle", `${angle}deg`);
      });
    },
    [inactiveZone, proximity],
  );

  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => updateEffect(event);
    const onScroll = () => updateEffect();

    document.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      document.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("scroll", onScroll);
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [updateEffect]);

  return (
    <div
      ref={effectRef}
      className="portrait-glow"
      aria-hidden="true"
      style={{ "--portrait-accent": accent } as React.CSSProperties}
    />
  );
});

GlowingEffect.displayName = "GlowingEffect";

export { GlowingEffect };

