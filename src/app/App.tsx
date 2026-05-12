import { useState, useEffect } from 'react';
import { Toaster } from 'sonner';
import { LandingPage } from '@/app/components/LandingPage';
import { SignupPage } from '@/app/components/SignupPage';
import { LoginPage } from '@/app/components/LoginPage';
import { OTPVerifyPage } from '@/app/components/OTPVerifyPage';
import { OAuthProfileSetupPage } from '@/app/components/OAuthProfileSetupPage';
import { TenantDashboard } from '@/app/components/TenantDashboard';
import { LandlordDashboard } from '@/app/components/LandlordDashboard';
import { AdminDashboard } from '@/app/components/AdminDashboard';
import { SearchPage } from '@/app/components/SearchPage';
import { PropertyDetailPage } from '@/app/components/PropertyDetailPage';
import { ChatPage } from '@/app/components/ChatPage';
import { MatatuRoutesPage } from '@/app/components/MatatuRoutesPage';
import { PaymentPage } from '@/app/components/PaymentPage';
import { AddPropertyPage } from '@/app/components/AddPropertyPage';
import { ProfilePage } from '@/app/components/ProfilePage';
import { AIChatbot } from '@/app/components/AIChatbot';
import { authService, SignupData } from '@/lib/authService';
import { supabase } from '@/lib/supabaseClient';
import { User } from '@/lib/mockData';

export type Page =
  | 'landing' | 'signup' | 'login' | 'otp-verify' | 'oauth-profile-setup'
  | 'tenant-dashboard' | 'landlord-dashboard' | 'admin-dashboard'
  | 'search' | 'property-detail' | 'chat' | 'matatu-routes'
  | 'payment' | 'add-property' | 'profile';

export interface AppState {
  currentPage: Page;
  currentUser: User | null;
  selectedPropertyId?: string;
  selectedChatId?: string;
  searchParams?: { county?: string; minPrice?: number; maxPrice?: number; bedrooms?: number; };
  pendingUser?: any;
}

export default function App() {
  const [appState, setAppState] = useState<AppState>({ currentPage: 'landing', currentUser: null });
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Initialize auth state
    const initializeAuth = async () => {
      try {
        // Check for existing session (persisted in localStorage)
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          const user = await authService.getCurrentUser();
          if (user) {
            let nextPage: Page;
            if (!user.role) {
              // Check if user has an authentication provider (OAuth indicator)
              const isOAuthUser = data.session.user?.user_metadata?.provider !== 'email' || 
                                 data.session.user?.app_metadata?.providers?.length > 0;
              nextPage = isOAuthUser ? 'oauth-profile-setup' : 'login';
            } else {
              nextPage = user.role === 'tenant' ? 'tenant-dashboard' :
                        user.role === 'landlord' ? 'landlord-dashboard' :
                        user.role === 'admin' ? 'admin-dashboard' :
                        'login';
            }
            setAppState(prev => ({
              ...prev,
              currentUser: user,
              currentPage: nextPage,
            }));
          }
        }
      } catch (e) {
        console.log('Session restore error:', e);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeAuth();

    // Listen for auth state changes (login, logout, OAuth redirect)
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) {
        try {
          const user = await authService.getCurrentUser();
          if (user) {
            // If user has no role, check if they came from OAuth
            // OAuth users should go to oauth-profile-setup, email users to login
            let nextPage: Page;
            if (!user.role) {
              // Check if user has an authentication provider (OAuth indicator)
              const isOAuthUser = session.user?.user_metadata?.provider !== 'email' || 
                                 session.user?.app_metadata?.providers?.length > 0;
              nextPage = isOAuthUser ? 'oauth-profile-setup' : 'login';
            } else {
              nextPage = user.role === 'tenant' ? 'tenant-dashboard' :
                        user.role === 'landlord' ? 'landlord-dashboard' :
                        user.role === 'admin' ? 'admin-dashboard' :
                        'login';
            }
            setAppState(prev => ({
              ...prev,
              currentUser: user,
              currentPage: nextPage,
            }));
          }
        } catch (e) {
          console.log('Auth change error:', e);
        }
      } else if (event === 'SIGNED_OUT') {
        // User clicked logout - clear everything and go to landing page
        setAppState({ currentPage: 'landing', currentUser: null });
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const navigateTo = (page: Page, data?: Partial<AppState>) => {
    setAppState(prev => ({ ...prev, currentPage: page, ...data }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = async () => {
    await authService.logout();
    setAppState({ currentPage: 'landing', currentUser: null });
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-teal-800 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="h-16 w-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-3xl">🏠</span>
          </div>
          <h1 className="font-bold text-2xl mb-1">HouseCom</h1>
          <p className="text-blue-200 text-sm">Loading Coastal Rentals...</p>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    switch (appState.currentPage) {
      case 'landing':
        return <LandingPage onNavigate={navigateTo} />;
      case 'signup':
        return <SignupPage onNavigate={navigateTo} currentUser={appState.currentUser} />;
      case 'login':
        return <LoginPage onNavigate={navigateTo} currentUser={appState.currentUser} />;
      case 'otp-verify':
        return <OTPVerifyPage onNavigate={navigateTo} pendingUser={appState.pendingUser} />;
      case 'oauth-profile-setup':
        if (!appState.currentUser) return <LandingPage onNavigate={navigateTo} />;
        return <OAuthProfileSetupPage onNavigate={navigateTo} currentUser={appState.currentUser} />;
      case 'tenant-dashboard':
        if (!appState.currentUser) return <LandingPage onNavigate={navigateTo} />;
        return <TenantDashboard user={appState.currentUser} onNavigate={navigateTo} onLogout={handleLogout} />;
      case 'landlord-dashboard':
        if (!appState.currentUser) return <LandingPage onNavigate={navigateTo} />;
        return <LandlordDashboard user={appState.currentUser} onNavigate={navigateTo} onLogout={handleLogout} />;
      case 'admin-dashboard':
        if (!appState.currentUser) return <LandingPage onNavigate={navigateTo} />;
        return <AdminDashboard user={appState.currentUser} onNavigate={navigateTo} onLogout={handleLogout} />;
      case 'search':
        return <SearchPage user={appState.currentUser} searchParams={appState.searchParams} onNavigate={navigateTo} onLogout={handleLogout} />;
      case 'property-detail':
        return <PropertyDetailPage user={appState.currentUser} propertyId={appState.selectedPropertyId!} onNavigate={navigateTo} onLogout={handleLogout} />;
      case 'chat':
        return <ChatPage user={appState.currentUser!} chatId={appState.selectedChatId} propertyId={appState.selectedPropertyId} onNavigate={navigateTo} onLogout={handleLogout} />;
      case 'matatu-routes':
        return <MatatuRoutesPage user={appState.currentUser} onNavigate={navigateTo} onLogout={handleLogout} />;
      case 'payment':
        return <PaymentPage user={appState.currentUser!} propertyId={appState.selectedPropertyId!} onNavigate={navigateTo} onLogout={handleLogout} />;
      case 'add-property':
        return <AddPropertyPage user={appState.currentUser!} onNavigate={navigateTo} onLogout={handleLogout} />;
      case 'profile':
        return <ProfilePage user={appState.currentUser!} onNavigate={navigateTo} onLogout={handleLogout} />;
      default:
        return <LandingPage onNavigate={navigateTo} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" richColors />
      {renderPage()}
      <AIChatbot onNavigate={navigateTo} />
    </div>
  );
}
