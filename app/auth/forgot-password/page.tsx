"use client"

import type React from "react"
import {useState} from "react"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {Button} from "../../../components/ui/button"
import {Input} from "../../../components/ui/input"
import {Label} from "../../../components/ui/label"
import {Alert, AlertDescription} from "../../../components/ui/alert"
import {AuthService} from "../../../lib/auth-service"
import {useToast} from "../../../hooks/use-toast"
import {CheckCircle, Loader2, Mail} from "lucide-react"
import Link from "next/link"

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("")
    const [loading, setLoading] = useState(false)
    const [emailSent, setEmailSent] = useState(false)
    const [error, setError] = useState("")
    const {toast} = useToast()
    const authService = new AuthService()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        try {
            await authService.resetPassword(email)
            setEmailSent(true)
            toast({
                title: "Email Sent",
                description: "Password reset instructions have been sent to your email.",
            })
        } catch (error: any) {
            setError(error.message || "Failed to send reset email")
        } finally {
            setLoading(false)
        }
    }

    if (emailSent) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8">
                    <Card>
                        <CardHeader className="text-center">
                            <div
                                className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                                <CheckCircle className="h-6 w-6 text-green-600"/>
                            </div>
                            <CardTitle className="mt-4">Check your email</CardTitle>
                            <CardDescription>
                                We've sent password reset instructions to <strong>{email}</strong>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Alert>
                                <Mail className="h-4 w-4"/>
                                <AlertDescription>
                                    Click the link in your email to reset your password. The link will expire in 1 hour.
                                </AlertDescription>
                            </Alert>

                            <div className="text-center">
                                <Link href="/login" className="text-sm text-blue-600 hover:text-blue-500">
                                    Back to sign in
                                </Link>
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
                <Card>
                    <CardHeader className="text-center">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
                            <Mail className="h-6 w-6 text-blue-600"/>
                        </div>
                        <CardTitle className="mt-4">Forgot your password?</CardTitle>
                        <CardDescription>Enter your email address and we'll send you a link to reset your
                            password</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <Alert variant="destructive">
                                    <AlertDescription>{error}</AlertDescription>
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
                                    placeholder="Enter your email address"
                                />
                            </div>

                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                                        Sending...
                                    </>
                                ) : (
                                    "Send reset instructions"
                                )}
                            </Button>
                        </form>

                        <div className="mt-6 text-center">
                            <Link href="/login" className="text-sm text-blue-600 hover:text-blue-500">
                                Back to sign in
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
