import { CheckIcon } from "~/app/_components/icons";
import { type UserProfile } from "~/types/user";

type ShoppingListItemProps = {
  item: UserProfile["shoppingList"][number];
  onToggle: () => void;
  onRemove: () => void;
  isToggling: boolean;
  isRemoving: boolean;
};

export function ShoppingListItem({
  item,
  onToggle,
  onRemove,
  isToggling,
  isRemoving,
}: ShoppingListItemProps) {
  return (
    <li
      data-list-item-id={item.id}
      className={`app-card list-item-enter ${isRemoving ? "list-item-exiting" : ""}`}
    >
      <div className="list-item-row flex items-center gap-2.5 px-3 py-2">
        <button
          type="button"
          onClick={() => {
            if (isToggling) return;
            onToggle();
          }}
          aria-label={item.checked ? "Uncheck item" : "Check item"}
          aria-busy={isToggling}
          className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
        >
          <span
            aria-hidden
            className={`list-check flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 ${
              item.checked
                ? "list-check-checked border-brand-600 bg-brand-600 text-white"
                : "border-edge bg-surface"
            }`}
          >
            {item.checked && (
              <CheckIcon className="list-check-mark h-3 w-3" />
            )}
          </span>
          <span
            className={`list-item-label min-w-0 flex-1 text-sm sm:text-base ${
              item.checked ? "list-item-label-checked" : ""
            }`}
          >
            {item.product.name}
          </span>
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            if (isRemoving) return;
            onRemove();
          }}
          disabled={isRemoving}
          className="shrink-0 rounded-md p-1 text-fg-subtle transition hover:text-red-400 disabled:pointer-events-none"
          aria-label="Remove item"
        >
          ✕
        </button>
      </div>
    </li>
  );
}
