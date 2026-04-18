"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [teaching, setTeaching] = useState<any[]>([]);
  const [learning, setLearning] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  useEffect(() => {
    const loadUserData = async (userId: string) => {
      setLoading(true);

      // 👤 PROFILE (CORREGIDO)
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (profileError) {
        console.error("Error profile:", profileError);
        return;
      }

      setProfile(profileData);

      // 🧠 INTERESTS (CORREGIDO)
      const { data: interestsData, error: interestsError } = await supabase
        .from("user_interests")
        .select(`
          type,
          interests ( name )
        `)
        .eq("user_id", userId);

      if (interestsError) {
        console.error("Error interests:", interestsError);
        return;
      }

      const teachingList = interestsData?.filter(i => i.type === "teach") || [];
      const learningList = interestsData?.filter(i => i.type === "learn") || [];

      setTeaching(teachingList);
      setLearning(learningList);

      setLoading(false);
    };

    const fetchSession = async () => {
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        router.push("/");
        return;
      }

      setUser(data.user);
      await loadUserData(data.user.id);
    };

    fetchSession();
  }, [router]);

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (loading) return <h2 style={{ padding: 40 }}>Cargando...</h2>;

  return (
    <div style={{ padding: 40 }}>
      <h1>Dashboard 🚀</h1>

      {/* USER */}
      <div style={{ marginBottom: 30 }}>
        <h2>👤 Usuario</h2>
        <p><strong>Email:</strong> {user?.email}</p>
        <p><strong>Reputación:</strong> ⭐ {profile?.reputation || 0}</p>
        <button onClick={logout}>Cerrar sesión</button>
      </div>

      {/* TEACH */}
      <div style={{ marginBottom: 30 }}>
        <h2>🎯 Enseñando</h2>

        {teaching.length === 0 && <p>No tienes skills aún</p>}

        {teaching.map((s, i) => (
          <div key={i}>
            <strong>{s.interests?.name}</strong>
          </div>
        ))}
      </div>

      {/* LEARN */}
      <div style={{ marginBottom: 30 }}>
        <h2>📚 Aprendiendo</h2>

        {learning.length === 0 && <p>No tienes intereses aún</p>}

        {learning.map((s, i) => (
          <div key={i}>
            <strong>{s.interests?.name}</strong>
          </div>
        ))}
      </div>

      {/* ACTIONS */}
      <div style={{ marginTop: 40 }}>
        <h2>⚡ Acciones</h2>

        <button onClick={() => router.push("/onboarding")}>
          Editar perfil
        </button>

        <br /><br />

        <button onClick={() => router.push("/match")}>
          Ver matches 🔥
        </button>
      </div>
    </div>
  );
}