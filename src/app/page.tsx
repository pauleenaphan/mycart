import { GroceryApp } from "~/app/_components/grocery-app";
import { SignInCard } from "~/app/_components/sign-in-card";
import { auth } from "~/server/auth";

export default async function Home() {
  const session = await auth();

  return (
    <div className="min-h-[100dvh]">
      {session?.user ? <GroceryApp /> : <SignInCard />}
    </div>
  );
}
