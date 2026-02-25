import { useEffect, useMemo, useState } from "react";
import { http } from "../services/http";
import ErrorBoundary from "../components/ErrorBoundary";

type PricingResponse = {
  success: boolean;
  subscriptionPrice?: number;
  earlyAccessDays?: number;
};

export default function ArtistPricingPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [price, setPrice] = useState<string>("0");
  const [earlyAccessDays, setEarlyAccessDays] = useState<number>(7);

  const backgroundStyle = useMemo(() => {
    return {
      backgroundImage:
        "radial-gradient(circle at 30% 10%, rgba(193,117,86,0.12) 0%, rgba(25,18,18,0.55) 45%, rgba(10,8,8,0.92) 100%)"
    } as const;
  }, []);

  const load = async () => {
    const res = await http.get<PricingResponse>("/api/v1/artist/pricing");
    const p = Number(res.data?.subscriptionPrice ?? 0);
    setPrice(p.toFixed(2));
    setEarlyAccessDays(Number(res.data?.earlyAccessDays ?? 7));
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        await load();
      } catch (e: any) {
        setError(e?.response?.data?.message || e?.message || "Failed to load pricing");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    setError(null);

    try {
      const next = Number(price);
      await http.patch("/api/v1/artist/pricing", {
        subscriptionPrice: next
      });
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to save pricing");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ErrorBoundary label="Artist: Pricing">
      <div className="w-full" style={backgroundStyle}>
        <div className="rounded-[10px] border border-white/10 bg-[#141010]/35 backdrop-blur px-7 py-6 shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
          <div className="relative px-4 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
            <div className="text-[28px] font-light tracking-wide text-[#e6d6d2]">Subscription Pricing</div>

            <div className="mt-6 rounded-[10px] border border-white/10 bg-[#0e0a0a]/25 px-8 py-7">
              <div className="flex items-start gap-4">
                <div className="h-[44px] w-[44px] rounded-[10px] bg-[#141010]/70 border border-white/10 flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 1V23" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M17 5H9.5C7.01472 5 5 7.01472 5 9.5C5 11.9853 7.01472 14 9.5 14H14.5C16.9853 14 19 16.0147 19 18.5C19 20.9853 16.9853 23 14.5 23H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="text-[13px] text-[#b8a6a1]">
                    Subscription pricing is managed by platform administrators and set collectively.
                  </div>
                  <div className="mt-2 text-[13px] text-[#b8a6a1]">
                    You can adjust the monthly price to your liking, but the admin controls the early-access duration.
                  </div>
                </div>
              </div>
            </div>

          <div className="mt-8">
            <div className="text-[12px] uppercase tracking-widest text-[#8d7b77]">Monthly Subscription Price</div>
            <div className="mt-3 flex items-center gap-3">
              <div className="text-[20px] text-[#e6d6d2]">$</div>
              <input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-[220px] h-[46px] rounded-[6px] bg-[#0e0a0a]/35 border border-white/10 px-4 text-[16px] text-[#e6d6d2] outline-none focus:border-white/20"
                inputMode="decimal"
              />
              <div className="text-[13px] text-[#8d7b77]">/ month</div>
            </div>

            <div className="mt-4 text-[13px] text-[#b8a6a1]">
              Fans get early access to new content <span className="text-[#e6d6d2]">{earlyAccessDays} days</span> before public release.
            </div>

            {error ? <div className="mt-4 text-[13px] text-[#e3a1a1]">{error}</div> : null}

            <div className="mt-6 flex items-center gap-4">
              <button
                type="button"
                disabled={saving || loading}
                onClick={save}
                className="h-[44px] px-8 rounded-[7px] border border-[#7a3f31]/30 bg-gradient-to-b from-[#6a352c] to-[#3d1e18] text-[14px] font-light tracking-wide text-[#e6d6d2] shadow-[0_10px_25px_rgba(0,0,0,0.35)] disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Pricing"}
              </button>

              <div className="text-[13px] text-[#a99792]">{saved ? "Saved pricing" : ""}</div>
            </div>

            <div className="mt-4 text-[13px] text-[#8d7b77]">
              Your monthly price affects your earnings and how many fans will join.
            </div>
            <div className="mt-1 text-[13px] text-[#8d7b77]">Set it to a price that feels right for your content.</div>
          </div>
        </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
