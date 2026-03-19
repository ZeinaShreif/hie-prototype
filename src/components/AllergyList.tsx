import { usePatientStore } from '../core/store';
import { newAllergy } from '../core/schema';
import type { Allergy } from '../core/types';

export default function AllergyList() {
  const allergies = usePatientStore((s) => s.record.allergies);
  const addAllergy = usePatientStore((s) => s.addAllergy);
  const updateAllergy = usePatientStore((s) => s.updateAllergy);
  const removeAllergy = usePatientStore((s) => s.removeAllergy);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">Allergies</h2>
        <button
          onClick={() => addAllergy(newAllergy())}
          className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          Add
        </button>
      </div>

      {allergies.length === 0 && (
        <p className="text-sm text-slate-500">No allergies recorded.</p>
      )}

      <div className="space-y-3">
        {allergies.map((allergy) => (
          <div
            key={allergy.id}
            className="grid grid-cols-1 gap-3 rounded border border-slate-200 p-4 sm:grid-cols-3"
          >
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Substance
              </label>
              <input
                type="text"
                value={allergy.substance}
                onChange={(e) =>
                  updateAllergy(allergy.id, { substance: e.target.value })
                }
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Reaction
              </label>
              <input
                type="text"
                value={allergy.reaction}
                onChange={(e) =>
                  updateAllergy(allergy.id, { reaction: e.target.value })
                }
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Severity
              </label>
              <div className="flex gap-2">
                <select
                  value={allergy.severity}
                  onChange={(e) =>
                    updateAllergy(allergy.id, {
                      severity: e.target.value as Allergy['severity'],
                    })
                  }
                  className="flex-1 rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="mild">Mild</option>
                  <option value="moderate">Moderate</option>
                  <option value="severe">Severe</option>
                </select>
                <button
                  onClick={() => removeAllergy(allergy.id)}
                  className="rounded border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

