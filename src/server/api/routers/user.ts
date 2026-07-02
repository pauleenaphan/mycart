import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";
import { lookupGroceryPrices } from "~/server/gemini/lookup-grocery-prices";
import { findProductByExactName, searchProductsByName } from "~/server/products/find-product-by-name";
import { type db } from "~/server/db";
import { type GroceryPriceLookupResult } from "~/types/grocery";
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
        orderBy: { createdAt: "asc" },
        include: { product: true },
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
    themeColor: isThemeColor(user.themeColor) ? user.themeColor : "pink",
    stores: user.stores,
    shoppingList: user.shoppingListItems,
    favoriteItems: user.favoriteItems,
  };
}

export const userRouter = createTRPCRouter({
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    return getUserProfile(ctx.db, ctx.session.user.id);
  }),

  setClearOnCheck: protectedProcedure
    .input(z.object({ clearOnCheck: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: { clearOnCheck: input.clearOnCheck },
      });

      return getUserProfile(ctx.db, ctx.session.user.id);
    }),

  setThemeColor: protectedProcedure
    .input(z.object({ themeColor: z.enum(THEME_COLORS) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: { themeColor: input.themeColor },
      });

      return getUserProfile(ctx.db, ctx.session.user.id);
    }),

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
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const name = input.name.trim();
      const existing = await findProductByExactName(ctx.db, name);

      if (existing) {
        await ctx.db.shoppingListItem.create({
          data: {
            userId: ctx.session.user.id,
            productId: existing.id,
          },
        });

        return {
          profile: await getUserProfile(ctx.db, ctx.session.user.id),
          priceLookup: null as GroceryPriceLookupResult | null,
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

      if (user && user.stores.length > 0) {
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
        }
      }

      await ctx.db.shoppingListItem.create({
        data: {
          userId: ctx.session.user.id,
          productId: product.id,
        },
      });

      return {
        profile: await getUserProfile(ctx.db, ctx.session.user.id),
        priceLookup,
      };
    }),

  searchProducts: protectedProcedure
    .input(z.object({ query: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      return searchProductsByName(ctx.db, input.query);
    }),

  findProductByName: protectedProcedure
    .input(z.object({ name: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      return findProductByExactName(ctx.db, input.name);
    }),

  addProductToList: protectedProcedure
    .input(z.object({ productId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const product = await ctx.db.product.findUnique({
        where: { id: input.productId },
      });

      if (!product) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
      }

      await ctx.db.shoppingListItem.create({
        data: {
          userId: ctx.session.user.id,
          productId: product.id,
        },
      });

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

  addFavoriteItem: protectedProcedure
    .input(z.object({ text: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const text = input.text.trim();

      await ctx.db.favoriteGroceryItem.upsert({
        where: {
          userId_text: {
            userId: ctx.session.user.id,
            text,
          },
        },
        create: {
          userId: ctx.session.user.id,
          text,
        },
        update: {},
      });

      return getUserProfile(ctx.db, ctx.session.user.id);
    }),

  removeFavoriteItem: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.favoriteGroceryItem.deleteMany({
        where: { id: input.id, userId: ctx.session.user.id },
      });

      return getUserProfile(ctx.db, ctx.session.user.id);
    }),

  addFavoriteToShoppingList: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const favorite = await ctx.db.favoriteGroceryItem.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });

      if (!favorite) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      await ctx.db.shoppingListItem.create({
        data: {
          userId: ctx.session.user.id,
          productId: (
            await ctx.db.product.create({
              data: { name: favorite.text },
            })
          ).id,
        },
      });

      return getUserProfile(ctx.db, ctx.session.user.id);
    }),
});
