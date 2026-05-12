import { useState, useRef, useEffect } from 'react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/app/components/ui/input-otp';
import { ArrowLeft } from 'lucide-react';
import { Page } from '@/app/App';
import { authService } from '@/lib/authService';
import { otpService } from '@/lib/otpService';
import { User } from '@/lib/mockData';
import { toast } from 'sonner';

interface OTPVerifyPageProps {
  onNavigate: (page: Page, data?: any) => void;
  pendingUser?: User;
}

export function OTPVerifyPage({ onNavigate, pendingUser }: OTPVerifyPageProps) {
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  const handleVerify = async () => {
    if (otp.length !== 6 || !pendingUser) return;

    setIsLoading(true);
    try {
      // Verify OTP using real verification
      const verifyResult = otpService.verifyOTP(pendingUser.phone, otp);
      
      if (verifyResult.success) {
        toast.success('✅ Phone verified successfully!');
        
        // Mark user as verified and navigate to dashboard
        const verifiedUser = { ...pendingUser, verified: true };
        const dashboardPage = 
          verifiedUser.role === 'tenant' ? 'tenant-dashboard' :
          verifiedUser.role === 'landlord' ? 'landlord-dashboard' :
          'admin-dashboard';
        onNavigate(dashboardPage, { currentUser: verifiedUser });
      } else {
        toast.error(verifyResult.message);
      }
    } catch (error) {
      toast.error('OTP verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!pendingUser) return;
    
    setIsLoading(true);
    try {
      const otpResponse = await otpService.sendOTP(pendingUser.phone);
      if (otpResponse.success) {
        setResendTimer(60);
        setCanResend(false);
        setOtp('');
        toast.success('New verification code sent to your phone');
        if (otpResponse.code) {
          toast.info(`Test Code: ${otpResponse.code}`);
        }
      } else {
        toast.error(otpResponse.message);
      }
    } catch (error) {
      toast.error('Failed to resend code');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (otp.length === 6) {
      handleVerify();
    }
  }, [otp]);

  if (!pendingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <p>No pending verification. Please sign up first.</p>
            <Button onClick={() => onNavigate('signup')} className="mt-4">
              Go to Signup
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('signup')}
            className="w-fit mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <CardTitle className="text-2xl">Verify Your Phone</CardTitle>
          <CardDescription>
            Enter the 6-digit code sent to {pendingUser.phone}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={setOtp}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          <div className="text-center">
            {canResend ? (
              <button
                onClick={handleResend}
                className="text-sm text-blue-600 hover:underline"
              >
                Resend Code
              </button>
            ) : (
              <p className="text-sm text-gray-500">
                Resend code in {resendTimer}s
              </p>
            )}
          </div>

          <Button
            onClick={handleVerify}
            className="w-full"
            disabled={otp.length !== 6 || isLoading}
          >
            {isLoading ? 'Verifying...' : 'Verify & Continue'}
          </Button>

          <div className="p-4 bg-blue-50 rounded-lg text-sm text-center">
            <p className="text-blue-900">
              💡 <strong>Demo:</strong> Enter any 6 digits to verify
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}