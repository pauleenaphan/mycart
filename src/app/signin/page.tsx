import { SignInCard } from "~/app/_components/sign-in-card";

type SignInPageProps = {
  searchParams: Promise<{
    error?: string;
    callbackUrl?: string;
  }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;

  return (
    <SignInCard
      callbackUrl={params.callbackUrl ?? "/"}
      error={params.error}
      showBackLink
    />
  );
}
