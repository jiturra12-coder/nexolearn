"use client";

import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";

export default function Home() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const login = async () => {
    if (!email) {
      alert("Ingresa un email");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email,
    });

    setLoading(false);

    if (error) {
      alert("Error: " + error.message);
    } else {
      alert("Revisa tu correo para el login 🚀");
      router.push("/dashboard");
    }
  };

  return (
    <main style={{ padding: 40 }}>
      <h1>🚀 Nexolearn</h1>

      <h2>Login</h2>

      <input
        type="email"
        placeholder="tu@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ padding: 10, width: 250 }}
      />

      <br /><br />

      <button onClick={login} disabled={loading}>
        {loading ? "Cargando..." : "Ingresar"}
      </button>
    </main>
  );
}