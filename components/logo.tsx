import { cn } from "@/lib/utils";

/**
 * The icon mark: a snow-capped summit catching a glint of light, above a
 * glacial-water reflection line. Fixed brand colours (not theme-dependent)
 * so it reads consistently on light or dark surfaces.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={cn("h-9 w-9 shrink-0", className)}
      aria-hidden="true"
    >
      <circle cx="50" cy="50" r="49" fill="#0B3C5D" />
      <path d="M22 66 L38 40 L48 54 L58 36 L78 66 Z" fill="#F8FAFC" />
      <path d="M58 36 L64 46 L52 46 Z" fill="#7FB3D5" />
      <path d="M38 40 L42 47 L34 47 Z" fill="#7FB3D5" />
      <path
        d="M70 26 L73 33 L80 36 L73 39 L70 46 L67 39 L60 36 L67 33 Z"
        fill="#B45309"
      />
      <path
        d="M14 68 Q50 60 86 68"
        stroke="#7FB3D5"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        opacity="0.6"
      />
      <path
        d="M18 75 Q50 69 82 75"
        stroke="#7FB3D5"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        opacity="0.35"
      />
    </svg>
  );
}

export function Logo({
  businessName,
  className,
  iconClassName,
  textClassName,
}: {
  businessName: string;
  className?: string;
  iconClassName?: string;
  textClassName?: string;
}) {
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-2.5 overflow-hidden", className)}>
      <LogoMark className={iconClassName} />
      <span
        className={cn(
          "min-w-0 overflow-hidden text-ellipsis whitespace-nowrap font-display text-lg font-semibold leading-tight text-primary",
          textClassName,
        )}
      >
        {businessName}
      </span>
    </span>
  );
}
