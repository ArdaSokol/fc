"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      router.replace("/admin");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-sm bg-[#23232a] rounded-xl shadow-lg p-8 flex flex-col gap-6 border border-gray-800"
      >
        <h1 className="text-2xl font-semibold text-center mb-2 tracking-tight text-white">Fotoğrafçı Girişi</h1>
        <input
          type="email"
          required
          placeholder="E-posta"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full px-4 py-2 rounded border border-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] bg-[#1a1a1a] text-white placeholder-gray-400"
        />
        <input
          type="password"
          required
          placeholder="Şifre"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full px-4 py-2 rounded border border-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] bg-[#1a1a1a] text-white placeholder-gray-400"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 rounded bg-[var(--accent)] text-[var(--foreground)] font-semibold hover:opacity-90 transition disabled:opacity-60"
        >
          {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
        </button>
        {error && <div className="text-red-400 text-sm text-center">{error}</div>}
      </form>
    </div>
  );
} 