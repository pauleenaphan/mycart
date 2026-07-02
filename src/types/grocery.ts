export type GroceryPriceLookupInput = {
  stores: Array<{
    id: string;
    name: string;
    address: string;
    placeId: string;
    lat: number;
    lng: number;
    website: string | null;
  }>;
  products: Array<{
    id: string;
    name: string;
  }>;
};

export type GroceryProductPrice = {
  productId: string;
  productName: string;
  found: boolean;
  price: number | null;
  currency: string;
  unit: string | null;
  notes: string | null;
  sourceUrl: string | null;
  sourceTitle: string | null;
};

export type GroceryStorePriceResult = {
  storeId: string;
  storeName: string;
  storeAddress: string;
  products: GroceryProductPrice[];
};

export type GroceryPriceLookupResult = {
  stores: GroceryStorePriceResult[];
  summary: string | null;
};
