export function toNumber(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") return Number(v);
  // Prisma Decimal
  // @ts-ignore
  if (v && typeof v === "object" && typeof v.toNumber === "function") return v.toNumber();
  return Number(v);
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
