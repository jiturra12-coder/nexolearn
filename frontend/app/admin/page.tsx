'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type User = {
  id: string
  email: string
  skills: string[]
  interests: string[]
}

export default function AdminPage() {

  const [users, setUsers] = useState<User[]>([])

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')

    if (error) {
      console.error(error)
      return
    }

    setUsers(data || [])
  }

  return (
    <div style={{ padding: 40 }}>

      <h1>Admin Panel 🧠</h1>

      <h2>Usuarios</h2>

      {users.length === 0 && <p>No hay usuarios aún</p>}

      {users.map(user => (
        <div key={user.id} style={{
          border: '1px solid #333',
          padding: 10,
          marginBottom: 10
        }}>
          <p><b>{user.email}</b></p>
          <p>Enseña: {user.skills?.join(', ')}</p>
          <p>Aprende: {user.interests?.join(', ')}</p>
        </div>
      ))}

    </div>
  )
}