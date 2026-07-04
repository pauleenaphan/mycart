import Image from "next/image";

type BrandLogoProps = {
  size?: "sm" | "md" | "lg";
};

const logoPixels = {
  sm: 36,
  md: 44,
  lg: 80,
} as const;

const logoSizes = {
  sm: "h-9 w-9",
  md: "h-11 w-11",
  lg: "h-20 w-20",
};

export function BrandLogo({ size = "md" }: BrandLogoProps) {
  const pixels = logoPixels[size];

  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-xl shadow-md shadow-stone-900/10 ${logoSizes[size]}`}
    >
      <Image
        src="/logo.png"
        alt="MyCart logo"
        width={pixels}
        height={pixels}
        className="h-full w-full object-cover"
        priority={size === "lg"}
      />
    </div>
  );
}

export function BrandName({ className = "" }: { className?: string }) {
  return (
    <span className={`font-bold tracking-tight text-stone-900 ${className}`}>
      My<span className="text-brand-600">Cart</span>
    </span>
  );
}

export function AppHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-stone-200/80 bg-canvas/95 pt-[var(--spacing-safe-top)] backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-lg items-center gap-3 px-4 py-3">
        <BrandLogo size="sm" />
        <div>
          <p className="text-lg leading-none">
            <BrandName />
          </p>
          <p className="mt-0.5 text-xs text-stone-500">Shop smarter</p>
        </div>
      </div>
    </header>
  );
}
