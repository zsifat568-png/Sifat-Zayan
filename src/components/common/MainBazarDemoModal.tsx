import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { HeroBanner, Product, CustomerUser, RegisteredUser } from '../../types';
import { auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from '../../lib/firebase';
import {
  X,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Search,
  Phone,
  ShieldCheck,
  Truck,
  RotateCcw,
  Sparkles,
  Zap,
  Star,
  Monitor,
  Smartphone,
  Tablet,
  Sliders,
  CheckCircle2,
  Copy,
  Link as LinkIcon,
  Tag,
  ArrowRight,
  User,
  LogIn,
  LogOut,
  UserCheck,
  Lock,
  Mail,
  UserPlus
} from 'lucide-react';

interface MainBazarDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCustomizer?: () => void;
}

export const MainBazarDemoModal: React.FC<MainBazarDemoModalProps> = ({
  isOpen,
  onClose,
  onOpenCustomizer
}) => {
  const { heroBanners, products, language, addToast, storeSettings, customers, addRegisteredUser, addCustomer } = useApp();

  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [activeSlide, setActiveSlide] = useState<number>(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(true);
  const [searchWord, setSearchWord] = useState<string>('');
  const [selectedProductView, setSelectedProductView] = useState<Product | null>(null);

  // Customer Authentication state for Storefront
  const [currentCustomer, setCurrentCustomer] = useState<CustomerUser | null>(null);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authTab, setAuthTab] = useState<'login' | 'signup'>('signup');
  const [authForm, setAuthForm] = useState({ name: '', phone: '', email: '', password: '' });
  const [authError, setAuthError] = useState<string>('');
  const [authLoading, setAuthLoading] = useState<boolean>(false);

  // Handle Customer Login / Signup
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      if (authTab === 'signup') {
        const uid = `usr_${Date.now()}`;
        let fbUid = uid;

        // Try Firebase Auth if email and password provided
        if (authForm.email && authForm.password) {
          try {
            const userCred = await createUserWithEmailAndPassword(auth, authForm.email, authForm.password);
            fbUid = userCred.user.uid;
          } catch (err: unknown) {
            const errorMsg = err instanceof Error ? err.message : String(err);
            console.warn('Firebase Auth signup notice:', errorMsg);
          }
        }

        const newCustomer: CustomerUser = {
          id: fbUid,
          name: authForm.name.trim() || 'Valued Customer',
          phone: authForm.phone.trim() || '+8801700000000',
          email: authForm.email.trim() || `${authForm.name.toLowerCase().replace(/\s+/g, '')}@bazar.customer`,
          joinedDate: new Date().toISOString(),
          completedOrdersCount: 0,
          totalSpent: 0,
          rewardPoints: 100, // Sign up bonus
          status: 'active',
          customDiscountPercentage: 0,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(authForm.name || 'User')}&background=10B981&color=fff`
        };

        const regUser: RegisteredUser = {
          uid: fbUid,
          name: newCustomer.name,
          phone: newCustomer.phone,
          email: newCustomer.email,
          authProvider: 'firebase_email',
          emailVerified: true,
          status: 'active',
          createdAt: newCustomer.joinedDate,
          lastLoginAt: newCustomer.joinedDate,
          deviceInfo: 'Web Storefront'
        };

        addRegisteredUser(regUser);
        addCustomer(newCustomer);
        setCurrentCustomer(newCustomer);
        setShowAuthModal(false);
        setAuthForm({ name: '', phone: '', email: '', password: '' });
        addToast('🎉 সাইন-আপ সফল!', `${newCustomer.name}, আপনার অ্যাকাউন্ট কাস্টমার ডিরেক্টরিতে রিয়েলটাইমে যুক্ত হয়েছে।`, 'success');
      } else {
        // Login Flow
        if (authForm.email && authForm.password) {
          try {
            await signInWithEmailAndPassword(auth, authForm.email, authForm.password);
          } catch (err: unknown) {
            const errorMsg = err instanceof Error ? err.message : String(err);
            console.warn('Firebase Auth login notice:', errorMsg);
          }
        }

        // Find existing customer by email or phone
        const existing = customers.find(
          c => (authForm.email && c.email.toLowerCase() === authForm.email.toLowerCase()) || (authForm.phone && c.phone === authForm.phone)
        );

        if (existing) {
          setCurrentCustomer(existing);
          setShowAuthModal(false);
          addToast('লগইন সফল', `স্বাগতম ${existing.name}!`);
        } else {
          // If customer not yet in list, create and add them to directories
          const newCust: CustomerUser = {
            id: `usr_${Date.now()}`,
            name: authForm.name || authForm.email.split('@')[0],
            phone: authForm.phone || '+8801700000000',
            email: authForm.email,
            joinedDate: new Date().toISOString(),
            completedOrdersCount: 0,
            totalSpent: 0,
            rewardPoints: 50,
            status: 'active',
            customDiscountPercentage: 0
          };
          addCustomer(newCust);
          setCurrentCustomer(newCust);
          setShowAuthModal(false);
          addToast('লগইন সম্পন্ন', `স্বাগতম ${newCust.name}! কাস্টমার ডিরেক্টরিতে সিঙ্ক হয়েছে।`);
        }
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setAuthError(errorMsg || 'Authentication error');
    } finally {
      setAuthLoading(false);
    }
  };

  // Quick 1-Click Test Customer Generator
  const handleQuickDemoCustomer = () => {
    const demoNames = ['মোঃ তানভীর আহমেদ', 'রাফসান হক', 'ফারহানা ইয়াসমিন', 'নুসরাত জাহান', 'সাদিয়া ইসলাম'];
    const randomName = demoNames[Math.floor(Math.random() * demoNames.length)];
    const randomPhone = `+88017${Math.floor(10000000 + Math.random() * 90000000)}`;
    const randomEmail = `${randomName.toLowerCase().replace(/\s+/g, '')}${Math.floor(10 + Math.random() * 90)}@gmail.com`;
    const uid = `usr_demo_${Date.now()}`;

    const newCust: CustomerUser = {
      id: uid,
      name: randomName,
      phone: randomPhone,
      email: randomEmail,
      joinedDate: new Date().toISOString(),
      completedOrdersCount: 0,
      totalSpent: 0,
      rewardPoints: 100,
      status: 'active',
      customDiscountPercentage: 0,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(randomName)}&background=059669&color=fff`
    };

    const regUser: RegisteredUser = {
      uid: uid,
      name: randomName,
      phone: randomPhone,
      email: randomEmail,
      authProvider: 'firebase_phone',
      emailVerified: true,
      status: 'active',
      createdAt: newCust.joinedDate,
      lastLoginAt: newCust.joinedDate,
      deviceInfo: 'Mobile Device'
    };

    addRegisteredUser(regUser);
    addCustomer(newCust);
    setCurrentCustomer(newCust);
    setShowAuthModal(false);
    addToast('🎉 টেস্ট একাউন্ট তৈরি!', `${randomName} এর অ্যাকাউন্ট কাস্টমার ডিরেক্টরিতে যুক্ত হয়েছে।`, 'success');
  };

  // Active sorted banners
  const liveBanners = (heroBanners || [])
    .filter(b => b.isActive)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  // Reset or adjust slide index
  useEffect(() => {
    if (activeSlide >= liveBanners.length && liveBanners.length > 0) {
      setActiveSlide(0);
    }
  }, [liveBanners.length, activeSlide]);

  // Autoplay
  useEffect(() => {
    if (!isOpen || !isAutoPlaying || liveBanners.length <= 1) return;
    const interval = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % liveBanners.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isOpen, isAutoPlaying, liveBanners.length]);

  if (!isOpen) return null;

  const currentSlide = liveBanners[activeSlide] || liveBanners[0];

  // Handle click on slide button or banner
  const handleSlideClick = (banner: HeroBanner) => {
    if (banner.productId) {
      const prod = products.find(p => p.id === banner.productId);
      if (prod) {
        setSelectedProductView(prod);
        return;
      }
    }
    // Check if target has /product/
    if (banner.targetCategoryOrUrl.includes('/product/')) {
      const id = banner.targetCategoryOrUrl.split('/product/')[1]?.split('?')[0];
      const prod = products.find(p => p.id === id);
      if (prod) {
        setSelectedProductView(prod);
        return;
      }
    }
    addToast('ডেমো নেভিগেশন', `টার্গেট পেজে যাচ্ছে: ${banner.targetCategoryOrUrl}`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex flex-col justify-between p-2 sm:p-4 overflow-hidden animate-fadeIn">
      {/* Top Browser Bar & Device Switcher */}
      <div className="bg-slate-900 text-white rounded-2xl px-4 py-2.5 flex items-center justify-between border border-slate-700 shadow-xl shrink-0 mb-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
          </div>

          <a
            href="https://bazarcomm.netlify.app"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-800 hover:bg-slate-700/80 rounded-lg text-xs font-mono text-emerald-400 border border-slate-700 transition-colors group cursor-pointer"
            title="লাইভ ওয়েবসাইট ভিজিট করুন: https://bazarcomm.netlify.app"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>https://bazarcomm.netlify.app</span>
            <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-emerald-300 ml-1" />
          </a>

          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold">
            মেইন ওয়েবসাইট লাইভ
          </span>
        </div>

        {/* Viewport switch: Desktop / Tablet / Mobile */}
        <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
          <button
            onClick={() => setDevice('desktop')}
            className={`p-1.5 rounded-lg transition-colors ${
              device === 'desktop' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
            title="Desktop View"
          >
            <Monitor className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDevice('tablet')}
            className={`p-1.5 rounded-lg transition-colors ${
              device === 'tablet' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
            title="Tablet View"
          >
            <Tablet className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDevice('mobile')}
            className={`p-1.5 rounded-lg transition-colors ${
              device === 'mobile' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
            title="Mobile View"
          >
            <Smartphone className="w-4 h-4" />
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <a
            href="https://bazarcomm.netlify.app"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md transition-transform hover:scale-105"
            title="লাইভ ওয়েবসাইট ব্রাউজারে খুলুন"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden md:inline">লাইভ সাইট ভিজিট</span>
          </a>

          {onOpenCustomizer && (
            <button
              onClick={() => {
                onClose();
                onOpenCustomizer();
              }}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs rounded-xl flex items-center gap-1.5 border border-slate-700 transition-colors"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>কার্সোল</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Close Demo"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Website Browser Canvas */}
      <div className="flex-1 bg-slate-100 dark:bg-slate-950 rounded-2xl overflow-y-auto border border-slate-300 dark:border-slate-800 flex justify-center shadow-inner">
        <div
          className={`bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-all duration-300 shadow-2xl flex flex-col min-h-full ${
            device === 'desktop'
              ? 'w-full max-w-6xl'
              : device === 'tablet'
              ? 'w-full max-w-2xl my-2 rounded-2xl border border-slate-300 dark:border-slate-800'
              : 'w-full max-w-sm my-2 rounded-3xl border-4 border-slate-800 shadow-2xl overflow-hidden'
          }`}
        >
          {/* MainBazar Storefront Header */}
          <div className="bg-emerald-800 text-white text-[11px] px-4 py-1.5 flex items-center justify-between font-medium">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1">
                <Truck className="w-3 h-3 text-emerald-300" />
                <span>সারা দেশে ক্যাশ অন ডেলিভারি</span>
              </span>
              <span className="hidden md:inline">•</span>
              <span className="hidden md:flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-300" />
                <span>১০০% আসল পণ্যের গ্যারান্টি</span>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3 text-emerald-300" />
                <span>হটলাইন: ০৯৬১২-০০০৩৩৪</span>
              </span>
            </div>
          </div>

          {/* Storefront Nav Header */}
          <div className="px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-20">
            {/* Logo */}
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setSelectedProductView(null)}>
              {storeSettings?.storeLogo ? (
                <img
                  src={storeSettings.storeLogo}
                  alt="Store Logo"
                  className="w-8 h-8 rounded-xl object-cover shadow-sm border border-emerald-500/30"
                  onError={e => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-black flex items-center justify-center text-sm shadow-md">
                  MB
                </div>
              )}
              <div>
                <h1 className="text-base font-black tracking-tight text-slate-900 dark:text-white leading-none">
                  {storeSettings?.storeNameBn || storeSettings?.storeName || 'bazarcomm'}<span className="text-emerald-600">.netlify.app</span>
                </h1>
                <span className="text-[10px] text-slate-400 font-semibold">আপনার বিশ্বস্ত অনলাইন শপ</span>
              </div>
            </div>

            {/* Search Input */}
            <div className="hidden sm:flex flex-1 max-w-md items-center bg-slate-100 dark:bg-slate-800 rounded-full px-3.5 py-1.5 border border-slate-200 dark:border-slate-700">
              <Search className="w-4 h-4 text-slate-400 mr-2" />
              <input
                type="text"
                placeholder="মেইন বাজারে পণ্য খুঁজুন..."
                value={searchWord}
                onChange={e => setSearchWord(e.target.value)}
                className="bg-transparent text-xs w-full outline-none text-slate-800 dark:text-slate-200"
              />
            </div>

            {/* Cart & User Controls */}
            <div className="flex items-center gap-2">
              <div className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1">
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>কার্ট (০)</span>
              </div>

              {currentCustomer ? (
                <button
                  type="button"
                  onClick={() => setShowAuthModal(true)}
                  className="px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm hover:scale-105 transition-transform"
                >
                  <img
                    src={currentCustomer.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentCustomer.name)}&background=4F46E5&color=fff`}
                    alt={currentCustomer.name}
                    className="w-4 h-4 rounded-full object-cover"
                  />
                  <span className="max-w-[70px] truncate">{currentCustomer.name}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setAuthTab('signup');
                    setShowAuthModal(true);
                  }}
                  className="px-3 py-1 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-transform hover:scale-105"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>লগইন / সাইন-আপ</span>
                </button>
              )}
            </div>
          </div>

          {/* Categories Pill Nav */}
          <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto text-xs font-medium scrollbar-none">
            {['সকল ক্যাটাগরি', 'ফ্যাশন', 'স্মার্টফোন', 'ল্যাপটপ', 'গ্রোসারি', 'বিউটি', 'হোম অ্যাপ্লায়েন্স', 'অফার জোন 🔥'].map(
              (cat, idx) => (
                <button
                  key={idx}
                  className={`px-3 py-1 rounded-full shrink-0 transition-colors ${
                    idx === 0
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-600 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {cat}
                </button>
              )
            )}
          </div>

          {/* STORE CONTENT */}
          <div className="p-4 sm:p-6 space-y-6 flex-1">
            {/* 1. HERO CAROUSEL SECTION */}
            {liveBanners.length > 0 && currentSlide ? (
              <div className="relative rounded-2xl overflow-hidden shadow-xl aspect-16/9 md:aspect-21/9 bg-slate-900 border border-slate-800 group">
                {/* Background Image */}
                <img
                  src={currentSlide.imageUrl}
                  alt={currentSlide.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />

                {/* Scrim Overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/70 to-transparent flex flex-col justify-center p-6 md:p-10 text-white">
                  <div className="max-w-xl space-y-2 md:space-y-3">
                    {/* Badge / Tagline */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-3 py-1 rounded-full bg-emerald-500 text-slate-950 font-black text-[10px] md:text-xs uppercase tracking-wider shadow-md">
                        {currentSlide.badgeText || currentSlide.tagline || '🔥 EXCLUSIVE DEAL'}
                      </span>
                      {currentSlide.productId && (
                        <span className="px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-mono text-emerald-200 flex items-center gap-1">
                          <LinkIcon className="w-2.5 h-2.5" />
                          <span>Connected Product</span>
                        </span>
                      )}
                    </div>

                    {/* Headline */}
                    <h2 className="text-lg md:text-2xl lg:text-3xl font-black text-white leading-tight drop-shadow-md">
                      {language === 'bn' && currentSlide.titleBn ? currentSlide.titleBn : currentSlide.title}
                    </h2>

                    {/* Subtitle */}
                    <p className="text-xs md:text-sm text-slate-200 line-clamp-2 drop-shadow-sm font-medium">
                      {language === 'bn' && currentSlide.subtitleBn
                        ? currentSlide.subtitleBn
                        : currentSlide.subtitle}
                    </p>

                    {/* Action Button */}
                    <div className="pt-2 flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => handleSlideClick(currentSlide)}
                        className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs md:text-sm rounded-xl shadow-lg transition-transform hover:scale-105 active:scale-95 flex items-center gap-1.5"
                      >
                        <span>
                          {language === 'bn' && currentSlide.buttonLabelBn
                            ? currentSlide.buttonLabelBn
                            : currentSlide.buttonLabel || 'Shop Now'}
                        </span>
                        <ArrowRight className="w-4 h-4" />
                      </button>

                      <span className="text-[11px] text-slate-300 font-mono hidden sm:inline">
                        🔗 {currentSlide.targetCategoryOrUrl}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Chevrons */}
                {liveBanners.length > 1 && (
                  <>
                    <button
                      onClick={() =>
                        setActiveSlide(prev => (prev === 0 ? liveBanners.length - 1 : prev - 1))
                      }
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-slate-950/60 hover:bg-slate-950/90 text-white flex items-center justify-center backdrop-blur-md border border-white/20 shadow-md transition-transform hover:scale-110"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setActiveSlide(prev => (prev + 1) % liveBanners.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-slate-950/60 hover:bg-slate-950/90 text-white flex items-center justify-center backdrop-blur-md border border-white/20 shadow-md transition-transform hover:scale-110"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}

                {/* Indicator Dots */}
                {liveBanners.length > 1 && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-slate-950/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                    {liveBanners.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveSlide(idx)}
                        className={`h-2 rounded-full transition-all duration-300 ${
                          activeSlide === idx ? 'w-6 bg-emerald-400' : 'w-2 bg-white/40 hover:bg-white/70'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 sm:p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3 shadow-xs">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  ওয়েবসাইটটি সম্পূর্ণ নতুন ও প্রস্তুত
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  বর্তমানে কোনো হিরো ব্যানার যুক্ত নেই। আপনি যখন "হিরো কার্সোল" ট্যাব বা প্রোডাক্ট লিংক দিয়ে ব্যানার যোগ করবেন, তখন তা এখানে লাইভ প্রদর্শিত হবে।
                </p>
                {onOpenCustomizer && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenCustomizer();
                    }}
                    className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-transform hover:scale-105"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>প্রথম হিরো কার্সোল অ্যাড করুন</span>
                  </button>
                )}
              </div>
            )}

            {/* Selected Product Detail Popup in Demo */}
            {selectedProductView && (
              <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-800 border-2 border-emerald-500 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 animate-scaleUp">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 w-full">
                  <div className="relative shrink-0">
                    <img
                      src={selectedProductView.images[0]}
                      alt={selectedProductView.title}
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-emerald-400 dark:border-emerald-600 shadow-md"
                    />
                    {Boolean(selectedProductView.isFreeDelivery || selectedProductView.badges?.includes('free_delivery')) && (
                      <span className="absolute -bottom-2 -right-1 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[9px] font-black shadow-md flex items-center gap-1 border-2 border-white dark:border-slate-800">
                        <Truck className="w-2.5 h-2.5" />
                        <span>ফ্রি ডেলিভারি</span>
                      </span>
                    )}
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-bold">
                        মেইন বাজার প্রোডাক্ট
                      </span>
                      {Boolean(selectedProductView.isFreeDelivery || selectedProductView.badges?.includes('free_delivery')) && (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 border border-emerald-400 font-black text-xs flex items-center gap-1.5 shadow-xs animate-bounce">
                          <Truck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Free Delivery (ফ্রি ডেলিভারি)</span>
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">
                      {selectedProductView.title}
                    </h3>
                    {selectedProductView.titleBn && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {selectedProductView.titleBn}
                      </p>
                    )}
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                        ৳{selectedProductView.price.toLocaleString()}
                      </span>
                      {selectedProductView.originalPrice > selectedProductView.price && (
                        <span className="line-through text-slate-400 text-xs">
                          ৳{selectedProductView.originalPrice.toLocaleString()}
                        </span>
                      )}
                      {selectedProductView.discountPercentage > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 text-[10px] font-bold font-sans">
                          {selectedProductView.discountPercentage}% ছাড়
                        </span>
                      )}
                    </div>

                    {Boolean(selectedProductView.isFreeDelivery || selectedProductView.badges?.includes('free_delivery')) ? (
                      <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 pt-0.5">
                        <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>🎉 এই পণ্যের ডেলিভারি চার্জ সম্পূর্ণ ফ্রি! (০ ৳ ডেলিভারি চার্জ)</span>
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 pt-0.5">
                        <Truck className="w-3.5 h-3.5 text-slate-400" />
                        <span>সারা দেশে হোম ডেলিভারি সুবিধা (ঢাকার ভিতরে ৬০৳ / বাহিরে ১২০৳)</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      const isFree = Boolean(selectedProductView.isFreeDelivery || selectedProductView.badges?.includes('free_delivery'));
                      addToast(
                        'অর্ডার ডেমো',
                        `"${selectedProductView.title}" অর্ডার তালিকায় যুক্ত হয়েছে! ${isFree ? 'ফ্রি ডেলিভারি থাকায় ডেলিভারি চার্জ ০ টাকা।' : ''}`,
                        'success'
                      );
                    }}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>এখনই অর্ডার করুন</span>
                  </button>
                  <button
                    onClick={() => setSelectedProductView(null)}
                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* 2. FLASH DEALS & FEATURED PRODUCTS GRID */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    হট ডিল ও জনপ্রিয় পণ্যসমূহ (Flash Deals)
                  </h3>
                </div>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer">
                  সবগুলো দেখুন →
                </span>
              </div>

              {products.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                  {products.slice(0, 8).map(product => {
                    const directLink = `https://mainbazar.com/product/${product.id}`;
                    return (
                      <div
                        key={product.id}
                        className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-2xs hover:shadow-md transition-shadow group flex flex-col justify-between"
                      >
                        <div className="relative aspect-square bg-slate-100 dark:bg-slate-900 overflow-hidden">
                          <img
                            src={product.images[0]}
                            alt={product.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {product.discountPercentage > 0 && (
                            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-rose-500 text-white font-black text-[10px]">
                              {product.discountPercentage}% OFF
                            </span>
                          )}

                          {/* Free Delivery Badge Floating on Product Image */}
                          {Boolean(product.isFreeDelivery || product.badges?.includes('free_delivery')) && (
                            <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-emerald-600/95 text-white font-black text-[10px] shadow-md flex items-center gap-1 border border-emerald-300/40 backdrop-blur-xs animate-pulse">
                              <Truck className="w-3 h-3 text-emerald-200" />
                              <span>ফ্রি ডেলিভারি</span>
                            </span>
                          )}

                          <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur-xs text-white font-mono text-[9px]">
                            {product.category}
                          </span>

                          {/* Free Delivery Bottom Banner Strip on Image */}
                          {Boolean(product.isFreeDelivery || product.badges?.includes('free_delivery')) && (
                            <div className="absolute bottom-0 inset-x-0 bg-emerald-700/95 text-white text-[9px] font-black py-0.5 px-2 flex items-center justify-center gap-1 shadow-xs tracking-wider uppercase">
                              <Truck className="w-2.5 h-2.5 text-emerald-200" />
                              <span>Free Delivery • ফ্রি ডেলিভারি</span>
                            </div>
                          )}
                        </div>

                        <div className="p-3 space-y-1.5 flex-1 flex flex-col justify-between">
                          <div>
                            {/* Free Delivery Text Beside / Above Product Title */}
                            {Boolean(product.isFreeDelivery || product.badges?.includes('free_delivery')) && (
                              <div className="mb-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800">
                                <Truck className="w-3 h-3 text-emerald-600" />
                                <span>Free Delivery (ফ্রি ডেলিভারি)</span>
                              </div>
                            )}

                            <h4 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-2">
                              {product.title}
                            </h4>
                            <div className="flex items-center gap-1.5 mt-1 font-mono">
                              <span className="font-black text-xs text-emerald-600 dark:text-emerald-400">
                                ৳{product.price.toLocaleString()}
                              </span>
                              {product.originalPrice > product.price && (
                                <span className="text-[10px] text-slate-400 line-through">
                                  ৳{product.originalPrice.toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Product direct link button */}
                          <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(directLink);
                                addToast('📋 লিংক কপি হয়েছে', directLink);
                              }}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-[10px] font-mono flex items-center gap-1 border border-slate-200 dark:border-slate-600"
                              title="Copy Direct Link"
                            >
                              <Copy className="w-2.5 h-2.5" />
                              <span>কপি লিংক</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setSelectedProductView(product)}
                              className="p-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold"
                              title="View in Demo"
                            >
                              দেখুন
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/50">
                  <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    বর্তমানে স্টোরে কোনো প্রোডাক্ট নেই (০ পণ্য)
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                    অ্যাডমিন প্যানেল থেকে যখন আপনি নতুন পণ্য যোগ করবেন, তখন তা স্বয়ংক্রিয়ভাবে এখানে চলে আসবে।
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Footer of Demo */}
          <div className="px-6 py-4 bg-slate-900 text-slate-400 text-xs border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 mt-auto">
            <span>© 2026 mainbazar.com - সর্বস্বত্ব সংরক্ষিত</span>
            <div className="flex items-center gap-4">
              <span>প্রাইভেসি পলিসি</span>
              <span>টার্মস ও কন্ডিশন</span>
              <span>রিটার্ন পলিসি</span>
            </div>
          </div>
        </div>
      </div>

      {/* Storefront Customer Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="relative bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-white">
                    {currentCustomer ? 'কাস্টমার প্রোফাইল' : (authTab === 'signup' ? 'নতুন কাস্টমার একাউন্ট তৈরি' : 'কাস্টমার লগইন')}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {currentCustomer ? 'কাস্টমার ডিরেক্টরিতে সংযুক্ত একাউন্ট' : 'Firebase Authentication ও রিয়েলটাইম ডিরেক্টরি'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAuthModal(false);
                  setAuthError('');
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {currentCustomer ? (
              /* Already Logged In Profile Card */
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <img
                    src={currentCustomer.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentCustomer.name)}&background=059669&color=fff`}
                    alt={currentCustomer.name}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-500 shadow-md"
                  />
                  <div>
                    <h4 className="font-black text-base text-slate-900 dark:text-white">{currentCustomer.name}</h4>
                    <p className="text-xs text-slate-500 font-mono">📞 {currentCustomer.phone}</p>
                    <p className="text-xs text-slate-500 font-mono">✉️ {currentCustomer.email}</p>
                    <span className="inline-block px-2 py-0.5 mt-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded text-[10px] font-bold">
                      ✅ কাস্টমার ডিরেক্টরিতে সক্রিয়
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800">
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase">রয়্যাল পয়েন্ট</p>
                    <p className="text-lg font-black text-emerald-700 dark:text-emerald-300 font-mono">{currentCustomer.rewardPoints} Pts</p>
                  </div>
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-800">
                    <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase">অর্ডার সংখ্যা</p>
                    <p className="text-lg font-black text-indigo-700 dark:text-indigo-300 font-mono">{currentCustomer.completedOrdersCount} টি</p>
                  </div>
                </div>

                <div className="pt-2 flex justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentCustomer(null);
                      signOut(auth).catch(() => {});
                      addToast('লগআউট সম্পন্ন', 'আপনি একাউন্ট থেকে লগআউট করেছেন।');
                      setShowAuthModal(false);
                    }}
                    className="w-full py-2.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 font-bold text-xs rounded-xl border border-rose-200 dark:border-rose-800 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>লগআউট করুন</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAuthModal(false)}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors"
                  >
                    বন্ধ করুন
                  </button>
                </div>
              </div>
            ) : (
              /* Auth Form (Login or Signup) */
              <div className="p-6 space-y-4">
                {/* Tabs */}
                <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold">
                  <button
                    onClick={() => {
                      setAuthTab('signup');
                      setAuthError('');
                    }}
                    className={`py-2 rounded-lg transition-colors ${
                      authTab === 'signup'
                        ? 'bg-emerald-600 text-white shadow'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    নতুন সাইন-আপ (Sign Up)
                  </button>
                  <button
                    onClick={() => {
                      setAuthTab('login');
                      setAuthError('');
                    }}
                    className={`py-2 rounded-lg transition-colors ${
                      authTab === 'login'
                        ? 'bg-emerald-600 text-white shadow'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    লগইন (Sign In)
                  </button>
                </div>

                {authError && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
                    {authError}
                  </div>
                )}

                <form onSubmit={handleAuthSubmit} className="space-y-3.5">
                  {authTab === 'signup' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        আপনার পূর্ণ নাম (Full Name) *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="যেমন: তানভীর আহমেদ"
                        value={authForm.name}
                        onChange={e => setAuthForm({ ...authForm, name: e.target.value })}
                        className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-500"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      মোবাইল নম্বর (Phone) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="+88017XXXXXXXX"
                      value={authForm.phone}
                      onChange={e => setAuthForm({ ...authForm, phone: e.target.value })}
                      className="w-full p-2.5 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      ইমেইল এড্রেস (Email Address) {authTab === 'signup' ? '*' : ''}
                    </label>
                    <input
                      type="email"
                      required={authTab === 'signup'}
                      placeholder="customer@gmail.com"
                      value={authForm.email}
                      onChange={e => setAuthForm({ ...authForm, email: e.target.value })}
                      className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      পাসওয়ার্ড (Password)
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={authForm.password}
                      onChange={e => setAuthForm({ ...authForm, password: e.target.value })}
                      className="w-full p-2.5 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>
                      {authLoading ? 'প্রসেসিং হচ্ছে...' : (authTab === 'signup' ? 'একাউন্ট তৈরি করুন' : 'লগইন করুন')}
                    </span>
                  </button>
                </form>

                {/* 1-Click Fast Test Account Generator */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={handleQuickDemoCustomer}
                    className="w-full py-2 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 font-bold text-xs rounded-xl border border-indigo-200 dark:border-indigo-800 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>১-ক্লিকে টেস্ট কাস্টমার একাউন্ট তৈরি করুন</span>
                  </button>
                  <p className="text-[10px] text-slate-400 text-center mt-1.5">
                    * এক ক্লিকেই স্বয়ংক্রিয়ভাবে একটি বাস্তব কাস্টমার আইডি তৈরি হবে এবং কাস্টমার ডিরেক্টরিতে চলে যাবে।
                  </p>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
};
