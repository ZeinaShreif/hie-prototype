import { usePatientStore } from '../core/store';

export default function InsurancePrimaryForm() {
  const insurance = usePatientStore((s) => s.record.insurancePrimary);
  const updateInsurancePrimary = usePatientStore((s) => s.updateInsurancePrimary);

  // Store handles null → default object on first write; mirror that here for controlled inputs
  const data = insurance ?? {
    carrier: '', planName: '', memberId: '',
    groupNumber: '', policyHolderName: '', effectiveDate: '',
  };

  const hasInsurance = Boolean(insurance?.carrier);

  return (
    <div className="hie-section">
      <div className="hie-section-header">
        <div className="flex items-center">
          <h2 className="hie-section-title">Primary Insurance</h2>

          {hasInsurance && (
            <span
              className="flex items-center gap-1 font-bold"
              style={{
                background: '#E8F8F0',
                border: '1.5px solid #A8DFC0',
                borderRadius: 8,
                padding: '3px 10px',
                color: '#1A7A3C',
                fontSize: 10,
                fontWeight: 700,
                marginLeft: 8,
              }}
            >
              <span
                className="inline-block rounded-full shrink-0"
                style={{ width: 6, height: 6, backgroundColor: '#2ECC71' }}
              />
              On file
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2">

        {/* Carrier | Plan Name */}
        <div className="hie-field-left">
          <label htmlFor="primaryCarrier" className="hie-label">Insurance Carrier</label>
          <input
            id="primaryCarrier"
            type="text"
            value={data.carrier}
            onChange={(e) => updateInsurancePrimary({ carrier: e.target.value })}
            className="hie-input"
            placeholder="e.g. Blue Cross"
          />
        </div>
        <div className="hie-field">
          <label htmlFor="primaryPlanName" className="hie-label">Plan Name</label>
          <input
            id="primaryPlanName"
            type="text"
            value={data.planName}
            onChange={(e) => updateInsurancePrimary({ planName: e.target.value })}
            className="hie-input"
            placeholder="e.g. PPO Gold"
          />
        </div>

        {/* Member ID | Group Number */}
        <div className="hie-field-left">
          <label htmlFor="primaryMemberId" className="hie-label">Member ID</label>
          <input
            id="primaryMemberId"
            type="text"
            value={data.memberId}
            onChange={(e) => updateInsurancePrimary({ memberId: e.target.value })}
            className="hie-input"
            placeholder="Member ID"
          />
        </div>
        <div className="hie-field">
          <label htmlFor="primaryGroupNumber" className="hie-label">Group Number</label>
          <input
            id="primaryGroupNumber"
            type="text"
            value={data.groupNumber}
            onChange={(e) => updateInsurancePrimary({ groupNumber: e.target.value })}
            className="hie-input"
            placeholder="Group number"
          />
        </div>

        {/* Policy Holder — full width */}
        <div className="col-span-2 hie-field">
          <label htmlFor="primaryPolicyHolderName" className="hie-label">Policy Holder Name</label>
          <input
            id="primaryPolicyHolderName"
            type="text"
            value={data.policyHolderName}
            onChange={(e) => updateInsurancePrimary({ policyHolderName: e.target.value })}
            className="hie-input"
            placeholder="Full name of policy holder"
          />
        </div>

        {/* Effective Date — full width */}
        <div className="col-span-2 hie-field">
          <label htmlFor="primaryEffectiveDate" className="hie-label">Effective Date</label>
          <input
            id="primaryEffectiveDate"
            type="date"
            value={data.effectiveDate}
            onChange={(e) => updateInsurancePrimary({ effectiveDate: e.target.value })}
            className="hie-input"
          />
        </div>

      </div>
    </div>
  );
}
