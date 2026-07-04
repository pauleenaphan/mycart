"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { StoreSelect } from "~/app/_components/store-select";
import { api } from "~/trpc/react";
import { type GroceryPriceLookupResult, type PriceLookupError } from "~/types/grocery";
import { type Product, type UserProfile } from "~/types/user";

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

function ListAddIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <path d="M12 11v6M9 14h6" strokeLinecap="round" />
    </svg>
  );
}

function StarIcon({
  className,
  filled,
}: {
  className?: string;
  filled?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type GroceryListProps = {
  user: UserProfile;
};

type StoreListGroup = {
  storeId: string | null;
  storeName: string;
  items: UserProfile["shoppingList"];
};

function groupItemsByStore(items: UserProfile["shoppingList"]): StoreListGroup[] {
  const groups = new Map<string, StoreListGroup>();

  for (const item of items) {
    const key = item.store?.id ?? "__other__";
    const existing = groups.get(key);

    if (existing) {
      existing.items.push(item);
      continue;
    }

    groups.set(key, {
      storeId: item.store?.id ?? null,
      storeName: item.store?.name ?? "Other",
      items: [item],
    });
  }

  return Array.from(groups.values())
    .sort((a, b) => {
      if (a.storeId === null) return 1;
      if (b.storeId === null) return -1;
      return a.storeName.localeCompare(b.storeName);
    })
    .map((group) => ({
      ...group,
      items: [...group.items].sort((a, b) => Number(a.checked) - Number(b.checked)),
    }));
}

function captureListItemTops(): Map<string, number> {
  const map = new Map<string, number>();

  for (const el of document.querySelectorAll<HTMLElement>("[data-list-item-id]")) {
    const id = el.dataset.listItemId;
    if (!id) continue;

    const list = el.closest("ul");
    if (!list) continue;

    map.set(id, el.getBoundingClientRect().top - list.getBoundingClientRect().top);
  }

  return map;
}

function playListFlip(
  prev: Map<string, number>,
  itemIds: string[],
  skipId?: string | null,
) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  for (const id of itemIds) {
    if (id === skipId) continue;
    const el = document.querySelector<HTMLElement>(`[data-list-item-id="${id}"]`);
    if (!el) continue;

    const list = el.closest("ul");
    if (!list) continue;

    const top = el.getBoundingClientRect().top - list.getBoundingClientRect().top;
    const prevTop = prev.get(id);
    if (prevTop === undefined) continue;

    const delta = prevTop - top;
    if (Math.abs(delta) < 4) continue;

    el.getAnimations().forEach((animation) => animation.cancel());
    el.animate(
      [
        { transform: `translate3d(0, ${delta}px, 0)` },
        { transform: "translate3d(0, 0, 0)" },
      ],
      { duration: 300, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
    );
  }
}

export function GroceryList({ user: initialUser }: GroceryListProps) {
  const { data: user = initialUser } = api.user.getProfile.useQuery();
  const [input, setInput] = useState("");
  const [selectedStoreId, setSelectedStoreId] = useState(
    () => user.stores[0]?.id ?? "",
  );
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [priceLookup, setPriceLookup] = useState<GroceryPriceLookupResult | null>(
    null,
  );
  const [priceLookupError, setPriceLookupError] =
    useState<PriceLookupError | null>(null);
  const [expandedStores, setExpandedStores] = useState<Set<string>>(() => new Set());
  const flipBeforeRef = useRef<Map<string, number> | null>(null);
  const toggledItemRef = useRef<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLFormElement>(null);
  const utils = api.useUtils();

  const setUser = (data: UserProfile) => {
    utils.user.getProfile.setData(undefined, data);
  };

  const refreshSearch = () => {
    void utils.user.searchProducts.reset();
  };

  const trimmedInput = input.trim();
  const isSearching = trimmedInput.length > 0 && showSuggestions;
  const {
    data: suggestions = [],
    isLoading: isSearchingProducts,
    isFetching: isFetchingProducts,
  } = api.user.searchProducts.useQuery(
    { query: trimmedInput },
    { enabled: isSearching, staleTime: 0 },
  );

  const addProduct = api.user.addShoppingItem.useMutation({
    onSuccess: ({ profile, priceLookup: lookup, priceLookupError: lookupError }) => {
      setUser(profile);
      refreshSearch();
      setPriceLookup(lookup);
      setPriceLookupError(lookupError);
      setInput("");
      setShowSuggestions(false);
      inputRef.current?.focus();
    },
  });

  const addExistingProduct = api.user.addProductToList.useMutation({
    onSuccess: (profile) => {
      setUser(profile);
      refreshSearch();
      setPriceLookup(null);
      setPriceLookupError(null);
      setInput("");
      setShowSuggestions(false);
      inputRef.current?.focus();
    },
  });

  const addFromPriceLookup = api.user.addProductToList.useMutation({
    onSuccess: (profile) => {
      setUser(profile);
      refreshSearch();
    },
  });

  const toggleFavorite = api.user.toggleFavoriteItem.useMutation({
    onSuccess: setUser,
  });

  const toggleItem = api.user.toggleShoppingItem.useMutation({
    onMutate: ({ id }) => {
      flipBeforeRef.current = captureListItemTops();
      toggledItemRef.current = id;
    },
    onSuccess: setUser,
  });

  const removeItem = api.user.removeShoppingItem.useMutation({
    onSuccess: setUser,
  });

  const clearAll = api.user.clearShoppingList.useMutation({
    onSuccess: setUser,
  });

  const clearStore = api.user.clearShoppingListByStore.useMutation({
    onSuccess: setUser,
  });

  const isClearing = clearAll.isPending || clearStore.isPending;

  const toggleStoreExpanded = (storeKey: string) => {
    setExpandedStores((prev) => {
      const next = new Set(prev);
      if (next.has(storeKey)) {
        next.delete(storeKey);
      } else {
        next.add(storeKey);
      }
      return next;
    });
  };

  useEffect(() => {
    if (user.stores.length === 0) {
      setSelectedStoreId("");
      return;
    }

    if (!selectedStoreId || !user.stores.some((s) => s.id === selectedStoreId)) {
      setSelectedStoreId(user.stores[0]!.id);
    }
  }, [user.stores, selectedStoreId]);

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
    if (!user.useGeminiPrices && user.stores.length > 0 && !selectedStoreId) {
      return;
    }

    addProduct.mutate({
      name,
      storeId: user.useGeminiPrices ? undefined : selectedStoreId || null,
    });
  };

  const handleSelectProduct = (product: Product) => {
    if (!user.useGeminiPrices && user.stores.length > 0 && !selectedStoreId) {
      return;
    }

    addExistingProduct.mutate({
      productId: product.id,
      storeId: user.useGeminiPrices ? undefined : selectedStoreId || null,
    });
  };

  const items = user.shoppingList;
  const groupedItems = groupItemsByStore(items);
  const listLayoutKey = groupedItems
    .flatMap((group) => group.items.map((item) => `${item.id}:${item.checked}`))
    .join(",");

  useLayoutEffect(() => {
    if (!flipBeforeRef.current) return;

    const prev = flipBeforeRef.current;
    flipBeforeRef.current = null;

    const itemIds = listLayoutKey
      ? listLayoutKey.split(",").map((entry) => entry.split(":")[0]!)
      : [];
    playListFlip(prev, itemIds, toggledItemRef.current);
    toggledItemRef.current = null;
  }, [listLayoutKey]);
  const isAdding = addProduct.isPending || addExistingProduct.isPending;
  const showSearchResults = isSearching;
  const isSearchLoading = isSearchingProducts || isFetchingProducts;
  const showStorePicker = !user.useGeminiPrices;
  const canAddWithoutGemini =
    !showStorePicker || user.stores.length === 0 || Boolean(selectedStoreId);

  const isOnList = (productId: string, storeId: string) =>
    user.shoppingList.some(
      (item) => item.product.id === productId && item.store?.id === storeId,
    );

  const isFavorite = (productName: string) =>
    user.favoriteItems.some(
      (favorite) =>
        favorite.text.toLowerCase() === productName.trim().toLowerCase(),
    );

  return (
    <>
      <header className="sticky top-[calc(3.25rem+var(--spacing-safe-top))] z-10 overflow-visible border-b border-stone-200/80 bg-canvas/90 py-3 sm:py-4 backdrop-blur-md">
        <form
          className="relative mx-auto w-full max-w-lg px-4"
          ref={containerRef}
          onSubmit={(e) => {
            e.preventDefault();
            handleAdd();
          }}
        >
          <div className="flex flex-col gap-2">
            {showStorePicker && user.stores.length === 0 && (
              <p className="text-sm text-stone-500">
                Add a store in the Stores tab to categorize items.
              </p>
            )}
            {showStorePicker && user.stores.length > 0 ? (
              <div className="search-bar-box relative">
                <div className="search-bar-top">
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
                    className="search-bar-input search-bar-field min-w-0 flex-1 px-1"
                  />
                  <button
                    type="submit"
                    disabled={isAdding || !canAddWithoutGemini}
                    className="btn-primary search-bar-add-btn flex items-center justify-center p-0"
                    aria-label={
                      addProduct.isPending
                        ? user.useGeminiPrices
                          ? "Looking up prices"
                          : "Adding item"
                        : "Add item"
                    }
                  >
                    {addProduct.isPending ? (
                      <span aria-hidden className="text-base leading-none">
                        …
                      </span>
                    ) : (
                      <PlusIcon className="h-[1.125rem] w-[1.125rem]" />
                    )}
                  </button>
                </div>
                <StoreSelect
                  stores={user.stores}
                  value={selectedStoreId}
                  onValueChange={setSelectedStoreId}
                />
                {showSearchResults && (
                  <div className="absolute top-full right-0 left-0 z-20 mt-1.5 max-h-[min(16rem,50dvh)] overflow-y-auto overscroll-contain rounded-xl border border-stone-200 bg-white shadow-xl shadow-stone-900/10">
                    {isSearchLoading ? (
                      <p className="px-3 py-2 text-sm text-stone-500">
                        Searching...
                      </p>
                    ) : suggestions.length > 0 ? (
                      <ul>
                        {suggestions.map((product) => (
                          <li key={product.id}>
                            <button
                              type="button"
                              onClick={() => handleSelectProduct(product)}
                              className="w-full px-3 py-2 text-left text-sm text-stone-900 transition hover:bg-stone-50"
                            >
                              {product.name}
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="px-3 py-2 text-sm text-stone-500">
                        No matching products in database
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex w-full items-center gap-2">
                <div className="relative min-w-0 flex-1">
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
                    className="app-input search-bar-input search-bar-field px-4"
                  />
                  {showSearchResults && (
                    <div className="absolute top-full right-0 left-0 z-20 mt-1.5 max-h-[min(16rem,50dvh)] overflow-y-auto overscroll-contain rounded-xl border border-stone-200 bg-white shadow-xl shadow-stone-900/10">
                      {isSearchLoading ? (
                        <p className="px-3 py-2 text-sm text-stone-500">
                          Searching...
                        </p>
                      ) : suggestions.length > 0 ? (
                        <ul>
                          {suggestions.map((product) => (
                            <li key={product.id}>
                              <button
                                type="button"
                                onClick={() => handleSelectProduct(product)}
                                className="w-full px-3 py-2 text-left text-sm text-stone-900 transition hover:bg-stone-50"
                              >
                                {product.name}
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="px-3 py-2 text-sm text-stone-500">
                          No matching products in database
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={isAdding || !canAddWithoutGemini}
                  className="btn-primary search-bar-add-btn flex items-center justify-center p-0"
                  aria-label={
                    addProduct.isPending
                      ? user.useGeminiPrices
                        ? "Looking up prices"
                        : "Adding item"
                      : "Add item"
                  }
                >
                  {addProduct.isPending ? (
                    <span aria-hidden className="text-base leading-none">
                      …
                    </span>
                  ) : (
                    <PlusIcon className="h-[1.125rem] w-[1.125rem]" />
                  )}
                </button>
              </div>
            )}
            {items.length > 0 && (
              <div className="-mt-1 flex justify-end">
                <button
                  type="button"
                  onClick={() => clearAll.mutate()}
                  disabled={isClearing}
                  title="Clear all — removes every item from all stores"
                  aria-label="Clear all — removes every item from all stores"
                  className="text-sm text-stone-500 transition hover:text-red-500 disabled:opacity-50"
                >
                  {clearAll.isPending ? "…" : "Clear all"}
                </button>
              </div>
            )}
          </div>
        </form>
      </header>

      <div className="mx-auto w-full max-w-lg px-4 py-6">
        {priceLookupError && (
          <div
            role="alert"
            className={`list-item-enter mb-4 rounded-xl border p-4 shadow-sm ${
              priceLookupError.kind === "rate_limit"
                ? "border-amber-200 bg-amber-50"
                : "border-red-200 bg-red-50"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3
                  className={`text-sm font-semibold ${
                    priceLookupError.kind === "rate_limit"
                      ? "text-amber-900"
                      : "text-red-900"
                  }`}
                >
                  {priceLookupError.kind === "rate_limit"
                    ? "Gemini rate limit reached"
                    : "Price lookup failed"}
                </h3>
                <p
                  className={`mt-1 text-sm ${
                    priceLookupError.kind === "rate_limit"
                      ? "text-amber-800"
                      : "text-red-800"
                  }`}
                >
                  {priceLookupError.message}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPriceLookupError(null)}
                className={`icon-btn shrink-0 -mr-2 ${
                  priceLookupError.kind === "rate_limit"
                    ? "text-amber-500 hover:text-amber-700"
                    : "text-red-400 hover:text-red-600"
                }`}
                aria-label="Dismiss alert"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {priceLookup && (() => {
          const lookupProduct = priceLookup.stores[0]?.products[0];
          const favorited = lookupProduct
            ? isFavorite(lookupProduct.productName)
            : false;

          return (
          <div className="app-card list-item-enter mb-4 p-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-stone-800">
                  Prices from Gemini
                </h3>
                {lookupProduct && (
                  <div className="mt-1 flex items-center gap-2">
                    <p className="truncate text-base font-medium text-stone-900">
                      {lookupProduct.productName}
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        toggleFavorite.mutate({
                          text: lookupProduct.productName,
                        })
                      }
                      disabled={toggleFavorite.isPending}
                      title={
                        favorited
                          ? "Remove from favorites"
                          : "Add to favorites"
                      }
                      aria-label={
                        favorited
                          ? "Remove from favorites"
                          : "Add to favorites"
                      }
                      className={`rounded-lg p-1.5 transition disabled:opacity-50 ${
                        favorited
                          ? "bg-amber-50 text-amber-500"
                          : "text-stone-400 hover:bg-stone-100 hover:text-amber-500"
                      }`}
                    >
                      <StarIcon className="h-4 w-4" filled={favorited} />
                    </button>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setPriceLookup(null)}
                className="icon-btn shrink-0 -mr-2 text-stone-400 transition hover:text-stone-600"
                aria-label="Dismiss prices"
              >
                ✕
              </button>
            </div>
            {priceLookup.summary && (
              <p className="mb-3 text-sm text-stone-600">{priceLookup.summary}</p>
            )}
            <div className="flex flex-col gap-3">
              {priceLookup.stores.map((store) => {
                const storeProduct = store.products[0];
                const onList =
                  lookupProduct &&
                  isOnList(lookupProduct.productId, store.storeId);

                return (
                <div key={store.storeId}>
                  <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                    <p className="min-w-0 flex-1 truncate text-sm font-medium text-stone-900">
                      {store.storeName}
                    </p>
                    {lookupProduct && (
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            addFromPriceLookup.mutate({
                              productId: lookupProduct.productId,
                              storeId: store.storeId,
                            })
                          }
                          disabled={addFromPriceLookup.isPending}
                          title={
                            onList
                              ? `Already on your ${store.storeName} list`
                              : `Add to ${store.storeName} list`
                          }
                          aria-label={
                            onList
                              ? `Already on your ${store.storeName} list`
                              : `Add to ${store.storeName} list`
                          }
                          className={`rounded-lg p-1.5 transition disabled:opacity-50 ${
                            onList
                              ? "bg-brand-50 text-brand-600"
                              : "text-stone-400 hover:bg-stone-100 hover:text-brand-600"
                          }`}
                        >
                          <ListAddIcon className="h-4 w-4" />
                        </button>
                        {storeProduct && (
                          <span className="text-right text-sm font-medium text-brand-700">
                            {storeProduct.found && storeProduct.price != null
                              ? `$${storeProduct.price.toFixed(2)}${storeProduct.unit ? ` / ${storeProduct.unit}` : ""}`
                              : "No price online"}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  {storeProduct?.notes && (
                    <p className="mt-0.5 text-xs text-stone-500">
                      {storeProduct.notes}
                    </p>
                  )}
                  {storeProduct?.sourceUrl && (
                    <div className="mt-1">
                      {storeProduct.sourceTitle && (
                        <p className="text-xs font-medium text-brand-600">
                          {storeProduct.sourceTitle}
                        </p>
                      )}
                      <a
                        href={storeProduct.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="break-all text-xs text-brand-600 underline hover:text-brand-800"
                      >
                        {storeProduct.sourceUrl}
                      </a>
                    </div>
                  )}
                </div>
                );
              })}
            </div>
          </div>
          );
        })()}

        {items.length === 0 ? (
          <p className="pt-12 text-center text-stone-400">
            Your list is empty. Search for a product above to get started.
          </p>
        ) : (
          <>
            <div className="flex flex-col gap-7">
              {groupedItems.map((group) => {
                const checkedCount = group.items.filter((item) => item.checked).length;
                const totalCount = group.items.length;
                const storeKey = group.storeId ?? "__other__";
                const isComplete = totalCount > 0 && checkedCount === totalCount;
                const canCollapse = user.collapseCompletedStores && isComplete;
                const isCollapsed = canCollapse && !expandedStores.has(storeKey);

                return (
                <section key={storeKey}>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    {canCollapse ? (
                      <button
                        type="button"
                        onClick={() => toggleStoreExpanded(storeKey)}
                        aria-expanded={!isCollapsed}
                        className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
                      >
                        <ChevronDownIcon
                          className={`h-4 w-4 shrink-0 text-stone-400 transition-transform ${
                            isCollapsed ? "-rotate-90" : ""
                          }`}
                        />
                        <span className="min-w-0 truncate text-xs font-semibold tracking-wide text-stone-700 uppercase">
                          {group.storeName}
                        </span>
                        <span
                          className="shrink-0 text-xs tabular-nums text-stone-500"
                          aria-label={`${checkedCount} of ${totalCount} items checked`}
                        >
                          {checkedCount}/{totalCount}
                        </span>
                      </button>
                    ) : (
                      <div className="flex min-w-0 flex-1 items-baseline gap-2">
                        <h3 className="min-w-0 truncate text-xs font-semibold tracking-wide text-stone-700 uppercase">
                          {group.storeName}
                        </h3>
                        <span
                          className="shrink-0 text-xs tabular-nums text-stone-500"
                          aria-label={`${checkedCount} of ${totalCount} items checked`}
                        >
                          {checkedCount}/{totalCount}
                        </span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        clearStore.mutate({ storeId: group.storeId })
                      }
                      disabled={isClearing}
                      title={`Clear all items at ${group.storeName}`}
                      aria-label={`Clear all items at ${group.storeName}`}
                      className="shrink-0 text-xs text-stone-500 transition hover:text-red-500 disabled:opacity-50"
                    >
                      {clearStore.isPending &&
                      clearStore.variables?.storeId === group.storeId
                        ? "…"
                        : "Clear"}
                    </button>
                  </div>
                  {!isCollapsed && (
                  <ul className="flex flex-col gap-2">
                    {group.items.map((item) => (
                      <li
                        key={item.id}
                        data-list-item-id={item.id}
                        className="app-card list-item-enter"
                      >
                        <div
                          className={`list-item-row flex items-center gap-2.5 px-3 py-2 ${
                            item.checked ? "list-item-checked" : ""
                          }`}
                        >
                        <button
                          type="button"
                          onClick={() => toggleItem.mutate({ id: item.id })}
                          disabled={toggleItem.isPending}
                          className={`list-check flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 ${
                            item.checked
                              ? "list-check-checked border-brand-600 bg-brand-600 text-white"
                              : "border-stone-300 bg-white"
                          }`}
                          aria-label={item.checked ? "Uncheck item" : "Check item"}
                        >
                          {item.checked && (
                            <svg
                              viewBox="0 0 12 12"
                              className="list-check-mark h-3 w-3"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M2 6l3 3 5-5" />
                            </svg>
                          )}
                        </button>
                        <span
                          className={`list-item-label min-w-0 flex-1 text-sm sm:text-base ${
                            item.checked ? "list-item-label-checked" : ""
                          }`}
                        >
                          {item.product.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeItem.mutate({ id: item.id })}
                          disabled={removeItem.isPending}
                          className="shrink-0 rounded-md p-1 text-stone-300 transition hover:text-red-400 disabled:opacity-50"
                          aria-label="Remove item"
                        >
                          ✕
                        </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                  )}
                </section>
                );
              })}
            </div>
          </>
        )}
      </div>
    </>
  );
}
