import { useEffect, useMemo, useRef, useState } from "react";
import { http } from "../services/http";

type UploadResponse = {
  success: boolean;
  item?: {
    id: number;
  };
  message?: string;
  correlationId?: string;
};

type UploadType = "AUDIO" | "VIDEO";

type UploadFormState = {
  title: string;
  genre: string;
  thumbnailFile: File | null;
  mediaFile: File | null;
};

const GENRES = [
  "Pop",
  "Hip-Hop",
  "Rock",
  "R&B",
  "Electronic",
  "Jazz",
  "Classical",
  "Country",
  "Indie",
  "Other"
];

function buildObjectUrl(file: File | null) {
  if (!file) return null;
  try {
    return URL.createObjectURL(file);
  } catch {
    return null;
  }
}

function UploadSection({
  type,
  value,
  onChange,
  onPost,
  onError,
  busy
}: {
  type: UploadType;
  value: UploadFormState;
  onChange: (next: UploadFormState) => void;
  onPost: () => void;
  onError: (message: string | null) => void;
  busy: boolean;
}) {
  const thumbnailPreviewUrl = useMemo(() => buildObjectUrl(value.thumbnailFile), [value.thumbnailFile]);
  const mediaPreviewUrl = useMemo(() => buildObjectUrl(value.mediaFile), [value.mediaFile]);

  const thumbnailInputRef = useRef<HTMLInputElement | null>(null);
  const mediaInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      if (thumbnailPreviewUrl) URL.revokeObjectURL(thumbnailPreviewUrl);
      if (mediaPreviewUrl) URL.revokeObjectURL(mediaPreviewUrl);
    };
  }, [thumbnailPreviewUrl, mediaPreviewUrl]);

  const headerLabel = type === "AUDIO" ? "Audio Upload" : "Video Upload";
  const acceptMedia = type === "AUDIO" ? ".mp3,.wav,.m4a" : ".mp4,.mov,.mkv";

  const validateMediaFile = (file: File) => {
    const name = (file?.name || "").toLowerCase();
    const ext = name.includes(".") ? name.slice(name.lastIndexOf(".")) : "";

    if (type === "AUDIO") {
      return ext === ".mp3" || ext === ".wav" || ext === ".m4a";
    }
    return ext === ".mp4" || ext === ".mov" || ext === ".mkv";
  };

  const setMediaFile = (file: File | null) => {
    onError(null);
    if (!file) {
      onChange({ ...value, mediaFile: null });
      return;
    }
    if (!validateMediaFile(file)) {
      onError(
        type === "AUDIO"
          ? "Invalid audio file type. Please select .mp3, .wav, or .m4a."
          : "Invalid video file type. Please select .mp4, .mov, or .mkv."
      );
      if (mediaInputRef.current) mediaInputRef.current.value = "";
      return;
    }
    onChange({ ...value, mediaFile: file });
  };

  const setThumbnailFile = (file: File | null) => {
    onError(null);
    onChange({ ...value, thumbnailFile: file });
  };

  const onPasteZone = (e: React.ClipboardEvent<HTMLDivElement>, kind: "THUMBNAIL" | "MEDIA") => {
    const files = Array.from(e.clipboardData?.files ?? []);
    if (!files.length) return;
    e.preventDefault();

    const f = files[0];
    if (kind === "THUMBNAIL") {
      if (!f.type.startsWith("image/")) {
        onError("Pasted file is not an image.");
        return;
      }
      setThumbnailFile(f);
      return;
    }

    setMediaFile(f);
  };

  const onDropZone = (e: React.DragEvent<HTMLDivElement>, kind: "THUMBNAIL" | "MEDIA") => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer?.files ?? []);
    if (!files.length) return;
    const f = files[0];

    if (kind === "THUMBNAIL") {
      if (!f.type.startsWith("image/")) {
        onError("Dropped file is not an image.");
        return;
      }
      setThumbnailFile(f);
      return;
    }

    setMediaFile(f);
  };

  return (
    <div className="rounded-[10px] border border-white/10 bg-[#0e0a0a]/22 overflow-hidden">
      <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
        <div>
          <div className="text-[15px] tracking-wide text-[#e6d6d2]">{headerLabel}</div>
          <div className="mt-1 text-[12px] text-[#b8a6a1]">Fill out details, preview locally, then post for admin review.</div>
        </div>
        <div className="text-[11px] rounded-[999px] border border-amber-500/25 bg-amber-500/10 text-amber-200 px-2.5 py-1">
          Pending until approved
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-[12px] uppercase tracking-widest text-[#b8a6a1]">Title</label>
            <input
              value={value.title}
              onChange={(e) => onChange({ ...value, title: e.target.value })}
              className="mt-2 w-full h-[42px] rounded-[8px] border border-white/10 bg-[#141010]/55 px-3 text-[13px] text-[#f0e5e2] outline-none focus:border-white/20"
              placeholder={type === "AUDIO" ? "Track title" : "Video title"}
            />
          </div>

          <div>
            <label className="block text-[12px] uppercase tracking-widest text-[#b8a6a1]">Genre</label>
            <select
              value={value.genre}
              onChange={(e) => onChange({ ...value, genre: e.target.value })}
              className="mt-2 w-full h-[42px] rounded-[8px] border border-white/10 bg-[#141010]/55 px-3 text-[13px] text-[#f0e5e2] outline-none focus:border-white/20"
            >
              <option value="" disabled>
                Select genre
              </option>
              {GENRES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[12px] uppercase tracking-widest text-[#b8a6a1]">Thumbnail (Image)</label>
            <div
              tabIndex={0}
              onPaste={(e) => onPasteZone(e, "THUMBNAIL")}
              onDragOver={(e) => {
                e.preventDefault();
              }}
              onDrop={(e) => onDropZone(e, "THUMBNAIL")}
              className="mt-2 rounded-[10px] border border-white/10 bg-[#141010]/35 p-3"
            >
              <div className="flex items-center gap-3">
                <input
                  ref={thumbnailInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    setThumbnailFile(f);
                  }}
                />
                <button
                  type="button"
                  onClick={() => thumbnailInputRef.current?.click()}
                  className="h-[32px] rounded-[6px] border border-white/10 bg-[#141010]/60 px-3 text-[12px] font-light tracking-wide text-[#e6d6d2] hover:bg-white/5"
                >
                  Choose file
                </button>
                <div className="min-w-0 text-[12px] text-[#d8c7c3] truncate">
                  {value.thumbnailFile?.name || "No file chosen"}
                </div>
              </div>
              <div className="mt-2 text-[11px] text-[#8d7b77]">
                Drag & drop an image here, or paste an image from clipboard.
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[12px] uppercase tracking-widest text-[#b8a6a1]">
              {type === "AUDIO" ? "Audio File (MP3)" : "Video File (MP4)"}
            </label>
            <div
              tabIndex={0}
              onPaste={(e) => onPasteZone(e, "MEDIA")}
              onDragOver={(e) => {
                e.preventDefault();
              }}
              onDrop={(e) => onDropZone(e, "MEDIA")}
              className="mt-2 rounded-[10px] border border-white/10 bg-[#141010]/35 p-3"
            >
              <div className="flex items-center gap-3">
                <input
                  ref={mediaInputRef}
                  type="file"
                  accept={acceptMedia}
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    setMediaFile(f);
                  }}
                />
                <button
                  type="button"
                  onClick={() => mediaInputRef.current?.click()}
                  className="h-[32px] rounded-[6px] border border-white/10 bg-[#141010]/60 px-3 text-[12px] font-light tracking-wide text-[#e6d6d2] hover:bg-white/5"
                >
                  Choose file
                </button>
                <div className="min-w-0 text-[12px] text-[#d8c7c3] truncate">
                  {value.mediaFile?.name || "No file chosen"}
                </div>
              </div>
              <div className="mt-2 text-[11px] text-[#8d7b77]">
                Drag & drop {type === "AUDIO" ? "an audio" : "a video"} file here, or paste a file from clipboard.
              </div>
            </div>
          </div>

          <button
            type="button"
            disabled={busy}
            onClick={onPost}
            className="mt-2 h-[40px] rounded-[8px] border border-[#7a3f31]/30 bg-gradient-to-b from-[#6a352c] to-[#3d1e18] px-4 text-[13px] font-light tracking-wide text-[#e6d6d2] shadow-[0_10px_25px_rgba(0,0,0,0.25)] disabled:opacity-60"
          >
            {busy ? "Posting..." : "Post Content"}
          </button>
        </div>

        <div className="space-y-4">
          <div className="rounded-[10px] border border-white/10 bg-[#141010]/35 p-4">
            <div className="text-[12px] uppercase tracking-widest text-[#b8a6a1]">Real-time preview</div>

            <div className="mt-4 grid grid-cols-1 gap-4">
              <div className="rounded-[10px] border border-white/10 bg-[#0e0a0a]/40 overflow-hidden">
                <div className="px-3 py-2 border-b border-white/10 text-[12px] text-[#cdbdb8]">Thumbnail</div>
                <div className="h-[180px] bg-[#0a0808] flex items-center justify-center">
                  {thumbnailPreviewUrl ? (
                    <img src={thumbnailPreviewUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="text-[12px] text-[#8d7b77]">Select an image to preview</div>
                  )}
                </div>
              </div>

              <div className="rounded-[10px] border border-white/10 bg-[#0e0a0a]/40 overflow-hidden">
                <div className="px-3 py-2 border-b border-white/10 text-[12px] text-[#cdbdb8]">
                  {type === "AUDIO" ? "Audio" : "Video"}
                </div>
                <div className="p-3">
                  {mediaPreviewUrl ? (
                    type === "AUDIO" ? (
                      <audio controls className="w-full" src={mediaPreviewUrl} />
                    ) : (
                      <video controls className="w-full rounded-[8px]" src={mediaPreviewUrl} />
                    )
                  ) : (
                    <div className="text-[12px] text-[#8d7b77]">Select a media file to preview</div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 text-[12px] text-[#b8a6a1]">
              Preview happens locally on your device. Posting will submit for admin approval.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ArtistContentUploadPage() {
  const [active, setActive] = useState<UploadType>("AUDIO");
  const [busy, setBusy] = useState<UploadType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [audio, setAudio] = useState<UploadFormState>({
    title: "",
    genre: "",
    thumbnailFile: null,
    mediaFile: null
  });

  const [video, setVideo] = useState<UploadFormState>({
    title: "",
    genre: "",
    thumbnailFile: null,
    mediaFile: null
  });

  const backgroundStyle = useMemo(() => {
    return {
      backgroundImage:
        "radial-gradient(circle at 30% 10%, rgba(193,117,86,0.10) 0%, rgba(25,18,18,0.55) 45%, rgba(10,8,8,0.92) 100%)"
    } as const;
  }, []);

  const post = async (type: UploadType) => {
    setError(null);
    setSuccess(null);
    setBusy(type);

    try {
      const state = type === "AUDIO" ? audio : video;
      const title = (state.title || "").trim();
      const genre = (state.genre || "").trim();

      if (!title) throw new Error("Title is required");
      if (!state.thumbnailFile) throw new Error("Thumbnail is required");
      if (!state.mediaFile) throw new Error(type === "AUDIO" ? "Audio file is required" : "Video file is required");
      if (!genre) throw new Error("Genre is required");

      const fd = new FormData();
      fd.append("title", title);
      fd.append("type", type);
      fd.append("genre", genre);
      fd.append("thumbnail", state.thumbnailFile);
      fd.append("media", state.mediaFile);

      const res = await http.post<UploadResponse>("/api/v1/content/upload", fd, {
        headers: {
          "Content-Type": undefined as any
        }
      });

      if (!res.data?.success) {
        throw new Error(res.data?.message || "Upload failed");
      }

      setSuccess("Posted successfully. Waiting for Admin approval.");

      if (type === "AUDIO") {
        setAudio({ title: "", genre: "", thumbnailFile: null, mediaFile: null });
      } else {
        setVideo({ title: "", genre: "", thumbnailFile: null, mediaFile: null });
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Upload failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="w-full" style={backgroundStyle}>
      <div className="rounded-[10px] border border-white/10 bg-[#141010]/35 backdrop-blur px-7 py-6 shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
        <div className="flex items-start justify-between gap-6">
          <div>
            <div className="text-[18px] font-light tracking-wide">Content Upload</div>
            <div className="mt-1 text-[13px] text-[#b8a6a1]">Upload audio and video with local previews. New posts are pending until admin approval.</div>
          </div>
        </div>

        {error ? <div className="mt-4 text-[13px] text-[#e3a1a1]">{error}</div> : null}
        {success ? <div className="mt-4 text-[13px] text-emerald-200">{success}</div> : null}

        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setActive("AUDIO")}
            className={`h-[34px] px-4 rounded-[999px] border text-[12px] tracking-wide ${
              active === "AUDIO"
                ? "border-white/20 bg-white/10 text-white"
                : "border-white/10 bg-transparent text-[#b8a6a1] hover:text-white"
            }`}
          >
            Audio
          </button>
          <button
            type="button"
            onClick={() => setActive("VIDEO")}
            className={`h-[34px] px-4 rounded-[999px] border text-[12px] tracking-wide ${
              active === "VIDEO"
                ? "border-white/20 bg-white/10 text-white"
                : "border-white/10 bg-transparent text-[#b8a6a1] hover:text-white"
            }`}
          >
            Video
          </button>
        </div>

        <div className="mt-6">
          {active === "AUDIO" ? (
            <UploadSection
              type="AUDIO"
              value={audio}
              onChange={setAudio}
              onPost={() => post("AUDIO")}
              onError={(m) => {
                setError(m);
                if (m) setSuccess(null);
              }}
              busy={busy === "AUDIO"}
            />
          ) : (
            <UploadSection
              type="VIDEO"
              value={video}
              onChange={setVideo}
              onPost={() => post("VIDEO")}
              onError={(m) => {
                setError(m);
                if (m) setSuccess(null);
              }}
              busy={busy === "VIDEO"}
            />
          )}
        </div>
      </div>
    </div>
  );
}
