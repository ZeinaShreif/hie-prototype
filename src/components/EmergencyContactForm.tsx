import { usePatientStore } from '../core/store';

export default function EmergencyContactForm() {
  const emergencyContact = usePatientStore((s) => s.record.emergencyContact);
  const updateEmergencyContact = usePatientStore((s) => s.updateEmergencyContact);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-slate-800">Emergency Contact</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="emergencyName" className="block text-sm font-medium text-slate-700 mb-1">
            Name
          </label>
          <input
            id="emergencyName"
            type="text"
            value={emergencyContact.name}
            onChange={(e) => updateEmergencyContact({ name: e.target.value })}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="emergencyRelationship" className="block text-sm font-medium text-slate-700 mb-1">
            Relationship
          </label>
          <input
            id="emergencyRelationship"
            type="text"
            value={emergencyContact.relationship}
            onChange={(e) => updateEmergencyContact({ relationship: e.target.value })}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="emergencyPhone" className="block text-sm font-medium text-slate-700 mb-1">
            Phone
          </label>
          <input
            id="emergencyPhone"
            type="tel"
            value={emergencyContact.phone}
            onChange={(e) => updateEmergencyContact({ phone: e.target.value })}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
}
