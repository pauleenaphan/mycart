import { type Product } from "~/types/user";

type ProductSearchSuggestionsProps = {
  isLoading: boolean;
  suggestions: Product[];
  onSelect: (product: Product) => void;
};

export function ProductSearchSuggestions({
  isLoading,
  suggestions,
  onSelect,
}: ProductSearchSuggestionsProps) {
  return (
    <div className="absolute top-full right-0 left-0 z-20 mt-1.5 max-h-[min(16rem,50dvh)] overflow-y-auto overscroll-contain rounded-xl border border-edge bg-surface shadow-xl shadow-black/15">
      {isLoading ? (
        <p className="px-3 py-2 text-sm text-fg-muted">Searching...</p>
      ) : suggestions.length > 0 ? (
        <ul>
          {suggestions.map((product) => (
            <li key={product.id}>
              <button
                type="button"
                onClick={() => onSelect(product)}
                className="w-full px-3 py-2 text-left text-sm text-fg transition hover:bg-surface-muted"
              >
                {product.name}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-3 py-2 text-sm text-fg-muted">
          No matching products in database
        </p>
      )}
    </div>
  );
}
