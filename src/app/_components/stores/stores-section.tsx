"use client";

import { useState } from "react";

import { PlaceAutocomplete } from "~/app/_components/stores/place-autocomplete";
import { api } from "~/trpc/react";
import { type UserProfile } from "~/types/user";

type StoresSectionProps = {
  user: UserProfile;
};

export function StoresSection({ user }: StoresSectionProps) {
  const [showAddStore, setShowAddStore] = useState(false);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const utils = api.useUtils();

  const setUser = (data: UserProfile) => {
    utils.user.getProfile.setData(undefined, data);
  };

  const addStore = api.user.addStore.useMutation({
    onSuccess: (data) => {
      setUser(data);
      setShowAddStore(false);
    },
  });

  const removeStore = api.user.removeStore.useMutation({
    onSuccess: setUser,
  });

  return (
    <section className="border-b border-emerald-200/60 bg-white/50 px-4 py-4">
      <div className="mx-auto w-full max-w-lg">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-wide text-emerald-800 uppercase">
            Stores
          </h2>
          {!showAddStore && (
            <button
              type="button"
              onClick={() => setShowAddStore(true)}
              className="rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50"
            >
              + Add store
            </button>
          )}
        </div>

        {showAddStore &&
          (apiKey ? (
            <div className="mb-3">
              <PlaceAutocomplete
                apiKey={apiKey}
                onPlaceSelect={(store) => addStore.mutate(store)}
                onCancel={() => setShowAddStore(false)}
              />
            </div>
          ) : (
            <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Add{" "}
              <code className="rounded bg-amber-100 px-1">
                NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
              </code>{" "}
              to your <code className="rounded bg-amber-100 px-1">.env</code>{" "}
              to enable Google location lookup.
              <button
                type="button"
                onClick={() => setShowAddStore(false)}
                className="mt-2 block text-amber-700 hover:underline"
              >
                Cancel
              </button>
            </div>
          ))}

        {user.stores.length === 0 ? (
          <p className="text-sm text-emerald-400">
            No stores saved yet. Add your favorite grocery spots.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {user.stores.map((store) => (
              <li
                key={store.id}
                className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-white px-4 py-3 shadow-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-emerald-900">{store.name}</p>
                  <p className="truncate text-sm text-emerald-500">
                    {store.address}
                  </p>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.name)}&query_place_id=${store.placeId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block text-xs text-emerald-600 hover:underline"
                  >
                    Open in Google Maps
                  </a>
                </div>
                <button
                  type="button"
                  onClick={() => removeStore.mutate({ id: store.id })}
                  disabled={removeStore.isPending}
                  className="shrink-0 text-emerald-300 transition hover:text-red-400 disabled:opacity-50"
                  aria-label={`Remove ${store.name}`}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
