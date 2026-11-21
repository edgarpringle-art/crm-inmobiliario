"use client";

import { useRef, useState } from "react";
import { HiUpload } from "react-icons/hi";

interface FileUploadButtonProps {
  onUploaded: (url: string) => void;
  accept?: string;
  folder?: string;
  label?: string;
}

const MAX_MB = 10; // límite de archivos "raw" en el plan gratis de Cloudinary

export default function FileUploadButton({
  onUploaded,
  accept = "application/pdf,.pdf",
  folder = "catalogos",
  label = "Subir desde mi PC",
}: FileUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError("");
    if (!cloudName || !uploadPreset) {
      setError("Cloudinary no configurado");
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`El archivo pesa ${(file.size / 1024 / 1024).toFixed(1)} MB. Máximo ${MAX_MB} MB — comprímelo o usa un link de Drive.`);
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("upload_preset", uploadPreset);
      fd.append("folder", folder);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.secure_url) throw new Error(data?.error?.message || "Error al subir");
      onUploaded(data.secure_url as string);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al subir");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50"
      >
        {uploading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
        ) : (
          <HiUpload className="h-4 w-4" />
        )}
        {uploading ? "Subiendo..." : label}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}
