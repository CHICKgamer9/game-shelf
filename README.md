# Game Shelf

Track video game disks, consoles, and accessories. Approximate collection value in **AUD**. Guest-first: everything stays in this browser (`localStorage`). No account required.

Repo: https://github.com/CHICKgamer9/game-shelf

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Useful scripts:

```bash
npm test      # totals + estimate helpers
npm run lint
npm run build
```

## Add your first real games

1. Open Game Shelf (local or the live Vercel URL).
2. The first visit seeds a few **Xbox One sample** disks (and a console) so you can see totals. They are marked **Sample**.
3. Tap **Remove samples** on the home shelf, or open each sample and **Delete**.
4. Tap **Add disk**. Title, condition, and purchase price are the important fields. Platform defaults to Xbox One / physical disk / CIB.
5. Save. Home totals update immediately (estimated value, cost basis, gain/loss when both are known).
6. Optional: paste a cover-art URL, barcode, region, edition (GOTY, steelbook…), or a manual market-value override.

Hardware (Xbox One, controllers, Kinect) lives in the same catalog — set **Kind** to Hardware.

Wishlist items stay on the shelf but are excluded from value totals.

## About value estimates

There is **no live PriceCharting feed** in this MVP (that API needs a paid key). Game Shelf uses rounded AUD **placeholders** (typical second-hand ballpark, adjusted for condition/media) and always labels them **approximate**. Never treat cents as live market data.

Override any item’s **Estimated market value (AUD)** when you have a better number from PriceCharting, eBay, Facebook Marketplace, or a shop.

Export **CSV** from the header (desktop) or Browse section (mobile) for a spreadsheet backup.

## Deploy

This app is meant to ship on **Vercel** from the `main` branch of this GitHub repo. If the project is already linked, a push to `main` auto-deploys.

If you still need to connect it: Vercel Dashboard → Add New → Project → import `CHICKgamer9/game-shelf` → Framework Preset **Next.js** → Deploy.
