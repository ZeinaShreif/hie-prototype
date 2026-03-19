import { usePatientStore } from '../core/store';

export default function PersonalDetailsForm() {
  const personal = usePatientStore((s) => s.record.personal);
  const updatePersonal = usePatientStore((s) => s.updatePersonal);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-slate-800">Personal Details</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-slate-700 mb-1">
            First Name
          </label>
          <input
            id="firstName"
            type="text"
            value={personal.firstName}
            onChange={(e) => updatePersonal({ firstName: e.target.value })}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-slate-700 mb-1">
            Last Name
          </label>
          <input
            id="lastName"
            type="text"
            value={personal.lastName}
            onChange={(e) => updatePersonal({ lastName: e.target.value })}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="dateOfBirth" className="block text-sm font-medium text-slate-700 mb-1">
            Date of Birth
          </label>
          <input
            id="dateOfBirth"
            type="date"
            value={personal.dateOfBirth}
            onChange={(e) => updatePersonal({ dateOfBirth: e.target.value })}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="gender" className="block text-sm font-medium text-slate-700 mb-1">
            Gender
          </label>
          <input
            id="gender"
            type="text"
            value={personal.gender}
            onChange={(e) => updatePersonal({ gender: e.target.value })}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="address" className="block text-sm font-medium text-slate-700 mb-1">
            Address
          </label>
          <input
            id="address"
            type="text"
            value={personal.address}
            onChange={(e) => updatePersonal({ address: e.target.value })}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="city" className="block text-sm font-medium text-slate-700 mb-1">
            City
          </label>
          <input
            id="city"
            type="text"
            value={personal.city}
            onChange={(e) => updatePersonal({ city: e.target.value })}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="state" className="block text-sm font-medium text-slate-700 mb-1">
              State
            </label>
            <input
              id="state"
              type="text"
              value={personal.state}
              onChange={(e) => updatePersonal({ state: e.target.value })}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="zip" className="block text-sm font-medium text-slate-700 mb-1">
              ZIP
            </label>
            <input
              id="zip"
              type="text"
              value={personal.zip}
              onChange={(e) => updatePersonal({ zip: e.target.value })}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1">
            Phone
          </label>
          <input
            id="phone"
            type="tel"
            value={personal.phone}
            onChange={(e) => updatePersonal({ phone: e.target.value })}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={personal.email}
            onChange={(e) => updatePersonal({ email: e.target.value })}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="heightFt" className="block text-sm font-medium text-slate-700 mb-1">
              Height (ft)
            </label>
            <input
              id="heightFt"
              type="number"
              value={personal.heightFt ?? ''}
              onChange={(e) =>
                updatePersonal({
                  heightFt: e.target.value === '' ? null : Number(e.target.value),
                })
              }
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="heightIn" className="block text-sm font-medium text-slate-700 mb-1">
              Height (in)
            </label>
            <input
              id="heightIn"
              type="number"
              value={personal.heightIn ?? ''}
              onChange={(e) =>
                updatePersonal({
                  heightIn: e.target.value === '' ? null : Number(e.target.value),
                })
              }
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label htmlFor="weightLbs" className="block text-sm font-medium text-slate-700 mb-1">
            Weight (lbs)
          </label>
          <input
            id="weightLbs"
            type="number"
            value={personal.weightLbs ?? ''}
            onChange={(e) =>
              updatePersonal({
                weightLbs: e.target.value === '' ? null : Number(e.target.value),
              })
            }
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="primaryLanguage" className="block text-sm font-medium text-slate-700 mb-1">
            Primary Language
          </label>
          <input
            id="primaryLanguage"
            type="text"
            value={personal.primaryLanguage}
            onChange={(e) => updatePersonal({ primaryLanguage: e.target.value })}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="maritalStatus" className="block text-sm font-medium text-slate-700 mb-1">
            Marital Status
          </label>
          <input
            id="maritalStatus"
            type="text"
            value={personal.maritalStatus}
            onChange={(e) => updatePersonal({ maritalStatus: e.target.value })}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="bloodType" className="block text-sm font-medium text-slate-700 mb-1">
            Blood Type
          </label>
          <input
            id="bloodType"
            type="text"
            value={personal.bloodType}
            onChange={(e) => updatePersonal({ bloodType: e.target.value })}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
}
