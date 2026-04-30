"use client";

import { useRef, useState } from "react";
import { HiPhotograph, HiX, HiUpload } from "react-icons/hi";

interface PhotoUploaderProps {
  photos: string[];
  onChange: (photos: string[]) => void;
  maxPhotos?: number;
}

async function uploadToCloudinary(file: File): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  if (!cloudName || !uploadPreset) throw new Error("Cloudinary no configurado");

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);
  formData.append("folder", "propiedades");

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Error al subir imagen");
  const data = await res.json();
  return data.secure_url as string;
}

export default function PhotoUploader({ photos, onChange, maxPhotos = 10 }: PhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const remaining = maxPhotos - photos.length;
    if (remaining <= 0) return;

    const toUpload = Array.from(files).slice(0, remaining);
    setUploading(true);
    setUploadingCount(toUpload.length);

    const newUrls: string[] = [];
    for (const file of toUpload) {
      try {
        const url = await uploadToCloudinary(file);
        newUrls.push(url);
        setUploadingCount((c) => c - 1);
      } catch (e) {
        console.error("Error uploading:", e);
        setUploadingCount((c) => c - 1);
      }
    }

    setUploading(false);
    onChange([...photos, ...newUrls]);
  }

  function removePhoto(index: number) {
    onChange(photos.filter((_, i) => i !== index));
  }

  function movePhoto(from: number, to: number) {
    const arr = [...photos];
    const [item] = arr.splice(from, 1);
    arr.splice(to, 0, item);
    onChange(arr);
  }

  const isConfigured = !!(
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME &&
    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
  );

  return (
    <div>
      {/* Grid de fotos */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-3">
          {photos.map((url, i) => (
            <div key={url} className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
              {/* Badge portada */}
              {i === 0 && (
                <span className="absolute top-1 left-1 bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                  Portada
                </span>
              )}
              {/* Botones hover */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                {i > 0 && (
                  <button
                    type="button"
                    onClick={() => movePhoto(i, i - 1)}
                    className="bg-white/90 text-gray-700 rounded-lg px-2 py-1 text-[10px] font-medium hover:bg-white"
                    title="Mover a la izquierda"
                  >
                    ◀
                  </button>
                )}
                {i < photos.length - 1 && (
                  <button
                    type="button"
                    onClick={() => movePhoto(i, i + 1)}
                    className="bg-white/90 text-gray-700 rounded-lg px-2 py-1 text-[10px] font-medium hover:bg-white"
                    title="Mover a la derecha"
                  >
                    ▶
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  className="bg-red-500/90 text-white rounded-lg p-1 hover:bg-red-600"
                  title="Eliminar"
                >
                  <HiX className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      {photos.length < maxPhotos && (
        <div
          className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${
            uploading
              ? "border-blue-300 bg-blue-50"
              : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
          }`}
          onClick={() => !uploading && inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFiles(e.dataTransfer.files);
          }}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="h-7 w-7 animate-spin rounded-full border-3 border-blue-200 border-t-blue-600" />
              <p className="text-sm text-blue-600 font-medium">
                Subiendo {uploadingCount} foto{uploadingCount !== 1 ? "s" : ""}...
              </p>
            </div>
          ) : !isConfigured ? (
            <div className="flex flex-col items-center gap-2">
              <HiPhotograph className="w-8 h-8 text-gray-300" />
              <p className="text-sm text-gray-400">Cloudinary no configurado</p>
              <p className="text-xs text-gray-300">Ver guía abajo para activar fotos</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <HiUpload className="w-8 h-8 text-gray-300" />
              <p className="text-sm text-gray-500">
                <span className="font-semibold text-blue-600">Clic para subir</span> o arrastra fotos aquí
              </p>
              <p className="text-xs text-gray-400">
                JPG, PNG, WEBP · Máximo {maxPhotos} fotos · {photos.length}/{maxPhotos}
              </p>
            </div>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {photos.length > 0 && (
        <p className="text-xs text-gray-400 mt-2">
          La primera foto es la portada. Usa las flechas para reordenar.
        </p>
      )}
    </div>
  );
}
