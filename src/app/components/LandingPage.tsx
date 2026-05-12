import { useState, useEffect } from 'react';
import { Search, Shield, MapPin, MessageSquare, CheckCircle, Star, Bus, Lock, Waves, TrendingUp, Users, Home, ChevronRight } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Slider } from '@/app/components/ui/slider';
import { Page } from '@/app/App';
import { mockProperties } from '@/lib/mockData';
import { AnimatedCounter } from '@/app/components/AnimatedCounter';
import { useScrollReveal } from '@/app/hooks/useScrollReveal';
import * as api from '@/lib/apiService';

interface LandingPageProps {
  onNavigate: (page: Page, data?: any) => void;
}

const COUNTY_DATA = [
  {
    name: 'Mombasa',
    description: 'Verified rentals near TUM & CBD',
    listings: 20,
    avgPrice: 'KSh 7,500',
    color: 'from-blue-900/80 to-blue-700/60',
    accent: 'bg-blue-500',
    img: 'https://images.unsplash.com/photo-1652511928669-f3ce2797913b?w=800&q=80',
    emoji: '🏙️',
  },
  {
    name: 'Kilifi',
    description: 'Pwani Uni student housing & creek views',
    listings: 20,
    avgPrice: 'KSh 8,200',
    color: 'from-teal-900/80 to-teal-700/60',
    accent: 'bg-teal-500',
    img: 'https://images.unsplash.com/photo-1589556183130-530470785fab?w=800&q=80',
    emoji: '🌿',
  },
  {
    name: 'Kwale',
    description: 'Diani beach & Ukunda student hostels',
    listings: 20,
    avgPrice: 'KSh 12,500',
    color: 'from-cyan-900/80 to-cyan-700/60',
    accent: 'bg-cyan-500',
    img: 'https://images.unsplash.com/photo-1667935837291-1dc178866251?w=800&q=80',
    emoji: '🏖️',
  },
  {
    name: 'Lamu',
    description: 'Old Town heritage & island rentals',
    listings: 20,
    avgPrice: 'KSh 7,800',
    color: 'from-amber-900/80 to-amber-700/60',
    accent: 'bg-amber-500',
    img: 'https://images.unsplash.com/photo-1558907530-b6ac430f8a8c?w=800&q=80',
    emoji: '⛵',
  },
];

const STATS = [
  { label: 'Students & Workers', target: 500, suffix: 'K+', icon: Users, color: 'text-blue-400' },
  { label: 'Verified Listings', target: 80, suffix: '', icon: Home, color: 'text-green-400' },
  { label: 'Counties Covered', target: 4, suffix: '', icon: MapPin, color: 'text-teal-400' },
  { label: 'Verified Rate', target: 98, suffix: '%', icon: Shield, color: 'text-yellow-400' },
];

export function LandingPage({ onNavigate }: LandingPageProps) {
  const [searchCounty, setSearchCounty] = useState('Mombasa');
  const [priceRange, setPriceRange] = useState([5000, 15000]);
  const [bedrooms, setBedrooms] = useState('1');
  const [language, setLanguage] = useState<'en' | 'sw'>('en');
  const [langKey, setLangKey] = useState(0);
  const [featuredProperties, setFeaturedProperties] = useState<any[]>(mockProperties.slice(0, 6));
  const featuresRef = useScrollReveal();
  const countyRef = useScrollReveal();
  const whyRef = useScrollReveal();
  const statsRef = useScrollReveal();

  useEffect(() => {
    api.getProperties({ limit: 6 })
      .then(res => { if (res.properties?.length) setFeaturedProperties(res.properties); })
      .catch(() => setFeaturedProperties(mockProperties.slice(0, 6)));
  }, []);

  const handleSearch = () => {
    onNavigate('search', {
      searchParams: {
        county: searchCounty,
        minPrice: priceRange[0],
        maxPrice: priceRange[1],
        bedrooms: parseInt(bedrooms),
      },
    });
  };

  const handleCountyClick = (county: string) => {
    onNavigate('search', {
      searchParams: { county, minPrice: 3000, maxPrice: 25000, bedrooms: 1 },
    });
  };

  const toggleLanguage = () => {
    setLanguage((l) => (l === 'en' ? 'sw' : 'en'));
    setLangKey((k) => k + 1);
  };

  const translations = {
    en: {
      hero: 'Find Verified Rentals in Coastal Kenya',
      heroSub: 'Safe • Affordable • Student-Approved Housing',
      heroBody: 'Serving TUM, Pwani University, and 500K+ students & workers across Mombasa, Kilifi, Kwale & Lamu counties.',
      search: 'Search Properties',
      county: 'County',
      price: 'Price Range',
      beds: 'Bedrooms',
      featured: 'Featured Properties',
      allProps: 'View All Properties →',
      counties: 'Explore by County',
      why: 'Why HouseCom?',
      verified: '100% Verified Listings',
      verifiedDesc: 'Every landlord and property is identity-verified before listing. Zero fraud, guaranteed.',
      maps: 'Campus & Matatu Info',
      mapsDesc: 'See exact km to your university plus matatu route numbers, costs, and frequency.',
      chat: 'Secure Direct Chat',
      chatDesc: 'Message verified landlords safely inside the app. No unknown phone numbers needed.',
      security: 'Compound Security Scores',
      securityDesc: 'Check 24hr Askari, CCTV, fencing, and lighting ratings before you visit.',
      mpesa: 'M-PESA Ready',
      mpesaDesc: 'Pay rent directly via M-PESA till numbers. Upload proof, landlord gets notified instantly.',
      swahili: 'Bilingual Support',
      swahiliDesc: 'Full English & Swahili interface so no coastal student is left behind.',
      signup: 'Sign Up Free',
      login: 'Login',
      cta: 'Ready to find your next home?',
      ctaSub: 'Join 500K+ coastal students & workers on HouseCom today.',
      ctaBtn: 'Get Started Free',
    },
    sw: {
      hero: 'Pata Nyumba Zilizothibitishwa Pwani ya Kenya',
      heroSub: 'Salama • Bei Nafuu • Inapendelewa na Wanafunzi',
      heroBody: 'Inahudumia TUM, Pwani Uni, na wanafunzi 500K+ kaunti za Mombasa, Kilifi, Kwale & Lamu.',
      search: 'Tafuta Nyumba',
      county: 'Kaunti',
      price: 'Bei',
      beds: 'Vyumba',
      featured: 'Nyumba Maarufu',
      allProps: 'Ona Nyumba Zote →',
      counties: 'Tafuta kwa Kaunti',
      why: 'Kwa Nini HouseCom?',
      verified: 'Nyumba 100% Zilizothibitishwa',
      verifiedDesc: 'Kila mmiliki na nyumba imethibitishwa kabla ya kutangaza. Hakuna udanganyifu.',
      maps: 'Umbali wa Chuo & Matatu',
      mapsDesc: 'Ona km hadi chuo chako na namba za matatu, gharama, na muda wa kusubiri.',
      chat: 'Mazungumzo Salama',
      chatDesc: 'Piga mazungumzo na wamiliki walioidhibitishwa ndani ya programu. Salama kabisa.',
      security: 'Alama za Usalama',
      securityDesc: 'Angalia Askari 24hr, CCTV, ua, na taa kabla ya kutembelea.',
      mpesa: 'M-PESA Tayari',
      mpesaDesc: 'Lipa kodi moja kwa moja kupitia M-PESA. Pakia uthibitisho, mmiliki anapata taarifa.',
      swahili: 'Lugha Mbili',
      swahiliDesc: 'Kiingereza na Kiswahili ili hakuna mwanafunzi wa pwani atakaachwa nyuma.',
      signup: 'Jisajili Bure',
      login: 'Ingia',
      cta: 'Uko Tayari Kupata Nyumba Yako?',
      ctaSub: 'Jiunge na wanafunzi & wafanyakazi 500K+ wa pwani kwenye HouseCom leo.',
      ctaBtn: 'Anza Bure',
    },
  };

  const t = translations[language];

  return (
    <div className="min-h-screen" key={langKey} style={{ animation: 'langFade 0.25s ease forwards' }}>
      {/* ── NAVBAR ── */}
      <header className="bg-white/95 backdrop-blur-md border-b sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center shadow-md">
                  <Home className="h-5 w-5 text-white" />
                </div>
              </div>
              <div>
                <h1 className="font-poppins font-bold text-xl text-gray-900 leading-none">HouseCom</h1>
                <p className="text-[10px] text-teal-600 font-medium tracking-wider uppercase">Coastal Rentals</p>
              </div>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleLanguage}
                className="text-xs px-3 py-1.5 rounded-full border border-gray-200 hover:bg-gray-50 font-medium transition-all hover:border-blue-300 hover:text-blue-600"
              >
                {language === 'en' ? '🇬🇧 EN' : '🇰🇪 SW'}
              </button>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('login')}>
                {t.login}
              </Button>
              <Button
                size="sm"
                onClick={() => onNavigate('signup')}
                className="btn-shimmer text-white border-0 rounded-full px-5"
              >
                {t.signup}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="hero-gradient text-white relative overflow-hidden" style={{ minHeight: '88vh' }}>
        {/* Overlay photo */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-15"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1763287901011-f116861d7a91?w=1400&q=80')` }}
        />
        {/* Decorative blobs */}
        <div className="absolute top-20 right-20 w-72 h-72 bg-teal-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-blue-300/15 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative z-10 py-24 flex flex-col items-center text-center">
          {/* Pill badge */}
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-6 text-sm font-medium">
            <Waves className="h-4 w-4 text-teal-300" />
            <span>Coastal Kenya's #1 Verified Rental Platform</span>
          </div>

          <h2 className="font-poppins text-4xl md:text-6xl font-bold mb-5 leading-tight max-w-3xl">
            {t.hero}
          </h2>
          <p className="text-xl text-blue-100 mb-3 font-medium">{t.heroSub}</p>
          <p className="text-blue-200 mb-10 max-w-xl">{t.heroBody}</p>

          {/* Search Card */}
          <Card className="w-full max-w-3xl shadow-2xl border-0">
            <CardContent className="p-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase tracking-wider">
                    {t.county}
                  </label>
                  <Select value={searchCounty} onValueChange={setSearchCounty}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mombasa">🏙️ Mombasa</SelectItem>
                      <SelectItem value="Kilifi">🌿 Kilifi</SelectItem>
                      <SelectItem value="Kwale">🏖️ Kwale</SelectItem>
                      <SelectItem value="Lamu">⛵ Lamu</SelectItem>
                      <SelectItem value="All">🌊 All Coast</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase tracking-wider">
                    {t.price}
                  </label>
                  <div className="pt-2">
                    <Slider
                      value={priceRange}
                      onValueChange={setPriceRange}
                      min={3000}
                      max={25000}
                      step={500}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-blue-600 font-semibold mt-1">
                      <span>KSh {priceRange[0].toLocaleString()}</span>
                      <span>KSh {priceRange[1].toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase tracking-wider">
                    {t.beds}
                  </label>
                  <Select value={bedrooms} onValueChange={setBedrooms}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Bed</SelectItem>
                      <SelectItem value="2">2 Beds</SelectItem>
                      <SelectItem value="3">3 Beds</SelectItem>
                      <SelectItem value="4">4+ Beds</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button
                    onClick={handleSearch}
                    className="w-full btn-shimmer text-white border-0 rounded-xl h-10"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    {t.search}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick links */}
          <div className="flex flex-wrap gap-3 mt-6 justify-center">
            {[
              { label: 'Near TUM', params: { county: 'Mombasa', minPrice: 3000, maxPrice: 12000, bedrooms: 1 } },
              { label: 'Pwani Uni', params: { county: 'Kilifi', minPrice: 3000, maxPrice: 12000, bedrooms: 1 } },
              { label: 'Diani Beach', params: { county: 'Kwale', minPrice: 5000, maxPrice: 25000, bedrooms: 1 } },
              { label: 'Lamu Old Town', params: { county: 'Lamu', minPrice: 3000, maxPrice: 15000, bedrooms: 1 } },
              { label: 'Under KSh 8k', params: { county: 'All', minPrice: 3000, maxPrice: 8000, bedrooms: 1 } },
            ].map((q) => (
              <button
                key={q.label}
                onClick={() => onNavigate('search', { searchParams: q.params })}
                className="text-sm bg-white/10 hover:bg-white/20 border border-white/20 rounded-full px-4 py-1.5 transition-all hover:scale-105"
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>

        {/* Wave bottom */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 80L1440 80L1440 20C1200 70 1000 0 720 30C440 60 240 10 0 50L0 80Z" fill="rgb(249 250 251)" />
          </svg>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="bg-gray-50 py-14" ref={statsRef as any}>
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((stat, i) => (
              <div
                key={stat.label}
                className={`reveal reveal-delay-${i + 1} text-center`}
              >
                <div className="h-14 w-14 rounded-2xl bg-white shadow-md flex items-center justify-center mx-auto mb-3">
                  <stat.icon className={`h-7 w-7 ${stat.color}`} />
                </div>
                <div className={`font-poppins text-3xl font-bold text-gray-900 mb-1`}>
                  <AnimatedCounter target={stat.target} suffix={stat.suffix} />
                </div>
                <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED PROPERTIES ── */}
      <section className="py-16 bg-white" ref={featuresRef as any}>
        <div className="container mx-auto px-4">
          <div className="reveal text-center mb-10">
            <p className="text-teal-600 font-semibold text-sm uppercase tracking-wider mb-2">Fresh Listings</p>
            <h3 className="font-poppins text-3xl font-bold text-gray-900">{t.featured}</h3>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProperties.map((property, i) => (
              <div
                key={property.id}
                className={`reveal reveal-delay-${Math.min(i + 1, 5)} property-card bg-white rounded-2xl overflow-hidden border border-gray-100 cursor-pointer`}
                onClick={() => onNavigate('property-detail', { selectedPropertyId: property.id })}
              >
                {/* Image */}
                <div className="relative h-52 overflow-hidden bg-gray-100">
                  <img
                    src={property.images[0]}
                    alt={property.title}
                    className="card-img w-full h-full object-cover"
                  />
                  {/* Overlay on hover: View button */}
                  <div className="view-btn absolute inset-x-0 bottom-0 p-3">
                    <div className="bg-white/90 backdrop-blur-sm rounded-xl py-2 text-center text-sm font-semibold text-blue-600 flex items-center justify-center gap-1">
                      View Details <ChevronRight className="h-4 w-4" />
                    </div>
                  </div>
                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    {property.verified && (
                      <span className="verified-glow bg-green-500 text-white px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" /> Verified
                      </span>
                    )}
                  </div>
                  <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-xs font-bold">
                    {property.county}
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <h4 className="font-semibold text-gray-900 mb-1 line-clamp-1">{property.title}</h4>
                  <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                    <MapPin className="h-3 w-3" />
                    <span className="line-clamp-1">{property.location}</span>
                  </div>

                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-blue-600 font-bold text-lg">KSh {property.price.toLocaleString()}</div>
                      <div className="text-xs text-gray-400">/month</div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-semibold text-gray-800">{property.rating}</span>
                        <span className="text-xs text-gray-400">({property.reviews})</span>
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        🛏 {property.bedrooms} · 🚿 {property.bathrooms}
                      </div>
                    </div>
                  </div>

                  {/* Matatu & Security pill */}
                  <div className="flex gap-2 mt-3">
                    <span className="text-xs bg-blue-50 text-blue-700 rounded-full px-2.5 py-1 font-medium">
                      🚌 {property.distanceToUni}km to {property.uniName}
                    </span>
                    <span className="text-xs bg-green-50 text-green-700 rounded-full px-2.5 py-1 font-medium">
                      🔒 {property.security?.score ?? 4}/5
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-10 reveal">
            <Button
              size="lg"
              onClick={() => onNavigate('search')}
              className="rounded-full px-8 bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white transition-all duration-300"
            >
              {t.allProps}
            </Button>
          </div>
        </div>
      </section>

      {/* ── COUNTIES ── */}
      <section className="py-16 bg-gray-50" ref={countyRef as any}>
        <div className="container mx-auto px-4">
          <div className="reveal text-center mb-10">
            <p className="text-teal-600 font-semibold text-sm uppercase tracking-wider mb-2">4 Counties</p>
            <h3 className="font-poppins text-3xl font-bold text-gray-900">{t.counties}</h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {COUNTY_DATA.map((c, i) => (
              <div
                key={c.name}
                className={`reveal reveal-delay-${i + 1} county-card rounded-2xl overflow-hidden cursor-pointer h-56 relative`}
                onClick={() => handleCountyClick(c.name)}
              >
                {/* Background photo */}
                <img
                  src={c.img}
                  alt={c.name}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                {/* Gradient overlay */}
                <div className={`absolute inset-0 bg-gradient-to-t ${c.color}`} />

                {/* Content */}
                <div className="relative z-10 h-full flex flex-col justify-end p-4 text-white">
                  <div className="text-2xl mb-1">{c.emoji}</div>
                  <h4 className="font-poppins font-bold text-lg leading-tight">{c.name}</h4>
                  <p className="text-xs text-white/80 mb-2 line-clamp-2">{c.description}</p>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs ${c.accent} bg-opacity-90 rounded-full px-2 py-0.5 font-semibold`}>
                      {c.listings} listings
                    </span>
                    <span className="text-xs text-white/80">avg {c.avgPrice}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY HOUSECOM ── */}
      <section className="py-16 bg-white" ref={whyRef as any}>
        <div className="container mx-auto px-4">
          <div className="reveal text-center mb-12">
            <p className="text-teal-600 font-semibold text-sm uppercase tracking-wider mb-2">Built for Coastal Kenya</p>
            <h3 className="font-poppins text-3xl font-bold text-gray-900">{t.why}</h3>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100', title: t.verified, desc: t.verifiedDesc, delay: 1 },
              { icon: Bus, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', title: t.maps, desc: t.mapsDesc, delay: 2 },
              { icon: MessageSquare, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100', title: t.chat, desc: t.chatDesc, delay: 3 },
              { icon: Lock, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100', title: t.security, desc: t.securityDesc, delay: 1 },
              { icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100', title: t.mpesa, desc: t.mpesaDesc, delay: 2 },
              { icon: Waves, color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-100', title: t.swahili, desc: t.swahiliDesc, delay: 3 },
            ].map((item) => (
              <div
                key={item.title}
                className={`reveal reveal-delay-${item.delay} rounded-2xl border ${item.border} p-6 hover:shadow-lg transition-shadow`}
              >
                <div className={`h-14 w-14 rounded-2xl ${item.bg} flex items-center justify-center mb-4`}>
                  <item.icon className={`h-7 w-7 ${item.color}`} />
                </div>
                <h4 className="font-poppins font-semibold text-gray-900 mb-2">{item.title}</h4>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="hero-gradient text-white py-16 relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-10"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1667935837291-1dc178866251?w=1200&q=80')` }}
        />
        <div className="container mx-auto px-4 text-center relative z-10">
          <h3 className="font-poppins text-3xl md:text-4xl font-bold mb-3">{t.cta}</h3>
          <p className="text-blue-100 mb-8 text-lg">{t.ctaSub}</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => onNavigate('signup')}
              className="bg-white text-blue-600 hover:bg-blue-50 rounded-full px-8 font-semibold"
            >
              {t.ctaBtn}
            </Button>
            <Button
              size="lg"
              onClick={() => onNavigate('search')}
              variant="outline"
              className="border-white text-white hover:bg-white/10 rounded-full px-8"
            >
              Browse Listings
            </Button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center">
                  <Home className="h-4 w-4 text-white" />
                </div>
                <span className="font-poppins font-bold text-lg">HouseCom</span>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                Verified coastal rentals for students and workers across Mombasa, Kilifi, Kwale & Lamu.
              </p>
              {/* Social icons */}
              <div className="flex gap-3 mt-4">
                {[
                  { label: 'WhatsApp', color: '#25D366', href: '#', icon: '💬' },
                  { label: 'Instagram', color: '#E1306C', href: '#', icon: '📸' },
                  { label: 'Facebook', color: '#1877F2', href: '#', icon: '👥' },
                  { label: 'TikTok', color: '#ffffff', href: '#', icon: '🎵' },
                ].map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    className="h-8 w-8 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-sm transition-colors"
                    title={s.label}
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h6 className="font-semibold mb-3 text-white">Quick Links</h6>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><button onClick={() => onNavigate('search')} className="hover:text-teal-400 transition-colors">Search Properties</button></li>
                <li><button onClick={() => onNavigate('matatu-routes')} className="hover:text-teal-400 transition-colors">Matatu Routes</button></li>
                <li><button onClick={() => onNavigate('signup')} className="hover:text-teal-400 transition-colors">Sign Up Free</button></li>
                <li><button onClick={() => onNavigate('login')} className="hover:text-teal-400 transition-colors">Landlord Login</button></li>
              </ul>
            </div>

            {/* Counties */}
            <div>
              <h6 className="font-semibold mb-3 text-white">Counties</h6>
              <ul className="space-y-2 text-sm text-gray-400">
                {['Mombasa', 'Kilifi', 'Kwale', 'Lamu'].map((c) => (
                  <li key={c}>
                    <button onClick={() => handleCountyClick(c)} className="hover:text-teal-400 transition-colors">
                      {c} Rentals
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h6 className="font-semibold mb-3 text-white">Contact</h6>
              <div className="text-sm text-gray-400 space-y-1">
                <p>Technical University of Mombasa</p>
                <p>Final Year Project 2026</p>
                <p className="text-teal-400">info@housecom.co.ke</p>
                <p>+254 700 000 000</p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-500">
            <p>© 2026 HouseCom MVP • TUM Final Year Project • SMART Technology</p>
            <div className="flex gap-4">
              <button className="hover:text-gray-300 transition-colors">Privacy Policy</button>
              <button className="hover:text-gray-300 transition-colors">Terms of Service</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}