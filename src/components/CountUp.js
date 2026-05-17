'use client';

import { useState, useEffect } from 'react';

export default function CountUp({ end, duration = 1.5, decimals = 0, suffix = '' }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / (duration * 1000), 1);
      
      // Easing function (easeOutQuart)
      const easeProgress = 1 - Math.pow(1 - progress, 4);
      setCount(easeProgress * end);
      
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    
    window.requestAnimationFrame(step);
  }, [end, duration]);

  return <span>{count.toFixed(decimals)}{suffix}</span>;
}
