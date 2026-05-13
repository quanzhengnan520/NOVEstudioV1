"use client";

import { useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/context";

type Props = {
  onUrl: (url: string) => void;
  onError: (msg: string) => void;
};

type UploadEnvelope = { success?: boolean; data?: { url?: string }; error?: string | null };

export function ImageUploadZone({ onUrl, onError }: Props) {
  const { t } = useI18n();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      onError(t("video.uploadErrType"));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      onError(t("video.uploadErrSize"));
      return;
    }
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);

      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/studio/upload-image", {
        method: "POST",
        credentials: "include",
        body: form,
      });
      const json = (await res.json()) as UploadEnvelope;
      if (!res.ok || !json.success) {
        throw new Error(json.error ?? `Upload failed: ${res.status}`);
      }
      const url = json.data?.url;
      if (!url) throw new Error(t("video.uploadErrNoUrl"));
      onUrl(url);
    } catch (e) {
      onError(e instanceof Error ? e.message : t("video.uploadErrGeneric"));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div
      className="relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/20 bg-white/[0.02] px-6 py-8 transition hover:border-teal-400/35 hover:bg-white/[0.04]"
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) void handleFile(file);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = "";
        }}
      />
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="" className="mb-3 h-24 w-24 rounded-xl object-cover" />
      ) : (
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-2xl text-slate-500">
          +
        </div>
      )}
      {uploading ? (
        <p className="text-xs text-teal-300">{t("video.uploading")}</p>
      ) : (
        <p className="text-center text-xs text-slate-500">
          {t("video.uploadDropHint")}
          <br />
          <span className="text-slate-600">{t("video.uploadFormats")}</span>
        </p>
      )}
    </div>
  );
}
