"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import type { User } from "@/lib/types"

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  signup: (userData: { name: string; email: string; role: "buyer" | "seller" }) => Promise<boolean>
  logout: () => void
  loading: boolean
  refetchUser?: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUser = async () => {
    // In a real app, this would fetch from an API endpoint like /api/user/me
    // For now, we'll just re-read from localStorage for this mock setup.
    const savedUser = localStorage.getItem("agentverse-user")
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch (error) {
        console.error("Failed to parse user from localStorage", error)
        localStorage.removeItem("agentverse-user")
        setUser(null)
      }
    }
    setLoading(false)
  }

  // Check for existing session on mount
  useEffect(() => {
    fetchUser()
  }, [])

  const login = async (email: string, password?: string) => {
    setLoading(true)
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: password || "password" }), // Password is not used in mock
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Login failed")
      }
      setUser(data.user)
      localStorage.setItem("agentverse-user", JSON.stringify(data.user))
      return data.user
    } catch (error) {
      console.error("Login error:", error)
      logout() // Clear user state on error
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signup = async (userData: { name: string; email: string; role: "buyer" | "seller" }): Promise<boolean> => {
    setLoading(true)
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      })

      if (!response.ok) return false

      const { user } = await response.json()
      setUser(user)
      localStorage.setItem("agentverse-user", JSON.stringify(user))
      return true
    } catch (error) {
      return false
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("agentverse-user")
  }

  return <AuthContext.Provider value={{ user, login, signup, logout, loading, refetchUser: fetchUser }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
