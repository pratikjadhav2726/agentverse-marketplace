"use client"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { User, Settings, LogOut, ShoppingCart, Store, Shield, Sun, Moon, Monitor, Users } from "lucide-react"
import { useTheme } from "next-themes"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useState, useEffect } from "react"

export function Navbar() {
  const { user, logout } = useAuth()

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Shield className="h-4 w-4" />
      case "user":
        return <Users className="h-4 w-4" />
      default:
        return <User className="h-4 w-4" />
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive"
      case "user":
        return "default"
      default:
        return "outline"
    }
  }

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">AV</span>
              </div>
              <span className="font-bold text-xl">AgentVerse</span>
            </Link>

            <div className="hidden md:flex items-center space-x-6">
              <Link href="/marketplace" className="text-sm font-medium hover:text-primary">
                Marketplace
              </Link>
              {user?.role === "user" && (
                <Link href="/seller" className="text-sm font-medium hover:text-primary">
                  Sales Dashboard
                </Link>
              )}
              {user?.role === "admin" && (
                <Link href="/admin" className="text-sm font-medium hover:text-primary">
                  Admin Panel
                </Link>
              )}
            </div>
            {/* Theme Toggle Start */}
            <ThemeToggle />
            {/* Theme Toggle End */}
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src="/placeholder.svg" alt={user.email} />
                      <AvatarFallback>{user?.email ? user.email.charAt(0) : '?'}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{user.email}</p>
                      <p className="w-[200px] truncate text-sm text-muted-foreground">{user.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {getRoleIcon(user.role)}
                        <Badge variant={getRoleBadgeVariant(user.role)}>{user.role === "admin" ? "Admin" : "User"}</Badge>
                      </div>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer" onSelect={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" asChild>
                  <Link href="/auth/signin">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link href="/auth/signup">Sign Up</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // Return a placeholder that matches the button size
    return (
      <div className="rounded-full p-2 h-9 w-9" />
    )
  }

  const isDark = theme === "dark"
  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to day mode" : "Switch to night mode"}
      className="rounded-full p-2 hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors"
      type="button"
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  )
}
