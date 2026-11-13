'use client';
import { useState, useEffect, useRef } from 'react';

export function useExamTimer(durationSeconds: number, onExpire: () => void) {
  const [timeLeft, setTimeLeft] = useState(durationSeconds);
  const expiredRef = useRef(false);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | undefined;
    const initialize = window.setTimeout(() => {
      intervalId = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (intervalId) clearInterval(intervalId);
            if (!expiredRef.current) { expiredRef.current = true; onExpire(); }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, 0);
    return () => {
      window.clearTimeout(initialize);
      if (intervalId) clearInterval(intervalId);
    };
  }, [onExpire]);

  const fmt = (s: number) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return h > 0
      ? `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
      : `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  };

  return { timeLeft, formattedTime: fmt(timeLeft), isWarning: timeLeft < 300, isCritical: timeLeft < 60 };
}

export function usePerQuestionTimer(seconds: number, onExpire: () => void, questionIdx: number) {
  const [timeLeft, setTimeLeft] = useState(seconds);

  useEffect(() => {
    const initialize = window.setTimeout(() => setTimeLeft(seconds), 0);
    const id = setInterval(() => {
      setTimeLeft((prev) => { if (prev <= 1) { clearInterval(id); onExpire(); return 0; } return prev - 1; });
    }, 1000);
    return () => {
      window.clearTimeout(initialize);
      clearInterval(id);
    };
  }, [questionIdx, seconds, onExpire]);

  return { timeLeft, formattedTime: `${String(Math.floor(timeLeft/60)).padStart(2,'0')}:${String(timeLeft%60).padStart(2,'0')}` };
}
