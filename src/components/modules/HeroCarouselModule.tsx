import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { HeroBanner, Product } from '../../types';
import { ImgbbImageUploader } from '../common/ImgbbImageUploader';
import { db, isFirebaseConfigured } from '../../lib/firebase';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query
} from 'firebase/firestore';
import {
  GalleryHorizontalEnd,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  Link as LinkIcon,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Monitor,
  Smartphone,
  RefreshCw,
  Image as ImageIcon,
  Sparkles,
  Flame,
  Zap,
  Tag,
  AlertCircle,
  Eye,
  EyeOff,
  MoveUp,
  MoveDown,
  Info,
  CheckCircle2,
  Globe,
  Sliders,
  X
} from 'lucide-react';
import { MainBazarDemoModal } from '../common/MainBazarDemoModal';

const PRESET_CAROUSEL_BANNERS = [
  {
    label: 'Eid Festive Traditional Wear',
    labelBn: 'ঈদ ফ্যাশন প্রিমিয়াম পাঞ্জাবি',
    imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1600&auto=format&fit=crop&q=80',
    tagline: 'Eid Festive Shopping Special',
    taglineBn: 'ঈদ ফ্যাশন অফার',
    title: 'Up to 50% Off Luxury Traditional Wear',
    titleBn: 'প্রিমিয়াম পাঞ্জাবি ও জামদানিতে ৫০% পর্যন্ত ছাড়',
    subtitle: 'Exclusive handloom collection with fast delivery all over Bangladesh.',
    subtitleBn: 'সারা বাংলাদেশে দ্রুত হোম ডেলিভারির সুবিধা।'
  },
  {
    label: 'Smart Tech & Wireless ANC Audio',
    labelBn: 'গ্যাজেট ও অডিও ফেস্ট',
    imageUrl: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=1600&auto=format&fit=crop&q=80',
    tagline: 'Gadgets & Smart Tech',
    taglineBn: 'গ্যাজেট ফেস্ট ২০২৬',
    title: 'Next-Gen Wireless ANC Audio & Smartwatches',
    titleBn: 'সেরা ব্র্যান্ডের ট্রু ওয়্যারলেস ইয়ারবাডস ও স্মার্টওয়াচ',
    subtitle: 'Authentic brand warranty with easy bKash & Nagad cashback.',
    subtitleBn: 'বিকাশ ও নগদে ইনস্ট্যান্ট ক্যাশব্যাক অফার।'
  },
  {
    label: 'Mega Clearance Flash Sale',
    labelBn: 'মেগা ক্লিয়ারেন্স ফ্ল্যাশ সেল',
    imageUrl: 'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=1600&auto=format&fit=crop&q=80',
    tagline: '🔥 LIMITED TIME CLEARANCE FLASH DEAL',
    taglineBn: '🔥 সীমিত সময়ের মেগা ফ্ল্যাশ ডিল',
    title: 'Super Saver Bundles & Up to 60% Clearance',
    titleBn: 'সুপার সেভার ডিল ও ৬০% পর্যন্ত মেগা সেভিংস',
    subtitle: 'Limited stocks remaining. Order today before offer ends.',
    subtitleBn: 'স্টক সীমিত! অফার শেষ হওয়ার আগেই এখনই অর্ডার করুন।'
  },
  {
    label: 'Leather Luxury & Accessories',
    labelBn: 'জেনুইন লেদার ওয়ালেট ও বেল্ট',
    imageUrl: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=1600&auto=format&fit=crop&q=80',
    tagline: 'Premium Genuine Leather',
    taglineBn: '১০০% জেনুইন লেদার কালেকশন',
    title: 'Handcrafted Cowhide Wallets & Belt Combos',
    titleBn: 'প্রিমিয়াম কাউহাইড লেদার ওয়ালেট ও উপহার সেট',
    subtitle: 'Sophisticated style crafted for longevity. Includes luxury gift box.',
    subtitleBn: 'অভিজাত উপহারের জন্য সেরা পছন্দ। ফ্রি গিফট বক্স সহ।'
  }
];

export const HeroCarouselModule: React.FC = () => {
  const {
    heroBanners,
    addHeroBanner,
    updateHeroBanner,
    deleteHeroBanner,
    reorderHeroBanners,
    products,
    addToast,
    language,
    t
  } = useApp();

  // Active Preview Slider State
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(true);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [isSyncingFirestore, setIsSyncingFirestore] = useState<boolean>(false);

  // Modal / Creator State
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [isStoreDemoOpen, setIsStoreDemoOpen] = useState<boolean>(false);
  const [addMode, setAddMode] = useState<'custom_image' | 'paste_link'>('custom_image');
  const [editingBanner, setEditingBanner] = useState<HeroBanner | null>(null);
  const [showApiModal, setShowApiModal] = useState<boolean>(false);

  // Link Paste Input State
  const [pastedProductLink, setPastedProductLink] = useState<string>('');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [detectedProduct, setDetectedProduct] = useState<Product | null>(null);

  // Custom Banner Form State
  const [formData, setFormData] = useState({
    imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1600&auto=format&fit=crop&q=80',
    tagline: 'Exclusive Offer on bazarcomm.netlify.app',
    taglineBn: 'মেইন বাজারে স্পেশাল ডিল',
    title: 'Mega Savings Festival 2026',
    titleBn: 'মেগা সেভিংস ফেস্ট ২০২৬',
    subtitle: 'Shop top quality authentic products with instant delivery across Bangladesh.',
    subtitleBn: 'সারা দেশে দ্রুত ডেলিভারির সাথে সেরা পণ্যের কেনাকাটা করুন।',
    targetCategoryOrUrl: 'https://bazarcomm.netlify.app',
    buttonLabel: 'Shop Now',
    buttonLabelBn: 'এখনই কিনুন',
    isActive: true,
    badgeText: '🔥 HOT DEAL'
  });

  // Safe local copy of banners sorted by order
  const sortedBanners = useMemo(() => {
    return [...(heroBanners || [])].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [heroBanners]);

  const activeBanners = useMemo(() => {
    return sortedBanners.filter(b => b.isActive);
  }, [sortedBanners]);

  // Keep active index in bounds
  useEffect(() => {
    if (activeSlideIndex >= activeBanners.length && activeBanners.length > 0) {
      setActiveSlideIndex(0);
    }
  }, [activeBanners.length, activeSlideIndex]);

  // Auto-play timer for hero preview
  useEffect(() => {
    if (!isAutoPlaying || activeBanners.length <= 1) return;
    const timer = setInterval(() => {
      setActiveSlideIndex(prev => (prev + 1) % activeBanners.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [isAutoPlaying, activeBanners.length]);

  // Real-time Firestore sync listener for hero_banners collection
  useEffect(() => {
    if (!isFirebaseConfigured()) return;
    try {
      const q = query(collection(db, 'hero_banners'));
      const unsubscribe = onSnapshot(
        q,
        snapshot => {
          // If website is deliberately in fresh clean 0-banner state, do not auto-restore legacy items
          const isFreshClean = localStorage.getItem('bazar_store_clean_fresh_v3') === 'true';
          if (isFreshClean && (!heroBanners || heroBanners.length === 0)) {
            return;
          }

          if (!snapshot.empty) {
            const remoteBanners: HeroBanner[] = [];
            snapshot.forEach(docSnap => {
              const data = docSnap.data() as Omit<HeroBanner, 'id'>;
              remoteBanners.push({
                id: docSnap.id,
                ...data
              });
            });
            // Update local state if needed
            if (remoteBanners.length > 0) {
              const sorted = remoteBanners.sort((a, b) => (a.order || 0) - (b.order || 0));
              // Check if remote differs
              if (JSON.stringify(sorted) !== JSON.stringify(heroBanners)) {
                reorderHeroBanners(sorted);
              }
            }
          }
        },
        error => {
          console.warn('Firestore hero_banners live listener error:', error.message);
        }
      );
      return () => unsubscribe();
    } catch (e) {
      console.warn('Firestore hero_banners setup note:', e);
    }
  }, [heroBanners.length]);

  // Detect product when link or input changes
  useEffect(() => {
    const raw = pastedProductLink.trim();
    if (!raw) {
      if (selectedProductId) {
        const found = products.find(p => p.id === selectedProductId);
        setDetectedProduct(found || null);
      } else {
        setDetectedProduct(null);
      }
      return;
    }

    // Try extracting ID from URL (e.g., https://mainbazar.com/product/prod-3 or /p/BZR-PH-001)
    let matchedIdOrSku = raw;
    if (raw.includes('/product/')) {
      matchedIdOrSku = raw.split('/product/')[1]?.split('?')[0]?.split('/')[0] || '';
    } else if (raw.includes('/p/')) {
      matchedIdOrSku = raw.split('/p/')[1]?.split('?')[0]?.split('/')[0] || '';
    }

    // Search by ID or SKU or Title
    const match = products.find(
      p =>
        p.id.toLowerCase() === matchedIdOrSku.toLowerCase() ||
        p.sku.toLowerCase() === matchedIdOrSku.toLowerCase() ||
        p.id.toLowerCase() === raw.toLowerCase() ||
        p.sku.toLowerCase() === raw.toLowerCase()
    );

    if (match) {
      setDetectedProduct(match);
      setSelectedProductId(match.id);
    } else {
      setDetectedProduct(null);
    }
  }, [pastedProductLink, selectedProductId, products]);

  // Sync to Firestore helper
  const syncBannerToFirestore = async (banner: HeroBanner) => {
    if (!isFirebaseConfigured()) return;
    try {
      await setDoc(doc(db, 'hero_banners', banner.id), banner, { merge: true });
    } catch (err) {
      console.warn('Firestore write notice:', err);
    }
  };

  // Delete from Firestore helper
  const deleteBannerFromFirestore = async (id: string) => {
    if (!isFirebaseConfigured()) return;
    try {
      await deleteDoc(doc(db, 'hero_banners', id));
    } catch (err) {
      console.warn('Firestore delete notice:', err);
    }
  };

  // Clear all slides helper
  const handleClearAllSlides = async () => {
    const previousBanners = [...heroBanners];
    reorderHeroBanners([]);
    if (isFirebaseConfigured()) {
      try {
        for (const b of previousBanners) {
          await deleteDoc(doc(db, 'hero_banners', b.id));
        }
      } catch (err) {
        console.warn('Firestore clear error:', err);
      }
    }
    addToast('সকল হিরো স্লাইড মুছে ফেলা হয়েছে', 'হিরো কার্সোল এখন সম্পূর্ণ খালি (০ ব্যানার)।', 'success');
  };

  // Manual Full Sync with Firestore
  const handleFullSyncFirestore = async () => {
    setIsSyncingFirestore(true);
    try {
      if (isFirebaseConfigured()) {
        for (const banner of sortedBanners) {
          await setDoc(doc(db, 'hero_banners', banner.id), banner, { merge: true });
        }
      }
      setTimeout(() => {
        setIsSyncingFirestore(false);
        addToast(
          '🔥 ফায়ারস্টোর সিনক্রোনাইজেশন সম্পন্ন!',
          `সকল ${sortedBanners.length} টি হিরো ক্যারোসেল ব্যানার মেইন ওয়েবসাইট (mainbazar.com) এর জন্য ফায়ারস্টোরে আপডেট হয়েছে।`,
          'success'
        );
      }, 700);
    } catch (e) {
      setIsSyncingFirestore(false);
      console.warn('Sync error:', e);
      addToast('Sync Alert', 'Local state active. Firestore sync queued.', 'info');
    }
  };

  // Add Product as Hero Carousel Slide
  const handleAddProductSlide = async () => {
    if (!detectedProduct) {
      addToast('পণ্য পাওয়া যায়নি', 'অনুগ্রহ করে সঠিক প্রোডাক্ট লিংক বা SKU দিন।', 'warning');
      return;
    }

    const directLink = `https://mainbazar.com/product/${detectedProduct.id}`;
    const newSlide: Omit<HeroBanner, 'id'> = {
      imageUrl:
        detectedProduct.images[0] ||
        'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1600&auto=format&fit=crop&q=80',
      tagline: detectedProduct.badges.includes('flash_sale')
        ? '🔥 FLASH SALE DEAL • EXCLUSIVE'
        : '⭐ FEATURED PRODUCT • TOP PICK',
      taglineBn: detectedProduct.badges.includes('flash_sale')
        ? '🔥 মেগা ফ্ল্যাশ ডিল • সীমিত স্টক'
        : '⭐ সেরা ও জনপ্রিয় পণ্য • মেইন বাজার',
      title: detectedProduct.title,
      titleBn: detectedProduct.titleBn || detectedProduct.title,
      subtitle: `৳${detectedProduct.price.toLocaleString()} (${
        detectedProduct.discountPercentage > 0
          ? `${detectedProduct.discountPercentage}% OFF`
          : 'Best Market Price'
      }) • সারা বাংলাদেশে দ্রুত হোম ডেলিভারি`,
      subtitleBn: `৳${detectedProduct.price.toLocaleString()} (${
        detectedProduct.discountPercentage > 0
          ? `${detectedProduct.discountPercentage}% ছাড়`
          : 'সেরা বাজার মূল্যে'
      }) • সারা দেশে হোম ডেলিভারি`,
      targetCategoryOrUrl: directLink,
      targetProductLink: directLink,
      productId: detectedProduct.id,
      productSku: detectedProduct.sku,
      productPrice: detectedProduct.price,
      productOriginalPrice: detectedProduct.originalPrice,
      badgeText:
        detectedProduct.discountPercentage > 0
          ? `${detectedProduct.discountPercentage}% OFF`
          : 'HOT DEAL 🔥',
      buttonLabel: `Shop Now ৳${detectedProduct.price.toLocaleString()}`,
      buttonLabelBn: `এখনই কিনুন ৳${detectedProduct.price.toLocaleString()}`,
      isActive: true,
      order: sortedBanners.length + 1
    };

    const created = addHeroBanner(newSlide);
    await syncBannerToFirestore(created);

    addToast(
      '🎉 হিরো কার্সোলে সফলভাবে যোগ হয়েছে!',
      `"${detectedProduct.title}" এখন মেইন ওয়েবসাইটের হিরো কার্সোলে লাইভ শো হবে।`,
      'success'
    );

    // Reset modal
    setPastedProductLink('');
    setDetectedProduct(null);
    setSelectedProductId('');
    setShowAddModal(false);
  };

  // Add Custom / Preset Slide
  const handleAddCustomSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.imageUrl.trim() || !formData.title.trim()) {
      addToast('ভ্যালিডেশন এরর', 'অনুগ্রহ করে ইমেজ ইউআরএল এবং টাইটেল প্রদান করুন।', 'warning');
      return;
    }

    const newSlide: Omit<HeroBanner, 'id'> = {
      imageUrl: formData.imageUrl.trim(),
      tagline: formData.tagline.trim(),
      taglineBn: formData.taglineBn.trim(),
      title: formData.title.trim(),
      titleBn: formData.titleBn.trim(),
      subtitle: formData.subtitle.trim(),
      subtitleBn: formData.subtitleBn.trim(),
      targetCategoryOrUrl: formData.targetCategoryOrUrl.trim() || 'https://bazarcomm.netlify.app',
      buttonLabel: formData.buttonLabel.trim() || 'Shop Now',
      buttonLabelBn: formData.buttonLabelBn.trim() || 'এখনই কিনুন',
      badgeText: formData.badgeText.trim(),
      isActive: formData.isActive,
      order: sortedBanners.length + 1
    };

    const created = addHeroBanner(newSlide);
    await syncBannerToFirestore(created);

    addToast(
      '🎉 নতুন হিরো ব্যানার যোগ হয়েছে!',
      `"${newSlide.title}" মেইন বাজার হিরো কার্সোলে যোগ হয়েছে।`,
      'success'
    );
    setShowAddModal(false);
  };

  // Toggle Active/Inactive Status
  const handleToggleActive = async (banner: HeroBanner) => {
    const updated = !banner.isActive;
    updateHeroBanner(banner.id, { isActive: updated });
    await syncBannerToFirestore({ ...banner, isActive: updated });
    addToast(
      updated ? 'ব্যানার সক্রিয় করা হয়েছে' : 'ব্যানার নিষ্ক্রিয় করা হয়েছে',
      `"${banner.title}" মেইন ওয়েবসাইটে ${updated ? 'প্রদর্শিত হবে' : 'লুকানো থাকবে'}।`
    );
  };

  // Delete Slide
  const handleDeleteSlide = async (banner: HeroBanner) => {
    deleteHeroBanner(banner.id);
    await deleteBannerFromFirestore(banner.id);
    addToast('ব্যানার মুছে ফেলা হয়েছে', `"${banner.title}" হিরো কার্সোল থেকে ডিলিট করা হয়েছে।`);
  };

  // Move Slide Up
  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    const reordered = [...sortedBanners];
    const temp = reordered[index - 1];
    reordered[index - 1] = reordered[index];
    reordered[index] = temp;

    // Re-assign order numbers
    const updated = reordered.map((b, idx) => ({ ...b, order: idx + 1 }));
    reorderHeroBanners(updated);

    // Sync to Firestore
    for (const b of updated) {
      await syncBannerToFirestore(b);
    }
  };

  // Move Slide Down
  const handleMoveDown = async (index: number) => {
    if (index >= sortedBanners.length - 1) return;
    const reordered = [...sortedBanners];
    const temp = reordered[index + 1];
    reordered[index + 1] = reordered[index];
    reordered[index] = temp;

    const updated = reordered.map((b, idx) => ({ ...b, order: idx + 1 }));
    reorderHeroBanners(updated);

    for (const b of updated) {
      await syncBannerToFirestore(b);
    }
  };

  // Save Editing Banner
  const handleSaveEditBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBanner) return;

    updateHeroBanner(editingBanner.id, editingBanner);
    await syncBannerToFirestore(editingBanner);
    addToast('হালনাগাদ সম্পন্ন', `"${editingBanner.title}" এর পরিবর্তন সেভ করা হয়েছে।`);
    setEditingBanner(null);
  };

  // Current preview slide
  const currentPreviewSlide = activeBanners[activeSlideIndex] || sortedBanners[0];

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Header */}
      <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-slate-900 rounded-3xl p-6 lg:p-8 text-white shadow-xl relative overflow-hidden border border-emerald-500/20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-bold text-xs flex items-center gap-1.5 backdrop-blur-sm">
                <GalleryHorizontalEnd className="w-3.5 h-3.5" />
                <span>মেইন ওয়েবসাইট হিরো কার্সোল ম্যানেজার</span>
              </span>
              <span className="px-3 py-1 rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-300 font-bold text-xs flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
                <span>mainbazar.com Live Sync</span>
              </span>
              <span className="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-mono">
                🔥 Firestore: bazar-com-2f14f
              </span>
            </div>

            <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-white">
              হিরো কার্সোল ও ব্যানার পরিচালনা (Hero Carousel)
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              মেইন বাজার ওয়েবসাইট (mainbazar.com) এর সামনের প্রধান হিরো স্লাইডার ও ব্যানারগুলো এখান থেকে
              লাইভ পরিচালনা করুন। প্রোডাক্ট লিংক পেস্ট করে সাথে সাথে স্লাইড তৈরি করুন অথবা কাস্টম ইমেজ ইউআরএল আপলোড করুন।
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-sm rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-500/30 transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>নতুন কার্সোল স্লাইড যোগ করুন</span>
            </button>

            <button
              onClick={() => setIsStoreDemoOpen(true)}
              className="px-4 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm rounded-xl flex items-center gap-2 shadow-lg shadow-sky-500/30 transition-all hover:scale-105 active:scale-95"
            >
              <Globe className="w-4 h-4" />
              <span>মেইন ওয়েবসাইট ডেমো</span>
              <span className="w-2 h-2 rounded-full bg-emerald-950 animate-ping" />
            </button>

            <button
              onClick={handleFullSyncFirestore}
              disabled={isSyncingFirestore}
              className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl flex items-center gap-2 border border-white/10 backdrop-blur-sm transition-colors"
              title="Sync all carousel slides directly with Firebase Firestore"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingFirestore ? 'animate-spin text-emerald-400' : ''}`} />
              <span>{isSyncingFirestore ? 'সিন্ক হচ্ছে...' : 'ফায়ারস্টোর সিন্ক'}</span>
            </button>

            <button
              onClick={() => setShowApiModal(true)}
              className="p-2.5 bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white rounded-xl border border-white/10 transition-colors"
              title="View JSON Payload for mainbazar.com"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">মোট স্লাইড</span>
            <div className="text-xl font-black text-white mt-0.5">{sortedBanners.length} টি</div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <span className="text-[11px] text-emerald-400 uppercase font-bold tracking-wider">লাইভ সক্রিয়</span>
            <div className="text-xl font-black text-emerald-300 mt-0.5">{activeBanners.length} টি</div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <span className="text-[11px] text-amber-400 uppercase font-bold tracking-wider">প্রোডাক্ট লিঙ্কড</span>
            <div className="text-xl font-black text-amber-300 mt-0.5">
              {sortedBanners.filter(b => b.productId).length} টি
            </div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <span className="text-[11px] text-sky-400 uppercase font-bold tracking-wider">মেইন ডোমেন</span>
            <div className="text-sm font-mono font-bold text-sky-300 mt-1 truncate">bazarcomm.netlify.app</div>
          </div>
        </div>
      </div>

      {/* Live Interactive Hero Carousel Preview */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                মেইন ওয়েবসাইট লাইভ ভিউ প্রিভিউ (Live Preview)
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              গ্রাহকরা bazarcomm.netlify.app এর হোমপেজে হিরো স্লাইডারটি ঠিক যেভাবে দেখতে পাবেন:
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Viewport switch: Desktop / Mobile */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-700/60 p-1 rounded-xl border border-slate-200 dark:border-slate-600 text-xs font-semibold">
              <button
                onClick={() => setPreviewDevice('desktop')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                  previewDevice === 'desktop'
                    ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>ডেস্কটপ</span>
              </button>
              <button
                onClick={() => setPreviewDevice('mobile')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                  previewDevice === 'mobile'
                    ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>মোবাইল</span>
              </button>
            </div>

            {/* Play/Pause Autoplay */}
            <button
              onClick={() => setIsAutoPlaying(!isAutoPlaying)}
              className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1 transition-colors ${
                isAutoPlaying
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                  : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600'
              }`}
              title={isAutoPlaying ? 'Pause Auto-play' : 'Resume Auto-play'}
            >
              {isAutoPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            </button>
          </div>
        </div>

        {/* Carousel Frame */}
        <div className={`mx-auto transition-all duration-300 ${previewDevice === 'mobile' ? 'max-w-sm' : 'w-full'}`}>
          {currentPreviewSlide ? (
            <div className="relative rounded-2xl overflow-hidden shadow-xl aspect-16/9 md:aspect-21/9 bg-slate-900 border border-slate-800 group">
              {/* Background Image */}
              <img
                src={currentPreviewSlide.imageUrl}
                alt={currentPreviewSlide.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />

              {/* Gradient Scrim Overlay for contrast */}
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/70 to-transparent flex flex-col justify-center p-6 md:p-10 lg:p-12 text-white">
                <div className="max-w-xl space-y-2 md:space-y-3">
                  {/* Tagline / Badge */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500 text-slate-950 font-black text-[10px] md:text-xs uppercase tracking-wider shadow-md">
                      {currentPreviewSlide.badgeText || currentPreviewSlide.tagline || '🔥 EXCLUSIVE DEAL'}
                    </span>
                    {currentPreviewSlide.productId && (
                      <span className="px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-mono text-white/90 flex items-center gap-1">
                        <LinkIcon className="w-2.5 h-2.5 text-sky-300" />
                        <span>Connected to Product</span>
                      </span>
                    )}
                  </div>

                  {/* Main Title */}
                  <h3 className="text-lg md:text-2xl lg:text-3xl font-black text-white leading-tight drop-shadow-md">
                    {language === 'bn' && currentPreviewSlide.titleBn
                      ? currentPreviewSlide.titleBn
                      : currentPreviewSlide.title}
                  </h3>

                  {/* Subtitle */}
                  <p className="text-xs md:text-sm text-slate-200/90 line-clamp-2 drop-shadow-sm font-medium">
                    {language === 'bn' && currentPreviewSlide.subtitleBn
                      ? currentPreviewSlide.subtitleBn
                      : currentPreviewSlide.subtitle}
                  </p>

                  {/* Action Button & Destination URL */}
                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <a
                      href={currentPreviewSlide.targetCategoryOrUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs md:text-sm rounded-xl shadow-lg transition-transform hover:scale-105 active:scale-95 flex items-center gap-1.5"
                    >
                      <span>
                        {language === 'bn' && currentPreviewSlide.buttonLabelBn
                          ? currentPreviewSlide.buttonLabelBn
                          : currentPreviewSlide.buttonLabel || 'Shop Now'}
                      </span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>

                    <div className="px-2.5 py-1 bg-black/40 backdrop-blur-md rounded-lg text-[10px] font-mono text-slate-300 border border-white/10 truncate max-w-[200px]">
                      {currentPreviewSlide.targetCategoryOrUrl}
                    </div>
                  </div>
                </div>
              </div>

              {/* Prev / Next Chevrons */}
              {activeBanners.length > 1 && (
                <>
                  <button
                    onClick={() =>
                      setActiveSlideIndex(prev => (prev === 0 ? activeBanners.length - 1 : prev - 1))
                    }
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-slate-950/60 hover:bg-slate-950/90 text-white flex items-center justify-center backdrop-blur-md border border-white/20 shadow-md transition-transform hover:scale-110 active:scale-90"
                    title="Previous Slide"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setActiveSlideIndex(prev => (prev + 1) % activeBanners.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-slate-950/60 hover:bg-slate-950/90 text-white flex items-center justify-center backdrop-blur-md border border-white/20 shadow-md transition-transform hover:scale-110 active:scale-90"
                    title="Next Slide"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Pagination Dots */}
              {activeBanners.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-slate-950/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                  {activeBanners.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveSlideIndex(idx)}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        activeSlideIndex === idx ? 'w-6 bg-emerald-400' : 'w-2 bg-white/40 hover:bg-white/70'
                      }`}
                    />
                  ))}
                </div>
              )}

              {/* Current Slide Indicator Pill */}
              <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-slate-950/70 backdrop-blur-md text-[10px] font-mono text-white border border-white/10">
                স্লাইড {activeSlideIndex + 1} / {activeBanners.length}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl">
              <GalleryHorizontalEnd className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300">কোনো সক্রিয় স্লাইড নেই</p>
              <p className="text-xs text-slate-400 mt-1">নিচে নতুন স্লাইড যোগ করে সক্রিয় করুন।</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Add / Upload Section Card */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-700/60 pb-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>হিরো কার্সোল আপলোড ও নতুন স্লাইড তৈরি করুন</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              প্রোডাক্ট লিংক পেস্ট করে এক ক্লিকে স্লাইডার তৈরি করুন অথবা ইমেজ ইউআরএল দিয়ে কাস্টম ব্যানার বানান।
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700/60 p-1 rounded-xl border border-slate-200 dark:border-slate-600 text-xs font-bold">
            <button
              onClick={() => setAddMode('paste_link')}
              className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                addMode === 'paste_link'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>প্রোডাক্ট লিংক পেস্ট করুন</span>
            </button>
            <button
              onClick={() => setAddMode('custom_image')}
              className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                addMode === 'custom_image'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>ইমেজ ইউআরএল আপলোড</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Paste Personal Product Link */}
        {addMode === 'paste_link' && (
          <div className="space-y-4">
            <div className="bg-slate-50 dark:bg-slate-900/40 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/80">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                📋 পণ্য তালিকা থেকে কপি করা প্রোডাক্টের পার্সোনাল লিংক এখানে পেস্ট করুন:
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                  <input
                    type="text"
                    value={pastedProductLink}
                    onChange={e => setPastedProductLink(e.target.value)}
                    placeholder="https://bazarcomm.netlify.app/product/prod-3 অথবা SKU যেমন BZR-DEAL-009 পেস্ট করুন..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedProductId}
                    onChange={e => {
                      setSelectedProductId(e.target.value);
                      if (e.target.value) {
                        setPastedProductLink(`https://bazarcomm.netlify.app/product/${e.target.value}`);
                      }
                    }}
                    className="px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="">-- বা সরাসরি ক্যাটালগ থেকে পণ্য বাছুন --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.title} (৳{p.price.toLocaleString()})
                      </option>
                    ))}
                  </select>

                  {pastedProductLink && (
                    <button
                      type="button"
                      onClick={() => {
                        setPastedProductLink('');
                        setSelectedProductId('');
                        setDetectedProduct(null);
                      }}
                      className="p-2.5 text-slate-400 hover:text-rose-500 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700"
                      title="Clear"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Detected Product Card */}
            {detectedProduct ? (
              <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border-2 border-emerald-500/40 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 animate-fadeIn">
                <div className="flex items-center gap-4 min-w-0">
                  <img
                    src={detectedProduct.images[0] || 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400'}
                    alt={detectedProduct.title}
                    className="w-16 h-16 rounded-xl object-cover border border-emerald-300 dark:border-emerald-700 shrink-0 shadow-sm"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-bold text-[10px] uppercase">
                        পণ্য শনাক্ত হয়েছে ✅
                      </span>
                      {Boolean(detectedProduct.isFreeDelivery || detectedProduct.badges?.includes('free_delivery')) && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 font-bold text-[10px] flex items-center gap-1 border border-emerald-300 dark:border-emerald-700">
                          <span>🚚 ফ্রি ডেলিভারি</span>
                        </span>
                      )}
                      <span className="text-[10px] font-mono text-slate-500">
                        SKU: {detectedProduct.sku}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate mt-0.5">
                      {detectedProduct.title}
                    </h4>
                    {detectedProduct.titleBn && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {detectedProduct.titleBn}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-black text-emerald-700 dark:text-emerald-400 font-mono">
                        ৳{detectedProduct.price.toLocaleString()}
                      </span>
                      {detectedProduct.originalPrice > detectedProduct.price && (
                        <span className="text-xs text-slate-400 line-through font-mono">
                          ৳{detectedProduct.originalPrice.toLocaleString()}
                        </span>
                      )}
                      {detectedProduct.discountPercentage > 0 && (
                        <span className="px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 font-bold text-[10px]">
                          {detectedProduct.discountPercentage}% OFF
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleAddProductSlide}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-transform hover:scale-105 active:scale-95"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>হিরো কার্সোলে অ্যাড করুন 🚀</span>
                  </button>
                </div>
              </div>
            ) : pastedProductLink ? (
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>
                  প্রদত্ত লিংক বা আইডি দিয়ে কোনো প্রোডাক্ট মেলেনি। ড্রপডাউন থেকে সরাসরি পণ্য সিলেক্ট করতে পারেন।
                </span>
              </div>
            ) : null}
          </div>
        )}

        {/* Tab 2: Custom Image URL Upload System */}
        {addMode === 'custom_image' && (
          <form onSubmit={handleAddCustomSlide} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Image URL Input & Preview with ImgBB Uploader */}
              <div className="bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                <ImgbbImageUploader
                  label="ব্যানার ছবি আপলোড (ImgBB Gallery Uploader)"
                  hint="গ্যালারি থেকে হাই-কোয়ালিটি ব্যানার ছবি সিলেক্ট করুন। বড় সাইজের MB ছবি স্বয়ংক্রিয়ভাবে হালকা KB-তে কমপ্রেস হয়ে আপনার ImgBB API দিয়ে আপলোড হবে।"
                  value={formData.imageUrl}
                  aspectRatio="video"
                  onChange={url => setFormData({ ...formData, imageUrl: url })}
                  presetOptions={PRESET_CAROUSEL_BANNERS.map(p => ({ label: p.labelBn, url: p.imageUrl }))}
                />
              </div>

              {/* Title & Content Fields */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      ট্যাগলাইন / ব্যাজ (English):
                    </label>
                    <input
                      type="text"
                      value={formData.tagline}
                      onChange={e => setFormData({ ...formData, tagline: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs"
                      placeholder="e.g. Flash Deal 40% OFF"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      ট্যাগলাইন (বাংলা):
                    </label>
                    <input
                      type="text"
                      value={formData.taglineBn}
                      onChange={e => setFormData({ ...formData, taglineBn: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs"
                      placeholder="যেমন: মেগা ফ্ল্যাশ ডিল"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      মূল টাইটেল (English): *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-bold"
                      placeholder="e.g. Summer Mega Collection"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      মূল টাইটেল (বাংলা):
                    </label>
                    <input
                      type="text"
                      value={formData.titleBn}
                      onChange={e => setFormData({ ...formData, titleBn: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-bold"
                      placeholder="যেমন: সামার মেগা কালেকশন"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    সাবটাইটেল / অফারের বিবরণ:
                  </label>
                  <textarea
                    rows={2}
                    value={formData.subtitle}
                    onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs"
                    placeholder="অফারের বিস্তারিত তথ্য..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      টার্গেট লিংক (Target URL):
                    </label>
                    <input
                      type="text"
                      value={formData.targetCategoryOrUrl}
                      onChange={e => setFormData({ ...formData, targetCategoryOrUrl: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-mono"
                      placeholder="https://bazarcomm.netlify.app/product/..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      বাটন টেক্সট:
                    </label>
                    <input
                      type="text"
                      value={formData.buttonLabel}
                      onChange={e => setFormData({ ...formData, buttonLabel: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs"
                      placeholder="Shop Now / এখনই কিনুন"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-transform hover:scale-105 active:scale-95"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>কাস্টম ব্যানার যোগ করুন</span>
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Existing Carousel Slides Management List */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <GalleryHorizontalEnd className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>বর্তমান হিরো স্লাইড তালিকা ({sortedBanners.length})</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              ক্রম পরিবর্তন করতে উপরে/নিচে তীর চিহ্ন চাপুন। সক্রিয়/নিষ্ক্রিয় করতে সুইচ টগল করুন।
            </p>
          </div>

          {sortedBanners.length > 0 && (
            <button
              type="button"
              onClick={handleClearAllSlides}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 text-xs font-bold transition-colors"
              title="সকল হিরো স্লাইড মুছে সম্পূর্ণ খালি (০ ব্যানার) করুন"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>সব স্লাইড মুছুন (০ করুন)</span>
            </button>
          )}
        </div>

        {sortedBanners.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50/50 dark:bg-slate-900/20">
            <GalleryHorizontalEnd className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
              ওয়েবসাইটটি সম্পূর্ণ নতুন — বর্তমানে কোনো হিরো ব্যানার নেই (০ ব্যানার)
            </p>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              উপরে প্রোডাক্ট লিংক পেস্ট করে অথবা ইমেজ ইউআরএল ও টেক্সট দিয়ে আপনি যখন নতুন স্লাইড যোগ করবেন, তখন তা এখানে এবং মেইন ওয়েবসাইটে যুক্ত হবে।
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedBanners.map((banner, index) => (
              <div
                key={banner.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  banner.isActive
                    ? 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700'
                    : 'bg-slate-100/50 dark:bg-slate-900/20 border-slate-200 dark:border-slate-800 opacity-60'
                }`}
              >
                {/* Banner Thumbnail & Info */}
                <div className="flex items-center gap-4 min-w-0">
                  {/* Order indicator */}
                  <div className="flex flex-col items-center justify-center gap-1 shrink-0">
                    <button
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      className="p-1 rounded text-slate-400 hover:text-emerald-600 disabled:opacity-20 hover:bg-slate-200 dark:hover:bg-slate-700"
                      title="Move Up"
                    >
                      <MoveUp className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-mono font-bold text-slate-500">#{index + 1}</span>
                    <button
                      onClick={() => handleMoveDown(index)}
                      disabled={index === sortedBanners.length - 1}
                      className="p-1 rounded text-slate-400 hover:text-emerald-600 disabled:opacity-20 hover:bg-slate-200 dark:hover:bg-slate-700"
                      title="Move Down"
                    >
                      <MoveDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Thumbnail */}
                  <img
                    src={banner.imageUrl}
                    alt={banner.title}
                    className="w-20 h-14 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0 bg-slate-800"
                  />

                  {/* Details */}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-[10px]">
                        {banner.badgeText || banner.tagline || 'HERO SLIDE'}
                      </span>
                      {banner.productId && (
                        <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-mono text-[10px] flex items-center gap-1">
                          <LinkIcon className="w-2.5 h-2.5" />
                          <span>Connected to ID: {banner.productId}</span>
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate mt-1">
                      {banner.title}
                    </h4>

                    {banner.titleBn && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {banner.titleBn}
                      </p>
                    )}

                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] font-mono text-slate-400 truncate max-w-xs">
                        🔗 {banner.targetCategoryOrUrl}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Side Actions */}
                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  {/* Status Toggle Switch */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(banner)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        banner.isActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                      }`}
                      title={banner.isActive ? 'Active (Live on website)' : 'Inactive (Hidden)'}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                          banner.isActive ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span
                      className={`text-[11px] font-bold ${
                        banner.isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                      }`}
                    >
                      {banner.isActive ? 'LIVE' : 'OFF'}
                    </span>
                  </div>

                  {/* Edit Button */}
                  <button
                    onClick={() => setEditingBanner(banner)}
                    className="p-2 text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    title="Edit Slide"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDeleteSlide(banner)}
                    className="p-2 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    title="Delete Slide"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Banner Modal */}
      {editingBanner && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-emerald-500" />
                <span>হিরো ব্যানার সম্পাদনা করুন</span>
              </h3>
              <button
                onClick={() => setEditingBanner(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditBanner} className="space-y-3 mt-4">
              <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <ImgbbImageUploader
                  label="ব্যানার ইমেজ পরিবর্তন (ImgBB Cloud)"
                  hint="গ্যালারি থেকে নতুন ব্যানার ছবি সিলেক্ট করুন। সাইজ স্বয়ংক্রিয়ভাবে অপ্টিমাইজ হয়ে আপডেট হবে।"
                  value={editingBanner.imageUrl}
                  aspectRatio="video"
                  onChange={url => setEditingBanner({ ...editingBanner, imageUrl: url })}
                  presetOptions={PRESET_CAROUSEL_BANNERS.map(p => ({ label: p.labelBn, url: p.imageUrl }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    টাইটেল (English):
                  </label>
                  <input
                    type="text"
                    required
                    value={editingBanner.title}
                    onChange={e => setEditingBanner({ ...editingBanner, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    টাইটেল (বাংলা):
                  </label>
                  <input
                    type="text"
                    value={editingBanner.titleBn || ''}
                    onChange={e => setEditingBanner({ ...editingBanner, titleBn: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  সাবটাইটেল:
                </label>
                <textarea
                  rows={2}
                  value={editingBanner.subtitle}
                  onChange={e => setEditingBanner({ ...editingBanner, subtitle: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    টার্গেট লিংক:
                  </label>
                  <input
                    type="text"
                    value={editingBanner.targetCategoryOrUrl}
                    onChange={e =>
                      setEditingBanner({ ...editingBanner, targetCategoryOrUrl: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    বাটন টেক্সট:
                  </label>
                  <input
                    type="text"
                    value={editingBanner.buttonLabel}
                    onChange={e => setEditingBanner({ ...editingBanner, buttonLabel: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="modalIsActive"
                  checked={editingBanner.isActive}
                  onChange={e => setEditingBanner({ ...editingBanner, isActive: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="modalIsActive" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  মেইন ওয়েবসাইটে এই স্লাইডটি লাইভ প্রদর্শন করুন (Active)
                </label>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingBanner(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Website API Endpoint Modal */}
      {showApiModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Info className="w-4 h-4 text-sky-500" />
                <span>mainbazar.com এর জন্য হিরো কার্সোল ডেটা পেলোড</span>
              </h3>
              <button
                onClick={() => setShowApiModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                মেইন ওয়েবসাইট (mainbazar.com) এর ফ্রন্টএন্ড ফায়ারস্টোর কালেকশন{' '}
                <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-900 text-emerald-600 font-mono">
                  hero_banners
                </code>{' '}
                থেকে সরাসরি এই ডেটা রিড করে থাকে:
              </p>

              <pre className="p-3 bg-slate-950 text-emerald-400 rounded-xl text-[11px] font-mono overflow-x-auto max-h-60 border border-slate-800">
                {JSON.stringify(activeBanners, null, 2)}
              </pre>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(activeBanners, null, 2));
                    addToast('JSON Copied', 'Carousel payload copied to clipboard.');
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>কপি করুন</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Hero Carousel Slide Creator Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 animate-scaleUp my-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                  <GalleryHorizontalEnd className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    নতুন হিরো কার্সোল স্লাইড তৈরি ও আপলোড
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    মেইন ওয়েবসাইট (mainbazar.com) এর সামনের প্রধান স্লাইডারে শো হবে
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 dark:bg-slate-900/60 rounded-2xl my-4 text-xs font-bold">
              <button
                type="button"
                onClick={() => setAddMode('custom_image')}
                className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                  addMode === 'custom_image'
                    ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                <span>🎨 কাস্টম ইমেজ ও টেক্সট আপলোড</span>
              </button>
              <button
                type="button"
                onClick={() => setAddMode('paste_link')}
                className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                  addMode === 'paste_link'
                    ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <LinkIcon className="w-4 h-4 text-indigo-500" />
                <span>🔗 প্রোডাক্টের লিংক পেস্ট করুন</span>
              </button>
            </div>

            {/* Mode 1: Custom Image & Text Upload */}
            {addMode === 'custom_image' && (
              <form onSubmit={handleAddCustomSlide} className="space-y-4">
                {/* Image URL Input & Preview with ImgBB Uploader */}
                <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <ImgbbImageUploader
                    label="ব্যানার ছবি আপলোড (ImgBB Gallery Uploader)"
                    hint="গ্যালারি থেকে হাই-কোয়ালিটি ব্যানার ছবি নির্বাচন করুন। বড় সাইজের ছবি স্বয়ংক্রিয়ভাবে KB-তে কমপ্রেস হয়ে আপনার দেওয়া ImgBB API দিয়ে আপলোড হবে।"
                    value={formData.imageUrl}
                    aspectRatio="video"
                    onChange={url => setFormData({ ...formData, imageUrl: url })}
                    presetOptions={PRESET_CAROUSEL_BANNERS.map(p => ({ label: p.labelBn, url: p.imageUrl }))}
                  />
                </div>

                {/* Title Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      মূল টাইটেল (English): *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g. Eid Festive Special 50% Off"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      মূল টাইটেল (বাংলা):
                    </label>
                    <input
                      type="text"
                      value={formData.titleBn}
                      onChange={e => setFormData({ ...formData, titleBn: e.target.value })}
                      placeholder="যেমন: ঈদ উৎসব স্পেশাল ৫০% পর্যন্ত ছাড়"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-xs font-bold"
                    />
                  </div>
                </div>

                {/* Tagline / Badges */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      ট্যাগলাইন / ব্যাজ টেক্সট (English):
                    </label>
                    <input
                      type="text"
                      value={formData.tagline}
                      onChange={e => setFormData({ ...formData, tagline: e.target.value })}
                      placeholder="e.g. FLASH SALE 40% OFF"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      ট্যাগলাইন (বাংলা):
                    </label>
                    <input
                      type="text"
                      value={formData.taglineBn}
                      onChange={e => setFormData({ ...formData, taglineBn: e.target.value })}
                      placeholder="যেমন: 🔥 মেগা ফ্ল্যাশ ডিল"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-xs"
                    />
                  </div>
                </div>

                {/* Subtitle / Offer Details */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    সাবটাইটেল / অফার বিবরণ:
                  </label>
                  <textarea
                    rows={2}
                    value={formData.subtitle}
                    onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
                    placeholder="সারা দেশে দ্রুত ক্যাশ অন হোম ডেলিভারি ও অরিজিনাল ব্র্যান্ড ওয়্যারেন্টি সহ..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-xs"
                  />
                </div>

                {/* Target URL & Button Label */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      টার্গেট লিংক (Target URL on mainbazar.com):
                    </label>
                    <input
                      type="text"
                      value={formData.targetCategoryOrUrl}
                      onChange={e => setFormData({ ...formData, targetCategoryOrUrl: e.target.value })}
                      placeholder="https://mainbazar.com/product/..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      বাটন টেক্সট (Button Label):
                    </label>
                    <input
                      type="text"
                      value={formData.buttonLabel}
                      onChange={e => setFormData({ ...formData, buttonLabel: e.target.value })}
                      placeholder="Shop Now / এখনই কিনুন"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-xs font-bold"
                    />
                  </div>
                </div>

                {/* Active Checkbox */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="addModalIsActive"
                    checked={formData.isActive}
                    onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="addModalIsActive" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    মেইন ওয়েবসাইটে এই স্লাইডটি সাথে সাথে সক্রিয় ও লাইভ রাখুন (Active)
                  </label>
                </div>

                {/* Submit button */}
                <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 transition-transform hover:scale-105 active:scale-95"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>সংরক্ষণ ও লাইভ আপলোড করুন 🚀</span>
                  </button>
                </div>
              </form>
            )}

            {/* Mode 2: Paste Product Personal Link */}
            {addMode === 'paste_link' && (
              <div className="space-y-4">
                <div className="bg-slate-50 dark:bg-slate-900/40 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    📋 পণ্য তালিকা থেকে কপি করা প্রোডাক্টের পার্সোনাল লিংক বা SKU পেস্ট করুন:
                  </label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                    <input
                      type="text"
                      value={pastedProductLink}
                      onChange={e => setPastedProductLink(e.target.value)}
                      placeholder="https://mainbazar.com/product/prod-3 অথবা SKU যেমন BZR-DEAL-009 পেস্ট করুন..."
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="mt-3">
                    <span className="text-[11px] font-semibold text-slate-500">অথবা সরাসরি ক্যাটালগ থেকে পছন্দ করুন:</span>
                    <select
                      value={selectedProductId}
                      onChange={e => {
                        setSelectedProductId(e.target.value);
                        if (e.target.value) {
                          setPastedProductLink(`https://mainbazar.com/product/${e.target.value}`);
                        }
                      }}
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-medium"
                    >
                      <option value="">-- ক্যাটালগের পণ্য বাছুন --</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.title} (৳{p.price.toLocaleString()}) - SKU: {p.sku}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Detected Product Card */}
                {detectedProduct ? (
                  <div className="bg-emerald-50/80 dark:bg-emerald-950/40 border-2 border-emerald-500 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-scaleUp">
                    <div className="flex items-center gap-4 min-w-0">
                      <img
                        src={detectedProduct.images[0]}
                        alt={detectedProduct.title}
                        className="w-16 h-16 rounded-xl object-cover border border-emerald-300 dark:border-emerald-700 shrink-0 shadow-sm"
                      />
                      <div className="min-w-0">
                        <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-bold text-[10px]">
                          পণ্য শনাক্ত হয়েছে ✅
                        </span>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate mt-1">
                          {detectedProduct.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5 font-mono">
                          <span className="text-sm font-black text-emerald-700 dark:text-emerald-400">
                            ৳{detectedProduct.price.toLocaleString()}
                          </span>
                          {detectedProduct.discountPercentage > 0 && (
                            <span className="px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 font-bold text-[10px]">
                              {detectedProduct.discountPercentage}% OFF
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddProductSlide}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-transform hover:scale-105 active:scale-95 shrink-0"
                    >
                      <Plus className="w-4 h-4 stroke-[3]" />
                      <span>হিরো কার্সোলে অ্যাড করুন 🚀</span>
                    </button>
                  </div>
                ) : pastedProductLink ? (
                  <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>প্রদত্ত লিংক বা আইডি দিয়ে কোনো পণ্য পাওয়া যায়নি। ড্রপডাউন থেকে পণ্য সিলেক্ট করুন।</span>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Website Storefront Interactive Live Demo Modal */}
      <MainBazarDemoModal
        isOpen={isStoreDemoOpen}
        onClose={() => setIsStoreDemoOpen(false)}
        onOpenCustomizer={() => setShowAddModal(true)}
      />
    </div>
  );
};
