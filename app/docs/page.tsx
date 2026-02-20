/**
 * 📚 Documentation Page
 * Complete technical documentation for CryptoGift Wallets DAO
 * 🌐 i18n: Full translation support for EN/ES
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Navbar, NavbarSpacer } from '@/components/layout/Navbar';
import { TeamSection } from '@/components/apex';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText,
  Coins,
  Code,
  Vote,
  Map,
  ExternalLink,
  CheckCircle2,
  CheckCircle,
  Clock,
  AlertTriangle,
  Shield,
  Target,
  Users,
  Zap,
  BookOpen,
  Globe,
  Github,
  MessageCircle,
  Mail,
  Twitter,
  ChevronRight,
  ChevronLeft,
  Copy,
  Download,
  TrendingUp,
  Link2,
  Heart,
  Sparkles,
  Gift,
  Lightbulb,
  Trophy
} from 'lucide-react';
import Image from 'next/image';

// Contract addresses - Updated December 2025 with new governance model
const CONTRACTS = {
  cgcToken: '0x5e3a61b550328f3D8C44f60b3e10a49D3d806175',
  aragonDAO: '0x3244DFBf9E5374DF2f106E89Cf7972E5D4C9ac31',
  timelockController: '0x9753d772C632e2d117b81d96939B878D74fB5166',
  minterGateway: '0xdd10540847a4495e21f01230a0d39C7c6785598F',
  milestoneEscrow: '0x8346CFcaECc90d678d862319449E5a742c03f109',
  masterController: '0x67D9a01A3F7b5D38694Bb78dD39286Db75D7D869',
  taskRules: '0xdDcfFF04eC6D8148CDdE3dBde42456fB32bcC5bb',
};

// Distribution data - Aligned with Whitepaper v1.2 (December 2025)
const DISTRIBUTION = [
  { key: 'referrals', percentage: 25, amount: '500,000' },
  { key: 'educational', percentage: 20, amount: '400,000' },
  { key: 'treasury', percentage: 25, amount: '500,000' },
  { key: 'contributors', percentage: 15, amount: '300,000' },
  { key: 'liquidity', percentage: 10, amount: '200,000' },
  { key: 'reserve', percentage: 5, amount: '100,000' },
];

// Emission caps
const CAPS = [
  { key: 'annual', value: '800,000 CGC' },
  { key: 'monthly', value: '66,666 CGC' },
  { key: 'weekly', value: '16,666 CGC' },
  { key: 'daily', value: '333 CGC' },
];

// Valid tab values for URL query params
const VALID_TABS = ['aboutus', 'whitepaper', 'tokenomics', 'contracts', 'governance', 'roadmap', 'verification'];

export default function DocsPage() {
  const t = useTranslations('docs');
  const tLanding = useTranslations('landing');
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const initialTab = tabParam && VALID_TABS.includes(tabParam) ? tabParam : 'aboutus';
  const [activeTab, setActiveTab] = useState(initialTab);

  // Mobile detection for responsive carousel (2 cards on mobile, 3 on desktop)
  const [isMobile, setIsMobile] = useState(false);
  const [expandedCard, setExpandedCard] = useState<number | null>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Cards per view based on viewport
  const cardsPerView = isMobile ? 2 : 3;
  // Focus areas data (5 areas) - with optional background images and custom stickers
  // Each area has a thematic title color with UV glow effect
  const focusAreas = [
    {
      key: 'emotional',
      icon: Heart,
      gradient: 'from-red-400 to-pink-500',
      bgImage: '/focus-areas/emocional.jpg',
      stickerImage: '/focus-areas/corazon.png',
      stickerScale: 1.35, // Scale up to match DAO logo visual size
      titleColor: '#FF6B9D', // Pink/Rose - emotions, heart
      titleGlow: 'rgba(255,107,157,0.8), rgba(255,20,147,0.5)', // Pink glow
    },
    {
      key: 'artistic',
      icon: Gift,
      gradient: 'from-amber-400 to-orange-500',
      bgImage: '/focus-areas/galeria.jpg',
      stickerImage: '/farcaster-icon-1024.png',
      stickerScale: 1.45, // Scale up more (smallest original)
      titleColor: '#00E5FF', // Cyan/Turquoise - creativity, gifts
      titleGlow: 'rgba(0,229,255,0.8), rgba(0,188,212,0.5)', // Cyan glow
    },
    {
      key: 'community',
      icon: Users,
      gradient: 'from-purple-400 to-indigo-500',
      bgImage: '/focus-areas/community.jpg',
      stickerImage: '/focus-areas/sticker-dao.png', // DAO community sticker
      stickerScale: 1.35, // Reset to match same-size stickers
      titleColor: '#A855F7', // Purple - community, DAO
      titleGlow: 'rgba(168,85,247,0.8), rgba(139,92,246,0.5)', // Purple glow
    },
    {
      key: 'laboratory',
      icon: Lightbulb,
      gradient: 'from-green-400 to-emerald-500',
      bgImage: '/focus-areas/laboratory.jpg',
      stickerImage: '/focus-areas/sticker-lab-new.png', // NEW Innovation lab sticker
      stickerScale: 1.35, // Reset to match same-size stickers
      titleColor: '#22C55E', // Green - innovation, experiments
      titleGlow: 'rgba(34,197,94,0.8), rgba(16,185,129,0.5)', // Green glow
    },
    {
      key: 'competitions',
      icon: Trophy,
      gradient: 'from-yellow-400 to-amber-500',
      bgImage: '/focus-areas/competitions.jpg',
      stickerImage: '/focus-areas/sticker-comp.png', // Competitions trophy sticker
      stickerScale: 1.35, // Reset to match same-size stickers
      titleColor: '#FFD700', // Gold - trophies, victories
      titleGlow: 'rgba(255,215,0,0.8), rgba(255,165,0,0.5)', // Gold glow
    },
  ];

  const totalItems = focusAreas.length;

  // Infinite carousel: 3 copies for seamless loop (items 0-4, 5-9, 10-14)
  // Start at index 5 (first item of middle copy)
  const extendedFocusAreas = [...focusAreas, ...focusAreas, ...focusAreas];
  const [focusIndex, setFocusIndex] = useState(totalItems); // Start at middle copy
  const [isTransitionEnabled, setIsTransitionEnabled] = useState(true);
  const [imageLoadErrors, setImageLoadErrors] = useState<Set<string>>(new Set());
  const carouselRef = useRef<HTMLDivElement>(null);

  // Handle image load errors - fallback to standard card design
  const handleImageError = (areaKey: string) => {
    setImageLoadErrors((prev) => new Set(prev).add(areaKey));
  };

  const nextFocus = () => setFocusIndex((prev) => prev + 1);
  const prevFocus = () => setFocusIndex((prev) => prev - 1);

  // Handle seamless infinite loop via onTransitionEnd
  const handleTransitionEnd = () => {
    // If we've scrolled to the third copy, jump back to middle copy (no transition)
    if (focusIndex >= totalItems * 2) {
      setIsTransitionEnabled(false);
      setFocusIndex(focusIndex - totalItems);
    }
    // If we've scrolled before first copy, jump to middle copy (no transition)
    else if (focusIndex < totalItems) {
      setIsTransitionEnabled(false);
      setFocusIndex(focusIndex + totalItems);
    }
  };

  // Re-enable transition after instant jump
  useEffect(() => {
    if (!isTransitionEnabled) {
      // Use requestAnimationFrame to ensure the instant jump renders first
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsTransitionEnabled(true);
        });
      });
    }
  }, [isTransitionEnabled]);

  // Touch/swipe and wheel handlers for carousel
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const isScrolling = useRef<boolean | null>(null);

  // Mouse drag handlers for PC
  const mouseStartX = useRef<number | null>(null);
  const isDragging = useRef<boolean>(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isScrolling.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;

    const deltaX = e.touches[0].clientX - touchStartX.current;
    const deltaY = e.touches[0].clientY - touchStartY.current;

    // Determine if user is scrolling vertically or horizontally
    if (isScrolling.current === null) {
      isScrolling.current = Math.abs(deltaY) > Math.abs(deltaX);
    }

    // Prevent default only if horizontal swipe
    if (!isScrolling.current) {
      e.preventDefault();
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || isScrolling.current) {
      touchStartX.current = null;
      touchStartY.current = null;
      isScrolling.current = null;
      return;
    }

    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const threshold = 50; // Minimum swipe distance

    if (deltaX > threshold) {
      prevFocus();
    } else if (deltaX < -threshold) {
      nextFocus();
    }

    touchStartX.current = null;
    touchStartY.current = null;
    isScrolling.current = null;
  };

  // Mouse drag handlers for PC - click and drag to move carousel
  const handleMouseDown = (e: React.MouseEvent) => {
    mouseStartX.current = e.clientX;
    isDragging.current = true;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || mouseStartX.current === null) return;
    // Visual feedback while dragging (cursor changes via CSS)
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDragging.current || mouseStartX.current === null) {
      isDragging.current = false;
      mouseStartX.current = null;
      return;
    }

    const deltaX = e.clientX - mouseStartX.current;
    const threshold = 50; // Minimum drag distance

    if (deltaX > threshold) {
      prevFocus();
    } else if (deltaX < -threshold) {
      nextFocus();
    }

    isDragging.current = false;
    mouseStartX.current = null;
  };

  const handleMouseLeave = () => {
    // Cancel drag if mouse leaves carousel area
    isDragging.current = false;
    mouseStartX.current = null;
  };

  // Wheel scroll handler - needs native event listener for passive: false
  const lastWheelTime = useRef<number>(0);
  const wheelContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = wheelContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      // CRITICAL: Check if this is horizontal scroll FIRST
      const isHorizontalScroll = Math.abs(e.deltaX) > Math.abs(e.deltaY);

      if (isHorizontalScroll) {
        // IMMEDIATELY prevent browser's swipe-back gesture (before threshold check)
        e.preventDefault();
        e.stopPropagation();

        // Now check throttle and threshold for carousel movement
        const now = Date.now();
        if (now - lastWheelTime.current < 120) return; // 120ms throttle

        if (Math.abs(e.deltaX) > 10) { // 10px threshold for movement
          lastWheelTime.current = now;
          if (e.deltaX > 0) {
            setFocusIndex((prev) => prev + 1);
          } else {
            setFocusIndex((prev) => prev - 1);
          }
        }
      }
    };

    // Add event listener with passive: false to allow preventDefault
    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // Auto-scroll carousel (pauses on hover/touch)
  const [isCarouselPaused, setIsCarouselPaused] = useState(false);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  useEffect(() => {
    if (isCarouselPaused) return;

    const autoScrollInterval = setInterval(() => {
      setFocusIndex((prev) => prev + 1);
    }, 3500); // Auto-scroll every 3.5 seconds

    return () => clearInterval(autoScrollInterval);
  }, [isCarouselPaused]);

  const handleCarouselMouseEnter = () => setIsCarouselPaused(true);
  const handleCarouselMouseLeave = () => setIsCarouselPaused(false);
  const handleCarouselTouchStart = () => setIsCarouselPaused(true);
  const handleCarouselTouchEnd = () => {
    // Delay resume to allow swipe to complete
    setTimeout(() => setIsCarouselPaused(false), 1000);
  };

  // Update tab when URL query param changes
  useEffect(() => {
    if (tabParam && VALID_TABS.includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const ContractCard = ({
    title,
    desc,
    address,
    icon: Icon
  }: {
    title: string;
    desc: string;
    address: string;
    icon: React.ElementType;
  }) => (
    <Card className="glass-panel hover:shadow-lg transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-lg text-gray-900 dark:text-white">{title}</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">{desc}</CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-700/50">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            {t('contracts.verificationBadge')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <code className="text-xs font-mono text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded">
            {address.slice(0, 10)}...{address.slice(-8)}
          </code>
          <Button
            variant="outline"
            size="sm"
            className="dark:border-slate-600 dark:text-gray-300"
            onClick={() => window.open(`https://basescan.org/address/${address}`, '_blank')}
          >
            {t('contracts.viewOnBaseScan')}
            <ExternalLink className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const RoadmapQuarter = ({
    quarterKey,
    icon: Icon,
    statusIcon: StatusIcon,
    statusColor
  }: {
    quarterKey: string;
    icon: React.ElementType;
    statusIcon: React.ElementType;
    statusColor: string;
  }) => (
    <Card className="glass-panel">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${statusColor}`}>
              <Icon className="h-5 w-5" />
            </div>
            <CardTitle className="text-lg text-gray-900 dark:text-white">
              {t(`roadmap.${quarterKey}.title`)}
            </CardTitle>
          </div>
          <Badge variant="outline" className={statusColor}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {t(`roadmap.${quarterKey}.status`)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {['dao', 'voting', 'token', 'escrow', 'master', 'taskRules', 'tasks', 'admin', 'payments', 'wonderverse', 'quests', 'users', 'integrations', 'mobile', 'partnerships', 'audit', 'multichain', 'defi', 'nft', 'decentralization', 'treasury', 'governance'].map((item) => {
            const translationKey = `roadmap.${quarterKey}.items.${item}`;
            try {
              const text = t(translationKey);
              if (text && text !== translationKey) {
                return (
                  <li key={item} className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                    <ChevronRight className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                    <span>{text}</span>
                  </li>
                );
              }
              return null;
            } catch {
              return null;
            }
          }).filter(Boolean)}
        </ul>
      </CardContent>
    </Card>
  );

  return (
    <>
      <Navbar />
      <NavbarSpacer />
      <div className="min-h-screen theme-gradient-bg">
        {/* Background effects */}
        <div className="fixed inset-0 opacity-30 dark:opacity-20 pointer-events-none overflow-hidden">
          <div className="absolute top-20 left-20 w-72 h-72 bg-indigo-400 dark:bg-indigo-600 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl animate-pulse"></div>
          <div className="absolute top-40 right-20 w-72 h-72 bg-purple-400 dark:bg-purple-600 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl animate-pulse"></div>
          <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-blue-400 dark:bg-blue-600 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl animate-pulse"></div>
        </div>

        <div className="relative z-10 container mx-auto px-4 py-8">
          {/* Header */}
          <header className="mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {t('title')}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">{t('subtitle')}</p>
              </div>
            </div>
          </header>

          {/* Navigation Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <TabsList className="glass-panel p-1 flex w-full overflow-x-auto scrollbar-hide gap-1" style={{ WebkitOverflowScrolling: 'touch' }}>
              <TabsTrigger value="aboutus" className="data-[state=active]:glass-bubble flex-shrink-0 whitespace-nowrap">
                <Heart className="h-4 w-4 mr-2" />
                {t('nav.aboutus')}
              </TabsTrigger>
              <TabsTrigger value="whitepaper" className="data-[state=active]:glass-bubble flex-shrink-0 whitespace-nowrap">
                <FileText className="h-4 w-4 mr-2" />
                {t('nav.whitepaper')}
              </TabsTrigger>
              <TabsTrigger value="tokenomics" className="data-[state=active]:glass-bubble flex-shrink-0 whitespace-nowrap">
                <Coins className="h-4 w-4 mr-2" />
                {t('nav.tokenomics')}
              </TabsTrigger>
              <TabsTrigger value="contracts" className="data-[state=active]:glass-bubble flex-shrink-0 whitespace-nowrap">
                <Code className="h-4 w-4 mr-2" />
                {t('nav.contracts')}
              </TabsTrigger>
              <TabsTrigger value="governance" className="data-[state=active]:glass-bubble flex-shrink-0 whitespace-nowrap">
                <Vote className="h-4 w-4 mr-2" />
                {t('nav.governance')}
              </TabsTrigger>
              <TabsTrigger value="roadmap" className="data-[state=active]:glass-bubble flex-shrink-0 whitespace-nowrap">
                <Map className="h-4 w-4 mr-2" />
                {t('nav.roadmap')}
              </TabsTrigger>
              <TabsTrigger value="verification" className="data-[state=active]:glass-bubble flex-shrink-0 whitespace-nowrap">
                <Shield className="h-4 w-4 mr-2" />
                {t('nav.verification')}
              </TabsTrigger>
            </TabsList>

            {/* About Us Tab */}
            <TabsContent value="aboutus" className="space-y-8">
              {/* Hero Section */}
              <div className="glass-crystal rounded-2xl p-8 md:p-12 border border-purple-500/20 relative overflow-hidden">
                {/* Decorative background elements */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5" />
                <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl" />

                <div className="relative z-10 text-center max-w-4xl mx-auto">
                  <div className="flex justify-center mb-6">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
                      <Sparkles className="h-12 w-12 text-purple-500 dark:text-purple-400" />
                    </div>
                  </div>

                  <Badge className="mb-4 bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30 hover:bg-purple-500/20">
                    {t('aboutus.subtitle')}
                  </Badge>

                  <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 bg-gradient-to-r from-purple-600 via-pink-500 to-amber-500 bg-clip-text text-transparent">
                    {t('aboutus.title')}
                  </h1>

                  <p className="text-xl md:text-2xl text-purple-700 dark:text-purple-300 font-semibold mb-6">
                    {t('aboutus.hero.tagline')}
                  </p>

                  <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                    {t('aboutus.hero.description')}
                  </p>
                </div>
              </div>

              {/* Mission & Vision */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Mission */}
                <Card className="glass-panel border-l-4 border-l-purple-500 hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                        <Target className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <CardTitle className="text-xl text-gray-900 dark:text-white">
                        {t('aboutus.mission.title')}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      {t('aboutus.mission.content')}
                    </p>
                  </CardContent>
                </Card>

                {/* Vision */}
                <Card className="glass-panel border-l-4 border-l-pink-500 hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="p-2 rounded-lg bg-pink-100 dark:bg-pink-900/30">
                        <Globe className="h-6 w-6 text-pink-600 dark:text-pink-400" />
                      </div>
                      <CardTitle className="text-xl text-gray-900 dark:text-white">
                        {t('aboutus.vision.title')}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      {t('aboutus.vision.content')}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Focus Areas - Infinite Carousel showing 3 cards */}
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center">
                  {t('aboutus.focus.title')}
                </h2>
                <div
                  className="relative"
                  onMouseEnter={handleCarouselMouseEnter}
                  onMouseLeave={() => {
                    handleCarouselMouseLeave();
                    setShowLeftArrow(false);
                    setShowRightArrow(false);
                  }}
                >
                  {/* Left hover zone for arrow */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-16 z-20"
                    onMouseEnter={() => setShowLeftArrow(true)}
                    onMouseLeave={() => setShowLeftArrow(false)}
                  >
                    <button
                      onClick={prevFocus}
                      className={`absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-lg hover:bg-white dark:hover:bg-gray-700 transition-all duration-300 backdrop-blur-sm ${
                        showLeftArrow ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                      }`}
                      aria-label="Previous"
                    >
                      <ChevronLeft className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                    </button>
                  </div>

                  {/* Right hover zone for arrow */}
                  <div
                    className="absolute right-0 top-0 bottom-0 w-16 z-20"
                    onMouseEnter={() => setShowRightArrow(true)}
                    onMouseLeave={() => setShowRightArrow(false)}
                  >
                    <button
                      onClick={nextFocus}
                      className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-lg hover:bg-white dark:hover:bg-gray-700 transition-all duration-300 backdrop-blur-sm ${
                        showRightArrow ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
                      }`}
                      aria-label="Next"
                    >
                      <ChevronRight className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                    </button>
                  </div>

                  {/* Carousel container - shows 3 cards at a time */}
                  <div
                    ref={wheelContainerRef}
                    className="overflow-x-hidden cursor-grab active:cursor-grabbing touch-pan-y"
                    style={{ overscrollBehaviorX: 'contain' }}
                    onTouchStart={(e) => {
                      handleTouchStart(e);
                      handleCarouselTouchStart();
                    }}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={(e) => {
                      handleTouchEnd(e);
                      handleCarouselTouchEnd();
                    }}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseLeave}
                  >
                    <div
                      ref={carouselRef}
                      className={`flex select-none will-change-transform pt-4 pb-24 ${
                        isTransitionEnabled ? 'transition-transform duration-500 ease-out' : ''
                      }`}
                      style={{ transform: `translateX(-${focusIndex * (100 / cardsPerView)}%)` }}
                      onTransitionEnd={handleTransitionEnd}
                    >
                      {extendedFocusAreas.map((area, idx) => {
                        const Icon = area.icon;
                        // Check if image exists AND hasn't errored - fallback to standard if error
                        const hasBgImage = 'bgImage' in area && area.bgImage && !imageLoadErrors.has(area.key);
                        const hasSticker = 'stickerImage' in area && area.stickerImage && !imageLoadErrors.has(area.key);

                        return (
                          <div
                            key={`${area.key}-${idx}`}
                            className={`${isMobile ? 'w-1/2' : 'w-1/3'} flex-shrink-0 px-2 md:px-4`}
                          >
                            {hasBgImage ? (
                              /* ✨ CRYSTAL DISC - Artistic masterpiece with glass effect */
                              <div
                                className="relative rounded-full aspect-square overflow-hidden group shadow-2xl shadow-purple-500/30 dark:shadow-purple-500/20 hover:shadow-purple-500/40 transition-shadow duration-500 cursor-pointer"
                                onClick={() => isMobile && setExpandedCard(idx)}
                              >

                                {/* Layer 1: Background image */}
                                <Image
                                  src={area.bgImage as string}
                                  alt=""
                                  fill
                                  className="object-cover scale-110"
                                  sizes="(max-width: 768px) 33vw, 25vw"
                                  onError={() => handleImageError(area.key)}
                                />

                                {/* Layer 2: Crystal glass overlay - MORE OPAQUE */}
                                <div
                                  className="absolute inset-0"
                                  style={{
                                    background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.08) 50%, rgba(0,0,0,0.35) 100%)',
                                    backdropFilter: 'blur(2px) saturate(130%)',
                                    WebkitBackdropFilter: 'blur(2px) saturate(130%)',
                                  }}
                                />

                                {/* Layer 3: Radial vignette for depth - stronger */}
                                <div
                                  className="absolute inset-0"
                                  style={{
                                    background: 'radial-gradient(circle at center, transparent 25%, rgba(0,0,0,0.5) 100%)',
                                  }}
                                />

                                {/* Layer 4: Inner crystal ring - refractive edge */}
                                <div
                                  className="absolute inset-[4%] rounded-full pointer-events-none"
                                  style={{
                                    boxShadow: 'inset 0 0 30px rgba(255,255,255,0.1), inset 0 0 60px rgba(100,150,255,0.05)',
                                  }}
                                />

                                {/* Layer 5: Top light reflection (crystal caustic) */}
                                <div
                                  className="absolute top-[8%] left-[12%] w-[40%] h-[20%] rounded-full pointer-events-none"
                                  style={{
                                    background: 'linear-gradient(180deg, rgba(255,255,255,0.35) 0%, transparent 100%)',
                                    filter: 'blur(8px)',
                                  }}
                                />

                                {/* Layer 6: Content container - centered */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-3 md:p-5 text-center">

                                  {/* Sticker - with dynamic scale for visual size matching */}
                                  {hasSticker && (
                                    <div
                                      className="relative mb-2 md:mb-3 transform group-hover:scale-105 transition-transform duration-300"
                                      style={{
                                        perspective: '200px',
                                        transformStyle: 'preserve-3d',
                                      }}
                                    >
                                      <div
                                        className="relative w-20 h-20 md:w-24 md:h-24"
                                        style={{
                                          transform: `rotateX(-5deg) rotateY(5deg) translateZ(10px) scale(${'stickerScale' in area ? area.stickerScale : 1})`,
                                          // Epic 3D shadow - sticker "popping out of screen" effect
                                          filter: `
                                            drop-shadow(0 4px 6px rgba(0,0,0,0.4))
                                            drop-shadow(0 10px 15px rgba(0,0,0,0.35))
                                            drop-shadow(0 20px 30px rgba(0,0,0,0.25))
                                            drop-shadow(0 35px 50px rgba(0,0,0,0.15))
                                            drop-shadow(0 0 20px ${'titleGlow' in area ? (area.titleGlow as string).split(', ')[1] : 'rgba(168,85,247,0.3)'})
                                          `,
                                        }}
                                      >
                                        <Image
                                          src={area.stickerImage as string}
                                          alt=""
                                          fill
                                          className="object-contain"
                                          sizes="96px"
                                          onError={() => handleImageError(area.key)}
                                        />
                                      </div>
                                    </div>
                                  )}

                                  {/* Title - Thematic color with UV glow effect */}
                                  <h3
                                    className="text-sm md:text-base font-black uppercase tracking-wider mb-2 md:mb-3"
                                    style={{
                                      color: 'titleColor' in area ? area.titleColor as string : '#FFD700',
                                      textShadow: `0 0 10px ${'titleGlow' in area ? (area.titleGlow as string).split(', ')[0] : 'rgba(255,215,0,0.8)'}, 0 0 20px ${'titleGlow' in area ? (area.titleGlow as string).split(', ')[1] : 'rgba(255,165,0,0.5)'}, 2px 2px 4px rgba(0,0,0,0.9)`,
                                    }}
                                  >
                                    {t(`aboutus.focus.${area.key}.title`)}
                                  </h3>

                                  {/* Description - LOOSE LETTERS with 3D smart shadows, NO PANEL */}
                                  <p
                                    className="text-[10px] md:text-xs text-white leading-snug line-clamp-3 font-semibold max-w-[85%]"
                                    style={{
                                      textShadow: `
                                        1px 1px 0 rgba(255,255,255,0.3),
                                        2px 2px 2px rgba(0,0,0,0.5),
                                        3px 3px 4px rgba(0,0,0,0.3),
                                        0 0 10px rgba(0,0,0,0.2)
                                      `,
                                    }}
                                  >
                                    {t(`aboutus.focus.${area.key}.description`)}
                                  </p>
                                </div>

                                {/* Layer 7: Outer glow on hover */}
                                <div
                                  className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                                  style={{
                                    boxShadow: 'inset 0 0 40px rgba(168,85,247,0.2), 0 0 30px rgba(168,85,247,0.15)',
                                  }}
                                />
                              </div>
                            ) : (
                              /* Standard glass card */
                              <div className="bg-white/10 dark:bg-slate-800/50 backdrop-blur-md rounded-full aspect-square p-4 md:p-6 text-center flex flex-col items-center justify-center shadow-lg shadow-purple-500/10 dark:shadow-purple-500/5 hover:shadow-xl hover:shadow-purple-500/20 transition-shadow duration-300">
                                <div className="flex justify-center mb-3 md:mb-4">
                                  <div className={`p-3 md:p-4 rounded-full bg-gradient-to-br ${area.gradient} shadow-lg`}>
                                    <Icon className="h-6 w-6 md:h-8 md:w-8 text-white" />
                                  </div>
                                </div>
                                <h3 className="text-xs md:text-base font-bold text-gray-900 dark:text-white mb-1 md:mb-2 leading-tight">
                                  {t(`aboutus.focus.${area.key}.title`)}
                                </h3>
                                <p className="text-[10px] md:text-xs text-gray-600 dark:text-gray-400 leading-snug line-clamp-5">
                                  {t(`aboutus.focus.${area.key}.description`)}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Dots indicator */}
                  <div className="flex justify-center gap-2 -mt-14">
                    {focusAreas.map((area, index) => {
                      // Calculate which dot should be active (normalize to 0-4 range)
                      const normalizedIndex = ((focusIndex % totalItems) + totalItems) % totalItems;
                      const isActive = normalizedIndex === index;
                      return (
                        <button
                          key={area.key}
                          onClick={() => {
                            // Set to middle copy position for the clicked index
                            setFocusIndex(totalItems + index);
                            setIsCarouselPaused(true);
                            setTimeout(() => setIsCarouselPaused(false), 2000);
                          }}
                          className={`h-2.5 rounded-full transition-all duration-300 ${
                            isActive
                              ? 'bg-purple-500 w-8'
                              : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 w-2.5'
                          }`}
                          aria-label={`Go to slide ${index + 1}`}
                        />
                      );
                    })}
                  </div>

                  {/* Mobile tap hint */}
                  {isMobile && (
                    <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-3 animate-pulse">
                      {t('aboutus.focus.tapToExpand')}
                    </p>
                  )}
                </div>

                {/* ✨ EXPANDED CARD MODAL - Artistic fullscreen view for mobile */}
                {expandedCard !== null && (
                  <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
                    onClick={() => setExpandedCard(null)}
                  >
                    {(() => {
                      const area = extendedFocusAreas[expandedCard];
                      const hasSticker = 'stickerImage' in area && area.stickerImage;
                      return (
                        <div
                          className="relative w-[85vw] max-w-[400px] aspect-square rounded-full overflow-hidden shadow-2xl shadow-purple-500/50 animate-in zoom-in-95 duration-300"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Background */}
                          {'bgImage' in area && area.bgImage && (
                            <Image
                              src={area.bgImage as string}
                              alt=""
                              fill
                              className="object-cover scale-110"
                              sizes="85vw"
                            />
                          )}

                          {/* Crystal overlay */}
                          <div
                            className="absolute inset-0"
                            style={{
                              background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.08) 50%, rgba(0,0,0,0.35) 100%)',
                              backdropFilter: 'blur(2px) saturate(130%)',
                            }}
                          />

                          {/* Vignette */}
                          <div
                            className="absolute inset-0"
                            style={{
                              background: 'radial-gradient(circle at center, transparent 35%, rgba(0,0,0,0.5) 100%)',
                            }}
                          />

                          {/* Inner ring */}
                          <div
                            className="absolute inset-[4%] rounded-full pointer-events-none"
                            style={{
                              boxShadow: 'inset 0 0 40px rgba(255,255,255,0.15), inset 0 0 80px rgba(100,150,255,0.08)',
                            }}
                          />

                          {/* Top reflection */}
                          <div
                            className="absolute top-[8%] left-[12%] w-[40%] h-[20%] rounded-full pointer-events-none"
                            style={{
                              background: 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, transparent 100%)',
                              filter: 'blur(10px)',
                            }}
                          />

                          {/* Content */}
                          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                            {/* Large Sticker */}
                            {hasSticker && (
                              <div
                                className="relative mb-4"
                                style={{ perspective: '300px' }}
                              >
                                <div
                                  className="relative w-32 h-32"
                                  style={{
                                    transform: `rotateX(-5deg) rotateY(5deg) translateZ(15px) scale(${'stickerScale' in area ? area.stickerScale : 1})`,
                                    // Epic 3D shadow - sticker "popping out of screen" effect (modal version)
                                    filter: `
                                      drop-shadow(0 6px 8px rgba(0,0,0,0.5))
                                      drop-shadow(0 14px 20px rgba(0,0,0,0.4))
                                      drop-shadow(0 28px 40px rgba(0,0,0,0.3))
                                      drop-shadow(0 45px 65px rgba(0,0,0,0.2))
                                      drop-shadow(0 0 30px ${'titleGlow' in area ? (area.titleGlow as string).split(', ')[1] : 'rgba(168,85,247,0.4)'})
                                    `,
                                  }}
                                >
                                  <Image
                                    src={area.stickerImage as string}
                                    alt=""
                                    fill
                                    className="object-contain"
                                    sizes="128px"
                                  />
                                </div>
                              </div>
                            )}

                            {/* Title with glow */}
                            <h3
                              className="text-xl font-black uppercase tracking-wider mb-4"
                              style={{
                                color: 'titleColor' in area ? area.titleColor as string : '#FFD700',
                                textShadow: `0 0 15px ${'titleGlow' in area ? (area.titleGlow as string).split(', ')[0] : 'rgba(255,215,0,0.8)'}, 0 0 30px ${'titleGlow' in area ? (area.titleGlow as string).split(', ')[1] : 'rgba(255,165,0,0.5)'}, 2px 2px 6px rgba(0,0,0,0.9)`,
                              }}
                            >
                              {t(`aboutus.focus.${area.key}.title`)}
                            </h3>

                            {/* Full description */}
                            <p
                              className="text-sm text-white leading-relaxed font-medium max-w-[80%]"
                              style={{
                                textShadow: '2px 2px 4px rgba(0,0,0,0.8), 0 0 15px rgba(0,0,0,0.4)',
                              }}
                            >
                              {t(`aboutus.focus.${area.key}.description`)}
                            </p>
                          </div>

                          {/* Close button */}
                          <button
                            className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white/80 hover:bg-black/70 hover:text-white transition-colors"
                            onClick={() => setExpandedCard(null)}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>

                          {/* Navigation arrows */}
                          <button
                            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white/80 hover:bg-black/70 hover:text-white transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedCard((prev) => prev !== null ? (prev - 1 + extendedFocusAreas.length) % extendedFocusAreas.length : null);
                            }}
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          <button
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white/80 hover:bg-black/70 hover:text-white transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedCard((prev) => prev !== null ? (prev + 1) % extendedFocusAreas.length : null);
                            }}
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>

                          {/* Outer glow */}
                          <div
                            className="absolute inset-0 rounded-full pointer-events-none"
                            style={{
                              boxShadow: '0 0 60px rgba(168,85,247,0.4), 0 0 120px rgba(168,85,247,0.2)',
                            }}
                          />
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Journey Stats */}
              <Card className="glass-crystal border border-emerald-500/20">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl text-gray-900 dark:text-white flex items-center justify-center gap-2">
                    <TrendingUp className="h-6 w-6 text-emerald-500" />
                    {t('aboutus.stats.title')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 shadow-lg shadow-emerald-500/20 dark:shadow-emerald-500/10 hover:shadow-xl hover:shadow-emerald-500/30 hover:-translate-y-1 transition-all duration-300 border border-emerald-200/50 dark:border-emerald-500/20">
                      <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">104+</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{t('aboutus.stats.daysActive')}</div>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 shadow-lg shadow-blue-500/20 dark:shadow-blue-500/10 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-1 transition-all duration-300 border border-blue-200/50 dark:border-blue-500/20">
                      <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">85.7%</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{t('aboutus.stats.claimRate')}</div>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 shadow-lg shadow-purple-500/20 dark:shadow-purple-500/10 hover:shadow-xl hover:shadow-purple-500/30 hover:-translate-y-1 transition-all duration-300 border border-purple-200/50 dark:border-purple-500/20">
                      <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">0</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{t('aboutus.stats.criticalBugs')}</div>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 col-span-2 md:col-span-1 shadow-lg shadow-amber-500/20 dark:shadow-amber-500/10 hover:shadow-xl hover:shadow-amber-500/30 hover:-translate-y-1 transition-all duration-300 border border-amber-200/50 dark:border-amber-500/20">
                      <div className="text-xl font-bold text-amber-600 dark:text-amber-400">Base L2</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{t('aboutus.stats.network')}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Top Contributors */}
              <TeamSection
                badge={t('aboutus.team.badge')}
                title={t('aboutus.team.title')}
                subtitle={t('aboutus.team.subtitle')}
              />
            </TabsContent>

            {/* Whitepaper Tab */}
            <TabsContent value="whitepaper" className="space-y-6">
              {/* Header Card */}
              <Card className="glass-panel border-l-4 border-l-indigo-500">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl text-gray-900 dark:text-white">
                      {t('whitepaper.title')}
                    </CardTitle>
                    <Badge variant="outline" className="dark:border-slate-600 dark:text-gray-300">
                      {t('whitepaper.updated')}
                    </Badge>
                  </div>
                </CardHeader>
              </Card>

              {/* Executive Summary */}
              <Card className="glass-panel">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
                    <Target className="h-5 w-5 text-indigo-500" />
                    <span>{t('whitepaper.executive.title')}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {t('whitepaper.executive.content')}
                  </p>
                </CardContent>
              </Card>

              {/* Download Whitepaper */}
              <Card className="glass-panel bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border-2 border-indigo-200 dark:border-indigo-800">
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center space-x-3">
                      <Download className="h-10 w-10 text-indigo-600 dark:text-indigo-400" />
                      <div>
                        <h3 className="text-lg font-bold text-indigo-900 dark:text-indigo-100">
                          {t('whitepaper.download.title')}
                        </h3>
                        <p className="text-sm text-indigo-700 dark:text-indigo-300">
                          {t('whitepaper.download.description')}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <a
                        href="/CRYPTOGIFT_WHITEPAPER_v1.2.pdf"
                        download="CRYPTOGIFT_WHITEPAPER_v1.2.pdf"
                        className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-lg font-semibold transition-colors shadow-lg hover:shadow-xl"
                      >
                        <Download className="h-5 w-5" />
                        <span>Download PDF</span>
                      </a>
                      <a
                        href="/CRYPTOGIFT_WHITEPAPER_v1.2.html"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-800 dark:text-gray-200 rounded-lg font-semibold transition-colors"
                      >
                        <FileText className="h-5 w-5" />
                        <span>View Online</span>
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Vision & Mission */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="glass-panel border-l-4 border-l-blue-500">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
                      <Globe className="h-5 w-5 text-blue-500" />
                      <span>{t('whitepaper.vision.title')}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xl font-semibold text-blue-600 dark:text-blue-400 italic">
                      &ldquo;{t('whitepaper.vision.content')}&rdquo;
                    </p>
                  </CardContent>
                </Card>

                <Card className="glass-panel border-l-4 border-l-purple-500">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
                      <Zap className="h-5 w-5 text-purple-500" />
                      <span>{t('whitepaper.mission.title')}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {t('whitepaper.mission.content')}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* The Problem */}
              <Card className="glass-panel">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    <span>{t('whitepaper.problem.title')}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                      {t('whitepaper.problem.barriers')}
                    </h4>
                    <ul className="space-y-2">
                      {['complexity', 'incentives', 'disconnection', 'noPath'].map((item) => (
                        <li key={item} className="flex items-start space-x-2">
                          <ChevronRight className="h-4 w-4 text-amber-500 mt-1 flex-shrink-0" />
                          <span className="text-gray-700 dark:text-gray-300">
                            {t(`whitepaper.problem.barriersList.${item}`)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                      {t('whitepaper.problem.limitations')}
                    </h4>
                    <ul className="space-y-2">
                      {['airdrop', 'voteBuying', 'superficial', 'disconnectedEdu'].map((item) => (
                        <li key={item} className="flex items-start space-x-2">
                          <ChevronRight className="h-4 w-4 text-red-500 mt-1 flex-shrink-0" />
                          <span className="text-gray-700 dark:text-gray-300">
                            {t(`whitepaper.problem.limitationsList.${item}`)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* The Solution */}
              <Card className="glass-panel border-l-4 border-l-green-500">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span>{t('whitepaper.solution.title')}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                    {t('whitepaper.solution.architecture')}
                  </h4>
                  <div className="bg-gray-100 dark:bg-slate-800 p-4 rounded-lg">
                    <code className="text-sm text-gray-800 dark:text-gray-200">
                      {t('whitepaper.solution.flow')}
                    </code>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tokenomics Tab */}
            <TabsContent value="tokenomics" className="space-y-6">
              {/* Token Info */}
              <Card className="glass-panel">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
                    <Coins className="h-5 w-5 text-amber-500" />
                    <span>{t('tokenomics.token.title')}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {['name', 'symbol', 'supply', 'blockchain', 'standard', 'type'].map((key) => (
                      <div key={key} className="bg-gray-50 dark:bg-slate-800 p-3 rounded-lg">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {t(`tokenomics.token.${key}`)}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Distribution */}
              <Card className="glass-panel">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
                    <Users className="h-5 w-5 text-blue-500" />
                    <span>{t('tokenomics.distribution.title')}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {DISTRIBUTION.map((item) => (
                      <div key={item.key} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {t(`tokenomics.distribution.${item.key}`)}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {t(`tokenomics.distribution.${item.key}Desc`)}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                            {item.percentage}%
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {item.amount} CGC
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Emission Caps */}
              <Card className="glass-panel">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
                    <Shield className="h-5 w-5 text-green-500" />
                    <span>{t('tokenomics.caps.title')}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {CAPS.map((cap) => (
                      <div key={cap.key} className="text-center p-4 bg-gray-50 dark:bg-slate-800 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          {t(`tokenomics.caps.${cap.key}`)}
                        </p>
                        <p className="text-lg font-bold text-green-600 dark:text-green-400">
                          {cap.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Utility */}
              <Card className="glass-panel">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
                    <Zap className="h-5 w-5 text-purple-500" />
                    <span>{t('tokenomics.utility.title')}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {['governance', 'access', 'boosts'].map((item) => (
                      <li key={item} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                        <CheckCircle2 className="h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300">
                          {t(`tokenomics.utility.${item}`)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Smart Contracts Tab */}
            <TabsContent value="contracts" className="space-y-6">
              <Card className="glass-panel">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
                    <Code className="h-5 w-5 text-blue-500" />
                    <span>{t('contracts.title')}</span>
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    {t('contracts.subtitle')}
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Core Token & Governance */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Vote className="h-5 w-5 text-purple-500" />
                  {t('contracts.sections.governance')}
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ContractCard
                    title={t('contracts.cgcToken.title')}
                    desc={t('contracts.cgcToken.desc')}
                    address={CONTRACTS.cgcToken}
                    icon={Coins}
                  />
                  <ContractCard
                    title={t('contracts.aragonDAO.title')}
                    desc={t('contracts.aragonDAO.desc')}
                    address={CONTRACTS.aragonDAO}
                    icon={Vote}
                  />
                  <ContractCard
                    title={t('contracts.timelockController.title')}
                    desc={t('contracts.timelockController.desc')}
                    address={CONTRACTS.timelockController}
                    icon={Clock}
                  />
                  <ContractCard
                    title={t('contracts.minterGateway.title')}
                    desc={t('contracts.minterGateway.desc')}
                    address={CONTRACTS.minterGateway}
                    icon={Zap}
                  />
                </div>
              </div>

              {/* Task System */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-500" />
                  {t('contracts.sections.taskSystem')}
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ContractCard
                    title={t('contracts.milestoneEscrow.title')}
                    desc={t('contracts.milestoneEscrow.desc')}
                    address={CONTRACTS.milestoneEscrow}
                    icon={Shield}
                  />
                  <ContractCard
                    title={t('contracts.masterController.title')}
                    desc={t('contracts.masterController.desc')}
                    address={CONTRACTS.masterController}
                    icon={Code}
                  />
                  <ContractCard
                    title={t('contracts.taskRules.title')}
                    desc={t('contracts.taskRules.desc')}
                    address={CONTRACTS.taskRules}
                    icon={CheckCircle2}
                  />
                </div>
              </div>

              {/* Ownership Model Info */}
              <Card className="glass-panel border-l-4 border-l-purple-500">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
                    <Shield className="h-5 w-5 text-purple-500" />
                    <span>{t('contracts.ownership.title')}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-700 dark:text-gray-300">
                    {t('contracts.ownership.description')}
                  </p>
                  <div className="bg-gray-100 dark:bg-slate-800 p-4 rounded-lg">
                    <code className="text-sm text-gray-800 dark:text-gray-200">
                      {t('contracts.ownership.flow')}
                    </code>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
                      <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-1">
                        {t('contracts.ownership.tokenOwner')}
                      </h4>
                      <p className="text-sm text-purple-700 dark:text-purple-300">
                        {t('contracts.ownership.tokenOwnerValue')}
                      </p>
                    </div>
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                      <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                        {t('contracts.ownership.mintingCap')}
                      </h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        {t('contracts.ownership.mintingCapValue')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Governance Tab */}
            <TabsContent value="governance" className="space-y-6">
              {/* Aragon Info */}
              <Card className="glass-panel">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
                    <Vote className="h-5 w-5 text-indigo-500" />
                    <span>{t('governance.aragon.title')}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 dark:bg-slate-800 p-3 rounded-lg">
                      <p className="text-gray-700 dark:text-gray-300">{t('governance.aragon.plugin')}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-slate-800 p-3 rounded-lg">
                      <p className="text-gray-700 dark:text-gray-300">{t('governance.aragon.network')}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="mt-4 dark:border-slate-600 dark:text-gray-300"
                    onClick={() => window.open(`https://app.aragon.org/dao/base-mainnet/${CONTRACTS.aragonDAO}`, '_blank')}
                  >
                    Open Aragon DAO
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>

              {/* Proposal Types */}
              <Card className="glass-panel">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
                    <FileText className="h-5 w-5 text-blue-500" />
                    <span>{t('governance.proposalTypes.title')}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {['tokenRelease', 'paramChanges', 'integrations', 'treasury', 'emergency'].map((item) => (
                      <li key={item} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                        <ChevronRight className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300">
                          {t(`governance.proposalTypes.${item}`)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Voting Parameters */}
              <Card className="glass-panel">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
                    <Target className="h-5 w-5 text-green-500" />
                    <span>{t('governance.votingParams.title')}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {['participation', 'threshold', 'duration', 'proposer'].map((item) => (
                      <li key={item} className="p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                        <span className="text-gray-700 dark:text-gray-300">
                          {t(`governance.votingParams.${item}`)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Security */}
              <Card className="glass-panel">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
                    <Shield className="h-5 w-5 text-red-500" />
                    <span>{t('governance.security.title')}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {['audit', 'bounty', 'timelock', 'pause'].map((item) => (
                      <li key={item} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300">
                          {t(`governance.security.${item}`)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Roadmap Tab */}
            <TabsContent value="roadmap" className="space-y-6">
              <Card className="glass-panel">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
                    <Map className="h-5 w-5 text-purple-500" />
                    <span>{t('roadmap.title')}</span>
                  </CardTitle>
                </CardHeader>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <RoadmapQuarter
                  quarterKey="q4_2024"
                  icon={CheckCircle2}
                  statusIcon={CheckCircle2}
                  statusColor="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                />
                <RoadmapQuarter
                  quarterKey="q1_2025"
                  icon={Clock}
                  statusIcon={Clock}
                  statusColor="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                />
                <RoadmapQuarter
                  quarterKey="q2_2025"
                  icon={Target}
                  statusIcon={Target}
                  statusColor="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                />
                <RoadmapQuarter
                  quarterKey="q3_2025"
                  icon={Zap}
                  statusIcon={Target}
                  statusColor="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400"
                />
              </div>

              <RoadmapQuarter
                quarterKey="q4_2025"
                icon={Globe}
                statusIcon={Target}
                statusColor="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400"
              />
            </TabsContent>

            {/* Token Verification Tab */}
            <TabsContent value="verification" className="space-y-6">
              {/* Page Header */}
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                  {t('verification.title')}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                  {t('verification.subtitle')}
                </p>
              </div>

              {/* Current Status Card */}
              <Card className="glass-panel border-l-4 border-l-blue-500">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
                    <Shield className="h-5 w-5 text-blue-500" />
                    <span>{t('verification.status.title')}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                      <div className="flex items-center space-x-2 mb-2">
                        <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        <h4 className="font-semibold text-amber-900 dark:text-amber-100">
                          {t('verification.status.coinGeckoStatus')}
                        </h4>
                      </div>
                      <p className="text-sm text-amber-700 dark:text-amber-300">
                        {t('verification.status.coinGeckoNote')}
                      </p>
                    </div>
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex items-center space-x-2 mb-2">
                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <h4 className="font-semibold text-green-900 dark:text-green-100">
                          {t('verification.status.baseScanStatus')}
                        </h4>
                      </div>
                      <a
                        href="https://basescan.org/address/0x5e3a61b550328f3D8C44f60b3e10a49D3d806175"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-green-700 dark:text-green-300 hover:underline flex items-center space-x-1"
                      >
                        <span>{t('verification.status.viewOnBaseScan')}</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('verification.status.lastUpdated')}
                  </p>
                </CardContent>
              </Card>

              {/* Token Information Card */}
              <Card className="glass-panel border-l-4 border-l-purple-500">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
                    <Coins className="h-5 w-5 text-purple-500" />
                    <span>{t('verification.tokenInfo.title')}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4">
                    {/* Contract Address - Most Prominent */}
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border-2 border-purple-300 dark:border-purple-700">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-purple-900 dark:text-purple-100">
                          {t('verification.tokenInfo.contractAddress')}
                        </h4>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText('0x5e3a61b550328f3D8C44f60b3e10a49D3d806175');
                          }}
                          className="p-1 hover:bg-purple-100 dark:hover:bg-purple-800 rounded"
                        >
                          <Copy className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        </button>
                      </div>
                      <code className="text-sm font-mono text-purple-700 dark:text-purple-300 break-all">
                        0x5e3a61b550328f3D8C44f60b3e10a49D3d806175
                      </code>
                    </div>

                    {/* Supply Model - Highlighted */}
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700 mb-4">
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="text-center">
                          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            {t('verification.tokenInfo.initialSupply')}
                          </h4>
                          <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                            {t('verification.tokenInfo.initialSupplyValue')}
                          </p>
                        </div>
                        <div className="text-center">
                          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            {t('verification.tokenInfo.maxSupply')}
                          </h4>
                          <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                            {t('verification.tokenInfo.maxSupplyValue')}
                          </p>
                        </div>
                        <div className="text-center md:col-span-1">
                          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            {t('verification.tokenInfo.emissionModel')}
                          </h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {t('verification.tokenInfo.emissionModelValue')}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Other Token Details */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                          {t('verification.tokenInfo.decimals')}
                        </h4>
                        <p className="text-gray-900 dark:text-white font-mono">
                          {t('verification.tokenInfo.decimalsValue')}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                          {t('verification.tokenInfo.blockchain')}
                        </h4>
                        <p className="text-gray-900 dark:text-white">
                          {t('verification.tokenInfo.blockchainValue')}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                          {t('verification.tokenInfo.tokenStandard')}
                        </h4>
                        <p className="text-gray-900 dark:text-white">
                          {t('verification.tokenInfo.tokenStandardValue')}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                          {t('verification.tokenInfo.chainId')}
                        </h4>
                        <p className="text-gray-900 dark:text-white">
                          {t('verification.tokenInfo.chainIdValue')}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Downloads Card */}
              <Card className="glass-panel border-l-4 border-l-indigo-500">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
                    <Download className="h-5 w-5 text-indigo-500" />
                    <span>{t('verification.downloads.title')}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Whitepaper PDF */}
                    <a
                      href="/CRYPTOGIFT_WHITEPAPER_v1.2.pdf"
                      download="CRYPTOGIFT_WHITEPAPER_v1.2.pdf"
                      className="flex items-center space-x-3 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                    >
                      <Download className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                      <div>
                        <h4 className="font-semibold text-indigo-900 dark:text-indigo-100 text-sm">
                          {t('verification.downloads.whitepaper')}
                        </h4>
                        <p className="text-xs text-indigo-700 dark:text-indigo-300">PDF (382 KB)</p>
                      </div>
                    </a>
                    {/* Logo 200x200 - GitHub RAW */}
                    <a
                      href="https://raw.githubusercontent.com/CryptoGift-Wallets-DAO/CryptoGift-Wallets-DAO/main/public/metadata/cgc-logo-200x200.png"
                      download="cgc-logo-200x200.png"
                      className="flex items-center space-x-3 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                    >
                      <Download className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                      <div>
                        <h4 className="font-semibold text-indigo-900 dark:text-indigo-100 text-sm">
                          {t('verification.downloads.logo200')}
                        </h4>
                        <p className="text-xs text-indigo-700 dark:text-indigo-300">200x200 PNG (CoinGecko)</p>
                      </div>
                    </a>
                    {/* Logo 512x512 - GitHub RAW */}
                    <a
                      href="https://raw.githubusercontent.com/CryptoGift-Wallets-DAO/CryptoGift-Wallets-DAO/main/public/metadata/cgc-logo-512x512.png"
                      download="cgc-logo-512x512.png"
                      className="flex items-center space-x-3 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                    >
                      <Download className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                      <div>
                        <h4 className="font-semibold text-indigo-900 dark:text-indigo-100 text-sm">
                          Logo 512x512
                        </h4>
                        <p className="text-xs text-indigo-700 dark:text-indigo-300">512x512 PNG (Wallets)</p>
                      </div>
                    </a>
                    {/* Logo 32x32 SVG - BaseScan Required */}
                    <a
                      href="https://raw.githubusercontent.com/CryptoGift-Wallets-DAO/CryptoGift-Wallets-DAO/main/public/cgc-logo-32x32.svg"
                      download="cgc-logo-32x32.svg"
                      className="flex items-center space-x-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-2 border-green-300 dark:border-green-700 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                    >
                      <Download className="h-8 w-8 text-green-600 dark:text-green-400" />
                      <div>
                        <h4 className="font-semibold text-green-900 dark:text-green-100 text-sm">
                          Logo 32x32 SVG
                        </h4>
                        <p className="text-xs text-green-700 dark:text-green-300">SVG (BaseScan Required)</p>
                      </div>
                    </a>
                  </div>
                  {/* Direct URLs for CoinGecko/BaseScan */}
                  <div className="mt-4 p-4 bg-gray-50 dark:bg-slate-800 rounded-lg">
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-2">Direct URLs (for CoinGecko/BaseScan/Exchanges):</h4>
                    <div className="space-y-2 text-xs font-mono">
                      <div className="flex flex-col gap-1">
                        <span className="text-green-600 dark:text-green-400 font-semibold">BaseScan (SVG 32x32):</span>
                        <code className="text-gray-700 dark:text-gray-300 break-all bg-green-50 dark:bg-green-900/20 p-1 rounded">https://raw.githubusercontent.com/CryptoGift-Wallets-DAO/CryptoGift-Wallets-DAO/main/public/cgc-logo-32x32.svg</code>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-gray-600 dark:text-gray-400">Logo 200x200 PNG:</span>
                        <code className="text-indigo-600 dark:text-indigo-400 break-all">https://raw.githubusercontent.com/CryptoGift-Wallets-DAO/CryptoGift-Wallets-DAO/main/public/metadata/cgc-logo-200x200.png</code>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-gray-600 dark:text-gray-400">Logo 512x512 PNG:</span>
                        <code className="text-indigo-600 dark:text-indigo-400 break-all">https://raw.githubusercontent.com/CryptoGift-Wallets-DAO/CryptoGift-Wallets-DAO/main/public/metadata/cgc-logo-512x512.png</code>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* CoinGecko Requirements Card */}
              <Card className="glass-panel border-l-4 border-l-amber-500">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
                    <TrendingUp className="h-5 w-5 text-amber-500" />
                    <span>{t('verification.coingecko.title')}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                      {t('verification.coingecko.statusTitle')}
                    </h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                      {t('verification.coingecko.previousRequest')}
                    </p>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      {t('verification.coingecko.rejectionReason')}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                      {t('verification.coingecko.requirementsTitle')}
                    </h4>
                    <ul className="space-y-2">
                      <li className="flex items-start space-x-2">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {t('verification.coingecko.req1')}
                        </span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {t('verification.coingecko.req2')}
                        </span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {t('verification.coingecko.req3')}
                        </span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <Clock className="h-5 w-5 text-amber-500 mt-0.5" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {t('verification.coingecko.req4')}
                        </span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                      {t('verification.coingecko.nextStepsTitle')}
                    </h4>
                    <ol className="space-y-2 list-decimal list-inside">
                      <li className="text-sm text-gray-700 dark:text-gray-300">
                        {t('verification.coingecko.step1')}
                      </li>
                      <li className="text-sm text-gray-700 dark:text-gray-300">
                        {t('verification.coingecko.step2')}
                      </li>
                      <li className="text-sm text-gray-700 dark:text-gray-300">
                        {t('verification.coingecko.step3')}
                      </li>
                    </ol>
                  </div>
                </CardContent>
              </Card>

              {/* Links Card */}
              <Card className="glass-panel border-l-4 border-l-blue-500">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
                    <Link2 className="h-5 w-5 text-blue-500" />
                    <span>{t('verification.links.title')}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-3">
                    <a
                      href="https://basescan.org/address/0x5e3a61b550328f3D8C44f60b3e10a49D3d806175"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                    >
                      <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        BaseScan
                      </span>
                      <ExternalLink className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </a>
                    <a
                      href="https://github.com/CryptoGift-Wallets-DAO/CryptoGift-Wallets-DAO"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                    >
                      <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        GitHub
                      </span>
                      <ExternalLink className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </a>
                    <a
                      href="https://x.com/cryptogiftdao"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                    >
                      <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        Twitter/X
                      </span>
                      <ExternalLink className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </a>
                    <a
                      href="https://discord.gg/XzmKkrvhHc"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                    >
                      <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        Discord
                      </span>
                      <ExternalLink className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </a>
                  </div>
                </CardContent>
              </Card>

              {/* API Endpoints Card */}
              <Card className="glass-panel border-l-4 border-l-green-500">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
                    <Code className="h-5 w-5 text-green-500" />
                    <span>{t('verification.api.title')}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <h4 className="text-sm font-semibold text-green-900 dark:text-green-100 mb-2">
                      {t('verification.api.totalSupply')}
                    </h4>
                    <code className="text-xs font-mono text-green-700 dark:text-green-300 break-all">
                      GET https://mbxarts.com/api/token/total-supply
                    </code>
                  </div>
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <h4 className="text-sm font-semibold text-green-900 dark:text-green-100 mb-2">
                      {t('verification.api.circulatingSupply')}
                    </h4>
                    <code className="text-xs font-mono text-green-700 dark:text-green-300 break-all">
                      GET https://mbxarts.com/api/token/circulating-supply
                    </code>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {t('verification.api.note')}
                  </p>
                </CardContent>
              </Card>

              {/* Fraud Warning Explanation Card */}
              <Card className="glass-panel border-l-4 border-l-red-500">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    <span>{t('verification.fraudWarning.title')}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {t('verification.fraudWarning.problemTitle')}
                    </h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {t('verification.fraudWarning.problemDesc')}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {t('verification.fraudWarning.reasonTitle')}
                    </h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                      {t('verification.fraudWarning.reasonDesc')}
                    </p>
                    <ul className="space-y-1 ml-4">
                      <li className="text-sm text-gray-700 dark:text-gray-300 list-disc">
                        {t('verification.fraudWarning.reason1')}
                      </li>
                      <li className="text-sm text-gray-700 dark:text-gray-300 list-disc">
                        {t('verification.fraudWarning.reason2')}
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {t('verification.fraudWarning.solutionTitle')}
                    </h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {t('verification.fraudWarning.solutionDesc')}
                    </p>
                  </div>

                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                      {t('verification.fraudWarning.safetyTitle')}
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {t('verification.fraudWarning.safetyDesc')}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <TeamSection
                badge={tLanding('team.badge')}
                title={tLanding('team.title')}
                subtitle={tLanding('team.subtitle')}
              />
            </TabsContent>
          </Tabs>

          {/* Disclaimer */}
          <Card className="glass-panel mt-8 border-l-4 border-l-amber-500">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <span>{t('disclaimer.title')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {t('disclaimer.content')}
              </p>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card className="glass-panel mt-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
                <MessageCircle className="h-5 w-5 text-blue-500" />
                <span>{t('contact.title')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Button
                  variant="outline"
                  className="flex items-center justify-center space-x-2 dark:border-slate-600 dark:text-gray-300"
                  onClick={() => window.open('https://mbxarts.com', '_blank')}
                >
                  <Globe className="h-4 w-4" />
                  <span>{t('contact.website')}</span>
                </Button>
                <Button
                  variant="outline"
                  className="flex items-center justify-center space-x-2 dark:border-slate-600 dark:text-gray-300"
                  onClick={() => window.open('https://discord.gg/XzmKkrvhHc', '_blank')}
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>{t('contact.discord')}</span>
                </Button>
                <Button
                  variant="outline"
                  className="flex items-center justify-center space-x-2 dark:border-slate-600 dark:text-gray-300"
                  onClick={() => window.open('https://x.com/cryptogiftdao', '_blank')}
                >
                  <Twitter className="h-4 w-4" />
                  <span>{t('contact.twitter')}</span>
                </Button>
                <Button
                  variant="outline"
                  className="flex items-center justify-center space-x-2 dark:border-slate-600 dark:text-gray-300"
                  onClick={() => window.open('mailto:admin@mbxart.com', '_blank')}
                >
                  <Mail className="h-4 w-4" />
                  <span>{t('contact.email')}</span>
                </Button>
                <Button
                  variant="outline"
                  className="flex items-center justify-center space-x-2 dark:border-slate-600 dark:text-gray-300"
                  onClick={() => window.open('https://github.com/CryptoGift-Wallets-DAO', '_blank')}
                >
                  <Github className="h-4 w-4" />
                  <span>{t('contact.github')}</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
