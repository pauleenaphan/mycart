import { z } from "zod";

import { getGeminiClient, GEMINI_MODEL } from "~/server/gemini/client";
import {
  buildGroceryPriceLookupPrompt,
  GEMINI_GROCERY_SYSTEM_INSTRUCTION,
} from "~/server/gemini/instructions";
import {
  extractGroundingWebSources,
  resolveVerifiedProductSourceUrl,
} from "~/server/gemini/source-url";
import { isOfficialStoreUrl } from "~/server/gemini/official-website";
import {
  type GroceryPriceLookupInput,
  type GroceryPriceLookupResult,
} from "~/types/grocery";

const productPriceSchema = z.object({
  productId: z.string(),
  productName: z.string(),
  found: z.boolean(),
  price: z.number().nullable(),
  currency: z.string(),
  unit: z.string().nullable(),
  notes: z.string().nullable(),
  sourceUrl: z.string().nullable().optional(),
  sourceTitle: z.string().nullable().optional(),
});

const storePriceResultSchema = z.object({
  storeId: z.string(),
  storeName: z.string(),
  storeAddress: z.string(),
  products: z.array(productPriceSchema),
});

const lookupResultSchema = z.object({
  stores: z.array(storePriceResultSchema),
  summary: z.string().nullable(),
});

function extractJson(text: string): string {
  const trimmed = text.trim();
  const fenced = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(trimmed);
  return fenced?.[1]?.trim() ?? trimmed;
}

function normalizeProductResult(
  product: GroceryPriceLookupResult["stores"][number]["products"][number],
): GroceryPriceLookupResult["stores"][number]["products"][number] {
  if (product.found && product.price == null) {
    return {
      ...product,
      found: false,
      notes:
        product.notes ??
        "Product page found on the official website, but no price is listed.",
    };
  }

  return product;
}

async function verifyAndResolveSources(
  result: GroceryPriceLookupResult,
  stores: GroceryPriceLookupInput["stores"],
  groundingSources: ReturnType<typeof extractGroundingWebSources>,
): Promise<GroceryPriceLookupResult> {
  const websiteByStoreId = new Map(
    stores.map((store) => [store.id, store.website]),
  );

  const resolvedStores = await Promise.all(
    result.stores.map(async (store) => {
      const officialWebsite = websiteByStoreId.get(store.storeId) ?? null;

      const products = await Promise.all(
        store.products.map(async (product) => {
          if (!officialWebsite) {
            return {
              ...product,
              found: false,
              price: null,
              sourceUrl: null,
              sourceTitle: null,
              notes: "Official website not available for this store.",
            };
          }

          const hasOfficialSource =
            !product.sourceUrl ||
            isOfficialStoreUrl(product.sourceUrl, officialWebsite);

          const trustedModelUrl = hasOfficialSource
            ? (product.sourceUrl ?? null)
            : null;

          const normalized = normalizeProductResult({
            ...product,
            found: product.found && hasOfficialSource,
            price:
              product.found && product.price != null && hasOfficialSource
                ? product.price
                : null,
            sourceUrl: trustedModelUrl,
            sourceTitle: trustedModelUrl ? (product.sourceTitle ?? null) : null,
          });

          const verified = await resolveVerifiedProductSourceUrl({
            modelUrl: normalized.sourceUrl,
            modelTitle: normalized.sourceTitle,
            productName: normalized.productName,
            officialWebsite,
            groundingSources,
          });

          const notes = [
            product.sourceUrl && !trustedModelUrl
              ? "Gemini returned a non-official source; showing a verified store link instead."
              : null,
            normalized.notes,
            verified.notesAppend,
          ]
            .filter(Boolean)
            .join(" ")
            .trim();

          return {
            ...normalized,
            found: normalized.found && verified.verifiedProductPage,
            price:
              normalized.found && verified.verifiedProductPage
                ? normalized.price
                : null,
            sourceUrl: verified.sourceUrl,
            sourceTitle: verified.sourceTitle,
            notes: notes || normalized.notes,
          };
        }),
      );

      return {
        ...store,
        products,
      };
    }),
  );

  return {
    ...result,
    stores: resolvedStores,
  };
}

export async function lookupGroceryPrices(
  input: GroceryPriceLookupInput,
): Promise<GroceryPriceLookupResult> {
  if (input.stores.length === 0) {
    throw new Error("At least one store is required.");
  }

  if (input.products.length === 0) {
    throw new Error("At least one product is required.");
  }

  const ai = getGeminiClient();

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: buildGroceryPriceLookupPrompt(input),
    config: {
      systemInstruction: GEMINI_GROCERY_SYSTEM_INSTRUCTION,
      temperature: 0.2,
      tools: [{ googleSearch: {} }],
    },
  });

  const text = response.text?.trim();
  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }

  const parsed = lookupResultSchema.parse(
    JSON.parse(extractJson(text)) as unknown,
  ) as GroceryPriceLookupResult;

  const groundingSources = extractGroundingWebSources(response);

  return verifyAndResolveSources(parsed, input.stores, groundingSources);
}
