"use client";

import Link from "next/link";
import toast from "react-hot-toast";
import { birthdayEmail, birthdayMailto, formatBirthday } from "@/lib/birthday";

export interface BirthdayClient {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  birthDate: string;
  daysLeft: number;
}

export async function copyBirthdayEmail(firstName: string) {
  const { subject, body } = birthdayEmail(firstName);
  try {
    await navigator.clipboard.writeText(`Asunto: ${subject}\n\n${body}`);
    toast.success("Correo copiado");
  } catch {
    toast.error("No se pudo copiar");
  }
}

export function BirthdayEmailButtons({ firstName, email }: { firstName: string; email: string | null }) {
  return (
    <div className="flex gap-2 flex-shrink-0">
      <button
        type="button"
        onClick={() => copyBirthdayEmail(firstName)}
        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-pink-200 text-pink-700 hover:bg-pink-50"
      >
        Copiar correo
      </button>
      <a
        href={birthdayMailto(email, firstName)}
        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-pink-600 text-white hover:bg-pink-700"
        title={email ? `Abrir correo para ${email}` : "El cliente no tiene email"}
      >
        Abrir correo
      </a>
    </div>
  );
}

export default function BirthdayReminders({ birthdays }: { birthdays: BirthdayClient[] }) {
  if (!birthdays?.length) return null;
  const today = birthdays.filter((b) => b.daysLeft === 0);
  const upcoming = birthdays.filter((b) => b.daysLeft > 0);

  return (
    <div className="bg-gradient-to-r from-pink-50 to-amber-50 rounded-2xl border border-pink-100 p-5 mb-8">
      <h2 className="text-lg font-bold text-gray-900 mb-3">
        🎂 Cumpleaños {today.length > 0 && <span className="ml-1 text-sm font-semibold text-pink-600">· {today.length} hoy</span>}
      </h2>
      <div className="space-y-2">
        {today.map((b) => (
          <div key={b.id} className="flex flex-col sm:flex-row sm:items-center gap-3 bg-white rounded-xl p-3 border border-pink-200">
            <div className="flex-1 min-w-0">
              <Link href={`/clientes/${b.id}`} className="font-semibold text-gray-900 hover:underline">
                {b.firstName} {b.lastName}
              </Link>
              <p className="text-xs text-pink-600 font-medium">¡Cumple hoy! Envíale el correo de felicitación{!b.email && " (sin email registrado)"}</p>
            </div>
            <BirthdayEmailButtons firstName={b.firstName} email={b.email} />
          </div>
        ))}
        {upcoming.map((b) => (
          <div key={b.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
            <Link href={`/clientes/${b.id}`} className="text-gray-700 hover:underline truncate">
              {b.firstName} {b.lastName}
            </Link>
            <span className="text-xs text-gray-500 flex-shrink-0">
              {formatBirthday(b.birthDate)} · {b.daysLeft === 1 ? "mañana" : `en ${b.daysLeft} días`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
