"use client";

import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { clerkAppearance } from "@/lib/clerk-appearance";
import { isClerkConfigured } from "@/lib/config";

export default function SignUpPage() {
  if (!isClerkConfigured()) {
    return (
      <div className="mx-auto max-w-md px-4 py-10">
        <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight">
          Sign-up is not set up yet
        </h1>
        <p className="mt-3 text-sm text-[var(--muted)]">
          Guest mode still works in this browser. Add Clerk keys from{" "}
          <code>.env.example</code> to create an account.
        </p>
        <Link href="/" className="btn-primary mt-6 inline-flex">
          Back to shelf
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center px-4 py-10">
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--xbox)]">Account</p>
      <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl tracking-tight">
        Create an account
      </h1>
      <p className="mt-2 mb-6 text-center text-sm text-[var(--muted)]">
        Same account on every device sees the same shelf, including photos.
      </p>
      <SignUp appearance={clerkAppearance} />
    </div>
  );
}
