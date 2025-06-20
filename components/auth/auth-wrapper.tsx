"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AuthService, type AuthUser } from "@/lib/auth-service"
import { Loader2 } from "lucide-react"

interface AuthWrapperProps {
  children: React.ReactNode
  requireAuth?: boolean
  redirectTo?: string
}

export function AuthWrapper({ children, requireAuth = true, redirectTo = "/login" }: AuthWrapperProps) {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()
  const authService = new AuthService()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // First check if authenticated
        const authenticated = await authService.isAuthenticated()
        setIsAuthenticated(authenticated)

        if (authenticated) {
          // Get full user details if authenticated
          const currentUser = await authService.getCurrentUser()
          setUser(currentUser)

          // If we require auth but don't have user details, something's wrong
          if (requireAuth && !currentUser) {
            const currentPath = window.location.pathname
            const redirectUrl = `${redirectTo}?redirectTo=${encodeURIComponent(currentPath)}`
            router.push(redirectUrl)
            return
          }
        } else if (requireAuth) {
          // Not authenticated and auth is required
          const currentPath = window.location.pathname
          const redirectUrl = `${redirectTo}?redirectTo=${encodeURIComponent(currentPath)}`
          router.push(redirectUrl)
          return
        }
      } catch (error) {
        console.error("Error checking auth:", error)
        setIsAuthenticated(false)
        setUser(null)
        if (requireAuth) {
          router.push(redirectTo)
        }
      } finally {
        setLoading(false)
      }
    }

    checkAuth()

    // Listen for auth changes
    const {
      data: { subscription },
    } = authService.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        const currentUser = await authService.getCurrentUser()
        setUser(currentUser)
        setIsAuthenticated(true)
      } else if (event === "SIGNED_OUT") {
        setUser(null)
        setIsAuthenticated(false)
        if (requireAuth) {
          router.push(redirectTo)
        }
      } else if (event === "TOKEN_REFRESHED" && session?.user) {
        const currentUser = await authService.getCurrentUser()
        setUser(currentUser)
        setIsAuthenticated(true)
      }
    })

    return () => subscription.unsubscribe()
  }, [authService, requireAuth, redirectTo, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <span className="text-gray-600">Loading...</span>
        </div>
      </div>
    )
  }

  if (requireAuth && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
