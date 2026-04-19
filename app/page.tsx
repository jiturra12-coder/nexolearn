"use client";

import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function Home() {
  const [email, setEmail] = useState("");

  const login = async () => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
    });

    if (error) {
      alert("Error: " + error.message);
    } else {
      alert("📩 Revisa tu correo");
    }
  };

  return (
    <main style={{ padding: 40 }}>
      <h1>NexoLearn 🚀</h1>

      <input
        type="email"
        placeholder="jiturra12@gmail.com"
        onChange={(e) => setEmail(e.target.value)}
      />

      <br /><br />

      <button onClick={login}>Login</button>
    </main>
  );
}
