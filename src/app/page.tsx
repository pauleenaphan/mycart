import Link from "next/link";

import { GroceryApp } from "~/app/_components/grocery-app";
import { auth } from "~/server/auth";

export default async function Home() {
  const session = await auth();

  return (
    <div className="min-h-screen">
      {session?.user ? (
        <GroceryApp />
      ) : (
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4">
          <div className="text-center">
            <h1 className="page-title">Grocery List</h1>
            <p className="page-description mt-3 max-w-sm">
              Sign in to save your stores, shopping list, and favorites.
            </p>
          </div>
          <Link href="/api/auth/signin" className="btn-primary px-6 py-3">
            Sign in with Discord
          </Link>
        </div>
      )}
    </div>
  );
}
