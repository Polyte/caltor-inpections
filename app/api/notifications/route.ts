import { type NextRequest, NextResponse } from "next/server"
import { ServerNotificationService } from "@/lib/notifications"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

async function getSupabaseClient() {
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
}

export async function POST(request: NextRequest) {
  try {
    // Get user from server-side auth
    const supabase = await getSupabaseClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user role from database
    const { data: userData, error: roleError } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (roleError || !userData || userData.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 401 })
    }

    const body = await request.json()
    const { recipientIds, type, priority, title, message, data } = body

    if (!recipientIds || !Array.isArray(recipientIds) || recipientIds.length === 0) {
      return NextResponse.json({ error: "Recipient IDs are required" }, { status: 400 })
    }

    if (!type || !title || !message) {
      return NextResponse.json({ error: "Type, title, and message are required" }, { status: 400 })
    }

    const notificationService = new ServerNotificationService()

    // Create notifications for multiple recipients
    const notifications = recipientIds.map((recipientId) => ({
      recipientId,
      senderId: user.id,
      type,
      priority: priority || "medium",
      title,
      message,
      data: data || {},
    }))

    const result = await notificationService.createBulkNotifications(notifications)

    return NextResponse.json({
      success: true,
      notifications: result,
      count: result.length,
    })
  } catch (error) {
    console.error("Error creating notifications:", error)
    return NextResponse.json({ error: "Failed to create notifications" }, { status: 500 })
  }
}
