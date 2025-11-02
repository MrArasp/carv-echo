import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface CountdownTimerProps {
  unlockAt: string;
}

export const CountdownTimer = ({ unlockAt }: CountdownTimerProps) => {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime();
      const target = new Date(unlockAt).getTime();
      const difference = target - now;

      if (difference <= 0) {
        setIsExpired(true);
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [unlockAt]);

  if (isExpired) {
    return (
      <div className="flex items-center gap-2 text-success">
        <Clock className="h-5 w-5 animate-pulse-glow" />
        <span className="font-bold">Ready to Reveal!</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Clock className="h-5 w-5 text-primary animate-pulse-glow" />
      <div className="flex gap-2 font-mono text-lg">
        <span className="bg-muted/30 px-3 py-1 rounded">
          {String(timeLeft.hours).padStart(2, '0')}h
        </span>
        <span className="bg-muted/30 px-3 py-1 rounded">
          {String(timeLeft.minutes).padStart(2, '0')}m
        </span>
        <span className="bg-muted/30 px-3 py-1 rounded">
          {String(timeLeft.seconds).padStart(2, '0')}s
        </span>
      </div>
    </div>
  );
};
