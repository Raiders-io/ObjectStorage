export function parsePagination(page: unknown, limit: unknown): { page: number; limit: number } {
  const p = Number.parseInt(String(page ?? 1), 10)
  const l = Number.parseInt(String(limit ?? 10), 10)
  return {
    page: Number.isFinite(p) && p > 0 ? p : 1,
    limit: Number.isFinite(l) ? Math.min(100, Math.max(1, l)) : 10,
  }
}
