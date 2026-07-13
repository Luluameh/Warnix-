// components/layout/AnimatedCounter.tsx
'use client';

import React, { useEffect, useState, useRef } from 'react';

interface AnimatedCounterProps {
  value: number;
  duration?: number; // duration in ms
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({ value, duration = 400 }) => {
  const [displayValue, setDisplayValue] = useState<number>(value);
  const previousValueRef = useRef<number>(value);

  useEffect(() => {
    const start = previousValueRef.current;
    const end = value;
    if (start === end) return;

    let startTimestamp: number | null = null;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Ease out quad formula
      const easedProgress = progress * (2 - progress);
      const current = Math.floor(start + easedProgress * (end - start));
      setDisplayValue(current);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setDisplayValue(end);
        previousValueRef.current = end;
      }
    };

    window.requestAnimationFrame(step);
  }, [value, duration]);

  return <>{displayValue}</>;
};
export default AnimatedCounter;
