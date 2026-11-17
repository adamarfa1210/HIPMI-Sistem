"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Edit3,
  Newspaper,
  Plus,
  Scissors,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import {
  CharCounterInput,
  CharCounterTextarea,
} from "@/components/CharCounterField";
import { ImageCropperModal } from "@/components/ImageCropperModal";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  NEWS_AUDIENCE_META,
  NEWS_AUDIENCE_OPTIONS,
  NEWS_CATEGORIES,
  NEWS_CATEGORY_BADGE,
  type NewsArticleItem,
  type NewsAudience,
  type NewsCategory,
} from "@/lib/news";
import { formatDateId } from "@/lib/tracking";

interface NewsFormState {
  id?: string;
  title: string;
  category: NewsCategory;
  summary: string;
  content: string;
  imageSrc: string;
  imageAlt: string;
  targetAudience: NewsAudience;
  isFeatured: boolean;
  isPublished: boolean;
  publishedAt: string;
}

function toLocalInput(iso?: string): string {
  const d = iso ? new Date(iso) : new Date();
  if (Number.isNaN(d.getTime())) return "";
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}

export default function SettingBeritaPage() {
  const { can } = useAuth();
  const canRead = can("news-manage", "read");
  const canCreate = can("news-manage", "create");
  const canUpdate = can("news-manage", "update");
  const canDelete = can("news-manage", "delete");

  const [audienceFilter, setAudienceFilter] = useState<"" | NewsAudience>("");
  const [categoryFilter, setCategoryFilter] = useState<"" | NewsCategory>("");
  const [statusFilter, setStatusFilter] = useState<"" | "true" | "false">("");

  const [articles, setArticles] = useState<NewsArticleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; isError: boolean } | null>(
    null
  );

  const [formState, setFormState] = useState<NewsFormState | null>(null);
  const [cropperOpen, setCropperOpen] = useState(false);

  const notify = useCallback((message: string, isError = false) => {
    setToast({ message, isError });
    window.setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  }, []);

  const loadAll = useCallback(async () => {
    if (!canRead) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (audienceFilter) qs.set("targetAudience", audienceFilter);
      if (categoryFilter) qs.set("category", categoryFilter);
      if (statusFilter) qs.set("isPublished", statusFilter);
      const q = qs.toString() ? `?${qs.toString()}` : "";
      const list = await apiRequest<NewsArticleItem[]>(`/api/news/manage${q}`);
      setArticles(list || []);
    } catch (err: any) {
      notify(err?.message || "Gagal memuat manajemen berita", true);
    } finally {
      setLoading(false);
    }
  }, [canRead, audienceFilter, categoryFilter, statusFilter, notify]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const openNewForm = () => {
    setFormState({
      title: "",
      category: "Kegiatan",
      summary: "",
      content: "",
      imageSrc: "",
      imageAlt: "",
      targetAudience: "BOTH",
      isFeatured: articles.length === 0,
      isPublished: true,
      publishedAt: toLocalInput(),
    });
  };

  const openEditForm = (item: NewsArticleItem) => {
    setFormState({
      id: item.id,
      title: item.title,
      category: item.category,
      summary: item.summary,
      content: item.content,
      imageSrc: item.imageSrc || "",
      imageAlt: item.imageAlt || "",
      targetAudience: item.targetAudience,
      isFeatured: item.isFeatured,
      isPublished: item.isPublished,
      publishedAt: toLocalInput(item.publishedAt),
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState) return;
    setSaving(true);
    try {
      const payload = {
        title: formState.title.trim(),
        category: formState.category,
        summary: formState.summary.trim(),
        content: formState.content.trim(),
        imageSrc: formState.imageSrc.trim() || null,
        imageAlt: formState.imageSrc.trim()
          ? formState.imageAlt.trim() || formState.title.trim()
          : null,
        targetAudience: formState.targetAudience,
        isFeatured: formState.isFeatured,
        isPublished: formState.isPublished,
        publishedAt: formState.publishedAt
          ? new Date(formState.publishedAt).toISOString()
          : new Date().toISOString(),
      };

      if (formState.id) {
        await apiRequest(`/api/news/manage/${formState.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        notify("Berita berhasil diperbarui & cache Web UKM direvalidasi.");
      } else {
        await apiRequest("/api/news/manage", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        notify("Berita baru berhasil dibuat & disinkronkan.");
      }
      setFormState(null);
      await loadAll();
    } catch (err: any) {
      notify(err?.message || "Gagal menyimpan berita", true);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: NewsArticleItem) => {
    if (!canDelete) return;
    if (!window.confirm(`Hapus berita "${item.title}" secara permanen?`)) return;
    try {
      await apiRequest(`/api/news/manage/${item.id}`, { method: "DELETE" });
      notify("Berita berhasil dihapus.");
      await loadAll();
    } catch (err: any) {
      notify(err?.message || "Gagal menghapus berita", true);
    }
  };

  return (
    <AppShell
      title="Setting Berita"
      breadcrumb="Konten & Website / Setting Berita"
    >
      <div className="space-y-6">
        {toast ? (
          <div
            className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 text-xs font-semibold shadow-sm ${
              toast.isError
                ? "border-red-200 bg-red-50 text-red-800"
                : "border-emerald-200 bg-emerald-50 text-emerald-900"
            }`}
          >
            {toast.isError ? (
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            ) : (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            )}
            <span>{toast.message}</span>
          </div>
        ) : null}

        {!canRead ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
            Akun Anda tidak memiliki izin <code>news-manage:read</code> untuk mengelola berita.
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#D4E4DC] bg-white p-5 shadow-sm">
              <div>
                <h2 className="font-display text-lg font-extrabold text-[#06231D]">
                  Kelola Berita Internal ERP &amp; Web Profil UKM
                </h2>
                <p className="mt-0.5 text-xs text-[#64748B]">
                  Gunakan tag penempatan (<strong>INTERNAL</strong>, <strong>PUBLIC</strong>, atau <strong>BOTH</strong>) serta opsi <strong>Berita Utama</strong> untuk kotak paling besar di atas grid.
                </p>
              </div>
              {canCreate ? (
                <button
                  type="button"
                  onClick={openNewForm}
                  className="inline-flex min-h-[42px] cursor-pointer items-center gap-1.5 rounded-[8px] bg-[#076653] px-4 font-display text-xs font-bold text-[#FFFDEE] hover:bg-[#06231D]"
                >
                  <Plus className="h-4 w-4 text-[#E3EF26]" />
                  Buat Berita Baru
                </button>
              ) : null}
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#D4E4DC] bg-white p-3.5 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <select
                  aria-label="Filter Penempatan Berita"
                  value={audienceFilter}
                  onChange={(e) =>
                    setAudienceFilter(e.target.value as "" | NewsAudience)
                  }
                  className="min-h-[38px] rounded-[8px] border border-[#D4E4DC] bg-[#FFFDEE] px-3 text-xs font-semibold text-[#06231D]"
                >
                  <option value="">Semua Penempatan</option>
                  {NEWS_AUDIENCE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                <select
                  aria-label="Filter Kategori Berita"
                  value={categoryFilter}
                  onChange={(e) =>
                    setCategoryFilter(e.target.value as "" | NewsCategory)
                  }
                  className="min-h-[38px] rounded-[8px] border border-[#D4E4DC] bg-[#FFFDEE] px-3 text-xs font-semibold text-[#06231D]"
                >
                  <option value="">Semua Kategori</option>
                  {NEWS_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>

                <select
                  aria-label="Filter Status Tayang"
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value as "" | "true" | "false")
                  }
                  className="min-h-[38px] rounded-[8px] border border-[#D4E4DC] bg-[#FFFDEE] px-3 text-xs font-semibold text-[#06231D]"
                >
                  <option value="">Tayang &amp; Draft</option>
                  <option value="true">Tayang (Published)</option>
                  <option value="false">Draft</option>
                </select>
              </div>
              <span className="text-xs text-[#64748B] tabular-nums">
                {articles.length} artikel
              </span>
            </div>

            {/* News List */}
            {loading ? (
              <div className="flex justify-center rounded-2xl border border-[#D4E4DC] bg-white py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#D4E4DC] border-t-[#076653]" />
              </div>
            ) : articles.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#CBD5E1] bg-white p-12 text-center text-xs text-[#64748B]">
                Belum ada artikel berita yang dibuat.
                {canCreate ? " Klik Buat Berita Baru untuk menambahkan." : ""}
              </div>
            ) : (
              <div className="space-y-3">
                {articles.map((item) => {
                  const audMeta = NEWS_AUDIENCE_META[item.targetAudience];
                  return (
                    <div
                      key={item.id}
                      className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#D4E4DC] bg-white p-4 shadow-sm"
                    >
                      <div className="flex min-w-0 flex-1 items-start gap-4">
                        <div className="hidden h-20 w-32 shrink-0 overflow-hidden rounded-xl bg-[#06231D] sm:block">
                          {item.imageSrc ? (
                            <img
                              src={item.imageSrc}
                              alt={item.imageAlt || item.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-[#E3EF26]/80">
                              <Newspaper className="h-6 w-6" />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${audMeta.badgeClass}`}
                            >
                              {audMeta.label}
                            </span>
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                NEWS_CATEGORY_BADGE[item.category]
                              }`}
                            >
                              {item.category}
                            </span>
                            {item.isFeatured ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#06231D] px-2.5 py-0.5 text-[10px] font-bold text-[#E3EF26]">
                                <Star className="h-3 w-3" />
                                Berita Utama (Kotak Besar)
                              </span>
                            ) : null}
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                item.isPublished
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-slate-200 text-slate-700"
                              }`}
                            >
                              {item.isPublished ? "Tayang" : "Draft"}
                            </span>
                          </div>

                          <h3 className="mt-1.5 font-display text-sm font-extrabold text-[#06231D]">
                            {item.title}
                          </h3>
                          <p className="mt-0.5 line-clamp-2 text-xs text-[#475569]">
                            {item.summary}
                          </p>
                          <p className="mt-1 text-[11px] text-[#64748B] tabular-nums">
                            {formatDateId(item.publishedAt)} • Penulis:{" "}
                            {item.authorName || "-"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {canUpdate ? (
                          <button
                            type="button"
                            onClick={() => openEditForm(item)}
                            className="inline-flex min-h-[36px] cursor-pointer items-center gap-1.5 rounded-[8px] border border-[#D4E4DC] bg-white px-3 text-xs font-semibold text-[#06231D] hover:border-[#076653]"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            Edit
                          </button>
                        ) : null}
                        {canDelete ? (
                          <button
                            type="button"
                            onClick={() => handleDelete(item)}
                            className="inline-flex min-h-[36px] cursor-pointer items-center gap-1 rounded-[8px] border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-700 hover:bg-red-600 hover:text-white"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Hapus
                          </button>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Create / Edit News Modal */}
      {formState ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#06231D]/75 p-4"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={handleSave}
            className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-[14px] border border-[#D4E4DC] bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[#E2E8F0] bg-[#06231D] px-6 py-4 text-[#FFFDEE]">
              <h2 className="font-display text-base font-extrabold">
                {formState.id ? "Edit Berita" : "Buat Berita Baru"}
              </h2>
              <button
                type="button"
                onClick={() => setFormState(null)}
                className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded text-[#C7DCD2] hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-6">
              <CharCounterInput
                label="Judul Berita (5–120 karakter)"
                value={formState.title}
                onChange={(v) =>
                  setFormState((p) => (p ? { ...p, title: v } : p))
                }
                maxLength={120}
                required
              />

              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-bold text-[#06231D]">
                    Tag Penempatan *
                  </label>
                  <select
                    value={formState.targetAudience}
                    onChange={(e) =>
                      setFormState((p) =>
                        p
                          ? {
                              ...p,
                              targetAudience: e.target.value as NewsAudience,
                            }
                          : p
                      )
                    }
                    className="min-h-[40px] w-full rounded-[8px] border border-[#D4E4DC] bg-[#FFFDEE] px-2.5 text-xs font-semibold text-[#06231D]"
                  >
                    {NEWS_AUDIENCE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-[#06231D]">
                    Kategori *
                  </label>
                  <select
                    value={formState.category}
                    onChange={(e) =>
                      setFormState((p) =>
                        p
                          ? { ...p, category: e.target.value as NewsCategory }
                          : p
                      )
                    }
                    className="min-h-[40px] w-full rounded-[8px] border border-[#D4E4DC] bg-[#FFFDEE] px-2.5 text-xs font-semibold text-[#06231D]"
                  >
                    {NEWS_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-[#06231D]">
                    Tanggal Publikasi
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formState.publishedAt}
                    onChange={(e) =>
                      setFormState((p) =>
                        p ? { ...p, publishedAt: e.target.value } : p
                      )
                    }
                    className="min-h-[40px] w-full rounded-[8px] border border-[#D4E4DC] bg-[#FFFDEE] px-2.5 text-xs text-[#06231D]"
                  />
                </div>
              </div>

              <CharCounterTextarea
                label="Ringkasan Singkat di Kartu (10–240 karakter)"
                value={formState.summary}
                onChange={(v) =>
                  setFormState((p) => (p ? { ...p, summary: v } : p))
                }
                maxLength={240}
                rows={2}
                required
              />

              <CharCounterTextarea
                label="Isi Lengkap Artikel Berita (20–15.000 karakter)"
                value={formState.content}
                onChange={(v) =>
                  setFormState((p) => (p ? { ...p, content: v } : p))
                }
                maxLength={15000}
                rows={6}
                required
              />

              {/* Cover 16:9 via ImageCropperModal */}
              <div className="rounded-xl border border-[#D4E4DC] bg-[#FFFDEE] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold text-[#06231D]">
                      Cover Gambar 16:9 (Opsional)
                    </p>
                    <p className="text-[11px] text-[#64748B]">
                      Disarankan untuk berita utama dan kartu grid agar tampil tajam.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {formState.imageSrc ? (
                      <button
                        type="button"
                        onClick={() =>
                          setFormState((p) =>
                            p ? { ...p, imageSrc: "", imageAlt: "" } : p
                          )
                        }
                        className="cursor-pointer rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700"
                      >
                        Hapus Foto
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setCropperOpen(true)}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#06231D] px-3.5 py-2 text-xs font-bold text-[#E3EF26]"
                    >
                      <Scissors className="h-3.5 w-3.5" />
                      Crop &amp; Upload 16:9
                    </button>
                  </div>
                </div>

                {formState.imageSrc ? (
                  <div className="mt-3 space-y-2">
                    <img
                      src={formState.imageSrc}
                      alt={formState.imageAlt || "Preview cover"}
                      className="aspect-[16/9] max-h-48 w-full rounded-lg object-cover"
                    />
                    <CharCounterInput
                      label="Alt Text Cover Gambar (opsional, maks 140 kar)"
                      value={formState.imageAlt}
                      onChange={(v) =>
                        setFormState((p) => (p ? { ...p, imageAlt: v } : p))
                      }
                      maxLength={140}
                    />
                  </div>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-5 pt-1">
                <label className="flex cursor-pointer items-center gap-2 text-xs font-bold text-[#06231D]">
                  <input
                    type="checkbox"
                    checked={formState.isFeatured}
                    onChange={(e) =>
                      setFormState((p) =>
                        p ? { ...p, isFeatured: e.target.checked } : p
                      )
                    }
                    className="h-4 w-4 accent-[#076653]"
                  />
                  Jadikan Berita Utama (Kotak Besar Paling Atas)
                </label>

                <label className="flex cursor-pointer items-center gap-2 text-xs font-bold text-[#06231D]">
                  <input
                    type="checkbox"
                    checked={formState.isPublished}
                    onChange={(e) =>
                      setFormState((p) =>
                        p ? { ...p, isPublished: e.target.checked } : p
                      )
                    }
                    className="h-4 w-4 accent-[#076653]"
                  />
                  Tayangkan Sekarang (Published)
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-[#E2E8F0] bg-[#F8FAFC] px-6 py-4">
              <button
                type="button"
                onClick={() => setFormState(null)}
                className="min-h-[40px] cursor-pointer rounded-[8px] border border-[#D4E4DC] bg-white px-4 text-xs font-semibold text-[#06231D]"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving}
                className="min-h-[40px] cursor-pointer rounded-[8px] bg-[#076653] px-5 font-display text-xs font-bold text-[#FFFDEE] hover:bg-[#06231D] disabled:opacity-50"
              >
                {saving ? "Menyimpan..." : "Simpan Berita"}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <ImageCropperModal
        open={cropperOpen}
        presetKey="hero-home"
        initialAlt={formState?.imageAlt || ""}
        onClose={() => setCropperOpen(false)}
        onUploaded={(res) => {
          setCropperOpen(false);
          setFormState((p) =>
            p ? { ...p, imageSrc: res.url, imageAlt: res.imageAlt } : p
          );
          notify("Cover berita 16:9 berhasil diunggah.");
        }}
      />
    </AppShell>
  );
}
