import { GroceryApp } from "~/app/_components/grocery-app";
import { LoginScreen } from "~/app/_components/login-screen";
import { auth } from "~/server/auth";

export default async function Home() {
  const session = await auth();

  return (
    <div className="min-h-[100dvh]">
      {session?.user ? <GroceryApp /> : <LoginScreen />}
    </div>
  );
}
