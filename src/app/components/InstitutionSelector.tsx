import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Search, BookOpen } from 'lucide-react';

interface InstitutionSelectorProps {
  onSelect: (institution: Institution) => void;
  onBack: () => void;
  isLoading?: boolean;
}

interface Institution {
  id: string;
  name: string;
  county: string;
  abbreviation: string;
  type: 'university' | 'college' | 'polytechnic';
}

// Kenyan educational institutions organized by county
const INSTITUTIONS_BY_COUNTY: Record<string, Institution[]> = {
  'Nairobi': [
    { id: 'uon', name: 'University of Nairobi', county: 'Nairobi', abbreviation: 'UoN', type: 'university' },
    { id: 'kenyatta', name: 'Kenyatta University', county: 'Nairobi', abbreviation: 'KU', type: 'university' },
    { id: 'strathmore', name: 'Strathmore University', county: 'Nairobi', abbreviation: 'SU', type: 'university' },
    { id: 'jkuat', name: 'Jomo Kenyatta University of Agriculture and Technology', county: 'Nairobi', abbreviation: 'JKUAT', type: 'university' },
    { id: 'kca', name: 'KCA University', county: 'Nairobi', abbreviation: 'KCA', type: 'university' },
    { id: 'kibu', name: 'Kenya Institute of Business and Unified Studies', county: 'Nairobi', abbreviation: 'KIBU', type: 'university' },
  ],
  'Mombasa': [
    { id: 'pwani', name: 'Pwani University', county: 'Mombasa', abbreviation: 'PU', type: 'university' },
    { id: 'tum', name: 'Technical University of Mombasa', county: 'Mombasa', abbreviation: 'TUM', type: 'university' },
    { id: 'mombasa-poly', name: 'Mombasa Polytechnic', county: 'Mombasa', abbreviation: 'MP', type: 'polytechnic' },
    { id: 'coast-vet', name: 'Coast Institute of Technology', county: 'Mombasa', abbreviation: 'CIT', type: 'college' },
  ],
  'Kilifi': [
    { id: 'holy-ghost', name: 'Holy Ghost University', county: 'Kilifi', abbreviation: 'HGU', type: 'university' },
    { id: 'kilifi-tech', name: 'Kilifi Technical College', county: 'Kilifi', abbreviation: 'KTC', type: 'college' },
  ],
  'Kisumu': [
    { id: 'maseno', name: 'Maseno University', county: 'Kisumu', abbreviation: 'MU', type: 'university' },
    { id: 'kisii', name: 'University of Kisii', county: 'Kisumu', abbreviation: 'UniKis', type: 'university' },
    { id: 'kisumu-poly', name: 'Kisumu Polytechnic', county: 'Kisumu', abbreviation: 'KP', type: 'polytechnic' },
  ],
  'Nakuru': [
    { id: 'kabarak', name: 'Kabarak University', county: 'Nakuru', abbreviation: 'KabU', type: 'university' },
    { id: 'egerton', name: 'Egerton University', county: 'Nakuru', abbreviation: 'EU', type: 'university' },
    { id: 'nakuru-poly', name: 'Nakuru Polytechnic', county: 'Nakuru', abbreviation: 'NP', type: 'polytechnic' },
  ],
  'Eldoret': [
    { id: 'moi', name: 'Moi University', county: 'Eldoret', abbreviation: 'MU', type: 'university' },
    { id: 'uasin-gishu', name: 'Uasin Gishu University', county: 'Eldoret', abbreviation: 'UGU', type: 'university' },
  ],
  'Garissa': [
    { id: 'garissa-uni', name: 'Garissa University College', county: 'Garissa', abbreviation: 'GUC', type: 'university' },
  ],
  'Wajir': [
    { id: 'wajir-ref', name: 'Wajir Referral Training Institute', county: 'Wajir', abbreviation: 'WRTI', type: 'college' },
  ],
};

const ALL_COUNTIES = Object.keys(INSTITUTIONS_BY_COUNTY).sort();

export function InstitutionSelector({ onSelect, onBack, isLoading = false }: InstitutionSelectorProps) {
  const [selectedCounty, setSelectedCounty] = useState('Mombasa');
  const [searchTerm, setSearchTerm] = useState('');

  const institutions = INSTITUTIONS_BY_COUNTY[selectedCounty] || [];
  const filteredInstitutions = institutions.filter(inst =>
    inst.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inst.abbreviation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="w-fit mb-2"
          >
            ← Back
          </Button>
          <CardTitle className="text-2xl flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-purple-600" />
            Select Your Institution
          </CardTitle>
          <CardDescription>
            Choose the school or university you attend. This helps us show you listings near your campus.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* County Selector */}
          <div className="space-y-3">
            <Label htmlFor="county">County *</Label>
            <Select value={selectedCounty} onValueChange={setSelectedCounty}>
              <SelectTrigger id="county" className="w-full">
                <SelectValue placeholder="Select your county" />
              </SelectTrigger>
              <SelectContent>
                {ALL_COUNTIES.map(county => (
                  <SelectItem key={county} value={county}>
                    {county}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Search Box */}
          <div className="space-y-3">
            <Label htmlFor="search">Search Institution</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="search"
                placeholder="Search by name or abbreviation..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Institution List */}
          <div className="space-y-2 max-h-96 overflow-y-auto border rounded-lg p-4 bg-gray-50">
            {filteredInstitutions.length > 0 ? (
              filteredInstitutions.map((institution) => (
                <button
                  key={institution.id}
                  onClick={() => !isLoading && onSelect(institution)}
                  disabled={isLoading}
                  className="w-full text-left p-3 rounded-lg border-2 border-transparent hover:border-blue-500 hover:bg-blue-50 transition-all disabled:opacity-50"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{institution.name}</p>
                      <p className="text-xs text-gray-600">{institution.abbreviation} • {institution.type.charAt(0).toUpperCase() + institution.type.slice(1)}</p>
                    </div>
                    <div className="text-sm font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded">
                      {institution.type === 'university' ? '🎓' : institution.type === 'college' ? '📚' : '⚙️'}
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <BookOpen className="h-12 w-12 mx-auto opacity-20 mb-2" />
                <p>No institutions found in {selectedCounty}</p>
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-xs text-gray-700">
              <strong>💡 Pro Tip:</strong> Selecting your institution helps us recommend listings close to your campus and filter results by your county.
            </p>
          </div>

          {/* Skip Button */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              className="flex-1"
              disabled={isLoading}
            >
              Skip for Now
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
