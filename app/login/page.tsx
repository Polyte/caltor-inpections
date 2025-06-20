"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AuthService } from "@/lib/auth-service"
import { useToast } from "@/hooks/use-toast"
import { Zap, Loader2, AlertCircle, Clock, LogIn, CheckCircle } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [rateLimited, setRateLimited] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const authService = new AuthService()

  const redirectTo = searchParams.get("redirectTo") || "/dashboard"

  // Countdown timer for rate limiting
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    } else if (rateLimited && countdown === 0) {
      setRateLimited(false)
      setError("")
    }
    return () => clearTimeout(timer)
  }, [countdown, rateLimited])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (rateLimited) {
      toast({
        title: "Please Wait",
        description: `You can try again in ${countdown} seconds.`,
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    setError("")

    try {
      const result = await authService.signIn({ email, password })

      if (result.user) {
        toast({
          title: "Success",
          description: "Logged in successfully!",
        })
        router.push(redirectTo)
      }
    } catch (error: any) {
      console.error("Login error:", error)
      const errorMessage = error.message || "An unexpected error occurred"

      // Handle rate limiting
      if (errorMessage.includes("wait") && errorMessage.includes("seconds")) {
        const match = errorMessage.match(/(\d+) seconds/)
        const seconds = match ? Number.parseInt(match[1]) : 60
        setRateLimited(true)
        setCountdown(seconds)
        setError(`Too many requests. Please wait ${seconds} seconds before trying again.`)
      } else if (errorMessage.includes("email verification") || errorMessage.includes("contact support")) {
        // Handle email verification issues with helpful message
        setError(
          "There's an issue with email verification settings. Please try registering a new account or contact support.",
        )
      } else {
        setError(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <div className="bg-blue-600 p-3 rounded-lg">
              <Zap className="h-8 w-8 text-white" />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Sign in to Caltor</h2>
          <p className="mt-2 text-sm text-gray-600">Electrical Inspection Management</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogIn className="h-5 w-5" />
              Welcome back
            </CardTitle>
            <CardDescription>Enter your credentials to access your account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  {rateLimited ? <Clock className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                  <AlertDescription>
                    {error}
                    {rateLimited && countdown > 0 && (
                      <div className="mt-2 text-sm">
                        <strong>Time remaining: {countdown} seconds</strong>
                      </div>
                    )}
                    {error.includes("email verification") && (
                      <div className="mt-2">
                        <Link href="/register" className="text-blue-600 hover:text-blue-500 underline">
                          Try creating a new account
                        </Link>
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter your email"
                  disabled={loading || rateLimited}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                  disabled={loading || rateLimited}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading || rateLimited}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : rateLimited ? (
                  <>
                    <Clock className="mr-2 h-4 w-4" />
                    Wait {countdown}s
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Sign in
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 space-y-3">
              <div className="text-center">
                <Link href="/auth/forgot-password" className="text-sm text-blue-600 hover:text-blue-500">
                  Forgot your password?
                </Link>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Don't have an account?{" "}
                  <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500">
                    Sign up
                  </Link>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info card about instant access */}
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-green-800">
              <CheckCircle className="h-5 w-5" />
              <div>
                <p className="font-medium">No Email Verification Required</p>
                <p className="text-sm">Sign in immediately after registration - no waiting for email confirmation!</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {rateLimited && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 text-orange-800">
                <Clock className="h-5 w-5" />
                <div>
                  <p className="font-medium">Rate Limited</p>
                  <p className="text-sm">
                    For security, there's a limit on login attempts. Please wait {countdown} seconds.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
