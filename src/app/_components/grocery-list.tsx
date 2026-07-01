"use client";

import { useRef, useState } from "react";

import { api } from "~/trpc/react";
import { type UserProfile } from "~/types/user";

type GroceryListProps = {
  user: UserProfile;
};

export function GroceryList({ user }: GroceryListProps) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const utils = api.useUtils();

  const setUser = (data: UserProfile) => {
    utils.user.getProfile.setData(undefined, data);
  };

  const addItem = api.user.addShoppingItem.useMutation({
    onSuccess: setUser,
  });

  const toggleItem = api.user.toggleShoppingItem.useMutation({
    onSuccess: setUser,
  });

  const removeItem = api.user.removeShoppingItem.useMutation({
    onSuccess: setUser,
  });

  const clearAll = api.user.clearShoppingList.useMutation({
    onSuccess: setUser,
  });

  const setClearOnCheck = api.user.setClearOnCheck.useMutation({
    onSuccess: setUser,
  });

  const handleAdd = () => {
    const text = input.trim();
    if (!text || addItem.isPending) return;

    addItem.mutate({ text });
    setInput("");
    inputRef.current?.focus();
  };

  const items = user.shoppingList;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-emerald-200/60 bg-emerald-50/90 px-4 py-3 backdrop-blur-sm">
        <form
          className="mx-auto flex w-full max-w-lg gap-2"
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
            placeholder="Add groceries..."
            className="flex-1 rounded-lg border border-emerald-300 bg-white px-4 py-2.5 text-emerald-950 placeholder:text-emerald-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
          />
          <button
            type="submit"
            disabled={addItem.isPending}
            className="rounded-lg bg-emerald-600 px-5 py-2.5 font-medium text-white transition hover:bg-emerald-700 active:scale-95 disabled:opacity-50"
          >
            Add
          </button>
        </form>
        <div className="mx-auto mt-3 flex w-full max-w-lg items-center justify-between">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-emerald-700">
            <button
              type="button"
              role="switch"
              aria-checked={user.clearOnCheck}
              disabled={setClearOnCheck.isPending}
              onClick={() =>
                setClearOnCheck.mutate({ clearOnCheck: !user.clearOnCheck })
              }
              className={`relative h-5 w-9 rounded-full transition ${
                user.clearOnCheck ? "bg-emerald-500" : "bg-emerald-200"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition ${
                  user.clearOnCheck ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
            Clear item when checked
          </label>
        </div>
      </header>

      <div className="mx-auto w-full max-w-lg flex-1 px-4 py-6">
        {items.length === 0 ? (
          <p className="pt-12 text-center text-emerald-400">
            Your list is empty. Type something above to get started.
          </p>
        ) : (
          <>
            <div className="mb-3 flex justify-end">
              <button
                type="button"
                onClick={() => clearAll.mutate()}
                disabled={clearAll.isPending}
                className="text-sm text-emerald-500 transition hover:text-red-500 disabled:opacity-50"
              >
                Clear all
              </button>
            </div>
            <ul className="flex flex-col gap-2">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="list-item-enter flex items-center gap-3 rounded-xl border border-emerald-200 bg-white px-4 py-3 shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => toggleItem.mutate({ id: item.id })}
                    disabled={toggleItem.isPending}
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition ${
                      item.checked
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : "border-emerald-300 bg-white"
                    }`}
                    aria-label={item.checked ? "Uncheck item" : "Check item"}
                  >
                    {item.checked && (
                      <svg
                        viewBox="0 0 12 12"
                        className="h-3 w-3"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M2 6l3 3 5-5" />
                      </svg>
                    )}
                  </button>
                  <span
                    className={`flex-1 text-lg ${
                      item.checked
                        ? "text-emerald-400 line-through"
                        : "text-emerald-900"
                    }`}
                  >
                    {item.text}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeItem.mutate({ id: item.id })}
                    disabled={removeItem.isPending}
                    className="text-emerald-300 transition hover:text-red-400 disabled:opacity-50"
                    aria-label="Remove item"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
