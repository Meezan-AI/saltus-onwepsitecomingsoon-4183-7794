import { useEffect, useState } from "react";

function getTarget() {
  const d = new Date();
  d.setDate(d.getDate() + 45);
  return d.getTime();
}

function useCountdown() {
  const [target] = useState(getTarget);
  const [remaining, setRemaining] = useState(target - Date.now());

  useEffect(() => {
    const id = setInterval(() => setRemaining(target - Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]);

  const clamped = Math.max(remaining, 0);
  const days = Math.floor(clamped / (1000 * 60 * 60 * 24));
  const hours = Math.floor((clamped / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((clamped / (1000 * 60)) % 60);
  const seconds = Math.floor((clamped / 1000) % 60);

  return { days, hours, minutes, seconds };
}

export function Countdown() {
  const { days, hours, minutes, seconds } = useCountdown();
  const units = [
    { label: "Days", value: days },
    { label: "Hours", value: hours },
    { label: "Minutes", value: minutes },
    { label: "Seconds", value: seconds },
  ];

  return (
    <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
      {units.map((u) => (
        <div
          key={u.label}
          className="glass-card flex w-24 flex-col items-center rounded-2xl py-5 sm:w-28"
        >
          <span className="font-display text-3xl font-extrabold text-white sm:text-4xl">
            {String(u.value).padStart(2, "0")}
          </span>
          <span className="mt-1 text-xs font-medium uppercase tracking-widest text-[#B9C2D0]">{u.label}</span>
        </div>
      ))}
    </div>
  );
}
