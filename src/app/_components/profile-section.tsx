"use client";

import {
  signInWithDiscordForm,
  signOutFromApp,
} from "~/server/auth/actions";
import { CheckIcon } from "~/app/_components/icons";
import { SettingsToggle } from "~/app/_components/settings-toggle";
import { useProfileCache } from "~/hooks/use-profile-cache";
import { api } from "~/trpc/react";
import { applyAppearance, storeDarkMode } from "~/types/appearance";
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
  const setDarkMode = api.user.setDarkMode.useMutation({
    onSuccess: (data) => {
      setUser(data);
      applyAppearance(data.darkMode);
      storeDarkMode(data.darkMode);
    },
  });

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-5 sm:py-6">
      <h1 className="page-title mb-5 sm:mb-6">Profile</h1>

      {user.isGuest && (
        <div className="app-card guest-banner mb-6 p-4">
          <p className="guest-banner-text text-sm leading-relaxed">
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
            className="h-14 w-14 rounded-full border-2 border-edge object-cover"
          />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-lg font-semibold text-brand-700">
            {(user.name ?? user.email ?? "?").charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate font-medium text-fg">
            {user.name ?? "Signed in"}
          </p>
          {user.isGuest ? (
            <p className="truncate text-sm text-fg-muted">Guest account</p>
          ) : (
            user.email && (
              <p className="truncate text-sm text-fg-muted">{user.email}</p>
            )
          )}
        </div>
      </div>

      <section className="app-card mb-6 overflow-hidden">
        <h2 className="section-heading">Appearance</h2>
        <SettingsToggle
          checked={user.darkMode}
          disabled={setDarkMode.isPending}
          borderBottom
          label="Dark mode"
          description="Use a dark background and lighter text throughout the app."
          onChange={() =>
            setDarkMode.mutate({ darkMode: !user.darkMode })
          }
        />
        <div className="px-4 py-4">
          <p className="mb-3 font-medium text-fg">Theme color</p>
          <p className="mb-4 text-sm text-fg-muted">
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
                        ? "ring-2 ring-offset-2 ring-fg ring-offset-surface"
                        : "ring-1 ring-edge"
                    }`}
                    style={{ backgroundColor: theme.swatch }}
                  >
                    {selected && <CheckIcon className="h-4 w-4 text-white" />}
                  </span>
                  <span
                    className={`text-xs ${
                      selected
                        ? "font-semibold text-fg"
                        : "font-medium text-fg-muted"
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
        <h2 className="section-heading">Settings</h2>
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
          className="sign-out-btn app-card w-full px-4 py-3 text-center text-sm font-medium text-red-500 transition"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
