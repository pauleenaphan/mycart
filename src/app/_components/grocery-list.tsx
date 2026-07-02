"use client";

import { useEffect, useRef, useState } from "react";

import { api } from "~/trpc/react";
import { type GroceryPriceLookupResult } from "~/types/grocery";
import { type Product, type UserProfile } from "~/types/user";

type GroceryListProps = {
  user: UserProfile;
};

export function GroceryList({ user }: GroceryListProps) {
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [priceLookup, setPriceLookup] = useState<GroceryPriceLookupResult | null>(
    null,
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLFormElement>(null);
  const utils = api.useUtils();

  const setUser = (data: UserProfile) => {
    utils.user.getProfile.setData(undefined, data);
  };

  const trimmedInput = input.trim();
  const isSearching = trimmedInput.length > 0 && showSuggestions;
  const {
    data: suggestions = [],
    isLoading: isSearchingProducts,
    isFetching: isFetchingProducts,
  } = api.user.searchProducts.useQuery(
    { query: trimmedInput },
    { enabled: isSearching },
  );
  const { data: matchedProduct } = api.user.findProductByName.useQuery(
    { name: trimmedInput },
    { enabled: trimmedInput.length > 0 && showSuggestions },
  );

  const addProduct = api.user.addShoppingItem.useMutation({
    onSuccess: ({ profile, priceLookup: lookup }) => {
      setUser(profile);
      setPriceLookup(lookup);
      setInput("");
      setShowSuggestions(false);
      inputRef.current?.focus();
    },
  });

  const addExistingProduct = api.user.addProductToList.useMutation({
    onSuccess: (profile) => {
      setUser(profile);
      setPriceLookup(null);
      setInput("");
      setShowSuggestions(false);
      inputRef.current?.focus();
    },
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAdd = () => {
    const name = input.trim();
    if (!name || addProduct.isPending) return;
    addProduct.mutate({ name });
  };

  const handleSelectProduct = (product: Product) => {
    addExistingProduct.mutate({ productId: product.id });
  };

  const items = user.shoppingList;
  const isAdding = addProduct.isPending || addExistingProduct.isPending;
  const showSearchResults = isSearching;
  const isSearchLoading = isSearchingProducts || isFetchingProducts;

  return (
    <>
      <header className="sticky top-0 z-10 border-b border-stone-200/80 bg-canvas/90 px-4 py-4 backdrop-blur-md">
        <form
          className="relative mx-auto w-full max-w-lg"
          ref={containerRef}
          onSubmit={(e) => {
            e.preventDefault();
            handleAdd();
          }}
        >
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Search for a product..."
                className="app-input px-4 py-3"
              />
              {matchedProduct && (
                <p className="list-item-enter absolute top-full right-0 left-0 z-10 mt-1.5 rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-800 shadow-sm">
                  Item found in db
                </p>
              )}
              {showSearchResults && (
                <div
                  className={`absolute top-full right-0 left-0 z-20 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-xl shadow-stone-900/10 ${
                    matchedProduct ? "mt-14" : "mt-1.5"
                  }`}
                >
                  {isSearchLoading ? (
                    <p className="px-4 py-3 text-sm text-stone-500">
                      Searching...
                    </p>
                  ) : suggestions.length > 0 ? (
                    <ul>
                      {suggestions.map((product) => (
                        <li key={product.id}>
                          <button
                            type="button"
                            onClick={() => handleSelectProduct(product)}
                            className="w-full px-4 py-3 text-left text-stone-900 transition hover:bg-stone-50"
                          >
                            {product.name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="px-4 py-3 text-sm text-stone-500">
                      No matching products in database
                    </p>
                  )}
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={isAdding}
              className="btn-primary shrink-0 px-5 py-3"
            >
              {addProduct.isPending ? "Looking up..." : "Add"}
            </button>
          </div>
        </form>
      </header>

      <div className="mx-auto w-full max-w-lg px-4 py-6">
        {priceLookup && (
          <div className="app-card list-item-enter mb-4 p-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-stone-800">
                Prices from Gemini
              </h3>
              <button
                type="button"
                onClick={() => setPriceLookup(null)}
                className="text-stone-400 transition hover:text-stone-600"
                aria-label="Dismiss prices"
              >
                ✕
              </button>
            </div>
            {priceLookup.summary && (
              <p className="mb-3 text-sm text-stone-600">{priceLookup.summary}</p>
            )}
            <div className="flex flex-col gap-3">
              {priceLookup.stores.map((store) => (
                <div key={store.storeId}>
                  <p className="text-sm font-medium text-stone-900">
                    {store.storeName}
                  </p>
                  <ul className="mt-1 space-y-1">
                    {store.products.map((product) => (
                      <li
                        key={product.productId}
                        className="text-sm text-stone-700"
                      >
                        <div className="flex justify-between gap-3">
                          <span>{product.productName}</span>
                          <span className="shrink-0 font-medium text-brand-700">
                            {product.found && product.price != null
                              ? `$${product.price.toFixed(2)}${product.unit ? ` / ${product.unit}` : ""}`
                              : "No price online"}
                          </span>
                        </div>
                        {product.notes && (
                          <p className="mt-0.5 text-xs text-stone-500">
                            {product.notes}
                          </p>
                        )}
                        {product.sourceUrl && (
                          <div className="mt-1">
                            {product.sourceTitle && (
                              <p className="text-xs font-medium text-brand-600">
                                {product.sourceTitle}
                              </p>
                            )}
                            <a
                              href={product.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="break-all text-xs text-brand-600 underline hover:text-brand-800"
                            >
                              {product.sourceUrl}
                            </a>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {items.length === 0 ? (
          <p className="pt-12 text-center text-stone-400">
            Your list is empty. Search for a product above to get started.
          </p>
        ) : (
          <>
            <div className="mb-3 flex justify-end">
              <button
                type="button"
                onClick={() => clearAll.mutate()}
                disabled={clearAll.isPending}
                className="text-sm text-stone-500 transition hover:text-red-500 disabled:opacity-50"
              >
                Clear all
              </button>
            </div>
            <ul className="flex flex-col gap-2.5">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="app-card list-item-enter flex items-center gap-3 px-4 py-3.5"
                >
                  <button
                    type="button"
                    onClick={() => toggleItem.mutate({ id: item.id })}
                    disabled={toggleItem.isPending}
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition ${
                      item.checked
                        ? "border-brand-600 bg-brand-600 text-white"
                        : "border-stone-300 bg-white"
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
                        ? "text-stone-400 line-through"
                        : "text-stone-900"
                    }`}
                  >
                    {item.product.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeItem.mutate({ id: item.id })}
                    disabled={removeItem.isPending}
                    className="text-stone-300 transition hover:text-red-400 disabled:opacity-50"
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
    </>
  );
}
