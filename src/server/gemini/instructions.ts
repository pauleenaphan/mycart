import {
  getHostname,
  getOfficialCatalogSearchUrls,
  getSuggestedSearchQueries,
} from "~/server/gemini/store-search";

export const GEMINI_GROCERY_SYSTEM_INSTRUCTION = `You are a grocery price research assistant with access to Google Search.

Your job is to find products and prices on each store's OFFICIAL website and online catalog — not third-party sites.

## Search strategy (required)
For each store and product, run MULTIPLE Google Search queries. Do not stop after one failed query.

1. Search the store's main domain catalog, e.g. site:costco.com milk
2. Search for product-specific pages, e.g. site:costco.com "milk" gallon
3. Search the store's online shop/catalog URLs (not just the store locator page from officialWebsite)
4. Try catalog search pages such as /CatalogSearch, /search?q=, /search?query=

The officialWebsite field is often a store LOCATOR page (hours, address). Prices are usually on a different part of the same domain:
- Costco: www.costco.com/CatalogSearch and product pages on costco.com
- H Mart: www.hmart.com search and product pages
- Central Market: www.centralmarket.com search and product pages

## Source rules
- ONLY use pages on the store's official domain (including subdomains like shop.hmart.com if it matches the retailer).
- Do NOT use Instacart, Yelp, Google Maps, news, blogs, or price aggregators.
- Copy sourceUrl EXACTLY from Google Search results. Never invent or shorten URLs.

## Price rules
- Set "found" to true and include "price" whenever you see a numeric price on ANY official page — product detail pages, catalog search results, category listings, or search snippets from the official domain.
- Catalog search pages (e.g. costco.com/CatalogSearch?keyword=french+fries) often list prices directly in the results. Extract the best matching product price from those listings.
- Pick the closest matching product (e.g. "Kirkland Signature Extra Crispy French Fries" for "french fries") and use that item's price.
- If multiple official products match, use the most popular or best-matching item and mention the product name in "notes".
- Only set found: false when you truly cannot find any numeric price on the official site after searching the catalog.
- If you find products but no price (login required, etc.), set found: false, price: null, and still provide sourceUrl.

## Output rules
- Use "USD" unless the store clearly uses another currency.
- Include "unit" when known (gallon, half gallon, each, lb, etc.).
- sourceTitle should describe the page (product name, "Catalog search results", etc.).
- Return ONLY valid JSON. No markdown, no code fences.

## Output JSON schema
{
  "stores": [
    {
      "storeId": "string",
      "storeName": "string",
      "storeAddress": "string",
      "products": [
        {
          "productId": "string",
          "productName": "string",
          "found": boolean,
          "price": number | null,
          "currency": "string",
          "unit": string | null,
          "notes": string | null,
          "sourceUrl": string | null,
          "sourceTitle": string | null
        }
      ]
    }
  ],
  "summary": "string | null"
}`;

export function buildGroceryPriceLookupPrompt(input: {
  stores: Array<{
    id: string;
    name: string;
    address: string;
    placeId: string;
    lat: number;
    lng: number;
    website: string | null;
  }>;
  products: Array<{ id: string; name: string }>;
}): string {
  const storesWithSearchPlan = input.stores.map((store) => {
    const domain = store.website ? getHostname(store.website) : null;
    const product = input.products[0]?.name ?? "";

    return {
      storeId: store.id,
      storeName: store.name,
      storeAddress: store.address,
      officialWebsite: store.website,
      domain,
      suggestedSearchQueries: store.website
        ? input.products.flatMap((p) =>
            getSuggestedSearchQueries(store.name, store.website!, p.name),
          )
        : [],
      suggestedCatalogUrls: store.website
        ? input.products.flatMap((p) =>
            getOfficialCatalogSearchUrls(store.website!, p.name),
          )
        : [],
    };
  });

  return `Look up current prices for these products at these grocery stores using Google Search.

For EACH store, run the suggestedSearchQueries below. Also check suggestedCatalogUrls on the official site.
The officialWebsite may be a store locator — search the broader official domain for product/catalog pages.

Stores and search plan:
${JSON.stringify(storesWithSearchPlan, null, 2)}

Products:
${JSON.stringify(input.products, null, 2)}

Return one entry per store with every product. Use store "storeId" as "storeId" and product "id" as "productId".
Extract prices from official catalog/search results when product detail pages are unavailable.
Always include sourceUrl to the official page where you found the product or price.`;
}
