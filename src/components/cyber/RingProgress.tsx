interface RingProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
}

export function RingProgress({ percentage, size = 120, strokeWidth = 8 }: RingProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = (percentage / 100) * circumference;
  const unfilled = circumference - filled;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background ring with breathing glow */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
          className="breathe-glow"
        />
        {/* Foreground ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#cyber-gradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={unfilled}
          className="transition-all duration-700 ease-out"
          style={{ filter: "drop-shadow(0 0 6px rgba(102, 252, 241, 0.5))" }}
        />
        <defs>
          <linearGradient id="cyber-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#45A29E" />
            <stop offset="100%" stopColor="#66FCF1" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-primary font-mono">{percentage}%</span>
        <span className="text-[10px] text-muted-foreground mt-0.5">完整度</span>
      </div>
    </div>
  );
}
