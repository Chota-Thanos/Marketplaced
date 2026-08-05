"use client";

import { useState, useEffect } from 'react';
import { Timer } from 'lucide-react';

export function FlashSaleCountdown({ targetDate }) {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const end = new Date(targetDate).getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = end - now;

      if (distance < 0) {
        clearInterval(interval);
        return;
      }

      setTimeLeft({
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <div className="flex items-center space-x-2 bg-danger/20 text-danger px-3 py-1.5 rounded-pill border border-danger/50 w-fit">
      <Timer size={16} />
      <span className="text-sm font-medium tracking-wider">
        FLASH SALE ENDS IN: {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
      </span>
    </div>
  );
}
