import { initials } from "@/lib/format";
import type { CollectionItem, Platform } from "@/lib/types";

const PLATFORM_TONE: Record<Platform, string> = {
  "xbox-one": "from-lime-800 to-emerald-950",
  "xbox-360": "from-green-800 to-slate-950",
  "xbox-series": "from-emerald-700 to-zinc-950",
  ps4: "from-blue-800 to-slate-950",
  ps5: "from-sky-800 to-zinc-950",
  switch: "from-red-800 to-zinc-950",
  pc: "from-violet-800 to-zinc-950",
  other: "from-amber-800 to-stone-950",
};

export function CoverArt({
  item,
  className = "",
}: {
  item: Pick<CollectionItem, "title" | "coverArtUrl" | "platform" | "itemKind">;
  className?: string;
}) {
  if (item.coverArtUrl.trim()) {
    return (
      // User-supplied URL; regular img avoids remote-pattern config.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={item.coverArtUrl.trim()}
        alt=""
        className={`h-full w-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`flex h-full w-full flex-col justify-between bg-gradient-to-br p-2 text-white ${PLATFORM_TONE[item.platform]} ${className}`}
      aria-hidden="true"
    >
      <span className="text-[10px] font-medium uppercase tracking-[0.18em] opacity-70">
        {item.itemKind === "hardware" ? "HW" : "Disk"}
      </span>
      <span className="font-[family-name:var(--font-display)] text-2xl leading-none">
        {initials(item.title)}
      </span>
    </div>
  );
}
