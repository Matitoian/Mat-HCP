import { useState } from 'react';
import { Page } from '../App';
import { RoleAndStudentSelector, RoleAndStudentData } from './RoleAndStudentSelector';
import { InstitutionSelector } from './InstitutionSelector';
import { authService } from '../../lib/authService';
import { toast } from 'sonner';

interface OAuthProfileSetupProps {
  onNavigate: (page: Page, data?: any) => void;
  currentUser: any;
}

export function OAuthProfileSetupPage({ onNavigate, currentUser }: OAuthProfileSetupProps) {
  const [step, setStep] = useState<'role-selection' | 'institution-selection' | 'complete'>('role-selection');
  const [roleData, setRoleData] = useState<RoleAndStudentData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleRoleSelect = (data: RoleAndStudentData) => {
    setRoleData(data);
    
    // If tenant and student, show institution selection
    if (data.role === 'tenant' && data.isStudent) {
      setStep('institution-selection');
    } else {
      // Otherwise, proceed to complete
      completeProfileSetup(data, null);
    }
  };

  const handleInstitutionSelect = (institution: any) => {
    if (roleData) {
      completeProfileSetup(roleData, institution);
    }
  };

  const handleSkipInstitution = () => {
    if (roleData) {
      completeProfileSetup(roleData, null);
    }
  };

  const completeProfileSetup = async (roleData: RoleAndStudentData, institution: any) => {
    if (!currentUser) {
      toast.error('User session lost. Please try again.');
      onNavigate('login');
      return;
    }

    setIsLoading(true);
    try {
      // Update user profile with role and institution info
      const updateData = {
        role: roleData.role,
        isStudent: roleData.isStudent,
        institution: institution?.name,
        institutionId: institution?.id,
        institutionCounty: institution?.county,
      };

      const response = await authService.updateProfile(updateData);

      if (!response.success) {
        toast.error('Failed to save profile. Please try again.');
        setIsLoading(false);
        return;
      }

      // Show completion toast and navigate
      const roleLabel = roleData.role === 'tenant' ? 'Home Seeker' : 'Landlord';
      const studentMessage = roleData.isStudent 
        ? institution 
          ? ` at ${institution.name}` 
          : ' (student)'
        : '';
      
      toast.success(`Welcome ${roleLabel}${studentMessage}! 🎉`);

      // Navigate to appropriate dashboard
      const nextPage = roleData.role === 'tenant' ? 'tenant-dashboard' : 'landlord-dashboard';
      
      onNavigate(nextPage, { currentUser: response.user });
    } catch (error) {
      console.error('Profile setup error:', error);
      toast.error('Error setting up profile. Please try again.');
      setIsLoading(false);
    }
  };

  // Role & Student Selection Step
  if (step === 'role-selection') {
    return (
      <RoleAndStudentSelector
        onSelect={handleRoleSelect}
        onBack={() => onNavigate('signup')}
        isLoading={isLoading}
        isOAuthFlow={true}
      />
    );
  }

  // Institution Selection Step
  if (step === 'institution-selection') {
    return (
      <InstitutionSelector
        onSelect={handleInstitutionSelect}
        onBack={handleSkipInstitution}
        isLoading={isLoading}
      />
    );
  }

  return null;
}
