import { ChevronDownIcon } from "~/app/_components/icons";
import { ShoppingListItem } from "~/app/_components/shopping-list-item";
import { type StoreListGroup } from "~/lib/group-items-by-store";

type StoreGroupSectionProps = {
  group: StoreListGroup;
  collapseCompletedStores: boolean;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onClearStore: () => void;
  isClearing: boolean;
  isClearingStore: boolean;
  onToggleItem: (id: string) => void;
  onRemoveItem: (id: string) => void;
  togglingItemId: string | null;
  exitingItemIds: ReadonlySet<string>;
};

export function StoreGroupSection({
  group,
  collapseCompletedStores,
  isExpanded,
  onToggleExpanded,
  onClearStore,
  isClearing,
  isClearingStore,
  onToggleItem,
  onRemoveItem,
  togglingItemId,
  exitingItemIds,
}: StoreGroupSectionProps) {
  const checkedCount = group.items.filter((item) => item.checked).length;
  const totalCount = group.items.length;
  const isComplete = totalCount > 0 && checkedCount === totalCount;
  const canCollapse = collapseCompletedStores && isComplete;
  const isCollapsed = canCollapse && !isExpanded;
  const progress = (
    <span
      className="shrink-0 text-xs tabular-nums text-fg-muted"
      aria-label={`${checkedCount} of ${totalCount} items checked`}
    >
      {checkedCount}/{totalCount}
    </span>
  );

  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-2">
        {canCollapse ? (
          <button
            type="button"
            onClick={onToggleExpanded}
            aria-expanded={!isCollapsed}
            className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
          >
            <ChevronDownIcon
              className={`h-4 w-4 shrink-0 text-fg-subtle transition-transform ${
                isCollapsed ? "-rotate-90" : ""
              }`}
            />
            <span className="min-w-0 truncate text-xs font-semibold tracking-wide text-fg-muted uppercase">
              {group.storeName}
            </span>
            {progress}
          </button>
        ) : (
          <div className="flex min-w-0 flex-1 items-baseline gap-2">
            <h3 className="min-w-0 truncate text-xs font-semibold tracking-wide text-fg-muted uppercase">
              {group.storeName}
            </h3>
            {progress}
          </div>
        )}
        <button
          type="button"
          onClick={onClearStore}
          disabled={isClearing}
          title={`Clear all items at ${group.storeName}`}
          aria-label={`Clear all items at ${group.storeName}`}
          className="shrink-0 text-xs text-fg-muted transition hover:text-red-500 disabled:opacity-50"
        >
          {isClearingStore ? "…" : "Clear"}
        </button>
      </div>
      {!isCollapsed && (
        <ul className="flex flex-col gap-2">
          {group.items.map((item) => (
            <ShoppingListItem
              key={item.id}
              item={item}
              onToggle={() => onToggleItem(item.id)}
              onRemove={() => onRemoveItem(item.id)}
              isToggling={togglingItemId === item.id}
              isRemoving={exitingItemIds.has(item.id)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
