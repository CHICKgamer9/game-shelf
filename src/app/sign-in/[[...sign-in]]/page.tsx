"use client";

import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { clerkAppearance } from "@/lib/clerk-appearance";
import { isClerkConfigured } from "@/lib/config";

export default function SignInPage() {
  if (!isClerkConfigured()) {
    return <AuthNotConfigured action="sign in" />;
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center px-4 py-10">
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--xbox)]">Account</p>
      <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl tracking-tight">
        Sign in
      </h1>
      <p className="mt-2 mb-6 text-center text-sm text-[var(--muted)]">
        Magic link or Google. The shelf on this device is merged into your account —
        nothing is wiped.
      </p>
      <SignIn appearance={clerkAppearance} />
    </div>
  );
}

function AuthNotConfigured({ action }: { action: string }) {
  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight">
        Sign-in is not set up yet
      </h1>
      <p className="mt-3 text-sm text-[var(--muted)]">
        Guest mode still works in this browser. To {action} across devices, add Clerk
        keys (and Neon + Blob) as documented in <code>.env.example</code>.
      </p>
      <Link href="/" className="btn-primary mt-6 inline-flex">
        Back to shelf
      </Link>
    </div>
  );
}
