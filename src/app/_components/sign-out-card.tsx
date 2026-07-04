import Link from "next/link";

import { AuthCardShell } from "~/app/_components/auth-card-shell";
import { signOutFromApp } from "~/server/auth/actions";

type SignOutCardProps = {
  showBackLink?: boolean;
};

export function SignOutCard({ showBackLink = true }: SignOutCardProps) {
  return (
    <AuthCardShell subtitle="Sign out of your account">
      <p className="mb-6 text-center text-sm leading-relaxed text-stone-600 sm:mb-8">
        You&apos;ll need to sign in again to access your stores, shopping list,
        and favorites.
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
    </AuthCardShell>
  );
}
