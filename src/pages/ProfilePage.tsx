import PersonalDetailsForm from '../components/PersonalDetailsForm';
import EmergencyContactForm from '../components/EmergencyContactForm';
import AllergyList from '../components/AllergyList';

export default function ProfilePage() {
  return (
    <div className="p-4">
      <PersonalDetailsForm />
      <EmergencyContactForm />
      <AllergyList />
    </div>
  );
}
