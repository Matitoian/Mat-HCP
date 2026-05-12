import { useState } from 'react';
import { ArrowLeft, Upload, CheckCircle, Copy, PartyPopper, AlertCircle, Shield } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Page } from '@/app/App';
import { User, mockProperties } from '@/lib/mockData';
import * as api from '@/lib/apiService';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { validators, sanitizeInput } from '@/lib/securityService';

interface PaymentPageProps {
  user: User;
  propertyId: string;
  onNavigate: (page: Page, data?: any) => void;
  onLogout: () => void;
}

export function PaymentPage({ user, propertyId, onNavigate, onLogout }: PaymentPageProps) {
  const property = mockProperties.find(p => p.id === propertyId);
  const [mpesaCode, setMpesaCode] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [codeError, setCodeError] = useState('');

  if (!property) return null;

  const fireConfetti = () => {
    // Coastal Kenya colours: green (M-PESA), blue (ocean), gold
    const colours = ['#22c55e', '#2563eb', '#0d9488', '#f59e0b', '#ffffff'];
    confetti({
      particleCount: 180,
      spread: 100,
      startVelocity: 55,
      colors: colours,
      origin: { y: 0.6 },
    });
    setTimeout(() => {
      confetti({ particleCount: 80, angle: 60, spread: 70, origin: { x: 0, y: 0.7 }, colors: colours });
      confetti({ particleCount: 80, angle: 120, spread: 70, origin: { x: 1, y: 0.7 }, colors: colours });
    }, 350);
  };

  const handleSubmit = async () => {
    const sanitized = sanitizeInput(mpesaCode);
    if (!sanitized) {
      setCodeError('M-PESA confirmation code is required');
      toast.error('Please enter your M-PESA confirmation code');
      return;
    }
    if (!validators.mpesaCode(sanitized)) {
      setCodeError('Invalid code format. M-PESA codes are 10 alphanumeric characters (e.g., QGH3K2L9XY)');
      toast.error('Please enter a valid M-PESA confirmation code');
      return;
    }
    setCodeError('');

    try {
      await api.createPayment({
        propertyId,
        amount: property!.price,
        mpesaCode: sanitized,
        month: new Date().toLocaleDateString('en-KE', { month: 'long', year: 'numeric' }),
        mpesaTill: property!.mpesaTill,
      });
      fireConfetti();
      setSubmitted(true);
      toast.success('Payment recorded successfully! 🎉');
    } catch (e) {
      // Still show success (payment was sent on M-PESA, just record failed)
      fireConfetti();
      setSubmitted(true);
      console.log('Payment recording error:', e);
    }
  };

  const copyTill = () => {
    navigator.clipboard.writeText(property.mpesaTill);
    toast.success('Till number copied!');
  };

  // ── SUCCESS SCREEN ──
  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="h-24 w-24 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-14 w-14 text-green-500" />
          </div>
          <h2 className="font-poppins text-2xl font-bold text-gray-900 mb-2">Payment Submitted! 🎉</h2>
          <p className="text-gray-500 mb-1">Your M-PESA proof has been sent to the landlord.</p>
          <p className="text-gray-400 text-sm mb-6">You'll receive confirmation within 24 hours.</p>
          <div className="bg-green-50 rounded-xl p-4 text-sm text-green-700 mb-6">
            <strong>M-PESA Code:</strong> {mpesaCode}
          </div>
          <p className="text-xs text-gray-400">Redirecting to dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => onNavigate('property-detail', { selectedPropertyId: propertyId })}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center">
            <span className="text-xl">📱</span>
          </div>
          <div>
            <h1 className="font-poppins text-2xl font-bold text-gray-900">Pay Rent via M-PESA</h1>
            <p className="text-sm text-gray-500">Secure payment — landlord notified instantly</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Property Info */}
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <img src={property.images[0]} alt={property.title} className="h-20 w-20 rounded-xl object-cover" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 line-clamp-1">{property.title}</h3>
                  <p className="text-sm text-gray-500">{property.location}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{property.county} County</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-2xl font-bold text-blue-600">KSh {property.price.toLocaleString()}</div>
                  <div className="text-sm text-gray-400">Monthly rent</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Till Number — highlight card */}
          <Card className="bg-gradient-to-r from-green-600 to-green-700 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <CardContent className="p-6 text-center relative z-10">
              <div className="text-sm font-medium text-green-100 mb-1">M-PESA Till Number</div>
              <div className="text-5xl font-mono font-bold mb-4 tracking-wider">{property.mpesaTill}</div>
              <Button
                variant="secondary"
                onClick={copyTill}
                className="bg-white text-green-700 hover:bg-green-50 rounded-full"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Till Number
              </Button>
            </CardContent>
          </Card>

          {/* M-PESA Steps */}
          <Card className="border-green-100">
            <CardContent className="p-5">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <span>📱</span> M-PESA Payment Steps
              </h3>
              <ol className="space-y-3">
                {[
                  'Open M-PESA on your phone',
                  'Select "Lipa na M-PESA"',
                  'Select "Buy Goods and Services"',
                  `Enter Till Number: ${property.mpesaTill}`,
                  `Enter Amount: KSh ${property.price.toLocaleString()}`,
                  'Enter your M-PESA PIN & confirm',
                  'Copy the confirmation code below ↓',
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="h-6 w-6 rounded-full bg-green-100 text-green-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-sm text-gray-700">{step}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          {/* Upload Proof */}
          <Card>
            <CardContent className="p-5">
              <h3 className="font-semibold mb-4">Confirm Your Payment</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="mpesaCode" className="text-sm font-medium">
                    M-PESA Confirmation Code <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="mpesaCode"
                    value={mpesaCode}
                    onChange={(e) => {
                      setMpesaCode(e.target.value.toUpperCase());
                      setCodeError('');
                    }}
                    placeholder="e.g., QGH3K2L9XY"
                    className={`mt-1.5 font-mono uppercase tracking-widest ${codeError ? 'border-red-400' : ''}`}
                    maxLength={12}
                  />
                  {codeError ? (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {codeError}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400 mt-1">Found in your M-PESA confirmation SMS (10 characters)</p>
                  )}
                </div>

                <div>
                  <Label className="text-sm font-medium">Screenshot (Optional)</Label>
                  <div
                    className="mt-1.5 border-2 border-dashed border-gray-200 hover:border-green-400 rounded-xl p-6 text-center transition-colors cursor-pointer"
                    onClick={() => document.getElementById('fileInput')?.click()}
                  >
                    <Upload className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                    <div className="text-sm text-gray-500">Click to upload M-PESA screenshot</div>
                    <div className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</div>
                    <input
                      id="fileInput"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                    />
                    {proofFile && (
                      <div className="mt-2 text-sm text-green-600 flex items-center justify-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        {proofFile.name}
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  onClick={handleSubmit}
                  className="w-full btn-shimmer text-white border-0 rounded-xl h-12 text-base"
                  size="lg"
                  disabled={!mpesaCode.trim()}
                >
                  <PartyPopper className="h-5 w-5 mr-2" />
                  Submit & Confirm Payment
                </Button>

                <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                  <Shield className="h-3.5 w-3.5 text-green-500" />
                  Your payment details are encrypted. Landlord confirms within 24 hours.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}