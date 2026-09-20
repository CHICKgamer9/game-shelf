export function normalizePhotoUrls(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const next: Record<string, string> = {};
  for (const [id, url] of Object.entries(value as Record<string, unknown>)) {
    if (!id || typeof url !== "string") continue;
    const trimmed = url.trim();
    if (trimmed) next[id] = trimmed;
  }
  return next;
}

export function pickPhotoUrls(
  urls: Record<string, string> | undefined,
  photoIds: string[],
): Record<string, string> {
  const source = urls ?? {};
  const next: Record<string, string> = {};
  for (const id of photoIds) {
    if (source[id]) next[id] = source[id];
  }
  return next;
}

export function mergePhotoUrlMaps(
  older: Record<string, string> | undefined,
  newer: Record<string, string> | undefined,
): Record<string, string> {
  return { ...(older ?? {}), ...(newer ?? {}) };
}
