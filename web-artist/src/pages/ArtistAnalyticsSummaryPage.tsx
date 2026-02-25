import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { http } from "../services/http";

type ContentPerformanceResponse = {
  success: boolean;
  days?: number;
  items?: Array<{
    contentId: number;
    title: string;
    thumbnailUrl: string | null;
    plays: number;
  }>;
};

type AnalyticsSummaryResponse = {
  success: boolean;
  last30Days?: {
    grossEarnings: number;
  };
};

type GrowthResponse = {
  success: boolean;
  data?: Array<{ date: string; value: number }>;
};

type PricingResponse = {
  success: boolean;
  subscriptionPrice?: number;
  earlyAccessDays?: number;
};

export default function ArtistAnalyticsSummaryPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [performance, setPerformance] = useState<ContentPerformanceResponse["items"]>([]);
  const [grossEarnings, setGrossEarnings] = useState<number>(0);
  const [growth, setGrowth] = useState<Array<{ date: string; value: number }>>([]);

  const [price, setPrice] = useState<string>("0.00");
  const [earlyAccessDays, setEarlyAccessDays] = useState<number>(7);
  const [savingPrice, setSavingPrice] = useState(false);
  const [savedPrice, setSavedPrice] = useState(false);

  const backgroundStyle = useMemo(() => {
    return {
      backgroundImage:
        "radial-gradient(circle at 35% 15%, rgba(193,117,86,0.14) 0%, rgba(25,18,18,0.58) 48%, rgba(10,8,8,0.92) 100%)"
    } as const;
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);

        const [perfRes, summaryRes, growthRes, pricingRes] = await Promise.all([
          http.get<ContentPerformanceResponse>("/api/v1/artist/analytics/content-performance?days=30"),
          http.get<AnalyticsSummaryResponse>("/api/v1/artist/analytics/summary"),
          http.get<GrowthResponse>("/api/v1/artist/dashboard/growth?days=30"),
          http.get<PricingResponse>("/api/v1/artist/pricing")
        ]);

        if (!mounted) return;

        setPerformance(Array.isArray(perfRes.data?.items) ? perfRes.data.items : []);
        setGrossEarnings(Number(summaryRes.data?.last30Days?.grossEarnings ?? 0));
        setGrowth(Array.isArray(growthRes.data?.data) ? growthRes.data.data : []);

        const p = Number(pricingRes.data?.subscriptionPrice ?? 0);
        setPrice(p.toFixed(2));
        setEarlyAccessDays(Number(pricingRes.data?.earlyAccessDays ?? 7));
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.response?.data?.message || e?.message || "Failed to load analytics");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const formatCompact = (n: number) => {
    const v = Number(n);
    if (!Number.isFinite(v)) return "0";
    return v.toLocaleString();
  };

  const formatCurrency = (amount: number) => {
    const v = Number(amount);
    if (!Number.isFinite(v)) return "$0.00";
    return v.toLocaleString(undefined, {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const growthChartData = growth.map((p) => ({
    name: p.date.slice(5),
    value: p.value
  }));

  const perfChartData = (performance ?? []).map((p) => ({
    name: p.title,
    plays: Number(p.plays ?? 0)
  }));

  const savePricing = async () => {
    setSavingPrice(true);
    setSavedPrice(false);
    setError(null);

    try {
      const next = Number(price);
      await http.patch("/api/v1/artist/pricing", {
        subscriptionPrice: next
      });
      setSavedPrice(true);
      window.setTimeout(() => setSavedPrice(false), 2500);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to save pricing");
    } finally {
      setSavingPrice(false);
    }
  };

  return (
    <div
      className="relative overflow-hidden rounded-[10px] border border-white/10 bg-[#141010]/35 backdrop-blur shadow-[0_30px_80px_rgba(0,0,0,0.55)]"
      style={backgroundStyle}
    >
      <div className="relative px-4 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
        <div className="text-[28px] font-light tracking-wide text-[#e6d6d2]">Analytics Summary</div>

        {error ? <div className="mt-4 text-[13px] text-[#e3a1a1]">{error}</div> : null}

        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-[10px] border border-white/10 bg-[#0e0a0a]/22 px-7 py-6">
            <div className="flex items-center justify-between">
              <div className="text-[14px] tracking-wide text-[#e6d6d2]">Plays per content</div>
              <div className="h-[28px] px-3 rounded-[6px] border border-white/10 bg-[#141010]/60 text-[12px] text-[#cdbdb8] flex items-center">
                Last 30 days
              </div>
            </div>

            <div className="mt-5 h-[260px]">
              {loading ? (
                <div className="h-full flex items-center justify-center text-[13px] text-[#b8a6a1]">Loading…</div>
              ) : perfChartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-[13px] text-[#b8a6a1]">No play data yet.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={perfChartData} margin={{ left: 6, right: 14, top: 12, bottom: 10 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: "rgba(230,214,210,0.6)", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      interval={0}
                      angle={0}
                      height={55}
                    />
                    <YAxis tick={{ fill: "rgba(230,214,210,0.6)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        background: "rgba(20,16,16,0.95)",
                        border: "1px solid rgba(255,255,255,0.10)",
                        borderRadius: 8
                      }}
                      labelStyle={{ color: "rgba(230,214,210,0.8)" }}
                      formatter={(value: any) => [formatCompact(Number(value)), "Plays"]}
                    />
                    <Bar dataKey="plays" fill="#c97a54" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="rounded-[10px] border border-white/10 bg-[#0e0a0a]/22 px-7 py-6">
            <div className="text-[14px] tracking-wide text-[#e6d6d2]">Gross Earnings</div>
            <div className="mt-4 text-[34px] font-light tracking-wide text-[#e6d6d2]">
              {loading ? "—" : formatCurrency(grossEarnings)}
            </div>
            <div className="mt-2 text-[12px] text-[#8d7b77]">Last 30 days</div>

            <div className="mt-8 text-[14px] tracking-wide text-[#e6d6d2]">Subscriber Growth</div>
            <div className="mt-3 h-[150px]">
              {loading ? (
                <div className="h-full flex items-center justify-center text-[13px] text-[#b8a6a1]">Loading…</div>
              ) : growthChartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-[13px] text-[#b8a6a1]">No subscriber data yet.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={growthChartData} margin={{ left: 0, right: 6, top: 10, bottom: 0 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: "rgba(230,214,210,0.6)", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{
                        background: "rgba(20,16,16,0.95)",
                        border: "1px solid rgba(255,255,255,0.10)",
                        borderRadius: 8
                      }}
                      labelStyle={{ color: "rgba(230,214,210,0.8)" }}
                    />
                    <Line type="monotone" dataKey="value" stroke="#c97a54" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-[10px] border border-white/10 bg-[#0e0a0a]/22 px-7 py-6">
          <div className="text-[14px] tracking-wide text-[#e6d6d2]">Subscriber Growth</div>

          <div className="mt-4 flex items-baseline gap-2">
            <div className="text-[28px] font-light tracking-wide text-[#e6d6d2]">${price}</div>
            <div className="text-[13px] text-[#8d7b77]">/ month</div>
          </div>

          <div className="mt-4 text-[13px] text-[#b8a6a1]">
            Fans get early access to new content <span className="text-[#e6d6d2]">{earlyAccessDays} days</span> before public release.
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="text-[12px] uppercase tracking-widest text-[#8d7b77]">Price</div>
              <div className="flex items-center gap-2">
                <div className="text-[16px] text-[#e6d6d2]">$</div>
                <input
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-[160px] h-[42px] rounded-[6px] bg-[#0e0a0a]/35 border border-white/10 px-4 text-[14px] text-[#e6d6d2] outline-none focus:border-white/20"
                  inputMode="decimal"
                />
                <div className="text-[13px] text-[#8d7b77]">/ month</div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                type="button"
                disabled={savingPrice || loading}
                onClick={savePricing}
                className="h-[42px] px-8 rounded-[7px] border border-[#7a3f31]/30 bg-gradient-to-b from-[#6a352c] to-[#3d1e18] text-[14px] font-light tracking-wide text-[#e6d6d2] shadow-[0_10px_25px_rgba(0,0,0,0.35)] disabled:opacity-60"
              >
                {savingPrice ? "Saving…" : "Save Pricing"}
              </button>
              <div className="text-[13px] text-[#a99792]">{savedPrice ? "Saved pricing" : ""}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
