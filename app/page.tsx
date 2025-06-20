"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AuthService } from "@/lib/auth-service"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Zap, FileText, Users, BarChart3, Shield, Loader2 } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  const router = useRouter()
  const authService = new AuthService()
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Use the safer isAuthenticated method first
        const authenticated = await authService.isAuthenticated()

        if (authenticated) {
          // Only get full user details if we know they're authenticated
          const user = await authService.getCurrentUser()
          if (user) {
            setIsAuthenticated(true)
            router.push("/dashboard")
            return
          }
        }

        setIsAuthenticated(false)
      } catch (error) {
        // Silently handle auth errors on home page
        console.debug("Auth check on home page:", error)
        setIsAuthenticated(false)
      } finally {
        setLoading(false)
      }
    }

    // Add a small delay to prevent flash of loading state
    const timer = setTimeout(checkAuth, 100)
    return () => clearTimeout(timer)
  }, [router, authService])

  // Show loading state briefly while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <span className="text-gray-600">Loading...</span>
        </div>
      </div>
    )
  }

  // Don't render the home page if user is authenticated (they'll be redirected)
  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="bg-blue-600 p-3 rounded-lg inline-block mb-4">
            <Zap className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-xl font-semibold mb-2 text-gray-900">Redirecting to Dashboard</h2>
          <p className="text-gray-600">Please wait...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <div className="ml-3">
                <h1 className="text-2xl font-bold text-gray-900">Caltor</h1>
                <p className="text-sm text-gray-500">Inspections</p>
              </div>
            </div>
            <div className="flex space-x-4">
              <Link href="/login">
                <Button variant="outline">Sign In</Button>
              </Link>
              <Link href="/register">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
            Professional Electrical
            <span className="text-blue-600"> Inspection Management</span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Streamline your electrical inspection workflow with comprehensive reporting, real-time notifications, and
            professional PDF generation.
          </p>
          <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
            <div className="rounded-md shadow">
              <Link href="/register">
                <Button size="lg" className="w-full">
                  Start Free Trial
                </Button>
              </Link>
            </div>
            <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
              <Link href="/login">
                <Button variant="outline" size="lg" className="w-full">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mt-20">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <FileText className="h-8 w-8 text-blue-600" />
                <CardTitle>Comprehensive Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Create detailed electrical inspection reports with standardized damage classification and testing
                  results.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-8 w-8 text-blue-600" />
                <CardTitle>Team Management</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Manage your inspection team with role-based access control for admins and employees.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <BarChart3 className="h-8 w-8 text-blue-600" />
                <CardTitle>Analytics Dashboard</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Track inspection statistics, completion rates, and team performance with real-time analytics.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="h-8 w-8 text-blue-600" />
                <CardTitle>Secure & Compliant</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Enterprise-grade security with row-level data protection and professional PDF export capabilities.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 bg-blue-600 rounded-lg shadow-xl overflow-hidden">
          <div className="px-6 py-12 sm:px-12 sm:py-16 lg:px-16">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-white">Ready to get started?</h2>
              <p className="mt-4 text-lg text-blue-100">
                Join thousands of electrical professionals who trust Caltor for their inspection management needs.
              </p>
              <div className="mt-8">
                <Link href="/register">
                  <Button size="lg" variant="secondary">
                    Create Your Account
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
