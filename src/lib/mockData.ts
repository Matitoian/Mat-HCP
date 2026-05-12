// Mock data for HouseCom MVP - Coastal Kenya Rental Platform

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'tenant' | 'landlord' | 'admin';
  county: string;
  verified: boolean;
  studentId?: string;
  isStudent?: boolean;
  institution?: string;
  institutionId?: string;
  institutionCounty?: string;
  rating?: number;
  avatar?: string;
}

export interface Property {
  id: string;
  landlordId: string;
  landlordName: string;
  landlordRating: number;
  landlordVerified: boolean;
  title: string;
  description: string;
  price: number;
  county: 'Mombasa' | 'Kilifi' | 'Kwale' | 'Lamu';
  location: string;
  latitude: number;
  longitude: number;
  images: string[];
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
  security: {
    score: number;
    askari24hr: boolean;
    cctv: boolean;
    fence: boolean;
    compound: string;
  };
  verified: boolean;
  rating: number;
  reviews: number;
  distanceToUni: number;
  uniName: string;
  mpesaTill: string;
  touristFriendly: boolean;
  beachDistance?: number;
}

export interface MatatuRoute {
  id: string;
  name: string;
  start: string;
  end: string;
  costKsh: number;
  frequencyMin: number;
  county: string;
}

export interface Chat {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyImage: string;
  tenantId: string;
  tenantName: string;
  landlordId: string;
  landlordName: string;
  messages: Message[];
  unread: number;
  lastMessage: string;
  lastMessageTime: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  type: 'text' | 'image';
  imageUrl?: string;
}

// Property generator function
function generateProperties(): Property[] {
  const properties: Property[] = [];
  
  // Mombasa locations (20 properties)
  const mombasaLocations = [
    { name: 'Tudor', lat: -4.0435, lng: 39.6682, dist: 0.8 },
    { name: 'Mikindani', lat: -4.0547, lng: 39.6744, dist: 1.2 },
    { name: 'Changamwe', lat: -4.0219, lng: 39.6346, dist: 2.5 },
    { name: 'Buxton', lat: -4.0500, lng: 39.6700, dist: 1.5 },
    { name: 'Bamburi', lat: -3.9858, lng: 39.7288, dist: 8.2 },
    { name: 'Nyali', lat: -4.0500, lng: 39.7000, dist: 6.5 },
    { name: 'Likoni', lat: -4.0833, lng: 39.6667, dist: 4.2 },
    { name: 'Bombolulu', lat: -4.0219, lng: 39.6900, dist: 5.8 },
  ];
  
  // Kilifi locations (20 properties)
  const kilifiLocations = [
    { name: 'Kilifi Town', lat: -3.6309, lng: 39.8468, dist: 0.5 },
    { name: 'Malindi Town', lat: -3.2186, lng: 40.1169, dist: 8.5 },
    { name: 'Watamu', lat: -3.3583, lng: 40.0333, dist: 12.0 },
    { name: 'Mtwapa', lat: -3.9500, lng: 39.7333, dist: 15.2 },
    { name: 'Takaungu', lat: -3.6833, lng: 39.8500, dist: 5.5 },
  ];
  
  // Kwale locations (20 properties)
  const kwaleLocations = [
    { name: 'Diani Beach', lat: -4.3201, lng: 39.5809, dist: 35.0 },
    { name: 'Ukunda', lat: -4.2833, lng: 39.5667, dist: 32.0 },
    { name: 'Msambweni', lat: -4.4667, lng: 39.4833, dist: 45.0 },
    { name: 'Lunga Lunga', lat: -4.5667, lng: 39.4167, dist: 52.0 },
    { name: 'Kinango', lat: -3.9333, lng: 39.2833, dist: 55.0 },
  ];
  
  // Lamu locations (20 properties)
  const lamuLocations = [
    { name: 'Lamu Old Town', lat: -2.2717, lng: 40.9020, dist: 150.0 },
    { name: 'Shela Village', lat: -2.2617, lng: 40.9120, dist: 152.0 },
    { name: 'Matondoni', lat: -2.2317, lng: 40.8920, dist: 155.0 },
    { name: 'Manda Island', lat: -2.2500, lng: 40.9500, dist: 153.0 },
  ];
  
  const propertyTypes = [
    { type: '1BD Apartment', bedrooms: 1, bathrooms: 1, desc: 'Cozy 1-bedroom apartment', priceBase: 6500 },
    { type: 'Studio', bedrooms: 1, bathrooms: 1, desc: 'Modern studio apartment', priceBase: 6000 },
    { type: '2BD Apartment', bedrooms: 2, bathrooms: 1, desc: 'Spacious 2-bedroom apartment', priceBase: 9500 },
    { type: 'Bachelor', bedrooms: 1, bathrooms: 1, desc: 'Compact bachelor unit', priceBase: 5500 },
    { type: 'Bedsitter', bedrooms: 1, bathrooms: 1, desc: 'Affordable bedsitter', priceBase: 5000 },
    { type: '3BD House', bedrooms: 3, bathrooms: 2, desc: 'Family-friendly 3-bedroom house', priceBase: 18000 },
  ];
  
  const amenitiesList = [
    ['WiFi', '24/7 Water', 'Parking', 'Security', 'Kitchen'],
    ['WiFi', '24/7 Water', 'Security', 'Kitchen', 'Balcony'],
    ['WiFi', 'Water', 'Parking', 'Security', 'Generator'],
    ['WiFi', '24/7 Water', 'Parking', 'Security', 'Kitchen', 'Balcony', 'CCTV'],
    ['WiFi', '24/7 Water', 'Beach Access', 'Security', 'Kitchen', 'Pool'],
  ];
  
  const landlordNames = [
    'Juma Khalifa', 'Amina Hassan', 'Omar Abdalla', 'Fatuma Ali', 'Hassan Mwalimu',
    'Zainab Mohamed', 'Ahmed Salim', 'Mwanajuma Said', 'Ali Rashid', 'Khadija Omar',
    'Mohamed Bakari', 'Halima Juma', 'Rashid Ali', 'Aziza Hassan', 'Hamisi Mwangi',
    'Mariam Saleh', 'Ibrahim Faraj', 'Rehema Abdalla', 'Salim Khamis', 'Asha Mohamed'
  ];
  
  const images = [
    ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800'],
    ['https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800', 'https://images.unsplash.com/photo-1556912173-46c336c7fd55?w=800'],
    ['https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800', 'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=800'],
    ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800', 'https://images.unsplash.com/photo-1502672023488-70e25813eb80?w=800'],
    ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800', 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800'],
  ];
  
  let idCounter = 1;
  
  // Generate Mombasa properties (20)
  for (let i = 0; i < 20; i++) {
    const loc = mombasaLocations[i % mombasaLocations.length];
    const propType = propertyTypes[i % propertyTypes.length];
    const landlord = landlordNames[i % landlordNames.length];
    // ✅ FIX: First 4 properties belong to LL1 (Juma Khalifa), rest get sequential IDs
    const landlordId = i < 4 ? 'LL1' : `LL${idCounter + 10}`;
    
    properties.push({
      id: String(idCounter++),
      landlordId,
      landlordName: i < 4 ? 'Juma Khalifa' : landlord,
      landlordRating: Number((3.5 + Math.random() * 1.5).toFixed(1)),
      landlordVerified: i % 3 !== 0,
      title: `${propType.type} ${loc.name} - ${i % 2 === 0 ? 'Near TUM' : 'Secure Compound'}`,
      description: `${propType.desc} in ${loc.name}, Mombasa. Perfect for ${i % 2 === 0 ? 'TUM students' : 'young professionals'}. Features modern amenities and excellent security.`,
      price: propType.priceBase + (i % 5) * 500,
      county: 'Mombasa',
      location: `${loc.name}, Mombasa`,
      latitude: loc.lat + (Math.random() - 0.5) * 0.01,
      longitude: loc.lng + (Math.random() - 0.5) * 0.01,
      images: images[i % images.length],
      bedrooms: propType.bedrooms,
      bathrooms: propType.bathrooms,
      amenities: amenitiesList[i % amenitiesList.length],
      security: {
        score: Number((3.0 + Math.random() * 2.0).toFixed(1)),
        askari24hr: i % 2 === 0,
        cctv: i % 3 !== 0,
        fence: true,
        compound: `${loc.name} ${i % 2 === 0 ? 'Estate' : 'Apartments'}`
      },
      verified: i % 4 !== 0,
      rating: Number((3.5 + Math.random() * 1.5).toFixed(1)),
      reviews: 5 + (i % 30),
      distanceToUni: loc.dist + (i % 5) * 0.2,
      uniName: 'TUM',
      mpesaTill: `HC00${1000 + idCounter}`,
      touristFriendly: i % 5 === 0
    });
  }
  
  // Generate Kilifi properties (20)
  for (let i = 0; i < 20; i++) {
    const loc = kilifiLocations[i % kilifiLocations.length];
    const propType = propertyTypes[i % propertyTypes.length];
    const landlord = landlordNames[i % landlordNames.length];
    const isBeachArea = loc.name.includes('Beach') || loc.name.includes('Malindi') || loc.name.includes('Watamu');
    
    properties.push({
      id: String(idCounter++),
      landlordId: `LL${idCounter}`,
      landlordName: landlord,
      landlordRating: Number((3.5 + Math.random() * 1.5).toFixed(1)),
      landlordVerified: i % 3 !== 0,
      title: `${propType.type} ${loc.name} ${isBeachArea ? '- Ocean View' : '- Near Pwani Uni'}`,
      description: `${propType.desc} in ${loc.name}, Kilifi. ${isBeachArea ? 'Stunning ocean views and beach access' : 'Close to Pwani University'}. Modern amenities included.`,
      price: propType.priceBase + (isBeachArea ? 3000 : 0) + (i % 5) * 500,
      county: 'Kilifi',
      location: `${loc.name}, Kilifi`,
      latitude: loc.lat + (Math.random() - 0.5) * 0.01,
      longitude: loc.lng + (Math.random() - 0.5) * 0.01,
      images: images[i % images.length],
      bedrooms: propType.bedrooms,
      bathrooms: propType.bathrooms,
      amenities: isBeachArea ? [...amenitiesList[i % amenitiesList.length], 'Beach Access'] : amenitiesList[i % amenitiesList.length],
      security: {
        score: Number((3.0 + Math.random() * 2.0).toFixed(1)),
        askari24hr: i % 2 === 0,
        cctv: i % 3 !== 0,
        fence: i % 2 === 0,
        compound: `${loc.name} ${i % 2 === 0 ? 'Villas' : 'Residence'}`
      },
      verified: i % 4 !== 0,
      rating: Number((3.5 + Math.random() * 1.5).toFixed(1)),
      reviews: 5 + (i % 25),
      distanceToUni: loc.dist + (i % 5) * 0.3,
      uniName: 'Pwani University',
      mpesaTill: `HC00${1000 + idCounter}`,
      touristFriendly: isBeachArea,
      beachDistance: isBeachArea ? 0.2 + (i % 5) * 0.2 : undefined
    });
  }
  
  // Generate Kwale properties (20)
  for (let i = 0; i < 20; i++) {
    const loc = kwaleLocations[i % kwaleLocations.length];
    const propType = propertyTypes[i % propertyTypes.length];
    const landlord = landlordNames[i % landlordNames.length];
    const isDiani = loc.name.includes('Diani');
    
    properties.push({
      id: String(idCounter++),
      landlordId: `LL${idCounter}`,
      landlordName: landlord,
      landlordRating: Number((3.5 + Math.random() * 1.5).toFixed(1)),
      landlordVerified: i % 3 !== 0,
      title: `${propType.type} ${loc.name} ${isDiani ? '- Beach Paradise' : '- Quiet Area'}`,
      description: `${propType.desc} in ${loc.name}, Kwale. ${isDiani ? 'Premium beach location with world-class amenities' : 'Peaceful neighborhood with good transport links'}.`,
      price: propType.priceBase + (isDiani ? 5000 : 1000) + (i % 5) * 500,
      county: 'Kwale',
      location: `${loc.name}, Kwale`,
      latitude: loc.lat + (Math.random() - 0.5) * 0.01,
      longitude: loc.lng + (Math.random() - 0.5) * 0.01,
      images: images[i % images.length],
      bedrooms: propType.bedrooms,
      bathrooms: propType.bathrooms,
      amenities: isDiani ? [...amenitiesList[i % amenitiesList.length], 'Beach Access', 'Pool'] : amenitiesList[i % amenitiesList.length],
      security: {
        score: Number((isDiani ? 4.0 : 3.0) + Math.random() * 1.0).toFixed(1),
        askari24hr: isDiani || i % 2 === 0,
        cctv: i % 3 !== 0,
        fence: true,
        compound: `${loc.name} ${isDiani ? 'Resort' : 'Homes'}`
      },
      verified: i % 4 !== 0,
      rating: Number((3.5 + Math.random() * 1.5).toFixed(1)),
      reviews: 5 + (i % 20),
      distanceToUni: loc.dist + (i % 5) * 1.0,
      uniName: 'TUM',
      mpesaTill: `HC00${1000 + idCounter}`,
      touristFriendly: true,
      beachDistance: isDiani ? 0.1 + (i % 5) * 0.3 : 3.0 + (i % 10) * 0.5
    });
  }
  
  // Generate Lamu properties (20)
  for (let i = 0; i < 20; i++) {
    const loc = lamuLocations[i % lamuLocations.length];
    const propType = propertyTypes[i % propertyTypes.length];
    const landlord = landlordNames[i % landlordNames.length];
    const isOldTown = loc.name.includes('Old Town') || loc.name.includes('Shela');
    
    properties.push({
      id: String(idCounter++),
      landlordId: `LL${idCounter}`,
      landlordName: landlord,
      landlordRating: Number((3.5 + Math.random() * 1.5).toFixed(1)),
      landlordVerified: i % 3 !== 0,
      title: `${propType.type} ${loc.name} ${isOldTown ? '- Heritage Site' : '- Island Living'}`,
      description: `${propType.desc} in ${loc.name}, Lamu. ${isOldTown ? 'Traditional Swahili architecture in UNESCO World Heritage site' : 'Peaceful island living with beach access'}.`,
      price: propType.priceBase + (isOldTown ? -1000 : 500) + (i % 5) * 500,
      county: 'Lamu',
      location: `${loc.name}, Lamu`,
      latitude: loc.lat + (Math.random() - 0.5) * 0.01,
      longitude: loc.lng + (Math.random() - 0.5) * 0.01,
      images: images[i % images.length],
      bedrooms: propType.bedrooms,
      bathrooms: propType.bathrooms,
      amenities: isOldTown ? ['WiFi', 'Water', 'Security', 'Cultural Area', 'Rooftop'] : amenitiesList[i % amenitiesList.length],
      security: {
        score: Number((3.5 + Math.random() * 1.5).toFixed(1)),
        askari24hr: i % 2 === 0,
        cctv: i % 4 === 0,
        fence: i % 3 === 0,
        compound: `${loc.name} ${isOldTown ? 'Heritage' : 'Beach'} Complex`
      },
      verified: i % 4 !== 0,
      rating: Number((3.5 + Math.random() * 1.5).toFixed(1)),
      reviews: 5 + (i % 25),
      distanceToUni: loc.dist + (i % 5) * 2.0,
      uniName: 'TUM',
      mpesaTill: `HC00${1000 + idCounter}`,
      touristFriendly: true,
      beachDistance: 0.3 + (i % 5) * 0.4
    });
  }
  
  return properties;
}

// Generate all properties
export const mockProperties: Property[] = generateProperties();

export const matatuRoutes: MatatuRoute[] = [
  { id: '1', name: 'Route 100', start: 'Tudor', end: 'TUM Campus', costKsh: 50, frequencyMin: 5, county: 'Mombasa' },
  { id: '2', name: 'Route 102', start: 'Mikindani', end: 'TUM Campus', costKsh: 70, frequencyMin: 8, county: 'Mombasa' },
  { id: '3', name: 'Route 105', start: 'Changamwe', end: 'TUM Campus', costKsh: 80, frequencyMin: 10, county: 'Mombasa' },
  { id: '4', name: 'Route 200', start: 'Kilifi Town', end: 'Pwani University', costKsh: 80, frequencyMin: 15, county: 'Kilifi' },
  { id: '5', name: 'Route 201', start: 'Malindi', end: 'Pwani University', costKsh: 120, frequencyMin: 20, county: 'Kilifi' },
  { id: '6', name: 'Route 300', start: 'Ukunda', end: 'Diani Beach', costKsh: 60, frequencyMin: 12, county: 'Kwale' },
  { id: '7', name: 'Route 400', start: 'Lamu Town', end: 'Shela Beach', costKsh: 100, frequencyMin: 30, county: 'Lamu' }
];

export const mockChats: Chat[] = [
  {
    id: '1',
    propertyId: '1',
    propertyTitle: 'Cozy 1BD Tudor Heights',
    propertyImage: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400',
    tenantId: 'T1',
    tenantName: 'Grace Mwangi',
    landlordId: 'LL1',
    landlordName: 'Juma Khalifa',
    messages: [
      {
        id: 'm1',
        senderId: 'T1',
        senderName: 'Grace Mwangi',
        text: 'Hi, is this property still available?',
        timestamp: '2026-01-14T10:32:00',
        type: 'text'
      },
      {
        id: 'm2',
        senderId: 'LL1',
        senderName: 'Juma Khalifa',
        text: 'Yes! It\'s available. Would you like to schedule a viewing?',
        timestamp: '2026-01-14T10:35:00',
        type: 'text'
      },
      {
        id: 'm3',
        senderId: 'T1',
        senderName: 'Grace Mwangi',
        text: 'Yes please! Can I view it tomorrow around 2 PM?',
        timestamp: '2026-01-14T10:36:00',
        type: 'text'
      }
    ],
    unread: 1,
    lastMessage: 'Yes please! Can I view it tomorrow around 2 PM?',
    lastMessageTime: '2026-01-14T10:36:00'
  }
];

export const chatbotResponses: Record<string, string> = {
  'hello': 'Karibu to HouseCom! 👋 How can I help you find your perfect coastal rental today?',
  'hi': 'Hello! Welcome to HouseCom. I\'m here to help you find verified rentals in Mombasa, Kilifi, Kwale, and Lamu. What are you looking for?',
  'search': 'I can help you search! Tell me:\n- Which county? (Mombasa, Kilifi, Kwale, Lamu)\n- Your budget (KSh)?\n- Number of bedrooms?\n- Any specific requirements?',
  'price': 'Our coastal properties range from KSh 5,000 to KSh 25,000 per month. Student hostels start at KSh 5,500. What\'s your budget?',
  'security': 'All HouseCom properties are verified for security! We rate each property on:\n✓ 24/7 Askari\n✓ CCTV\n✓ Fenced Compound\n✓ Security Score (1-5)\nWhat county are you interested in?',
  'payment': 'Payment via M-PESA is simple:\n1. Contact landlord via chat\n2. Get property Till Number\n3. Pay via M-PESA\n4. Upload payment proof\n5. Admin verifies\nWould you like to see payment-ready properties?',
  'matatu': 'I can show you matatu routes! Popular routes:\n🚌 Tudor → TUM: KSh 50 (5 mins)\n🚌 Kilifi → Pwani Uni: KSh 80 (15 mins)\n🚌 Malindi → Pwani Uni: KSh 120 (20 mins)\nWhich route interests you?',
  'tum': 'Looking for TUM accommodation? We have:\n✓ 20+ verified properties near TUM\n✓ Starting from KSh 5,000/month\n✓ Walking distance or matatu routes\n✓ Secure student compounds\nShall I show you options?',
  'pwani': 'Pwani University students! We have:\n✓ Student hostels from KSh 5,500\n✓ 20 properties in Kilifi & Malindi\n✓ Verified secure compounds\n✓ Good matatu connections\nWant to see available listings?',
  'beach': 'Beach properties available in:\n🏖️ Diani Beach (Kwale) - from KSh 12,000\n🏖️ Malindi Beach (Kilifi) - from KSh 12,000\n🏖️ Lamu beaches - from KSh 6,000\nTourist-friendly with beach access! Interested?',
  'help': 'I can help you with:\n✅ Finding properties by county/price\n✅ Security information\n✅ Matatu routes & costs\n✅ M-PESA payment process\n✅ University accommodation\n✅ Beach properties\nWhat would you like to know?',
  'landlord': 'Are you a landlord? Great!\n✅ List properties FREE\n✅ Reach verified tenants\n✅ Chat directly with prospects\n✅ M-PESA Till integration\n✅ Analytics dashboard\nClick "Add Property" to start!',
  'verified': 'All HouseCom properties are verified!\n✓ Landlord ID check\n✓ Property inspection\n✓ Security assessment\n✓ Title deed verification\nLook for the ✅ Verified badge!',
  'county': 'We cover 4 coastal counties:\n📍 Mombasa - 20 properties\n📍 Kilifi - 20 properties\n📍 Kwale - 20 properties\n📍 Lamu - 20 properties\nWhich county interests you?',
  'default': 'I\'m here to help! Try asking me about:\n• Searching properties\n• Security ratings\n• Matatu routes\n• Payment process\n• TUM or Pwani Uni housing\n• Beach properties\nOr just say "help" 😊'
};