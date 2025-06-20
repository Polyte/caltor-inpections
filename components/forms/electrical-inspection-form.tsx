"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from "@/lib/supabase"
import { getUser } from "@/lib/auth"

const damageCauses = [
  { code: "A", description: "Lighting" },
  { code: "B", description: "Power surge / Dip" },
  { code: "C", description: "Wear & Tear" },
  { code: "D", description: "Water Damage" },
  { code: "E", description: "Component Failure" },
  { code: "F", description: "No Damage" },
]

export function ElectricalInspectionForm() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    // Client Information
    clientName: "",
    contactNo: "",
    address: "",
    claimNumber: "",
    policyNumber: "",

    // Oven Section
    ovenMakeModel: "",
    ovenIsolator: "",
    ovenThermalLimiter: "",
    ovenElements: "",
    ovenThermostat: "",
    ovenComments: "",

    // Glass Hob Section
    hobMakeModel: "",
    hobECB: "",
    hobElements: "",
    hobThermostat: "",
    hobComments: "",

    // Geyser Section
    geyserIsolator: "",
    geyserElements: "",
    geyserThermostat: "",
    geyserComments: "",

    // Testing Results
    isolatorTests: {
      liveInEarth: "",
      liveOutEarth: "",
      liveInNeutral: "",
      liveOutNeutral: "",
    },

    // Installation Details
    installationType: "",
    mainVoltage: "",
    neutralEarthVoltage: "",
    earthLeakageOperational: false,
    bridgePieceCorrectSize: false,

    // Materials Needed
    materialsNeeded: "",

    // General Comments
    generalComments: "",
  })

  const handleSubmit = async (e: React.FormEvent, status: "draft" | "completed" = "draft") => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const user = await getUser()
      if (!user) {
        setError("User not authenticated")
        return
      }

      const { error: insertError } = await supabase.from("inspection_reports").insert({
        report_type: "electrical",
        client_name: formData.clientName,
        contact_no: formData.contactNo,
        address: formData.address,
        claim_number: formData.claimNumber,
        policy_number: formData.policyNumber,
        inspector_id: user.id,
        status,
        report_data: formData,
      })

      if (insertError) {
        setError(insertError.message)
      } else {
        router.push("/dashboard/reports")
      }
    } catch (err) {
      setError("Failed to save inspection report")
    } finally {
      setLoading(false)
    }
  }

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  return (
    <form className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Damage Causes Legend */}
      <Card>
        <CardHeader>
          <CardTitle>Cause of Damage Legend</CardTitle>
          <CardDescription>Reference codes for damage classification</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {damageCauses.map((cause) => (
              <Badge key={cause.code} variant="outline" className="justify-start">
                <span className="font-bold mr-2">{cause.code}</span>
                {cause.description}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Client Information */}
      <Card>
        <CardHeader>
          <CardTitle>Client Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="clientName">Client Name</Label>
            <Input
              id="clientName"
              value={formData.clientName}
              onChange={(e) => updateFormData("clientName", e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="contactNo">Contact Number</Label>
            <Input
              id="contactNo"
              value={formData.contactNo}
              onChange={(e) => updateFormData("contactNo", e.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => updateFormData("address", e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="claimNumber">Claim Number</Label>
            <Input
              id="claimNumber"
              value={formData.claimNumber}
              onChange={(e) => updateFormData("claimNumber", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="policyNumber">Policy Number</Label>
            <Input
              id="policyNumber"
              value={formData.policyNumber}
              onChange={(e) => updateFormData("policyNumber", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Equipment Sections */}
      <Tabs defaultValue="oven" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="oven">Oven</TabsTrigger>
          <TabsTrigger value="hob">Glass Hob</TabsTrigger>
          <TabsTrigger value="geyser">Geyser</TabsTrigger>
        </TabsList>

        <TabsContent value="oven">
          <Card>
            <CardHeader>
              <CardTitle>Oven Inspection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="ovenMakeModel">Make & Model</Label>
                <Input
                  id="ovenMakeModel"
                  value={formData.ovenMakeModel}
                  onChange={(e) => updateFormData("ovenMakeModel", e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ovenIsolator">Isolator</Label>
                  <Select
                    value={formData.ovenIsolator}
                    onValueChange={(value) => updateFormData("ovenIsolator", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select cause" />
                    </SelectTrigger>
                    <SelectContent>
                      {damageCauses.map((cause) => (
                        <SelectItem key={cause.code} value={cause.code}>
                          {cause.code} - {cause.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="ovenThermalLimiter">Thermal Limiter (Cut out)</Label>
                  <Select
                    value={formData.ovenThermalLimiter}
                    onValueChange={(value) => updateFormData("ovenThermalLimiter", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select cause" />
                    </SelectTrigger>
                    <SelectContent>
                      {damageCauses.map((cause) => (
                        <SelectItem key={cause.code} value={cause.code}>
                          {cause.code} - {cause.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="ovenComments">Comments</Label>
                <Textarea
                  id="ovenComments"
                  value={formData.ovenComments}
                  onChange={(e) => updateFormData("ovenComments", e.target.value)}
                  placeholder="Additional observations and comments..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hob">
          <Card>
            <CardHeader>
              <CardTitle>Glass Hob Inspection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="hobMakeModel">Make & Model</Label>
                <Input
                  id="hobMakeModel"
                  value={formData.hobMakeModel}
                  onChange={(e) => updateFormData("hobMakeModel", e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="hobECB">Electronic Control Board (ECB)</Label>
                  <Select value={formData.hobECB} onValueChange={(value) => updateFormData("hobECB", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select cause" />
                    </SelectTrigger>
                    <SelectContent>
                      {damageCauses.map((cause) => (
                        <SelectItem key={cause.code} value={cause.code}>
                          {cause.code} - {cause.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="hobElements">Elements</Label>
                  <Select value={formData.hobElements} onValueChange={(value) => updateFormData("hobElements", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select cause" />
                    </SelectTrigger>
                    <SelectContent>
                      {damageCauses.map((cause) => (
                        <SelectItem key={cause.code} value={cause.code}>
                          {cause.code} - {cause.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="hobComments">Comments</Label>
                <Textarea
                  id="hobComments"
                  value={formData.hobComments}
                  onChange={(e) => updateFormData("hobComments", e.target.value)}
                  placeholder="Additional observations and comments..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="geyser">
          <Card>
            <CardHeader>
              <CardTitle>Geyser Inspection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="geyserIsolator">Isolator</Label>
                  <Select
                    value={formData.geyserIsolator}
                    onValueChange={(value) => updateFormData("geyserIsolator", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select cause" />
                    </SelectTrigger>
                    <SelectContent>
                      {damageCauses.map((cause) => (
                        <SelectItem key={cause.code} value={cause.code}>
                          {cause.code} - {cause.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="geyserElements">Elements</Label>
                  <Select
                    value={formData.geyserElements}
                    onValueChange={(value) => updateFormData("geyserElements", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select cause" />
                    </SelectTrigger>
                    <SelectContent>
                      {damageCauses.map((cause) => (
                        <SelectItem key={cause.code} value={cause.code}>
                          {cause.code} - {cause.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="geyserThermostat">Thermostat</Label>
                  <Select
                    value={formData.geyserThermostat}
                    onValueChange={(value) => updateFormData("geyserThermostat", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select cause" />
                    </SelectTrigger>
                    <SelectContent>
                      {damageCauses.map((cause) => (
                        <SelectItem key={cause.code} value={cause.code}>
                          {cause.code} - {cause.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="geyserComments">Comments</Label>
                <Textarea
                  id="geyserComments"
                  value={formData.geyserComments}
                  onChange={(e) => updateFormData("geyserComments", e.target.value)}
                  placeholder="Additional observations and comments..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Materials Needed */}
      <Card>
        <CardHeader>
          <CardTitle>Materials Needed for Repairs</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.materialsNeeded}
            onChange={(e) => updateFormData("materialsNeeded", e.target.value)}
            placeholder="List all materials and parts needed for repairs..."
            rows={4}
          />
        </CardContent>
      </Card>

      {/* General Comments */}
      <Card>
        <CardHeader>
          <CardTitle>General Comments</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.generalComments}
            onChange={(e) => updateFormData("generalComments", e.target.value)}
            placeholder="Additional observations, recommendations, and general comments..."
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={(e) => handleSubmit(e, "draft")} disabled={loading}>
          {loading ? "Saving..." : "Save as Draft"}
        </Button>
        <Button type="button" onClick={(e) => handleSubmit(e, "completed")} disabled={loading}>
          {loading ? "Submitting..." : "Submit Report"}
        </Button>
      </div>
    </form>
  )
}
