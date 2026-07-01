"use client";

import { useEffect, useRef } from "react";

import { loadGoogleMaps } from "~/lib/google-maps";

import { type Store } from "~/types/user";

type PlaceAutocompleteProps = {
  apiKey: string;
  onPlaceSelect: (store: Omit<Store, "id">) => void;
  onCancel: () => void;
};

export function PlaceAutocomplete({
  apiKey,
  onPlaceSelect,
  onCancel,
}: PlaceAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const onPlaceSelectRef = useRef(onPlaceSelect);

  onPlaceSelectRef.current = onPlaceSelect;

  useEffect(() => {
    let autocomplete: google.maps.places.Autocomplete | null = null;
    let listener: google.maps.MapsEventListener | null = null;

    void loadGoogleMaps(apiKey).then(() => {
      if (!inputRef.current) return;

      autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
        types: ["establishment"],
        fields: ["place_id", "name", "formatted_address", "geometry"],
      });

      listener = autocomplete.addListener("place_changed", () => {
        const place = autocomplete?.getPlace();
        if (!place?.place_id || !place.geometry?.location) return;

        onPlaceSelectRef.current({
          name: place.name ?? "Unknown store",
          address: place.formatted_address ?? "",
          placeId: place.place_id,
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        });

        if (inputRef.current) {
          inputRef.current.value = "";
        }
      });
    });

    return () => {
      listener?.remove();
    };
  }, [apiKey]);

  return (
    <div className="list-item-enter flex flex-col gap-2 rounded-xl border border-emerald-200 bg-white p-3 shadow-sm">
      <input
        ref={inputRef}
        type="text"
        placeholder="Search for a store..."
        className="w-full rounded-lg border border-emerald-300 bg-white px-3 py-2 text-emerald-950 placeholder:text-emerald-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
        autoFocus
      />
      <p className="text-xs text-emerald-500">
        Start typing to search Google Maps for grocery stores and shops.
      </p>
      <button
        type="button"
        onClick={onCancel}
        className="self-end text-sm text-emerald-500 hover:text-emerald-700"
      >
        Cancel
      </button>
    </div>
  );
}
