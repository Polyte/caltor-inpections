"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Zap, FileText, Plus, Users, Settings, BarChart3, Home, ClipboardList, Bell } from "lucide-react"
import { createClient } from "@/lib/supabase"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "My Reports", href: "/dashboard/reports", icon: FileText },
  { name: "New Inspection", href: "/dashboard/inspections/new", icon: Plus },
]

const adminNavigation = [
  { name: "All Reports", href: "/dashboard/admin/reports", icon: ClipboardList },
  { name: "Manage Users", href: "/dashboard/admin/users", icon: Users },
  { name: "Analytics", href: "/dashboard/admin/analytics", icon: BarChart3 },
  { name: "Settings", href: "/dashboard/admin/settings", icon: Settings },
]

const settingsNavigation = [{ name: "Notifications", href: "/dashboard/settings/notifications", icon: Bell }]

export function Sidebar() {
  const pathname = usePathname()
  const [userRole, setUserRole] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser()
        if (error || !user) return

        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single()

        if (userError) {
          console.error("Error fetching user role:", userError)
          return
        }

        setUserRole(userData?.role || "employee")
      } catch (error) {
        console.error("Error in fetchUserRole:", error)
      }
    }
    fetchUserRole()
  }, [supabase])

  const allNavigation = [...navigation, ...(userRole === "admin" ? adminNavigation : []), ...settingsNavigation]

  return (
    <div className="w-64 bg-white shadow-lg">
      <div className="flex items-center px-6 py-4 border-b">
        <div className="flex items-center">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <div className="ml-3">
            <h1 className="text-xl font-bold text-gray-900">Caltor</h1>
            <p className="text-sm text-gray-500">Inspections</p>
          </div>
        </div>
      </div>
      <nav className="mt-6 px-3">
        <div className="space-y-1">
          {allNavigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link key={item.name} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn("w-full justify-start", isActive && "bg-blue-50 text-blue-700 border-blue-200")}
                >
                  <item.icon className="mr-3 h-4 w-4" />
                  {item.name}
                </Button>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
