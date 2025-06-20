import { ElectricalInspectionForm } from "@/components/forms/electrical-inspection-form"

export default function NewInspectionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">New Electrical Inspection</h1>
        <p className="text-gray-500 mt-2">Create a comprehensive electrical inspection report</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Important Notes:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>1. For all readings obtained, a clear picture must be taken</li>
          <li>
            2. For all defect parts, a clear picture must be taken including the area around where you will be working
          </li>
          <li>3. Clear pictures of the property and house number</li>
        </ul>
      </div>

      <ElectricalInspectionForm />
    </div>
  )
}
