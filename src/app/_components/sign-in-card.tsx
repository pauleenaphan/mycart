import Link from "next/link";

import { AuthCardShell } from "~/app/_components/auth-card-shell";
import { CheckIcon, DiscordIcon } from "~/app/_components/icons";
import { signInWithDiscordForm } from "~/server/auth/actions";

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
    <AuthCardShell subtitle="Your smart grocery shopping list">
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
              <CheckIcon className="h-3 w-3" />
            </span>
            {feature}
          </li>
        ))}
      </ul>

      <form action={signInWithDiscordForm}>
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        <button type="submit" className="btn-discord">
          <DiscordIcon className="h-5 w-5" />
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
    </AuthCardShell>
  );
}
