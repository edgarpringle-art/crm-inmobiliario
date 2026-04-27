"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: username.trim(), password }),
    });

    if (res.ok) {
      router.push(from);
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "Credenciales incorrectas");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Usuario</label>
        <input
          className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="edgar / ana / valentina"
          autoComplete="username"
          autoCapitalize="none"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Contraseña</label>
        <input
          type="password"
          className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
      </div>
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50 text-sm"
      >
        {loading ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Branding */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-xl shadow-blue-900/50 mx-auto mb-4">
            <span className="text-white font-bold text-2xl">EP</span>
          </div>
          <h1 className="text-2xl font-bold text-white">E. Pringle Real Estate</h1>
          <p className="text-slate-400 text-sm mt-1">CRM Inmobiliario · Panamá</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl shadow-black/30 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-5">Iniciar sesión</h2>
          <Suspense fallback={<div className="text-sm text-gray-400">Cargando...</div>}>
            <LoginForm />
          </Suspense>
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          Acceso restringido · Solo personal autorizado
        </p>
      </div>
    </div>
  );
}
