"use client";

import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

type AnimatedNumberProps = {
  value: number;
  format: (value: number) => string;
  durationMs?: number;
};

/** Counts up/down to `value` with an ease-out; jumps straight there under reduced motion. */
export function AnimatedNumber({ value, format, durationMs = 900 }: AnimatedNumberProps) {
  const reducedMotion = usePrefersReducedMotion();
  // Start at 0 (the count-up origin) so the server render doesn't flash the final value first.
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);

  useEffect(() => {
    if (reducedMotion) {
      setDisplay(value);
      fromRef.current = value;
      return;
    }

    const from = fromRef.current;
    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (value - from) * eased);
      if (t < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        fromRef.current = value;
      }
    };

    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      fromRef.current = value;
    };
  }, [value, durationMs, reducedMotion]);

  // The final value is what assistive tech should hear, not every frame.
  return (
    <>
      <span aria-hidden>{format(display)}</span>
      <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
        {format(value)}
      </span>
    </>
  );
}
