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
    <div className="mx-auto w-full max-w-lg px-4 py-6">
      <div className="mb-6">
        <div className="flex items-center justify-between gap-3">
          <h1 className="page-title">Stores</h1>
          {!showAddStore && (
            <button
              type="button"
              onClick={() => setShowAddStore(true)}
              className="btn-secondary shrink-0 px-3 py-2 text-sm"
            >
              + Add store
            </button>
          )}
        </div>
        <p className="page-description">
          Add the grocery stores you shop at. We use them to look up prices when
          you add new items to your list.
        </p>
      </div>

      {showAddStore &&
        (apiKey ? (
          <div className="mb-4">
            <PlaceAutocomplete
              apiKey={apiKey}
              onPlaceSelect={(store) => addStore.mutate(store)}
              onCancel={() => setShowAddStore(false)}
            />
          </div>
        ) : (
          <div className="app-card mb-4 border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Add{" "}
            <code className="rounded bg-amber-100 px-1">
              NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
            </code>{" "}
            to your <code className="rounded bg-amber-100 px-1">.env</code> to
            enable Google location lookup.
            <button
              type="button"
              onClick={() => setShowAddStore(false)}
              className="mt-2 block text-amber-800 hover:underline"
            >
              Cancel
            </button>
          </div>
        ))}

      {user.stores.length === 0 ? (
        <p className="text-sm text-stone-400">
          No stores saved yet. Add your favorite grocery spots.
        </p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {user.stores.map((store) => (
            <li
              key={store.id}
              className="app-card flex items-start gap-3 px-4 py-4"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-stone-900">{store.name}</p>
                <p className="truncate text-sm text-stone-500">{store.address}</p>
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                  {store.website && (
                    <a
                      href={store.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-brand-600 hover:text-brand-800"
                    >
                      Official website
                    </a>
                  )}
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.name)}&query_place_id=${store.placeId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-brand-600 hover:text-brand-800"
                  >
                    Open in Google Maps
                  </a>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeStore.mutate({ id: store.id })}
                disabled={removeStore.isPending}
                className="shrink-0 text-stone-300 transition hover:text-red-400 disabled:opacity-50"
                aria-label={`Remove ${store.name}`}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
