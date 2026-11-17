"use client";

import React, { useCallback, useState } from "react";
import {
  Award,
  Briefcase,
  CheckCircle2,
  ExternalLink,
  FolderKanban,
  Handshake,
  Image as ImageIcon,
  Info,
  MessageSquareQuote,
  Settings,
  AlertCircle,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import {
  CROP_PRESETS,
  ImageCropperModal,
} from "@/components/ImageCropperModal";
import {
  HeroSlidesSection,
  TentangSection,
} from "@/components/cms/HeroTentangSections";
import {
  AchievementsSection,
  BisnisKaderSection,
  PartnersSection,
  TestimonialsSection,
} from "@/components/cms/DirectorySections";
import {
  ProgramKerjaSection,
  SiteSettingsAnnouncementsSection,
} from "@/components/cms/ProkerSettingsSections";
import { useAuth } from "@/lib/auth";

type CmsTabKey =
  | "hero"
  | "tentang"
  | "partners"
  | "bisnis"
  | "achievements"
  | "program-kerja"
  | "testimonials"
  | "settings";

const CMS_TABS: Array<{
  key: CmsTabKey;
  number: number;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { key: "hero", number: 1, label: "Hero Slides", icon: ImageIcon },
  { key: "tentang", number: 2, label: "Tentang & Video", icon: Info },
  { key: "partners", number: 3, label: "Partnership", icon: Handshake },
  { key: "bisnis", number: 4, label: "Bisnis Kader", icon: Briefcase },
  { key: "achievements", number: 5, label: "Prestasi", icon: Award },
  { key: "program-kerja", number: 6, label: "Program Kerja", icon: FolderKanban },
  { key: "testimonials", number: 7, label: "Testimoni", icon: MessageSquareQuote },
  { key: "settings", number: 8, label: "Settings Web & Kontak", icon: Settings },
];

export default function CmsPage() {
  const { can } = useAuth();
  const [activeTab, setActiveTab] = useState<CmsTabKey>("hero");
  const [toast, setToast] = useState<{
    message: string;
    isError: boolean;
  } | null>(null);

  const [cropperState, setCropperState] = useState<{
    open: boolean;
    presetKey: keyof typeof CROP_PRESETS;
    initialAlt: string;
    onResult: (res: { url: string; imageAlt: string }) => void;
  }>({
    open: false,
    presetKey: "hero-home",
    initialAlt: "",
    onResult: () => {},
  });

  const onNotify = useCallback((message: string, isError = false) => {
    setToast({ message, isError });
    window.setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  }, []);

  const onOpenCropper = useCallback(
    (
      presetKey: keyof typeof CROP_PRESETS,
      initialAlt: string,
      onResult: (res: { url: string; imageAlt: string }) => void
    ) => {
      setCropperState({
        open: true,
        presetKey,
        initialAlt,
        onResult,
      });
    },
    []
  );

  const canRead = can("cms", "read");
  const canWrite = can("cms", "create") || can("cms", "update");
  const canDelete = can("cms", "delete");
  const canApprove = can("cms", "approve");

  const publicWebUrl =
    process.env.NEXT_PUBLIC_PUBLIC_WEB_URL || "http://localhost:3001";

  return (
    <AppShell
      title="Web UKM Profile CMS (8 Section)"
      breadcrumb="Dashboard / Web UKM Profile CMS"
    >
      <div className="space-y-6">
        {/* Top Banner */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#CBD5E1] bg-white p-5 shadow-sm">
          <div>
            <h2 className="text-lg font-extrabold text-[#06231D]">
              Editor Konten Web UKM Profile HIPMI PT Telkom
            </h2>
            <p className="mt-0.5 text-xs text-[#64748B]">
              Perubahan tersimpan ke Supabase PostgreSQL + Storage S3 dan otomatis memicu On-Demand ISR Web Publik.
            </p>
          </div>
          <a
            href={publicWebUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-[#076653] bg-[#076653]/5 px-4 py-2.5 text-xs font-bold text-[#076653] hover:bg-[#076653] hover:text-white transition"
          >
            <ExternalLink className="h-4 w-4" />
            Lihat Web UKM Live
          </a>
        </div>

        {/* Toast Notification */}
        {toast && (
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
        )}

        {/* RBAC Gate */}
        {!canRead ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
            Akun Anda tidak memiliki izin <code>cms:read</code> untuk melihat atau mengubah konten Web UKM Profile.
          </div>
        ) : (
          <>
            {/* 8-Section Tab Bar */}
            <div className="flex flex-wrap gap-2 rounded-2xl border border-[#CBD5E1] bg-white p-2.5 shadow-sm">
              {CMS_TABS.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-bold transition ${
                      active
                        ? "bg-[#06231D] text-[#E3EF26] shadow-sm"
                        : "text-[#475569] hover:bg-[#F1F5F9] hover:text-[#06231D]"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>
                      {tab.number}. {tab.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active Section Content */}
            <div>
              {activeTab === "hero" && (
                <HeroSlidesSection
                  canWrite={canWrite}
                  canDelete={canDelete}
                  canApprove={canApprove}
                  onNotify={onNotify}
                  onOpenCropper={onOpenCropper}
                />
              )}
              {activeTab === "tentang" && (
                <TentangSection
                  canWrite={canWrite}
                  canDelete={canDelete}
                  canApprove={canApprove}
                  onNotify={onNotify}
                  onOpenCropper={onOpenCropper}
                />
              )}
              {activeTab === "partners" && (
                <PartnersSection
                  canWrite={canWrite}
                  canDelete={canDelete}
                  canApprove={canApprove}
                  onNotify={onNotify}
                  onOpenCropper={onOpenCropper}
                />
              )}
              {activeTab === "bisnis" && (
                <BisnisKaderSection
                  canWrite={canWrite}
                  canDelete={canDelete}
                  canApprove={canApprove}
                  onNotify={onNotify}
                  onOpenCropper={onOpenCropper}
                />
              )}
              {activeTab === "achievements" && (
                <AchievementsSection
                  canWrite={canWrite}
                  canDelete={canDelete}
                  canApprove={canApprove}
                  onNotify={onNotify}
                  onOpenCropper={onOpenCropper}
                />
              )}
              {activeTab === "program-kerja" && (
                <ProgramKerjaSection
                  canWrite={canWrite}
                  canDelete={canDelete}
                  canApprove={canApprove}
                  onNotify={onNotify}
                  onOpenCropper={onOpenCropper}
                />
              )}
              {activeTab === "testimonials" && (
                <TestimonialsSection
                  canWrite={canWrite}
                  canDelete={canDelete}
                  canApprove={canApprove}
                  onNotify={onNotify}
                  onOpenCropper={onOpenCropper}
                />
              )}
              {activeTab === "settings" && (
                <SiteSettingsAnnouncementsSection
                  canWrite={canWrite}
                  canDelete={canDelete}
                  canApprove={canApprove}
                  onNotify={onNotify}
                  onOpenCropper={onOpenCropper}
                />
              )}
            </div>
          </>
        )}

        {/* Shared Image Cropper Modal */}
        <ImageCropperModal
          open={cropperState.open}
          presetKey={cropperState.presetKey}
          initialAlt={cropperState.initialAlt}
          onClose={() => setCropperState((p) => ({ ...p, open: false }))}
          onUploaded={(res) => {
            cropperState.onResult(res);
            setCropperState((p) => ({ ...p, open: false }));
          }}
        />
      </div>
    </AppShell>
  );
}
