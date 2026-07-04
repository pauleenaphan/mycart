import Link from "next/link";

import { BrandLogo, BrandName } from "~/app/_components/app-brand";
import { signInWithDiscordForm } from "~/server/auth/actions";

function DiscordIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
      <path d="M20.32 4.37a18.2 18.2 0 0 0-4.53-1.4.13.13 0 0 0-.14.07c-.2.36-.43.84-.59 1.21-1.7-.25-3.39-.25-5.06 0-.16-.38-.4-.86-.6-1.22a.13.13 0 0 0-.13-.07 18.1 18.1 0 0 0-5.53 1.4.12.12 0 0 0-.06.05C2.6 8.83 2 11.39 2.2 13.93a18.5 18.5 0 0 0 5.62 2.84.12.12 0 0 0 .13-.04c.45-.61.85-1.26 1.2-1.94a.12.12 0 0 0-.07-.17 12.1 12.1 0 0 1-1.73-.82.12.12 0 0 1-.01-.2c.12-.09.24-.18.35-.27a.12.12 0 0 1 .13-.01c3.63 1.66 7.56 1.66 11.16 0a.12.12 0 0 1 .13.01c.11.09.23.18.35.27a.12.12 0 0 1 0 .2 11.4 11.4 0 0 1-1.74.82.12.12 0 0 0-.07.17c.36.68.76 1.33 1.2 1.94a.12.12 0 0 0 .13.04 18.4 18.4 0 0 0 5.62-2.84c.2-2.8-.34-5.33-1.5-7.51a.1.1 0 0 0-.05-.05ZM8.02 13.9c-1.09 0-1.99-1-1.99-2.23s.88-2.24 1.99-2.24c1.12 0 2.01 1.01 1.99 2.24 0 1.23-.88 2.23-1.99 2.23Zm7.95 0c-1.09 0-1.99-1-1.99-2.23s.88-2.24 1.99-2.24c1.12 0 2.01 1.01 1.99 2.24 0 1.23-.87 2.23-1.99 2.23Z" />
    </svg>
  );
}

const features = [
  "Save your favorite grocery stores",
  "Build a list organized by store",
  "Look up prices with Gemini when you add new items",
];

const errorMessages: Record<string, string> = {
  Configuration: "Sign-in is not configured correctly. Check your auth settings.",
  AccessDenied: "Access was denied. You may not have permission to sign in.",
  Verification: "The sign-in link has expired. Please try again.",
  OAuthSignin: "Could not start Discord sign-in. Please try again.",
  OAuthCallback: "Discord sign-in failed. Please try again.",
  OAuthAccountNotLinked:
    "This account is already linked to another sign-in method.",
  Default: "Something went wrong while signing in. Please try again.",
};

type SignInCardProps = {
  callbackUrl?: string;
  error?: string;
  showBackLink?: boolean;
};

export function SignInCard({
  callbackUrl = "/",
  error,
  showBackLink = false,
}: SignInCardProps) {
  const errorMessage = error ? (errorMessages[error] ?? errorMessages.Default) : null;

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
          <p className="mt-2 text-sm text-stone-500">
            Your smart grocery shopping list
          </p>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            {errorMessage}
          </div>
        )}

        <ul className="mb-6 space-y-3 sm:mb-8">
          {features.map((feature) => (
            <li
              key={feature}
              className="flex items-start gap-3 text-sm text-stone-600"
            >
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                <svg
                  viewBox="0 0 12 12"
                  className="h-3 w-3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden
                >
                  <path d="M2 6l3 3 5-5" strokeLinecap="round" />
                </svg>
              </span>
              {feature}
            </li>
          ))}
        </ul>

        <form action={signInWithDiscordForm}>
          <input type="hidden" name="callbackUrl" value={callbackUrl} />
          <button type="submit" className="btn-discord">
            <DiscordIcon />
            Sign in with Discord
          </button>
        </form>

        <p className="mt-5 text-center text-xs leading-relaxed text-stone-400">
          Sign in to sync your stores, shopping list, and favorites across
          devices.
        </p>

        {showBackLink && (
          <p className="mt-4 text-center text-sm">
            <Link href="/" className="text-brand-600 hover:text-brand-800">
              ← Back to home
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
