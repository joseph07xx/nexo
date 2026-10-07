import { cn } from "@/lib/utils";

interface NexoLogoProps {
  className?: string;
  size?: number;
}

export function NexoLogo({ className, size = 32 }: NexoLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-label="NEXO"
    >
      <defs>
        <linearGradient id="nexo-gradient" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="var(--color-primary)" />
          <stop offset="100%" stopColor="var(--color-secondary)" />
        </linearGradient>
      </defs>
      
      {/* Left shape - Person 1 */}
      <path
        d="M6 6 L6 26 L12 26 L12 14 L16 20 L16 26 L22 26 L22 10"
        stroke="url(#nexo-gradient)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      
      {/* Right shape - Person 2 */}
      <path
        d="M26 26 L26 6 L20 6 L20 18 L16 12 L16 6 L10 6 L10 22"
        stroke="url(#nexo-gradient)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.6"
      />
    </svg>
  );
}