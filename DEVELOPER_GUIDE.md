# HouseCom - Developer Guide & Improvement Roadmap

## 🏗️ Project Architecture

### Frontend Structure
```
src/
├── app/
│   ├── components/        # React components (pages + UI)
│   └── hooks/             # Custom React hooks
├── lib/
│   ├── apiService.ts      # API client
│   ├── authService.ts     # Authentication
│   ├── shareService.ts    # Social sharing
│   ├── errorHandler.ts    # Error handling
│   ├── cacheManager.ts    # Caching layer
│   ├── securityService.ts # Security utilities
│   └── mockData.ts        # Demo/test data
├── styles/
│   ├── index.css          # Global styles
│   ├── theme.css          # Theme variables
│   ├── tailwind.css       # Tailwind imports
│   └── fonts.css          # Font imports
└── main.tsx              # App entry point
```

### Backend Architecture
```
backend/
├── api/                   # API endpoints
│   ├── auth/              # Authentication
│   ├── properties/        # Property management
│   ├── chat/              # Messaging
│   ├── payments/          # M-PESA
│   ├── admin/             # Admin operations
│   └── fraud/             # Fraud detection
├── config/                # Configuration
├── database/              # Schema & migrations
├── middleware/            # Auth middleware
├── models/                # Data models
└── utils/                 # Utilities
```

## 📚 Key Technologies

### Frontend
- **React 18.3.1** - UI library
- **TypeScript** - Type safety
- **Vite 6.3** - Build tool
- **Tailwind CSS 4.1** - Styling
- **Radix UI** - Accessible components
- **React Hook Form** - Form management
- **Sonner** - Toast notifications
- **Leaflet** - Maps
- **Recharts** - Charts

### Backend
- **Supabase** - Backend-as-a-Service
- **PostgreSQL** - Database
- **JWT** - Authentication
- **Hono** - Edge functions
- **M-PESA API** - Payments

## 🚀 Development Workflow

### Setup
```bash
# Clone repository
git clone <repo-url>
cd housecom

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Add your credentials
# VITE_SUPABASE_URL=
# VITE_SUPABASE_ANON_KEY=
# VITE_PROJECT_ID=
# VITE_MPESA_TOKEN=
# VITE_GOOGLE_CLIENT_ID=

# Start development server
npm run dev
```

### Code Style
- **Naming:** camelCase for functions, PascalCase for components
- **Comments:** Use JSDoc for functions
- **Imports:** Group by external, internal, then styles
- **Line length:** Max 100 characters
- **Indentation:** 2 spaces

### Commit Messages
```
feat: Add WhatsApp share button
fix: Resolve payment timeout issue
docs: Update deployment guide
refactor: Optimize property filtering
perf: Reduce bundle size
```

## 🔄 Component Development

### Creating a New Page
```typescript
import { useState, useEffect } from 'react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { Page } from '@/app/App';

interface NewPageProps {
  user: User | null;
  onNavigate: (page: Page, data?: any) => void;
}

export function NewPage({ user, onNavigate }: NewPageProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    // Initialize page
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Content */}
    </div>
  );
}
```

### Creating a New Component
```typescript
interface ComponentProps {
  title: string;
  onAction?: () => void;
  loading?: boolean;
}

export function Component({ title, onAction, loading }: ComponentProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="font-semibold mb-3">{title}</h3>
        <Button onClick={onAction} disabled={loading}>
          {loading ? 'Loading...' : 'Action'}
        </Button>
      </CardContent>
    </Card>
  );
}
```

## 🛠️ API Integration

### Adding New API Endpoint
```typescript
// In apiService.ts
export const fetchNewData = (params?: ParamType) =>
  request('/new-endpoint', { method: 'GET' });

export const createNewData = (data: DataType) =>
  request('/new-endpoint', { 
    method: 'POST', 
    body: JSON.stringify(data) 
  });
```

### Using with Error Handling & Caching
```typescript
import { cache, CACHE_KEYS } from '@/lib/cacheManager';
import { handleAPIError } from '@/lib/errorHandler';

useEffect(() => {
  setIsLoading(true);
  cache.getOrSet(
    CACHE_KEYS.PROPERTIES,
    () => api.getProperties(),
    10 * 60 * 1000 // 10 minutes TTL
  )
    .then(res => setData(res))
    .catch(err => handleAPIError(err))
    .finally(() => setIsLoading(false));
}, []);
```

## 🎨 Styling Guide

### Utility Classes
```tsx
// Spacing (Tailwind 4px base)
p-4    // 1rem (16px)
m-2    // 0.5rem (8px)
gap-3  // 0.75rem (12px)

// Colors
bg-blue-600  // Primary
bg-teal-500  // Secondary
text-gray-600

// Responsiveness
md:grid-cols-2  // 2 columns on tablet+
lg:w-1/3       // 1/3 width on desktop
```

### Custom Styling
```typescript
// Class composition
const buttonClass = clsx(
  'rounded-lg px-4 py-2',
  'transition-all hover:shadow-lg',
  disabled && 'opacity-50 cursor-not-allowed'
);
```

## 🐛 Debugging

### Browser DevTools
```javascript
// In console
localStorage.getItem('cache_properties') // View cache
window.__data__ // App state (if exposed)
```

### Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Can't POST" to API | Check Supabase URL & key in .env |
| Share button not working | Verify WhatsApp/social app is installed |
| Chat not loading | Check Supabase connection & auth token |
| Payment fails | Verify M-PESA credentials & network |
| Map not showing | Check Leaflet CSS import |

## 📈 Performance Optimization

### Image Optimization
```typescript
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';

<ImageWithFallback
  src="image.jpg"
  alt="Description"
  width={400}
  height={300}
  loading="lazy"
/>
```

### Code Splitting
```typescript
import { lazy, Suspense } from 'react';

const HeavyComponent = lazy(() => import('./HeavyComponent'));

export function App() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <HeavyComponent />
    </Suspense>
  );
}
```

### Query Optimization
```typescript
// Bad - fetches on every render
useEffect(() => {
  api.getProperties();
}, []);

// Good - only when needed
useEffect(() => {
  if (isVisible) {
    api.getProperties();
  }
}, [isVisible]);
```

## 🧪 Testing Approach

### Manual Testing Template
```
Feature: Property Sharing
Given: User is on property detail page
When: User clicks share button
And: Selects WhatsApp
Then: WhatsApp Web should open with property link
And: Message should include property name and price
```

### Mobile Testing
- Test on actual devices (not just browser emulation)
- Test touch gestures (swipe, tap, long-press)
- Test on different network speeds (use DevTools throttling)
- Test with different screen sizes

## 📊 Monitoring & Analytics

### Setup Google Analytics
```typescript
// In main.tsx
import { useEffect } from 'react';

useEffect(() => {
  // Load GA script
  const script = document.createElement('script');
  script.src = 'https://www.googletagmanager.com/gtag/js?id=GA_ID';
  document.head.appendChild(script);
  
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  gtag('js', new Date());
  gtag('config', 'GA_ID');
}, []);
```

### Track Important Events
```typescript
// Share event
gtag('event', 'share_property', {
  property_id: propertyId,
  platform: 'whatsapp',
  value: property.price
});

// Payment event
gtag('event', 'payment_completed', {
  property_id: propertyId,
  amount: property.price,
  method: 'mpesa'
});
```

## 🚀 Deployment Checklist

Before each deployment:
- [ ] Run `npm run build` - no errors
- [ ] Test on production build locally
- [ ] Update CHANGELOG.md
- [ ] Create git tag `v1.x.x`
- [ ] Verify environment variables
- [ ] Clear CDN cache
- [ ] Monitor error tracking dashboard
- [ ] Check analytics for anomalies

## 📝 Documentation Standards

### Function Documentation
```typescript
/**
 * Share property to WhatsApp
 * @param property - Property details
 * @param message - Custom message (optional)
 * @returns void
 */
export function shareToWhatsApp(property: Property, message?: string) {
  // Implementation
}
```

### Component Documentation
```typescript
/**
 * ShareButton - Multi-platform social sharing component
 * 
 * Features:
 * - WhatsApp, Instagram, Facebook, Twitter
 * - Clipboard copy fallback
 * - Toast notifications
 * 
 * @example
 * <ShareButton property={property} onSave={handleSave} />
 */
```

## 🔐 Security Best Practices

### Before Production
- [ ] Rotate API keys & secrets
- [ ] Enable rate limiting
- [ ] Set up DDoS protection
- [ ] Configure CSP headers
- [ ] Enable HTTPS only
- [ ] Set secure cookies
- [ ] Review data retention policies
- [ ] Conduct security audit

### Ongoing
- [ ] Monitor for security vulnerabilities
- [ ] Update dependencies regularly
- [ ] Review access logs
- [ ] Test fraud detection
- [ ] Backup database daily
- [ ] Test disaster recovery

## 🎯 Future Enhancement Ideas

### Phase 2 Features
1. **Video Tours** - Property video walkthroughs
2. **Virtual Tours** - 3D property tours
3. **AI Chatbot** - Smart property recommendations
4. **Inspection Booking** - Integrated with calendar
5. **Document Management** - Upload lease agreements
6. **Tenant Screening** - Background checks
7. **Maintenance Requests** - Work order system
8. **Review Moderation** - Spam detection
9. **Referral Program** - Rewards system
10. **Advanced Analytics** - Dashboard for landlords

### Phase 3 - Enterprise
1. Property management for companies
2. Bulk operations API
3. White-label platform
4. Advanced customization
5. Dedicated support

## 📞 Support & Resources

- **Issues:** GitHub Issues
- **Discussions:** GitHub Discussions
- **Slack:** #development channel
- **Email:** dev@housecom.co.ke
- **Docs:** wiki.housecom.co.ke

---

**Last Updated:** March 12, 2026
**Version:** 1.0.0
**Status:** Active Development
