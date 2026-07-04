import { ListAddIcon, StarIcon } from "~/app/_components/icons";
import { type GroceryPriceLookupResult } from "~/types/grocery";

type PriceLookupCardProps = {
  priceLookup: GroceryPriceLookupResult;
  favorited: boolean;
  onToggleFavorite: () => void;
  isTogglingFavorite: boolean;
  onDismiss: () => void;
  isOnList: (productId: string, storeId: string) => boolean;
  onAddToStore: (productId: string, storeId: string) => void;
  isAddingToStore: boolean;
};

export function PriceLookupCard({
  priceLookup,
  favorited,
  onToggleFavorite,
  isTogglingFavorite,
  onDismiss,
  isOnList,
  onAddToStore,
  isAddingToStore,
}: PriceLookupCardProps) {
  const lookupProduct = priceLookup.stores[0]?.products[0];

  return (
    <div className="app-card list-item-enter mb-4 p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-fg">
            Prices from Gemini
          </h3>
          {lookupProduct && (
            <div className="mt-1 flex items-center gap-2">
              <p className="truncate text-base font-medium text-fg">
                {lookupProduct.productName}
              </p>
              <button
                type="button"
                onClick={onToggleFavorite}
                disabled={isTogglingFavorite}
                title={favorited ? "Remove from favorites" : "Add to favorites"}
                aria-label={
                  favorited ? "Remove from favorites" : "Add to favorites"
                }
                className={`rounded-lg p-1.5 transition disabled:opacity-50 ${
                  favorited
                    ? "bg-amber-50 text-amber-500"
                    : "text-fg-subtle hover:bg-surface-muted hover:text-amber-500"
                }`}
              >
                <StarIcon className="h-4 w-4" filled={favorited} />
              </button>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="icon-btn shrink-0 -mr-2 text-fg-subtle transition hover:text-fg-muted"
          aria-label="Dismiss prices"
        >
          ✕
        </button>
      </div>
      {priceLookup.summary && (
        <p className="mb-3 text-sm text-fg-muted">{priceLookup.summary}</p>
      )}
      <div className="flex flex-col gap-3">
        {priceLookup.stores.map((store) => {
          const storeProduct = store.products[0];
          const onList =
            lookupProduct && isOnList(lookupProduct.productId, store.storeId);

          return (
            <div key={store.storeId}>
              <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                <p className="min-w-0 flex-1 truncate text-sm font-medium text-fg">
                  {store.storeName}
                </p>
                {lookupProduct && (
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        onAddToStore(lookupProduct.productId, store.storeId)
                      }
                      disabled={isAddingToStore}
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
                          : "text-fg-subtle hover:bg-surface-muted hover:text-brand-600"
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
                <p className="mt-0.5 text-xs text-fg-muted">{storeProduct.notes}</p>
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
}
