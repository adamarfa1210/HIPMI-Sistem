"use client";

import React, { useEffect, useState } from "react";
import { Plus, Scissors, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/api";
import {
  CharCounterInput,
  CharCounterTextarea,
} from "@/components/CharCounterField";
import type { CROP_PRESETS } from "@/components/ImageCropperModal";

export interface CmsSectionCommonProps {
  canWrite: boolean;
  canDelete: boolean;
  canApprove: boolean;
  onNotify: (msg: string, isError?: boolean) => void;
  onOpenCropper: (
    presetKey: keyof typeof CROP_PRESETS,
    initialAlt: string,
    onResult: (res: { url: string; imageAlt: string }) => void
  ) => void;
}

export function HeroSlidesSection({
  canWrite,
  canDelete,
  onNotify,
  onOpenCropper,
}: CmsSectionCommonProps) {
  const [slides, setSlides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [imageSrc, setImageSrc] = useState("");
  const [imageAlt, setImageAlt] = useState("");
  const [sortOrder, setSortOrder] = useState(1);
  const [isPublished, setIsPublished] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<any[]>("/api/cms/hero-slides");
      setSlides(data);
      if (data.length > 0 && !selectedId) {
        selectItem(data[0]);
      }
    } catch (e: any) {
      onNotify(e.message, true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectItem = (item: any) => {
    setSelectedId(item.id);
    setTitle(item.title || "");
    setSubtitle(item.subtitle || "");
    setImageSrc(item.imageSrc || "");
    setImageAlt(item.imageAlt || "");
    setSortOrder(item.sortOrder ?? 0);
    setIsPublished(Boolean(item.isPublished));
  };

  const resetForm = () => {
    setSelectedId(null);
    setTitle("");
    setSubtitle("");
    setImageSrc("");
    setImageAlt("");
    setSortOrder(slides.length + 1);
    setIsPublished(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = {
        title,
        subtitle,
        imageSrc: imageSrc.trim() || null,
        imageAlt: imageAlt.trim() || null,
        sortOrder: Number(sortOrder),
        isPublished,
      };

      if (selectedId) {
        await apiRequest(`/api/cms/hero-slides/${selectedId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        onNotify("Hero slide diperbarui & Web UKM direvalidasi.");
      } else {
        const created = await apiRequest<any>("/api/cms/hero-slides", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setSelectedId(created.id);
        onNotify("Hero slide baru ditambahkan & Web UKM direvalidasi.");
      }
      await load();
    } catch (err: any) {
      onNotify(err.message, true);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus hero slide ini?")) return;
    try {
      await apiRequest(`/api/cms/hero-slides/${id}`, { method: "DELETE" });
      if (selectedId === id) resetForm();
      onNotify("Hero slide dihapus & Web UKM direvalidasi.");
      await load();
    } catch (err: any) {
      onNotify(err.message, true);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <div className="space-y-3 rounded-[10px] border border-[#D4E4DC] bg-white p-5 lg:col-span-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-sm font-extrabold text-[#06231D]">
              Daftar Hero Slides ({slides.length})
            </h2>
            <p className="text-[11px] text-[#2F4F46]">
              Idealnya 3–5 slide aktif untuk beranda web.
            </p>
          </div>
          {canWrite ? (
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex min-h-[38px] cursor-pointer items-center gap-1 rounded-[6px] bg-[#E3EF26] px-3 font-display text-xs font-bold text-[#06231D]"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Slide Baru</span>
            </button>
          ) : null}
        </div>

        {loading ? (
          <div className="space-y-2.5 pt-2">
            {[1, 2, 3].map((k) => (
              <div
                key={k}
                className="h-16 animate-pulse rounded-[8px] bg-[#F1F5F9]"
              />
            ))}
          </div>
        ) : slides.length === 0 ? (
          <p className="rounded-[8px] bg-[#F1F5F9] p-4 text-xs text-[#2F4F46]">
            Belum ada hero slide. Klik &ldquo;+ Slide Baru&rdquo; untuk mengisi.
          </p>
        ) : (
          <div className="space-y-2">
            {slides.map((s) => (
              <div
                key={s.id}
                onClick={() => selectItem(s)}
                className={`flex cursor-pointer items-center justify-between gap-3 rounded-[8px] border p-3 transition ${
                  selectedId === s.id
                    ? "border-[#076653] bg-[#E2FBCE]/50"
                    : "border-[#D4E4DC] bg-[#FFFDEE] hover:border-[#076653]/50"
                }`}
              >
                <div className="min-w-0">
                  <p className="truncate font-display text-xs font-bold text-[#06231D]">
                    {s.indexLabel ? `[${s.indexLabel}] ` : ""}
                    {s.title}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] text-[#2F4F46]">
                    Urutan #{s.sortOrder} •{" "}
                    {s.isPublished ? "Published" : "Draft"}
                  </p>
                </div>
                {canDelete ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(s.id);
                    }}
                    className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded text-[#991B1B] hover:bg-[#FEE2E2]"
                    aria-label="Hapus slide"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>

      <form
        onSubmit={handleSave}
        className="space-y-4 rounded-[10px] border border-[#D4E4DC] bg-white p-6 lg:col-span-7"
      >
        <h3 className="font-display text-base font-extrabold text-[#06231D]">
          {selectedId ? "Edit Hero Slide Terpilih" : "Tambah Hero Slide Baru"}
        </h3>

        <CharCounterInput
          label="Headline Utama Hero (title)"
          value={title}
          onChange={setTitle}
          maxLength={45}
          required
          placeholder="Minimal 10, maksimal 45 karakter"
        />

        <CharCounterTextarea
          label="Deskripsi Penjelas (subtitle)"
          value={subtitle}
          onChange={setSubtitle}
          maxLength={180}
          required
          placeholder="Minimal 40, maksimal 180 karakter"
        />

        <div className="rounded-[8px] border border-[#D4E4DC] bg-[#FFFDEE] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-[#06231D]">
                Banner Hero Image (16:9 Landscape)
              </p>
              <p className="max-w-md truncate text-[11px] text-[#2F4F46]">
                {imageSrc || "Belum ada gambar terunggah"}
              </p>
            </div>
            {canWrite ? (
              <div className="flex items-center gap-2">
                {imageSrc ? (
                  <button
                    type="button"
                    onClick={() => {
                      setImageSrc("");
                      setImageAlt("");
                    }}
                    className="inline-flex min-h-[40px] cursor-pointer items-center gap-1.5 rounded-[6px] border border-red-200 bg-red-50 px-3 font-display text-xs font-bold text-red-700 hover:bg-red-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Hapus Foto</span>
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() =>
                    onOpenCropper("hero-home", imageAlt, (res) => {
                      setImageSrc(res.url);
                      setImageAlt(res.imageAlt);
                    })
                  }
                  className="inline-flex min-h-[40px] cursor-pointer items-center gap-1.5 rounded-[6px] bg-[#076653] px-4 font-display text-xs font-bold text-[#FFFDEE]"
                >
                  <Scissors className="h-3.5 w-3.5" />
                  <span>Crop &amp; Upload 16:9</span>
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <CharCounterInput
          label="Alt Text Gambar (imageAlt, opsional jika tanpa foto)"
          value={imageAlt}
          onChange={setImageAlt}
          maxLength={140}
          required={Boolean(imageSrc.trim())}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#06231D]">
              Urutan Tampil (sortOrder)
            </label>
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              className="tabular-nums min-h-[42px] w-full rounded-[6px] border border-[#D4E4DC] bg-[#FFFDEE] px-3 text-sm"
            />
          </div>
          <label className="flex min-h-[42px] cursor-pointer items-center gap-2.5 self-end rounded-[6px] border border-[#D4E4DC] bg-[#FFFDEE] px-3.5">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="h-4 w-4 accent-[#076653]"
            />
            <span className="text-xs font-semibold text-[#06231D]">
              Publikasikan ke Beranda (Published)
            </span>
          </label>
        </div>

        {canWrite ? (
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex min-h-[44px] cursor-pointer items-center rounded-[6px] bg-[#E3EF26] px-6 font-display text-xs font-bold text-[#06231D] hover:bg-[#d5e11e] disabled:opacity-60"
            >
              {saving ? "Menyimpan..." : "Simpan & Rilis ke Web Profil"}
            </button>
          </div>
        ) : null}
      </form>
    </div>
  );
}

export function TentangSection({
  canWrite,
  canDelete,
  onNotify,
  onOpenCropper,
}: CmsSectionCommonProps) {
  const [eyebrow, setEyebrow] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [secondaryDescription, setSecondaryDescription] = useState("");
  const [videoPosterSrc, setVideoPosterSrc] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [pillars, setPillars] = useState<
    { title: string; description: string }[]
  >([
    { title: "", description: "" },
    { title: "", description: "" },
    { title: "", description: "" },
  ]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiRequest<any>("/api/cms/tentang")
      .then((d) => {
        setEyebrow(d.eyebrow || "");
        setTitle(d.title || "");
        setDescription(d.description || "");
        setSecondaryDescription(d.secondaryDescription || "");
        setVideoPosterSrc(d.videoPosterSrc || "");
        setVideoUrl(d.videoUrl || "");
        if (Array.isArray(d.pillars) && d.pillars.length === 3) {
          setPillars(
            d.pillars.map((p: any) => ({
              title: p.title || "",
              description: p.description || "",
            }))
          );
        }
      })
      .catch((e) => onNotify(e.message, true))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = {
        eyebrow,
        title,
        description,
        secondaryDescription: secondaryDescription.trim() || null,
        videoPosterSrc: videoPosterSrc.trim() || null,
        videoUrl: videoUrl.trim() || null,
        pillars: pillars.map((p, idx) => ({
          title: p.title,
          description: p.description,
          sortOrder: idx + 1,
        })),
      };

      await apiRequest("/api/cms/tentang", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      onNotify("Profil Tentang & 3 Pilar diperbarui & Web UKM direvalidasi.");
    } catch (err: any) {
      onNotify(err.message, true);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-64 animate-pulse rounded-[10px] border border-[#D4E4DC] bg-white p-6" />
    );
  }

  return (
    <form
      onSubmit={handleSave}
      className="space-y-6 rounded-[10px] border border-[#D4E4DC] bg-white p-6"
    >
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-4">
          <h2 className="font-display text-base font-extrabold text-[#06231D]">
            Narasi Tentang &amp; Video Profil
          </h2>
          <CharCounterInput
            label="Eyebrow (label atas)"
            value={eyebrow}
            onChange={setEyebrow}
            maxLength={30}
            required
          />
          <CharCounterInput
            label="Judul Section Tentang"
            value={title}
            onChange={setTitle}
            maxLength={70}
            required
          />
          <CharCounterTextarea
            label="Deskripsi Utama"
            value={description}
            onChange={setDescription}
            maxLength={320}
            required
            rows={4}
          />
          <CharCounterTextarea
            label="Deskripsi Penguat Kedua (Opsional)"
            value={secondaryDescription}
            onChange={setSecondaryDescription}
            maxLength={280}
            rows={3}
          />
          <div className="rounded-[8px] border border-[#D4E4DC] bg-[#FFFDEE] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#06231D]">
                  Poster Video Profil (16:9)
                </p>
                <p className="max-w-xs truncate text-[11px] text-[#2F4F46]">
                  {videoPosterSrc || "Belum ada poster"}
                </p>
              </div>
              {canWrite ? (
                <div className="flex items-center gap-2">
                  {videoPosterSrc ? (
                    <button
                      type="button"
                      onClick={() => setVideoPosterSrc("")}
                      className="inline-flex min-h-[38px] cursor-pointer items-center gap-1.5 rounded-[6px] border border-red-200 bg-red-50 px-3 font-display text-xs font-bold text-red-700 hover:bg-red-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Hapus Poster</span>
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() =>
                      onOpenCropper(
                        "tentang-video",
                        "Poster Video Profil HIPMI PT Telkom",
                        (res) => setVideoPosterSrc(res.url)
                      )
                    }
                    className="inline-flex min-h-[38px] cursor-pointer items-center gap-1.5 rounded-[6px] bg-[#076653] px-3.5 font-display text-xs font-bold text-[#FFFDEE]"
                  >
                    <Scissors className="h-3.5 w-3.5" />
                    <span>Ganti Poster</span>
                  </button>
                </div>
              ) : null}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#06231D]">
              URL File Video MP4 (Opsional)
            </label>
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://..."
              className="min-h-[42px] w-full rounded-[6px] border border-[#D4E4DC] bg-[#FFFDEE] px-3 text-sm"
            />
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="font-display text-base font-extrabold text-[#06231D]">
            Tepat 3 Pilar Aktif (Tanpa Prefix Angka/Bullet)
          </h2>
          {pillars.map((p, idx) => (
            <div
              key={idx}
              className="space-y-3 rounded-[8px] border border-[#D4E4DC] bg-[#FFFDEE] p-4"
            >
              <p className="font-display text-xs font-bold text-[#076653]">
                PILAR 0{idx + 1}
              </p>
              <CharCounterInput
                label="Judul Pilar"
                value={p.title}
                onChange={(val) => {
                  const next = [...pillars];
                  next[idx] = { ...next[idx], title: val };
                  setPillars(next);
                }}
                maxLength={32}
                required
              />
              <CharCounterTextarea
                label="Deskripsi Pilar"
                value={p.description}
                onChange={(val) => {
                  const next = [...pillars];
                  next[idx] = { ...next[idx], description: val };
                  setPillars(next);
                }}
                maxLength={120}
                required
                rows={2}
              />
            </div>
          ))}
        </div>
      </div>

      {canWrite || canDelete ? (
        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[#D4E4DC] pt-4">
          {canDelete ? (
            <button
              type="button"
              disabled={saving}
              onClick={async () => {
                if (!confirm("Kosongkan seluruh teks Tentang, Poster & 3 Pilar?")) return;
                setSaving(true);
                try {
                  await apiRequest("/api/cms/tentang", { method: "DELETE" });
                  setEyebrow("");
                  setTitle("");
                  setDescription("");
                  setSecondaryDescription("");
                  setVideoPosterSrc("");
                  setVideoUrl("");
                  setPillars([
                    { title: "", description: "" },
                    { title: "", description: "" },
                    { title: "", description: "" },
                  ]);
                  onNotify("Profil Tentang & 3 Pilar dikosongkan & Web UKM direvalidasi.");
                } catch (err: any) {
                  onNotify(err.message, true);
                } finally {
                  setSaving(false);
                }
              }}
              className="inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-[6px] border border-red-200 bg-red-50 px-5 font-display text-xs font-bold text-red-700 hover:bg-red-100 disabled:opacity-60"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Kosongkan Tentang &amp; Pilar</span>
            </button>
          ) : null}
          {canWrite ? (
            <button
              type="submit"
              disabled={saving}
              className="inline-flex min-h-[44px] cursor-pointer items-center rounded-[6px] bg-[#E3EF26] px-6 font-display text-xs font-bold text-[#06231D] hover:bg-[#d5e11e] disabled:opacity-60"
            >
              {saving ? "Menyimpan..." : "Simpan Tentang & 3 Pilar →"}
            </button>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}
