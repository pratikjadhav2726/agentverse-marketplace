"use client"

import type React from "react"
import { useEffect, useState, createContext, useContext } from "react"
import type { User } from "@/lib/types"

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  signup: (userData: { name: string; email: string; role: "user" | "admin"; password: string }) => Promise<boolean>
  logout: () => Promise<void>
  loading: boolean
  refetchUser?: () => void
  authFetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // On mount, fetch current user from /api/auth/me
  useEffect(() => {
    const fetchMe = async () => {
      setLoading(true)
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" })
        if (res.ok) {
          const data = await res.json()
          setUser(data.user)
        } else {
          setUser(null)
        }
      } catch {
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    fetchMe()
  }, [])

  const login = async (email: string, password: string) => {
    setLoading(true)
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include"
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Login failed")
      }
      setUser(data.user)
      return true
    } catch (error) {
      console.error("Login error:", error)
      setUser(null)
      return false
    } finally {
      setLoading(false)
    }
  }

  const signup = async (userData: { name: string; email: string; role: "user" | "admin"; password: string }): Promise<boolean> => {
    setLoading(true)
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
        credentials: "include"
      })
      if (!response.ok) return false
      const { user } = await response.json()
      setUser(user)
      return true
    } catch (error) {
      return false
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    setLoading(true)
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" })
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  // Helper for authenticated fetch
  const authFetch = async (input: RequestInfo, init: RequestInit = {}) => {
    return fetch(input, { ...init, credentials: "include" })
  }

  return <AuthContext.Provider value={{ user, login, signup, logout, loading, refetchUser: undefined, authFetch }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
