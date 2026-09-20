import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { isBlobConfigured, isClerkConfigured, isDatabaseConfigured } from "@/lib/config";
import { ensureSchema } from "@/lib/db";
import { collectPhotoUrls } from "@/lib/sync";
import { normalizeItem } from "@/lib/storage";
import type { CollectionItem } from "@/lib/types";

export const runtime = "nodejs";

function unauthorized() {
  return NextResponse.json({ error: "Sign in to sync this shelf." }, { status: 401 });
}

function notConfigured() {
  return NextResponse.json(
    {
      error:
        "Cloud sync is not configured yet. Add Clerk keys and DATABASE_URL on the Vercel project.",
    },
    { status: 503 },
  );
}

async function requireUserId() {
  if (!isClerkConfigured() || !isDatabaseConfigured()) return null;
  const { userId } = await auth();
  return userId;
}

function isCollectionItem(value: unknown): value is CollectionItem {
  if (!value || typeof value !== "object") return false;
  const item = value as CollectionItem;
  return typeof item.id === "string" && typeof item.title === "string";
}

export async function GET() {
  const userId = await requireUserId();
  if (!isClerkConfigured() || !isDatabaseConfigured()) return notConfigured();
  if (!userId) return unauthorized();

  try {
    const sql = await ensureSchema();
    const rows = await sql`
      SELECT id, data, updated_at, deleted_at
      FROM shelf_items
      WHERE user_id = ${userId}
    `;

    const items: CollectionItem[] = [];
    const deleted: Array<{ id: string; deletedAt: string }> = [];

    for (const row of rows) {
      const id = String(row.id);
      if (row.deleted_at) {
        deleted.push({
          id,
          deletedAt: new Date(String(row.deleted_at)).toISOString(),
        });
        continue;
      }
      const data = row.data;
      if (isCollectionItem(data)) {
        items.push(normalizeItem(data));
      }
    }

    return NextResponse.json({
      items,
      deleted,
      blobConfigured: isBlobConfigured(),
    });
  } catch (error) {
    console.error("GET /api/collection failed", error);
    return NextResponse.json(
      { error: "Could not load the signed-in shelf." },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  const userId = await requireUserId();
  if (!isClerkConfigured() || !isDatabaseConfigured()) return notConfigured();
  if (!userId) return unauthorized();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Expected JSON." }, { status: 400 });
  }

  const rawItems =
    body && typeof body === "object" && "items" in body
      ? (body as { items: unknown }).items
      : null;
  if (!Array.isArray(rawItems)) {
    return NextResponse.json({ error: "Expected { items: [] }." }, { status: 400 });
  }

  const items = rawItems.filter(isCollectionItem).map(normalizeItem);
  const keepIds = items.map((item) => item.id);

  try {
    const sql = await ensureSchema();

    const previous = await sql`
      SELECT data FROM shelf_items
      WHERE user_id = ${userId} AND deleted_at IS NULL
    `;
    const previousUrls = new Set(
      collectPhotoUrls(
        previous.flatMap((row) =>
          isCollectionItem(row.data) ? [normalizeItem(row.data)] : [],
        ),
      ),
    );
    const nextUrls = new Set(collectPhotoUrls(items));
    const removedUrls = [...previousUrls].filter((url) => !nextUrls.has(url));

    for (const item of items) {
      await sql`
        INSERT INTO shelf_items (user_id, id, data, updated_at, deleted_at)
        VALUES (${userId}, ${item.id}, ${JSON.stringify(item)}, ${item.updatedAt}, NULL)
        ON CONFLICT (user_id, id)
        DO UPDATE SET
          data = EXCLUDED.data,
          updated_at = EXCLUDED.updated_at,
          deleted_at = NULL
      `;
    }

    if (keepIds.length === 0) {
      await sql`
        UPDATE shelf_items
        SET deleted_at = NOW()
        WHERE user_id = ${userId} AND deleted_at IS NULL
      `;
    } else {
      await sql`
        UPDATE shelf_items
        SET deleted_at = NOW()
        WHERE user_id = ${userId}
          AND deleted_at IS NULL
          AND NOT (id = ANY(${keepIds}))
      `;
    }

    if (removedUrls.length > 0 && isBlobConfigured()) {
      const { del } = await import("@vercel/blob");
      try {
        await del(removedUrls);
      } catch (error) {
        console.error("Blob cleanup failed", error);
      }
    }

    return NextResponse.json({ ok: true, count: items.length });
  } catch (error) {
    console.error("PUT /api/collection failed", error);
    return NextResponse.json(
      { error: "Could not save the shelf to your account." },
      { status: 500 },
    );
  }
}
