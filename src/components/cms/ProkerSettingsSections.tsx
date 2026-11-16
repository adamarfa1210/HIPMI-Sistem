"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  ImagePlus,
  Megaphone,
  Plus,
  RefreshCw,
  Save,
  Settings,
  Trash2,
} from "lucide-react";
import { apiRequest } from "@/lib/api";
import { CharCounterInput, CharCounterTextarea } from "@/components/CharCounterField";
import type { CmsSectionCommonProps } from "@/components/cms/HeroTentangSections";

interface ProkerSlide {
  id: string;
  compartmentId: string;
  kind: "proker" | "jobdesk";
  title: string;
  description: string;
  mediaSourceLabel: string;
  imageSrc: string;
  imageAlt: string;
  slotStatus: "ready" | "pending-asset";
  sortOrder: number;
}

interface ProkerCompartment {
  id: string;
  bidangId: string;
  code: string;
  name: string;
  operationalPattern: "proker-only" | "jobdesk-only" | "proker-jobdesk";
  sortOrder: number;
  slides: ProkerSlide[];
}

interface ProkerBidang {
  id: string;
  slug: string;
  shortName: string;
  title: string;
  eyebrow: string;
  description: string;
  compartmentSummary: string;
  sortOrder: number;
  compartments: ProkerCompartment[];
}

function isHttpUrl(val?: string | null): boolean {
  return Boolean(val && (val.startsWith("http://") || val.startsWith("https://")));
}

export function ProgramKerjaSection({
  canWrite,
  canDelete,
  onNotify,
  onOpenCropper,
}: CmsSectionCommonProps) {
  const [bidangs, setBidangs] = useState<ProkerBidang[]>([]);
  const [selectedBidangId, setSelectedBidangId] = useState<string>("");
  const [expandedCompId, setExpandedCompId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Selected bidang form
  const [bidangForm, setBidangForm] = useState({
    shortName: "",
    title: "",
    eyebrow: "",
    description: "",
    compartmentSummary: "",
  });

  // New compartment form
  const [newComp, setNewComp] = useState<{
    code: string;
    name: string;
    operationalPattern: "proker-only" | "jobdesk-only" | "proker-jobdesk";
  }>({
    code: "",
    name: "",
    operationalPattern: "proker-jobdesk",
  });

  // Slide modal/inline editor
  const [editingSlide, setEditingSlide] = useState<{
    compartmentId: string;
    slideId?: string;
    kind: "proker" | "jobdesk";
    title: string;
    description: string;
    mediaSourceLabel: string;
    imageSrc: string;
    imageAlt: string;
    slotStatus: "ready" | "pending-asset";
    sortOrder: number;
    hasNewImage: boolean;
  } | null>(null);

  const loadBidangs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiRequest<{ data?: ProkerBidang[] } | ProkerBidang[]>(
        "/api/cms/program-kerja"
      );
      const list = Array.isArray(res) ? res : res.data || [];
      setBidangs(list);
      if (list.length > 0) {
        setSelectedBidangId((prev) =>
          prev && list.some((b) => b.id === prev) ? prev : list[0].id
        );
      }
    } catch (err) {
      onNotify(
        err instanceof Error ? err.message : "Gagal memuat data Program Kerja",
        true
      );
    } finally {
      setLoading(false);
    }
  }, [onNotify]);

  useEffect(() => {
    void loadBidangs();
  }, [loadBidangs]);

  const currentBidang = bidangs.find((b) => b.id === selectedBidangId) || null;

  useEffect(() => {
    if (currentBidang) {
      setBidangForm({
        shortName: currentBidang.shortName || "",
        title: currentBidang.title || "",
        eyebrow: currentBidang.eyebrow || "",
        description: currentBidang.description || "",
        compartmentSummary: currentBidang.compartmentSummary || "",
      });
      if (currentBidang.compartments?.length > 0) {
        setExpandedCompId((prev) =>
          prev && currentBidang.compartments.some((c) => c.id === prev)
            ? prev
            : currentBidang.compartments[0].id
        );
      } else {
        setExpandedCompId(null);
      }
    }
  }, [currentBidang]);

  const handleSaveBidang = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBidang || !canWrite) return;
    setSaving(true);
    try {
      await apiRequest(`/api/cms/program-kerja/bidang/${currentBidang.id}`, {
        method: "PATCH",
        body: JSON.stringify(bidangForm),
      });
      onNotify(`Bidang ${bidangForm.shortName} berhasil diperbarui.`);
      await loadBidangs();
    } catch (err) {
      onNotify(
        err instanceof Error ? err.message : "Gagal menyimpan bidang",
        true
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCreateCompartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBidang || !canWrite) return;
    setSaving(true);
    try {
      await apiRequest("/api/cms/program-kerja/compartment", {
        method: "POST",
        body: JSON.stringify({
          bidangId: currentBidang.id,
          code: newComp.code,
          name: newComp.name,
          operationalPattern: newComp.operationalPattern,
          sortOrder: (currentBidang.compartments?.length || 0) + 1,
        }),
      });
      onNotify(`Kompartemen ${newComp.name} berhasil ditambahkan.`);
      setNewComp({ code: "", name: "", operationalPattern: "proker-jobdesk" });
      await loadBidangs();
    } catch (err) {
      onNotify(
        err instanceof Error ? err.message : "Gagal menambah kompartemen",
        true
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCompartment = async (comp: ProkerCompartment) => {
    if (!canDelete) return;
    if (!window.confirm(`Hapus kompartemen "${comp.name}" beserta seluruh slidenya?`)) {
      return;
    }
    setSaving(true);
    try {
      await apiRequest(`/api/cms/program-kerja/compartment/${comp.id}`, {
        method: "DELETE",
      });
      onNotify(`Kompartemen ${comp.name} dihapus.`);
      await loadBidangs();
    } catch (err) {
      onNotify(
        err instanceof Error ? err.message : "Gagal menghapus kompartemen",
        true
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlide || !canWrite) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        compartmentId: editingSlide.compartmentId,
        kind: editingSlide.kind,
        title: editingSlide.title,
        description: editingSlide.description,
        mediaSourceLabel: editingSlide.mediaSourceLabel,
        slotStatus: editingSlide.slotStatus,
        sortOrder: editingSlide.sortOrder,
      };
      if (editingSlide.imageAlt.trim().length >= 10) {
        payload.imageAlt = editingSlide.imageAlt.trim();
      }
      if (editingSlide.hasNewImage && isHttpUrl(editingSlide.imageSrc)) {
        payload.imageSrc = editingSlide.imageSrc;
      } else if (!editingSlide.slideId && isHttpUrl(editingSlide.imageSrc)) {
        payload.imageSrc = editingSlide.imageSrc;
      }

      if (editingSlide.slideId) {
        await apiRequest(`/api/cms/program-kerja/slide/${editingSlide.slideId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        onNotify("Slide program kerja diperbarui.");
      } else {
        await apiRequest("/api/cms/program-kerja/slide", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        onNotify("Slide program kerja ditambahkan.");
      }
      setEditingSlide(null);
      await loadBidangs();
    } catch (err) {
      onNotify(
        err instanceof Error ? err.message : "Gagal menyimpan slide",
        true
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSlide = async (slide: ProkerSlide) => {
    if (!canDelete) return;
    if (!window.confirm(`Hapus slide "${slide.title}"?`)) return;
    setSaving(true);
    try {
      await apiRequest(`/api/cms/program-kerja/slide/${slide.id}`, {
        method: "DELETE",
      });
      onNotify("Slide dihapus.");
      await loadBidangs();
    } catch (err) {
      onNotify(
        err instanceof Error ? err.message : "Gagal menghapus slide",
        true
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-[#CBD5E1] bg-white p-8 text-sm text-[#64748B]">
        Memuat data Program Kerja & Kompartemen...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Bidang Sub-tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#CBD5E1] bg-white p-4">
        <div className="flex flex-wrap gap-2">
          {bidangs.map((b) => {
            const active = b.id === selectedBidangId;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => setSelectedBidangId(b.id)}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                  active
                    ? "bg-[#06231D] text-[#E3EF26]"
                    : "bg-[#F8FAFC] text-[#475569] hover:bg-[#F1F5F9]"
                }`}
              >
                {b.shortName} ({b.compartments?.length || 0} Komp.)
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => void loadBidangs()}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[#CBD5E1] px-3 py-2 text-xs font-semibold text-[#06231D] hover:bg-[#F8FAFC]"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Muat Ulang
        </button>
      </div>

      {currentBidang && (
        <>
          {/* Bidang Metadata Editor */}
          <form
            onSubmit={handleSaveBidang}
            className="rounded-2xl border border-[#CBD5E1] bg-white p-6 shadow-sm"
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#06231D]">
                  Informasi Bidang: {currentBidang.shortName}
                </h3>
                <p className="text-xs text-[#64748B]">
                  Slug publik: <code>/program-kerja/{currentBidang.slug}</code>
                </p>
              </div>
              {canWrite && (
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#E3EF26] px-4 py-2.5 text-xs font-bold text-[#06231D] hover:brightness-95 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  Simpan Bidang
                </button>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <CharCounterInput
                label="Nama Singkat Bidang (3–15 karakter)"
                value={bidangForm.shortName}
                onChange={(v) => setBidangForm((p) => ({ ...p, shortName: v }))}
                maxLength={15}
                required
              />
              <CharCounterInput
                label="Judul Bidang (5–25 karakter)"
                value={bidangForm.title}
                onChange={(v) => setBidangForm((p) => ({ ...p, title: v }))}
                maxLength={25}
                required
              />
              <CharCounterInput
                label="Eyebrow (10–40 karakter)"
                value={bidangForm.eyebrow}
                onChange={(v) => setBidangForm((p) => ({ ...p, eyebrow: v }))}
                maxLength={40}
                required
              />
              <CharCounterInput
                label="Ringkasan Kompartemen (5–50 karakter)"
                value={bidangForm.compartmentSummary}
                onChange={(v) =>
                  setBidangForm((p) => ({ ...p, compartmentSummary: v }))
                }
                maxLength={50}
                required
              />
            </div>

            <div className="mt-4">
              <CharCounterTextarea
                label="Deskripsi Bidang (50–240 karakter)"
                value={bidangForm.description}
                onChange={(v) => setBidangForm((p) => ({ ...p, description: v }))}
                maxLength={240}
                rows={3}
                required
              />
            </div>
          </form>

          {/* Compartments Accordion + Slides */}
          <div className="rounded-2xl border border-[#CBD5E1] bg-white p-6 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-[#06231D]">
                  Daftar Kompartemen &amp; Slide Program Kerja
                </h3>
                <p className="text-xs text-[#64748B]">
                  Setiap slide menggunakan foto rasio 4:5 (1080×1350 WebP).
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {(currentBidang.compartments || []).map((comp) => {
                const isOpen = expandedCompId === comp.id;
                return (
                  <div
                    key={comp.id}
                    className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-[#FFFDEE]/40"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 bg-[#F8FAFC] px-4 py-3">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedCompId(isOpen ? null : comp.id)
                        }
                        className="flex items-center gap-2 text-left text-sm font-bold text-[#06231D]"
                      >
                        {isOpen ? (
                          <ChevronDown className="h-4 w-4 text-[#076653]" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-[#64748B]" />
                        )}
                        <span>{comp.name}</span>
                        <span className="rounded-full bg-[#076653]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[#076653]">
                          {comp.operationalPattern}
                        </span>
                        <span className="text-xs font-normal text-[#64748B]">
                          ({comp.slides?.length || 0} slide)
                        </span>
                      </button>

                      <div className="flex items-center gap-2">
                        {canWrite && (
                          <button
                            type="button"
                            onClick={() =>
                              setEditingSlide({
                                compartmentId: comp.id,
                                kind:
                                  comp.operationalPattern === "jobdesk-only"
                                    ? "jobdesk"
                                    : "proker",
                                title: "",
                                description: "",
                                mediaSourceLabel: comp.name,
                                imageSrc: "",
                                imageAlt: "",
                                slotStatus: "pending-asset",
                                sortOrder: (comp.slides?.length || 0) + 1,
                                hasNewImage: false,
                              })
                            }
                            className="inline-flex items-center gap-1 rounded-lg bg-[#076653] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#06231D]"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Tambah Slide
                          </button>
                        )}
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => void handleDeleteCompartment(comp)}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {isOpen && (
                      <div className="space-y-3 p-4">
                        {(!comp.slides || comp.slides.length === 0) && (
                          <p className="text-xs text-[#64748B]">
                            Belum ada slide pada kompartemen ini.
                          </p>
                        )}
                        <div className="grid gap-3 md:grid-cols-2">
                          {(comp.slides || []).map((slide) => (
                            <div
                              key={slide.id}
                              className="flex gap-3 rounded-xl border border-[#CBD5E1] bg-white p-3"
                            >
                              <div className="h-24 w-20 shrink-0 overflow-hidden rounded-lg border border-[#E2E8F0] bg-[#F1F5F9]">
                                {slide.imageSrc ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={slide.imageSrc}
                                    alt={slide.imageAlt || slide.title}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full items-center justify-center text-[10px] text-[#64748B]">
                                    4:5
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="rounded bg-[#06231D] px-1.5 py-0.5 text-[10px] font-bold uppercase text-[#E3EF26]">
                                    {slide.kind}
                                  </span>
                                  <span
                                    className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                                      slide.slotStatus === "ready"
                                        ? "bg-emerald-50 text-emerald-700"
                                        : "bg-amber-50 text-amber-700"
                                    }`}
                                  >
                                    {slide.slotStatus}
                                  </span>
                                </div>
                                <h4 className="mt-1 truncate text-sm font-bold text-[#06231D]">
                                  {slide.title}
                                </h4>
                                <p className="mt-0.5 line-clamp-2 text-xs text-[#64748B]">
                                  {slide.description}
                                </p>
                                <div className="mt-2 flex items-center gap-2">
                                  {canWrite && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setEditingSlide({
                                          compartmentId: comp.id,
                                          slideId: slide.id,
                                          kind: slide.kind,
                                          title: slide.title,
                                          description: slide.description,
                                          mediaSourceLabel:
                                            slide.mediaSourceLabel || comp.name,
                                          imageSrc: slide.imageSrc || "",
                                          imageAlt: slide.imageAlt || "",
                                          slotStatus: slide.slotStatus,
                                          sortOrder: slide.sortOrder,
                                          hasNewImage: false,
                                        })
                                      }
                                      className="rounded-lg border border-[#CBD5E1] px-2.5 py-1 text-xs font-semibold text-[#06231D] hover:bg-[#F8FAFC]"
                                    >
                                      Edit
                                    </button>
                                  )}
                                  {canDelete && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        void handleDeleteSlide(slide)
                                      }
                                      className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-50"
                                    >
                                      Hapus
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Add Compartment Inline Form */}
            {canWrite && (
              <form
                onSubmit={handleCreateCompartment}
                className="mt-6 rounded-xl border border-dashed border-[#076653]/40 bg-[#F8FAFC] p-4"
              >
                <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#076653]">
                  + Tambah Kompartemen Baru di {currentBidang.shortName}
                </h4>
                <div className="grid gap-3 md:grid-cols-4">
                  <input
                    type="text"
                    required
                    maxLength={35}
                    placeholder="Kode (mis. kompartemen-inkubasi)"
                    value={newComp.code}
                    onChange={(e) =>
                      setNewComp((p) => ({ ...p, code: e.target.value }))
                    }
                    className="h-10 rounded-xl border border-[#CBD5E1] bg-white px-3 text-xs text-[#06231D]"
                  />
                  <input
                    type="text"
                    required
                    maxLength={35}
                    placeholder="Nama Kompartemen"
                    value={newComp.name}
                    onChange={(e) =>
                      setNewComp((p) => ({ ...p, name: e.target.value }))
                    }
                    className="h-10 rounded-xl border border-[#CBD5E1] bg-white px-3 text-xs text-[#06231D]"
                  />
                  <select
                    value={newComp.operationalPattern}
                    onChange={(e) =>
                      setNewComp((p) => ({
                        ...p,
                        operationalPattern: e.target.value as
                          | "proker-only"
                          | "jobdesk-only"
                          | "proker-jobdesk",
                      }))
                    }
                    className="h-10 rounded-xl border border-[#CBD5E1] bg-white px-3 text-xs text-[#06231D]"
                  >
                    <option value="proker-jobdesk">Proker &amp; Jobdesk</option>
                    <option value="proker-only">Proker Only</option>
                    <option value="jobdesk-only">Jobdesk Only</option>
                  </select>
                  <button
                    type="submit"
                    disabled={saving}
                    className="h-10 rounded-xl bg-[#076653] px-4 text-xs font-bold text-white hover:bg-[#06231D] disabled:opacity-50"
                  >
                    Tambah Kompartemen
                  </button>
                </div>
              </form>
            )}
          </div>
        </>
      )}

      {/* Slide Editor Modal */}
      {editingSlide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={handleSaveSlide}
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
          >
            <h3 className="text-base font-bold text-[#06231D]">
              {editingSlide.slideId ? "Edit Slide Program Kerja" : "Tambah Slide Baru"}
            </h3>
            <p className="mb-4 text-xs text-[#64748B]">
              Gunakan cropper 4:5 untuk mengunggah foto kegiatan ke Supabase Storage S3.
            </p>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#06231D]">
                    Jenis Slide
                  </label>
                  <select
                    value={editingSlide.kind}
                    onChange={(e) =>
                      setEditingSlide((p) =>
                        p
                          ? {
                              ...p,
                              kind: e.target.value as "proker" | "jobdesk",
                            }
                          : p
                      )
                    }
                    className="h-10 w-full rounded-xl border border-[#CBD5E1] px-3 text-xs text-[#06231D]"
                  >
                    <option value="proker">Program Kerja (proker)</option>
                    <option value="jobdesk">Jobdesk (jobdesk)</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#06231D]">
                    Status Aset
                  </label>
                  <select
                    value={editingSlide.slotStatus}
                    onChange={(e) =>
                      setEditingSlide((p) =>
                        p
                          ? {
                              ...p,
                              slotStatus: e.target.value as
                                | "ready"
                                | "pending-asset",
                            }
                          : p
                      )
                    }
                    className="h-10 w-full rounded-xl border border-[#CBD5E1] px-3 text-xs text-[#06231D]"
                  >
                    <option value="ready">Ready</option>
                    <option value="pending-asset">Pending Asset</option>
                  </select>
                </div>
              </div>

              <CharCounterInput
                label="Judul Slide (4–45 karakter)"
                value={editingSlide.title}
                onChange={(v) =>
                  setEditingSlide((p) => (p ? { ...p, title: v } : p))
                }
                maxLength={45}
                required
              />

              <CharCounterTextarea
                label="Deskripsi Slide (40–200 karakter)"
                value={editingSlide.description}
                onChange={(v) =>
                  setEditingSlide((p) => (p ? { ...p, description: v } : p))
                }
                maxLength={200}
                rows={3}
                required
              />

              <CharCounterInput
                label="Label Sumber Media (maks 50 karakter)"
                value={editingSlide.mediaSourceLabel}
                onChange={(v) =>
                  setEditingSlide((p) =>
                    p ? { ...p, mediaSourceLabel: v } : p
                  )
                }
                maxLength={50}
              />

              <div className="rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-[#06231D]">
                      Foto Slide (4:5 Portrait)
                    </p>
                    <p className="truncate text-[11px] text-[#64748B]">
                      {editingSlide.imageSrc || "Belum ada foto terunggah"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      onOpenCropper(
                        "program-kerja",
                        editingSlide.imageAlt || editingSlide.title,
                        (res) =>
                          setEditingSlide((p) =>
                            p
                              ? {
                                  ...p,
                                  imageSrc: res.url,
                                  imageAlt: res.imageAlt || p.imageAlt,
                                  slotStatus: "ready",
                                  hasNewImage: true,
                                }
                              : p
                          )
                      )
                    }
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#076653] px-3 py-2 text-xs font-bold text-white hover:bg-[#06231D]"
                  >
                    <ImagePlus className="h-4 w-4" />
                    Crop &amp; Upload 4:5
                  </button>
                </div>
              </div>

              <CharCounterInput
                label="Alt Text Gambar (10–140 karakter, opsional)"
                value={editingSlide.imageAlt}
                onChange={(v) =>
                  setEditingSlide((p) => (p ? { ...p, imageAlt: v } : p))
                }
                maxLength={140}
              />
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingSlide(null)}
                className="rounded-xl border border-[#CBD5E1] px-4 py-2 text-xs font-bold text-[#475569] hover:bg-[#F8FAFC]"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-[#E3EF26] px-5 py-2 text-xs font-bold text-[#06231D] hover:brightness-95 disabled:opacity-50"
              >
                {saving ? "Menyimpan..." : "Simpan Slide"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Section 8: Site Settings & Header Info Berita (Announcements)
// ============================================================================

interface SiteSettingsData {
  secretariatAddress: string;
  officialEmail: string;
  officialInstagram: string;
  whatsappContactLabel: string;
  whatsappContactUrl: string;
  copyrightText: string;
  ctaCollaborationHref: string;
  ctaBusinessHref: string;
  ctaAchievementHref: string;
  googleDocsTemplateUrl: string;
}

interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  targetAudience: "INTERNAL" | "PUBLIC" | "BOTH";
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export function SiteSettingsAnnouncementsSection({
  canWrite,
  canDelete,
  onNotify,
}: CmsSectionCommonProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState<SiteSettingsData>({
    secretariatAddress: "",
    officialEmail: "",
    officialInstagram: "",
    whatsappContactLabel: "",
    whatsappContactUrl: "",
    copyrightText: "",
    ctaCollaborationHref: "",
    ctaBusinessHref: "",
    ctaAchievementHref: "",
    googleDocsTemplateUrl: "",
  });

  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [editingAnn, setEditingAnn] = useState<{
    id?: string;
    title: string;
    content: string;
    targetAudience: "INTERNAL" | "PUBLIC" | "BOTH";
    startDate: string;
    endDate: string;
    isActive: boolean;
  } | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [settingsRes, annRes] = await Promise.all([
        apiRequest<{ data?: Partial<SiteSettingsData> } & Partial<SiteSettingsData>>(
          "/api/cms/settings"
        ),
        apiRequest<{ data?: AnnouncementItem[] } | AnnouncementItem[]>(
          "/api/cms/announcements"
        ),
      ]);

      const s = settingsRes.data ? settingsRes.data : settingsRes;
      setSettings({
        secretariatAddress: s.secretariatAddress || "",
        officialEmail: s.officialEmail || "",
        officialInstagram: s.officialInstagram || "",
        whatsappContactLabel: s.whatsappContactLabel || "",
        whatsappContactUrl: s.whatsappContactUrl || "",
        copyrightText: s.copyrightText || "",
        ctaCollaborationHref: s.ctaCollaborationHref || "/partnership",
        ctaBusinessHref: s.ctaBusinessHref || "/bisnis-kader",
        ctaAchievementHref: s.ctaAchievementHref || "/prestasi",
        googleDocsTemplateUrl: s.googleDocsTemplateUrl || "",
      });

      const list = Array.isArray(annRes) ? annRes : annRes.data || [];
      setAnnouncements(list);
    } catch (err) {
      onNotify(
        err instanceof Error ? err.message : "Gagal memuat Site Settings",
        true
      );
    } finally {
      setLoading(false);
    }
  }, [onNotify]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canWrite) return;
    setSaving(true);
    try {
      await apiRequest("/api/cms/settings", {
        method: "PATCH",
        body: JSON.stringify({
          ...settings,
          googleDocsTemplateUrl: settings.googleDocsTemplateUrl.trim()
            ? settings.googleDocsTemplateUrl.trim()
            : null,
        }),
      });
      onNotify("Site Settings tersimpan & memicu revalidasi Web UKM Profile.");
      await loadAll();
    } catch (err) {
      onNotify(
        err instanceof Error ? err.message : "Gagal menyimpan Site Settings",
        true
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAnn || !canWrite) return;
    setSaving(true);
    try {
      const payload = {
        title: editingAnn.title,
        content: editingAnn.content,
        targetAudience: editingAnn.targetAudience,
        startDate: new Date(editingAnn.startDate).toISOString(),
        endDate: new Date(editingAnn.endDate).toISOString(),
        isActive: editingAnn.isActive,
      };
      if (editingAnn.id) {
        await apiRequest(`/api/cms/announcements/${editingAnn.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        onNotify("Info berita berhasil diperbarui.");
      } else {
        await apiRequest("/api/cms/announcements", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        onNotify("Info berita baru berhasil dipublikasikan.");
      }
      setEditingAnn(null);
      await loadAll();
    } catch (err) {
      onNotify(
        err instanceof Error ? err.message : "Gagal menyimpan info berita",
        true
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAnnouncement = async (item: AnnouncementItem) => {
    if (!canDelete) return;
    if (!window.confirm(`Hapus info berita "${item.title}"?`)) return;
    setSaving(true);
    try {
      await apiRequest(`/api/cms/announcements/${item.id}`, {
        method: "DELETE",
      });
      onNotify("Info berita dihapus.");
      await loadAll();
    } catch (err) {
      onNotify(
        err instanceof Error ? err.message : "Gagal menghapus info berita",
        true
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-[#CBD5E1] bg-white p-8 text-sm text-[#64748B]">
        Memuat Site Settings &amp; Header Info Berita...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Site Settings Card */}
      <form
        onSubmit={handleSaveSettings}
        className="rounded-2xl border border-[#CBD5E1] bg-white p-6 shadow-sm"
      >
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#076653]/10 text-[#076653]">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#06231D]">
                Global Site Settings &amp; Kontak Footer
              </h3>
              <p className="text-xs text-[#64748B]">
                Perubahan langsung menyinkronkan Footer, Kontak WA, dan Google Docs Template.
              </p>
            </div>
          </div>

          {canWrite && (
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-[#E3EF26] px-4 py-2.5 text-xs font-bold text-[#06231D] hover:brightness-95 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? "Menyimpan..." : "Simpan Site Settings"}
            </button>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <CharCounterInput
            label="Alamat Sekretariat (10–150 karakter)"
            value={settings.secretariatAddress}
            onChange={(v) =>
              setSettings((p) => ({ ...p, secretariatAddress: v }))
            }
            maxLength={150}
            required
          />
          <CharCounterInput
            label="Email Resmi (maks 80 karakter)"
            value={settings.officialEmail}
            onChange={(v) => setSettings((p) => ({ ...p, officialEmail: v }))}
            maxLength={80}
            required
          />
          <CharCounterInput
            label="Instagram Resmi (1–40 karakter)"
            value={settings.officialInstagram}
            onChange={(v) =>
              setSettings((p) => ({ ...p, officialInstagram: v }))
            }
            maxLength={40}
            required
          />
          <CharCounterInput
            label="Label Tombol WhatsApp (1–60 karakter)"
            value={settings.whatsappContactLabel}
            onChange={(v) =>
              setSettings((p) => ({ ...p, whatsappContactLabel: v }))
            }
            maxLength={60}
            required
          />
          <div>
            <label className="mb-1.5 block text-xs font-bold text-[#06231D]">
              URL Kontak WhatsApp
            </label>
            <input
              type="url"
              required
              value={settings.whatsappContactUrl}
              onChange={(e) =>
                setSettings((p) => ({
                  ...p,
                  whatsappContactUrl: e.target.value,
                }))
              }
              className="h-11 w-full rounded-xl border border-[#CBD5E1] px-3.5 text-sm text-[#06231D]"
            />
          </div>
          <CharCounterInput
            label="Teks Copyright (1–80 karakter)"
            value={settings.copyrightText}
            onChange={(v) => setSettings((p) => ({ ...p, copyrightText: v }))}
            maxLength={80}
            required
          />
          <div>
            <label className="mb-1.5 block text-xs font-bold text-[#06231D]">
              Link CTA Kolaborasi
            </label>
            <input
              type="text"
              required
              value={settings.ctaCollaborationHref}
              onChange={(e) =>
                setSettings((p) => ({
                  ...p,
                  ctaCollaborationHref: e.target.value,
                }))
              }
              className="h-11 w-full rounded-xl border border-[#CBD5E1] px-3.5 text-sm text-[#06231D]"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold text-[#06231D]">
              Link CTA Bisnis Kader
            </label>
            <input
              type="text"
              required
              value={settings.ctaBusinessHref}
              onChange={(e) =>
                setSettings((p) => ({ ...p, ctaBusinessHref: e.target.value }))
              }
              className="h-11 w-full rounded-xl border border-[#CBD5E1] px-3.5 text-sm text-[#06231D]"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold text-[#06231D]">
              Link CTA Prestasi
            </label>
            <input
              type="text"
              required
              value={settings.ctaAchievementHref}
              onChange={(e) =>
                setSettings((p) => ({
                  ...p,
                  ctaAchievementHref: e.target.value,
                }))
              }
              className="h-11 w-full rounded-xl border border-[#CBD5E1] px-3.5 text-sm text-[#06231D]"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold text-[#06231D]">
              URL Template Surat Google Docs (Opsional)
            </label>
            <input
              type="url"
              placeholder="https://docs.google.com/..."
              value={settings.googleDocsTemplateUrl}
              onChange={(e) =>
                setSettings((p) => ({
                  ...p,
                  googleDocsTemplateUrl: e.target.value,
                }))
              }
              className="h-11 w-full rounded-xl border border-[#CBD5E1] px-3.5 text-sm text-[#06231D]"
            />
          </div>
        </div>
      </form>

      {/* Announcements / Header Info Berita Card */}
      <div className="rounded-2xl border border-[#CBD5E1] bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E3EF26]/40 text-[#06231D]">
              <Megaphone className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#06231D]">
                Header Info Berita (Ticker Web UKM &amp; Pengumuman)
              </h3>
              <p className="text-xs text-[#64748B]">
                Target <code>PUBLIC</code> atau <code>BOTH</code> tampil di ticker INFO TERKINI pada Navbar Web UKM.
              </p>
            </div>
          </div>

          {canWrite && (
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                const nextWeek = new Date(now.getTime() + 7 * 86400000);
                setEditingAnn({
                  title: "",
                  content: "",
                  targetAudience: "PUBLIC",
                  startDate: now.toISOString().slice(0, 16),
                  endDate: nextWeek.toISOString().slice(0, 16),
                  isActive: true,
                });
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#076653] px-4 py-2 text-xs font-bold text-white hover:bg-[#06231D]"
            >
              <Plus className="h-4 w-4" />
              Tambah Info Berita
            </button>
          )}
        </div>

        <div className="space-y-3">
          {announcements.length === 0 && (
            <p className="text-xs text-[#64748B]">
              Belum ada info berita atau pengumuman terjadwal.
            </p>
          )}
          {announcements.map((ann) => (
            <div
              key={ann.id}
              className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-[#06231D] px-2 py-0.5 text-[10px] font-bold text-[#E3EF26]">
                    {ann.targetAudience}
                  </span>
                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                      ann.isActive
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {ann.isActive ? "Aktif" : "Nonaktif"}
                  </span>
                  <span className="text-[11px] text-[#64748B]">
                    {new Date(ann.startDate).toLocaleDateString("id-ID")} –{" "}
                    {new Date(ann.endDate).toLocaleDateString("id-ID")}
                  </span>
                </div>
                <h4 className="mt-1.5 text-sm font-bold text-[#06231D]">
                  {ann.title}
                </h4>
                <p className="mt-0.5 text-xs text-[#475569]">{ann.content}</p>
              </div>
              <div className="flex items-center gap-2">
                {canWrite && (
                  <button
                    type="button"
                    onClick={() =>
                      setEditingAnn({
                        id: ann.id,
                        title: ann.title,
                        content: ann.content,
                        targetAudience: ann.targetAudience,
                        startDate: new Date(ann.startDate)
                          .toISOString()
                          .slice(0, 16),
                        endDate: new Date(ann.endDate)
                          .toISOString()
                          .slice(0, 16),
                        isActive: ann.isActive,
                      })
                    }
                    className="rounded-lg border border-[#CBD5E1] bg-white px-3 py-1.5 text-xs font-semibold text-[#06231D] hover:bg-[#F1F5F9]"
                  >
                    Edit
                  </button>
                )}
                {canDelete && (
                  <button
                    type="button"
                    onClick={() => void handleDeleteAnnouncement(ann)}
                    className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
                  >
                    Hapus
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Announcement Modal */}
      {editingAnn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={handleSaveAnnouncement}
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
          >
            <h3 className="mb-4 text-base font-bold text-[#06231D]">
              {editingAnn.id ? "Edit Info Berita" : "Tambah Info Berita"}
            </h3>
            <div className="space-y-4">
              <CharCounterInput
                label="Judul Info Berita (5–120 karakter)"
                value={editingAnn.title}
                onChange={(v) =>
                  setEditingAnn((p) => (p ? { ...p, title: v } : p))
                }
                maxLength={120}
                required
              />
              <CharCounterTextarea
                label="Isi Berita (10–2000 karakter)"
                value={editingAnn.content}
                onChange={(v) =>
                  setEditingAnn((p) => (p ? { ...p, content: v } : p))
                }
                maxLength={2000}
                rows={4}
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-bold text-[#06231D]">
                    Target Audiens
                  </label>
                  <select
                    value={editingAnn.targetAudience}
                    onChange={(e) =>
                      setEditingAnn((p) =>
                        p
                          ? {
                              ...p,
                              targetAudience: e.target.value as
                                | "INTERNAL"
                                | "PUBLIC"
                                | "BOTH",
                            }
                          : p
                      )
                    }
                    className="h-10 w-full rounded-xl border border-[#CBD5E1] px-3 text-xs text-[#06231D]"
                  >
                    <option value="PUBLIC">PUBLIC (Web UKM)</option>
                    <option value="BOTH">BOTH (Web UKM &amp; ERP)</option>
                    <option value="INTERNAL">INTERNAL (ERP Only)</option>
                  </select>
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex cursor-pointer items-center gap-2 text-xs font-bold text-[#06231D]">
                    <input
                      type="checkbox"
                      checked={editingAnn.isActive}
                      onChange={(e) =>
                        setEditingAnn((p) =>
                          p ? { ...p, isActive: e.target.checked } : p
                        )
                      }
                      className="h-4 w-4 accent-[#076653]"
                    />
                    Aktif Ditampilkan
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-bold text-[#06231D]">
                    Mulai Tayang
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={editingAnn.startDate}
                    onChange={(e) =>
                      setEditingAnn((p) =>
                        p ? { ...p, startDate: e.target.value } : p
                      )
                    }
                    className="h-10 w-full rounded-xl border border-[#CBD5E1] px-3 text-xs text-[#06231D]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-[#06231D]">
                    Berakhir Tayang
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={editingAnn.endDate}
                    onChange={(e) =>
                      setEditingAnn((p) =>
                        p ? { ...p, endDate: e.target.value } : p
                      )
                    }
                    className="h-10 w-full rounded-xl border border-[#CBD5E1] px-3 text-xs text-[#06231D]"
                  />
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingAnn(null)}
                className="rounded-xl border border-[#CBD5E1] px-4 py-2 text-xs font-bold text-[#475569]"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-[#E3EF26] px-5 py-2 text-xs font-bold text-[#06231D] disabled:opacity-50"
              >
                {saving ? "Menyimpan..." : "Simpan Info Berita"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
