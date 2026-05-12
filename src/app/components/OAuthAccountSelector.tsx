import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar';
import { Loader2, CheckCircle2 } from 'lucide-react';

interface OAuthAccount {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  provider: 'google' | 'apple';
}

interface OAuthAccountSelectorProps {
  open: boolean;
  onClose: () => void;
  provider: 'google' | 'apple';
  onSelectAccount?: (account: OAuthAccount) => void;
  onSignInNew?: () => void;
  isLoading?: boolean;
}

export function OAuthAccountSelector({
  open,
  onClose,
  provider,
  onSelectAccount,
  onSignInNew,
  isLoading = false,
}: OAuthAccountSelectorProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Mock accounts for demo (in production, these would come from OAuth provider)
  const mockAccounts: OAuthAccount[] = [
    {
      id: 'google-1',
      email: 'user@gmail.com',
      name: 'John Mwangi',
      avatar: 'https://i.pravatar.cc/150?u=john@gmail.com',
      provider: 'google',
    },
    {
      id: 'google-2',
      email: 'family@gmail.com',
      name: 'Grace M.',
      avatar: 'https://i.pravatar.cc/150?u=grace@gmail.com',
      provider: 'google',
    },
  ];

  const displayAccounts = provider === 'google' ? mockAccounts : mockAccounts.filter(a => a.provider === 'apple');

  const handleSelect = (account: OAuthAccount) => {
    setSelectedId(account.id);
    if (onSelectAccount) {
      onSelectAccount(account);
    }
  };

  const providerName = provider === 'google' ? 'Google' : 'Apple';
  const providerIcon = provider === 'google' ? '🔵' : '🍎';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {providerIcon} Choose a {providerName} Account
          </DialogTitle>
          <DialogDescription>
            Select an existing account or sign in with a new one
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {/* Existing Accounts */}
          {displayAccounts.length > 0 && (
            <>
              <div className="text-sm font-semibold text-gray-700 px-2">Your Accounts:</div>
              {displayAccounts.map((account) => (
                <button
                  key={account.id}
                  onClick={() => handleSelect(account)}
                  disabled={isLoading}
                  className={`w-full p-3 rounded-lg border-2 transition-all flex items-center gap-3 text-left ${
                    selectedId === account.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarImage src={account.avatar} alt={account.name} />
                    <AvatarFallback>{account.name[0]}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">{account.name}</div>
                    <div className="text-sm text-gray-500 truncate">{account.email}</div>
                  </div>

                  {selectedId === account.id && isLoading && (
                    <Loader2 className="h-5 w-5 text-blue-600 animate-spin flex-shrink-0" />
                  )}
                  {selectedId === account.id && !isLoading && (
                    <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  )}
                </button>
              ))}
            </>
          )}

          {/* Separator */}
          {displayAccounts.length > 0 && (
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">or</span>
              </div>
            </div>
          )}

          {/* Sign in with new account */}
          <Button
            onClick={onSignInNew}
            disabled={isLoading}
            variant="outline"
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Signing in...
              </>
            ) : (
              <>✨ Try a different {providerName} account</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
