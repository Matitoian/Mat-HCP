import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Eye, EyeOff, ArrowLeft, Home, Key } from 'lucide-react';
import { Page } from '@/app/App';
import { authService } from '@/lib/authService';
import { OAuthAccountSelector } from '@/app/components/OAuthAccountSelector';
import { toast } from 'sonner';
import { useEffect } from 'react';

interface LoginPageProps {
  onNavigate: (page: Page, data?: any) => void;
  currentUser?: any; // User logged in via OAuth but without role assigned
}

export function LoginPage({ onNavigate, currentUser }: LoginPageProps) {
  const [step, setStep] = useState<'login' | 'role-selection'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [oauthAccountSelector, setOAuthAccountSelector] = useState<{
    open: boolean;
    provider: 'google' | 'apple';
  }>({ open: false, provider: 'google' });
  const [oauthLoading, setOAuthLoading] = useState(false);

  // If OAuth user comes back without role, show role selection
  useEffect(() => {
    if (currentUser && !currentUser.role) {
      setSelectedUser(currentUser);
      setStep('role-selection');
    }
  }, [currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await authService.login({ email, password });
      if (response.success && response.user) {
        if (response.user.role === 'admin') {
          toast.success('Welcome Admin! 🏠');
          onNavigate('admin-dashboard', { currentUser: response.user });
        } else if (response.user.role === 'tenant') {
          toast.success('Welcome back! 🏠');
          onNavigate('tenant-dashboard', { currentUser: response.user });
        } else if (response.user.role === 'landlord') {
          toast.success('Welcome back! 🔑');
          onNavigate('landlord-dashboard', { currentUser: response.user });
        } else {
          // Only show role selection for users with no role assigned yet
          setSelectedUser(response.user);
          setStep('role-selection');
        }
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleSelection = async (role: 'tenant' | 'landlord') => {
    if (selectedUser) {
      setIsLoading(true);
      try {
        // Save role to database
        const response = await authService.updateProfile({ role });
        if (response.success && response.user) {
          const userWithRole = { ...selectedUser, ...response.user, role };
          toast.success(`Welcome ${role === 'tenant' ? 'Home' : 'Landlord'}! 🎉`);
          const dashboardPage = role === 'tenant' ? 'tenant-dashboard' : 'landlord-dashboard';
          onNavigate(dashboardPage, { currentUser: userWithRole });
        } else {
          toast.error('Error saving role. Please try again.');
        }
      } catch (error) {
        toast.error('Error saving role. Please try again.');
      } finally {
        setIsLoading(false);
      }
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
        toast.success(`Signing in with ${oauthAccountSelector.provider}...`);
        // OAuth redirect will happen, session listener in App.tsx handles navigation
      } else {
        toast.error(response.message);
        setOAuthLoading(false);
      }
      setOAuthAccountSelector({ open: false, provider: 'google' });
    } catch (error) {
      toast.error(`${oauthAccountSelector.provider} login failed`);
      setOAuthLoading(false);
    }
  };

  const handleQuickLogin = (userEmail: string) => {
    setEmail(userEmail);
    setPassword('password123');
  };

  // ── ROLE SELECTION SCREEN ──
  if (step === 'role-selection') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">Choose Your Role 👤</CardTitle>
            <CardDescription>
              How would you like to use HouseCom?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 mb-6">
              {/* Tenant Option */}
              <button
                onClick={() => handleRoleSelection('tenant')}
                className="w-full p-4 border-2 rounded-lg transition-all hover:border-blue-500 hover:bg-blue-50 active:scale-95"
              >
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Home className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="text-left flex-1">
                    <h3 className="font-semibold text-gray-900">I'm Looking for Housing</h3>
                    <p className="text-sm text-gray-600">Search and book rental properties</p>
                  </div>
                </div>
              </button>

              {/* Landlord Option */}
              <button
                onClick={() => handleRoleSelection('landlord')}
                className="w-full p-4 border-2 rounded-lg transition-all hover:border-teal-500 hover:bg-teal-50 active:scale-95"
              >
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-teal-100 flex items-center justify-center">
                    <Key className="h-6 w-6 text-teal-600" />
                  </div>
                  <div className="text-left flex-1">
                    <h3 className="font-semibold text-gray-900">I'm a Property Owner</h3>
                    <p className="text-sm text-gray-600">List and manage your properties</p>
                  </div>
                </div>
              </button>
            </div>

            <div className="text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStep('login');
                  setSelectedUser(null);
                  setEmail('');
                  setPassword('');
                }}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── LOGIN SCREEN ──
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <Button variant="ghost" size="sm" onClick={() => onNavigate('landing')} className="w-fit mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" />Back
          </Button>
          <CardTitle className="text-2xl">Welcome Back 👋</CardTitle>
          <CardDescription>Login to your HouseCom account</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Social Login */}
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
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Or continue with email</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@example.com" required />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="password">Password</Label>
              </div>
              <div className="relative">
                <Input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">
                  {showPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>
          </form>

          {/* Demo Accounts */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs font-semibold text-blue-900 mb-2">🎯 Demo Accounts (Click to auto-fill):</p>
            <div className="space-y-1 text-xs">
              <button type="button" onClick={() => handleQuickLogin('grace@example.com')} className="w-full text-left p-2 hover:bg-blue-100 rounded flex items-center gap-2">
                🏠 <span><strong>Tenant:</strong> grace@example.com</span>
              </button>
              <button type="button" onClick={() => handleQuickLogin('juma@example.com')} className="w-full text-left p-2 hover:bg-blue-100 rounded flex items-center gap-2">
                🔑 <span><strong>Landlord:</strong> juma@example.com</span>
              </button>
              <button type="button" onClick={() => handleQuickLogin('admin@housecom.co.ke')} className="w-full text-left p-2 hover:bg-blue-100 rounded flex items-center gap-2">
                ⚙️ <span><strong>Admin:</strong> admin@housecom.co.ke</span>
              </button>
              <p className="text-blue-600 text-center mt-1 italic text-[11px]">Password: password123 for all demo accounts</p>
            </div>
          </div>

          <div className="mt-4 text-center text-sm">
            Don't have an account?{' '}
            <button onClick={() => onNavigate('signup')} className="text-blue-600 hover:underline font-medium">Sign up</button>
          </div>
        </CardContent>
      </Card>

      {/* OAuth Account Selector Modal */}
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