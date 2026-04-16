import { useEffect, useState } from "react";

interface CountdownProps {
  targetDate: string;
}

export function Countdown({ targetDate }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const calculateTimeLeft = () => {
      const target = new Date(targetDate).getTime();
      const now = new Date().getTime();
      const difference = target - now;

      if (difference <= 0) {
        setTimeLeft("Started");
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      const parts = [];
      if (days > 0) parts.push(`${days} Day${days !== 1 ? 's' : ''}`);
      if (hours > 0) parts.push(`${hours} Hour${hours !== 1 ? 's' : ''}`);
      if (minutes > 0) parts.push(`${minutes} Minute${minutes !== 1 ? 's' : ''}`);
      if (seconds > 0 && days === 0) parts.push(`${seconds} Second${seconds !== 1 ? 's' : ''}`);

      setTimeLeft(parts.slice(0, 3).join(' '));
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  if (!timeLeft) return null;

  return (
    <div className="text-sm text-[var(--gold-600)] mt-1">
      {timeLeft === "Started" ? "Already started" : `In ${timeLeft}`}
    </div>
  );
}
