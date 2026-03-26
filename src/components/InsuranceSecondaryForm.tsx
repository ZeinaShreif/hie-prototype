import { useState } from 'react';
import { usePatientStore } from '../core/store';

export default function InsuranceSecondaryForm() {
  const insurance = usePatientStore((s) => s.record.insuranceSecondary);
  const updateInsuranceSecondary = usePatientStore((s) => s.updateInsuranceSecondary);
  const clearInsuranceSecondary = usePatientStore((s) => s.clearInsuranceSecondary);

  // Show the form if secondary insurance was previously saved, or if the user opts in
  const [showForm, setShowForm] = useState(insurance !== null);

  const data = insurance ?? {
    carrier: '', planName: '', memberId: '',
    groupNumber: '', policyHolderName: '', effectiveDate: '',
  };

  function handleRemove() {
    clearInsuranceSecondary();
    setShowForm(false);
  }

  if (!showForm) {
    return (
      <div className="hie-section">
        <div className="hie-section-header">
          <h2 className="hie-section-title">Secondary Insurance</h2>
        </div>
        <button
          aria-label="Add secondary insurance"
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 w-full"
          style={{ padding: '10px 16px 12px' }}
        >
          <span
            className="flex items-center justify-center rounded-full text-white font-extrabold shrink-0"
            style={{ width: 24, height: 24, backgroundColor: 'var(--cyan)', fontSize: 15, lineHeight: 1 }}
          >
            +
          </span>
          <span className="font-bold" style={{ color: 'var(--cyan)', fontSize: 13 }}>
            Add secondary insurance
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="hie-section">
      <div className="hie-section-header">
        <h2 className="hie-section-title">Secondary Insurance</h2>
        <button
          aria-label="Remove secondary insurance"
          onClick={handleRemove}
          className="font-bold"
          style={{ color: '#EF5350', fontSize: 13 }}
        >
          Remove
        </button>
      </div>

      <div className="grid grid-cols-2">

        {/* Carrier | Plan Name */}
        <div className="hie-field-left">
          <label htmlFor="secondaryCarrier" className="hie-label">Insurance Carrier</label>
          <input
            id="secondaryCarrier"
            type="text"
            value={data.carrier}
            onChange={(e) => updateInsuranceSecondary({ carrier: e.target.value })}
            className="hie-input"
            placeholder="e.g. Aetna"
          />
        </div>
        <div className="hie-field">
          <label htmlFor="secondaryPlanName" className="hie-label">Plan Name</label>
          <input
            id="secondaryPlanName"
            type="text"
            value={data.planName}
            onChange={(e) => updateInsuranceSecondary({ planName: e.target.value })}
            className="hie-input"
            placeholder="e.g. HMO Silver"
          />
        </div>

        {/* Member ID | Group Number */}
        <div className="hie-field-left">
          <label htmlFor="secondaryMemberId" className="hie-label">Member ID</label>
          <input
            id="secondaryMemberId"
            type="text"
            value={data.memberId}
            onChange={(e) => updateInsuranceSecondary({ memberId: e.target.value })}
            className="hie-input"
            placeholder="Member ID"
          />
        </div>
        <div className="hie-field">
          <label htmlFor="secondaryGroupNumber" className="hie-label">Group Number</label>
          <input
            id="secondaryGroupNumber"
            type="text"
            value={data.groupNumber}
            onChange={(e) => updateInsuranceSecondary({ groupNumber: e.target.value })}
            className="hie-input"
            placeholder="Group number"
          />
        </div>

        {/* Policy Holder — full width */}
        <div className="col-span-2 hie-field">
          <label htmlFor="secondaryPolicyHolderName" className="hie-label">Policy Holder Name</label>
          <input
            id="secondaryPolicyHolderName"
            type="text"
            value={data.policyHolderName}
            onChange={(e) => updateInsuranceSecondary({ policyHolderName: e.target.value })}
            className="hie-input"
            placeholder="Full name of policy holder"
          />
        </div>

        {/* Effective Date — full width */}
        <div className="col-span-2 hie-field">
          <label htmlFor="secondaryEffectiveDate" className="hie-label">Effective Date</label>
          <input
            id="secondaryEffectiveDate"
            type="date"
            value={data.effectiveDate}
            onChange={(e) => updateInsuranceSecondary({ effectiveDate: e.target.value })}
            className="hie-input"
          />
        </div>

      </div>
    </div>
  );
}
