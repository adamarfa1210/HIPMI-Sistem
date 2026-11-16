"use client";

import React from "react";

function hasDisallowedSlop(val: string): boolean {
  return /<[^>]+>|[•●]/.test(val);
}

interface BaseProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  maxLength: number;
  placeholder?: string;
  required?: boolean;
  hint?: string;
}

export function CharCounterInput({
  label,
  value,
  onChange,
  maxLength,
  placeholder,
  required,
  hint,
}: BaseProps) {
  const len = value.length;
  const ratio = len / maxLength;
  const over = len > maxLength;
  const warn = !over && ratio >= 0.85;
  const slop = hasDisallowedSlop(value);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-semibold text-[#06231D]">
          {label}
          {required ? <span className="ml-1 text-[#991B1B]">*</span> : null}
        </label>
        <span
          className={`tabular-nums font-display text-[11px] font-bold ${
            over || slop
              ? "text-[#991B1B]"
              : warn
              ? "text-[#854D0E]"
              : "text-[#076653]"
          }`}
        >
          {len} / {maxLength} kar
        </span>
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength + 10}
        className={`min-h-[42px] w-full rounded-[6px] border px-3 py-2 text-sm text-[#06231D] transition focus:outline-none ${
          over || slop
            ? "border-[#991B1B] bg-[#FEE2E2]/40"
            : warn
            ? "border-[#FDE047] bg-[#FEF9C3]/60"
            : "border-[#D4E4DC] bg-[#FFFDEE] focus:border-[#076653]"
        }`}
      />
      {slop ? (
        <p className="text-[11px] font-medium text-[#991B1B]">
          Gunakan teks polos tanpa tag HTML atau simbol dekoratif (• / ●).
        </p>
      ) : hint ? (
        <p className="text-[11px] text-[#2F4F46]">{hint}</p>
      ) : null}
    </div>
  );
}

export function CharCounterTextarea({
  label,
  value,
  onChange,
  maxLength,
  placeholder,
  required,
  hint,
  rows = 3,
}: BaseProps & { rows?: number }) {
  const len = value.length;
  const ratio = len / maxLength;
  const over = len > maxLength;
  const warn = !over && ratio >= 0.85;
  const slop = hasDisallowedSlop(value);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-semibold text-[#06231D]">
          {label}
          {required ? <span className="ml-1 text-[#991B1B]">*</span> : null}
        </label>
        <span
          className={`tabular-nums font-display text-[11px] font-bold ${
            over || slop
              ? "text-[#991B1B]"
              : warn
              ? "text-[#854D0E]"
              : "text-[#076653]"
          }`}
        >
          {warn ? "⚠ " : ""}
          {len} / {maxLength} kar
        </span>
      </div>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength + 20}
        className={`w-full rounded-[6px] border px-3 py-2.5 text-sm leading-relaxed text-[#06231D] transition focus:outline-none ${
          over || slop
            ? "border-[#991B1B] bg-[#FEE2E2]/40"
            : warn
            ? "border-[#FDE047] bg-[#FEF9C3]/60"
            : "border-[#D4E4DC] bg-[#FFFDEE] focus:border-[#076653]"
        }`}
      />
      {slop ? (
        <p className="text-[11px] font-medium text-[#991B1B]">
          Gunakan teks polos tanpa tag HTML atau simbol dekoratif (• / ●).
        </p>
      ) : hint ? (
        <p className="text-[11px] text-[#2F4F46]">{hint}</p>
      ) : null}
    </div>
  );
}
