import Link from "next/link";

import { GroceryApp } from "~/app/_components/grocery-app";
import { auth } from "~/server/auth";

export default async function Home() {
  const session = await auth();

  return (
    <div className="relative min-h-screen bg-emerald-50">
      <div className="absolute top-3 right-4 z-20 flex items-center gap-3 text-sm text-emerald-700">
        {session?.user && <span>{session.user.name}</span>}
        <Link
          href={session ? "/api/auth/signout" : "/api/auth/signin"}
          className="rounded-md px-2 py-1 hover:bg-emerald-100"
        >
          {session ? "Sign out" : "Sign in"}
        </Link>
      </div>

      {session?.user ? (
        <GroceryApp />
      ) : (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
          <p className="text-center text-emerald-700">
            Sign in to save your stores, shopping list, and favorites.
          </p>
          <Link
            href="/api/auth/signin"
            className="rounded-lg bg-emerald-600 px-6 py-2.5 font-medium text-white hover:bg-emerald-700"
          >
            Sign in with Discord
          </Link>
        </div>
      )}
    </div>
  );
}
