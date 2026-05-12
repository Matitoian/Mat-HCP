# HouseCom Brand Identity & Style Guide

## Logo Overview

The HouseCom logo represents modern real estate innovation, combining a stylized house icon with clean, professional typography. The design evokes trust, accessibility, and forward-thinking technology.

### Logo Variations

#### 1. **Primary Logo** (`logo.svg`)
- **Usage**: Main branding, website header, marketing materials
- **Background**: White with subtle border
- **Includes**: Icon + "HOUSECOM" text
- **Best For**: Light backgrounds, print materials, social media

#### 2. **Dark Mode Logo** (`logo-dark.svg`)
- **Usage**: Dark themes, night mode UI, dark backgrounds
- **Background**: Dark slate with light elements
- **Includes**: Icon + "HOUSECOM" text (light colored)
- **Best For**: Dark interfaces, dashboards, dark backgrounds

#### 3. **Icon Only** (`logo-icon.svg`)
- **Usage**: Favicon, app icon, small UI elements
- **Background**: Transparent / None
- **Includes**: House icon only (no text)
- **Best For**: Favicons, buttons, compact spaces

---

## Brand Colors

### Primary Colors
- **Primary Blue**: `#2563eb` - Main brand color, trust & stability
- **Dark Blue**: `#1e40af` - Darker accent, depth
- **Cyan Accent**: `#0ea5e9` - Modern, dynamic element

### Secondary Colors
- **Gold**: `#fbbf24` - Door handle accent, premium feel
- **Light Gray**: `#f3f4f6` - Background, neutrality

### Usage Guidelines
- Primary Blue: Headlines, CTAs, primary buttons
- Dark Blue: Navigation, secondary elements
- Cyan: Links, interactive elements, highlights
- Gold: Accents, premium features
- Light Gray: Backgrounds, subtle elements

---

## Logo Placement & Spacing

### Minimum Clear Space
- Leave at least 20px of clear space around the logo on all sides
- Do not overlap logo with other elements

### Minimum Size
- **Web**: Minimum 120px width
- **Mobile**: Minimum 80px width
- **Favicon**: 32x32 px minimum
- **Print**: 2 inches minimum width

### Aspect Ratio
- All logo variations maintain a square aspect ratio
- Responsive scaling: All sizes should be proportional enlargements

---

## Typography

### Primary Font
- **Headings**: Bold, sans-serif (Arial / Helvetica)
- **Letter Spacing**: 1px for "HOUSECOM"
- **Weight**: Bold (700)

### Secondary Font
- Body text: Clean sans-serif, readable at all sizes
- Line height: 1.5x for optimal readability

---

## Logo Usage Examples

### ✅ Correct Usage
- Logo on white background
- Logo on dark background (use dark variant)
- Logo at various sizes (maintains proportions)
- Logo in header/navigation
- Logo as favicon
- Logo in footer

### ❌ Incorrect Usage
- Distorting/stretching the logo non-proportionally
- Using logo on background same color as logo
- Rotating the logo
- Removing elements from the logo
- Using low-resolution logo
- Adding effects/shadows/outlines without approval

---

## Implementation

### React Component Usage

```typescript
import { Logo, LogoLink } from '@/app/components/Logo';

// Use in header
<LogoLink redirectTo="/" />

// Use icon only
<Logo variant="icon" size="sm" />

// Use full logo with text
<Logo variant="primary" size="lg" />

// Dark mode
<Logo variant="dark" size="lg" />
```

### Available Sizes
- `sm`: 32x32 px (small buttons, mobile)
- `md`: 48x48 px (headers, standard use)
- `lg`: 96x96 px (hero sections)
- `xl`: 128x128 px (large headers, print)

---

## Brand Voice & Messaging

### Brand Pillars
1. **Modern** - Contemporary design and technology
2. **Trustworthy** - Secure, reliable real estate solutions
3. **Accessible** - Easy to use for everyone
4. **Connected** - Bridging landlords and tenants

### Key Tagline
**"Find Your Perfect Home"**

### Description
"Modern real estate platform connecting tenants and landlords with ease"

---

## Digital Usage

### Favicon
The icon-only logo is used as the browser favicon at 32x32 pixels.

### Social Media
- Use primary logo (with text) for profile images
- Use icon-only for smaller social media thumbnails
- Maintain 1:1 aspect ratio for profile pictures

### Email
- Insert logo in email header/footer (100-150px width)
- Ensure contrast is sufficient for readability

### Presentations
- Use primary logo for slides with light backgrounds
- Use dark logo for slides with dark backgrounds
- Minimum size: 2 inches for print/PDF

---

## File Locations

- **Primary Logo**: `/public/logo.svg`
- **Dark Logo**: `/public/logo-dark.svg`
- **Icon Only**: `/public/logo-icon.svg`
- **Favicon**: Set in `index.html` (references logo.svg)
- **React Component**: `/src/app/components/Logo.tsx`
- **Brand Constants**: `/src/lib/brandingConstants.ts`

---

## Future Extensions

### Logo Variations to Consider
1. Horizontal layout (logo + text side-by-side)
2. Stacked layout (text below icon)
3. Monochrome variants for printing
4. Animated version for loading screens

### Typography Options
- Consider pairing with modern sans-serif fonts: Poppins, Inter, Oxygen
- Mock-up display font: Could use gradient text with "HouseCom"

---

## Approval & Questions

For any modifications to the logo or brand identity, please adhere to these guidelines. For special requests or deviations, maintain consistency with the brand colors and geometric principles established.

**Brand Documentation Version**: 1.0  
**Last Updated**: March 15, 2026  
**Approved**: Logo Design Complete ✅
