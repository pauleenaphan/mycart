type IconProps = {
  className?: string;
};

export function CheckIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 12 12"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ChevronDownIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function PlusIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

export function ListAddIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <path d="M12 11v6M9 14h6" strokeLinecap="round" />
    </svg>
  );
}

export function StarIcon({
  className,
  filled,
}: IconProps & { filled?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function StorePinIcon({ className, strokeWidth = 1.75 }: IconProps & { strokeWidth?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      aria-hidden
    >
      <path
        d="M12 21s7-5.5 7-12a7 7 0 1 0-14 0c0 6.5 7 12 7 12z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  );
}

export function DiscordIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M20.32 4.37a18.2 18.2 0 0 0-4.53-1.4.13.13 0 0 0-.14.07c-.2.36-.43.84-.59 1.21-1.7-.25-3.39-.25-5.06 0-.16-.38-.4-.86-.6-1.22a.13.13 0 0 0-.13-.07 18.1 18.1 0 0 0-5.53 1.4.12.12 0 0 0-.06.05C2.6 8.83 2 11.39 2.2 13.93a18.5 18.5 0 0 0 5.62 2.84.12.12 0 0 0 .13-.04c.45-.61.85-1.26 1.2-1.94a.12.12 0 0 0-.07-.17 12.1 12.1 0 0 1-1.73-.82.12.12 0 0 1-.01-.2c.12-.09.24-.18.35-.27a.12.12 0 0 1 .13-.01c3.63 1.66 7.56 1.66 11.16 0a.12.12 0 0 1 .13.01c.11.09.23.18.35.27a.12.12 0 0 1 0 .2 11.4 11.4 0 0 1-1.74.82.12.12 0 0 0-.07.17c.36.68.76 1.33 1.2 1.94a.12.12 0 0 0 .13.04 18.4 18.4 0 0 0 5.62-2.84c.2-2.8-.34-5.33-1.5-7.51a.1.1 0 0 0-.05-.05ZM8.02 13.9c-1.09 0-1.99-1-1.99-2.23s.88-2.24 1.99-2.24c1.12 0 2.01 1.01 1.99 2.24 0 1.23-.88 2.23-1.99 2.23Zm7.95 0c-1.09 0-1.99-1-1.99-2.23s.88-2.24 1.99-2.24c1.12 0 2.01 1.01 1.99 2.24 0 1.23-.87 2.23-1.99 2.23Z" />
    </svg>
  );
}
