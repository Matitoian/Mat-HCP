import { useState } from 'react';
import {
  Share2,
  MessageCircle,
  Heart,
  Copy,
  Facebook,
  Twitter,
  Mail,
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/app/components/ui/dropdown-menu';
import { shareService, ShareData } from '@/lib/shareService';
import { toast } from 'sonner';

interface ShareButtonProps {
  property: ShareData;
  onSave?: () => void;
  isSaved?: boolean;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showLabel?: boolean;
}

export function ShareButton({
  property,
  onSave,
  isSaved,
  variant = 'outline',
  size = 'default',
  showLabel = false,
}: ShareButtonProps) {
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async (platform: 'whatsapp' | 'instagram' | 'facebook' | 'twitter' | 'copy' | 'email') => {
    setIsSharing(true);
    try {
      switch (platform) {
        case 'whatsapp':
          shareService.shareToWhatsApp(property);
          toast.success('Sharing to WhatsApp...');
          break;
        case 'instagram':
          shareService.shareToInstagram(property);
          toast.success('Text copied! Ready to share on Instagram 📸');
          break;
        case 'facebook':
          shareService.shareToFacebook(property);
          toast.success('Sharing to Facebook...');
          break;
        case 'twitter':
          shareService.shareToTwitter(property);
          toast.success('Sharing to Twitter...');
          break;
        case 'copy':
          shareService.copyLink(property.url);
          toast.success('Link copied! 🔗');
          break;
        case 'email':
          const subject = `Check out this property: ${property.title}`;
          const body = `${property.description}\n\nPrice: ${property.price ? `KES ${property.price.toLocaleString()}` : 'Contact for price'}\nLocation: ${property.location}\n\nView full details: ${property.url}`;
          window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
          toast.success('Opening email...');
          break;
      }
    } catch (error) {
      toast.error('Failed to share');
      console.error('Share error:', error);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className="gap-2 transition-all hover:scale-105"
          disabled={isSharing}
        >
          <Share2 className="h-4 w-4" />
          {showLabel && <span>Share</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-semibold">Share this property</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem
          onClick={() => handleShare('whatsapp')}
          className="cursor-pointer gap-2 text-green-600"
        >
          <MessageCircle className="h-4 w-4" />
          <span>WhatsApp</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => handleShare('instagram')}
          className="cursor-pointer gap-2 text-pink-600"
        >
          <span className="text-lg">📸</span>
          <span>Instagram</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => handleShare('facebook')}
          className="cursor-pointer gap-2 text-blue-600"
        >
          <Facebook className="h-4 w-4" />
          <span>Facebook</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => handleShare('twitter')}
          className="cursor-pointer gap-2 text-sky-500"
        >
          <Twitter className="h-4 w-4" />
          <span>Twitter/X</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => handleShare('email')}
          className="cursor-pointer gap-2"
        >
          <Mail className="h-4 w-4" />
          <span>Email</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => handleShare('copy')}
          className="cursor-pointer gap-2"
        >
          <Copy className="h-4 w-4" />
          <span>Copy Link</span>
        </DropdownMenuItem>

        {onSave && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onSave}
              className="cursor-pointer gap-2"
            >
              <Heart className={`h-4 w-4 ${isSaved ? 'fill-red-500 text-red-500' : ''}`} />
              <span>{isSaved ? 'Saved' : 'Save Property'}</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
