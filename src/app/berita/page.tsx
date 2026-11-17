"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowUpRight,
  Calendar,
  Newspaper,
  Search,
  User,
  X,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  NEWS_AUDIENCE_META,
  NEWS_CATEGORIES,
  NEWS_CATEGORY_BADGE,
  type NewsArticleItem,
  type NewsCategory,
} from "@/lib/news";
import { formatDateId } from "@/lib/tracking";

export default function BeritaInternalPage() {
  const { can } = useAuth();
  const canRead = can("news", "read");

  const [categoryFilter, setCategoryFilter] = useState<"" | NewsCategory>("");
  const [search, setSearch] = useState("");
  const [articles, setArticles] = useState<NewsArticleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeArticle, setActiveArticle] = useState<NewsArticleItem | null>(
    null
  );

  const loadNews = useCallback(async () => {
    if (!canRead) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const qs = categoryFilter ? `?category=${encodeURIComponent(categoryFilter)}` : "";
      const list = await apiRequest<NewsArticleItem[]>(`/api/news${qs}`);
      setArticles(list || []);
    } catch (err: any) {
      setError(err?.message || "Gagal memuat berita internal HIPMI");
    } finally {
      setLoading(false);
    }
  }, [canRead, categoryFilter]);

  useEffect(() => {
    loadNews();
  }, [loadNews]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return articles;
    return articles.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.summary.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q)
    );
  }, [articles, search]);

  const featuredArticle = filtered[0] ?? null;
  const gridArticles = filtered.slice(1);

  return (
    <AppShell title="Berita HIPMI" breadcrumb="Operasional ERP / Berita HIPMI">
      <div className="space-y-6">
        {!canRead ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
            Akun Anda tidak memiliki izin <code>news:read</code> untuk membaca modul Berita HIPMI.
          </div>
        ) : (
          <>
            {error ? (
              <div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-800">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            ) : null}

            {/* Header & Category Filter Strip matching ERP theme */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#D4E4DC] bg-white p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#06231D] text-[#E3EF26]">
                  <Newspaper className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-extrabold text-[#06231D]">
                    Kabar &amp; Pembaruan Internal Organisasi
                  </h2>
                  <p className="mt-0.5 text-xs text-[#64748B]">
                    Menampilkan berita bertag <strong>INTERNAL</strong> dan <strong>ERP &amp; WEB</strong> yang sedang aktif dipublikasikan.
                  </p>
                </div>
              </div>

              <div className="relative min-w-[230px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari judul atau ringkasan berita..."
                  className="min-h-[40px] w-full rounded-[8px] border border-[#D4E4DC] bg-[#FFFDEE] pl-9 pr-3 text-xs text-[#06231D]"
                />
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setCategoryFilter("")}
                className={`min-h-[36px] cursor-pointer rounded-full border px-4 text-xs font-bold transition ${
                  categoryFilter === ""
                    ? "border-[#06231D] bg-[#06231D] text-[#E3EF26]"
                    : "border-[#D4E4DC] bg-white text-[#06231D] hover:border-[#076653]"
                }`}
              >
                Semua Kategori
              </button>
              {NEWS_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`min-h-[36px] cursor-pointer rounded-full border px-4 text-xs font-bold transition ${
                    categoryFilter === cat
                      ? "border-[#06231D] bg-[#06231D] text-[#E3EF26]"
                      : "border-[#D4E4DC] bg-white text-[#06231D] hover:border-[#076653]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex justify-center rounded-2xl border border-[#D4E4DC] bg-white py-20">
                <div className="h-9 w-9 animate-spin rounded-full border-4 border-[#D4E4DC] border-t-[#076653]" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#CBD5E1] bg-white p-12 text-center text-sm text-[#64748B]">
                Belum ada berita internal yang tersedia pada kategori ini.
              </div>
            ) : (
              <div className="space-y-6">
                {/* 1 Kotak Paling Besar di Atas (Featured Hero Card) */}
                {featuredArticle ? (
                  <button
                    type="button"
                    onClick={() => setActiveArticle(featuredArticle)}
                    className="group grid w-full cursor-pointer overflow-hidden rounded-2xl border border-[#124236] bg-[#06231D] text-left text-[#FFFDEE] shadow-md transition hover:border-[#E3EF26] lg:grid-cols-12"
                  >
                    <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#0C342C] lg:col-span-7 lg:aspect-auto lg:min-h-[320px]">
                      {featuredArticle.imageSrc ? (
                        <img
                          src={featuredArticle.imageSrc}
                          alt={featuredArticle.imageAlt || featuredArticle.title}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full min-h-[240px] flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#076653]/40 to-[#06231D] p-6 text-center">
                          <Newspaper className="h-12 w-12 text-[#E3EF26]/80" />
                          <span className="font-display text-xs font-bold tracking-[0.08em] text-[#C7DCD2]">
                            BERITA UTAMA HIPMI PT TELKOM
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col justify-between p-6 sm:p-8 lg:col-span-5">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-[#E3EF26] px-2.5 py-0.5 font-display text-[10px] font-bold uppercase tracking-wider text-[#06231D]">
                            {featuredArticle.category}
                          </span>
                          <span
                            className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${
                              NEWS_AUDIENCE_META[featuredArticle.targetAudience]
                                .badgeClass
                            }`}
                          >
                            {
                              NEWS_AUDIENCE_META[featuredArticle.targetAudience]
                                .shortTag
                            }
                          </span>
                        </div>

                        <h3 className="mt-4 font-display text-xl font-extrabold leading-snug text-[#FFFDEE] group-hover:text-[#E3EF26] sm:text-2xl">
                          {featuredArticle.title}
                        </h3>
                        <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-[#C7DCD2] sm:text-sm">
                          {featuredArticle.summary}
                        </p>
                      </div>

                      <div className="mt-6 flex items-center justify-between border-t border-[#124236] pt-4 text-xs text-[#C7DCD2]">
                        <span className="tabular-nums">
                          {formatDateId(featuredArticle.publishedAt)}
                        </span>
                        <span className="inline-flex items-center gap-1 font-display font-bold text-[#E3EF26]">
                          Baca Artikel
                          <ArrowUpRight className="h-4 w-4" />
                        </span>
                      </div>
                    </div>
                  </button>
                ) : null}

                {/* 3 Kotak Menyamping di Bawah (3-Col Card Grid) */}
                {gridArticles.length > 0 ? (
                  <div className="grid gap-5 md:grid-cols-3">
                    {gridArticles.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setActiveArticle(item)}
                        className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-[#D4E4DC] bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#076653]"
                      >
                        <div className="aspect-[16/9] w-full overflow-hidden bg-[#0C342C]">
                          {item.imageSrc ? (
                            <img
                              src={item.imageSrc}
                              alt={item.imageAlt || item.title}
                              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center bg-[#06231D] text-[#E3EF26]/80">
                              <Newspaper className="h-8 w-8" />
                            </div>
                          )}
                        </div>

                        <div className="flex flex-1 flex-col justify-between p-5">
                          <div>
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span
                                className={`rounded-full px-2.5 py-0.5 font-display text-[10px] font-bold ${
                                  NEWS_CATEGORY_BADGE[item.category]
                                }`}
                              >
                                {item.category}
                              </span>
                              <span
                                className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                                  NEWS_AUDIENCE_META[item.targetAudience]
                                    .badgeClass
                                }`}
                              >
                                {NEWS_AUDIENCE_META[item.targetAudience].shortTag}
                              </span>
                            </div>

                            <h4 className="mt-3 line-clamp-2 font-display text-base font-extrabold leading-snug text-[#06231D] group-hover:text-[#076653]">
                              {item.title}
                            </h4>
                            <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-[#475569]">
                              {item.summary}
                            </p>
                          </div>

                          <div className="mt-4 flex items-center justify-between border-t border-[#F1F5F9] pt-3 text-[11px] text-[#64748B]">
                            <span className="tabular-nums">
                              {formatDateId(item.publishedAt)}
                            </span>
                            <span className="font-bold text-[#076653]">
                              Baca →
                            </span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            )}
          </>
        )}
      </div>

      {/* Article Reader Modal */}
      {activeArticle ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#06231D]/75 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-[14px] border border-[#D4E4DC] bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 bg-[#06231D] px-6 py-4 text-[#FFFDEE]">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#E3EF26] px-2.5 py-0.5 font-display text-[10px] font-bold text-[#06231D]">
                    {activeArticle.category}
                  </span>
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${
                      NEWS_AUDIENCE_META[activeArticle.targetAudience].badgeClass
                    }`}
                  >
                    {NEWS_AUDIENCE_META[activeArticle.targetAudience].label}
                  </span>
                </div>
                <h2 className="mt-2 font-display text-lg font-extrabold">
                  {activeArticle.title}
                </h2>
                <div className="mt-1 flex flex-wrap items-center gap-4 text-[11px] text-[#C7DCD2]">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDateId(activeArticle.publishedAt)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />
                    {activeArticle.authorName || "Redaksi HIPMI PT Telkom"}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveArticle(null)}
                className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded text-[#C7DCD2] hover:bg-[#0C342C] hover:text-white"
                aria-label="Tutup berita"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto p-6">
              {activeArticle.imageSrc ? (
                <div className="aspect-[16/9] w-full overflow-hidden rounded-xl border border-[#E2E8F0]">
                  <img
                    src={activeArticle.imageSrc}
                    alt={activeArticle.imageAlt || activeArticle.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : null}

              <p className="rounded-xl border border-[#D4E4DC] bg-[#FFFDEE] p-4 text-sm font-semibold leading-relaxed text-[#06231D]">
                {activeArticle.summary}
              </p>

              <div className="whitespace-pre-line text-sm leading-relaxed text-[#1E293B]">
                {activeArticle.content}
              </div>
            </div>

            <div className="flex justify-end border-t border-[#E2E8F0] bg-[#F8FAFC] px-6 py-3.5">
              <button
                type="button"
                onClick={() => setActiveArticle(null)}
                className="min-h-[38px] cursor-pointer rounded-[8px] border border-[#D4E4DC] bg-white px-4 text-xs font-semibold text-[#06231D]"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
