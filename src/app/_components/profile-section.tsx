"use client";

import { signOutFromApp } from "~/server/auth/actions";
import { SettingsToggle } from "~/app/_components/settings-toggle";
import { api } from "~/trpc/react";
import { THEME_OPTIONS } from "~/types/theme";
import { type UserProfile } from "~/types/user";

type ProfileSectionProps = {
  user: UserProfile;
};

export function ProfileSection({ user }: ProfileSectionProps) {
  const utils = api.useUtils();

  const setUser = (data: UserProfile) => {
    utils.user.getProfile.setData(undefined, data);
  };

  const setClearOnCheck = api.user.setClearOnCheck.useMutation({
    onSuccess: setUser,
  });

  const setUseGeminiPrices = api.user.setUseGeminiPrices.useMutation({
    onSuccess: setUser,
  });

  const setCollapseCompletedStores =
    api.user.setCollapseCompletedStores.useMutation({
      onSuccess: setUser,
    });

  const setThemeColor = api.user.setThemeColor.useMutation({
    onSuccess: setUser,
  });

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-5 sm:py-6">
      <h1 className="page-title mb-5 sm:mb-6">Profile</h1>

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
          {user.email && (
            <p className="truncate text-sm text-stone-500">{user.email}</p>
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
                    {selected && (
                      <svg
                        viewBox="0 0 12 12"
                        className="h-4 w-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden
                      >
                        <path d="M2 6l3 3 5-5" strokeLinecap="round" />
                      </svg>
                    )}
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
