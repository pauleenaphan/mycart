"use client";

import { type RefObject } from "react";

import { PlusIcon } from "~/app/_components/icons";
import { ProductSearchSuggestions } from "~/app/_components/product-search-suggestions";
import { StoreSelect } from "~/app/_components/store-select";
import { type Product, type Store } from "~/types/user";

type ProductSearchBarProps = {
  input: string;
  inputRef: RefObject<HTMLInputElement | null>;
  onInputChange: (value: string) => void;
  onFocus: () => void;
  showSuggestions: boolean;
  isSearchLoading: boolean;
  suggestions: Product[];
  onSelectProduct: (product: Product) => void;
  isAdding: boolean;
  isLookingUpPrices: boolean;
  canAdd: boolean;
  useGeminiPrices: boolean;
  showStorePicker: boolean;
  stores: Store[];
  selectedStoreId: string;
  onStoreChange: (storeId: string) => void;
};

function AddButton({
  disabled,
  isPending,
  useGeminiPrices,
}: {
  disabled: boolean;
  isPending: boolean;
  useGeminiPrices: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="btn-primary search-bar-add-btn flex items-center justify-center p-0"
      aria-label={
        isPending
          ? useGeminiPrices
            ? "Looking up prices"
            : "Adding item"
          : "Add item"
      }
    >
      {isPending ? (
        <span aria-hidden className="text-base leading-none">
          …
        </span>
      ) : (
        <PlusIcon className="h-[1.125rem] w-[1.125rem]" />
      )}
    </button>
  );
}

export function ProductSearchBar({
  input,
  inputRef,
  onInputChange,
  onFocus,
  showSuggestions,
  isSearchLoading,
  suggestions,
  onSelectProduct,
  isAdding,
  isLookingUpPrices,
  canAdd,
  useGeminiPrices,
  showStorePicker,
  stores,
  selectedStoreId,
  onStoreChange,
}: ProductSearchBarProps) {
  const isPending = isAdding || isLookingUpPrices;
  const withStoreBox = showStorePicker && stores.length > 0;

  const searchInput = (
    <input
      ref={inputRef}
      type="text"
      value={input}
      onChange={(e) => onInputChange(e.target.value)}
      onFocus={onFocus}
      placeholder="Search for a product..."
      className={
        withStoreBox
          ? "search-bar-input search-bar-field min-w-0 flex-1 px-1"
          : "app-input search-bar-input search-bar-field px-4"
      }
    />
  );

  if (withStoreBox) {
    return (
      <div className="search-bar-box relative">
        <div className="search-bar-top">
          {searchInput}
          <AddButton
            disabled={isPending || !canAdd}
            isPending={isPending}
            useGeminiPrices={useGeminiPrices}
          />
        </div>
        <StoreSelect
          stores={stores}
          value={selectedStoreId}
          onValueChange={onStoreChange}
        />
        {showSuggestions && (
          <ProductSearchSuggestions
            isLoading={isSearchLoading}
            suggestions={suggestions}
            onSelect={onSelectProduct}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex w-full items-center gap-2">
      <div className="relative min-w-0 flex-1">
        {searchInput}
        {showSuggestions && (
          <ProductSearchSuggestions
            isLoading={isSearchLoading}
            suggestions={suggestions}
            onSelect={onSelectProduct}
          />
        )}
      </div>
      <AddButton
        disabled={isPending || !canAdd}
        isPending={isPending}
        useGeminiPrices={useGeminiPrices}
      />
    </div>
  );
}
