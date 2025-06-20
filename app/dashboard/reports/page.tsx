import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FileText, Eye, Edit } from "lucide-react"
import { PDFDownloadButton } from "@/components/pdf-download-button"
import Link from "next/link"
import { createClient, getUser } from "@/lib/auth"
import { format } from "date-fns"

async function getReports(userId: string) {
  const supabase = await createClient()

  const { data: reports, error } = await supabase
    .from("inspection_reports")
    .select("*")
    .eq("inspector_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching reports:", error)
    return []
  }

  return reports || []
}

function getStatusColor(status: string) {
  switch (status) {
    case "draft":
      return "bg-yellow-100 text-yellow-800"
    case "completed":
      return "bg-green-100 text-green-800"
    case "reviewed":
      return "bg-blue-100 text-blue-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

export default async function ReportsPage() {
  const user = await getUser()
  if (!user) return null

  const reports = await getReports(user.id)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Inspection Reports</h1>
          <p className="text-gray-500 mt-2">Manage and view your inspection reports</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/inspections/new">
            <FileText className="mr-2 h-4 w-4" />
            New Report
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reports Overview</CardTitle>
          <CardDescription>All your inspection reports in one place</CardDescription>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No reports yet</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating your first inspection report.</p>
              <div className="mt-6">
                <Button asChild>
                  <Link href="/dashboard/inspections/new">Create Report</Link>
                </Button>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Claim #</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">{report.client_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{report.report_type}</Badge>
                    </TableCell>
                    <TableCell>{report.claim_number || "N/A"}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(report.status)}>{report.status}</Badge>
                    </TableCell>
                    <TableCell>{format(new Date(report.created_at), "MMM dd, yyyy")}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <PDFDownloadButton
                          reportData={report}
                          filename={`inspection-${report.claim_number || report.id}.pdf`}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
