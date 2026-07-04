import { type UserProfile } from "~/types/user";

export type StoreListGroup = {
  storeId: string | null;
  storeName: string;
  items: UserProfile["shoppingList"];
};

export function groupItemsByStore(
  items: UserProfile["shoppingList"],
): StoreListGroup[] {
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
      items: [...group.items].sort(
        (a, b) => Number(a.checked) - Number(b.checked),
      ),
    }));
}
