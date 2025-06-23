"use client"

import {useEffect, useState} from "react"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {Button} from '@/components/ui/button'
import {Switch} from '@/components/ui/switch'
import {Label} from "@/components/ui/label"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import {Input} from "@/components/ui/input"
import {Alert, AlertDescription} from "@/components/ui/alert"
import {type NotificationPreferences, NotificationService} from "@/lib/notifications"
import {createClient, isSupabaseConfigured} from "@/lib/supabase"
import {useToast} from "@/hooks/use-toast"
import {useNotifications} from "@/components/providers/notification-provider"
import { Bell, Mail, Smartphone, Clock, Volume2, AlertTriangle, ExternalLink, Loader2 } from "lucide-react"
import { Session, AuthChangeEvent } from '@supabase/supabase-js';

export default function NotificationSettingsPage() {
    const [preferences, setPreferences] = useState<NotificationPreferences | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [user, setUser] = useState<any>(null)
    const [authLoading, setAuthLoading] = useState(true)
    const {toast} = useToast()
    const {isConfigured} = useNotifications()
    const supabase = createClient()

    // Check if Supabase is configured (client-side only)
    const [supabaseConfigured, setSupabaseConfigured] = useState(false)

    useEffect(() => {
        if (typeof window !== "undefined") {
            setSupabaseConfigured(isSupabaseConfigured())
        }
    }, [])

    // Handle authentication
    useEffect(() => {
        const checkAuth = async () => {
            if (!supabaseConfigured) {
                setAuthLoading(false)
                setLoading(false)
                return
            }

            try {
                const {
                    data: {user: currentUser},
                    error: userError,
                } = await supabase.auth.getUser()

                if (userError && !userError.message.includes("not configured")) {
                    console.error("Error getting user:", userError)
                    toast({
                        title: "Authentication Error",
                        description: "Failed to get user information. Please try logging in again.",
                        variant: "destructive",
                    })
                    return
                }

                if (!currentUser && supabaseConfigured) {
                    toast({
                        title: "Authentication Required",
                        description: "Please log in to access notification settings.",
                        variant: "destructive",
                    })
                    return
                }

                setUser(currentUser)
            } catch (error) {
                console.error("Error checking auth:", error)
                toast({
                    title: "Error",
                    description: "Failed to verify authentication status.",
                    variant: "destructive",
                })
            } finally {
                setAuthLoading(false)
            }
        }

        checkAuth()

        // Listen for auth state changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
            setUser(session?.user || null)
            setAuthLoading(false)
        });

        return () => subscription.unsubscribe()
    }, [supabase.auth, supabaseConfigured, toast])

    // Load notification preferences
    useEffect(() => {
        const loadPreferences = async () => {
            if (!user?.id || !supabaseConfigured) {
                setLoading(false)
                return
            }

            try {
                setLoading(true)
                const notificationService = new NotificationService()
                const prefs = await notificationService.getPreferences(user.id)
                setPreferences(prefs)
            } catch (error) {
                console.error("Error loading preferences:", error)
                toast({
                    title: "Error",
                    description: "Failed to load notification preferences",
                    variant: "destructive",
                })
            } finally {
                setLoading(false)
            }
        }

        if (!authLoading) {
            loadPreferences()
        }
    }, [user?.id, supabaseConfigured, authLoading, toast])

    const handleSave = async () => {
        if (!user?.id || !preferences || !supabaseConfigured) return

        setSaving(true)
        try {
            const notificationService = new NotificationService()
            await notificationService.updatePreferences(user.id, preferences)
            toast({
                title: "Success",
                description: "Notification preferences updated successfully",
            })
        } catch (error) {
            console.error("Error saving preferences:", error)
            toast({
                title: "Error",
                description: "Failed to save notification preferences",
                variant: "destructive",
            })
        } finally {
            setSaving(false)
        }
    }

    const updatePreference = (key: keyof NotificationPreferences, value: any) => {
        if (!preferences) return
        setPreferences({...preferences, [key]: value})
    }

    // Show loading state while checking authentication
    if (authLoading) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Notification Settings</h1>
                    <p className="text-gray-500 mt-2">Loading...</p>
                </div>
                <div className="flex items-center justify-center py-12">
                    <div className="flex items-center space-x-2">
                        <Loader2 className="h-6 w-6 animate-spin"/>
                        <span>Checking authentication...</span>
                    </div>
                </div>
            </div>
        )
    }

    // Show configuration warning if Supabase is not set up
    if (!supabaseConfigured) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Notification Settings</h1>
                    <p className="text-gray-500 mt-2">Manage your notification preferences</p>
                </div>

                <Alert className="border-orange-200 bg-orange-50">
                    <AlertTriangle className="h-4 w-4 text-orange-600"/>
                    <AlertDescription className="text-orange-800">
                        <div className="space-y-3">
                            <p className="font-medium">Supabase Configuration Required</p>
                            <p>
                                To use the notification system, you need to configure your Supabase environment
                                variables in your{" "}
                                <code className="bg-orange-100 px-1 py-0.5 rounded text-sm">.env.local</code> file:
                            </p>
                            <div className="bg-orange-100 p-3 rounded-md font-mono text-sm">
                                <div>NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co</div>
                                <div>NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here</div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span>Get your credentials from:</span>
                                <a
                                    href="https://supabase.com/dashboard"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-orange-700 hover:text-orange-800 underline"
                                >
                                    Supabase Dashboard
                                    <ExternalLink className="h-3 w-3"/>
                                </a>
                            </div>
                        </div>
                    </AlertDescription>
                </Alert>

                <Card className="opacity-50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bell className="h-5 w-5"/>
                            General Settings
                        </CardTitle>
                        <CardDescription>Control your overall notification preferences (requires
                            configuration)</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Email Notifications</Label>
                                <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                            </div>
                            <Switch disabled/>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Push Notifications</Label>
                                <p className="text-sm text-muted-foreground">Receive in-app notifications</p>
                            </div>
                            <Switch disabled/>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // Show authentication required message
    if (!user) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Notification Settings</h1>
                    <p className="text-gray-500 mt-2">Authentication required</p>
                </div>
                <Alert className="border-blue-200 bg-blue-50">
                    <AlertTriangle className="h-4 w-4 text-blue-600"/>
                    <AlertDescription className="text-blue-800">
                        <div className="space-y-2">
                            <p className="font-medium">Please log in to access notification settings</p>
                            <p>You need to be authenticated to view and modify your notification preferences.</p>
                        </div>
                    </AlertDescription>
                </Alert>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Notification Settings</h1>
                    <p className="text-gray-500 mt-2">Loading your notification preferences...</p>
                </div>
                <div className="flex items-center justify-center py-12">
                    <div className="flex items-center space-x-2">
                        <Loader2 className="h-6 w-6 animate-spin"/>
                        <span>Loading preferences...</span>
                    </div>
                </div>
            </div>
        )
    }

    if (!preferences) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Notification Settings</h1>
                    <p className="text-gray-500 mt-2">Manage your notification preferences</p>
                </div>
                <Alert>
                    <AlertDescription>Unable to load notification preferences. Please try refreshing the
                        page.</AlertDescription>
                </Alert>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Notification Settings</h1>
                <p className="text-gray-500 mt-2">Customize how and when you receive notifications</p>
            </div>

            {/* User Info */}
            <Alert className="border-green-200 bg-green-50">
                <Bell className="h-4 w-4 text-green-600"/>
                <AlertDescription className="text-green-800">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">Logged in as: {user.email}</p>
                            <p className="text-sm">Notification system is active and configured</p>
                        </div>
                    </div>
                </AlertDescription>
            </Alert>

            {/* General Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5"/>
                        General Settings
                    </CardTitle>
                    <CardDescription>Control your overall notification preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="email-enabled">Email Notifications</Label>
                            <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                        </div>
                        <Switch
                            id="email-enabled"
                            checked={preferences.email_enabled}
                            onCheckedChange={(checked) => updatePreference("email_enabled", checked)}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="push-enabled">Push Notifications</Label>
                            <p className="text-sm text-muted-foreground">Receive in-app notifications</p>
                        </div>
                        <Switch
                            id="push-enabled"
                            checked={preferences.push_enabled}
                            onCheckedChange={(checked) => updatePreference("push_enabled", checked)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email-frequency">Email Frequency</Label>
                        <Select
                            value={preferences.email_frequency}
                            onValueChange={(value) => updatePreference("email_frequency", value)}
                        >
                            <SelectTrigger>
                                <SelectValue/>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="immediate">Immediate</SelectItem>
                                <SelectItem value="hourly">Hourly digest</SelectItem>
                                <SelectItem value="daily">Daily digest</SelectItem>
                                <SelectItem value="weekly">Weekly digest</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Notification Types */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Volume2 className="h-5 w-5"/>
                        Notification Types
                    </CardTitle>
                    <CardDescription>Choose which types of notifications you want to receive</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Inspection Assigned */}
                    <div className="space-y-3">
                        <h4 className="font-medium">Inspection Assigned</h4>
                        <div className="grid grid-cols-2 gap-4 pl-4">
                            <div className="flex items-center space-x-2">
                                <Mail className="h-4 w-4 text-muted-foreground"/>
                                <Switch
                                    checked={preferences.inspection_assigned_email}
                                    onCheckedChange={(checked) => updatePreference("inspection_assigned_email", checked)}
                                />
                                <Label>Email</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Smartphone className="h-4 w-4 text-muted-foreground"/>
                                <Switch
                                    checked={preferences.inspection_assigned_push}
                                    onCheckedChange={(checked) => updatePreference("inspection_assigned_push", checked)}
                                />
                                <Label>Push</Label>
                            </div>
                        </div>
                    </div>

                    {/* Inspection Completed */}
                    <div className="space-y-3">
                        <h4 className="font-medium">Inspection Completed</h4>
                        <div className="grid grid-cols-2 gap-4 pl-4">
                            <div className="flex items-center space-x-2">
                                <Mail className="h-4 w-4 text-muted-foreground"/>
                                <Switch
                                    checked={preferences.inspection_completed_email}
                                    onCheckedChange={(checked) => updatePreference("inspection_completed_email", checked)}
                                />
                                <Label>Email</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Smartphone className="h-4 w-4 text-muted-foreground"/>
                                <Switch
                                    checked={preferences.inspection_completed_push}
                                    onCheckedChange={(checked) => updatePreference("inspection_completed_push", checked)}
                                />
                                <Label>Push</Label>
                            </div>
                        </div>
                    </div>

                    {/* Inspection Reviewed */}
                    <div className="space-y-3">
                        <h4 className="font-medium">Inspection Reviewed</h4>
                        <div className="grid grid-cols-2 gap-4 pl-4">
                            <div className="flex items-center space-x-2">
                                <Mail className="h-4 w-4 text-muted-foreground"/>
                                <Switch
                                    checked={preferences.inspection_reviewed_email}
                                    onCheckedChange={(checked) => updatePreference("inspection_reviewed_email", checked)}
                                />
                                <Label>Email</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Smartphone className="h-4 w-4 text-muted-foreground"/>
                                <Switch
                                    checked={preferences.inspection_reviewed_push}
                                    onCheckedChange={(checked) => updatePreference("inspection_reviewed_push", checked)}
                                />
                                <Label>Push</Label>
                            </div>
                        </div>
                    </div>

                    {/* Status Changed */}
                    <div className="space-y-3">
                        <h4 className="font-medium">Status Changes</h4>
                        <div className="grid grid-cols-2 gap-4 pl-4">
                            <div className="flex items-center space-x-2">
                                <Mail className="h-4 w-4 text-muted-foreground"/>
                                <Switch
                                    checked={preferences.status_changed_email}
                                    onCheckedChange={(checked) => updatePreference("status_changed_email", checked)}
                                />
                                <Label>Email</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Smartphone className="h-4 w-4 text-muted-foreground"/>
                                <Switch
                                    checked={preferences.status_changed_push}
                                    onCheckedChange={(checked) => updatePreference("status_changed_push", checked)}
                                />
                                <Label>Push</Label>
                            </div>
                        </div>
                    </div>

                    {/* Urgent Alerts */}
                    <div className="space-y-3">
                        <h4 className="font-medium">Urgent Alerts</h4>
                        <div className="grid grid-cols-2 gap-4 pl-4">
                            <div className="flex items-center space-x-2">
                                <Mail className="h-4 w-4 text-muted-foreground"/>
                                <Switch
                                    checked={preferences.urgent_alert_email}
                                    onCheckedChange={(checked) => updatePreference("urgent_alert_email", checked)}
                                />
                                <Label>Email</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Smartphone className="h-4 w-4 text-muted-foreground"/>
                                <Switch
                                    checked={preferences.urgent_alert_push}
                                    onCheckedChange={(checked) => updatePreference("urgent_alert_push", checked)}
                                />
                                <Label>Push</Label>
                            </div>
                        </div>
                    </div>

                    {/* System Announcements */}
                    <div className="space-y-3">
                        <h4 className="font-medium">System Announcements</h4>
                        <div className="grid grid-cols-2 gap-4 pl-4">
                            <div className="flex items-center space-x-2">
                                <Mail className="h-4 w-4 text-muted-foreground"/>
                                <Switch
                                    checked={preferences.system_announcement_email}
                                    onCheckedChange={(checked) => updatePreference("system_announcement_email", checked)}
                                />
                                <Label>Email</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Smartphone className="h-4 w-4 text-muted-foreground"/>
                                <Switch
                                    checked={preferences.system_announcement_push}
                                    onCheckedChange={(checked) => updatePreference("system_announcement_push", checked)}
                                />
                                <Label>Push</Label>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Quiet Hours */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5"/>
                        Quiet Hours
                    </CardTitle>
                    <CardDescription>Set times when you don't want to receive notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="quiet-start">Start Time</Label>
                            <Input
                                id="quiet-start"
                                type="time"
                                value={preferences.quiet_hours_start}
                                onChange={(e) => updatePreference("quiet_hours_start", e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="quiet-end">End Time</Label>
                            <Input
                                id="quiet-end"
                                type="time"
                                value={preferences.quiet_hours_end}
                                onChange={(e) => updatePreference("quiet_hours_end", e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="timezone">Timezone</Label>
                        <Select value={preferences.timezone}
                                onValueChange={(value) => updatePreference("timezone", value)}>
                            <SelectTrigger>
                                <SelectValue/>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="UTC">UTC</SelectItem>
                                <SelectItem value="America/New_York">Eastern Time</SelectItem>
                                <SelectItem value="America/Chicago">Central Time</SelectItem>
                                <SelectItem value="America/Denver">Mountain Time</SelectItem>
                                <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                                <SelectItem value="Europe/London">London</SelectItem>
                                <SelectItem value="Europe/Paris">Paris</SelectItem>
                                <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                                <SelectItem value="Australia/Sydney">Sydney</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving}>
                    {saving ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                            Saving...
                        </>
                    ) : (
                        "Save Preferences"
                    )}
                </Button>
            </div>
        </div>
    )
}
