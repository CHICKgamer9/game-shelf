# Game Shelf

Track video game disks, consoles, and accessories. Approximate collection value in **AUD**.

Guest-first: the shelf works with no account (items in `localStorage`, photos in **IndexedDB**). Sign in once per device to sync the same collection — including photos — across browsers and phones.

## Live

**https://game-shelf-five.vercel.app**

Repo: https://github.com/CHICKgamer9/game-shelf

Vercel project: `game-shelf` on team `chickgamer9com-9658s-projects`, production branch `main`. Pushes to `main` auto-deploy.

If a dashboard alias asks you to log in with Vercel, use the `*.vercel.app` production URL above — that one is public.

## Run locally

```bash
npm install
cp .env.example .env.local   # optional; guest mode works without it
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Useful scripts:

```bash
npm test      # totals + estimate + photo + sync-merge helpers
npm run lint
npm run build
```

To exercise signed-in sync locally, fill `.env.local` then `vercel env pull .env.local` after linking the Vercel project.

## Add your first real games

1. Open Game Shelf (local or the live Vercel URL).
2. The first visit seeds a few **Xbox One sample** disks (and a console) so you can see totals. They are marked **Sample**.
3. Tap **Remove samples** on the home shelf, or open each sample and **Delete**.
4. Tap **Add disk**. Title, condition, and purchase price are the important fields. Platform defaults to Xbox One / physical disk / CIB.
5. Add photos from your camera roll or files (optional cover-art URL still works as a fallback). The first photo is the shelf card face.
6. Save. Home totals update immediately (estimated value, cost basis, gain/loss when both are known).
7. Optional: barcode, region, edition (GOTY, steelbook…), or a manual market-value override.
8. Optional: **Sign in** (magic link or Google) to keep this shelf on every device.

Hardware (Xbox One, controllers, Kinect) lives in the same catalog — set **Kind** to Hardware.

Wishlist items stay on the shelf but are excluded from value totals.

Photos are compressed in the browser (max dimension **1200px**, JPEG/WebP, up to **8 per item**) and stored in IndexedDB so `localStorage` does not fill up. After sign-in they also upload to Vercel Blob.

## Cross-device sync

| Mode | Where data lives |
| --- | --- |
| Guest / signed out | This browser only (`localStorage` + IndexedDB) |
| Signed in | Neon Postgres (items) + Vercel Blob (photos), scoped to the Clerk user id |

**Conflict strategy (last-write-wins per item):** each item has `updatedAt`. On sign-in, local and cloud are **merged**, never silently replaced:

- Same item id on both sides → newer `updatedAt` wins. Photo URLs from the losing side are kept for photo ids that still exist, so a newer title edit cannot drop an already-uploaded picture.
- Local-only items are uploaded. Cloud-only items appear on this device.
- If the account already deleted an id **later** than the local `updatedAt`, that local copy is not resurrected.
- First-visit **sample** items on this device are ignored when the account already has real games, so seeds cannot overwrite a signed-in shelf.
- After the first merge, edits debounce (~900ms) and `PUT` the full signed-in collection. Deletes write tombstones so another offline device does not bring the item back.

Header shows **Local only** or **Synced**. If this device has real (non-sample) games and you are still a guest, a **Save & sync** prompt appears.

Sign out leaves the local copy in place. It just stops talking to the cloud.

## Environment variables

See `.env.example`. Required for signed-in sync (guest mode does not need them):

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk browser key |
| `CLERK_SECRET_KEY` | Clerk server key |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` | `/` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` | `/` |
| `DATABASE_URL` | Neon Postgres connection string |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob read/write token |

**Do not commit secrets.** Add them on the Vercel project (Production + Preview + Development) or pull with `vercel env pull`.

### One-time hosted setup

1. **Clerk** — [dashboard.clerk.com](https://dashboard.clerk.com) → create an application. Enable **Email** (one-time / magic link) and **Google**. Apple is optional (Clerk → Social connections → Apple). Copy the publishable + secret keys into Vercel. Allowed redirect URLs: `http://localhost:3000`, `https://game-shelf-five.vercel.app`, and `https://*.vercel.app`.
2. **Neon** — Vercel Dashboard → `game-shelf` → Storage → Create Database → Neon (Marketplace). That injects `DATABASE_URL`. Tables are created automatically on the first signed-in sync (`shelf_items`).
3. **Blob** — store `game-shelf-photos` is already created and connected to this project (`BLOB_READ_WRITE_TOKEN`). Nothing else to do unless you recreate the store.

After those three are on the project, redeploy. Then: sign in on phone A, add a disk + photo, refresh phone B on the same account.

## About value estimates

There is **no live PriceCharting feed** in this MVP (that API needs a paid key). Game Shelf uses rounded AUD **placeholders** (typical second-hand ballpark, adjusted for condition/media) and always labels them **approximate**. Never treat cents as live market data.

Override any item’s **Estimated market value (AUD)** when you have a better number from PriceCharting, eBay, Facebook Marketplace, or a shop.

Export **CSV** from the header (desktop) or Browse section (mobile) for a spreadsheet backup. CSV includes a photo count, not the image files.

## Deploy

Already live on Vercel at **https://game-shelf-five.vercel.app** from `main`. Further pushes to `main` auto-deploy.

To reconnect or deploy from scratch: Vercel Dashboard → Add New → Project → import `CHICKgamer9/game-shelf` → Framework Preset **Next.js** → add the env vars above → Deploy.
