export type Store = {
  id: string;
  name: string;
  address: string;
  placeId: string;
  lat: number;
  lng: number;
};

export type ShoppingListItem = {
  id: string;
  text: string;
  checked: boolean;
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
  stores: Store[];
  shoppingList: ShoppingListItem[];
  favoriteItems: FavoriteGroceryItem[];
};
