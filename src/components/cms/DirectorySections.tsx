"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, Plus, Scissors, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/api";
import {
  CharCounterInput,
  CharCounterTextarea,
} from "@/components/CharCounterField";
import type { CmsSectionCommonProps } from "./HeroTentangSections";

const PARTNER_CATEGORIES = [
  "Korporasi & BUMN",
  "Asosiasi & HIPMI",
  "Dinas & Inkubator",
  "Komunitas & Media",
  "Mitra Strategis",
] as const;

const BUSINESS_SECTORS = [
  "Teknologi & Jasa",
  "Kuliner / F&B",
  "Kreatif & Media",
  "Fesyen & Ritel",
] as const;

const ACHIEVEMENT_CATEGORIES = [
  "Kompetisi Bisnis",
  "Pendanaan & Hibah",
  "Tingkat Nasional",
  "Rekognisi",
] as const;

export function PartnersSection({
  canWrite,
  canDelete,
  onNotify,
  onOpenCropper,
}: CmsSectionCommonProps) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>(PARTNER_CATEGORIES[0]);
  const [scope, setScope] = useState("");
  const [period, setPeriod] = useState("Periode 2026");
  const [status, setStatus] = useState("Mitra Aktif");
  const [imageSrc, setImageSrc] = useState("");
  const [imageAlt, setImageAlt] = useState("");
  const [isPublished, setIsPublished] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<any[]>("/api/cms/partners");
      setItems(data);
      if (data.length > 0 && !selectedId) selectItem(data[0]);
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

  const selectItem = (it: any) => {
    setSelectedId(it.id);
    setName(it.name || "");
    setCategory(it.category || PARTNER_CATEGORIES[0]);
    setScope(it.scope || "");
    setPeriod(it.period || "");
    setStatus(it.status || "");
    setImageSrc(it.imageSrc || "");
    setImageAlt(it.imageAlt || "");
    setIsPublished(Boolean(it.isPublished));
  };

  const reset = () => {
    setSelectedId(null);
    setName("");
    setCategory(PARTNER_CATEGORIES[0]);
    setScope("");
    setPeriod("Periode 2026");
    setStatus("Mitra Aktif");
    setImageSrc("");
    setImageAlt("");
    setIsPublished(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = {
        name,
        category,
        scope,
        period,
        status,
        imageAlt,
        isPublished,
      };
      if (imageSrc.startsWith("http")) payload.imageSrc = imageSrc;
      if (selectedId) {
        await apiRequest(`/api/cms/partners/${selectedId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        onNotify("Data mitra diperbarui & Web UKM direvalidasi.");
      } else {
        const created = await apiRequest<any>("/api/cms/partners", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setSelectedId(created.id);
        onNotify("Mitra baru ditambahkan & Web UKM direvalidasi.");
      }
      await load();
    } catch (err: any) {
      onNotify(err.message, true);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus mitra ini?")) return;
    try {
      await apiRequest(`/api/cms/partners/${id}`, { method: "DELETE" });
      if (selectedId === id) reset();
      onNotify("Mitra dihapus.");
      await load();
    } catch (err: any) {
      onNotify(err.message, true);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <div className="space-y-3 rounded-[10px] border border-[#D4E4DC] bg-white p-5 lg:col-span-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-sm font-extrabold text-[#06231D]">
            Partnerships ({items.length})
          </h2>
          {canWrite ? (
            <button
              type="button"
              onClick={reset}
              className="inline-flex min-h-[38px] cursor-pointer items-center gap-1 rounded-[6px] bg-[#E3EF26] px-3 font-display text-xs font-bold text-[#06231D]"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Tambah Mitra</span>
            </button>
          ) : null}
        </div>
        {loading ? (
          <div className="h-32 animate-pulse rounded bg-[#F1F5F9]" />
        ) : (
          <div className="space-y-2">
            {items.map((it) => (
              <div
                key={it.id}
                onClick={() => selectItem(it)}
                className={`flex cursor-pointer items-center justify-between rounded-[8px] border p-3 ${
                  selectedId === it.id
                    ? "border-[#076653] bg-[#E2FBCE]/50"
                    : "border-[#D4E4DC] bg-[#FFFDEE]"
                }`}
              >
                <div className="min-w-0">
                  <p className="truncate font-display text-xs font-bold text-[#06231D]">
                    {it.name}
                  </p>
                  <p className="truncate text-[11px] text-[#2F4F46]">
                    {it.category} • {it.status}
                  </p>
                </div>
                {canDelete ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(it.id);
                    }}
                    className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded text-[#991B1B] hover:bg-[#FEE2E2]"
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
          {selectedId ? "Edit Mitra" : "Tambah Mitra Baru"}
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <CharCounterInput
            label="Nama Lembaga Mitra"
            value={name}
            onChange={setName}
            maxLength={35}
            required
          />
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#06231D]">
              Kategori (Strict Enum)
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="min-h-[42px] w-full rounded-[6px] border border-[#D4E4DC] bg-[#FFFDEE] px-3 text-sm"
            >
              {PARTNER_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
        <CharCounterTextarea
          label="Ruang Lingkup Kolaborasi (scope)"
          value={scope}
          onChange={setScope}
          maxLength={160}
          required
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <CharCounterInput
            label="Periode MoU"
            value={period}
            onChange={setPeriod}
            maxLength={60}
            required
          />
          <CharCounterInput
            label="Status"
            value={status}
            onChange={setStatus}
            maxLength={30}
            required
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[8px] border border-[#D4E4DC] bg-[#FFFDEE] p-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-[#06231D]">
              Logo / Emblem Mitra (1:1 Square)
            </p>
            <p className="max-w-xs truncate text-[11px] text-[#2F4F46]">
              {imageSrc || "Opsional — default placeholder"}
            </p>
          </div>
          {canWrite ? (
            <button
              type="button"
              onClick={() =>
                onOpenCropper("partnership", imageAlt, (res) => {
                  setImageSrc(res.url);
                  setImageAlt(res.imageAlt);
                })
              }
              className="inline-flex min-h-[38px] cursor-pointer items-center gap-1.5 rounded-[6px] bg-[#076653] px-4 font-display text-xs font-bold text-[#FFFDEE]"
            >
              <Scissors className="h-3.5 w-3.5" />
              <span>Crop &amp; Upload 1:1</span>
            </button>
          ) : null}
        </div>
        <CharCounterInput
          label="Alt Text Logo Mitra"
          value={imageAlt}
          onChange={setImageAlt}
          maxLength={140}
          required
        />
        <label className="flex min-h-[40px] cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
            className="h-4 w-4 accent-[#076653]"
          />
          <span className="text-xs font-semibold text-[#06231D]">
            Publikasikan ke Web
          </span>
        </label>
        {canWrite ? (
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex min-h-[44px] cursor-pointer items-center rounded-[6px] bg-[#E3EF26] px-6 font-display text-xs font-bold text-[#06231D]"
            >
              {saving ? "Menyimpan..." : "Simpan Mitra & Sinkron Web"}
            </button>
          </div>
        ) : null}
      </form>
    </div>
  );
}

export function BisnisKaderSection({
  canWrite,
  canDelete,
  onNotify,
  onOpenCropper,
}: CmsSectionCommonProps) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState("");
  const [sector, setSector] = useState<string>(BUSINESS_SECTORS[0]);
  const [description, setDescription] = useState("");
  const [ownerLabel, setOwnerLabel] = useState("");
  const [verifiedLabel, setVerifiedLabel] = useState(
    "Terverifikasi Pengurus 2026"
  );
  const [imageSrc, setImageSrc] = useState("");
  const [imageAlt, setImageAlt] = useState("");
  const [slotStatus, setSlotStatus] = useState<"ready" | "pending-asset">(
    "ready"
  );
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<any[]>("/api/cms/kader-businesses");
      setItems(data);
      if (data.length > 0 && !selectedId) selectItem(data[0]);
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

  const selectItem = (it: any) => {
    setSelectedId(it.id);
    setBusinessName(it.businessName || "");
    setSector(it.sector || BUSINESS_SECTORS[0]);
    setDescription(it.description || "");
    setOwnerLabel(it.ownerLabel || "");
    setVerifiedLabel(it.verifiedLabel || "");
    setImageSrc(it.imageSrc || "");
    setImageAlt(it.imageAlt || "");
    setSlotStatus(it.slotStatus || "pending-asset");
  };

  const reset = () => {
    setSelectedId(null);
    setBusinessName("");
    setSector(BUSINESS_SECTORS[0]);
    setDescription("");
    setOwnerLabel("");
    setVerifiedLabel("Terverifikasi Pengurus 2026");
    setImageSrc("");
    setImageAlt("");
    setSlotStatus("pending-asset");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = {
        businessName,
        sector,
        description,
        ownerLabel,
        verifiedLabel,
        slotStatus,
        isPublished: true,
      };
      if (imageAlt.trim()) payload.imageAlt = imageAlt.trim();
      if (imageSrc.startsWith("http")) {
        payload.imageSrc = imageSrc;
        payload.imageUrl = imageSrc;
      }
      if (selectedId) {
        await apiRequest(`/api/cms/kader-businesses/${selectedId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        onNotify("Bisnis kader diperbarui & Web UKM direvalidasi.");
      } else {
        const created = await apiRequest<any>("/api/cms/kader-businesses", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setSelectedId(created.id);
        onNotify("Bisnis kader ditambahkan & Web UKM direvalidasi.");
      }
      await load();
    } catch (err: any) {
      onNotify(err.message, true);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus entitas bisnis kader ini?")) return;
    try {
      await apiRequest(`/api/cms/kader-businesses/${id}`, {
        method: "DELETE",
      });
      if (selectedId === id) reset();
      onNotify("Bisnis kader dihapus.");
      await load();
    } catch (err: any) {
      onNotify(err.message, true);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <div className="space-y-3 rounded-[10px] border border-[#D4E4DC] bg-white p-5 lg:col-span-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-sm font-extrabold text-[#06231D]">
            Bisnis Kader ({items.length})
          </h2>
          {canWrite ? (
            <button
              type="button"
              onClick={reset}
              className="inline-flex min-h-[38px] cursor-pointer items-center gap-1 rounded-[6px] bg-[#E3EF26] px-3 font-display text-xs font-bold text-[#06231D]"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Tambah Usaha</span>
            </button>
          ) : null}
        </div>
        {loading ? (
          <div className="h-32 animate-pulse rounded bg-[#F1F5F9]" />
        ) : (
          <div className="space-y-2">
            {items.map((it) => (
              <div
                key={it.id}
                onClick={() => selectItem(it)}
                className={`flex cursor-pointer items-center justify-between rounded-[8px] border p-3 ${
                  selectedId === it.id
                    ? "border-[#076653] bg-[#E2FBCE]/50"
                    : "border-[#D4E4DC] bg-[#FFFDEE]"
                }`}
              >
                <div className="min-w-0">
                  <p className="truncate font-display text-xs font-bold text-[#06231D]">
                    {it.businessName}
                  </p>
                  <p className="truncate text-[11px] text-[#2F4F46]">
                    {it.sector} • {it.slotStatus}
                  </p>
                </div>
                {canDelete ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(it.id);
                    }}
                    className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded text-[#991B1B] hover:bg-[#FEE2E2]"
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
          {selectedId ? "Edit Bisnis Kader" : "Tambah Bisnis Kader"}
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <CharCounterInput
            label="Nama Usaha / Brand"
            value={businessName}
            onChange={setBusinessName}
            maxLength={45}
            required
          />
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#06231D]">
              Sektor Usaha
            </label>
            <select
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              className="min-h-[42px] w-full rounded-[6px] border border-[#D4E4DC] bg-[#FFFDEE] px-3 text-sm"
            >
              {BUSINESS_SECTORS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
        <CharCounterTextarea
          label="Deskripsi Usaha (Inti usaha di 110 karakter awal)"
          value={description}
          onChange={setDescription}
          maxLength={180}
          required
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <CharCounterInput
            label="Label Pemilik (ownerLabel)"
            value={ownerLabel}
            onChange={setOwnerLabel}
            maxLength={45}
            required
          />
          <CharCounterInput
            label="Label Verifikasi"
            value={verifiedLabel}
            onChange={setVerifiedLabel}
            maxLength={40}
            required
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[8px] border border-[#D4E4DC] bg-[#FFFDEE] p-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-[#06231D]">
              Foto Produk / Usaha (4:3) • Status: {slotStatus}
            </p>
            <p className="max-w-xs truncate text-[11px] text-[#2F4F46]">
              {imageSrc || "pending-asset (Placeholder resmi)"}
            </p>
          </div>
          {canWrite ? (
            <button
              type="button"
              onClick={() =>
                onOpenCropper("bisnis-kader", imageAlt, (res) => {
                  setImageSrc(res.url);
                  setImageAlt(res.imageAlt);
                  setSlotStatus("ready");
                })
              }
              className="inline-flex min-h-[38px] cursor-pointer items-center gap-1.5 rounded-[6px] bg-[#076653] px-4 font-display text-xs font-bold text-[#FFFDEE]"
            >
              <Scissors className="h-3.5 w-3.5" />
              <span>Crop &amp; Upload 4:3</span>
            </button>
          ) : null}
        </div>
        <CharCounterInput
          label="Alt Text Foto Usaha"
          value={imageAlt}
          onChange={setImageAlt}
          maxLength={140}
        />
        {canWrite ? (
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex min-h-[44px] cursor-pointer items-center rounded-[6px] bg-[#E3EF26] px-6 font-display text-xs font-bold text-[#06231D]"
            >
              {saving ? "Menyimpan..." : "Simpan Bisnis Kader"}
            </button>
          </div>
        ) : null}
      </form>
    </div>
  );
}

export function AchievementsSection({
  canWrite,
  canDelete,
  onNotify,
  onOpenCropper,
}: CmsSectionCommonProps) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>(ACHIEVEMENT_CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [recipientLabel, setRecipientLabel] = useState("");
  const [organizerLabel, setOrganizerLabel] = useState("");
  const [imageSrc, setImageSrc] = useState("");
  const [imageAlt, setImageAlt] = useState("");
  const [slotStatus, setSlotStatus] = useState<"ready" | "pending-asset">(
    "ready"
  );
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<any[]>("/api/cms/achievements");
      setItems(data);
      if (data.length > 0 && !selectedId) selectItem(data[0]);
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

  const selectItem = (it: any) => {
    setSelectedId(it.id);
    setTitle(it.title || "");
    setCategory(it.category || ACHIEVEMENT_CATEGORIES[0]);
    setDescription(it.description || "");
    setRecipientLabel(it.recipientLabel || "");
    setOrganizerLabel(it.organizerLabel || "");
    setImageSrc(it.imageSrc || "");
    setImageAlt(it.imageAlt || "");
    setSlotStatus(it.slotStatus || "pending-asset");
  };

  const reset = () => {
    setSelectedId(null);
    setTitle("");
    setCategory(ACHIEVEMENT_CATEGORIES[0]);
    setDescription("");
    setRecipientLabel("");
    setOrganizerLabel("");
    setImageSrc("");
    setImageAlt("");
    setSlotStatus("pending-asset");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = {
        title,
        category,
        description,
        recipientLabel,
        organizerLabel,
        slotStatus,
        isPublished: true,
      };
      if (imageAlt.trim()) payload.imageAlt = imageAlt.trim();
      if (imageSrc.startsWith("http")) {
        payload.imageSrc = imageSrc;
        payload.imageUrl = imageSrc;
      }
      if (selectedId) {
        await apiRequest(`/api/cms/achievements/${selectedId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        onNotify("Prestasi diperbarui & Web UKM direvalidasi.");
      } else {
        const created = await apiRequest<any>("/api/cms/achievements", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setSelectedId(created.id);
        onNotify("Prestasi ditambahkan & Web UKM direvalidasi.");
      }
      await load();
    } catch (err: any) {
      onNotify(err.message, true);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus prestasi ini?")) return;
    try {
      await apiRequest(`/api/cms/achievements/${id}`, { method: "DELETE" });
      if (selectedId === id) reset();
      onNotify("Prestasi dihapus.");
      await load();
    } catch (err: any) {
      onNotify(err.message, true);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <div className="space-y-3 rounded-[10px] border border-[#D4E4DC] bg-white p-5 lg:col-span-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-sm font-extrabold text-[#06231D]">
            Prestasi Kader ({items.length})
          </h2>
          {canWrite ? (
            <button
              type="button"
              onClick={reset}
              className="inline-flex min-h-[38px] cursor-pointer items-center gap-1 rounded-[6px] bg-[#E3EF26] px-3 font-display text-xs font-bold text-[#06231D]"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Tambah Prestasi</span>
            </button>
          ) : null}
        </div>
        {loading ? (
          <div className="h-32 animate-pulse rounded bg-[#F1F5F9]" />
        ) : (
          <div className="space-y-2">
            {items.map((it) => (
              <div
                key={it.id}
                onClick={() => selectItem(it)}
                className={`flex cursor-pointer items-center justify-between rounded-[8px] border p-3 ${
                  selectedId === it.id
                    ? "border-[#076653] bg-[#E2FBCE]/50"
                    : "border-[#D4E4DC] bg-[#FFFDEE]"
                }`}
              >
                <div className="min-w-0">
                  <p className="truncate font-display text-xs font-bold text-[#06231D]">
                    {it.title}
                  </p>
                  <p className="truncate text-[11px] text-[#2F4F46]">
                    {it.category} • {it.slotStatus}
                  </p>
                </div>
                {canDelete ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(it.id);
                    }}
                    className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded text-[#991B1B] hover:bg-[#FEE2E2]"
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
          {selectedId ? "Edit Prestasi" : "Tambah Prestasi Baru"}
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <CharCounterInput
            label="Judul Prestasi"
            value={title}
            onChange={setTitle}
            maxLength={55}
            required
          />
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#06231D]">
              Kategori
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="min-h-[42px] w-full rounded-[6px] border border-[#D4E4DC] bg-[#FFFDEE] px-3 text-sm"
            >
              {ACHIEVEMENT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
        <CharCounterTextarea
          label="Deskripsi Pencapaian"
          value={description}
          onChange={setDescription}
          maxLength={180}
          required
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <CharCounterInput
            label="Nama Peraih (recipientLabel)"
            value={recipientLabel}
            onChange={setRecipientLabel}
            maxLength={50}
            required
          />
          <CharCounterInput
            label="Penyelenggara & Tahun"
            value={organizerLabel}
            onChange={setOrganizerLabel}
            maxLength={55}
            required
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[8px] border border-[#D4E4DC] bg-[#FFFDEE] p-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-[#06231D]">
              Foto Dokumentasi (4:3) • Status: {slotStatus}
            </p>
            <p className="max-w-xs truncate text-[11px] text-[#2F4F46]">
              {imageSrc || "pending-asset (Placeholder resmi)"}
            </p>
          </div>
          {canWrite ? (
            <button
              type="button"
              onClick={() =>
                onOpenCropper("prestasi", imageAlt, (res) => {
                  setImageSrc(res.url);
                  setImageAlt(res.imageAlt);
                  setSlotStatus("ready");
                })
              }
              className="inline-flex min-h-[38px] cursor-pointer items-center gap-1.5 rounded-[6px] bg-[#076653] px-4 font-display text-xs font-bold text-[#FFFDEE]"
            >
              <Scissors className="h-3.5 w-3.5" />
              <span>Crop &amp; Upload 4:3</span>
            </button>
          ) : null}
        </div>
        <CharCounterInput
          label="Alt Text Dokumentasi"
          value={imageAlt}
          onChange={setImageAlt}
          maxLength={140}
        />
        {canWrite ? (
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex min-h-[44px] cursor-pointer items-center rounded-[6px] bg-[#E3EF26] px-6 font-display text-xs font-bold text-[#06231D]"
            >
              {saving ? "Menyimpan..." : "Simpan Prestasi"}
            </button>
          </div>
        ) : null}
      </form>
    </div>
  );
}

export function TestimonialsSection({
  canWrite,
  canDelete,
  canApprove,
  onNotify,
}: CmsSectionCommonProps) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [category, setCategory] = useState<"Kader & Alumni" | "Mitra Kolaborasi">(
    "Kader & Alumni"
  );
  const [quote, setQuote] = useState("");
  const [authorLabel, setAuthorLabel] = useState("");
  const [roleOrOrg, setRoleOrOrg] = useState("");
  const [verified, setVerified] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<any[]>("/api/cms/testimonials");
      setItems(data);
      if (data.length > 0 && !selectedId) selectItem(data[0]);
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

  const selectItem = (it: any) => {
    setSelectedId(it.id);
    setCategory(it.category || "Kader & Alumni");
    setQuote(it.quote || "");
    setAuthorLabel(it.authorLabel || "");
    setRoleOrOrg(it.roleOrOrg || "");
    setVerified(Boolean(it.verified));
  };

  const reset = () => {
    setSelectedId(null);
    setCategory("Kader & Alumni");
    setQuote("");
    setAuthorLabel("");
    setRoleOrOrg("");
    setVerified(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        category,
        quote,
        authorLabel,
        roleOrOrg,
        verified,
        isPublished: true,
      };
      if (selectedId) {
        await apiRequest(`/api/cms/testimonials/${selectedId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        onNotify("Testimoni diperbarui & Web UKM direvalidasi.");
      } else {
        const created = await apiRequest<any>("/api/cms/testimonials", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setSelectedId(created.id);
        onNotify("Testimoni baru ditambahkan.");
      }
      await load();
    } catch (err: any) {
      onNotify(err.message, true);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleVerify = async (it: any) => {
    try {
      await apiRequest(`/api/cms/testimonials/${it.id}/verify`, {
        method: "PATCH",
        body: JSON.stringify({ verified: !it.verified }),
      });
      onNotify(
        `Moderasi testimoni ${it.authorLabel}: ${
          !it.verified ? "VERIFIED (Tayang)" : "UNVERIFIED (Disembunyikan)"
        }.`
      );
      await load();
    } catch (err: any) {
      onNotify(err.message, true);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus testimoni ini?")) return;
    try {
      await apiRequest(`/api/cms/testimonials/${id}`, { method: "DELETE" });
      if (selectedId === id) reset();
      onNotify("Testimoni dihapus.");
      await load();
    } catch (err: any) {
      onNotify(err.message, true);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <div className="space-y-3 rounded-[10px] border border-[#D4E4DC] bg-white p-5 lg:col-span-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-sm font-extrabold text-[#06231D]">
            Testimoni &amp; Moderasi ({items.length})
          </h2>
          {canWrite ? (
            <button
              type="button"
              onClick={reset}
              className="inline-flex min-h-[38px] cursor-pointer items-center gap-1 rounded-[6px] bg-[#E3EF26] px-3 font-display text-xs font-bold text-[#06231D]"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Tambah Testimoni</span>
            </button>
          ) : null}
        </div>
        {loading ? (
          <div className="h-32 animate-pulse rounded bg-[#F1F5F9]" />
        ) : (
          <div className="space-y-2">
            {items.map((it) => (
              <div
                key={it.id}
                onClick={() => selectItem(it)}
                className={`flex cursor-pointer items-center justify-between gap-2 rounded-[8px] border p-3 ${
                  selectedId === it.id
                    ? "border-[#076653] bg-[#E2FBCE]/50"
                    : "border-[#D4E4DC] bg-[#FFFDEE]"
                }`}
              >
                <div className="min-w-0">
                  <p className="truncate font-display text-xs font-bold text-[#06231D]">
                    {it.authorLabel}
                  </p>
                  <p className="truncate text-[11px] text-[#2F4F46]">
                    {it.category} •{" "}
                    <span
                      className={
                        it.verified
                          ? "font-bold text-[#076653]"
                          : "font-bold text-[#854D0E]"
                      }
                    >
                      {it.verified ? "VERIFIED ✓" : "PENDING MODERASI"}
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {canApprove ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleVerify(it);
                      }}
                      title="Toggle Verified"
                      className={`inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded ${
                        it.verified
                          ? "bg-[#E2FBCE] text-[#076653]"
                          : "bg-[#FEF9C3] text-[#854D0E]"
                      }`}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </button>
                  ) : null}
                  {canDelete ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(it.id);
                      }}
                      className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded text-[#991B1B] hover:bg-[#FEE2E2]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
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
          {selectedId ? "Edit Testimoni" : "Tambah Testimoni"}
        </h3>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-[#06231D]">
            Kategori Narasumber
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as any)}
            className="min-h-[42px] w-full rounded-[6px] border border-[#D4E4DC] bg-[#FFFDEE] px-3 text-sm"
          >
            <option value="Kader & Alumni">Kader &amp; Alumni</option>
            <option value="Mitra Kolaborasi">Mitra Kolaborasi</option>
          </select>
        </div>
        <CharCounterTextarea
          label="Kutipan Testimoni (quote — Min 60, Maks 240 kar)"
          value={quote}
          onChange={setQuote}
          maxLength={240}
          required
          rows={4}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <CharCounterInput
            label="Nama Narasumber"
            value={authorLabel}
            onChange={setAuthorLabel}
            maxLength={40}
            required
          />
          <CharCounterInput
            label="Jabatan / Usaha / Instansi"
            value={roleOrOrg}
            onChange={setRoleOrOrg}
            maxLength={55}
            required
          />
        </div>
        <label className="flex cursor-pointer items-center gap-3 rounded-[6px] border border-[#076653] bg-[#E2FBCE] p-3.5">
          <input
            type="checkbox"
            checked={verified}
            onChange={(e) => setVerified(e.target.checked)}
            className="h-4 w-4 accent-[#076653]"
          />
          <div>
            <p className="font-display text-xs font-bold text-[#06231D]">
              Verified = {verified ? "TRUE (Tayang di Web Publik)" : "FALSE"}
            </p>
            <p className="text-[11px] text-[#076653]">
              Hanya testimoni terverifikasi yang ditampilkan di /api/public/testimonials.
            </p>
          </div>
        </label>
        {canWrite ? (
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex min-h-[44px] cursor-pointer items-center rounded-[6px] bg-[#E3EF26] px-6 font-display text-xs font-bold text-[#06231D]"
            >
              {saving ? "Menyimpan..." : "Simpan Testimoni & Sinkron Web"}
            </button>
          </div>
        ) : null}
      </form>
    </div>
  );
}
