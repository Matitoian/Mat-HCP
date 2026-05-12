import { useState, useEffect } from 'react';
import { ArrowLeft, Camera, Edit, Save, Trash2 } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Page } from '@/app/App';
import { User } from '@/lib/mockData';
import { authService } from '@/lib/authService';
import * as api from '@/lib/apiService';
import { toast } from 'sonner';

interface ProfilePageProps {
  user: User;
  onNavigate: (page: Page, data?: any) => void;
  onLogout: () => void;
}

export function ProfilePage({ user, onNavigate, onLogout }: ProfilePageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone,
    county: user.county
  });
  const [payments, setPayments] = useState<any[]>([]);

  useEffect(() => {
    api.getPayments()
      .then(res => { if (res.payments) setPayments(res.payments); })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    const response = await authService.updateProfile(formData);
    if (response.success) {
      toast.success('Profile updated successfully ✅');
      setIsEditing(false);
    } else {
      toast.error(response.message || 'Update failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => onNavigate(user.role === 'tenant' ? 'tenant-dashboard' : user.role === 'landlord' ? 'landlord-dashboard' : 'admin-dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <Card>
            <CardContent className="p-6 text-center">
              <div className="relative inline-block mb-4">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback className="text-3xl">{user.name[0]}</AvatarFallback>
                </Avatar>
                <button className="absolute bottom-0 right-0 h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg">
                  <Camera className="h-5 w-5" />
                </button>
              </div>
              <h2 className="text-2xl font-bold mb-1">{user.name}</h2>
              <p className="text-gray-500 mb-2">{user.email}</p>
              <div className="flex items-center justify-center gap-2 mb-4">
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium capitalize">
                  {user.role}
                </span>
                {user.verified && (
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                    Verified
                  </span>
                )}
              </div>
              <Button variant="outline" className="w-full text-red-600" onClick={onLogout}>
                Logout
              </Button>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Profile Settings</CardTitle>
                {!isEditing ? (
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSave}>
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="personal">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="personal">Personal Info</TabsTrigger>
                  <TabsTrigger value="preferences">Preferences</TabsTrigger>
                </TabsList>

                <TabsContent value="personal" className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>
                  {user.studentId && (
                    <div>
                      <Label>Student ID</Label>
                      <Input value={user.studentId} disabled />
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="preferences" className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="county">Preferred County</Label>
                    <Select
                      value={formData.county}
                      onValueChange={(value) => setFormData({ ...formData, county: value })}
                      disabled={!isEditing}
                    >
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

                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-2">Notifications</h4>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" defaultChecked />
                        <span className="text-sm">Email notifications for new properties</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" defaultChecked />
                        <span className="text-sm">SMS alerts for price drops</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" />
                        <span className="text-sm">Marketing communications</span>
                      </label>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="mt-6 pt-6 border-t">
                <Button variant="destructive" className="w-full">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}