'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Dashboard() {
  return (
    <div className="container">

      <aside className="sidebar">
        <h2>NexoLearn</h2>
        <p>Usuario</p>
      </aside>

      <main className="main">
        <h1>Dashboard</h1>

        <div className="card">
          <p>Contenido principal</p>
        </div>
      </main>

      <aside className="right">
        <div className="card">
          <p>Panel derecho</p>
        </div>
      </aside>

    </div>
  )
}