import { useEffect, useMemo, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { http } from "../services/http";

type MeResponse = {
  success: boolean;
  artist?: {
    id: number;
    name: string | null;
    email: string;
    isVerified: boolean;
    status: string;
    profileImageUrl: string | null;
    accentColor: string | null;
  };
};

function PremiumPlayLogo() {
  return (
    <div className="h-[44px] w-[44px] rounded-full bg-gradient-to-b from-[#7d4a41] to-[#2d1b18] p-[2px]">
      <div className="h-full w-full rounded-full bg-[#1a1414]/80 border border-white/10 flex items-center justify-center">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 7.5V16.5L17 12L9 7.5Z" fill="#b16e5b" />
        </svg>
      </div>
    </div>
  );
}

export default function ArtistShell() {
  const navigate = useNavigate();
  const location = useLocation();

  const [menuOpen, setMenuOpen] = useState(false);
  const [me, setMe] = useState<MeResponse["artist"] | null>(null);

  const backgroundStyle = useMemo(() => {
    return {
      backgroundImage:
        "radial-gradient(circle at 30% 10%, rgba(193,117,86,0.16) 0%, rgba(75,25,39,0.88) 55%, rgba(10,8,8,0.97) 100%)"
    } as const;
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await http.get<MeResponse>("/api/v1/artist/me");
        if (!mounted) return;

        const artist = res.data?.artist ?? null;
        setMe(artist);

        const status = (artist?.status || "").toUpperCase();
        if (status && status !== "ACTIVE") {
          localStorage.removeItem("artistToken");
          navigate("/artist/login", { replace: true });
          return;
        }

        if (artist && !artist.isVerified) {
          navigate("/artist/pending-approval", { replace: true });
          return;
        }
      } catch (e: any) {
        const status = e?.response?.status;
        if (status === 401 || status === 403) {
          localStorage.removeItem("artistToken");
          navigate("/artist/login", { replace: true });
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [navigate, location.pathname]);

  const activePath = location.pathname;

  return (
    <div className="min-h-screen w-full bg-[#0a0808] text-white" style={backgroundStyle}>
      <div className="mx-auto w-full max-w-[1100px] px-6 py-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <PremiumPlayLogo />

            <Link
              to="/artist/dashboard"
              className={`text-[13px] ${activePath.includes("/artist/dashboard") ? "text-white" : "text-[#b8a6a1] hover:text-white"}`}
            >
              Dashboard
            </Link>
            <Link
              to="/artist/account"
              className={`text-[13px] ${activePath.includes("/artist/account") ? "text-white" : "text-[#b8a6a1] hover:text-white"}`}
            >
              Account
            </Link>
            <Link
              to="/artist/pricing"
              className={`text-[13px] ${activePath.includes("/artist/pricing") ? "text-white" : "text-[#b8a6a1] hover:text-white"}`}
            >
              Pricing
            </Link>
            <Link
              to="/artist/analytics-summary"
              className={`text-[13px] ${activePath.includes("/artist/analytics-summary") ? "text-white" : "text-[#b8a6a1] hover:text-white"}`}
            >
              Analytics
            </Link>
            <Link
              to="/artist/channel-preview"
              className={`text-[13px] ${activePath.includes("/artist/channel-preview") ? "text-white" : "text-[#b8a6a1] hover:text-white"}`}
            >
              Channel Preview
            </Link>
            <Link
              to="/artist/content-upload"
              className={`text-[13px] ${activePath.includes("/artist/content-upload") ? "text-white" : "text-[#b8a6a1] hover:text-white"}`}
            >
              Content Upload
            </Link>
            <Link
              to="/artist/content-history"
              className={`text-[13px] ${activePath.includes("/artist/content-history") ? "text-white" : "text-[#b8a6a1] hover:text-white"}`}
            >
              Content History
            </Link>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 text-[13px] text-[#d8c7c3] hover:text-white"
            >
              <div className="h-[26px] w-[26px] rounded-full overflow-hidden border border-white/10 bg-[#141010]/70">
                {me?.profileImageUrl ? (
                  <img src={me.profileImageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-gradient-to-b from-[#2a1a17] to-[#0e0a0a]" />
                )}
              </div>
              <span className="max-w-[160px] truncate">{me?.name || me?.email || "Account"}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {menuOpen ? (
              <div className="absolute right-0 mt-3 w-[200px] rounded-[6px] border border-white/10 bg-[#141010]/90 backdrop-blur px-2 py-2 shadow-[0_18px_40px_rgba(0,0,0,0.55)]">
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 text-[13px] text-[#d8c7c3] hover:bg-white/5 rounded-[4px]"
                  onClick={() => {
                    setMenuOpen(false);
                    navigate("/artist/account");
                  }}
                >
                  Account settings
                </button>

                <button
                  type="button"
                  className="w-full text-left px-3 py-2 text-[13px] text-[#d8c7c3] hover:bg-white/5 rounded-[4px]"
                  onClick={() => {
                    localStorage.removeItem("artistToken");
                    navigate("/artist/login", { replace: true });
                  }}
                >
                  Logout
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
