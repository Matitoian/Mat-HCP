import { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, MessageCircle, MapPin, Bed, Star, ExternalLink, Search } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Card } from '@/app/components/ui/card';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { Badge } from '@/app/components/ui/badge';
import { chatbotResponses, mockProperties, Property } from '@/lib/mockData';
import { motion, AnimatePresence } from 'motion/react';
import { Page } from '@/app/App';

interface Message {
  id: string;
  text?: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  properties?: Property[];
}

interface AIChatbotProps {
  onNavigate?: (page: Page, data?: any) => void;
}

export function AIChatbot({ onNavigate }: AIChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Karibu to HouseCom! 👋 I\'m your AI assistant. Ask me about properties, security, matatu routes, or type something like:\n\n🔍 "Show me TUM properties under 8k"\n🏖️ "Beach houses in Kwale"\n🎓 "Pwani Uni student accommodation"',
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const searchProperties = (userMessage: string): Property[] => {
    const lowerMessage = userMessage.toLowerCase();
    let filtered = [...mockProperties];

    // Filter by county
    if (lowerMessage.includes('mombasa')) {
      filtered = filtered.filter(p => p.county === 'Mombasa');
    } else if (lowerMessage.includes('kilifi')) {
      filtered = filtered.filter(p => p.county === 'Kilifi');
    } else if (lowerMessage.includes('kwale')) {
      filtered = filtered.filter(p => p.county === 'Kwale');
    } else if (lowerMessage.includes('lamu')) {
      filtered = filtered.filter(p => p.county === 'Lamu');
    }

    // Filter by university
    if (lowerMessage.includes('tum') && !lowerMessage.includes('matatu')) {
      filtered = filtered.filter(p => p.uniName === 'TUM' && p.distanceToUni < 5);
    } else if (lowerMessage.includes('pwani')) {
      filtered = filtered.filter(p => p.uniName === 'Pwani University' && p.distanceToUni < 10);
    }

    // Filter by beach
    if (lowerMessage.includes('beach') || lowerMessage.includes('ocean')) {
      filtered = filtered.filter(p => p.beachDistance !== undefined && p.beachDistance < 5);
    }

    // Filter by bedrooms
    if (lowerMessage.includes('bedsitter') || lowerMessage.includes('studio') || lowerMessage.includes('bachelor')) {
      filtered = filtered.filter(p => p.bedrooms === 1 && p.price < 7000);
    } else if (lowerMessage.includes('1 bed') || lowerMessage.includes('one bed')) {
      filtered = filtered.filter(p => p.bedrooms === 1);
    } else if (lowerMessage.includes('2 bed') || lowerMessage.includes('two bed')) {
      filtered = filtered.filter(p => p.bedrooms === 2);
    } else if (lowerMessage.includes('3 bed') || lowerMessage.includes('three bed')) {
      filtered = filtered.filter(p => p.bedrooms === 3);
    }

    // Filter by price range (e.g., "under 8k", "below 10000", "8k", "10,000")
    const underMatch = lowerMessage.match(/(?:under|below|max|less than|upto?)\s*(?:ksh\s*)?([\d,]+)k?/);
    const plainPriceMatch = lowerMessage.match(/(\d+)k\b/);
    if (underMatch) {
      const raw = underMatch[1].replace(',', '');
      const price = parseInt(raw);
      const maxPrice = price > 100 ? price : price * 1000;
      filtered = filtered.filter(p => p.price <= maxPrice);
    } else if (plainPriceMatch) {
      const price = parseInt(plainPriceMatch[1]) * 1000;
      filtered = filtered.filter(p => p.price <= price);
    }

    // Filter by security
    if (lowerMessage.includes('safe') || lowerMessage.includes('secure') || lowerMessage.includes('askari')) {
      filtered = filtered.filter(p => p.security.score >= 4);
    }

    // Filter verified only
    if (lowerMessage.includes('verified')) {
      filtered = filtered.filter(p => p.verified);
    }

    // Sort by rating descending
    filtered.sort((a, b) => b.rating - a.rating);

    // Return top 3 results
    return filtered.slice(0, 3);
  };

  const getBotResponse = (userMessage: string): { text: string; properties?: Property[] } => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Check if user is searching for properties
    const searchKeywords = ['show', 'find', 'search', 'looking for', 'want', 'need', 'any', 'mombasa', 'kilifi', 'kwale', 'lamu', 'tum', 'pwani', 'beach', 'bedsitter', 'studio', 'apartment', 'house', 'rooms', 'under', 'below', 'cheap', 'affordable'];
    const isSearching = searchKeywords.some(keyword => lowerMessage.includes(keyword));
    
    if (isSearching) {
      const properties = searchProperties(userMessage);
      
      if (properties.length > 0) {
        return {
          text: `Found ${properties.length} ${properties.length === 1 ? 'property' : 'properties'} for you! Click any card to view full details:`,
          properties
        };
      } else {
        return {
          text: 'Sorry, no properties match those exact filters. Try:\n• A different county\n• Wider budget range\n• Different bedroom count\n\nOr browse all 80 properties on the search page!'
        };
      }
    }
    
    // Check for keywords and return appropriate response
    for (const [keyword, response] of Object.entries(chatbotResponses)) {
      if (keyword !== 'default' && lowerMessage.includes(keyword)) {
        return { text: response };
      }
    }
    
    return { text: chatbotResponses.default };
  };

  const handleSend = async (overrideInput?: string) => {
    const messageText = overrideInput || input;
    if (!messageText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    await new Promise((resolve) => setTimeout(resolve, 900));

    const botResponse = getBotResponse(messageText);
    const botMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: botResponse.text,
      sender: 'bot',
      timestamp: new Date(),
      properties: botResponse.properties,
    };

    setMessages((prev) => [...prev, botMessage]);
    setIsTyping(false);

    if (botResponse.properties) {
      displayProperties(botResponse.properties);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePropertyClick = (property: Property) => {
    if (onNavigate) {
      setIsOpen(false);
      onNavigate('property-detail', { selectedPropertyId: property.id });
    }
  };

  const displayProperties = (properties: Property[]) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        text: `Here are properties matching your query:`,
        sender: 'bot',
        timestamp: new Date(),
        properties,
      },
    ]);
  };

  const QUICK_ACTIONS = [
    { label: '🎓 Near TUM', query: 'Show me TUM properties' },
    { label: '🏫 Pwani Uni', query: 'Pwani University student accommodation' },
    { label: '🏖️ Beach Houses', query: 'Beach properties in Kwale' },
    { label: '💰 Under 8k', query: 'Show properties under 8k' },
    { label: '🔒 Secure', query: 'Safe verified properties' },
    { label: '🚌 Matatu', query: 'Matatu routes' },
  ];

  return (
    <>
      {/* Floating Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <div className="relative group">
              {/* Pulse ring */}
              <span className="pulse-ring absolute inset-0 rounded-full" />
              <Button
                size="lg"
                onClick={() => setIsOpen(true)}
                className="h-16 w-16 rounded-full shadow-xl bg-gradient-to-br from-blue-600 via-blue-700 to-teal-600 hover:from-blue-700 hover:to-teal-700 border-0 relative z-10"
              >
                <MessageCircle className="h-7 w-7" />
              </Button>
              {/* AI badge */}
              <span className="absolute -top-1 -right-1 h-6 w-6 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center text-[9px] text-white font-bold shadow-lg z-20">
                AI
              </span>
              {/* Tooltip */}
              <div className="absolute bottom-full right-0 mb-3 bg-gray-900 text-white text-xs rounded-lg px-3 py-1.5 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                Ask HouseCom AI
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 80, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 80, scale: 0.85 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-6 right-6 z-50 w-[390px] max-h-[640px]"
          >
            <Card className="flex flex-col h-[640px] shadow-2xl overflow-hidden border-0 rounded-2xl">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-teal-600 text-white p-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                    <Bot className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold font-poppins">HouseCom AI</h3>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 bg-green-400 rounded-full animate-pulse" />
                      <p className="text-xs text-blue-100">Online • SMART Technology</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {onNavigate && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => { setIsOpen(false); onNavigate('search'); }}
                      className="text-white hover:bg-white/20 h-8 px-2 rounded-lg text-xs"
                    >
                      <Search className="h-3.5 w-3.5 mr-1" />
                      Browse All
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsOpen(false)}
                    className="text-white hover:bg-white/20 h-8 w-8 p-0 rounded-full"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4 bg-gray-50">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex flex-col ${message.sender === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl p-3 ${
                          message.sender === 'user'
                            ? 'bg-blue-600 text-white rounded-br-sm'
                            : 'bg-white text-gray-800 shadow-sm rounded-bl-sm border'
                        }`}
                      >
                        {message.sender === 'bot' && (
                          <div className="flex items-center gap-2 mb-1.5">
                            <Bot className="h-3.5 w-3.5 text-blue-600" />
                            <span className="text-xs font-semibold text-blue-600">HouseCom AI</span>
                          </div>
                        )}
                        {message.text && <p className="text-sm whitespace-pre-line leading-relaxed">{message.text}</p>}
                        <p className={`text-xs mt-1.5 ${message.sender === 'user' ? 'text-blue-100' : 'text-gray-400'}`}>
                          {message.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>

                      {/* Property Cards — FIXED: now clickable with navigation */}
                      {message.properties && message.properties.length > 0 && (
                        <div className="mt-2 space-y-2 w-full max-w-[95%]">
                          {message.properties.map((property) => (
                            <motion.div
                              key={property.id}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              onClick={() => handlePropertyClick(property)}
                              className="bg-white rounded-xl shadow-md overflow-hidden border cursor-pointer hover:shadow-lg hover:border-blue-300 transition-all group"
                            >
                              <div className="relative">
                                <img 
                                  src={property.images[0]} 
                                  alt={property.title}
                                  className="w-full h-28 object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute top-2 left-2 flex gap-1">
                                  {property.verified && (
                                    <Badge className="bg-green-500 text-white text-[10px] px-1.5">✓ Verified</Badge>
                                  )}
                                </div>
                                <div className="absolute top-2 right-2 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full">
                                  {property.county}
                                </div>
                                {/* Hover overlay */}
                                <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/10 transition-colors flex items-center justify-center">
                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-lg px-3 py-1.5 text-xs font-semibold text-blue-600 flex items-center gap-1">
                                    <ExternalLink className="h-3 w-3" />
                                    View Details
                                  </div>
                                </div>
                              </div>
                              <div className="p-3">
                                <h4 className="text-sm font-semibold line-clamp-1 mb-1.5">{property.title}</h4>
                                <div className="space-y-1 text-xs text-gray-600">
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3 text-gray-400" />
                                    <span className="line-clamp-1">{property.location}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Bed className="h-3 w-3 text-gray-400" />
                                    <span>{property.bedrooms} bed • {property.bathrooms} bath</span>
                                  </div>
                                  <div className="flex items-center justify-between mt-2 pt-1.5 border-t">
                                    <span className="font-bold text-blue-600">KSh {property.price.toLocaleString()}/mo</span>
                                    <div className="flex items-center gap-1">
                                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                      <span className="font-medium">{property.rating}</span>
                                      <span className="text-gray-400">({property.reviews})</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                          {onNavigate && (
                            <button
                              onClick={() => { setIsOpen(false); onNavigate('search'); }}
                              className="w-full text-center text-xs text-blue-600 font-medium py-2 hover:underline"
                            >
                              View all properties →
                            </button>
                          )}
                        </div>
                      )}
                    </motion.div>
                  ))}
                  
                  {/* Typing Indicator */}
                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex justify-start"
                    >
                      <div className="bg-white rounded-2xl p-3 shadow-sm border rounded-bl-sm">
                        <div className="flex items-center gap-2">
                          <Bot className="h-4 w-4 text-blue-600" />
                          <div className="flex gap-1">
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  
                  {/* Scroll anchor */}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Quick Actions */}
              <div className="px-3 pt-2 pb-1 bg-white border-t shrink-0">
                <div className="flex gap-1.5 flex-wrap">
                  {QUICK_ACTIONS.map((action) => (
                    <button
                      key={action.label}
                      onClick={() => handleSend(action.query)}
                      className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors border border-blue-100 whitespace-nowrap"
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input */}
              <div className="p-3 bg-white border-t shrink-0">
                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask about properties, routes, security..."
                    className="flex-1 rounded-full bg-gray-50"
                  />
                  <Button
                    onClick={() => handleSend()}
                    size="icon"
                    disabled={!input.trim() || isTyping}
                    className="rounded-full shrink-0 bg-blue-600 hover:bg-blue-700"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-[10px] text-gray-400 mt-1.5 text-center">
                  Powered by HouseCom AI • SMART Technology
                </p>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exit Sign */}
      <div onClick={() => setIsOpen(false)} className="fixed inset-0 bg-black/50 z-40" />
    </>
  );
}
