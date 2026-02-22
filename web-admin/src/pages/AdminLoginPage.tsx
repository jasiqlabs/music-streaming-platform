import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { http } from "../services/http";

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M2 12C2 12 5.5 5 12 5C18.5 5 22 12 22 12C22 12 18.5 19 12 19C5.5 19 2 12 2 12Z"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>
    );
  }

  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M3 3L21 21"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M10.4 10.4C10.1 10.7 9.9 11.3 9.9 12C9.9 13.7 11.3 15.1 13 15.1C13.7 15.1 14.3 14.9 14.6 14.6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M6.5 6.5C4.3 8 2.8 10.5 2 12C2 12 5.5 19 12 19C13.8 19 15.4 18.5 16.8 17.8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M9.3 5.3C10.1 5.1 11 5 12 5C18.5 5 22 12 22 12C22 12 20.8 14.8 18.6 16.8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function AdminLoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const backgroundStyle = useMemo(() => {
    return {
      backgroundImage: "url(/image_3e012a.jpg)",
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat"
    } as const;
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await http.post("/api/v1/admin/login", {
        email,
        password
      });

      const token = res.data?.token as string | undefined;
      if (!token) {
        setError("Login failed");
        return;
      }

      localStorage.setItem("adminToken", token);
      navigate("/admin/home");
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 403) setError("Forbidden");
      else setError(err?.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#0a0808]">
      <div
        className="absolute inset-0 grayscale opacity-40"
        style={backgroundStyle}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(#4b1927)_0%,rgba(75, 25, 39)_45%,
343, 50, 20_100%)]" />

      <div className="relative min-h-screen flex items-center justify-center px-6">
        <div className="w-full max-w-[560px]">
          <div className="flex flex-col items-center">
            <div className="mt-2 mb-6">
              <div className="h-[72px] w-[72px] rounded-full bg-gradient-to-b from-[#7d4a41] to-[#2d1b18] p-[2px]">
                <div className="h-full w-full rounded-full bg-[#1a1414] border border-white/5 flex items-center justify-center">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M9 7.5V16.5L17 12L9 7.5Z" fill="#b16e5b" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="mb-8 text-[34px] leading-[40px] font-light tracking-[2px] text-[#c49a8e]">
              Admin Login
            </div>

            <form onSubmit={onSubmit} className="w-full max-w-[520px]">
              <div className="mb-2 text-[11px] uppercase tracking-widest text-[#665552]">
                Email
              </div>
              <div className="mb-6">
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  type="email"
                  className="w-full h-[52px] rounded-[3px] bg-[#161212]/80 border border-white/10 px-5 text-[16px] text-[#d3c2be] placeholder:text-[#3d3432] outline-none focus:border-white/20"
                  autoComplete="email"
                />
              </div>

              <div className="mb-2 text-[11px] uppercase tracking-widest text-[#665552]">
                Password
              </div>
              <div className="mb-7 relative">
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                  type={showPassword ? "text" : "password"}
                  className="w-full h-[52px] rounded-[3px] bg-[#161212]/80 border border-white/10 pl-5 pr-12 text-[16px] text-[#d3c2be] placeholder:text-[#3d3432] outline-none focus:border-white/20"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6e5c59] hover:text-[#d3c2be]"
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-[56px] rounded-[4px] text-[18px] font-light text-[#cfa99f] border border-[#7a3f31]/30 bg-gradient-to-b from-[#6a352c] to-[#3d1e18] shadow-[0_10px_30px_rgba(0,0,0,0.5)] disabled:opacity-70"
              >
                {loading ? "Logging in..." : "Log in"}
              </button>

              <div className="h-5 mt-4 text-center text-[12px] tracking-wide text-[#665552]">
                {error ? error : ""}
              </div>

              <div className="mt-6 text-center text-[11px] uppercase tracking-[3px] text-[#4d3d3a]">
                Authorized access only
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}