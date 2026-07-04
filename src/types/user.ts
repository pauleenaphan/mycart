import { type ThemeColor } from "~/types/theme";

export type Store = {
  id: string;
  name: string;
  address: string;
  placeId: string;
  lat: number;
  lng: number;
  website: string | null;
};

export type Product = {
  id: string;
  name: string;
};

export type ShoppingListItem = {
  id: string;
  checked: boolean;
  product: Product;
  store: Pick<Store, "id" | "name"> | null;
};

export type FavoriteGroceryItem = {
  id: string;
  text: string;
};

export type UserProfile = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  clearOnCheck: boolean;
  useGeminiPrices: boolean;
  collapseCompletedStores: boolean;
  themeColor: ThemeColor;
  stores: Store[];
  shoppingList: ShoppingListItem[];
  favoriteItems: FavoriteGroceryItem[];
};
