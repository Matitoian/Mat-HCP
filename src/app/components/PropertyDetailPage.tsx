import { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Star, CheckCircle, MessageSquare, Heart, Share2, Flag, Wifi, Droplet, Car, Shield, BedDouble, Bath, Home as HomeIcon, Phone, Calendar, Copy, AlertTriangle } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/app/components/ui/carousel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Progress } from '@/app/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/app/components/ui/dialog';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Page } from '@/app/App';
import { User, mockProperties, matatuRoutes } from '@/lib/mockData';
import * as api from '@/lib/apiService';
import { toast } from 'sonner';
import { InteractiveMap } from '@/app/components/InteractiveMap';
import { FraudReportDialog } from '@/app/components/FraudReportDialog';
import { ShareButton } from '@/app/components/ShareButton';
import { analyzePropertyForFraud, getFraudRiskLevel } from '@/lib/securityService';

interface PropertyDetailPageProps {
  user: User | null;
  propertyId: string;
  onNavigate: (page: Page, data?: any) => void;
  onLogout: () => void;
}

export function PropertyDetailPage({ user, propertyId, onNavigate, onLogout }: PropertyDetailPageProps) {
  const [property, setProperty] = useState<any>(mockProperties.find(p => p.id === propertyId) || null);
  const [isSaved, setIsSaved] = useState(false);
  const [viewingDate, setViewingDate] = useState('');
  const [viewingTime, setViewingTime] = useState('');
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [openViewingDialog, setOpenViewingDialog] = useState(false);
  const [openReportDialog, setOpenReportDialog] = useState(false);
  const [ratings, setRatings] = useState<any[]>([]);
  const [userRating, setUserRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);

  useEffect(() => {
    // Fetch real property data from Supabase
    api.getProperty(propertyId)
      .then(res => { if (res.property) setProperty(res.property); })
      .catch(() => { /* keep mock */ });

    // Fetch ratings
    api.getRatings(propertyId)
      .then(res => { if (res.ratings) setRatings(res.ratings); })
      .catch(() => {});

    // Check if saved
    if (user) {
      api.getSaved()
        .then(res => {
          if (res.propertyIds?.includes(propertyId)) setIsSaved(true);
        })
        .catch(() => {});
    }
  }, [propertyId, user]);

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <p>Property not found</p>
            <Button onClick={() => onNavigate('search')} className="mt-4">Back to Search</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const relevantRoutes = matatuRoutes.filter(r => r.county === property.county);

  const handleSave = async () => {
    if (!user) { toast.error('Please login to save properties'); return; }
    try {
      if (isSaved) {
        await api.unsaveProperty(propertyId);
        setIsSaved(false);
        toast.info('Removed from saved');
      } else {
        await api.saveProperty(propertyId);
        setIsSaved(true);
        toast.success('Saved to favorites! ❤️');
      }
    } catch (e) {
      setIsSaved(!isSaved);
      toast.success(isSaved ? 'Removed from saved' : 'Saved to favorites!');
    }
  };

  const handleSubmitRating = async () => {
    if (!user) { toast.error('Please login to leave a review'); return; }
    if (!userRating) { toast.error('Please select a rating'); return; }
    try {
      await api.submitRating({ propertyId, score: userRating, comment: ratingComment });
      setRatings(prev => [...prev.filter(r => r.userId !== user.id), { userId: user.id, userName: user.name, score: userRating, comment: ratingComment, createdAt: new Date().toISOString() }]);
      setRatingDialogOpen(false);
      toast.success('Review submitted! ⭐');
    } catch (e) {
      toast.error('Failed to submit review');
    }
  };

  const handleContact = () => {
    if (!user) { onNavigate('login'); return; }
    onNavigate('chat', { selectedPropertyId: propertyId });
  };

  const handleRequestViewing = () => {
    if (!viewingDate || !viewingTime) {
      toast.error('Please select a date and time');
      return;
    }
    toast.success(`Viewing request sent for ${viewingDate} at ${viewingTime}!`);
    setOpenViewingDialog(false);
    setViewingDate('');
    setViewingTime('');
  };

  // Share functionality is now handled by ShareButton component below

  const handleCallLandlord = () => {
    if (!user) {
      toast.error('Please login to call landlord');
      onNavigate('login');
      return;
    }
    // Create a tel: link for mobile devices
    const landlordPhone = '+254712345678'; // Demo number
    window.location.href = `tel:${landlordPhone}`;
    toast.success('Initiating call...');
  };

  const handleReportListing = () => {
    if (!reportReason) {
      toast.error('Please select a reason');
      return;
    }
    if (!user) {
      toast.error('Please login to report listing');
      setOpenReportDialog(false);
      onNavigate('login');
      return;
    }
    // In a real app, this would send a report to the backend
    toast.success('Thank you for reporting. We will review this listing.');
    setOpenReportDialog(false);
    setReportReason('');
    setReportDetails('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => onNavigate('search')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <ShareButton
                property={{
                  title: property.title,
                  description: property.description,
                  imageUrl: property.images[0],
                  url: window.location.href,
                  price: property.price,
                  location: `${property.location}, ${property.county}`,
                }}
                onSave={handleSave}
                isSaved={isSaved}
                variant="ghost"
                size="icon"
              />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <Card>
              <CardContent className="p-0">
                <Carousel>
                  <CarouselContent>
                    {property.images.map((image, index) => (
                      <CarouselItem key={index}>
                        <div className="relative h-96 overflow-hidden">
                          <img src={image} alt={`${property.title} - ${index + 1}`} className="w-full h-full object-cover" />
                          {property.verified && index === 0 && (
                            <Badge className="absolute top-4 right-4 bg-green-500 text-white">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Verified Property
                            </Badge>
                          )}
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="left-4" />
                  <CarouselNext className="right-4" />
                </Carousel>
              </CardContent>
            </Card>

            {/* Property Info */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold mb-2">{property.title}</h1>
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                      <MapPin className="h-5 w-5" />
                      <span>{property.location}, {property.county}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>🎓 {property.distanceToUni}km to {property.uniName}</span>
                      {property.beachDistance && <span>🏖️ {property.beachDistance}km to beach</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-bold text-blue-600">
                      KSh {property.price.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">per month</div>
                  </div>
                </div>

                {/* Property Stats */}
                <div className="grid grid-cols-3 gap-4 py-4 border-y">
                  <div className="text-center">
                    <BedDouble className="h-6 w-6 mx-auto text-gray-400 mb-1" />
                    <div className="font-semibold">{property.bedrooms}</div>
                    <div className="text-xs text-gray-500">Bedrooms</div>
                  </div>
                  <div className="text-center">
                    <Bath className="h-6 w-6 mx-auto text-gray-400 mb-1" />
                    <div className="font-semibold">{property.bathrooms}</div>
                    <div className="text-xs text-gray-500">Bathrooms</div>
                  </div>
                  <div className="text-center">
                    <HomeIcon className="h-6 w-6 mx-auto text-gray-400 mb-1" />
                    <div className="font-semibold">{property.security.compound}</div>
                    <div className="text-xs text-gray-500">Compound</div>
                  </div>
                </div>

                {/* Description */}
                <div className="mt-6">
                  <h3 className="font-semibold text-lg mb-3">Description</h3>
                  <p className="text-gray-600 leading-relaxed">{property.description}</p>
                </div>

                {/* Amenities */}
                <div className="mt-6">
                  <h3 className="font-semibold text-lg mb-3">Amenities</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {property.amenities.map(amenity => (
                      <div key={amenity} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Security */}
                <div className="mt-6">
                  <h3 className="font-semibold text-lg mb-3">Security Features</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Security Score</span>
                      <div className="flex items-center gap-2">
                        <Progress value={property.security.score * 20} className="w-32" />
                        <span className="font-bold text-green-600">{property.security.score}/5</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {property.security.askari24hr && (
                        <Badge variant="secondary" className="justify-center">
                          🛡️ 24/7 Askari
                        </Badge>
                      )}
                      {property.security.cctv && (
                        <Badge variant="secondary" className="justify-center">
                          📹 CCTV
                        </Badge>
                      )}
                      {property.security.fence && (
                        <Badge variant="secondary" className="justify-center">
                          🚧 Fenced
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Interactive Map */}
            <Card>
              <CardContent className="p-6">
                <InteractiveMap 
                  propertyName={property.title}
                  county={property.county}
                />
              </CardContent>
            </Card>

            {/* Matatu Routes */}
            {relevantRoutes.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-4">🚌 Getting Here - Matatu Routes</h3>
                  <div className="space-y-3">
                    {relevantRoutes.slice(0, 3).map(route => (
                      <div key={route.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <div>
                          <div className="font-medium">{route.name}</div>
                          <div className="text-sm text-gray-600">{route.start} → {route.end}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-blue-600">KSh {route.costKsh}</div>
                          <div className="text-xs text-gray-500">Every {route.frequencyMin} min</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button variant="link" onClick={() => onNavigate('matatu-routes')} className="mt-3 w-full">
                    View All Routes →
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Reviews & Ratings */}
            <Card>
              <CardContent className="p-6">
                <Tabs defaultValue="property">
                  <TabsList className="w-full">
                    <TabsTrigger value="property" className="flex-1">Property Reviews</TabsTrigger>
                    <TabsTrigger value="landlord" className="flex-1">Landlord Rating</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="property" className="mt-4">
                    <div className="flex items-center gap-6 mb-6">
                      <div className="text-center">
                        <div className="text-5xl font-bold mb-1">{property.rating}</div>
                        <div className="flex items-center justify-center gap-1 mb-1">
                          {[1,2,3,4,5].map(i => (
                            <Star key={i} className={`h-4 w-4 ${i <= property.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                          ))}
                        </div>
                        <div className="text-sm text-gray-500">{property.reviews} reviews</div>
                      </div>
                      <div className="flex-1 space-y-2">
                        {[5,4,3,2,1].map(rating => (
                          <div key={rating} className="flex items-center gap-2">
                            <span className="text-sm w-4">{rating}</span>
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <Progress value={(property.reviews / rating) * 10} className="flex-1" />
                            <span className="text-xs text-gray-500 w-8">{Math.floor((property.reviews / rating) * 2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      {[
                        { name: 'Grace M.', rating: 5, text: 'Perfect for TUM students! Close to campus, secure, and landlord is very responsive.', date: '2 weeks ago' },
                        { name: 'John K.', rating: 4, text: 'Good value for money. WiFi is reliable and compound is quiet.', date: '1 month ago' }
                      ].map((review, i) => (
                        <div key={i} className="border-b pb-4 last:border-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>{review.name[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="font-medium text-sm">{review.name}</div>
                              <div className="flex items-center gap-1">
                                {[1,2,3,4,5].map(i => (
                                  <Star key={i} className={`h-3 w-3 ${i <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                                ))}
                              </div>
                            </div>
                            <span className="text-xs text-gray-500">{review.date}</span>
                          </div>
                          <p className="text-sm text-gray-600">{review.text}</p>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="landlord" className="mt-4">
                    <div className="flex items-center gap-4 mb-6 p-4 bg-green-50 rounded-lg">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-green-600 mb-1">{property.landlordRating}</div>
                        <div className="flex items-center justify-center gap-1">
                          {[1,2,3,4,5].map(i => (
                            <Star key={i} className={`h-3 w-3 ${i <= property.landlordRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                          ))}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold mb-1">Excellent Landlord</div>
                        <div className="text-sm text-gray-600">
                          ✅ Quick responses • ✅ Professional • ✅ Fair pricing
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      Based on tenant feedback and verification checks
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Landlord Card */}
            <Card className="sticky top-20">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={`https://i.pravatar.cc/150?u=${property.landlordName}`} />
                    <AvatarFallback>{property.landlordName[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-semibold text-lg">{property.landlordName}</div>
                    <div className="flex items-center gap-1 text-sm">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{property.landlordRating}</span>
                      {property.landlordVerified && (
                        <CheckCircle className="h-4 w-4 text-green-500 ml-1" />
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button onClick={handleContact} className="w-full" size="lg">
                    <MessageSquare className="h-5 w-5 mr-2" />
                    Start Chat
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => setOpenViewingDialog(true)}>
                    <Phone className="h-4 w-4 mr-2" />
                    Request Viewing
                  </Button>
                </div>

                {/* Payment Info */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <div className="text-sm font-medium mb-2">💳 M-PESA Till Number</div>
                  <div className="flex items-center justify-between">
                    <code className="font-mono font-bold text-lg">{property.mpesaTill}</code>
                    <Button size="sm" variant="ghost" onClick={() => {
                      navigator.clipboard.writeText(property.mpesaTill);
                      toast.success('Till number copied');
                    }}>
                      Copy
                    </Button>
                  </div>
                </div>

                <Button variant="ghost" className="w-full mt-3 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => setOpenReportDialog(true)}>
                  <Flag className="h-4 w-4 mr-2" />
                  Report Listing
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Viewing Request Dialog */}
      <Dialog open={openViewingDialog} onOpenChange={setOpenViewingDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Request Viewing</DialogTitle>
            <DialogDescription>
              Enter the date and time you would like to view the property.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={viewingDate}
                onChange={(e) => setViewingDate(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="time"
                value={viewingTime}
                onChange={(e) => setViewingTime(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" onClick={() => setOpenViewingDialog(false)}>
              Cancel
            </Button>
            <Button type="submit" onClick={handleRequestViewing}>Request Viewing</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report Listing Dialog */}
      <Dialog open={openReportDialog} onOpenChange={setOpenReportDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Report Listing</DialogTitle>
            <DialogDescription>
              Please provide the reason and any additional details for reporting this listing.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Select
                id="reason"
                value={reportReason}
                onValueChange={(value) => setReportReason(value)}
                className="col-span-3"
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fraud">Fraudulent Listing</SelectItem>
                  <SelectItem value="inaccurate">Inaccurate Information</SelectItem>
                  <SelectItem value="unavailable">Property Unavailable</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="details">Additional Details</Label>
              <Textarea
                id="details"
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" onClick={() => setOpenReportDialog(false)}>
              Cancel
            </Button>
            <Button type="submit" onClick={handleReportListing}>Report Listing</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}