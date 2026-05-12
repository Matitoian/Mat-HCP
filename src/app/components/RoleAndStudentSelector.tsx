import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Label } from '@/app/components/ui/label';
import { Home, Key, Users } from 'lucide-react';

interface RoleAndStudentSelectorProps {
  onSelect: (data: RoleAndStudentData) => void;
  onBack?: () => void;
  isLoading?: boolean;
  isOAuthFlow?: boolean;
}

export interface RoleAndStudentData {
  role: 'tenant' | 'landlord';
  isStudent: boolean;
}

export function RoleAndStudentSelector({
  onSelect,
  onBack,
  isLoading = false,
  isOAuthFlow = false,
}: RoleAndStudentSelectorProps) {
  const [step, setStep] = useState<'role' | 'student'>('role');
  const [selectedRole, setSelectedRole] = useState<'tenant' | 'landlord' | null>(null);
  const [isStudent, setIsStudent] = useState(false);

  const handleRoleSelect = (role: 'tenant' | 'landlord') => {
    setSelectedRole(role);
    // If landlord, skip student selection and proceed
    if (role === 'landlord') {
      onSelect({ role, isStudent: false });
    } else {
      setStep('student');
    }
  };

  const handleStudentSelect = () => {
    if (selectedRole) {
      onSelect({ role: selectedRole, isStudent });
    }
  };

  // ROLE SELECTION STEP
  if (step === 'role') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            {onBack && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="w-fit mb-2"
              >
                ← Back
              </Button>
            )}
            <CardTitle className="text-2xl">Welcome to HouseCom!</CardTitle>
            <CardDescription>
              {isOAuthFlow
                ? 'Just a few quick questions to complete your profile'
                : 'Tell us how you\'ll be using HouseCom'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-gray-700 font-medium">Are you a...</p>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Tenant Card */}
              <button
                onClick={() => handleRoleSelect('tenant')}
                disabled={isLoading}
                className={`relative p-6 rounded-lg border-2 transition-all cursor-pointer ${
                  selectedRole === 'tenant'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="text-4xl">🏠</div>
                  <div className="text-left flex-1">
                    <h3 className="font-bold text-lg text-gray-900">Tenant</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Looking for a rental property or apartment
                    </p>
                    <ul className="text-xs text-gray-600 mt-3 space-y-1">
                      <li>✓ Search properties</li>
                      <li>✓ Save favorites</li>
                      <li>✓ Message landlords</li>
                    </ul>
                  </div>
                </div>
              </button>

              {/* Landlord Card */}
              <button
                onClick={() => handleRoleSelect('landlord')}
                disabled={isLoading}
                className={`relative p-6 rounded-lg border-2 transition-all cursor-pointer ${
                  selectedRole === 'landlord'
                    ? 'border-yellow-500 bg-yellow-50'
                    : 'border-gray-200 hover:border-yellow-300 hover:bg-yellow-50'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="text-4xl">🔑</div>
                  <div className="text-left flex-1">
                    <h3 className="font-bold text-lg text-gray-900">Landlord</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Listing properties or managing rentals
                    </p>
                    <ul className="text-xs text-gray-600 mt-3 space-y-1">
                      <li>✓ List properties</li>
                      <li>✓ Manage applications</li>
                      <li>✓ Track payments</li>
                    </ul>
                  </div>
                </div>
              </button>
            </div>

            {selectedRole && (
              <p className="text-sm text-gray-600 text-center">
                Selected: <span className="font-medium capitalize">{selectedRole}</span>
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // STUDENT SELECTION STEP
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep('role')}
            className="w-fit mb-2"
          >
            ← Back
          </Button>
          <CardTitle className="text-2xl">Student Status</CardTitle>
          <CardDescription>
            Helping us match you with student-friendly properties
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-lg border-2 border-blue-200 bg-blue-50">
              <Checkbox
                id="student"
                checked={isStudent}
                onCheckedChange={(checked: boolean) => setIsStudent(checked)}
                disabled={isLoading}
              />
              <Label
                htmlFor="student"
                className="flex-1 cursor-pointer font-medium text-gray-900"
              >
                Yes, I'm a student 🎓
              </Label>
            </div>

            <p className="text-sm text-gray-600">
              {isStudent
                ? 'Great! You will be able to filter properties near your school and get student-friendly recommendations.'
                : 'You can always update this later in your profile settings.'}
            </p>
          </div>

          <div className="space-y-3 pt-4">
            <Button
              onClick={handleStudentSelect}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              {isLoading ? 'Setting up...' : 'Continue'}
            </Button>

            {onBack && (
              <Button
                variant="outline"
                onClick={onBack}
                disabled={isLoading}
                className="w-full"
              >
                Cancel
              </Button>
            )}
          </div>

          {isStudent && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-gray-700">
                💡 <strong>Next Step:</strong> You'll select your institution to see nearby properties and campus listings.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
