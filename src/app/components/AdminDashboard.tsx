import { useState, useEffect } from 'react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/app/components/ui/avatar';
import { Progress } from '@/app/components/ui/progress';
import { Input } from '@/app/components/ui/input';
import {
  CheckCircle, XCircle, AlertTriangle, Home, Users, Shield,
  LogOut, Search, TrendingUp, Flag, Eye, MapPin, Star,
  Clock, CheckCheck, BarChart3, DollarSign, Filter, RefreshCw
} from 'lucide-react';
import { Page } from '@/app/App';
import { User, mockProperties, Property } from '@/lib/mockData';
import * as api from '@/lib/apiService';
import { toast } from 'sonner';
import { analyzePropertyForFraud, getFraudRiskLevel } from '@/lib/securityService';

interface AdminDashboardProps {
  user: User;
  onNavigate: (page: Page, data?: any) => void;
  onLogout: () => void;
}

// Mock fraud reports
const initialFraudReports = [
  { id: 'FR1', propertyId: '5', reportedBy: 'Grace Mwangi', reason: 'Landlord asked for advance payment via Western Union', status: 'open', date: '2026-03-01', severity: 'high' },
  { id: 'FR2', propertyId: '12', reportedBy: 'Ali Hassan', reason: 'Price is unrealistically low for the area', status: 'open', date: '2026-03-02', severity: 'medium' },
  { id: 'FR3', propertyId: '8', reportedBy: 'Amina Said', reason: 'Property photos appear to be copied from another listing', status: 'reviewing', date: '2026-02-28', severity: 'high' },
  { id: 'FR4', propertyId: '3', reportedBy: 'John Mwenda', reason: 'Landlord phone number not reachable after deposit', status: 'resolved', date: '2026-02-25', severity: 'high' },
];

// Mock users
const mockSystemUsers = [
  { id: 'T1', name: 'Grace Mwangi', email: 'grace@example.com', role: 'tenant', county: 'Mombasa', verified: true, joined: '2026-01-10', status: 'active' },
  { id: 'T2', name: 'Ali Hassan', email: 'ali@example.com', role: 'tenant', county: 'Kilifi', verified: false, joined: '2026-01-15', status: 'active' },
  { id: 'T3', name: 'Amina Said', email: 'amina@example.com', role: 'tenant', county: 'Kwale', verified: true, joined: '2026-01-20', status: 'active' },
  { id: 'T4', name: 'John Mwenda', email: 'john@example.com', role: 'tenant', county: 'Lamu', verified: true, joined: '2026-02-01', status: 'suspended' },
  { id: 'LL1', name: 'Juma Khalifa', email: 'juma@example.com', role: 'landlord', county: 'Mombasa', verified: true, joined: '2025-12-01', status: 'active' },
  { id: 'LL2', name: 'Amina Hassan', email: 'amina.h@example.com', role: 'landlord', county: 'Kilifi', verified: true, joined: '2025-12-15', status: 'active' },
  { id: 'LL3', name: 'Omar Abdalla', email: 'omar@example.com', role: 'landlord', county: 'Kwale', verified: false, joined: '2026-01-05', status: 'pending' },
];

export function AdminDashboard({ user, onNavigate, onLogout }: AdminDashboardProps) {
  const [verifiedProps, setVerifiedProps] = useState<Set<string>>(
    new Set(mockProperties.filter(p => p.verified).map(p => p.id))
  );
  const [rejectedProps, setRejectedProps] = useState<Set<string>>(new Set());
  const [fraudReports, setFraudReports] = useState(initialFraudReports);
  const [searchTerm, setSearchTerm] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [properties, setProperties] = useState<any[]>(mockProperties);
  const [systemUsers, setSystemUsers] = useState<any[]>(mockSystemUsers);
  const [realFraudReports, setRealFraudReports] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    setIsLoadingStats(true);
    // Fetch real stats, properties, users, fraud reports from Supabase
    Promise.all([
      api.getAdminStats().catch(() => null),
      api.getAdminProperties().catch(() => null),
      api.getAdminUsers().catch(() => null),
      api.getAdminFraudReports().catch(() => null),
    ]).then(([statsRes, propsRes, usersRes, fraudRes]) => {
      if (statsRes?.stats) setStats(statsRes.stats);
      if (propsRes?.properties?.length) {
        setProperties(propsRes.properties);
        setVerifiedProps(new Set(propsRes.properties.filter((p: any) => p.verified).map((p: any) => p.id)));
      }
      if (usersRes?.users?.length) setSystemUsers(usersRes.users);
      if (fraudRes?.reports?.length) setRealFraudReports(fraudRes.reports);
    }).finally(() => setIsLoadingStats(false));
  }, []);

  const pendingProperties = properties.filter(p => !verifiedProps.has(p.id) && !rejectedProps.has(p.id));
  const allVerified = properties.filter(p => verifiedProps.has(p.id));
  const allRejected = properties.filter(p => rejectedProps.has(p.id));

  const handleApprove = async (property: any) => {
    try {
      await api.verifyProperty(property.id, true);
      setVerifiedProps(prev => new Set([...prev, property.id]));
      toast.success(`✅ "${property.title}" is now live!`);
    } catch (e) {
      setVerifiedProps(prev => new Set([...prev, property.id]));
      toast.success(`✅ "${property.title}" approved!`);
    }
  };

  const handleReject = async (property: any) => {
    try {
      await api.verifyProperty(property.id, false);
    } catch (e) { /* silent */ }
    setRejectedProps(prev => new Set([...prev, property.id]));
    toast.info(`"${property.title}" rejected`);
  };

  const handleResolveReport = (reportId: string) => {
    setFraudReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'resolved' } : r));
    toast.success('Fraud report resolved');
  };

  const handleEscalateReport = (reportId: string) => {
    setFraudReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'escalated' } : r));
    toast.info('Report escalated to law enforcement');
  };

  const openReports = fraudReports.filter(r => r.status === 'open' || r.status === 'reviewing' || r.status === 'escalated');
  const resolvedReports = fraudReports.filter(r => r.status === 'resolved');

  // County breakdown
  const countyStats = ['Mombasa', 'Kilifi', 'Kwale', 'Lamu'].map(county => ({
    county,
    total: mockProperties.filter(p => p.county === county).length,
    verified: allVerified.filter(p => p.county === county).length,
  }));

  // Filter properties for search
  const filteredPending = pendingProperties.filter(p =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.landlordName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUsers = systemUsers.filter(u =>
    u.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  const verificationRate = Math.round((allVerified.length / mockProperties.length) * 100);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center">
                <Home className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="font-poppins font-bold text-lg">HouseCom Admin</h1>
                <p className="text-xs text-gray-500">Control Panel • {user.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {openReports.length > 0 && (
                <div className="flex items-center gap-1.5 bg-red-50 text-red-600 px-3 py-1.5 rounded-full text-sm font-medium border border-red-200">
                  <AlertTriangle className="h-4 w-4" />
                  {openReports.length} alerts
                </div>
              )}
              <Button variant="ghost" size="sm" onClick={onLogout}>
                <LogOut className="h-4 w-4 mr-1.5" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* KPI Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center">
                  <Home className="h-5 w-5 text-white" />
                </div>
                <Badge className="bg-blue-600 text-white text-xs">{mockProperties.length} total</Badge>
              </div>
              <div className="text-2xl font-bold text-blue-900">{allVerified.length}</div>
              <div className="text-sm text-blue-600 font-medium">Verified Properties</div>
              <Progress value={verificationRate} className="h-1.5 mt-2" />
              <div className="text-xs text-blue-500 mt-1">{verificationRate}% verified</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-orange-50 to-orange-100">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="h-9 w-9 rounded-lg bg-orange-500 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <Badge className="bg-orange-500 text-white text-xs">Pending</Badge>
              </div>
              <div className="text-2xl font-bold text-orange-900">{pendingProperties.length}</div>
              <div className="text-sm text-orange-600 font-medium">Awaiting Review</div>
              <div className="text-xs text-orange-500 mt-2">Avg. 2hr review time</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="h-9 w-9 rounded-lg bg-green-600 flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <Badge className="bg-green-600 text-white text-xs">↑ Active</Badge>
              </div>
              <div className="text-2xl font-bold text-green-900">{systemUsers.length}</div>
              <div className="text-sm text-green-600 font-medium">Total Users</div>
              <div className="text-xs text-green-500 mt-2">{systemUsers.filter(u => u.verified).length} verified accounts</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-red-50 to-red-100">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="h-9 w-9 rounded-lg bg-red-600 flex items-center justify-center">
                  <Flag className="h-5 w-5 text-white" />
                </div>
                <Badge className="bg-red-600 text-white text-xs">Action needed</Badge>
              </div>
              <div className="text-2xl font-bold text-red-900">{openReports.length}</div>
              <div className="text-sm text-red-600 font-medium">Fraud Reports</div>
              <div className="text-xs text-red-500 mt-2">{resolvedReports.length} resolved this week</div>
            </CardContent>
          </Card>
        </div>

        {/* County Breakdown */}
        <Card className="mb-6 border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              County Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {countyStats.map(c => (
                <div key={c.county} className="text-center">
                  <div className="text-lg font-bold">{c.verified}/{c.total}</div>
                  <div className="text-sm text-gray-500">{c.county}</div>
                  <Progress value={(c.verified / c.total) * 100} className="h-2 mt-2" />
                  <div className="text-xs text-gray-400 mt-1">{Math.round((c.verified / c.total) * 100)}% verified</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Main Tabs */}
        <Tabs defaultValue="pending">
          <TabsList className="mb-6 bg-white shadow-sm">
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="h-4 w-4" />
              Pending ({pendingProperties.length})
            </TabsTrigger>
            <TabsTrigger value="fraud" className="gap-2">
              <Flag className="h-4 w-4" />
              Fraud Reports
              {openReports.length > 0 && (
                <Badge className="bg-red-500 text-white ml-1 text-[10px] px-1.5">{openReports.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="properties" className="gap-2">
              <Home className="h-4 w-4" />
              All Properties
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              Users ({systemUsers.length})
            </TabsTrigger>
          </TabsList>

          {/* PENDING VERIFICATIONS */}
          <TabsContent value="pending">
            <div className="flex items-center justify-between mb-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search pending properties..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="text-sm text-gray-500 ml-4">{filteredPending.length} properties to review</div>
            </div>

            {filteredPending.length === 0 ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-12 text-center">
                  <CheckCheck className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="font-semibold text-lg text-gray-900">All caught up!</h3>
                  <p className="text-gray-500 mt-1">No properties pending verification</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredPending.map(property => {
                  const fraudSignals = analyzePropertyForFraud(property);
                  const riskLevel = getFraudRiskLevel(fraudSignals);

                  return (
                    <Card key={property.id} className="border-0 shadow-sm overflow-hidden">
                      <CardContent className="p-0">
                        <div className="flex gap-0">
                          {/* Image */}
                          <div className="relative w-36 shrink-0">
                            <img
                              src={property.images[0]}
                              alt={property.title}
                              className="h-full w-full object-cover"
                              style={{ minHeight: '120px' }}
                            />
                            {riskLevel === 'danger' && (
                              <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
                                ⚠ HIGH RISK
                              </div>
                            )}
                            {riskLevel === 'caution' && (
                              <div className="absolute top-2 left-2 bg-orange-500 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
                                ⚠ CAUTION
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-gray-900 truncate">{property.title}</h4>
                                <div className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
                                  <MapPin className="h-3 w-3" />
                                  {property.location}
                                </div>
                                <div className="flex flex-wrap gap-2 mt-2">
                                  <Badge variant="outline" className="text-xs">KSh {property.price.toLocaleString()}/mo</Badge>
                                  <Badge variant="outline" className="text-xs">{property.county}</Badge>
                                  <Badge variant="outline" className="text-xs">{property.bedrooms} bed</Badge>
                                  <Badge variant="outline" className="text-xs">
                                    <Shield className="h-3 w-3 mr-1" />
                                    Score: {property.security.score}
                                  </Badge>
                                </div>
                                <div className="text-xs text-gray-500 mt-1.5">
                                  Landlord: <span className="font-medium">{property.landlordName}</span>
                                  {property.landlordVerified
                                    ? <span className="text-green-600 ml-1">✓ ID Verified</span>
                                    : <span className="text-red-600 ml-1">⚠ Not Verified</span>
                                  }
                                </div>

                                {/* Fraud signals */}
                                {fraudSignals.length > 0 && (
                                  <div className="mt-2 space-y-1">
                                    {fraudSignals.map((signal, i) => (
                                      <div key={i} className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${
                                        signal.severity === 'high' ? 'bg-red-50 text-red-700' :
                                        signal.severity === 'medium' ? 'bg-orange-50 text-orange-700' :
                                        'bg-yellow-50 text-yellow-700'
                                      }`}>
                                        <AlertTriangle className="h-3 w-3 shrink-0" />
                                        {signal.message}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Actions */}
                              <div className="flex flex-col gap-2 shrink-0">
                                <Button
                                  size="sm"
                                  onClick={() => handleApprove(property)}
                                  className="bg-green-600 hover:bg-green-700 text-white gap-1.5"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleReject(property)}
                                  className="border-red-300 text-red-600 hover:bg-red-50 gap-1.5"
                                >
                                  <XCircle className="h-4 w-4" />
                                  Reject
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => onNavigate('property-detail', { selectedPropertyId: property.id })}
                                  className="text-blue-600 gap-1.5"
                                >
                                  <Eye className="h-4 w-4" />
                                  Preview
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* FRAUD REPORTS */}
          <TabsContent value="fraud">
            <div className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-red-600">{openReports.filter(r => r.severity === 'high').length}</div>
                    <div className="text-sm text-gray-500">High Severity</div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-orange-500">{openReports.filter(r => r.severity === 'medium').length}</div>
                    <div className="text-sm text-gray-500">Medium Severity</div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{resolvedReports.length}</div>
                    <div className="text-sm text-gray-500">Resolved</div>
                  </CardContent>
                </Card>
              </div>

              {fraudReports.map(report => {
                const property = mockProperties.find(p => p.id === report.propertyId);
                return (
                  <Card key={report.id} className={`border-0 shadow-sm ${report.status === 'resolved' ? 'opacity-60' : ''}`}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={
                              report.severity === 'high' ? 'bg-red-500 text-white' :
                              report.severity === 'medium' ? 'bg-orange-500 text-white' :
                              'bg-yellow-500 text-white'
                            }>
                              {report.severity.toUpperCase()} RISK
                            </Badge>
                            <Badge variant="outline" className={
                              report.status === 'resolved' ? 'text-green-600 border-green-300' :
                              report.status === 'escalated' ? 'text-purple-600 border-purple-300' :
                              report.status === 'reviewing' ? 'text-blue-600 border-blue-300' :
                              'text-orange-600 border-orange-300'
                            }>
                              {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                            </Badge>
                            <span className="text-xs text-gray-400">{report.date}</span>
                          </div>
                          <p className="font-medium text-gray-900 mb-1">
                            🏠 {property?.title || `Property #${report.propertyId}`}
                          </p>
                          <p className="text-sm text-gray-600 mb-1">
                            <span className="font-medium">Reported by:</span> {report.reportedBy}
                          </p>
                          <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-2">
                            "{report.reason}"
                          </p>
                        </div>

                        {report.status !== 'resolved' && (
                          <div className="flex flex-col gap-2 shrink-0">
                            <Button
                              size="sm"
                              onClick={() => handleResolveReport(report.id)}
                              className="bg-green-600 hover:bg-green-700 text-white text-xs"
                            >
                              ✓ Resolve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEscalateReport(report.id)}
                              className="text-purple-600 border-purple-300 hover:bg-purple-50 text-xs"
                            >
                              ↑ Escalate
                            </Button>
                            {property && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleReject(property)}
                                className="text-red-600 text-xs"
                              >
                                🚫 Remove Listing
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* ALL PROPERTIES */}
          <TabsContent value="properties">
            <div className="flex items-center gap-4 mb-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search all properties..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2 text-xs text-gray-500">
                <span className="bg-green-50 text-green-700 px-2 py-1 rounded">{allVerified.length} verified</span>
                <span className="bg-orange-50 text-orange-700 px-2 py-1 rounded">{pendingProperties.length} pending</span>
                <span className="bg-red-50 text-red-700 px-2 py-1 rounded">{allRejected.length} rejected</span>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {mockProperties
                .filter(p =>
                  p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  p.location.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .slice(0, 20)
                .map(property => (
                  <Card
                    key={property.id}
                    className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => onNavigate('property-detail', { selectedPropertyId: property.id })}
                  >
                    <CardContent className="p-4 flex gap-3">
                      <img
                        src={property.images[0]}
                        alt=""
                        className="h-16 w-20 rounded-lg object-cover shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{property.title}</h4>
                        <p className="text-xs text-gray-500 truncate">{property.location}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Badge className={
                            verifiedProps.has(property.id) ? 'bg-green-100 text-green-700 text-[10px]' :
                            rejectedProps.has(property.id) ? 'bg-red-100 text-red-700 text-[10px]' :
                            'bg-orange-100 text-orange-700 text-[10px]'
                          }>
                            {verifiedProps.has(property.id) ? '✓ Verified' :
                             rejectedProps.has(property.id) ? '✗ Rejected' :
                             '⏳ Pending'}
                          </Badge>
                          <span className="text-xs text-gray-500">KSh {property.price.toLocaleString()}</span>
                          <div className="flex items-center gap-0.5">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs">{property.rating}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>

          {/* USERS */}
          <TabsContent value="users">
            <div className="relative flex-1 max-w-sm mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users..."
                className="pl-9"
                value={userSearchTerm}
                onChange={e => setUserSearchTerm(e.target.value)}
              />
            </div>
            <div className="space-y-3">
              {filteredUsers.map(u => (
                <Card key={u.id} className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">
                            {u.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{u.name}</span>
                            {u.verified && <CheckCircle className="h-3.5 w-3.5 text-green-500" />}
                          </div>
                          <p className="text-xs text-gray-500">{u.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-[10px] capitalize">{u.role}</Badge>
                            <span className="text-xs text-gray-400">{u.county}</span>
                            <span className="text-xs text-gray-400">Joined: {u.joined}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge className={
                          u.status === 'active' ? 'bg-green-100 text-green-700' :
                          u.status === 'suspended' ? 'bg-red-100 text-red-700' :
                          'bg-orange-100 text-orange-700'
                        }>
                          {u.status}
                        </Badge>
                        {u.status === 'active' ? (
                          <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50 text-xs h-7">
                            Suspend
                          </Button>
                        ) : u.status === 'suspended' ? (
                          <Button size="sm" variant="ghost" className="text-green-600 hover:bg-green-50 text-xs h-7">
                            Restore
                          </Button>
                        ) : (
                          <Button size="sm" variant="ghost" className="text-blue-600 hover:bg-blue-50 text-xs h-7">
                            Verify
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}