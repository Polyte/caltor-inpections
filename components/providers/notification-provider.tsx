"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { NotificationService, type Notification } from "@/lib/notifications"
import { useToast } from "@/hooks/use-toast"
import { createClient, isSupabaseConfigured } from "@/lib/supabase"

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  dismissNotification: (id: string) => Promise<void>
  refreshNotifications: () => Promise<void>
  isConfigured: boolean
  isAuthenticated: boolean
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [configured, setConfigured] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true)
  }, [])

  // Check if Supabase is properly configured (client-side only)
  useEffect(() => {
    if (mounted) {
      const isConfigured = isSupabaseConfigured()
      setConfigured(isConfigured)

      if (!isConfigured) {
        setLoading(false)
        console.warn("Supabase is not properly configured. Notification system will be disabled.")
        return
      }
    }
  }, [mounted])

  // Get current user using client-side Supabase
  useEffect(() => {
    if (!configured || !mounted) return

    const getCurrentUser = async () => {
      try {
        const {
          data: { user: currentUser },
          error,
        } = await supabase.auth.getUser()

        if (error) {
          // Only log errors that aren't configuration-related
          if (!error.message.includes("not configured") && !error.message.includes("session missing")) {
            console.error("Error getting user:", error)
          }
          setUser(null)
          setIsAuthenticated(false)
          return
        }

        setUser(currentUser)
        setIsAuthenticated(!!currentUser)
      } catch (error) {
        console.error("Error getting user:", error)
        setUser(null)
        setIsAuthenticated(false)
      }
    }

    getCurrentUser()

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const currentUser = session?.user || null
      setUser(currentUser)
      setIsAuthenticated(!!currentUser)

      // Clear notifications when user logs out
      if (!currentUser) {
        setNotifications([])
        setUnreadCount(0)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth, configured, mounted])

  // Create notification service only if configured and authenticated
  const notificationService = configured && isAuthenticated ? new NotificationService() : null

  // Load initial notifications
  const loadNotifications = useCallback(async () => {
    if (!user?.id || !notificationService || !configured || !isAuthenticated) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const [notificationsData, unreadCountData] = await Promise.all([
        notificationService.getNotifications(user.id, 50),
        notificationService.getUnreadCount(user.id),
      ])

      setNotifications(notificationsData || [])
      setUnreadCount(unreadCountData)
    } catch (error) {
      console.error("Error loading notifications:", error)
      // Only show toast if user is authenticated and configured
      if (configured && isAuthenticated) {
        toast({
          title: "Error",
          description: "Failed to load notifications",
          variant: "destructive",
        })
      }
    } finally {
      setLoading(false)
    }
  }, [user?.id, toast, notificationService, configured, isAuthenticated])

  useEffect(() => {
    if (mounted && user?.id && configured && isAuthenticated) {
      loadNotifications()
    } else {
      setLoading(false)
    }
  }, [user?.id, loadNotifications, configured, isAuthenticated, mounted])

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!user?.id || !notificationService || !configured || !isAuthenticated || !mounted) return

    const subscription = notificationService.subscribeToNotifications(user.id, (newNotification) => {
      setNotifications((prev) => [newNotification, ...prev])
      setUnreadCount((prev) => prev + 1)

      // Show toast for high priority notifications
      if (newNotification.priority === "high" || newNotification.priority === "urgent") {
        toast({
          title: newNotification.title,
          description: newNotification.message,
          variant: newNotification.priority === "urgent" ? "destructive" : "default",
        })
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [user?.id, toast, notificationService, configured, isAuthenticated, mounted])

  const markAsRead = async (id: string) => {
    if (!notificationService || !configured || !isAuthenticated) return

    try {
      await notificationService.markAsRead(id)
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)))
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const markAllAsRead = async () => {
    if (!user?.id || !notificationService || !configured || !isAuthenticated) return

    try {
      await notificationService.markAllAsRead(user.id)
      setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() })))
      setUnreadCount(0)
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
    }
  }

  const dismissNotification = async (id: string) => {
    if (!notificationService || !configured || !isAuthenticated) return

    try {
      await notificationService.dismissNotification(id)
      setNotifications((prev) => prev.filter((n) => n.id !== id))
      setUnreadCount((prev) => {
        const notification = notifications.find((n) => n.id === id)
        return notification && !notification.read_at ? Math.max(0, prev - 1) : prev
      })
    } catch (error) {
      console.error("Error dismissing notification:", error)
    }
  }

  const refreshNotifications = async () => {
    if (configured && isAuthenticated) {
      await loadNotifications()
    }
  }

  const value = {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    refreshNotifications,
    isConfigured: configured,
    isAuthenticated,
  }

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider")
  }
  return context
}
