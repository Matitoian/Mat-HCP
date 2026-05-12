import { useState, useEffect } from 'react';
import React from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle, Tabs, TabsContent, TabsList, TabsTrigger, Badge, Avatar, AvatarFallback, AvatarImage, Progress } from '@/app/components/ui';
import { Plus, Home, MessageSquare, LogOut, TrendingUp, Eye,
  Star, MapPin, CheckCircle, User as UserIcon, Bell,
  DollarSign, BarChart3, Clock, Shield, Phone, ChevronRight
} from 'lucide-react';
import { Page } from '@/app/App';
import { User, mockProperties, mockChats } from '@/lib/mockData';
import * as api from '@/lib/apiService';
import { toast } from 'sonner';

interface LandlordDashboardProps {
  user: User;
  onNavigate: (page: Page, data?: any) => void;
  onLogout: () => void;
}

// Mock monthly revenue data
const revenueData = [
  { month: 'Oct', amount: 38000 },
  { month: 'Nov', amount: 42000 },
  { month: 'Dec', amount: 45000 },
  { month: 'Jan', amount: 48000 },
  { month: 'Feb', amount: 44000 },
  { month: 'Mar', amount: 51000 },
];

// Mock tenant inquiries
const mockInquiries = [
  { id: '1', name: 'Grace Mwangi', phone: '+254712345678', property: '1BD Apartment Tudor', time: '2hr ago', status: 'new' },
  { id: '2', name: 'Ali Hassan', phone: '+254723456789', property: 'Studio Mikindani', time: '5hr ago', status: 'replied' },
  { id: '3', name: 'Amina Said', phone: '+254734567890', property: '2BD Apartment Changamwe', time: '1d ago', status: 'new' },
];

// Mock notifications
const mockNotifications = [
  { id: '1', text: 'New inquiry on Tudor Apartment', type: 'inquiry', time: '2hr ago', read: false },
  { id: '2', text: 'Payment received - KSh 8,500 from Grace Mwangi', type: 'payment', time: '1d ago', read: false },
  { id: '3', text: 'Your property "Studio Mikindani" has been verified ✓', type: 'verify', time: '2d ago', read: true },
  { id: '4', text: 'New 5-star review on Tudor Apartment', type: 'review', time: '3d ago', read: true },
];

const [tenants, setTenants] = useState<{ id: string; rentPaid: boolean }[]>([]);
const [selectedTenant, setSelectedTenant] = useState<{ id: string } | null>(null);
const [message, setMessage] = useState<string>('');
const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
const [adminMessage, setAdminMessage] = useState<string>('');
const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);

export function LandlordDashboard({ user, onNavigate, onLogout }: LandlordDashboardProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>(mockNotifications);
  const [myProperties, setMyProperties] = useState<any[]>(mockProperties.filter(p => p.landlordId === 'LL1').slice(0, 5));
  const [payments, setPayments] = useState<any[]>([]);
  const [chats, setChats] = useState<any[]>(mockChats);

  useEffect(() => {
    // Fetch landlord's properties from Supabase
    api.getProperties({ landlordId: user.id })
      .then(res => { if (res.properties?.length) setMyProperties(res.properties); })
      .catch(() => setMyProperties(mockProperties.filter(p => p.landlordId === 'LL1').slice(0, 5)));

    // Fetch payments received
    api.getPayments()
      .then(res => { if (res.payments) setPayments(res.payments); })
      .catch(() => {});

    // Fetch notifications
    api.getNotifications()
      .then(res => { if (res.notifications) setNotifications(res.notifications); })
      .catch(() => {});

    // Fetch chats
    api.getChats()
      .then(res => { if (res.chats?.length) setChats(res.chats); })
      .catch(() => {});
  }, [user.id]);

  const unreadNotifs = notifications.filter(n => !n.read).length;
  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));

  const totalRevenue = payments.reduce((s, p) => s + (p.amount || 0), 0);
  const verifiedCount = myProperties.filter(p => p.verified).length;
  const pendingCount = myProperties.filter(p => !p.verified).length;
  const totalViews = 1847;
  const avgRating = myProperties.reduce((sum, p) => sum + p.rating, 0) / myProperties.length;

  const maxRevenue = Math.max(...revenueData.map(d => d.amount));

  const loadTenants = async () => {
    const data = await api.fetchTenants();
    setTenants(data);
  };
  loadTenants();

  const handleRentStatusChange = async (tenantId: string, status: boolean) => {
    await api.updateRentStatus(tenantId, status);
    setTenants((prev) =>
      prev.map((tenant) =>
        tenant.id === tenantId ? { ...tenant, rentPaid: status } : tenant
      )
    );
  };

  const handleSendMessage = async () => {
    if (selectedTenant && message) {
      await api.sendMessage(selectedTenant.id, message);
      setMessage('');
      setIsModalOpen(false);
    }
  };

  const handleSendAdminMessage = async () => {
    if (adminMessage) {
      await api.sendMessageToAdmin(adminMessage);
      setAdminMessage('');
      setIsAdminModalOpen(false);
      toast.success('Message sent to admin!');
    }
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
                <p className="text-xs text-gray-500">Landlord Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => onNavigate('add-property')}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 hidden md:flex"
              >
                <Plus className="h-4 w-4" />
                Add Property
              </Button>

              {/* Notifications */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setNotifOpen(!notifOpen)}
                  className="relative"
                >
                  <Bell className="h-5 w-5" />
                  {unreadNotifs > 0 && (
                    <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold">
                      {unreadNotifs}
                    </span>
                  )}
                </Button>

                {/* Notification dropdown */}
                {notifOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border z-50">
                    <div className="flex items-center justify-between p-3 border-b">
                      <h4 className="font-semibold text-sm">Notifications</h4>
                      <button onClick={markAllRead} className="text-xs text-blue-600 hover:underline">
                        Mark all read
                      </button>
                    </div>
                    <div className="divide-y max-h-72 overflow-y-auto">
                      {notifications.map(n => (
                        <div key={n.id} className={`p-3 flex gap-2 ${!n.read ? 'bg-blue-50' : ''}`}>
                          <div className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${
                            n.type === 'payment' ? 'bg-green-500' :
                            n.type === 'verify' ? 'bg-blue-500' :
                            n.type === 'review' ? 'bg-yellow-500' :
                            'bg-orange-500'
                          }`} />
                          <div className="flex-1">
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
              <h2 className="font-poppins font-bold text-xl">Karibu, {user.name}! 👋</h2>
              <p className="text-blue-100 text-sm mt-1">
                You have {mockInquiries.filter(i => i.status === 'new').length} new inquiries and {unreadNotifs} unread notifications
              </p>
            </div>
            <Avatar className="h-14 w-14 border-2 border-white/40">
              <AvatarImage src={user.avatar} />
              <AvatarFallback className="bg-white/20 text-white font-bold">
                {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* KPI Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Home className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              <div className="text-2xl font-bold">{myProperties.length}</div>
              <div className="text-xs text-gray-500">Properties Listed</div>
              <div className="text-xs text-green-600 mt-1">
                {verifiedCount} verified
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Eye className="h-4 w-4 text-purple-600" />
                </div>
              </div>
              <div className="text-2xl font-bold">{totalViews.toLocaleString()}</div>
              <div className="text-xs text-gray-500">Total Views</div>
              <div className="text-xs text-green-600 mt-1">↑ +23% this month</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-green-600" />
                </div>
              </div>
              <div className="text-2xl font-bold">51k</div>
              <div className="text-xs text-gray-500">Est. Revenue (Mar)</div>
              <div className="text-xs text-green-600 mt-1">KSh {totalRevenue.toLocaleString()} total</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-lg bg-yellow-100 flex items-center justify-center">
                  <Star className="h-4 w-4 text-yellow-500" />
                </div>
              </div>
              <div className="text-2xl font-bold">{avgRating.toFixed(1)}</div>
              <div className="text-xs text-gray-500">Average Rating</div>
              <div className="flex mt-1">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star key={s} className={`h-3 w-3 ${s <= Math.round(avgRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Main Content */}
          <div className="lg:col-span-2 space-y-6">

            {/* Revenue Chart (simple bars) */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  Revenue Trend (KSh)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-3 h-28">
                  {revenueData.map(d => (
                    <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[10px] text-gray-500 font-medium">
                        {(d.amount / 1000).toFixed(0)}k
                      </span>
                      <div
                        className={`w-full rounded-t-lg bg-gradient-to-t from-blue-600 to-teal-500 transition-all hover:from-blue-700 hover:to-teal-600 dynamic-height-${Math.round((d.amount / maxRevenue) * 80)}`}
></div>
                      <span className="text-[10px] text-gray-400">{d.month}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t text-sm">
                  <span className="text-gray-500">Mar is your best month 🎉</span>
                  <span className="font-semibold text-green-600">↑ 13% vs Feb</span>
                </div>
              </CardContent>
            </Card>

            {/* My Properties */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Home className="h-5 w-5 text-blue-600" />
                  My Properties
                </CardTitle>
                <Button
                  size="sm"
                  onClick={() => onNavigate('add-property')}
                  className="bg-blue-600 hover:bg-blue-700 text-white gap-1"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add New
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {myProperties.map(property => (
                  <div
                    key={property.id}
                    className="flex gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors border"
                    onClick={() => onNavigate('property-detail', { selectedPropertyId: property.id })}
                  >
                    <img
                      src={property.images[0]}
                      alt=""
                      className="h-16 w-20 rounded-lg object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-medium text-sm truncate">{property.title}</h4>
                        <Badge className={property.verified ? 'bg-green-100 text-green-700 shrink-0' : 'bg-orange-100 text-orange-700 shrink-0'} variant="secondary">
                          {property.verified ? '✓ Live' : '⏳ Review'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                        <MapPin className="h-3 w-3" />
                        {property.location}
                      </div>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-sm font-bold text-blue-600">KSh {property.price.toLocaleString()}/mo</span>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs">{property.rating} ({property.reviews})</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-300 self-center shrink-0" />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recent Inquiries */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                  Recent Inquiries
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {mockInquiries.map(inquiry => (
                  <div key={inquiry.id} className="flex items-center justify-between p-3 rounded-xl border hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-bold">
                          {inquiry.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{inquiry.name}</span>
                          {inquiry.status === 'new' && (
                            <span className="h-2 w-2 bg-blue-500 rounded-full" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500">{inquiry.property}</p>
                        <p className="text-[10px] text-gray-400">{inquiry.time}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant={inquiry.status === 'new' ? 'default' : 'outline'}
                      onClick={() => onNavigate('chat')}
                      className="text-xs"
                    >
                      {inquiry.status === 'new' ? 'Reply' : 'View'}
                    </Button>
                  </div>
                ))}
                <Button
                  variant="ghost"
                  className="w-full text-blue-600 text-sm"
                  onClick={() => onNavigate('chat')}
                >
                  View All Chats →
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Profile Card */}
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
                      Verified Landlord
                    </Badge>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2 text-center pt-3 border-t">
                  <div>
                    <div className="font-bold text-blue-600">{myProperties.length}</div>
                    <div className="text-[10px] text-gray-500">Properties</div>
                  </div>
                  <div>
                    <div className="font-bold text-green-600">{avgRating.toFixed(1)}</div>
                    <div className="text-[10px] text-gray-500">Rating</div>
                  </div>
                  <div>
                    <div className="font-bold text-purple-600">51k</div>
                    <div className="text-[10px] text-gray-500">Rev/Mo</div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-3"
                  onClick={() => onNavigate('profile')}
                >
                  Edit Profile
                </Button>
              </CardContent>
            </Card>

            {/* Security Summary */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-600" />
                  Property Security Scores
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {myProperties.slice(0, 4).map(p => (
                  <div key={p.id}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="truncate text-gray-600 custom-max-width">
                        {p.title.split(' ').slice(0, 3).join(' ')}
                      </span>
                      <span className="font-semibold">{p.security.score}/5</span>
                    </div>
                    <Progress value={(p.security.score / 5) * 100} className="h-1.5" />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { label: 'Add New Property', icon: Plus, action: () => onNavigate('add-property'), color: 'text-blue-600' },
                  { label: 'View Chats', icon: MessageSquare, action: () => onNavigate('chat'), color: 'text-green-600' },
                  { label: 'Matatu Routes', icon: TrendingUp, action: () => onNavigate('matatu-routes'), color: 'text-purple-600' },
                  { label: 'My Profile', icon: UserIcon, action: () => onNavigate('profile'), color: 'text-orange-600' },
                ].map(item => (
                  <button
                    key={item.label}
                    onClick={item.action}
                    className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className={`h-7 w-7 rounded-lg bg-gray-100 flex items-center justify-center ${item.color}`}>
                      <item.icon className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">{item.label}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-gray-300 ml-auto" />
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Mobile FAB */}
      <div className="fixed bottom-24 right-6 md:hidden">
        <Button
          onClick={() => onNavigate('add-property')}
          size="lg"
          className="h-14 w-14 rounded-full bg-blue-600 shadow-xl"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>

      {/* Message Admin */}
      <div className="mt-4">
        <Button
          onClick={() => setIsAdminModalOpen(true)}
          className="bg-teal-600 hover:bg-teal-700 text-white"
        >
          Message Admin
        </Button>

        {isAdminModalOpen && (
          <div className="modal">
            <h2>Message Admin</h2>
            <textarea
              value={adminMessage}
              onChange={(e) => setAdminMessage(e.target.value)}
              placeholder="Write your message here..."
              className="w-full border rounded p-2"
            />
            <div className="flex justify-end gap-2 mt-2">
              <Button onClick={handleSendAdminMessage} className="bg-blue-600 text-white">
                Send
              </Button>
              <Button onClick={() => setIsAdminModalOpen(false)} className="bg-gray-300">
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}