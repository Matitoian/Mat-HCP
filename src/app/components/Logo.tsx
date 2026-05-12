import { LOGO } from '@/lib/brandingConstants';

interface LogoProps {
  variant?: 'primary' | 'dark' | 'icon' | 'horizontal' | 'loading';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  animate?: boolean;
}

const sizeMap = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-24 h-24',
  xl: 'w-32 h-32',
};

const sizeMapHorizontal = {
  sm: 'w-24 h-10',
  md: 'w-40 h-16',
  lg: 'w-64 h-24',
  xl: 'w-80 h-32',
};

export function Logo({ variant = 'primary', size = 'md', className = '', animate = false }: LogoProps) {
  let logoSrc = LOGO[variant as keyof typeof LOGO];
  let sizeClass = variant === 'horizontal' ? sizeMapHorizontal[size] : sizeMap[size];
  const animationClass = animate && variant === 'loading' ? 'animate-spin' : '';

  return (
    <img
      src={logoSrc}
      alt="HouseCom Logo"
      className={`${sizeClass} ${animationClass} ${className}`}
      style={{ objectFit: 'contain' }}
    />
  );
}

// Logo Link component for navigation headers
export function LogoLink({ redirectTo = '/', variant = 'icon' }: { redirectTo?: string; variant?: 'icon' | 'horizontal' }) {
  return (
    <a href={redirectTo} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
      {variant === 'icon' ? (
        <>
          <Logo variant="icon" size="sm" />
          <span className="font-bold text-xl bgclip-text text-transparent bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600">
            HouseCom
          </span>
        </>
      ) : (
        <Logo variant="horizontal" size="md" />
      )}
    </a>
  );
}

// Loading spinner with logo
export function LogoLoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <Logo variant="loading" size="md" animate />
      <p className="text-blue-600 font-semibold">Loading HouseCom...</p>
    </div>
  );
}
