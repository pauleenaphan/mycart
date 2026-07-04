"use client";

import {
  signInWithDiscordForm,
  signOutFromApp,
} from "~/server/auth/actions";
import { CheckIcon } from "~/app/_components/icons";
import { SettingsToggle } from "~/app/_components/settings-toggle";
import { useProfileCache } from "~/hooks/use-profile-cache";
import { api } from "~/trpc/react";
import { THEME_OPTIONS } from "~/types/theme";
import { type UserProfile } from "~/types/user";

type ProfileSectionProps = {
  user: UserProfile;
};

export function ProfileSection({ user }: ProfileSectionProps) {
  const { setUser } = useProfileCache();

  const setClearOnCheck = api.user.setClearOnCheck.useMutation({
    onSuccess: setUser,
  });
  const setUseGeminiPrices = api.user.setUseGeminiPrices.useMutation({
    onSuccess: setUser,
  });
  const setCollapseCompletedStores =
    api.user.setCollapseCompletedStores.useMutation({ onSuccess: setUser });
  const setThemeColor = api.user.setThemeColor.useMutation({ onSuccess: setUser });

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-5 sm:py-6">
      <h1 className="page-title mb-5 sm:mb-6">Profile</h1>

      {user.isGuest && (
        <div className="app-card mb-6 border-amber-200 bg-amber-50 p-4">
          <p className="text-sm leading-relaxed text-amber-900">
            You&apos;re browsing as a guest. Sign in with Discord to save your
            stores and list across devices.
          </p>
          <form action={signInWithDiscordForm} className="mt-3">
            <input type="hidden" name="callbackUrl" value="/" />
            <button type="submit" className="btn-discord w-full">
              Sign in with Discord
            </button>
          </form>
        </div>
      )}

      <div className="app-card mb-6 flex items-center gap-4 p-4">
        {user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.image}
            alt=""
            className="h-14 w-14 rounded-full border-2 border-stone-200 object-cover"
          />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-lg font-semibold text-brand-700">
            {(user.name ?? user.email ?? "?").charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate font-medium text-stone-900">
            {user.name ?? "Signed in"}
          </p>
          {user.isGuest ? (
            <p className="truncate text-sm text-stone-500">Guest account</p>
          ) : (
            user.email && (
              <p className="truncate text-sm text-stone-500">{user.email}</p>
            )
          )}
        </div>
      </div>

      <section className="app-card mb-6 overflow-hidden">
        <h2 className="border-b border-stone-100 px-4 py-3 text-xs font-semibold tracking-wider text-stone-500 uppercase">
          Appearance
        </h2>
        <div className="px-4 py-4">
          <p className="mb-3 font-medium text-stone-900">Theme color</p>
          <p className="mb-4 text-sm text-stone-500">
            Choose an accent color for buttons, links, and highlights.
          </p>
          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            {THEME_OPTIONS.map((theme) => {
              const selected = user.themeColor === theme.id;

              return (
                <button
                  key={theme.id}
                  type="button"
                  disabled={setThemeColor.isPending}
                  onClick={() => setThemeColor.mutate({ themeColor: theme.id })}
                  className="flex flex-col items-center gap-2"
                  aria-pressed={selected}
                  aria-label={`${theme.label} theme`}
                >
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-full transition sm:h-11 sm:w-11 ${
                      selected
                        ? "ring-2 ring-offset-2 ring-stone-900"
                        : "ring-1 ring-stone-200"
                    }`}
                    style={{ backgroundColor: theme.swatch }}
                  >
                    {selected && <CheckIcon className="h-4 w-4 text-white" />}
                  </span>
                  <span
                    className={`text-xs ${
                      selected
                        ? "font-semibold text-stone-900"
                        : "font-medium text-stone-500"
                    }`}
                  >
                    {theme.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="app-card overflow-hidden">
        <h2 className="border-b border-stone-100 px-4 py-3 text-xs font-semibold tracking-wider text-stone-500 uppercase">
          Settings
        </h2>
        <SettingsToggle
          checked={user.useGeminiPrices}
          disabled={setUseGeminiPrices.isPending}
          borderBottom
          label="Gemini price lookup"
          description="Search store websites for prices when you add new items."
          onChange={() =>
            setUseGeminiPrices.mutate({
              useGeminiPrices: !user.useGeminiPrices,
            })
          }
        />
        <SettingsToggle
          checked={user.clearOnCheck}
          disabled={setClearOnCheck.isPending}
          borderBottom
          label="Clear item when checked"
          description="Remove items from your list after you check them off."
          onChange={() =>
            setClearOnCheck.mutate({ clearOnCheck: !user.clearOnCheck })
          }
        />
        <SettingsToggle
          checked={user.collapseCompletedStores}
          disabled={setCollapseCompletedStores.isPending}
          label="Collapse completed stores"
          description="When every item at a store is checked off, fold that section until you expand it."
          onChange={() =>
            setCollapseCompletedStores.mutate({
              collapseCompletedStores: !user.collapseCompletedStores,
            })
          }
        />
      </section>

      <form action={signOutFromApp} className="mt-6">
        <button
          type="submit"
          className="app-card w-full px-4 py-3 text-center text-sm font-medium text-red-600 transition hover:bg-red-50"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
