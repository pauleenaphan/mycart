import { type ReactNode } from "react";

import { BrandLogo, BrandName } from "~/app/_components/app-brand";

type AuthCardShellProps = {
  subtitle: string;
  children: ReactNode;
};

export function AuthCardShell({ subtitle, children }: AuthCardShellProps) {
  return (
    <div className="login-shell relative flex min-h-[100dvh] items-center justify-center overflow-hidden px-4 py-8 pt-[max(2rem,var(--spacing-safe-top))] pb-[max(2rem,var(--spacing-safe-bottom))] sm:py-10">
      <div className="login-glow login-glow-left" aria-hidden />
      <div className="login-glow login-glow-right" aria-hidden />

      <div className="login-card list-item-enter w-full max-w-md p-6 sm:p-8">
        <div className="mb-6 flex flex-col items-center text-center sm:mb-8">
          <BrandLogo size="lg" />
          <h1 className="mt-4 text-2xl sm:mt-5 sm:text-3xl">
            <BrandName />
          </h1>
          <p className="mt-2 text-sm text-stone-500">{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  );
}
