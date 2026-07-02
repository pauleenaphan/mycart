import { type db } from "~/server/db";

export async function findProductByExactName(
  database: typeof db,
  name: string,
) {
  const normalized = name.trim().toLowerCase();
  if (!normalized) return null;

  const products = await database.product.findMany({
    orderBy: { name: "asc" },
  });

  return (
    products.find((product) => product.name.toLowerCase() === normalized) ?? null
  );
}

export async function searchProductsByName(
  database: typeof db,
  query: string,
  limit = 8,
) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  const products = await database.product.findMany({
    orderBy: { name: "asc" },
  });

  return products
    .filter((product) => product.name.toLowerCase().includes(normalized))
    .slice(0, limit);
}
