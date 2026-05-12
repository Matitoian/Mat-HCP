// HouseCom Logo Usage Examples & Integration Guide

// ============================================
// 1. BASIC LOGO DISPLAY
// ============================================

import { Logo } from '@/app/components/Logo';

// Primary logo (light background)
<Logo variant="primary" size="md" />

// Dark mode logo
<Logo variant="dark" size="md" />

// Icon only (no text)
<Logo variant="icon" size="sm" />

// Horizontal layout
<Logo variant="horizontal" size="md" />

// ============================================
// 2. NAVIGATION HEADER COMPONENT
// ============================================

import { LogoLink } from '@/app/components/Logo';
import { Button } from '@/app/components/ui/button';

export function Header() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-lg bg-white/80 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo with text */}
        <LogoLink variant="icon" redirectTo="/" />

        {/* Navigation links */}
        <nav className="hidden md:flex gap-8">
          <a href="/search" className="link-brand">Search Homes</a>
          <a href="/post" className="link-brand">Post Property</a>
          <a href="/about" className="link-brand">About</a>
        </nav>

        {/* Auth buttons */}
        <div className="flex gap-2">
          <Button variant="outline">Login</Button>
          <Button className="btn-brand">Sign Up</Button>
        </div>
      </div>
    </header>
  );
}

// ============================================
// 3. HERO SECTION
// ============================================

export function Heroes() {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center gap-8 bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Large primary logo */}
      <Logo variant="primary" size="xl" />

      <h1 className="text-5xl font-bold text-center text-gradient">
        Find Your Perfect Home
      </h1>
      <p className="text-xl text-gray-600 max-w-2xl text-center">
        Connect with verified landlords and discover your ideal rental property
      </p>

      <button className="btn-brand">Explore Properties</button>
    </section>
  );
}

// ============================================
// 4. LOADING STATE
// ============================================

import { LogoLoadingSpinner } from '@/app/components/Logo';

export function PropertyListWithLoading({ loading }: { loading: boolean }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LogoLoadingSpinner />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Properties grid */}
    </div>
  );
}

// ============================================
// 5. FOOTER
// ============================================

export function Footer() {
  return (
    <footer className="bg-dark text-white py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-4 gap-8 mb-8">
          {/* Logo & brand info */}
          <div className="col-span-1">
            <Logo variant="dark" size="md" />
            <p className="mt-4 text-gray-400">
              Find Your Perfect Home
            </p>
          </div>

          {/* Links columns */}
          <div>
            <h4 className="font-bold mb-4">Company</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-300 hover:text-white">About</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white">Blog</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white">Careers</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-8 text-center text-gray-400">
          <p>&copy; 2026 HouseCom. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

// ============================================
// 6. CARD COMPONENT WITH BRAND STYLING
// ============================================

import { Card, CardContent, CardHeader } from '@/app/components/ui/card';

export function PropertyCard({ property }: { property: any }) {
  return (
    <Card className="card-brand hover:glow-brand transition-all">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Logo variant="icon" size="sm" />
          <h3 className="font-bold text-brand-blue">{property.title}</h3>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 mb-4">{property.description}</p>
        <button className="btn-brand w-full">View Details</button>
      </CardContent>
    </Card>
  );
}

// ============================================
// 7. BRAND GRADIENT USAGE
// ============================================

export function GreatComponent() {
  return (
    <div className="space-y-4">
      {/* Text gradient */}
      <h1 className="text-gradient text-4xl font-bold">
        Welcome to HouseCom
      </h1>

      {/* Background gradient */}
      <div className="bg-gradient-brand rounded-lg text-white p-8">
        <h2>Premium Properties</h2>
        <p>Discover verified listings</p>
      </div>

      {/* Gradient buttons */}
      <button className="btn-brand">Get Started</button>

      {/* Brand links */}
      <a href="/learn-more" className="link-brand">
        Learn more →
      </a>
    </div>
  );
}

// ============================================
// 8. RESPONSIVE LOGO SIZING
// ============================================

export function ResponsiveLogo() {
  return (
    <div>
      {/* Mobile (32px) */}
      <div className="md:hidden">
        <Logo variant="icon" size="sm" />
      </div>

      {/* Tablet (48px) */}
      <div className="hidden md:block lg:hidden">
        <Logo variant="icon" size="md" />
      </div>

      {/* Desktop (96px) */}
      <div className="hidden lg:block">
        <Logo variant="primary" size="lg" />
      </div>
    </div>
  );
}

// ============================================
// 9. DARK MODE LOGO SWITCHER
// ============================================

import { useEffect, useState } from 'react';

export function SmartLogo() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check system preference or user setting
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDark(prefersDark);
  }, []);

  return (
    <Logo 
      variant={isDark ? 'dark' : 'primary'} 
      size="md"
    />
  );
}

// ============================================
// 10. LOGO IN AUTHENTICATION FLOW
// ============================================

export function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 to-blue-50">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        {/* Logo at top */}
        <div className="flex justify-center mb-8">
          <Logo variant="primary" size="lg" />
        </div>

        <h1 className="text-2xl font-bold text-center text-brand-blue mb-2">
          Create Account
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Join thousands finding their perfect home
        </p>

        {/* Form */}
        <form className="space-y-4">
          {/* Form fields here */}
          <button type="submit" className="btn-brand w-full">
            Sign Up
          </button>
        </form>

        {/* Link to login */}
        <p className="text-center mt-4">
          Already have an account?{' '}
          <a href="/login" className="link-brand font-semibold">
            Login
          </a>
        </p>
      </div>
    </div>
  );
}

// ============================================
// 11. BRAND COLOR UTILITIES IN CSS
// ============================================

// Import in your CSS files:
// @import '@/styles/brand.css';

// Usage examples:
// <div className="text-gradient">Gradient text</div>
// <button className="btn-brand">Click me</button>
// <div className="card-brand">Card with brand styling</div>
// <div className="glow-brand">Glowing element</div>

// ============================================
// 12. DYNAMIC LOGO SIZE
// ============================================

export function DynamicLogo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const variantMap = {
    sm: 'icon',
    md: 'icon',
    lg: 'primary',
    xl: 'primary',
  } as const;

  return (
    <Logo 
      variant={variantMap[size] as any}
      size={size}
      className="rounded-lg shadow-md"
    />
  );
}

// ============================================
// 13. LOGO WITH ANIMATION
// ============================================

export function AnimatedLogo() {
  return (
    <div className="animate-pulse-brand">
      <Logo variant="primary" size="md" />
    </div>
  );
}

// ============================================
// 14. SOCIAL MEDIA USAGE
// ============================================

export function SocialLinks() {
  return (
    <div className="flex gap-6 items-center">
      {/* Facebook */}
      <a href="https://facebook.com/housecom" title="Visit our Facebook">
        <Logo variant="icon" size="sm" className="opacity-70 hover:opacity-100" />
      </a>

      {/* Twitter */}
      <a href="https://twitter.com/housecommunity" title="Follow us on Twitter">
        <Logo variant="icon" size="sm" className="opacity-70 hover:opacity-100" />
      </a>

      {/* Instagram */}
      <a href="https://instagram.com/housecomunity" title="Follow us on Instagram">
        <Logo variant="icon" size="sm" className="opacity-70 hover:opacity-100" />
      </a>
    </div>
  );
}

// ============================================
// 15. PRINT STYLES
// ============================================

// In your print CSS:
/*
@media print {
  .btn-brand {
    border: 2px solid #000;
    background: none;
    color: #000;
  }

  .text-gradient {
    color: #000;
  }

  .bg-gradient-brand {
    background: none;
    border: 2px solid #000;
  }
}
*/

// ============================================
// INTEGRATION CHECKLIST
// ============================================

/**
 * Integration Steps:
 * 
 * 1. ✅ Add Logo component to header/footer
 * 2. ✅ Import brandingConstants in components
 * 3. ✅ Apply brand.css globally
 * 4. ✅ Use LogoLink for navigation
 * 5. ✅ Use LogoLoadingSpinner for loading states
 * 6. ✅ Apply card-brand class to cards
 * 7. ✅ Use text-gradient for headings
 * 8. ✅ Use btn-brand for primary buttons
 * 9. ✅ Use link-brand for navigation links
 * 10. ✅ Test dark mode with logo-dark variant
 */

export const INTEGRATION_CHECKLIST = [
  'Import Logo component',
  'Add Logo to header',
  'Add Logo to footer',
  'Import brand.css',
  'Apply btn-brand to buttons',
  'Apply card-brand to cards',
  'Apply text-gradient to headings',
  'Use responsive Logo sizing',
  'Test dark mode',
  'Verify animations',
];
