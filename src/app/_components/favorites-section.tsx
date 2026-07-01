"use client";

import { useRef, useState } from "react";

import { api } from "~/trpc/react";
import { type UserProfile } from "~/types/user";

type FavoritesSectionProps = {
  user: UserProfile;
};

export function FavoritesSection({ user }: FavoritesSectionProps) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const utils = api.useUtils();

  const setUser = (data: UserProfile) => {
    utils.user.getProfile.setData(undefined, data);
  };

  const addFavorite = api.user.addFavoriteItem.useMutation({
    onSuccess: (data) => {
      setUser(data);
      setInput("");
      inputRef.current?.focus();
    },
  });

  const removeFavorite = api.user.removeFavoriteItem.useMutation({
    onSuccess: setUser,
  });

  const addToList = api.user.addFavoriteToShoppingList.useMutation({
    onSuccess: setUser,
  });

  const handleAdd = () => {
    const text = input.trim();
    if (!text || addFavorite.isPending) return;
    addFavorite.mutate({ text });
  };

  return (
    <section className="border-b border-emerald-200/60 bg-emerald-50/40 px-4 py-4">
      <div className="mx-auto w-full max-w-lg">
        <h2 className="mb-3 text-sm font-semibold tracking-wide text-emerald-800 uppercase">
          Favorite items
        </h2>

        <form
          className="mb-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            handleAdd();
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Add a favorite item..."
            className="flex-1 rounded-lg border border-emerald-300 bg-white px-3 py-2 text-emerald-950 placeholder:text-emerald-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
          />
          <button
            type="submit"
            disabled={addFavorite.isPending}
            className="rounded-lg border border-emerald-300 bg-white px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
          >
            Add
          </button>
        </form>

        {user.favoriteItems.length === 0 ? (
          <p className="text-sm text-emerald-400">
            Save items you buy often for quick access.
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {user.favoriteItems.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-1 rounded-full border border-emerald-200 bg-white py-1 pr-1 pl-3 text-sm shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => addToList.mutate({ id: item.id })}
                  disabled={addToList.isPending}
                  className="text-emerald-800 hover:text-emerald-600 disabled:opacity-50"
                  title="Add to shopping list"
                >
                  {item.text}
                </button>
                <button
                  type="button"
                  onClick={() => removeFavorite.mutate({ id: item.id })}
                  disabled={removeFavorite.isPending}
                  className="rounded-full px-1.5 text-emerald-300 hover:text-red-400 disabled:opacity-50"
                  aria-label={`Remove ${item.text}`}
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
