import { useEffect, useMemo, useState } from "react";
import { http } from "../services/http";

type MeResponse = {
  success: boolean;
  artist?: {
    id: number;
    email: string;
    name: string | null;
    profileImageUrl: string | null;
    bannerImageUrl: string | null;
    bio: string;
    accentColor: string | null;
  };
};

const ACCENTS = ["#6b4bb8", "#5b6bb8", "#4b87b8", "#5bb88b", "#b8b25b", "#b8744b", "#b85b5b", "#d48a3c"];

export default function ArtistAccountPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [bannerImageUrl, setBannerImageUrl] = useState<string | null>(null);
  const [accentColor, setAccentColor] = useState<string | null>(null);

  const backgroundStyle = useMemo(() => {
    return {
      backgroundImage:
        "radial-gradient(circle at 30% 10%, rgba(193,117,86,0.12) 0%, rgba(25,18,18,0.55) 45%, rgba(10,8,8,0.92) 100%)"
    } as const;
  }, []);

  const load = async () => {
    const res = await http.get<MeResponse>("/api/v1/artist/me");
    const a = res.data?.artist;
    if (!a) return;
    setName(a.name ?? "");
    setBio(a.bio ?? "");
    setProfileImageUrl(a.profileImageUrl ?? null);
    setBannerImageUrl(a.bannerImageUrl ?? null);
    setAccentColor(a.accentColor ?? null);
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        await load();
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
    try {
      await http.patch("/api/v1/artist/me", {
        name,
        bio,
        profileImageUrl,
        bannerImageUrl,
        accentColor
      });
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-[10px] border border-white/10 bg-[#141010]/30 backdrop-blur shadow-[0_30px_80px_rgba(0,0,0,0.55)]" style={backgroundStyle}>
      <div className="absolute inset-0 opacity-60" />

      <div className="relative">
        <div className="px-10 py-10">
          <div className="text-[28px] font-light tracking-wide text-[#e6d6d2]">Account Settings</div>
          <div className="mt-2 text-[13px] text-[#b8a6a1]">Manage your public profile and artist theme accent.</div>

          <div className="mt-8 rounded-[10px] border border-white/10 bg-[#0e0a0a]/35 overflow-hidden">
            <div className="h-[220px] bg-[#0a0808]">
              {bannerImageUrl ? (
                <img src={bannerImageUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-gradient-to-b from-[#241a1a] to-[#0a0808]" />
              )}
            </div>

            <div className="px-8 pb-8">
              <div className="-mt-10 flex items-end gap-5">
                <div className="h-[84px] w-[84px] rounded-[14px] overflow-hidden border border-white/10 bg-[#141010] shadow-[0_14px_30px_rgba(0,0,0,0.55)]">
                  {profileImageUrl ? (
                    <img src={profileImageUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-b from-[#2a1a17] to-[#0e0a0a]" />
                  )}
                </div>

                <div className="flex-1" />

                <div className="text-[12px] text-[#8d7b77]">
                  {loading ? "Loading..." : ""}
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-5">
                <div>
                  <div className="text-[12px] uppercase tracking-widest text-[#8d7b77]">Display name</div>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-2 w-full h-[46px] rounded-[6px] bg-[#0e0a0a]/35 border border-white/10 px-4 text-[14px] text-[#e6d6d2] outline-none focus:border-white/20"
                    placeholder="Luna Ray"
                  />
                </div>

                <div>
                  <div className="text-[12px] uppercase tracking-widest text-[#8d7b77]">Bio</div>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    className="mt-2 w-full rounded-[6px] bg-[#0e0a0a]/35 border border-white/10 px-4 py-3 text-[14px] text-[#e6d6d2] outline-none focus:border-white/20"
                    placeholder="Describe your music..."
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <div className="text-[12px] uppercase tracking-widest text-[#8d7b77]">Profile image URL</div>
                    <input
                      value={profileImageUrl ?? ""}
                      onChange={(e) => setProfileImageUrl(e.target.value || null)}
                      className="mt-2 w-full h-[46px] rounded-[6px] bg-[#0e0a0a]/35 border border-white/10 px-4 text-[14px] text-[#e6d6d2] outline-none focus:border-white/20"
                      placeholder="https://..."
                    />
                  </div>

                  <div>
                    <div className="text-[12px] uppercase tracking-widest text-[#8d7b77]">Banner image URL</div>
                    <input
                      value={bannerImageUrl ?? ""}
                      onChange={(e) => setBannerImageUrl(e.target.value || null)}
                      className="mt-2 w-full h-[46px] rounded-[6px] bg-[#0e0a0a]/35 border border-white/10 px-4 text-[14px] text-[#e6d6d2] outline-none focus:border-white/20"
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div>
                  <div className="text-[12px] uppercase tracking-widest text-[#8d7b77]">Accent color</div>
                  <div className="mt-3 flex items-center gap-3 flex-wrap">
                    {ACCENTS.map((c) => {
                      const active = (accentColor || "").toLowerCase() === c.toLowerCase();
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setAccentColor(c)}
                          className={`h-[16px] w-[16px] rounded-full border ${active ? "border-white/60" : "border-white/10"}`}
                          style={{ backgroundColor: c }}
                          aria-label={`Set accent ${c}`}
                        />
                      );
                    })}
                  </div>
                </div>

                <div className="mt-2 flex items-center gap-5">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={save}
                    className="h-[46px] px-8 rounded-[7px] border border-[#7a3f31]/30 bg-gradient-to-b from-[#6a352c] to-[#3d1e18] text-[15px] font-light tracking-wide text-[#e6d6d2] shadow-[0_10px_25px_rgba(0,0,0,0.35)] disabled:opacity-60"
                  >
                    {saving ? "Saving..." : "Save changes"}
                  </button>

                  <div className="text-[13px] text-[#a99792]">{saved ? "Saved changes" : ""}</div>

                  <div className="ml-auto text-[12px] text-[#5f524f]">{loading ? "" : ""}</div>

                  <div className="text-[13px] text-[#6e8f72]">{saved ? "✓ Saved changes" : ""}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
