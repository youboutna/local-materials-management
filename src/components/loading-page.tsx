import { cn } from "@/lib/utils";

interface ElectricSpinnerProps {
  size?: number;
  className?: string;
  speed?: "slow" | "normal" | "fast";
}

export function ElectricSpinner({
  size = 84,
  className,
  speed = "normal",
}: ElectricSpinnerProps) {
  const speedClasses = {
    slow: "animate-spin-slow",
    normal: "animate-spin",
    fast: "animate-spin-fast",
  };

  return (
    <div className={cn("inline-flex", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        className={cn(speedClasses[speed])}
      >
        {/* Outer electric ring */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="url(#electricGradient)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="15,30"
          className="animate-pulse"
        />

        {/* Inner spinning arc */}
        <path
          d="M50 10 A40 40 0 1 1 50 90 A40 40 0 1 1 50 10"
          fill="none"
          stroke="url(#arcGradient)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="5,250"
        >
          <animate
            attributeName="stroke-dashoffset"
            from="0"
            to="255"
            dur="1.5s"
            repeatCount="indefinite"
          />
        </path>

        {/* Center electric dot */}
        <circle
          cx="50"
          cy="50"
          r="4"
          fill="url(#centerGradient)"
          className="animate-pulse"
        >
          <animate
            attributeName="r"
            values="4;6;4"
            dur="1s"
            repeatCount="indefinite"
          />
        </circle>

        <defs>
          <linearGradient
            id="electricGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#00ff87" />
            <stop offset="25%" stopColor="#60efff" />
            <stop offset="50%" stopColor="#0061ff" />
            <stop offset="75%" stopColor="#ff0080" />
            <stop offset="100%" stopColor="#00ff87" />
          </linearGradient>

          <linearGradient id="arcGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ff0080" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#0061ff" stopOpacity="1" />
            <stop offset="100%" stopColor="#00ff87" stopOpacity="0.8" />
          </linearGradient>

          <radialGradient id="centerGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#60efff" />
            <stop offset="100%" stopColor="#0061ff" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
}
