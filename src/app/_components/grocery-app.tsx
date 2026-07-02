"use client";

import { useState } from "react";

import { AppNav, type AppTab } from "~/app/_components/app-nav";
import { GroceryList } from "~/app/_components/grocery-list";
import { ProfileSection } from "~/app/_components/profile-section";
import { StoresSection } from "~/app/_components/stores/stores-section";
import { ThemeApplier } from "~/app/_components/theme-applier";
import { api } from "~/trpc/react";

export function GroceryApp() {
  const [activeTab, setActiveTab] = useState<AppTab>("list");
  const { data: user, isLoading, error } = api.user.getProfile.useQuery();

  if (isLoading) {
    return (
      <p className="pt-24 text-center text-stone-500">Loading your list...</p>
    );
  }

  if (error ?? !user) {
    return (
      <p className="pt-24 text-center text-red-600">
        Failed to load your profile. Try refreshing the page.
      </p>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <ThemeApplier themeColor={user.themeColor} />
      <main className="flex-1 pb-24">
        {activeTab === "list" && <GroceryList user={user} />}
        {activeTab === "stores" && <StoresSection user={user} />}
        {activeTab === "profile" && <ProfileSection user={user} />}
      </main>
      <AppNav activeTab={activeTab} onChange={setActiveTab} />
    </div>
  );
}
