'use client';

import { useState, useEffect } from 'react';

interface CountdownProps {
  targetTime: number;
}

export function Countdown({ targetTime }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const updateTime = () => {
      const now = Date.now();
      setTimeLeft(Math.max(0, targetTime - now));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, [targetTime]);

  if (timeLeft <= 0) {
    return <span className="text-red-400 font-medium">Time's up!</span>;
  }

  const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

  return (
    <div className="flex items-center gap-4 text-yellow-400 font-mono">
      {days > 0 && (
        <div className="text-center">
          <div className="text-2xl font-bold">{days}</div>
          <div className="text-xs text-gray-400">DAYS</div>
        </div>
      )}
      <div className="text-center">
        <div className="text-2xl font-bold">{hours.toString().padStart(2, '0')}</div>
        <div className="text-xs text-gray-400">HRS</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold">{minutes.toString().padStart(2, '0')}</div>
        <div className="text-xs text-gray-400">MIN</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold">{seconds.toString().padStart(2, '0')}</div>
        <div className="text-xs text-gray-400">SEC</div>
      </div>
    </div>
  );
}
