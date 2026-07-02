"use client";

import Link from "next/link";

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

  const setThemeColor = api.user.setThemeColor.useMutation({
    onSuccess: setUser,
  });

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-6">
      <h1 className="page-title mb-6">Profile</h1>

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
          <div className="grid grid-cols-4 gap-3">
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
                    className={`flex h-11 w-11 items-center justify-center rounded-full transition ${
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
        <label className="flex cursor-pointer items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="font-medium text-stone-900">Clear item when checked</p>
            <p className="text-sm text-stone-500">
              Remove items from your list after you check them off.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={user.clearOnCheck}
            disabled={setClearOnCheck.isPending}
            onClick={() =>
              setClearOnCheck.mutate({ clearOnCheck: !user.clearOnCheck })
            }
            className={`relative h-6 w-11 shrink-0 rounded-full transition ${
              user.clearOnCheck ? "bg-brand-600" : "bg-stone-200"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                user.clearOnCheck ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </label>
      </section>

      <Link
        href="/api/auth/signout"
        className="app-card mt-6 block px-4 py-3 text-center text-sm font-medium text-red-600 transition hover:bg-red-50"
      >
        Sign out
      </Link>
    </div>
  );
}
