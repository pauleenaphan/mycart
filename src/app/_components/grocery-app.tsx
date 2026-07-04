"use client";

import { useState } from "react";

import { AppHeader } from "~/app/_components/app-brand";
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
      <div className="flex min-h-[100dvh] flex-col">
        <AppHeader />
        <p className="flex flex-1 items-center justify-center text-fg-muted">
          Loading your list...
        </p>
      </div>
    );
  }

  if (error ?? !user) {
    return (
      <div className="flex min-h-[100dvh] flex-col">
        <AppHeader />
        <p className="flex flex-1 items-center justify-center text-red-600">
          Failed to load your profile. Try refreshing the page.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <ThemeApplier themeColor={user.themeColor} darkMode={user.darkMode} />
      <AppHeader />
      <main className="app-shell-main flex-1">
        {activeTab === "list" && <GroceryList user={user} />}
        {activeTab === "stores" && <StoresSection user={user} />}
        {activeTab === "profile" && <ProfileSection user={user} />}
      </main>
      <AppNav activeTab={activeTab} onChange={setActiveTab} />
    </div>
  );
}
