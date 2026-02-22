import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { http } from "../services/http";

type LoginResponse = {
  success: boolean;
  token?: string;
  pendingApproval?: boolean;
  user?: {
    id: number;
    email: string;
    role?: string;
    isVerified?: boolean;
    status?: string;
  };
  message?: string;
};

function PremiumPlayLogo() {
  return (
    <div className="h-[48px] w-[48px] rounded-full bg-gradient-to-b from-[#7d4a41] to-[#2d1b18] p-[2px]">
      <div className="h-full w-full rounded-full bg-[#1a1414]/80 border border-white/10 flex items-center justify-center">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 7.5V16.5L17 12L9 7.5Z" fill="#b16e5b" />
        </svg>
      </div>
    </div>
  );
}

export default function ArtistLoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const backgroundStyle = useMemo(() => {
    return {
      backgroundImage:
        "radial-gradient(circle at 30% 10%, rgba(193,117,86,0.22) 0%, rgba(30,18,18,0.75) 40%, rgba(10,8,8,0.97) 100%)"
    } as const;
  }, []);

  const onSubmit = async () => {
    setBusy(true);
    setError(null);

    try {
      const res = await http.post<LoginResponse>("/api/v1/fan/auth/login", {
        email,
        password
      });

      if (!res.data?.success) {
        setError(res.data?.message || "Login failed");
        return;
      }

      const token = res.data?.token;
      if (token) localStorage.setItem("artistToken", token);

      const role = (res.data.user?.role || "").toString().toUpperCase();
      const status = (res.data.user?.status || "").toString().toUpperCase();
      const isVerified = Boolean(res.data.user?.isVerified);

      if (role !== "ARTIST") {
        localStorage.removeItem("artistToken");
        setError("Only artist accounts can log in here.");
        return;
      }

       if (status === "SUSPENDED") {
         localStorage.removeItem("artistToken");
         setError("Your artist account has been suspended. Please contact support.");
         return;
       }

      if (!isVerified || res.data?.pendingApproval) {
        navigate("/artist/pending-approval", { replace: true });
        return;
      }

      if (status !== "ACTIVE") {
        localStorage.removeItem("artistToken");
        setError("Your artist account is not active. Please contact support.");
        return;
      }

      navigate("/artist/dashboard", { replace: true });
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Login failed";
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#4b1927] text-white" style={backgroundStyle}>
      <div className="min-h-screen w-full flex items-center justify-center px-6">
        <div className="w-full max-w-[520px]">
          <div className="flex items-center justify-center mb-10">
            <PremiumPlayLogo />
          </div>

          <div className="rounded-[10px] border border-white/10 bg-[#141010]/35 backdrop-blur shadow-[0_30px_80px_rgba(0,0,0,0.55)] px-10 py-10">
            <div className="space-y-6">
              <div>
                <div className="text-[13px] text-[#b8a6a1]">Email</div>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 w-full h-[44px] rounded-[6px] bg-[#0e0a0a]/35 border border-white/10 px-4 text-[14px] text-[#e6d6d2] outline-none focus:border-white/20"
                  placeholder="artist@example.com"
                  autoComplete="email"
                />
              </div>

              <div>
                <div className="text-[13px] text-[#b8a6a1]">Password</div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-2 w-full h-[44px] rounded-[6px] bg-[#0e0a0a]/35 border border-white/10 px-4 text-[14px] text-[#e6d6d2] outline-none focus:border-white/20"
                  placeholder="••••••"
                  autoComplete="current-password"
                />
              </div>

              {error ? (
                <div className="text-[13px] text-[#e3a1a1]">{error}</div>
              ) : null}

              <button
                type="button"
                disabled={busy}
                onClick={onSubmit}
                className="w-full h-[46px] rounded-[7px] border border-[#7a3f31]/30 bg-gradient-to-b from-[#6a352c] to-[#3d1e18] text-[15px] font-light tracking-wide text-[#e6d6d2] shadow-[0_10px_25px_rgba(0,0,0,0.35)] disabled:opacity-60"
              >
                {busy ? "Logging in..." : "Log in"}
              </button>

              <div className="text-center">
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="text-[13px] text-[#a99792] hover:text-[#e6d6d2]"
                >
                  Contact support ›
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
