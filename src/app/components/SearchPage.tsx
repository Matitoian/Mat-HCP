import { useState, useEffect } from 'react';
import { Search, MapPin, Star, CheckCircle, SlidersHorizontal, Map, List, Home, MessageSquare, Route, User as UserIcon, LogOut, X } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Card, CardContent } from '@/app/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Slider } from '@/app/components/ui/slider';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/app/components/ui/sheet';
import { Badge } from '@/app/components/ui/badge';
import { Page } from '@/app/App';
import { User, mockProperties } from '@/lib/mockData';
import * as api from '@/lib/apiService';

interface SearchPageProps {
  user: User | null;
  searchParams?: {
    county?: string;
    minPrice?: number;
    maxPrice?: number;
    bedrooms?: number;
  };
  onNavigate: (page: Page, data?: any) => void;
  onLogout: () => void;
}

export function SearchPage({ user, searchParams, onNavigate, onLogout }: SearchPageProps) {
  const [county, setCounty] = useState(searchParams?.county || 'All');
  const [priceRange, setPriceRange] = useState<[number, number]>([searchParams?.minPrice || 3000, searchParams?.maxPrice || 25000]);
  const [bedrooms, setBedrooms] = useState(searchParams?.bedrooms?.toString() || 'all');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [amenities, setAmenities] = useState<string[]>([]);
  const [securityFilters, setSecurityFilters] = useState<string[]>([]);
  const [searchText, setSearchText] = useState('');
  const [allProperties, setAllProperties] = useState<any[]>(mockProperties);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    api.getProperties()
      .then(res => { if (res.properties?.length) setAllProperties(res.properties); })
      .catch(() => setAllProperties(mockProperties))
      .finally(() => setIsLoading(false));
  }, []);

  // Filter properties client-side
  const filteredProperties = allProperties.filter(prop => {
    if (county !== 'All' && prop.county !== county) return false;
    if (prop.price < priceRange[0] || prop.price > priceRange[1]) return false;
    if (bedrooms !== 'all' && prop.bedrooms !== parseInt(bedrooms)) return false;
    if (amenities.length > 0 && !amenities.every(a => prop.amenities?.includes(a))) return false;
    if (securityFilters.includes('askari') && !prop.security?.askari24hr) return false;
    if (securityFilters.includes('cctv') && !prop.security?.cctv) return false;
    if (securityFilters.includes('fence') && !prop.security?.fence) return false;
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      const matches =
        prop.title?.toLowerCase().includes(q) ||
        prop.location?.toLowerCase().includes(q) ||
        prop.landlordName?.toLowerCase().includes(q) ||
        prop.county?.toLowerCase().includes(q) ||
        prop.uniName?.toLowerCase().includes(q);
      if (!matches) return false;
    }
    return true;
  });

  const toggleAmenity = (amenity: string) => {
    setAmenities(prev => 
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    );
  };

  const toggleSecurityFilter = (filter: string) => {
    setSecurityFilters(prev =>
      prev.includes(filter) ? prev.filter(f => f !== filter) : [...prev, filter]
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button onClick={() => onNavigate('landing')} className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
                <span className="text-white font-bold text-xl">HC</span>
              </div>
              <span className="font-bold text-xl">HouseCom</span>
            </button>

            {/* Desktop Search Bar */}
            <div className="hidden md:flex items-center gap-2 flex-1 max-w-xl mx-8">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search location, property type, landlord..."
                  className="pl-9 flex-1"
                  value={searchText}
                  onChange={e => setSearchText(e.target.value)}
                />
                {searchText && (
                  <button
                    onClick={() => setSearchText('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {user ? (
                <>
                  <Button variant="ghost" size="sm" onClick={() => onNavigate('matatu-routes')}>
                    <Route className="h-4 w-4 mr-2" />
                    Routes
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onNavigate(user.role === 'tenant' ? 'tenant-dashboard' : 'landlord-dashboard')}>
                    <Home className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onNavigate('profile')}>
                    <UserIcon className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" onClick={() => onNavigate('login')}>Login</Button>
                  <Button onClick={() => onNavigate('signup')}>Sign Up</Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Filters Sidebar - Desktop */}
          <Card className="hidden lg:block w-80 h-fit sticky top-20">
            <CardContent className="p-6 space-y-6">
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters
                </h3>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">County</label>
                <Select value={county} onValueChange={setCounty}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Coast</SelectItem>
                    <SelectItem value="Mombasa">Mombasa</SelectItem>
                    <SelectItem value="Kilifi">Kilifi</SelectItem>
                    <SelectItem value="Kwale">Kwale</SelectItem>
                    <SelectItem value="Lamu">Lamu</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Price Range</label>
                <Slider
                  value={priceRange}
                  onValueChange={(val) => setPriceRange(val as [number, number])}
                  min={3000}
                  max={25000}
                  step={500}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>KSh {priceRange[0].toLocaleString()}</span>
                  <span>KSh {priceRange[1].toLocaleString()}</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Bedrooms</label>
                <Select value={bedrooms} onValueChange={setBedrooms}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any</SelectItem>
                    <SelectItem value="1">1 Bed</SelectItem>
                    <SelectItem value="2">2 Beds</SelectItem>
                    <SelectItem value="3">3 Beds</SelectItem>
                    <SelectItem value="4">4+ Beds</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-3 block">Security</label>
                <div className="space-y-2">
                  {['askari', 'cctv', 'fence'].map(filter => (
                    <div key={filter} className="flex items-center space-x-2">
                      <Checkbox
                        id={filter}
                        checked={securityFilters.includes(filter)}
                        onCheckedChange={() => toggleSecurityFilter(filter)}
                      />
                      <label htmlFor={filter} className="text-sm capitalize cursor-pointer">
                        {filter === 'askari' ? '24/7 Askari' : filter === 'cctv' ? 'CCTV' : 'Fenced Compound'}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-3 block">Amenities</label>
                <div className="space-y-2">
                  {['WiFi', '24/7 Water', 'Parking', 'Generator', 'Kitchen'].map(amenity => (
                    <div key={amenity} className="flex items-center space-x-2">
                      <Checkbox
                        id={amenity}
                        checked={amenities.includes(amenity)}
                        onCheckedChange={() => toggleAmenity(amenity)}
                      />
                      <label htmlFor={amenity} className="text-sm cursor-pointer">
                        {amenity}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mobile Filters */}
          <Sheet>
            <SheetTrigger asChild>
              <Button className="lg:hidden fixed bottom-20 right-4 z-40 rounded-full h-14 w-14 shadow-lg" size="icon">
                <SlidersHorizontal className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                {/* Same filter content as desktop */}
                <div>
                  <label className="text-sm font-medium mb-2 block">County</label>
                  <Select value={county} onValueChange={setCounty}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Coast</SelectItem>
                      <SelectItem value="Mombasa">Mombasa</SelectItem>
                      <SelectItem value="Kilifi">Kilifi</SelectItem>
                      <SelectItem value="Kwale">Kwale</SelectItem>
                      <SelectItem value="Lamu">Lamu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Price Range</label>
                  <Slider
                    value={priceRange}
                    onValueChange={(val) => setPriceRange(val as [number, number])}
                    min={3000}
                    max={25000}
                    step={500}
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>KSh {priceRange[0].toLocaleString()}</span>
                    <span>KSh {priceRange[1].toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* Results */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold">{filteredProperties.length} Properties Found</h2>
                <p className="text-sm text-gray-500">
                  {county !== 'All' ? `in ${county}` : 'across Coastal Kenya'}
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4 mr-2" />
                  List
                </Button>
                <Button
                  variant={viewMode === 'map' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('map')}
                >
                  <Map className="h-4 w-4 mr-2" />
                  Map
                </Button>
              </div>
            </div>

            {viewMode === 'list' ? (
              <div className="grid md:grid-cols-2 gap-6">
                {filteredProperties.map(property => (
                  <div
                    key={property.id}
                    className="property-card bg-white rounded-2xl overflow-hidden border border-gray-100 cursor-pointer"
                    onClick={() => onNavigate('property-detail', { selectedPropertyId: property.id })}
                  >
                    <div className="relative h-52 overflow-hidden">
                      <img src={property.images[0]} alt={property.title} className="card-img w-full h-full object-cover" />
                      {/* Hover view button */}
                      <div className="view-btn absolute inset-x-0 bottom-0 p-3">
                        <div className="bg-white/90 backdrop-blur-sm rounded-xl py-2 text-center text-sm font-semibold text-blue-600">
                          View Details →
                        </div>
                      </div>
                      {property.verified && (
                        <span className="verified-glow absolute top-3 left-3 bg-green-500 text-white px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" /> Verified
                        </span>
                      )}
                      <div className="absolute top-3 right-3 bg-black/50 text-white px-2 py-0.5 rounded-full text-xs">
                        {property.county}
                      </div>
                      <div className="absolute bottom-12 left-3 flex gap-1">
                        <Badge className="bg-blue-600 text-xs">🛏️ {property.bedrooms}</Badge>
                        <Badge className="bg-blue-600 text-xs">🚿 {property.bathrooms}</Badge>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{property.title}</h3>
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <span className="text-blue-600 font-bold text-lg">KSh {property.price.toLocaleString()}</span>
                          <span className="text-xs text-gray-400">/mo</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-semibold">{property.rating}</span>
                          <span className="text-xs text-gray-400">({property.reviews})</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                        <MapPin className="h-3 w-3" />
                        <span className="line-clamp-1">{property.location} · {property.distanceToUni}km to {property.uniName}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-xs bg-green-50 text-green-700 rounded-full px-2.5 py-1 font-medium">
                          🔒 {property.security.score}/5
                        </span>
                        {property.security.askari24hr && (
                          <span className="text-xs bg-blue-50 text-blue-700 rounded-full px-2.5 py-1 font-medium">
                            24/7 Askari
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg p-8 text-center">
                <Map className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Map View</h3>
                <p className="text-gray-500 mb-4">Interactive map with property pins would display here</p>
                <p className="text-sm text-gray-400">Google Maps integration showing all {filteredProperties.length} properties</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation — with sliding pill */}
      {user && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-50 shadow-lg">
          <div className="relative grid grid-cols-4 p-2">
            {/* Active pill — static on Search */}
            <div
              className="bottom-nav-pill absolute top-2 h-[calc(100%-16px)] rounded-xl bg-blue-50"
              style={{ width: '25%', left: '25%' }}
            />
            {[
              { label: 'Home', icon: Home, page: user.role === 'tenant' ? 'tenant-dashboard' : 'landlord-dashboard' as any, active: false },
              { label: 'Search', icon: Search, page: 'search' as any, active: true },
              { label: 'Chats', icon: MessageSquare, page: 'chat' as any, active: false },
              { label: 'Profile', icon: UserIcon, page: 'profile' as any, active: false },
            ].map((tab) => (
              <button
                key={tab.label}
                onClick={() => onNavigate(tab.page)}
                className={`flex flex-col items-center py-2 gap-0.5 relative z-10 transition-colors ${
                  tab.active ? 'text-blue-600' : 'text-gray-400'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}