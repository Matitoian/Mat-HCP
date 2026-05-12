/**
 * Social Sharing Service
 * Handles sharing properties to WhatsApp, Instagram, and other platforms
 */

export interface ShareData {
  title: string;
  description: string;
  imageUrl?: string;
  url: string;
  price?: number;
  location?: string;
}

export const shareService = {
  // WhatsApp share
  shareToWhatsApp: (data: ShareData) => {
    const text = `Check out this property on HouseCom! 🏠\n\n*${data.title}*\n${data.description}\n📍 ${data.location || 'Kenya'}\n💰 ${data.price ? `KES ${data.price.toLocaleString()}` : 'Price varies'}\n\nView full details: ${data.url}`;
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  },

  // Instagram - copy to clipboard (since Instagram doesn't have direct web sharing)
  shareToInstagram: (data: ShareData) => {
    const text = `Check out this property on HouseCom! 🏠\n\n${data.title}\n${data.description}\n📍 ${data.location || 'Kenya'}\n💰 ${data.price ? `KES ${data.price.toLocaleString()}` : 'Price varies'}\n\nDownload HouseCom to view: ${data.url}`;
    copyToClipboard(text, 'Ready to share on Instagram! Paste in your caption.');
  },

  // Facebook share
  shareToFacebook: (data: ShareData) => {
    if (window.FB) {
      window.FB.ui({
        method: 'share',
        href: data.url,
        hashtag: '#HouseCom',
        quote: `${data.title} - ${data.description}. ${data.price ? `KES ${data.price.toLocaleString()}` : ''}`,
      }, function(){});
    } else {
      // Fallback if Facebook SDK not loaded
      window.open(
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(data.url)}`,
        '_blank'
      );
    }
  },

  // Twitter/X share
  shareToTwitter: (data: ShareData) => {
    const text = `Check out "${data.title}" on HouseCom 🏠 ${data.price ? `KES ${data.price.toLocaleString()}` : ''} #realestate #kenya`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(data.url)}`,
      '_blank'
    );
  },

  // Generic share (uses Web Share API if available)
  share: async (data: ShareData) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: data.title,
          text: data.description,
          url: data.url,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Error sharing:', err);
        }
      }
    } else {
      // Fallback - copy link
      copyToClipboard(data.url, 'Link copied! Share it anywhere 🔗');
    }
  },

  // Copy to clipboard
  copyLink: (url: string) => {
    copyToClipboard(url, 'Property link copied! 📋');
  },

  // Generate shareable link
  generateShareLink: (propertyId: string, baseUrl = window.location.origin) => {
    return `${baseUrl}?propertyId=${propertyId}&shared=true`;
  },

  // Get share URL for property detail
  getPropertyShareUrl: (propertyId: string) => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}?property=${propertyId}`;
    }
    return '';
  },

  // Generate OG tags for better social sharing preview
  setOGTags: (data: ShareData) => {
    const updateTag = (name: string, content: string) => {
      let tag = document.querySelector(`meta[property="${name}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('property', name);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };

    updateTag('og:title', data.title);
    updateTag('og:description', data.description);
    updateTag('og:url', data.url);
    if (data.imageUrl) {
      updateTag('og:image', data.imageUrl);
    }
    updateTag('og:type', 'website');
  },
};

function copyToClipboard(text: string, successMessage: string) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      // Toast notification will be handled by caller
      console.log(successMessage);
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  } else {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    console.log(successMessage);
  }
}

// Extend window interface for Facebook SDK
declare global {
  interface Window {
    FB?: any;
  }
}
