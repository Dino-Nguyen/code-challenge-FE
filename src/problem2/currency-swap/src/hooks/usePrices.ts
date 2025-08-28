import { useEffect, useMemo, useState } from "react";

export type PricesMap = Record<string, number>;

type PriceRow = {
  currency: string;
  date?: string;   
  price: number;
};


function normalizePrices(raw: unknown): PricesMap {
  if (Array.isArray(raw)) {
    const best: Record<
      string,
      { price: number; ts: number }
    > = {};

    for (const item of raw as PriceRow[]) {
      const symbol = (item as any)?.currency;
      const price = Number((item as any)?.price);
      const ts = Date.parse((item as any)?.date ?? "");

      if (typeof symbol !== "string") continue;
      if (!Number.isFinite(price) || price <= 0) continue;

      const prev = best[symbol];
      const curTs = Number.isFinite(ts) ? ts : -Infinity;

      if (!prev || curTs > prev.ts) {
        best[symbol] = { price, ts: curTs };
      }
    }

    return Object.fromEntries(
      Object.entries(best).map(([k, v]) => [k, v.price])
    );
  }
  return {};
}

export function usePrices() {
  const [prices, setPrices] = useState<PricesMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("https://interview.switcheo.com/prices.json", {
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const raw = await res.json(); 
        if (!mounted) return;

        const normalized = normalizePrices(raw);
        setPrices(normalized);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message ?? "Failed to load prices");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const tokens = useMemo(() => Object.keys(prices).sort(), [prices]);

  return { prices, tokens, loading, error };
}
