import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";
import { getPriceLookupError } from "~/server/gemini/errors";
import { lookupGroceryPrices } from "~/server/gemini/lookup-grocery-prices";
import { findProductByExactName, searchProductsByName } from "~/server/products/find-product-by-name";
import {
  assertUserStore,
  ensureShoppingListItem,
} from "~/server/shopping-list/ensure-item";
import { type db } from "~/server/db";
import { type GroceryPriceLookupResult, type PriceLookupError } from "~/types/grocery";
import { isThemeColor, THEME_COLORS } from "~/types/theme";
import { type UserProfile } from "~/types/user";

const storeInput = z.object({
  name: z.string().min(1),
  address: z.string(),
  placeId: z.string().min(1),
  lat: z.number(),
  lng: z.number(),
  website: z.string().url().nullable().optional(),
});

async function getUserProfile(
  database: typeof db,
  userId: string,
): Promise<UserProfile> {
  const user = await database.user.findUnique({
    where: { id: userId },
    include: {
      stores: { orderBy: { name: "asc" } },
      shoppingListItems: {
        orderBy: [{ checked: "asc" }, { createdAt: "asc" }],
        include: {
          product: true,
          store: { select: { id: true, name: true } },
        },
      },
      favoriteItems: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!user) {
    throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    clearOnCheck: user.clearOnCheck,
    useGeminiPrices: user.useGeminiPrices,
    collapseCompletedStores: user.collapseCompletedStores,
    themeColor: isThemeColor(user.themeColor) ? user.themeColor : "pink",
    stores: user.stores,
    shoppingList: user.shoppingListItems,
    favoriteItems: user.favoriteItems,
  };
}

type MutationContext = {
  db: typeof db;
  session: { user: { id: string } };
};

async function updateUserProfile(
  ctx: MutationContext,
  data: Parameters<typeof db.user.update>[0]["data"],
) {
  await ctx.db.user.update({
    where: { id: ctx.session.user.id },
    data,
  });

  return getUserProfile(ctx.db, ctx.session.user.id);
}

export const userRouter = createTRPCRouter({
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    return getUserProfile(ctx.db, ctx.session.user.id);
  }),

  setClearOnCheck: protectedProcedure
    .input(z.object({ clearOnCheck: z.boolean() }))
    .mutation(({ ctx, input }) =>
      updateUserProfile(ctx, { clearOnCheck: input.clearOnCheck }),
    ),

  setUseGeminiPrices: protectedProcedure
    .input(z.object({ useGeminiPrices: z.boolean() }))
    .mutation(({ ctx, input }) =>
      updateUserProfile(ctx, { useGeminiPrices: input.useGeminiPrices }),
    ),

  setCollapseCompletedStores: protectedProcedure
    .input(z.object({ collapseCompletedStores: z.boolean() }))
    .mutation(({ ctx, input }) =>
      updateUserProfile(ctx, {
        collapseCompletedStores: input.collapseCompletedStores,
      }),
    ),

  setThemeColor: protectedProcedure
    .input(z.object({ themeColor: z.enum(THEME_COLORS) }))
    .mutation(({ ctx, input }) =>
      updateUserProfile(ctx, { themeColor: input.themeColor }),
    ),

  addStore: protectedProcedure
    .input(storeInput)
    .mutation(async ({ ctx, input }) => {
      await ctx.db.store.upsert({
        where: {
          userId_placeId: {
            userId: ctx.session.user.id,
            placeId: input.placeId,
          },
        },
        create: {
          userId: ctx.session.user.id,
          ...input,
          website: input.website ?? null,
        },
        update: {
          ...input,
          website: input.website ?? null,
        },
      });

      return getUserProfile(ctx.db, ctx.session.user.id);
    }),

  removeStore: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.store.deleteMany({
        where: { id: input.id, userId: ctx.session.user.id },
      });

      return getUserProfile(ctx.db, ctx.session.user.id);
    }),

  addShoppingItem: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        storeId: z.string().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const name = input.name.trim();

      const userSettings = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { useGeminiPrices: true },
      });

      let storeId: string | null = null;
      if (!userSettings?.useGeminiPrices && input.storeId) {
        try {
          await assertUserStore(ctx.db, ctx.session.user.id, input.storeId);
          storeId = input.storeId;
        } catch {
          throw new TRPCError({ code: "NOT_FOUND", message: "Store not found" });
        }
      }

      const existing = await findProductByExactName(ctx.db, name);

      if (existing) {
        await ensureShoppingListItem(
          ctx.db,
          ctx.session.user.id,
          existing.id,
          userSettings?.useGeminiPrices ? null : storeId,
        );

        return {
          profile: await getUserProfile(ctx.db, ctx.session.user.id),
          priceLookup: null as GroceryPriceLookupResult | null,
          priceLookupError: null as PriceLookupError | null,
        };
      }

      const product = await ctx.db.product.create({
        data: { name },
      });

      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        include: { stores: true },
      });

      let priceLookup: GroceryPriceLookupResult | null = null;
      let priceLookupError: PriceLookupError | null = null;

      if (user?.useGeminiPrices && user.stores.length > 0) {
        try {
          priceLookup = await lookupGroceryPrices({
            stores: user.stores.map((store) => ({
              id: store.id,
              name: store.name,
              address: store.address,
              placeId: store.placeId,
              lat: store.lat,
              lng: store.lng,
              website: store.website,
            })),
            products: [{ id: product.id, name: product.name }],
          });
        } catch (error) {
          console.error("Gemini price lookup failed:", error);
          priceLookupError = getPriceLookupError(error);
        }
      } else if (!user?.useGeminiPrices) {
        await ensureShoppingListItem(
          ctx.db,
          ctx.session.user.id,
          product.id,
          storeId,
        );
      }

      return {
        profile: await getUserProfile(ctx.db, ctx.session.user.id),
        priceLookup,
        priceLookupError,
      };
    }),

  searchProducts: protectedProcedure
    .input(z.object({ query: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      return searchProductsByName(ctx.db, input.query);
    }),

  addProductToList: protectedProcedure
    .input(
      z.object({
        productId: z.string(),
        storeId: z.string().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const product = await ctx.db.product.findUnique({
        where: { id: input.productId },
      });

      if (!product) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
      }

      const storeId = input.storeId ?? null;

      if (storeId) {
        try {
          await assertUserStore(ctx.db, ctx.session.user.id, storeId);
        } catch {
          throw new TRPCError({ code: "NOT_FOUND", message: "Store not found" });
        }
      }

      await ensureShoppingListItem(
        ctx.db,
        ctx.session.user.id,
        product.id,
        storeId,
      );

      return getUserProfile(ctx.db, ctx.session.user.id);
    }),

  toggleFavoriteItem: protectedProcedure
    .input(z.object({ text: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const text = input.text.trim();
      const favorites = await ctx.db.favoriteGroceryItem.findMany({
        where: { userId: ctx.session.user.id },
      });
      const existing = favorites.find(
        (favorite) => favorite.text.toLowerCase() === text.toLowerCase(),
      );

      if (existing) {
        await ctx.db.favoriteGroceryItem.delete({
          where: { id: existing.id },
        });
      } else {
        await ctx.db.favoriteGroceryItem.create({
          data: {
            userId: ctx.session.user.id,
            text,
          },
        });
      }

      return getUserProfile(ctx.db, ctx.session.user.id);
    }),

  toggleShoppingItem: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUniqueOrThrow({
        where: { id: ctx.session.user.id },
        select: { clearOnCheck: true },
      });

      if (user.clearOnCheck) {
        await ctx.db.shoppingListItem.deleteMany({
          where: { id: input.id, userId: ctx.session.user.id },
        });
      } else {
        const item = await ctx.db.shoppingListItem.findFirst({
          where: { id: input.id, userId: ctx.session.user.id },
        });

        if (!item) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        await ctx.db.shoppingListItem.update({
          where: { id: input.id },
          data: { checked: !item.checked },
        });
      }

      return getUserProfile(ctx.db, ctx.session.user.id);
    }),

  removeShoppingItem: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.shoppingListItem.deleteMany({
        where: { id: input.id, userId: ctx.session.user.id },
      });

      return getUserProfile(ctx.db, ctx.session.user.id);
    }),

  clearShoppingList: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db.shoppingListItem.deleteMany({
      where: { userId: ctx.session.user.id },
    });

    return getUserProfile(ctx.db, ctx.session.user.id);
  }),

  clearShoppingListByStore: protectedProcedure
    .input(z.object({ storeId: z.string().nullable() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.shoppingListItem.deleteMany({
        where: {
          userId: ctx.session.user.id,
          storeId: input.storeId,
        },
      });

      return getUserProfile(ctx.db, ctx.session.user.id);
    }),

});
