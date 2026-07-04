import { type db } from "~/server/db";

export async function ensureShoppingListItem(
  database: typeof db,
  userId: string,
  productId: string,
  storeId: string | null,
) {
  const existing = await database.shoppingListItem.findFirst({
    where: {
      userId,
      productId,
      storeId,
    },
  });

  if (existing) {
    return existing;
  }

  return database.shoppingListItem.create({
    data: {
      userId,
      productId,
      storeId,
    },
  });
}

export async function assertUserStore(
  database: typeof db,
  userId: string,
  storeId: string,
) {
  const store = await database.store.findFirst({
    where: { id: storeId, userId },
  });

  if (!store) {
    throw new Error("Store not found");
  }

  return store;
}
