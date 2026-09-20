import { put, del } from "@vercel/blob";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { isBlobConfigured, isClerkConfigured } from "@/lib/config";

export const runtime = "nodejs";

const MAX_BYTES = 6 * 1024 * 1024;

function unauthorized() {
  return NextResponse.json({ error: "Sign in to sync photos." }, { status: 401 });
}

async function requireUserId() {
  if (!isClerkConfigured()) return null;
  const { userId } = await auth();
  return userId;
}

export async function POST(request: Request) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();
  if (!isBlobConfigured()) {
    return NextResponse.json(
      { error: "Photo cloud storage is not configured (BLOB_READ_WRITE_TOKEN)." },
      { status: 503 },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart form data." }, { status: 400 });
  }

  const photoId = String(form.get("photoId") ?? "").trim();
  const file = form.get("file");
  if (!photoId || !(file instanceof Blob) || file.size === 0) {
    return NextResponse.json({ error: "photoId and file are required." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "That photo is too large to sync." }, { status: 413 });
  }

  const mimeType =
    String(form.get("mimeType") ?? file.type ?? "image/jpeg") || "image/jpeg";
  const ext = mimeType.includes("webp") ? "webp" : "jpg";
  const pathname = `users/${userId}/photos/${photoId}.${ext}`;

  try {
    const blob = await put(pathname, file, {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: mimeType,
    });
    return NextResponse.json({
      id: photoId,
      url: blob.url,
      pathname: blob.pathname,
    });
  } catch (error) {
    console.error("POST /api/photos failed", error);
    return NextResponse.json({ error: "Could not upload that photo." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();
  if (!isBlobConfigured()) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Expected JSON." }, { status: 400 });
  }

  const ids = body && typeof body === "object" && "ids" in body
    ? (body as { ids: unknown }).ids
    : null;
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ ok: true });
  }

  const paths = ids
    .filter((id): id is string => typeof id === "string" && id.length > 0)
    .flatMap((id) => [
      `users/${userId}/photos/${id}.webp`,
      `users/${userId}/photos/${id}.jpg`,
    ]);

  try {
    if (paths.length > 0) await del(paths);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/photos failed", error);
    return NextResponse.json({ error: "Could not delete synced photos." }, { status: 500 });
  }
}
