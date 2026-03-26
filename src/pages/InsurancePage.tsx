import InsurancePrimaryForm from '../components/InsurancePrimaryForm';
import InsuranceSecondaryForm from '../components/InsuranceSecondaryForm';

export default function InsurancePage() {
  return (
    <div className="p-4">
      <InsurancePrimaryForm />
      <InsuranceSecondaryForm />
    </div>
  );
}
