import Link from "next/link";

import { BrandLogo, BrandName } from "~/app/_components/app-brand";
import { signOutFromApp } from "~/server/auth/actions";

type SignOutCardProps = {
  showBackLink?: boolean;
};

export function SignOutCard({ showBackLink = true }: SignOutCardProps) {
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
          <p className="mt-2 text-sm text-stone-500">Sign out of your account</p>
        </div>

        <p className="mb-6 text-center text-sm leading-relaxed text-stone-600 sm:mb-8">
          You&apos;ll need to sign in again to access your stores, shopping
          list, and favorites.
        </p>

        <div className="flex flex-col gap-3">
          <form action={signOutFromApp}>
            <button
              type="submit"
              className="w-full rounded-xl bg-red-600 px-4 py-3 text-base font-semibold text-white transition hover:bg-red-700 active:scale-[0.98]"
            >
              Sign out
            </button>
          </form>

          {showBackLink && (
            <Link href="/" className="btn-secondary block min-h-[2.75rem] px-4 py-3 text-center">
              Cancel
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
