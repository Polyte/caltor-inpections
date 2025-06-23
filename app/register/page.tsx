"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AuthService } from "@/lib/auth-service"
import { useToast } from "@/hooks/use-toast"
import { Zap, Loader2, AlertTriangle, Clock, CheckCircle, UserPlus } from "lucide-react"

export default function RegisterPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [role, setRole] = useState("employee")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [rateLimited, setRateLimited] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const authService = new AuthService()

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

  const handleRegister = async (e: React.FormEvent) => {
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
    setSuccess(false)

    try {
      // Check if email already exists first (temporary skip for testing)
      try {
        const emailExists = await authService.checkEmailExists(email)
        if (emailExists) {
          setError("An account with this email already exists. Please try signing in instead.")
          setLoading(false)
          return
        }
      } catch (emailCheckError: any) {
        console.warn("Email check failed, continuing with registration:", emailCheckError.message)
        // Continue with registration even if email check fails
      }

      // Attempt registration
      const result = await authService.signUp({
        email,
        password,
        fullName,
        role: role as "admin" | "employee",
      })

      console.log("Registration result:", result)

      // Handle successful registration
      if (result.accountCreated) {
        setSuccess(true)

        if (result.user && result.session) {
          // User is fully signed in
          toast({
            title: "Success!",
            description: "Account created and logged in successfully. Welcome to Caltor Inspections!",
          })

          // Small delay to show success message
          setTimeout(() => {
            router.push("/dashboard")
          }, 1000)
        } else if (result.user && !result.session) {
          // User created but not signed in, try to sign them in
          toast({
            title: "Account Created",
            description: "Account created successfully. Signing you in...",
          })

          try {
            await authService.signIn({ email, password })
            setTimeout(() => {
              router.push("/dashboard")
            }, 1000)
          } catch (signInError: any) {
            console.log("Auto sign-in failed, redirecting to login:", signInError.message)
            toast({
              title: "Account Created",
              description: "Please sign in with your new account.",
            })
            setTimeout(() => {
              router.push("/login")
            }, 2000)
          }
        }
      } else {
        // Fallback: try to sign them in directly
        try {
          await authService.signIn({ email, password })
          toast({
            title: "Success!",
            description: "Account created and logged in successfully!",
          })
          setTimeout(() => {
            router.push("/dashboard")
          }, 1000)
        } catch (signInError: any) {
          toast({
            title: "Account Created",
            description: "Account created successfully. Please sign in.",
          })
          setTimeout(() => {
            router.push("/login")
          }, 2000)
        }
      }
    } catch (error: any) {
      console.error("Registration error:", error)
      const errorMessage = error.message || "An unexpected error occurred"

      // Handle rate limiting
      if (errorMessage.includes("wait") && errorMessage.includes("seconds")) {
        const match = errorMessage.match(/(\d+) seconds/)
        const seconds = match ? Number.parseInt(match[1]) : 60
        setRateLimited(true)
        setCountdown(seconds)
        setError(`Too many requests. Please wait ${seconds} seconds before trying again.`)
      } else if (errorMessage.includes("already exists")) {
        setError("An account with this email already exists. Please try signing in instead.")
      } else {
        setError(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  const getErrorIcon = () => {
    if (rateLimited) return <Clock className="h-4 w-4" />
    if (error.includes("already exists")) return <CheckCircle className="h-4 w-4" />
    return <AlertTriangle className="h-4 w-4" />
  }

  const getErrorVariant = () => {
    if (error.includes("already exists")) return "default"
    return "destructive"
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <Card className="border-green-200 bg-green-50">
            <CardHeader className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="mt-4 text-green-800">Account Created Successfully!</CardTitle>
              <CardDescription className="text-green-700">
                Welcome to Caltor Inspections. You're being signed in automatically.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="flex items-center justify-center space-x-2 text-green-700">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Redirecting to dashboard...</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
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
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Join Caltor</h2>
          <p className="mt-2 text-sm text-gray-600">Create your inspection management account</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Create account
            </CardTitle>
            <CardDescription>Enter your information to get started - no email verification required!</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              {error && (
                <Alert variant={getErrorVariant()}>
                  {getErrorIcon()}
                  <AlertDescription>
                    {error}
                    {rateLimited && countdown > 0 && (
                      <div className="mt-2 text-sm">
                        <strong>Time remaining: {countdown} seconds</strong>
                      </div>
                    )}
                    {error.includes("already exists") && (
                      <div className="mt-2">
                        <Link href="/login" className="text-blue-600 hover:text-blue-500 underline">
                          Sign in instead
                        </Link>
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  placeholder="Enter your full name"
                  disabled={loading || rateLimited}
                />
              </div>

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
                  placeholder="Create a password"
                  minLength={6}
                  disabled={loading || rateLimited}
                />
                <p className="text-xs text-gray-500">Minimum 6 characters</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={role} onValueChange={setRole} disabled={loading || rateLimited}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Employee</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full" disabled={loading || rateLimited}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : rateLimited ? (
                  <>
                    <Clock className="mr-2 h-4 w-4" />
                    Wait {countdown}s
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Create account & sign in
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Info card about no email verification */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-blue-800">
              <CheckCircle className="h-5 w-5" />
              <div>
                <p className="font-medium">Instant Access</p>
                <p className="text-sm">
                  No email verification required! You'll be signed in immediately after registration.
                </p>
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
                    For security, there's a limit on registration attempts. Please wait {countdown} seconds.
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
