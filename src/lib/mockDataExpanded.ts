// Expanded Mock Data for HouseCom MVP - 160 properties total (40 per county)

import { Property } from './mockData';

// Property generator function with more variety
export function generateExpandedProperties(): Property[] {
  const properties: Property[] = [];
  
  // Expanded Mombasa locations (40 properties)
  const mombasaLocations = [
    { name: 'Tudor', lat: -4.0435, lng: 39.6682, dist: 0.8 },
    { name: 'Mikindani', lat: -4.0547, lng: 39.6744, dist: 1.2 },
    { name: 'Changamwe', lat: -4.0219, lng: 39.6346, dist: 2.5 },
    { name: 'Buxton', lat: -4.0500, lng: 39.6700, dist: 1.5 },
    { name: 'Bamburi', lat: -3.9858, lng: 39.7288, dist: 8.2 },
    { name: 'Nyali', lat: -4.0500, lng: 39.7000, dist: 6.5 },
    { name: 'Likoni', lat: -4.0833, lng: 39.6667, dist: 4.2 },
    { name: 'Bombolulu', lat: -4.0219, lng: 39.6900, dist: 5.8 },
    { name: 'Mombasa CBD', lat: -4.0559, lng: 39.6649, dist: 2.0 },
    { name: 'Kizingo', lat: -4.0681, lng: 39.6767, dist: 3.0 },
    { name: 'Shimanzi', lat: -4.0547, lng: 39.6410, dist: 2.2 },
    { name: 'Makupa', lat: -4.0342, lng: 39.6565, dist: 1.8 },
    { name: 'Kongowea', lat: -4.0124, lng: 39.6456, dist: 3.5 },
    { name: 'Kipevu', lat: -4.0245, lng: 39.6290, dist: 2.8 },
  ];
  
  // Expanded Kilifi locations (40 properties)
  const kilifiLocations = [
    { name: 'Kilifi Town', lat: -3.6309, lng: 39.8468, dist: 0.5 },
    { name: 'Malindi Town', lat: -3.2186, lng: 40.1169, dist: 8.5 },
    { name: 'Watamu', lat: -3.3583, lng: 40.0333, dist: 12.0 },
    { name: 'Mtwapa', lat: -3.9500, lng: 39.7333, dist: 15.2 },
    { name: 'Takaungu', lat: -3.6833, lng: 39.8500, dist: 5.5 },
    { name: 'Kikambala', lat: -3.8833, lng: 39.7667, dist: 18.0 },
    { name: 'Vipingo', lat: -3.8167, lng: 39.7500, dist: 20.0 },
    { name: 'Gede', lat: -3.3000, lng: 40.0167, dist: 14.5 },
    { name: 'Mambrui', lat: -3.1167, lng: 40.1833, dist: 10.0 },
  ];
  
  // Expanded Kwale locations (40 properties)
  const kwaleLocations = [
    { name: 'Diani Beach', lat: -4.3201, lng: 39.5809, dist: 35.0 },
    { name: 'Ukunda', lat: -4.2833, lng: 39.5667, dist: 32.0 },
    { name: 'Msambweni', lat: -4.4667, lng: 39.4833, dist: 45.0 },
    { name: 'Lunga Lunga', lat: -4.5667, lng: 39.4167, dist: 52.0 },
    { name: 'Kinango', lat: -3.9333, lng: 39.2833, dist: 55.0 },
    { name: 'Shimba Hills', lat: -4.2330, lng: 39.3830, dist: 42.0 },
    { name: 'Tiwi Beach', lat: -4.3500, lng: 39.5500, dist: 37.0 },
    { name: 'Gazi', lat: -4.4167, lng: 39.5000, dist: 40.0 },
  ];
  
  // Expanded Lamu locations (40 properties)
  const lamuLocations = [
    { name: 'Lamu Old Town', lat: -2.2717, lng: 40.9020, dist: 150.0 },
    { name: 'Shela Village', lat: -2.2617, lng: 40.9120, dist: 152.0 },
    { name: 'Matondoni', lat: -2.2317, lng: 40.8920, dist: 155.0 },
    { name: 'Manda Island', lat: -2.2500, lng: 40.9500, dist: 153.0 },
    { name: 'Pate Island', lat: -2.2000, lng: 41.0000, dist: 160.0 },
    { name: 'Kipungani', lat: -2.3500, lng: 40.9200, dist: 158.0 },
  ];
  
  // Expanded property types with more room options
  const propertyTypes = [
    // Single rooms / Bedsitters
    { type: 'Bedsitter', bedrooms: 1, bathrooms: 1, desc: 'Affordable bedsitter with kitchenette', priceBase: 4500 },
    { type: 'Single Room', bedrooms: 1, bathrooms: 1, desc: 'Compact single room with shared facilities', priceBase: 3500 },
    { type: 'Self-Contained Bedsitter', bedrooms: 1, bathrooms: 1, desc: 'Self-contained bedsitter with private bathroom', priceBase: 5500 },
    
    // Studios
    { type: 'Studio', bedrooms: 1, bathrooms: 1, desc: 'Modern studio apartment', priceBase: 6000 },
    { type: 'Bachelor Pad', bedrooms: 1, bathrooms: 1, desc: 'Compact bachelor unit', priceBase: 5800 },
    
    // One bedroom
    { type: '1BD Apartment', bedrooms: 1, bathrooms: 1, desc: 'Cozy 1-bedroom apartment', priceBase: 7000 },
    { type: '1BD with Study', bedrooms: 1, bathrooms: 1, desc: '1-bedroom apartment with study room', priceBase: 8500 },
    { type: '1BD Ensuite', bedrooms: 1, bathrooms: 1, desc: 'Modern 1-bedroom ensuite apartment', priceBase: 8000 },
    
    // Two bedrooms
    { type: '2BD Apartment', bedrooms: 2, bathrooms: 1, desc: 'Spacious 2-bedroom apartment', priceBase: 10000 },
    { type: '2BD Ensuite', bedrooms: 2, bathrooms: 2, desc: '2-bedroom master ensuite apartment', priceBase: 12500 },
    { type: '2BD Townhouse', bedrooms: 2, bathrooms: 2, desc: 'Modern 2-bedroom townhouse', priceBase: 15000 },
    
    // Three bedrooms and larger
    { type: '3BD Apartment', bedrooms: 3, bathrooms: 2, desc: 'Family-friendly 3-bedroom apartment', priceBase: 18000 },
    { type: '3BD House', bedrooms: 3, bathrooms: 2, desc: 'Spacious 3-bedroom house', priceBase: 22000 },
    { type: '4BD Villa', bedrooms: 4, bathrooms: 3, desc: 'Luxury 4-bedroom villa', priceBase: 35000 },
  ];
  
  const amenitiesList = [
    ['WiFi', '24/7 Water', 'Parking', 'Security', 'Kitchen'],
    ['WiFi', '24/7 Water', 'Security', 'Kitchen', 'Balcony'],
    ['WiFi', 'Water', 'Parking', 'Security', 'Generator'],
    ['WiFi', '24/7 Water', 'Parking', 'Security', 'Kitchen', 'Balcony', 'CCTV'],
    ['WiFi', '24/7 Water', 'Beach Access', 'Security', 'Kitchen', 'Pool'],
    ['WiFi', 'Water', 'Security', 'Gym', 'Kitchen'],
    ['WiFi', '24/7 Water', 'Parking', 'CCTV', 'Compound', 'Kitchen'],
    ['WiFi', '24/7 Water', 'Generator', 'Security', 'Kitchen', 'Garden'],
  ];
  
  const landlordNames = [
    'Juma Khalifa', 'Amina Hassan', 'Omar Abdalla', 'Fatuma Ali', 'Hassan Mwalimu',
    'Zainab Mohamed', 'Ahmed Salim', 'Mwanajuma Said', 'Ali Rashid', 'Khadija Omar',
    'Mohamed Bakari', 'Halima Juma', 'Rashid Ali', 'Aziza Hassan', 'Hamisi Mwangi',
    'Mariam Saleh', 'Ibrahim Faraj', 'Rehema Abdalla', 'Salim Khamis', 'Asha Mohamed',
    'Bakari Suleiman', 'Safiya Juma', 'Yusuf Abdalla', 'Zawadi Hassan', 'Hamza Ali',
    'Farida Mohamed', 'Rashid Omar', 'Amani Salim', 'Hussein Bakari', 'Latifa Khamis'
  ];
  
  const images = [
    ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800'],
    ['https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800', 'https://images.unsplash.com/photo-1556912173-46c336c7fd55?w=800'],
    ['https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800', 'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=800'],
    ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800', 'https://images.unsplash.com/photo-1502672023488-70e25813eb80?w=800'],
    ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800', 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800'],
    ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800'],
    ['https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800', 'https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?w=800'],
  ];
  
  let idCounter = 1;
  
  // Generate Mombasa properties (40)
  for (let i = 0; i < 40; i++) {
    const loc = mombasaLocations[i % mombasaLocations.length];
    const propType = propertyTypes[i % propertyTypes.length];
    const landlord = landlordNames[i % landlordNames.length];
    const landlordId = i < 4 ? 'LL1' : `LL${(i % 20) + 10}`;
    
    properties.push({
      id: String(idCounter++),
      landlordId,
      landlordName: i < 4 ? 'Juma Khalifa' : landlord,
      landlordRating: Number((3.5 + Math.random() * 1.5).toFixed(1)),
      landlordVerified: i % 3 !== 0,
      title: `${propType.type} ${loc.name} - ${i % 2 === 0 ? 'Near TUM' : 'Secure Compound'}`,
      description: `${propType.desc} in ${loc.name}, Mombasa. Perfect for ${i % 2 === 0 ? 'TUM students' : 'young professionals'}. Features modern amenities and excellent security.`,
      price: propType.priceBase + (i % 8) * 500,
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
      verified: i % 5 !== 0,
      rating: Number((3.5 + Math.random() * 1.5).toFixed(1)),
      reviews: 5 + (i % 30),
      distanceToUni: loc.dist + (i % 5) * 0.2,
      uniName: 'TUM',
      mpesaTill: `HC00${1000 + idCounter}`,
      touristFriendly: i % 5 === 0
    });
  }
  
  // Generate Kilifi properties (40)
  for (let i = 0; i < 40; i++) {
    const loc = kilifiLocations[i % kilifiLocations.length];
    const propType = propertyTypes[i % propertyTypes.length];
    const landlord = landlordNames[i % landlordNames.length];
    const isBeachArea = loc.name.includes('Beach') || loc.name.includes('Malindi') || loc.name.includes('Watamu');
    
    properties.push({
      id: String(idCounter++),
      landlordId: `LL${(i % 25) + 30}`,
      landlordName: landlord,
      landlordRating: Number((3.5 + Math.random() * 1.5).toFixed(1)),
      landlordVerified: i % 3 !== 0,
      title: `${propType.type} ${loc.name} ${isBeachArea ? '- Ocean View' : '- Near Pwani Uni'}`,
      description: `${propType.desc} in ${loc.name}, Kilifi. ${isBeachArea ? 'Stunning ocean views and beach access' : 'Close to Pwani University'}. Modern amenities included.`,
      price: propType.priceBase + (isBeachArea ? 3000 : 0) + (i % 8) * 500,
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
      verified: i % 5 !== 0,
      rating: Number((3.5 + Math.random() * 1.5).toFixed(1)),
      reviews: 5 + (i % 25),
      distanceToUni: loc.dist + (i % 5) * 0.3,
      uniName: 'Pwani University',
      mpesaTill: `HC00${1000 + idCounter}`,
      touristFriendly: isBeachArea,
      beachDistance: isBeachArea ? 0.2 + (i % 5) * 0.2 : undefined
    });
  }
  
  // Generate Kwale properties (40)
  for (let i = 0; i < 40; i++) {
    const loc = kwaleLocations[i % kwaleLocations.length];
    const propType = propertyTypes[i % propertyTypes.length];
    const landlord = landlordNames[i % landlordNames.length];
    const isDiani = loc.name.includes('Diani') || loc.name.includes('Tiwi');
    
    properties.push({
      id: String(idCounter++),
      landlordId: `LL${(i % 25) + 55}`,
      landlordName: landlord,
      landlordRating: Number((3.5 + Math.random() * 1.5).toFixed(1)),
      landlordVerified: i % 3 !== 0,
      title: `${propType.type} ${loc.name}${isDiani ? ' - Beach Paradise' : ''}`,
      description: `${propType.desc} in ${loc.name}, Kwale. ${isDiani ? 'Premium beachfront living with tourist appeal' : 'Peaceful South Coast environment'}. Great amenities.`,
      price: propType.priceBase + (isDiani ? 4000 : 0) + (i % 8) * 500,
      county: 'Kwale',
      location: `${loc.name}, Kwale`,
      latitude: loc.lat + (Math.random() - 0.5) * 0.01,
      longitude: loc.lng + (Math.random() - 0.5) * 0.01,
      images: images[i % images.length],
      bedrooms: propType.bedrooms,
      bathrooms: propType.bathrooms,
      amenities: isDiani ? [...amenitiesList[i % amenitiesList.length], 'Beach Access', 'Ocean View'] : amenitiesList[i % amenitiesList.length],
      security: {
        score: Number((3.5 + Math.random() * 1.5).toFixed(1)),
        askari24hr: isDiani ? true : i % 2 === 0,
        cctv: i % 2 === 0,
        fence: true,
        compound: `${loc.name} ${isDiani ? 'Beach Resort' : 'Estate'}`
      },
      verified: i % 5 !== 0,
      rating: Number((3.8 + Math.random() * 1.2).toFixed(1)),
      reviews: 8 + (i % 35),
      distanceToUni: loc.dist,
      uniName: 'TUM',
      mpesaTill: `HC00${1000 + idCounter}`,
      touristFriendly: isDiani,
      beachDistance: isDiani ? 0.1 + (i % 4) * 0.15 : undefined
    });
  }
  
  // Generate Lamu properties (40)
  for (let i = 0; i < 40; i++) {
    const loc = lamuLocations[i % lamuLocations.length];
    const propType = propertyTypes[i % propertyTypes.length];
    const landlord = landlordNames[i % landlordNames.length];
    const isOldTown = loc.name.includes('Old Town') || loc.name.includes('Shela');
    
    properties.push({
      id: String(idCounter++),
      landlordId: `LL${(i % 20) + 80}`,
      landlordName: landlord,
      landlordRating: Number((3.5 + Math.random() * 1.5).toFixed(1)),
      landlordVerified: i % 4 !== 0,
      title: `${propType.type} ${loc.name}${isOldTown ? ' - Heritage Property' : ''}`,
      description: `${propType.desc} in ${loc.name}, Lamu. ${isOldTown ? 'Traditional Swahili architecture in UNESCO World Heritage Site' : 'Unique island living experience'}. Perfect for cultural tourism.`,
      price: propType.priceBase + (isOldTown ? 5000 : 3000) + (i % 8) * 500,
      county: 'Lamu',
      location: `${loc.name}, Lamu`,
      latitude: loc.lat + (Math.random() - 0.5) * 0.01,
      longitude: loc.lng + (Math.random() - 0.5) * 0.01,
      images: images[i % images.length],
      bedrooms: propType.bedrooms,
      bathrooms: propType.bathrooms,
      amenities: isOldTown ? [...amenitiesList[i % amenitiesList.length], 'Traditional Architecture'] : amenitiesList[i % amenitiesList.length],
      security: {
        score: Number((3.5 + Math.random() * 1.5).toFixed(1)),
        askari24hr: i % 3 === 0,
        cctv: i % 4 === 0,
        fence: i % 2 === 0,
        compound: `${loc.name} ${isOldTown ? 'Heritage Zone' : 'Community'}`
      },
      verified: i % 5 !== 0,
      rating: Number((3.8 + Math.random() * 1.2).toFixed(1)),
      reviews: 6 + (i % 28),
      distanceToUni: loc.dist,
      uniName: 'TUM',
      mpesaTill: `HC00${1000 + idCounter}`,
      touristFriendly: true,
      beachDistance: 0.3 + (i % 6) * 0.3
    });
  }
  
  return properties;
}
