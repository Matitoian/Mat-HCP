import { ArrowLeft } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Page } from '@/app/App';
import { User, matatuRoutes } from '@/lib/mockData';
import { useState } from 'react';

interface MatatuRoutesPageProps {
  user: User | null;
  onNavigate: (page: Page, data?: any) => void;
  onLogout: () => void;
}

export function MatatuRoutesPage({ user, onNavigate, onLogout }: MatatuRoutesPageProps) {
  const [selectedCounty, setSelectedCounty] = useState('All');

  const filteredRoutes = selectedCounty === 'All'
    ? matatuRoutes
    : matatuRoutes.filter(r => r.county === selectedCounty);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => onNavigate(user ? (user.role === 'tenant' ? 'tenant-dashboard' : 'landlord-dashboard') : 'landing')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">🚌 Matatu Routes</h1>
          <p className="text-gray-600">Find transport routes and costs across the Coastal region</p>
        </div>

        <div className="mb-6">
          <Select value={selectedCounty} onValueChange={setSelectedCounty}>
            <SelectTrigger className="w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Counties</SelectItem>
              <SelectItem value="Mombasa">Mombasa</SelectItem>
              <SelectItem value="Kilifi">Kilifi</SelectItem>
              <SelectItem value="Kwale">Kwale</SelectItem>
              <SelectItem value="Lamu">Lamu</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4">
          {filteredRoutes.map(route => (
            <Card key={route.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge>{route.name}</Badge>
                      <Badge variant="outline">{route.county}</Badge>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <span className="font-medium">{route.start}</span>
                      <span>→</span>
                      <span className="font-medium">{route.end}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-blue-600">KSh {route.costKsh}</div>
                    <div className="text-sm text-gray-500">Every {route.frequencyMin} min</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredRoutes.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center text-gray-500">
              No routes found for this county
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
