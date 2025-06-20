"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { downloadPDF } from "@/lib/pdf-generator"

interface PDFDownloadButtonProps {
  reportData: any
  filename?: string
  variant?: "default" | "outline" | "secondary" | "destructive" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}

export function PDFDownloadButton({
  reportData,
  filename = "inspection-report.pdf",
  variant = "outline",
  size = "sm",
}: PDFDownloadButtonProps) {
  const handleDownload = () => {
    try {
      downloadPDF(reportData, filename)
    } catch (error) {
      console.error("Error generating PDF:", error)
    }
  }

  return (
    <Button variant={variant} size={size} onClick={handleDownload}>
      <Download className="h-4 w-4" />
    </Button>
  )
}
