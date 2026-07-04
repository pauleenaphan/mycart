"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { PriceLookupCard } from "~/app/_components/price-lookup-card";
import { ProductSearchBar } from "~/app/_components/product-search-bar";
import { StoreGroupSection } from "~/app/_components/store-group-section";
import { useClickOutside } from "~/hooks/use-click-outside";
import { useProfileCache } from "~/hooks/use-profile-cache";
import { groupItemsByStore } from "~/lib/group-items-by-store";
import { captureListItemTops, playListFlip, animateListItemExit } from "~/lib/list-flip";
import { api } from "~/trpc/react";
import { type GroceryPriceLookupResult, type PriceLookupError } from "~/types/grocery";
import { type Product, type UserProfile } from "~/types/user";

type GroceryListProps = {
  user: UserProfile;
};

export function GroceryList({ user }: GroceryListProps) {
  const { setUser, utils } = useProfileCache();
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
  const [exitingItemIds, setExitingItemIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const flipBeforeRef = useRef<Map<string, number> | null>(null);
  const toggledItemRef = useRef<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLFormElement>(null);

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

  const refreshSearch = () => {
    void utils.user.searchProducts.reset();
  };

  const resetSearchInput = () => {
    setInput("");
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const addProduct = api.user.addShoppingItem.useMutation({
    onSuccess: ({ profile, priceLookup: lookup, priceLookupError: lookupError }) => {
      setUser(profile);
      refreshSearch();
      setPriceLookup(lookup);
      setPriceLookupError(lookupError);
      resetSearchInput();
    },
  });

  const addProductToList = api.user.addProductToList.useMutation({
    onSuccess: (profile) => {
      setUser(profile);
      refreshSearch();
    },
  });

  const toggleFavorite = api.user.toggleFavoriteItem.useMutation({
    onSuccess: setUser,
  });

  const toggleItem = api.user.toggleShoppingItem.useMutation({
    onMutate: async ({ id }) => {
      flipBeforeRef.current = captureListItemTops();
      toggledItemRef.current = id;

      await utils.user.getProfile.cancel();
      const previous = utils.user.getProfile.getData();

      if (previous) {
        utils.user.getProfile.setData(undefined, {
          ...previous,
          shoppingList: previous.shoppingList.map((item) =>
            item.id === id ? { ...item, checked: !item.checked } : item,
          ),
        });
      }

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        utils.user.getProfile.setData(undefined, context.previous);
      }
    },
    onSuccess: setUser,
  });

  const removeItem = api.user.removeShoppingItem.useMutation({
    onSuccess: setUser,
  });

  const handleRemoveItem = (id: string) => {
    if (exitingItemIds.has(id)) return;

    setExitingItemIds((prev) => new Set(prev).add(id));

    void (async () => {
      const el = document.querySelector<HTMLElement>(
        `[data-list-item-id="${id}"]`,
      );

      try {
        if (el) await animateListItemExit(el);

        flipBeforeRef.current = captureListItemTops();

        await utils.user.getProfile.cancel();
        const previous = utils.user.getProfile.getData();

        if (previous) {
          utils.user.getProfile.setData(undefined, {
            ...previous,
            shoppingList: previous.shoppingList.filter((item) => item.id !== id),
          });
        }

        removeItem.mutate(
          { id },
          {
            onError: () => {
              if (previous) {
                utils.user.getProfile.setData(undefined, previous);
              }
            },
          },
        );
      } finally {
        setExitingItemIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    })();
  };

  const clearAll = api.user.clearShoppingList.useMutation({
    onSuccess: setUser,
  });

  const clearStore = api.user.clearShoppingListByStore.useMutation({
    onSuccess: setUser,
  });

  useClickOutside(containerRef, () => setShowSuggestions(false));

  useEffect(() => {
    if (user.stores.length === 0) {
      setSelectedStoreId("");
      return;
    }

    if (!selectedStoreId || !user.stores.some((s) => s.id === selectedStoreId)) {
      setSelectedStoreId(user.stores[0]!.id);
    }
  }, [user.stores, selectedStoreId]);

  const storeIdForAdd = user.useGeminiPrices ? undefined : selectedStoreId || null;

  const handleAdd = () => {
    const name = input.trim();
    if (!name || addProduct.isPending) return;
    if (!user.useGeminiPrices && user.stores.length > 0 && !selectedStoreId) return;

    addProduct.mutate({ name, storeId: storeIdForAdd });
  };

  const handleSelectProduct = (product: Product) => {
    if (!user.useGeminiPrices && user.stores.length > 0 && !selectedStoreId) return;

    addProductToList.mutate(
      { productId: product.id, storeId: storeIdForAdd },
      {
        onSuccess: (profile) => {
          setUser(profile);
          setPriceLookup(null);
          setPriceLookupError(null);
          resetSearchInput();
        },
      },
    );
  };

  const groupedItems = groupItemsByStore(user.shoppingList);
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

  const showStorePicker = !user.useGeminiPrices;
  const canAdd =
    !showStorePicker || user.stores.length === 0 || Boolean(selectedStoreId);
  const isAdding = addProduct.isPending || addProductToList.isPending;
  const isClearing = clearAll.isPending || clearStore.isPending;
  const lookupProduct = priceLookup?.stores[0]?.products[0];
  const favorited = lookupProduct
    ? user.favoriteItems.some(
        (f) =>
          f.text.toLowerCase() === lookupProduct.productName.trim().toLowerCase(),
      )
    : false;

  const isOnList = (productId: string, storeId: string) =>
    user.shoppingList.some(
      (item) => item.product.id === productId && item.store?.id === storeId,
    );

  const toggleStoreExpanded = (storeKey: string) => {
    setExpandedStores((prev) => {
      const next = new Set(prev);
      if (next.has(storeKey)) next.delete(storeKey);
      else next.add(storeKey);
      return next;
    });
  };

  return (
    <>
      <header className="list-search-header z-10 overflow-visible border-b border-edge/80 bg-canvas/90 py-2.5 sm:py-4 md:sticky md:top-[calc(3.25rem+var(--spacing-safe-top))] md:backdrop-blur-md">
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
              <p className="text-sm text-fg-muted">
                Add a store in the Stores tab to categorize items.
              </p>
            )}
            <ProductSearchBar
              input={input}
              inputRef={inputRef}
              onInputChange={(value) => {
                setInput(value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              showSuggestions={isSearching}
              isSearchLoading={isSearchingProducts || isFetchingProducts}
              suggestions={suggestions}
              onSelectProduct={handleSelectProduct}
              isAdding={isAdding}
              isLookingUpPrices={addProduct.isPending}
              canAdd={canAdd}
              useGeminiPrices={user.useGeminiPrices}
              showStorePicker={showStorePicker}
              stores={user.stores}
              selectedStoreId={selectedStoreId}
              onStoreChange={setSelectedStoreId}
            />
            {user.shoppingList.length > 0 && (
              <div className="-mt-1 flex justify-end">
                <button
                  type="button"
                  onClick={() => clearAll.mutate()}
                  disabled={isClearing}
                  title="Clear all — removes every item from all stores"
                  aria-label="Clear all — removes every item from all stores"
                  className="text-sm text-fg-muted transition hover:text-red-500 disabled:opacity-50"
                >
                  {clearAll.isPending ? "…" : "Clear all"}
                </button>
              </div>
            )}
          </div>
        </form>
      </header>

      <div className="mx-auto w-full max-w-lg px-4 py-4 sm:py-6">
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

        {priceLookup && lookupProduct && (
          <PriceLookupCard
            priceLookup={priceLookup}
            favorited={favorited}
            onToggleFavorite={() =>
              toggleFavorite.mutate({ text: lookupProduct.productName })
            }
            isTogglingFavorite={toggleFavorite.isPending}
            onDismiss={() => setPriceLookup(null)}
            isOnList={isOnList}
            onAddToStore={(productId, storeId) =>
              addProductToList.mutate({ productId, storeId })
            }
            isAddingToStore={addProductToList.isPending}
          />
        )}

        {user.shoppingList.length === 0 ? (
          <p className="pt-12 text-center text-fg-subtle">
            Your list is empty. Search for a product above to get started.
          </p>
        ) : (
          <div className="flex flex-col gap-7">
            {groupedItems.map((group) => {
              const storeKey = group.storeId ?? "__other__";

              return (
                <StoreGroupSection
                  key={storeKey}
                  group={group}
                  collapseCompletedStores={user.collapseCompletedStores}
                  isExpanded={expandedStores.has(storeKey)}
                  onToggleExpanded={() => toggleStoreExpanded(storeKey)}
                  onClearStore={() => clearStore.mutate({ storeId: group.storeId })}
                  isClearing={isClearing}
                  isClearingStore={
                    clearStore.isPending &&
                    clearStore.variables?.storeId === group.storeId
                  }
                  onToggleItem={(id) => {
                    if (toggleItem.isPending && toggleItem.variables?.id === id) return;
                    toggleItem.mutate({ id });
                  }}
                  onRemoveItem={handleRemoveItem}
                  togglingItemId={
                    toggleItem.isPending ? (toggleItem.variables?.id ?? null) : null
                  }
                  exitingItemIds={exitingItemIds}
                />
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
