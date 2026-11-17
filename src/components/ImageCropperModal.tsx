"use client";

import React, { useCallback, useEffect, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { uploadMediaFile } from "@/lib/api";
import { CharCounterInput } from "./CharCounterField";

export interface CropPreset {
  slot: string;
  label: string;
  aspect: number;
  aspectLabel: string;
  minWidth: number;
  minHeight: number;
}

export const CROP_PRESETS: Record<string, CropPreset> = {
  "hero-home": {
    slot: "hero-home",
    label: "Hero Slide Beranda (16:9)",
    aspect: 16 / 9,
    aspectLabel: "16:9 Landscape",
    minWidth: 1280,
    minHeight: 720,
  },
  "tentang-video": {
    slot: "tentang-video",
    label: "Poster Video Profil (16:9)",
    aspect: 16 / 9,
    aspectLabel: "16:9 Landscape",
    minWidth: 1280,
    minHeight: 720,
  },
  partnership: {
    slot: "partnership",
    label: "Logo / Emblem Mitra (1:1)",
    aspect: 1,
    aspectLabel: "1:1 Square",
    minWidth: 512,
    minHeight: 512,
  },
  "bisnis-kader": {
    slot: "bisnis-kader",
    label: "Foto Bisnis Kader (4:3)",
    aspect: 4 / 3,
    aspectLabel: "4:3 Landscape",
    minWidth: 800,
    minHeight: 600,
  },
  prestasi: {
    slot: "prestasi",
    label: "Foto Prestasi Kader (4:3)",
    aspect: 4 / 3,
    aspectLabel: "4:3 Landscape",
    minWidth: 800,
    minHeight: 600,
  },
  "program-kerja": {
    slot: "program-kerja",
    label: "Poster Program Kerja (4:5)",
    aspect: 4 / 5,
    aspectLabel: "4:5 Portrait",
    minWidth: 540,
    minHeight: 675,
  },
};

const MAX_RAW_FILE_BYTES = 15 * 1024 * 1024; // Raw foto kamera hingga 15 MB sebelum dipotong & dikompresi
const MAX_UPLOAD_BYTES = 3.8 * 1024 * 1024; // Batas aman di bawah limit payload serverless Vercel (4.5 MB)
const MAX_OUTPUT_LONG_EDGE = 1920;

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), mimeType, quality);
  });
}

async function getCroppedImageBlob(
  imageSrc: string,
  pixelCrop: Area,
  targetMinWidth: number,
  targetMinHeight: number
): Promise<{ blob: Blob; extension: string }> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = imageSrc;
  });

  let outWidth = Math.max(Math.round(pixelCrop.width), 1);
  let outHeight = Math.max(Math.round(pixelCrop.height), 1);

  if (outWidth < targetMinWidth || outHeight < targetMinHeight) {
    const upScale = Math.max(
      targetMinWidth / outWidth,
      targetMinHeight / outHeight
    );
    outWidth = Math.round(outWidth * upScale);
    outHeight = Math.round(outHeight * upScale);
  } else if (Math.max(outWidth, outHeight) > MAX_OUTPUT_LONG_EDGE) {
    const minScale = Math.max(
      targetMinWidth / outWidth,
      targetMinHeight / outHeight
    );
    const desiredScale = MAX_OUTPUT_LONG_EDGE / Math.max(outWidth, outHeight);
    const scale = Math.min(1, Math.max(minScale, desiredScale));
    outWidth = Math.max(Math.round(outWidth * scale), targetMinWidth);
    outHeight = Math.max(Math.round(outHeight * scale), targetMinHeight);
  }

  const canvas = document.createElement("canvas");
  canvas.width = outWidth;
  canvas.height = outHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context tidak tersedia");

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outWidth,
    outHeight
  );

  // Gunakan WebP (mendukung transparansi + ukuran jauh lebih ringkas daripada PNG), lalu fallback JPEG bila perlu
  const attempts: Array<{ mime: string; ext: string; quality: number }> = [
    { mime: "image/webp", ext: "webp", quality: 0.88 },
    { mime: "image/webp", ext: "webp", quality: 0.78 },
    { mime: "image/webp", ext: "webp", quality: 0.65 },
    { mime: "image/jpeg", ext: "jpg", quality: 0.85 },
    { mime: "image/jpeg", ext: "jpg", quality: 0.72 },
  ];

  let lastBlob: Blob | null = null;
  let lastExt = "webp";

  for (const step of attempts) {
    const blob = await canvasToBlob(canvas, step.mime, step.quality);
    if (!blob || blob.type !== step.mime) continue;
    lastBlob = blob;
    lastExt = step.ext;
    if (blob.size <= MAX_UPLOAD_BYTES) {
      return { blob, extension: step.ext };
    }
  }

  if (lastBlob && lastBlob.size <= 4.3 * 1024 * 1024) {
    return { blob: lastBlob, extension: lastExt };
  }

  throw new Error(
    "Ukuran gambar hasil potong masih terlalu besar (> 4 MB). Coba perbesar zoom atau pilih file dengan ukuran lebih kecil."
  );
}

interface ImageCropperModalProps {
  open: boolean;
  presetKey: keyof typeof CROP_PRESETS;
  initialAlt?: string;
  onClose: () => void;
  onUploaded: (result: { url: string; imageAlt: string }) => void;
}

export function ImageCropperModal({
  open,
  presetKey,
  initialAlt = "",
  onClose,
  onUploaded,
}: ImageCropperModalProps) {
  const preset = CROP_PRESETS[presetKey] || CROP_PRESETS["hero-home"];
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [filename, setFilename] = useState<string>("upload.png");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [imageAlt, setImageAlt] = useState(initialAlt);
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(
    null
  );
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  useEffect(() => {
    if (open) {
      setImageAlt(initialAlt);
      setError(null);
    }
  }, [open, initialAlt]);

  if (!open) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    if (file.size > MAX_RAW_FILE_BYTES) {
      setError("Ukuran file mentah maksimal 15 MB.");
      return;
    }
    setFilename(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onload = () => {
        setNaturalSize({ w: img.width, h: img.height });
        if (img.width < preset.minWidth || img.height < preset.minHeight) {
          setError(
            `Resolusi asli (${img.width}×${img.height}) di bawah minimum (${preset.minWidth}×${preset.minHeight} px).`
          );
        }
      };
      img.src = dataUrl;
      setImageSrc(dataUrl);
      setZoom(1);
      setCrop({ x: 0, y: 0 });
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!imageSrc || !croppedAreaPixels) {
      setError("Pilih dan atur area potong gambar terlebih dahulu.");
      return;
    }
    if (!imageAlt.trim() || imageAlt.trim().length < 5) {
      setError("Alt Text (imageAlt) wajib diisi minimal 5 karakter untuk aksesibilitas.");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const { blob, extension } = await getCroppedImageBlob(
        imageSrc,
        croppedAreaPixels,
        preset.minWidth,
        preset.minHeight
      );
      const baseName = filename.replace(/\.[^/.]+$/, "") || "upload";
      const result = await uploadMediaFile({
        file: blob,
        filename: `${baseName}.${extension}`,
        slot: preset.slot,
        imageAlt: imageAlt.trim(),
      });
      onUploaded({ url: result.url, imageAlt: imageAlt.trim() });
      setImageSrc(null);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Gagal mengunggah media.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#06231D]/75 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="Modal Cropper Gambar"
    >
      <div className="w-full max-w-2xl overflow-hidden rounded-[12px] border border-[#06231D] bg-white shadow-2xl">
        <div className="flex items-center justify-between bg-[#06231D] px-5 py-4 text-[#FFFDEE]">
          <div>
            <h3 className="font-display text-sm font-bold">
              Aspect-Ratio Image Cropper &amp; Upload S3
            </h3>
            <p className="text-[11px] text-[#C7DCD2]">
              {preset.label} • Rasio Terkunci: {preset.aspectLabel} • Min:{" "}
              {preset.minWidth}×{preset.minHeight} px
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[40px] min-w-[40px] cursor-pointer items-center justify-center rounded-[4px] text-sm font-bold text-[#E3EF26] hover:bg-[#0C342C]"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="inline-flex min-h-[40px] cursor-pointer items-center rounded-[6px] border border-[#076653] bg-[#E2FBCE] px-4 font-display text-xs font-bold text-[#06231D] hover:bg-[#d2f7b4]">
              <span>Pilih File Gambar (.jpg / .png / .webp, Maks 15 MB)</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="sr-only"
              />
            </label>
            {naturalSize ? (
              <span className="tabular-nums rounded-full bg-[#F1F5F9] px-3 py-1 text-[11px] font-semibold text-[#2F4F46]">
                Asli: {naturalSize.w}×{naturalSize.h} px
              </span>
            ) : null}
          </div>

          <div className="relative h-64 w-full overflow-hidden rounded-[8px] border border-[#124236] bg-[#0C342C]">
            {imageSrc ? (
              <>
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={preset.aspect}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
                {presetKey === "hero-home" ? (
                  <div className="pointer-events-none absolute inset-y-0 left-0 w-[45%] border-r border-dashed border-[#E3EF26]/70 bg-[#06231D]/35 p-3">
                    <span className="rounded bg-[#06231D]/80 px-2 py-0.5 font-display text-[10px] font-bold text-[#E3EF26]">
                      SAFE ZONE TEKS HERO (45% KIRI)
                    </span>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center p-6 text-center text-[#C7DCD2]">
                <p className="font-display text-xs font-bold text-[#E3EF26]">
                  Pratinjau Area Potong ({preset.aspectLabel})
                </p>
                <p className="mt-1 text-xs">
                  Pilih file gambar untuk memotong sesuai rasio kontainer web,
                  konversi otomatis ke .webp, hapus EXIF, dan simpan ke Supabase
                  Storage.
                </p>
              </div>
            )}
          </div>

          {imageSrc ? (
            <div className="flex items-center gap-3 rounded-[6px] border border-[#D4E4DC] bg-[#FFFDEE] px-3 py-2">
              <span className="text-xs font-semibold text-[#06231D]">Zoom:</span>
              <input
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1 accent-[#076653]"
              />
              <span className="tabular-nums text-xs font-bold text-[#076653]">
                {zoom.toFixed(2)}×
              </span>
            </div>
          ) : null}

          <CharCounterInput
            label="Alt Text Aksesibilitas WCAG AA (imageAlt)"
            value={imageAlt}
            onChange={setImageAlt}
            maxLength={140}
            required
            placeholder="Deskripsi singkat isi foto untuk screen reader & SEO..."
          />

          <div className="rounded-[6px] border border-[#A7F3D0] bg-[#E2FBCE] px-3 py-2 text-[11px] font-medium text-[#06231D]">
            ✓ Validasi resolusi minimum • ✓ Strip metadata EXIF/GPS • ✓
            Konversi otomatis ke .webp &amp; unggah ke Supabase S3
          </div>

          {error ? (
            <div className="rounded-[6px] border border-[#FECACA] bg-[#FEE2E2] px-3 py-2 text-xs font-medium text-[#991B1B]">
              {error}
            </div>
          ) : null}

          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-[42px] cursor-pointer items-center rounded-[6px] border border-[#D4E4DC] bg-white px-4 text-xs font-semibold text-[#06231D] hover:bg-[#F1F5F9]"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={uploading || !imageSrc}
              onClick={handleUpload}
              className="inline-flex min-h-[42px] cursor-pointer items-center rounded-[6px] bg-[#E3EF26] px-5 font-display text-xs font-bold text-[#06231D] transition hover:bg-[#d5e11e] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {uploading
                ? "Memproses & Mengunggah..."
                : "Potong, Konversi WebP & Unggah"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
