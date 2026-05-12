import { ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';

interface ErrorBoundaryProps {
  error?: Error | string;
  onRetry?: () => void;
  children?: ReactNode;
  title?: string;
  description?: string;
}

export function ErrorBoundary({
  error,
  onRetry,
  children,
  title = 'Something went wrong',
  description = 'We encountered an unexpected error. Please try again.',
}: ErrorBoundaryProps) {
  if (error) {
    return (
      <Card className="border-red-200 bg-red-50/50">
        <CardHeader>
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <CardTitle className="text-red-800">{title}</CardTitle>
              <CardDescription className="text-red-700 text-sm">{description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {typeof error === 'string' ? (
            <p className="text-sm text-red-700 mb-3 font-mono bg-red-100 p-2 rounded">{error}</p>
          ) : (
            <p className="text-sm text-red-700 mb-3 font-mono bg-red-100 p-2 rounded">
              {error.message}
            </p>
          )}
          {onRetry && (
            <Button
              onClick={onRetry}
              variant="outline"
              size="sm"
              className="gap-2 border-red-300 hover:bg-red-100"
            >
              <RefreshCw className="h-3 w-3" />
              Try Again
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}

export function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-2">
          <div className="h-8 bg-gray-200 rounded animate-pulse w-3/4" />
          <div className="h-4 bg-gray-100 rounded animate-pulse w-full" />
          <div className="h-4 bg-gray-100 rounded animate-pulse w-5/6" />
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="h-40 bg-gray-200 rounded-lg animate-pulse" />
          <div className="space-y-2">
            <div className="h-6 bg-gray-200 rounded animate-pulse w-3/4" />
            <div className="h-4 bg-gray-100 rounded animate-pulse w-full" />
            <div className="h-4 bg-gray-100 rounded animate-pulse w-5/6" />
          </div>
          <div className="flex gap-2">
            <div className="h-8 bg-gray-200 rounded animate-pulse flex-1" />
            <div className="h-8 bg-gray-200 rounded animate-pulse flex-1" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function PropertyCardSkeleton() {
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="h-48 bg-gray-200 animate-pulse" />
      <div className="p-4 space-y-3">
        <div className="h-5 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 bg-gray-100 rounded animate-pulse" />
        <div className="flex gap-2">
          <div className="h-4 bg-gray-100 rounded animate-pulse flex-1" />
          <div className="h-4 bg-gray-100 rounded animate-pulse flex-1" />
        </div>
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
      </div>
    </div>
  );
}
