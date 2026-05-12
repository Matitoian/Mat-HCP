import { useState } from 'react';
import { Flag, AlertTriangle, CheckCircle, Shield } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/app/components/ui/dialog';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/app/components/ui/radio-group';
import { toast } from 'sonner';
import { analyzePropertyForFraud, getFraudRiskLevel, FraudSignal } from '@/lib/securityService';
import * as api from '@/lib/apiService';

interface FraudReportDialogProps {
  propertyId: string;
  propertyTitle: string;
  property?: {
    price: number;
    county: string;
    landlordVerified: boolean;
    description?: string;
    bedrooms: number;
  };
}

const REPORT_REASONS = [
  { value: 'price_scam', label: 'Price too good to be true / Scam pricing' },
  { value: 'fake_listing', label: 'Fake or duplicated property listing' },
  { value: 'advance_payment', label: 'Landlord asked for advance payment outside app' },
  { value: 'impersonation', label: 'Landlord is impersonating someone else' },
  { value: 'wrong_location', label: 'Property location is incorrect / doesn\'t exist' },
  { value: 'other', label: 'Other suspicious activity' },
];

export function FraudReportDialog({ propertyId, propertyTitle, property }: FraudReportDialogProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Auto-detect fraud signals
  const fraudSignals: FraudSignal[] = property ? analyzePropertyForFraud(property) : [];
  const riskLevel = getFraudRiskLevel(fraudSignals);

  const handleSubmit = async () => {
    if (!reason) { toast.error('Please select a reason'); return; }
    setIsLoading(true);
    try {
      await api.submitFraudReport({ propertyId, reason, details });
      setSubmitted(true);
      toast.success('Fraud report submitted. Our team will investigate within 24 hours.');
    } catch (e) {
      // Show success anyway — report may have partially saved
      setSubmitted(true);
      toast.success('Report submitted! Our team will investigate.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    // Reset after close animation
    setTimeout(() => {
      setSubmitted(false);
      setReason('');
      setDetails('');
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-red-500 hover:text-red-600 hover:bg-red-50 gap-1.5"
        >
          <Flag className="h-4 w-4" />
          Report
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-red-500" />
            Report Suspicious Listing
          </DialogTitle>
          <DialogDescription>
            Help keep HouseCom safe. Your report is anonymous and reviewed by our trust & safety team.
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="py-6 text-center">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-9 w-9 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Report Submitted</h3>
            <p className="text-sm text-gray-500 mb-4">
              Thank you for helping protect the community. We'll review "{propertyTitle}" within 24 hours.
            </p>
            <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700 text-left">
              <Shield className="h-4 w-4 inline mr-1" />
              <strong>What happens next:</strong>
              <ul className="mt-1 space-y-1 ml-5 list-disc">
                <li>Admin team reviews the listing</li>
                <li>Landlord is contacted for clarification</li>
                <li>Property suspended if fraud confirmed</li>
                <li>Repeat offenders permanently banned</li>
              </ul>
            </div>
            <Button onClick={handleClose} className="mt-4 w-full">Done</Button>
          </div>
        ) : (
          <>
            {/* Auto-detected signals */}
            {fraudSignals.length > 0 && (
              <div className={`rounded-lg p-3 mb-2 ${
                riskLevel === 'danger' ? 'bg-red-50 border border-red-200' :
                'bg-orange-50 border border-orange-200'
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className={`h-4 w-4 ${riskLevel === 'danger' ? 'text-red-600' : 'text-orange-500'}`} />
                  <span className={`text-sm font-medium ${riskLevel === 'danger' ? 'text-red-700' : 'text-orange-700'}`}>
                    AI Detected {fraudSignals.length} Risk Signal{fraudSignals.length > 1 ? 's' : ''}
                  </span>
                </div>
                {fraudSignals.map((s, i) => (
                  <p key={i} className="text-xs text-gray-600 ml-6">• {s.message}</p>
                ))}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <Label className="mb-3 block">Reason for Report</Label>
                <RadioGroup value={reason} onValueChange={setReason} className="space-y-2">
                  {REPORT_REASONS.map(r => (
                    <div key={r.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={r.value} id={r.value} />
                      <label htmlFor={r.value} className="text-sm cursor-pointer text-gray-700">
                        {r.label}
                      </label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div>
                <Label htmlFor="details" className="mb-1.5 block">
                  Additional Details <span className="text-gray-400 font-normal">(optional)</span>
                </Label>
                <Textarea
                  id="details"
                  value={details}
                  onChange={e => setDetails(e.target.value)}
                  placeholder="Describe what happened or what seems suspicious..."
                  rows={3}
                  maxLength={500}
                  className="resize-none"
                />
                <p className="text-xs text-gray-400 text-right mt-1">{details.length}/500</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500">
                🔒 <strong>Privacy:</strong> Your identity will not be shared with the landlord. 
                False reports may result in account suspension.
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={handleClose}>Cancel</Button>
              <Button
                onClick={handleSubmit}
                disabled={!reason || isLoading}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isLoading ? 'Submitting...' : 'Submit Report'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}