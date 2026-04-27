import { createContext, useContext, useState, useEffect } from 'react'
import React from 'react'

const AuthContext = createContext(null)

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000"

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(null)
  const [loading, setLoading] = useState(true)

  // On mount: validate JWT cookie by calling backend /me
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/auth/me`, {
          credentials: 'include',
        })
        const data = await res.json()
        if (res.ok && data.success && data.user) {
          setUserState(data.user)
        }
      } catch (err) {
        console.error('Auth check failed:', err)
      } finally {
        setLoading(false)
      }
    }
    checkAuth()
  }, [])

  const setUser = (userData) => {
    setUserState(userData)
  }

  const logout = async () => {
    try {
      await fetch(`${API_BASE}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      })
    } catch (err) {
      console.error('Logout error:', err)
    }
    setUserState(null)
  }

  return (
    <AuthContext.Provider value={{ user, setUser, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

