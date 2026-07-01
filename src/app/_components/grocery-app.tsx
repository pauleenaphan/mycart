"use client";

import { GroceryList } from "~/app/_components/grocery-list";
import { StoresSection } from "~/app/_components/stores/stores-section";
import { api } from "~/trpc/react";

export function GroceryApp() {
  const { data: user, isLoading, error } = api.user.getProfile.useQuery();

  if (isLoading) {
    return (
      <p className="pt-24 text-center text-emerald-500">Loading your list...</p>
    );
  }

  if (error ?? !user) {
    return (
      <p className="pt-24 text-center text-red-500">
        Failed to load your profile. Try refreshing the page.
      </p>
    );
  }

  return (
    <>
      <StoresSection user={user} />
      <GroceryList user={user} />
    </>
  );
}
