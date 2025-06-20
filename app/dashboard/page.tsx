import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Plus, TrendingUp, Clock, CheckCircle, AlertCircle } from "lucide-react"
import Link from "next/link"
import { getUserWithRole, createClient } from "@/lib/auth"

async function getDashboardStats(userId: string, role: string) {
  const supabase = await createClient()

  let query = supabase.from("inspection_reports").select("*", { count: "exact" })

  if (role !== "admin") {
    query = query.eq("inspector_id", userId)
  }

  const { count: totalReports } = await query

  const { count: draftReports } = await (role === "admin"
    ? supabase.from("inspection_reports").select("*", { count: "exact" }).eq("status", "draft")
    : supabase
        .from("inspection_reports")
        .select("*", { count: "exact" })
        .eq("inspector_id", userId)
        .eq("status", "draft"))

  const { count: completedReports } = await (role === "admin"
    ? supabase.from("inspection_reports").select("*", { count: "exact" }).eq("status", "completed")
    : supabase
        .from("inspection_reports")
        .select("*", { count: "exact" })
        .eq("inspector_id", userId)
        .eq("status", "completed"))

  return {
    totalReports: totalReports || 0,
    draftReports: draftReports || 0,
    completedReports: completedReports || 0,
    reviewedReports: (totalReports || 0) - (draftReports || 0) - (completedReports || 0),
  }
}

export default async function DashboardPage() {
  const user = await getUserWithRole()
  if (!user) return null

  const stats = await getDashboardStats(user.id, user.role)

  const quickActions = [
    {
      title: "New Inspection",
      description: "Start a new electrical inspection report",
      href: "/dashboard/inspections/new",
      icon: Plus,
      color: "bg-green-500",
    },
    {
      title: "View Reports",
      description: "Access your inspection reports",
      href: "/dashboard/reports",
      icon: FileText,
      color: "bg-blue-500",
    },
  ]

  if (user.role === "admin") {
    quickActions.push(
      {
        title: "Manage Users",
        description: "Add and manage team members",
        href: "/dashboard/admin/users",
        icon: Plus,
        color: "bg-purple-500",
      },
      {
        title: "View Analytics",
        description: "See inspection trends and statistics",
        href: "/dashboard/admin/analytics",
        icon: TrendingUp,
        color: "bg-orange-500",
      },
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user.full_name}!</h1>
        <p className="text-gray-500 mt-2">Here's an overview of your inspection activities</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReports}</div>
            <p className="text-xs text-muted-foreground">
              {user.role === "admin" ? "All inspection reports" : "Your inspection reports"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft Reports</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.draftReports}</div>
            <p className="text-xs text-muted-foreground">Pending completion</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedReports}</div>
            <p className="text-xs text-muted-foreground">Ready for review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Under Review</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.reviewedReports}</div>
            <p className="text-xs text-muted-foreground">Being reviewed</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks to help you get started</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Link key={action.title} href={action.href}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${action.color}`}>
                        <action.icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">{action.title}</h3>
                        <p className="text-xs text-muted-foreground">{action.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your latest inspection reports and updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">No recent reports</h4>
                <p className="text-sm text-muted-foreground">Start your first inspection to see activity here</p>
              </div>
              <Button asChild>
                <Link href="/dashboard/inspections/new">Create Report</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
