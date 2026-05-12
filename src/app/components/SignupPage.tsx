import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { Eye, EyeOff, ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import { Page } from '@/app/App';
import { authService, SignupData } from '@/lib/authService';
import { otpService } from '@/lib/otpService';
import { OAuthAccountSelector } from '@/app/components/OAuthAccountSelector';
import { toast } from 'sonner';
import { useEffect, useRef } from 'react';

interface SignupPageProps {
  onNavigate: (page: Page, data?: any) => void;
  currentUser?: any; // User logged in via OAuth but without role assigned
}

export function SignupPage({ onNavigate, currentUser }: SignupPageProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<SignupData>({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'tenant',
    county: 'Mombasa',
    isStudent: false,
    studentId: '',
    institution: '',
    institutionId: '',
    institutionCounty: ''
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [oauthAccountSelector, setOAuthAccountSelector] = useState<{
    open: boolean;
    provider: 'google' | 'apple';
  }>({ open: false, provider: 'google' });
  const [oauthLoading, setOAuthLoading] = useState(false);
  const otpToastShown = useRef(false);

  // If OAuth user comes back without role, redirect to profile setup
  useEffect(() => {
    if (currentUser && !currentUser.role) {
      // Navigate to OAuth profile setup where they can select role and institution
      onNavigate('oauth-profile-setup', { currentUser });
    }
  }, [currentUser, onNavigate]);

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email format';
    
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
    else if (!/^\+254\d{9}$/.test(formData.phone)) newErrors.phone = 'Format: +254XXXXXXXXX';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    
    if (formData.password.length < 6) newErrors.password = 'Min 6 characters';
    if (formData.password !== confirmPassword) newErrors.confirmPassword = 'Passwords don\'t match';
    if (formData.isStudent && !formData.studentId) newErrors.studentId = 'Student ID required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep2()) return;
    setIsLoading(true);
    try {
      // Step 1: Create account
      const response = await authService.signup(formData);
      if (!response.success) {
        toast.error(response.message);
        setIsLoading(false);
        return;
      }

      // Step 2: Send OTP to phone
      if (!otpToastShown.current) {
        toast.loading('Sending verification code...');
      }
      const otpResponse = await otpService.sendOTP(formData.phone);
      
      if (otpResponse.success) {
        // Only show this toast once per signup attempt
        if (!otpToastShown.current) {
          toast.success('✅ Verification code sent to your phone');
          otpToastShown.current = true;
        }
        // If test mode, show the code
        if (otpResponse.code) {
          toast.info(`Test Code: ${otpResponse.code}`);
        }
        onNavigate('otp-verify', { pendingUser: response.user, currentUser: response.user });
      } else {
        toast.error(otpResponse.message);
      }
    } catch (error) {
      toast.error('Signup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'apple') => {
    // Show account selector instead of redirecting immediately
    setOAuthAccountSelector({ open: true, provider });
  };

  const handleOAuthAccountSelect = async () => {
    setOAuthLoading(true);
    try {
      const response = await authService.socialLogin(oauthAccountSelector.provider);
      if (response.success) {
        toast.success(`Signing up with ${oauthAccountSelector.provider}...`);
        // OAuth redirect will happen, session listener in App.tsx handles navigation to role selection
      } else {
        toast.error(response.message);
        setOAuthLoading(false);
      }
      setOAuthAccountSelector({ open: false, provider: 'google' });
    } catch (error) {
      toast.error(`${oauthAccountSelector.provider} signup failed`);
      setOAuthLoading(false);
    }
  };

  const getPasswordStrength = () => {
    const pwd = formData.password;
    if (pwd.length === 0) return null;
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    if (score <= 1) return { label: 'Weak', color: 'bg-red-500', width: '25%', textColor: 'text-red-600' };
    if (score === 2) return { label: 'Fair', color: 'bg-orange-500', width: '50%', textColor: 'text-orange-600' };
    if (score === 3) return { label: 'Good', color: 'bg-blue-500', width: '75%', textColor: 'text-blue-600' };
    return { label: 'Strong ✓', color: 'bg-green-500', width: '100%', textColor: 'text-green-600' };
  };

  const passwordStrength = getPasswordStrength();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => step === 1 ? onNavigate('landing') : setStep(1)}
            className="w-fit mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <CardTitle className="text-2xl">Create Account</CardTitle>
          <CardDescription>
            Join HouseCom - Step {step} of 2
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Social Login Options */}
          {step === 1 && (
            <div className="space-y-3 mb-6">
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2 hover:bg-gray-50"
                onClick={() => handleSocialLogin('google')}
                disabled={isLoading || oauthLoading}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2 hover:bg-gray-50"
                onClick={() => handleSocialLogin('apple')}
                disabled={isLoading || oauthLoading}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                Continue with Apple
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">Or sign up with email</span>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {step === 1 ? (
              <>
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="John Mwangi"
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                </div>

                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="john@example.com"
                    className={errors.email ? 'border-red-500' : ''}
                  />
                  {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number (Kenya) *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="+254712345678"
                    className={errors.phone ? 'border-red-500' : ''}
                  />
                  {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                </div>

                <div>
                  <Label htmlFor="county">Preferred County</Label>
                  <Select value={formData.county} onValueChange={(value) => setFormData({...formData, county: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mombasa">Mombasa</SelectItem>
                      <SelectItem value="Kilifi">Kilifi</SelectItem>
                      <SelectItem value="Kwale">Kwale</SelectItem>
                      <SelectItem value="Lamu">Lamu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button type="button" onClick={handleNext} className="w-full">
                  Next
                </Button>
              </>
            ) : (
              <>
                <div>
                  <Label>I am a:</Label>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, role: 'tenant'})}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        formData.role === 'tenant'
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-semibold">🏠 Tenant</div>
                      <div className="text-xs text-gray-500">Looking for rental</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, role: 'landlord'})}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        formData.role === 'landlord'
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-semibold">🔑 Landlord</div>
                      <div className="text-xs text-gray-500">List properties</div>
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="student"
                    checked={formData.isStudent}
                    onCheckedChange={(checked) => setFormData({...formData, isStudent: checked as boolean})}
                  />
                  <label htmlFor="student" className="text-sm font-medium">
                    I am a student 🎓
                  </label>
                </div>

                {formData.isStudent && (
                  <div>
                    <Label htmlFor="studentId">Student ID</Label>
                    <Input
                      id="studentId"
                      value={formData.studentId}
                      onChange={(e) => setFormData({...formData, studentId: e.target.value})}
                      placeholder="TUM/2024/1234"
                      className={errors.studentId ? 'border-red-500' : ''}
                    />
                    {errors.studentId && <p className="text-xs text-red-500 mt-1">{errors.studentId}</p>}
                  </div>
                )}

                <div>
                  <Label htmlFor="password">Password *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      placeholder="Min 6 characters"
                      className={errors.password ? 'border-red-500' : ''}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                    </button>
                  </div>
                  {passwordStrength && (
                    <div className="mt-2">
                      <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                        <div className={`h-full ${passwordStrength.color} transition-all`} style={{ width: passwordStrength.width }}></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Strength: {passwordStrength.label}</p>
                    </div>
                  )}
                  {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className={errors.confirmPassword ? 'border-red-500' : ''}
                  />
                  {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>}
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Creating account...' : 'Create Account'}
                </Button>
              </>
            )}
          </form>

          <div className="mt-4 text-center text-sm">
            Already have an account?{' '}
            <button onClick={() => onNavigate('login')} className="text-blue-600 hover:underline font-medium">
              Login
            </button>
          </div>
        </CardContent>
      </Card>

      <OAuthAccountSelector
        open={oauthAccountSelector.open}
        onClose={() => setOAuthAccountSelector({ ...oauthAccountSelector, open: false })}
        provider={oauthAccountSelector.provider}
        onSelectAccount={handleOAuthAccountSelect}
        onSignInNew={handleOAuthAccountSelect}
        isLoading={oauthLoading}
      />
    </div>
  );
}