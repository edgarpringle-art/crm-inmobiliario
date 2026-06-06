"use client";

import { useRef, useState } from "react";
import { HiUser, HiX, HiUpload } from "react-icons/hi";

interface AvatarUploaderProps {
  photoUrl: string;
  onChange: (url: string) => void;
}

async function uploadToCloudinary(file: File): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  if (!cloudName || !uploadPreset) throw new Error("Cloudinary no configurado");

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);
  formData.append("folder", "agentes");

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Error al subir imagen");
  const data = await res.json();
  return data.secure_url as string;
}

export default function AvatarUploader({ photoUrl, onChange }: AvatarUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const url = await uploadToCloudinary(files[0]);
      onChange(url);
    } catch (e) {
      console.error("Error uploading avatar:", e);
    } finally {
      setUploading(false);
    }
  }

  const isConfigured = !!(
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME &&
    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
  );

  return (
    <div className="flex items-center gap-4">
      <div className="relative w-20 h-20 rounded-full overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center shrink-0">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt="Foto del agente" className="w-full h-full object-cover" />
        ) : (
          <HiUser className="w-8 h-8 text-gray-300" />
        )}
        {photoUrl && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-0.5 right-0.5 bg-red-500/90 text-white rounded-full p-1 hover:bg-red-600"
            title="Quitar foto"
          >
            <HiX className="w-3 h-3" />
          </button>
        )}
      </div>

      <div>
        <button
          type="button"
          disabled={uploading || !isConfigured}
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          {uploading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
              Subiendo...
            </>
          ) : (
            <>
              <HiUpload className="w-4 h-4" /> {photoUrl ? "Cambiar foto" : "Subir foto"}
            </>
          )}
        </button>
        <p className="text-xs text-gray-400 mt-1">
          {isConfigured ? "JPG, PNG o WEBP" : "Cloudinary no configurado"}
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files)}
      />
    </div>
  );
}
