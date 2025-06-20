"use client"

import jsPDF from "jspdf"
import "jspdf-autotable"

declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

export function generateInspectionPDF(reportData: any) {
  const doc = new jsPDF()

  // Header
  doc.setFontSize(20)
  doc.text("CALTOR INSPECTIONS", 20, 20)
  doc.setFontSize(16)
  doc.text("ELECTRICAL INSPECTION REPORT", 20, 30)

  // Client Information
  doc.setFontSize(12)
  doc.text("CLIENT INFORMATION", 20, 50)
  doc.autoTable({
    startY: 55,
    head: [["Field", "Value"]],
    body: [
      ["Client Name", reportData.client_name || ""],
      ["Contact No", reportData.contact_no || ""],
      ["Address", reportData.address || ""],
      ["Claim Number", reportData.claim_number || ""],
      ["Policy Number", reportData.policy_number || ""],
      ["Date", new Date().toLocaleDateString()],
    ],
    margin: { left: 20 },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 120 },
    },
  })

  // Damage Causes Legend
  let finalY = (doc as any).lastAutoTable.finalY + 10
  doc.text("CAUSE OF DAMAGE LEGEND", 20, finalY)
  doc.autoTable({
    startY: finalY + 5,
    head: [["Code", "Description"]],
    body: [
      ["A", "Lighting"],
      ["B", "Power surge / Dip"],
      ["C", "Wear & Tear"],
      ["D", "Water Damage"],
      ["E", "Component Failure"],
      ["F", "No Damage"],
    ],
    margin: { left: 20 },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 140 },
    },
  })

  // Equipment Sections
  const reportDataParsed =
    typeof reportData.report_data === "string" ? JSON.parse(reportData.report_data) : reportData.report_data || {}

  finalY = (doc as any).lastAutoTable.finalY + 15

  // Oven Section
  if (reportDataParsed.ovenMakeModel) {
    doc.text("OVEN INSPECTION", 20, finalY)
    doc.autoTable({
      startY: finalY + 5,
      head: [["Item", "Cause of Damage / Comment"]],
      body: [
        ["Make & Model", reportDataParsed.ovenMakeModel || ""],
        ["Isolator", reportDataParsed.ovenIsolator || ""],
        ["Thermal Limiter", reportDataParsed.ovenThermalLimiter || ""],
        ["Elements", reportDataParsed.ovenElements || ""],
        ["Thermostat", reportDataParsed.ovenThermostat || ""],
        ["Comments", reportDataParsed.ovenComments || ""],
      ],
      margin: { left: 20 },
    })
    finalY = (doc as any).lastAutoTable.finalY + 15
  }

  // Glass Hob Section
  if (reportDataParsed.hobMakeModel) {
    doc.text("GLASS HOB INSPECTION", 20, finalY)
    doc.autoTable({
      startY: finalY + 5,
      head: [["Item", "Cause of Damage / Comment"]],
      body: [
        ["Make & Model", reportDataParsed.hobMakeModel || ""],
        ["Electronic Control Board (ECB)", reportDataParsed.hobECB || ""],
        ["Elements", reportDataParsed.hobElements || ""],
        ["Thermostat", reportDataParsed.hobThermostat || ""],
        ["Comments", reportDataParsed.hobComments || ""],
      ],
      margin: { left: 20 },
    })
    finalY = (doc as any).lastAutoTable.finalY + 15
  }

  // Geyser Section
  if (reportDataParsed.geyserIsolator) {
    doc.text("GEYSER INSPECTION", 20, finalY)
    doc.autoTable({
      startY: finalY + 5,
      head: [["Item", "Cause of Damage / Comment"]],
      body: [
        ["Isolator", reportDataParsed.geyserIsolator || ""],
        ["Elements", reportDataParsed.geyserElements || ""],
        ["Thermostat", reportDataParsed.geyserThermostat || ""],
        ["Comments", reportDataParsed.geyserComments || ""],
      ],
      margin: { left: 20 },
    })
    finalY = (doc as any).lastAutoTable.finalY + 15
  }

  // Materials Needed
  if (reportDataParsed.materialsNeeded) {
    if (finalY > 250) {
      doc.addPage()
      finalY = 20
    }
    doc.text("MATERIALS NEEDED FOR REPAIRS", 20, finalY)
    const splitText = doc.splitTextToSize(reportDataParsed.materialsNeeded, 170)
    doc.text(splitText, 20, finalY + 10)
    finalY += 10 + splitText.length * 5 + 10
  }

  // General Comments
  if (reportDataParsed.generalComments) {
    if (finalY > 230) {
      doc.addPage()
      finalY = 20
    }
    doc.text("GENERAL COMMENTS", 20, finalY)
    const splitText = doc.splitTextToSize(reportDataParsed.generalComments, 170)
    doc.text(splitText, 20, finalY + 10)
  }

  // Footer
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(10)
    doc.text(`Page ${i} of ${pageCount}`, 170, 280)
    doc.text("Caltor Inspections Report", 20, 280)
  }

  return doc
}

export function downloadPDF(reportData: any, filename: string) {
  const doc = generateInspectionPDF(reportData)
  doc.save(filename)
}
