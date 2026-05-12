import { useState, useEffect } from 'react';
import {
  Home, Search, MessageSquare, MapPin, Heart, User as UserIcon,
  LogOut, Star, TrendingUp, Bell, Shield, ChevronRight,
  Bus, CheckCircle, Clock, DollarSign, AlertTriangle
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar';
import { Progress } from '@/app/components/ui/progress';
import { Page } from '@/app/App';
import { User, mockProperties, mockChats, matatuRoutes } from '@/lib/mockData';
import * as api from '@/lib/apiService';
import { toast } from 'sonner';

interface TenantDashboardProps {
  user: User;
  onNavigate: (page: Page, data?: any) => void;
  onLogout: () => void;
}

// Mock tenant notifications
const tenantNotifications = [
  { id: '1', text: 'Juma Khalifa replied to your inquiry about Tudor Apartment', type: 'chat', time: '1hr ago', read: false },
  { id: '2', text: 'Price drop alert: Mikindani Studio now KSh 5,500 (was 6,000)', type: 'price', time: '3hr ago', read: false },
  { id: '3', text: 'Your account has been verified ✓', type: 'verify', time: '1d ago', read: true },
];

// Mock viewing requests
const viewingRequests = [
  { id: '1', property: 'Tudor Apartment', landlord: 'Juma Khalifa', date: 'March 8, 2026', time: '2:00 PM', status: 'confirmed' },
  { id: '2', property: 'Studio Mikindani', landlord: 'Amina Hassan', date: 'March 10, 2026', time: '11:00 AM', status: 'pending' },
];

export function TenantDashboard({ user, onNavigate, onLogout }: TenantDashboardProps) {
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [savedProperties, setSavedProperties] = useState<any[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [recommended, setRecommended] = useState<any[]>(mockProperties.filter(p => p.county === user.county && p.verified).slice(0, 4));
  const [recentPayments, setRecentPayments] = useState<any[]>([]);

  useEffect(() => {
    // Fetch saved properties from Supabase
    api.getSaved()
      .then(res => {
        if (res.properties) {
          setSavedProperties(res.properties);
          setSavedIds(new Set(res.propertyIds || res.properties.map((p: any) => p.id)));
        }
      })
      .catch(() => setSavedProperties([]));

    // Fetch notifications
    api.getNotifications()
      .then(res => { if (res.notifications) setNotifications(res.notifications); })
      .catch(() => {});

    // Fetch recommended properties (by user county and institution if student)
    const queryParams: any = { 
      county: user.county, 
      limit: 4 
    };
    if (user.isStudent && user.institutionCounty) {
      queryParams.county = user.institutionCounty;
    }
    
    api.getProperties(queryParams)
      .then(res => { if (res.properties?.length) setRecommended(res.properties.filter((p: any) => p.verified).slice(0, 4)); })
      .catch(() => {});

    // Fetch recent payments
    api.getPayments()
      .then(res => { if (res.payments) setRecentPayments(res.payments.slice(0, 3)); })
      .catch(() => {});
  }, [user.county, user.isStudent, user.institutionCounty]);

  const recentChats = mockChats;
  const unreadNotifs = notifications.filter(n => !n.read).length;

  const toggleSave = async (propertyId: string) => {
    try {
      if (savedIds.has(propertyId)) {
        await api.unsaveProperty(propertyId);
        setSavedIds(prev => { const n = new Set(prev); n.delete(propertyId); return n; });
        setSavedProperties(prev => prev.filter(p => p.id !== propertyId));
        toast.info('Removed from saved');
      } else {
        await api.saveProperty(propertyId);
        setSavedIds(prev => new Set([...prev, propertyId]));
        toast.success('Saved to favorites! ❤️');
      }
    } catch (e) {
      toast.error('Failed to update saved');
    }
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center">
                <Home className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="font-poppins font-bold text-base">HouseCom</h1>
                <p className="text-xs text-gray-500">Tenant Portal</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {/* Notifications */}
              <div className="relative">
                <Button variant="ghost" size="icon" onClick={() => setNotifOpen(!notifOpen)} className="relative">
                  <Bell className="h-5 w-5" />
                  {unreadNotifs > 0 && (
                    <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold">
                      {unreadNotifs}
                    </span>
                  )}
                </Button>
                {notifOpen && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border z-50">
                    <div className="flex items-center justify-between p-3 border-b">
                      <h4 className="font-semibold text-sm">Notifications</h4>
                      <button onClick={markAllRead} className="text-xs text-blue-600">Mark all read</button>
                    </div>
                    <div className="divide-y max-h-64 overflow-y-auto">
                      {notifications.map(n => (
                        <div key={n.id} className={`p-3 flex gap-2 ${!n.read ? 'bg-blue-50' : ''}`}>
                          <div className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${
                            n.type === 'chat' ? 'bg-blue-500' :
                            n.type === 'price' ? 'bg-green-500' :
                            'bg-purple-500'
                          }`} />
                          <div>
                            <p className="text-xs text-gray-800">{n.text}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">{n.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <Button variant="ghost" size="icon" onClick={() => onNavigate('profile')}>
                <UserIcon className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={onLogout}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-teal-600 rounded-2xl p-5 mb-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-poppins font-bold text-xl">Habari, {user.name.split(' ')[0]}! 👋</h2>
              <p className="text-blue-100 text-sm mt-1">
                {savedProperties.length} saved properties • {recentChats.length} active chats
              </p>
              {(user.isStudent || user.institution) && (
                <div className="flex flex-col gap-1.5 mt-2">
                  {user.institution && (
                    <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1 w-fit">
                      <span className="text-lg">🎓</span>
                      <span className="text-xs font-medium">{user.institution}</span>
                    </div>
                  )}
                  {user.studentId && (
                    <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1 w-fit">
                      <CheckCircle className="h-3.5 w-3.5" />
                      <span className="text-xs font-medium">ID: {user.studentId}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            <Avatar className="h-14 w-14 border-2 border-white/40">
              <AvatarImage src={user.avatar} />
              <AvatarFallback className="bg-white/20 text-white font-bold">
                {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Search Homes', icon: Search, color: 'from-blue-500 to-blue-600', action: () => onNavigate('search') },
            { label: 'Matatu Routes', icon: Bus, color: 'from-teal-500 to-teal-600', action: () => onNavigate('matatu-routes') },
            { label: `My Chats (${recentChats.length})`, icon: MessageSquare, color: 'from-purple-500 to-purple-600', action: () => onNavigate('chat') },
            { label: `Saved (${savedProperties.length})`, icon: Heart, color: 'from-pink-500 to-rose-500', action: () => {} },
          ].map(item => (
            <button
              key={item.label}
              onClick={item.action}
              className={`bg-gradient-to-br ${item.color} text-white rounded-2xl p-4 text-left hover:opacity-90 active:scale-95 transition-all shadow-sm`}
            >
              <item.icon className="h-6 w-6 mb-2 opacity-90" />
              <div className="text-sm font-semibold leading-tight">{item.label}</div>
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">

            {/* Viewing Schedule */}
            {viewingRequests.length > 0 && (
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Clock className="h-5 w-5 text-blue-600" />
                    Upcoming Viewings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {viewingRequests.map(v => (
                    <div key={v.id} className="flex items-center justify-between p-3 rounded-xl border hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${
                          v.status === 'confirmed' ? 'bg-green-100' : 'bg-orange-100'
                        }`}>
                          {v.status === 'confirmed'
                            ? <CheckCircle className="h-5 w-5 text-green-600" />
                            : <Clock className="h-5 w-5 text-orange-600" />
                          }
                        </div>
                        <div>
                          <p className="font-medium text-sm">{v.property}</p>
                          <p className="text-xs text-gray-500">{v.landlord} • {v.date} at {v.time}</p>
                        </div>
                      </div>
                      <Badge className={v.status === 'confirmed'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-orange-100 text-orange-700'
                      }>
                        {v.status}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Saved Properties */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Heart className="h-5 w-5 text-rose-500" />
                  Saved Properties
                </CardTitle>
                <Button size="sm" variant="ghost" className="text-blue-600" onClick={() => onNavigate('search')}>
                  Browse more →
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {savedProperties.map(property => (
                    <div
                      key={property.id}
                      className="border rounded-xl overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
                    >
                      <div className="relative h-36 overflow-hidden">
                        <img
                          src={property.images[0]}
                          alt={property.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onClick={() => onNavigate('property-detail', { selectedPropertyId: property.id })}
                        />
                        <button
                          onClick={e => { e.stopPropagation(); toggleSave(property.id); }}
                          aria-label={savedIds.has(property.id) ? 'Remove from saved' : 'Save property'}
                          className="absolute top-2 right-2 h-7 w-7 bg-white/90 rounded-full flex items-center justify-center shadow"
                        >
                          <Heart className={`h-4 w-4 ${savedIds.has(property.id) ? 'fill-rose-500 text-rose-500' : 'text-gray-400'}`} />
                        </button>
                        {property.verified && (
                          <div className="absolute top-2 left-2 bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-medium flex items-center gap-1">
                            <CheckCircle className="h-2.5 w-2.5" /> Verified
                          </div>
                        )}
                      </div>
                      <div className="p-3" onClick={() => onNavigate('property-detail', { selectedPropertyId: property.id })}>
                        <h4 className="font-semibold text-sm line-clamp-1">{property.title}</h4>
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                          <MapPin className="h-3 w-3" />
                          {property.location}
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="font-bold text-blue-600">KSh {property.price.toLocaleString()}</span>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs">{property.rating}</span>
                          </div>
                        </div>
                        <div className="flex gap-1.5 mt-2">
                          <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                            🚌 {property.distanceToUni}km to {property.uniName}
                          </span>
                          <span className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                            🔒 {property.security.score}/5
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Chats */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                  Recent Chats
                </CardTitle>
                <Button size="sm" variant="ghost" className="text-blue-600" onClick={() => onNavigate('chat')}>
                  View all →
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentChats.map(chat => (
                  <div
                    key={chat.id}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer border"
                    onClick={() => onNavigate('chat', { selectedChatId: chat.id })}
                  >
                    <img
                      src={chat.propertyImage}
                      alt=""
                      className="h-12 w-12 rounded-lg object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{chat.landlordName}</span>
                        {chat.unread > 0 && (
                          <Badge className="bg-blue-600 text-white text-[10px] h-5 w-5 rounded-full p-0 flex items-center justify-center">
                            {chat.unread}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">{chat.lastMessage}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5 truncate">Re: {chat.propertyTitle}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />
                  </div>
                ))}
                {recentChats.length === 0 && (
                  <div className="text-center py-6 text-gray-400 text-sm">
                    No chats yet. Find a property and contact the landlord!
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-5 text-center">
                <Avatar className="h-16 w-16 mx-auto mb-3">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback className="bg-blue-100 text-blue-700 font-bold text-xl">
                    {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <h3 className="font-semibold">{user.name}</h3>
                <p className="text-xs text-gray-500 mb-2">{user.county} County</p>
                <div className="flex justify-center gap-2 mb-3">
                  {user.verified && (
                    <Badge className="bg-green-100 text-green-700">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                  {user.studentId && (
                    <Badge className="bg-blue-100 text-blue-700">Student</Badge>
                  )}
                </div>
                <Button variant="outline" size="sm" className="w-full" onClick={() => onNavigate('profile')}>
                  Edit Profile
                </Button>
              </CardContent>
            </Card>

            {/* Recommended */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  Recommended for You
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recommended.slice(0, 3).map(p => (
                  <div
                    key={p.id}
                    className="flex gap-2 cursor-pointer hover:bg-gray-50 rounded-lg p-1.5 transition-colors"
                    onClick={() => onNavigate('property-detail', { selectedPropertyId: p.id })}
                  >
                    <img src={p.images[0]} alt="" className="h-12 w-12 rounded-lg object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium line-clamp-1">{p.title}</p>
                      <p className="text-xs text-blue-600 font-bold">KSh {p.price.toLocaleString()}</p>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-[10px] text-gray-500">{p.rating}</span>
                      </div>
                    </div>
                  </div>
                ))}
                <Button variant="ghost" size="sm" className="w-full text-blue-600 text-xs" onClick={() => onNavigate('search', { searchParams: { county: user.county } })}>
                  See all in {user.county} →
                </Button>
              </CardContent>
            </Card>

            {/* Nearby Matatu Routes */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Bus className="h-4 w-4 text-teal-600" />
                  Matatu Routes Near You
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {matatuRoutes.filter(r => r.county === user.county).slice(0, 3).map(route => (
                  <div key={route.id} className="flex items-center justify-between text-xs">
                    <div>
                      <span className="font-medium">{route.name}</span>
                      <p className="text-gray-500">{route.start} → {route.end}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-blue-600">KSh {route.costKsh}</span>
                      <p className="text-gray-400">every {route.frequencyMin}min</p>
                    </div>
                  </div>
                ))}
                {matatuRoutes.filter(r => r.county === user.county).length === 0 && (
                  <p className="text-xs text-gray-400">No routes for your county yet</p>
                )}
                <Button variant="ghost" size="sm" className="w-full text-teal-600 text-xs" onClick={() => onNavigate('matatu-routes')}>
                  All Routes →
                </Button>
              </CardContent>
            </Card>

            {/* Safety Tip */}
            <Card className="border-0 shadow-sm border-l-4 border-l-orange-400">
              <CardContent className="p-4">
                <div className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-orange-700 mb-1">Anti-Fraud Reminder</p>
                    <p className="text-xs text-gray-600">
                      Never pay deposits outside the app. Always use M-PESA Till numbers and upload proof. Report suspicious listings immediately.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}