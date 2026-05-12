import { useState } from 'react';
import { ArrowLeft, Upload, MapPin, DollarSign, Home, Shield, Loader2 } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Card, CardContent } from '@/app/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Page } from '@/app/App';
import { User } from '@/lib/mockData';
import * as api from '@/lib/apiService';
import { toast } from 'sonner';

interface AddPropertyPageProps {
  user: User;
  onNavigate: (page: Page, data?: any) => void;
  onLogout: () => void;
}

export function AddPropertyPage({ user, onNavigate, onLogout }: AddPropertyPageProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    county: 'Mombasa',
    location: '',
    bedrooms: '1',
    bathrooms: '1',
    compound: '',
    mpesaTill: '',
    amenities: [] as string[],
    securityFeatures: [] as string[]
  });

  const amenitiesList = ['WiFi', '24/7 Water', 'Parking', 'Security', 'Generator', 'Kitchen', 'Balcony'];
  const securityFeaturesList = ['24/7 Askari', 'CCTV', 'Fenced Compound', 'Gate'];

  const toggleAmenity = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const toggleSecurity = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      securityFeatures: prev.securityFeatures.includes(feature)
        ? prev.securityFeatures.filter(f => f !== feature)
        : [...prev.securityFeatures, feature]
    }));
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.price || !formData.location) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const propertyData = {
        title: formData.title,
        description: formData.description,
        price: parseInt(formData.price),
        county: formData.county,
        location: formData.location,
        bedrooms: parseInt(formData.bedrooms),
        bathrooms: parseInt(formData.bathrooms),
        amenities: formData.amenities,
        mpesaTill: formData.mpesaTill,
        security: {
          score: formData.securityFeatures.length + 2,
          askari24hr: formData.securityFeatures.includes('24/7 Askari'),
          cctv: formData.securityFeatures.includes('CCTV'),
          fence: formData.securityFeatures.includes('Fenced Compound'),
          compound: formData.compound || `${formData.location} Compound`,
        },
        distanceToUni: 2.0,
        uniName: formData.county === 'Kilifi' ? 'Pwani University' : 'TUM',
        touristFriendly: false,
        latitude: 0, longitude: 0,
        images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800'],
      };

      await api.createProperty(propertyData);
      toast.success('Property submitted for verification! ✅');
      onNavigate('landlord-dashboard');
    } catch (e) {
      toast.error('Failed to submit property. Please try again.');
      console.log('Create property error:', e);
    }
  };

  const renderStep = () => {
    switch(step) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Property Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="e.g., Cozy 1BD near TUM"
              />
            </div>
            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Describe your property..."
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Monthly Rent (KSh) *</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  placeholder="7500"
                />
              </div>
              <div>
                <Label htmlFor="county">County *</Label>
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
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bedrooms">Bedrooms *</Label>
                <Select value={formData.bedrooms} onValueChange={(value) => setFormData({...formData, bedrooms: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="4">4+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="bathrooms">Bathrooms *</Label>
                <Select value={formData.bathrooms} onValueChange={(value) => setFormData({...formData, bathrooms: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="location">Specific Location *</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                placeholder="e.g., Tudor, near TUM main gate"
              />
            </div>
            <div>
              <Label htmlFor="compound">Compound/Estate Name</Label>
              <Input
                id="compound"
                value={formData.compound}
                onChange={(e) => setFormData({...formData, compound: e.target.value})}
                placeholder="e.g., Tudor Heights Estate"
              />
            </div>
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 mx-auto text-gray-400 mb-2" />
              <div className="text-sm text-gray-600">Drop property photos here or click to upload</div>
              <div className="text-xs text-gray-400 mt-1">Max 10 photos, 5MB each</div>
              <Button variant="outline" className="mt-4">
                Choose Files
              </Button>
            </div>
          </div>
        );
      
      case 3:
        return (
          <div className="space-y-4">
            <div>
              <Label className="mb-3 block">Amenities</Label>
              <div className="grid grid-cols-2 gap-3">
                {amenitiesList.map(amenity => (
                  <div key={amenity} className="flex items-center space-x-2">
                    <Checkbox
                      id={amenity}
                      checked={formData.amenities.includes(amenity)}
                      onCheckedChange={() => toggleAmenity(amenity)}
                    />
                    <label htmlFor={amenity} className="text-sm cursor-pointer">{amenity}</label>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label className="mb-3 block">Security Features</Label>
              <div className="grid grid-cols-2 gap-3">
                {securityFeaturesList.map(feature => (
                  <div key={feature} className="flex items-center space-x-2">
                    <Checkbox
                      id={feature}
                      checked={formData.securityFeatures.includes(feature)}
                      onCheckedChange={() => toggleSecurity(feature)}
                    />
                    <label htmlFor={feature} className="text-sm cursor-pointer">{feature}</label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      
      case 4:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="mpesa">M-PESA Till Number *</Label>
              <Input
                id="mpesa"
                value={formData.mpesaTill}
                onChange={(e) => setFormData({...formData, mpesaTill: e.target.value})}
                placeholder="HC001234"
              />
              <p className="text-xs text-gray-500 mt-1">Tenants will use this to pay rent</p>
            </div>
            
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2">Property Preview</h4>
                <div className="space-y-1 text-sm">
                  <p><strong>Title:</strong> {formData.title || 'Not set'}</p>
                  <p><strong>Price:</strong> KSh {formData.price || '0'}/month</p>
                  <p><strong>Location:</strong> {formData.location || 'Not set'}, {formData.county}</p>
                  <p><strong>Size:</strong> {formData.bedrooms} bed, {formData.bathrooms} bath</p>
                  <p><strong>Amenities:</strong> {formData.amenities.length} selected</p>
                  <p><strong>Security:</strong> {formData.securityFeatures.length} features</p>
                </div>
              </CardContent>
            </Card>
            
            <div className="flex items-start space-x-2">
              <Checkbox id="terms" />
              <label htmlFor="terms" className="text-sm text-gray-600">
                I confirm that all information provided is accurate and I have the legal right to list this property
              </label>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => step === 1 ? onNavigate('landlord-dashboard') : setStep(step - 1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Add New Property</h1>
          <p className="text-gray-600">Step {step} of 4</p>
          <div className="flex gap-2 mt-4">
            {[1,2,3,4].map(i => (
              <div key={i} className={`h-2 flex-1 rounded-full ${i <= step ? 'bg-blue-600' : 'bg-gray-200'}`} />
            ))}
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            {renderStep()}
            
            <div className="flex gap-3 mt-6">
              {step < 4 ? (
                <Button onClick={() => setStep(step + 1)} className="flex-1">
                  Next Step
                </Button>
              ) : (
                <Button onClick={handleSubmit} className="flex-1">
                  Submit for Verification
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}