import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, Paperclip, Phone, Loader2 } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Card } from '@/app/components/ui/card';
import { Avatar, AvatarFallback } from '@/app/components/ui/avatar';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { Page } from '@/app/App';
import { User, mockChats, mockProperties } from '@/lib/mockData';
import * as api from '@/lib/apiService';
import { toast } from 'sonner';

interface ChatPageProps {
  user: User;
  chatId?: string;
  propertyId?: string;
  onNavigate: (page: Page, data?: any) => void;
  onLogout: () => void;
}

export function ChatPage({ user, chatId, propertyId, onNavigate, onLogout }: ChatPageProps) {
  const [message, setMessage] = useState('');
  const [chats, setChats] = useState<any[]>([]);
  const [currentChat, setCurrentChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<any>(null);

  // Load chats from Supabase
  useEffect(() => {
    api.getChats()
      .then(res => {
        const realChats = res.chats || [];
        const fallbackChats = mockChats.map(c => ({ ...c, _mock: true }));
        const allChats = realChats.length > 0 ? realChats : fallbackChats;
        setChats(allChats);

        let active = chatId ? allChats.find((c: any) => c.id === chatId) : allChats[0];
        if (!active && allChats.length > 0) active = allChats[0];
        setCurrentChat(active || null);
      })
      .catch(() => {
        const fallback = mockChats;
        setChats(fallback);
        setCurrentChat(fallback[0] || null);
      })
      .finally(() => setIsLoading(false));
  }, [chatId]);

  // If we have propertyId but no chatId, create/get a chat
  useEffect(() => {
    if (propertyId && !chatId) {
      const property = mockProperties.find(p => p.id === propertyId);
      if (property) {
        api.createOrGetChat(propertyId, property.landlordId)
          .then(res => {
            if (res.chat) {
              setCurrentChat(res.chat);
              setChats(prev => {
                const exists = prev.find(c => c.id === res.chat.id);
                return exists ? prev : [res.chat, ...prev];
              });
            }
          })
          .catch(() => {});
      }
    }
  }, [propertyId, chatId]);

  // Load messages for current chat
  useEffect(() => {
    if (!currentChat) return;

    const loadMessages = () => {
      if (currentChat._mock) {
        setMessages(currentChat.messages || []);
        return;
      }
      api.getChatMessages(currentChat.id)
        .then(res => { if (res.messages) setMessages(res.messages); })
        .catch(() => setMessages(currentChat.messages || []));
    };

    loadMessages();

    // Poll for new messages every 5 seconds
    if (!currentChat._mock) {
      pollRef.current = setInterval(loadMessages, 5000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [currentChat?.id]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim() || !currentChat || isSending) return;
    const text = message.trim();
    setMessage('');
    setIsSending(true);

    if (currentChat._mock) {
      // Optimistic update for mock chats
      const newMsg = {
        id: Date.now().toString(), senderId: user.id, senderName: user.name,
        text, type: 'text', timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, newMsg]);
      setIsSending(false);
      return;
    }

    // Optimistic update
    const tempMsg = {
      id: `temp_${Date.now()}`, senderId: user.id, senderName: user.name,
      text, type: 'text', timestamp: new Date().toISOString(), _temp: true,
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      const res = await api.sendMessage(currentChat.id, text);
      setMessages(prev => prev.map(m => m._temp ? res.message : m));
    } catch (e) {
      toast.error('Failed to send message');
      setMessages(prev => prev.filter(m => !m._temp));
      setMessage(text);
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading chats...</p>
        </div>
      </div>
    );
  }

  if (!currentChat) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="p-8 text-center max-w-sm w-full">
          <div className="text-4xl mb-4">💬</div>
          <h3 className="font-semibold text-gray-900 mb-2">No Chats Yet</h3>
          <p className="text-gray-500 text-sm mb-4">
            Start a conversation by contacting a landlord from a property listing.
          </p>
          <Button onClick={() => onNavigate(user.role === 'tenant' ? 'tenant-dashboard' : 'landlord-dashboard')}>
            Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar: Chat List */}
      <div className="w-80 bg-white border-r flex flex-col hidden md:flex">
        <div className="p-4 border-b">
          <Button variant="ghost" size="sm" onClick={() => onNavigate(user.role === 'tenant' ? 'tenant-dashboard' : 'landlord-dashboard')} className="mb-3 -ml-1">
            <ArrowLeft className="h-4 w-4 mr-2" />Back
          </Button>
          <h2 className="font-semibold">Messages</h2>
          <p className="text-xs text-gray-500">{chats.length} conversation{chats.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {chats.map(chat => (
            <button
              key={chat.id}
              onClick={() => setCurrentChat(chat)}
              className={`w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left border-b ${currentChat?.id === chat.id ? 'bg-blue-50' : ''}`}
            >
              <div className="h-10 w-10 rounded-lg bg-gray-200 overflow-hidden shrink-0">
                {chat.propertyImage
                  ? <img src={chat.propertyImage} alt="" className="h-full w-full object-cover" />
                  : <div className="h-full w-full flex items-center justify-center text-lg">🏠</div>
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">
                  {user.role === 'tenant' ? chat.landlordName : chat.tenantName}
                </div>
                <div className="text-xs text-gray-400 truncate">{chat.propertyTitle}</div>
                {chat.lastMessage && (
                  <div className="text-xs text-gray-400 truncate mt-0.5">{chat.lastMessage}</div>
                )}
              </div>
              {chat.unread > 0 && (
                <span className="h-5 w-5 bg-blue-600 rounded-full text-[10px] text-white flex items-center justify-center font-bold shrink-0">
                  {chat.unread}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b flex items-center gap-3 p-4 shadow-sm">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => onNavigate(user.role === 'tenant' ? 'tenant-dashboard' : 'landlord-dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="h-12 w-12 rounded-lg bg-gray-200 overflow-hidden shrink-0">
            {currentChat.propertyImage
              ? <img src={currentChat.propertyImage} alt="" className="h-full w-full object-cover" />
              : <div className="h-full w-full flex items-center justify-center text-xl">🏠</div>
            }
          </div>
          <div className="flex-1">
            <div className="font-semibold">
              {user.role === 'tenant' ? currentChat.landlordName : currentChat.tenantName}
            </div>
            <div className="text-sm text-gray-500 truncate">{currentChat.propertyTitle}</div>
          </div>
          <Button variant="outline" size="sm" onClick={() => currentChat.propertyId && onNavigate('property-detail', { selectedPropertyId: currentChat.propertyId })}>
            <Phone className="h-4 w-4 mr-2" />
            View Property
          </Button>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4" ref={scrollRef as any}>
          <div className="max-w-3xl mx-auto space-y-3">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">👋</div>
                <p className="text-gray-500 text-sm">Start the conversation!</p>
                <p className="text-gray-400 text-xs mt-1">Ask about availability, price, or schedule a viewing.</p>
              </div>
            )}
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.senderId === user.id ? 'justify-end' : 'justify-start'}`}>
                {msg.senderId !== user.id && (
                  <Avatar className="h-7 w-7 mr-2 self-end shrink-0">
                    <AvatarFallback className="text-xs bg-gray-200">{msg.senderName?.[0] || '?'}</AvatarFallback>
                  </Avatar>
                )}
                <div className={`max-w-[70%] ${msg._temp ? 'opacity-60' : ''}`}>
                  <div className={`rounded-2xl px-4 py-2.5 ${
                    msg.senderId === user.id
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-white border shadow-sm rounded-bl-sm'
                  }`}>
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                  </div>
                  <p className={`text-[10px] mt-1 ${msg.senderId === user.id ? 'text-right text-gray-400' : 'text-gray-400'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    {msg._temp && ' · Sending...'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="bg-white border-t p-4">
          <div className="max-w-3xl mx-auto flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Type a message..."
              className="flex-1 rounded-full"
              disabled={isSending}
            />
            <Button onClick={handleSend} size="icon" className="rounded-full" disabled={!message.trim() || isSending}>
              {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
