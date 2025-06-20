import { createClient, isSupabaseConfigured } from "@/lib/supabase"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export type NotificationType =
  | "inspection_assigned"
  | "inspection_completed"
  | "inspection_reviewed"
  | "status_changed"
  | "urgent_alert"
  | "system_announcement"
  | "user_mention"

export type NotificationPriority = "low" | "medium" | "high" | "urgent"

export interface Notification {
  id: string
  recipient_id: string
  sender_id?: string
  type: NotificationType
  priority: NotificationPriority
  title: string
  message: string
  data?: Record<string, any>
  read_at?: string
  dismissed_at?: string
  created_at: string
  updated_at: string
}

export interface NotificationPreferences {
  id: string
  user_id: string
  email_enabled: boolean
  push_enabled: boolean
  inspection_assigned_email: boolean
  inspection_assigned_push: boolean
  inspection_completed_email: boolean
  inspection_completed_push: boolean
  inspection_reviewed_email: boolean
  inspection_reviewed_push: boolean
  status_changed_email: boolean
  status_changed_push: boolean
  urgent_alert_email: boolean
  urgent_alert_push: boolean
  system_announcement_email: boolean
  system_announcement_push: boolean
  email_frequency: "immediate" | "hourly" | "daily" | "weekly"
  quiet_hours_start: string
  quiet_hours_end: string
  timezone: string
}

// Client-side notification service
export class NotificationService {
  private supabase = createClient()
  private isConfigured = isSupabaseConfigured()

  private handleError(error: any, operation: string): boolean {
    // Return true if error should be ignored, false if it should be thrown
    if (
      error?.message?.includes("not configured") ||
      error?.message?.includes("Auth session missing") ||
      error?.message?.includes("Invalid JWT") ||
      error?.message?.includes("JWT expired") ||
      error?.message?.includes("Failed to fetch")
    ) {
      return true // Ignore these errors
    }
    console.error(`Error in ${operation}:`, error)
    return false // Don't ignore other errors
  }

  async getNotifications(userId: string, limit = 50, offset = 0) {
    if (!this.isConfigured) {
      return []
    }

    try {
      const { data, error } = await this.supabase
        .from("notifications")
        .select(`
          *,
          sender:sender_id(full_name, email)
        `)
        .eq("recipient_id", userId)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        if (this.handleError(error, "getNotifications")) {
          return []
        }
        throw error
      }
      return data || []
    } catch (error) {
      if (this.handleError(error, "getNotifications")) {
        return []
      }
      throw error
    }
  }

  async getUnreadCount(userId: string) {
    if (!this.isConfigured) {
      return 0
    }

    try {
      const { count, error } = await this.supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("recipient_id", userId)
        .is("read_at", null)
        .is("dismissed_at", null)

      if (error) {
        if (this.handleError(error, "getUnreadCount")) {
          return 0
        }
        throw error
      }
      return count || 0
    } catch (error) {
      if (this.handleError(error, "getUnreadCount")) {
        return 0
      }
      throw error
    }
  }

  async markAsRead(notificationId: string) {
    if (!this.isConfigured) return

    try {
      const { error } = await this.supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("id", notificationId)

      if (error && !this.handleError(error, "markAsRead")) {
        throw error
      }
    } catch (error) {
      if (!this.handleError(error, "markAsRead")) {
        throw error
      }
    }
  }

  async markAllAsRead(userId: string) {
    if (!this.isConfigured) return

    try {
      const { error } = await this.supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("recipient_id", userId)
        .is("read_at", null)

      if (error && !this.handleError(error, "markAllAsRead")) {
        throw error
      }
    } catch (error) {
      if (!this.handleError(error, "markAllAsRead")) {
        throw error
      }
    }
  }

  async dismissNotification(notificationId: string) {
    if (!this.isConfigured) return

    try {
      const { error } = await this.supabase
        .from("notifications")
        .update({ dismissed_at: new Date().toISOString() })
        .eq("id", notificationId)

      if (error && !this.handleError(error, "dismissNotification")) {
        throw error
      }
    } catch (error) {
      if (!this.handleError(error, "dismissNotification")) {
        throw error
      }
    }
  }

  async getPreferences(userId: string): Promise<NotificationPreferences | null> {
    if (!this.isConfigured) {
      // Return default preferences when not configured
      return {
        id: "default",
        user_id: userId,
        email_enabled: true,
        push_enabled: true,
        inspection_assigned_email: true,
        inspection_assigned_push: true,
        inspection_completed_email: true,
        inspection_completed_push: true,
        inspection_reviewed_email: false,
        inspection_reviewed_push: true,
        status_changed_email: true,
        status_changed_push: true,
        urgent_alert_email: true,
        urgent_alert_push: true,
        system_announcement_email: false,
        system_announcement_push: true,
        email_frequency: "immediate",
        quiet_hours_start: "22:00",
        quiet_hours_end: "08:00",
        timezone: "UTC",
      }
    }

    try {
      const { data, error } = await this.supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", userId)
        .single()

      if (error) {
        if (this.handleError(error, "getPreferences")) {
          return null
        }
        throw error
      }
      return data
    } catch (error) {
      if (this.handleError(error, "getPreferences")) {
        return null
      }
      throw error
    }
  }

  async updatePreferences(userId: string, preferences: Partial<NotificationPreferences>) {
    if (!this.isConfigured) return

    try {
      const { error } = await this.supabase
        .from("notification_preferences")
        .update({
          ...preferences,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)

      if (error && !this.handleError(error, "updatePreferences")) {
        throw error
      }
    } catch (error) {
      if (!this.handleError(error, "updatePreferences")) {
        throw error
      }
    }
  }

  // Subscribe to real-time notifications
  subscribeToNotifications(userId: string, callback: (notification: Notification) => void) {
    if (!this.isConfigured) {
      return { unsubscribe: () => {} }
    }

    try {
      return this.supabase
        .channel("notifications")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `recipient_id=eq.${userId}`,
          },
          (payload) => {
            callback(payload.new as Notification)
          },
        )
        .subscribe()
    } catch (error) {
      console.error("Error subscribing to notifications:", error)
      return { unsubscribe: () => {} }
    }
  }
}

// Server-side notification service (unchanged)
export class ServerNotificationService {
  private async getSupabaseClient() {
    try {
      const cookieStore = await cookies()

      return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      })
    } catch (error) {
      console.error("Error creating server Supabase client:", error)
      return null
    }
  }

  async createNotification({
    recipientId,
    senderId,
    type,
    priority = "medium",
    title,
    message,
    data = {},
  }: {
    recipientId: string
    senderId?: string
    type: NotificationType
    priority?: NotificationPriority
    title: string
    message: string
    data?: Record<string, any>
  }) {
    const supabase = await this.getSupabaseClient()
    if (!supabase) return null

    try {
      const { data: notification, error } = await supabase
        .from("notifications")
        .insert({
          recipient_id: recipientId,
          sender_id: senderId,
          type,
          priority,
          title,
          message,
          data,
        })
        .select()
        .single()

      if (error) throw error

      // Queue email notification if user preferences allow
      await this.queueEmailNotification(notification.id)

      return notification
    } catch (error) {
      console.error("Error creating notification:", error)
      return null
    }
  }

  async createBulkNotifications(
    notifications: Array<{
      recipientId: string
      senderId?: string
      type: NotificationType
      priority?: NotificationPriority
      title: string
      message: string
      data?: Record<string, any>
    }>,
  ) {
    const supabase = await this.getSupabaseClient()
    if (!supabase) return []

    try {
      const notificationData = notifications.map((n) => ({
        recipient_id: n.recipientId,
        sender_id: n.senderId,
        type: n.type,
        priority: n.priority || "medium",
        title: n.title,
        message: n.message,
        data: n.data || {},
      }))

      const { data, error } = await supabase.from("notifications").insert(notificationData).select()

      if (error) throw error

      // Queue email notifications
      for (const notification of data || []) {
        await this.queueEmailNotification(notification.id)
      }

      return data || []
    } catch (error) {
      console.error("Error creating bulk notifications:", error)
      return []
    }
  }

  private async queueEmailNotification(notificationId: string) {
    const supabase = await this.getSupabaseClient()
    if (!supabase) return

    try {
      // Get notification with user preferences
      const { data: notificationData, error } = await supabase
        .from("notifications")
        .select(`
          *,
          recipient:recipient_id(email, full_name),
          preferences:recipient_id(notification_preferences(*))
        `)
        .eq("id", notificationId)
        .single()

      if (error || !notificationData) return

      const { recipient, preferences, type, title, message } = notificationData
      const prefs = preferences?.notification_preferences

      // Check if email notifications are enabled for this type
      const emailEnabled = prefs?.email_enabled && prefs?.[`${type}_email`]
      if (!emailEnabled) return

      // Generate email content
      const emailSubject = `[Caltor Inspections] ${title}`
      const emailBody = this.generateEmailBody(notificationData)

      // Queue the email
      await supabase.from("notification_queue").insert({
        notification_id: notificationId,
        email_address: recipient.email,
        subject: emailSubject,
        body: emailBody,
        scheduled_for: this.calculateScheduledTime(prefs),
      })
    } catch (error) {
      console.error("Error queueing email notification:", error)
    }
  }

  private generateEmailBody(notification: any): string {
    const { title, message, recipient, data } = notification

    return `
      <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
            <div style="background-color: #2563eb; color: white; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
              <h1 style="margin: 0; font-size: 24px;">Caltor Inspections</h1>
            </div>
            
            <h2 style="color: #1f2937; margin-bottom: 15px;">${title}</h2>
            
            <div style="background-color: white; padding: 20px; border-radius: 6px; border-left: 4px solid #2563eb;">
              <p style="color: #374151; line-height: 1.6; margin: 0;">${message}</p>
            </div>
            
            ${
              data?.inspection_id
                ? `
              <div style="margin-top: 20px; padding: 15px; background-color: #e5e7eb; border-radius: 6px;">
                <p style="margin: 0; color: #6b7280; font-size: 14px;">
                  <strong>Inspection Details:</strong><br>
                  ${data.client_name ? `Client: ${data.client_name}<br>` : ""}
                  ${data.inspector_name ? `Inspector: ${data.inspector_name}<br>` : ""}
                  Inspection ID: ${data.inspection_id}
                </p>
              </div>
            `
                : ""
            }
            
            <div style="margin-top: 30px; text-align: center;">
              <a href="${process.env.NEXTAUTH_URL || "http://localhost:3000"}/dashboard" 
                 style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                View Dashboard
              </a>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="color: #6b7280; font-size: 12px; margin: 0;">
                You received this email because you have notifications enabled for this type of update.
                <br>
                <a href="${process.env.NEXTAUTH_URL || "http://localhost:3000"}/dashboard/settings/notifications" 
                   style="color: #2563eb;">Manage your notification preferences</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `
  }

  private calculateScheduledTime(preferences: any): string {
    if (!preferences || preferences.email_frequency === "immediate") {
      return new Date().toISOString()
    }

    const now = new Date()
    switch (preferences.email_frequency) {
      case "hourly":
        return new Date(now.getTime() + 60 * 60 * 1000).toISOString()
      case "daily":
        const tomorrow = new Date(now)
        tomorrow.setDate(tomorrow.getDate() + 1)
        tomorrow.setHours(9, 0, 0, 0) // 9 AM next day
        return tomorrow.toISOString()
      case "weekly":
        const nextWeek = new Date(now)
        nextWeek.setDate(nextWeek.getDate() + 7)
        nextWeek.setHours(9, 0, 0, 0) // 9 AM next week
        return nextWeek.toISOString()
      default:
        return new Date().toISOString()
    }
  }
}
