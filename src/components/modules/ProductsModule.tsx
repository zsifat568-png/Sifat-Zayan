import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Product, ProductBadge, STORE_CATEGORIES, CategoryAttributes } from '../../types';
import { ImgbbImageUploader } from '../common/ImgbbImageUploader';
import {
  Plus,
  Search,
  Filter,
  Trash2,
  Edit2,
  Check,
  X,
  AlertTriangle,
  Zap,
  Truck,
  Star,
  Crown,
  ChevronLeft,
  ChevronRight,
  Package,
  Image as ImageIcon,
  Cpu,
  Shirt,
  Home as HomeIcon,
  Sparkles,
  Smartphone,
  Laptop as LaptopIcon,
  Camera as CameraIcon,
  Watch,
  Tag,
  ShieldCheck,
  BatteryCharging,
  Scissors,
  Lock,
  TrendingUp,
  DollarSign,
  Eye,
  EyeOff,
  CheckCircle2,
  Link as LinkIcon,
  Copy,
  GalleryHorizontalEnd,
  ShoppingBag,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

const PRESET_GALLERY_IMAGES = [
  { label: 'Panjabi Apparel', url: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800&auto=format&fit=crop&q=80' },
  { label: 'Smartphone Pro', url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop&q=80' },
  { label: 'Earbuds Tech', url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=80' },
  { label: 'UltraBook Laptop', url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&auto=format&fit=crop&q=80' },
  { label: '4K Camera', url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop&q=80' },
  { label: 'Wooden Desk Home', url: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800&auto=format&fit=crop&q=80' },
  { label: 'Beauty Serum', url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&auto=format&fit=crop&q=80' },
  { label: 'Leather Wallet Set', url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&auto=format&fit=crop&q=80' },
  { label: 'Fast Charger Deal', url: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&auto=format&fit=crop&q=80' }
];

export const ProductsModule: React.FC = () => {
  const {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    deleteProductsBulk,
    updateProductStatusBulk,
    updateStockInline,
    searchQuery,
    setSearchQuery,
    addToast,
    setActiveTab,
    addHeroBanner,
    heroBanners,
    t
  } = useApp();

  // Filters State
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStockFilter, setSelectedStockFilter] = useState<string>('all');
  const [selectedBadgeFilter, setSelectedBadgeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');

  // Bulk Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState<boolean>(false);

  // Delete Confirmation State (Purges from Firebase & Website)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const handleExecuteDelete = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      await deleteProduct(productToDelete.id);
    } finally {
      setIsDeleting(false);
      setProductToDelete(null);
    }
  };

  const handleExecuteBulkDelete = async () => {
    if (!selectedIds.length) return;
    setIsDeleting(true);
    try {
      await deleteProductsBulk(selectedIds);
      setSelectedIds([]);
    } finally {
      setIsDeleting(false);
      setShowBulkDeleteModal(false);
    }
  };

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 8;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Product Form Base State
  const [formData, setFormData] = useState({
    title: '',
    titleBn: '',
    description: '',
    descriptionBn: '',
    category: 'Fashion' as string,
    tagsInput: '',
    price: 1800,
    wholesalePrice: 1250,
    originalPrice: 2200,
    discountPercentage: 18,
    stock: 50,
    lowStockLimit: 10,
    images: ['https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800&auto=format&fit=crop&q=80'],
    newImageUrlInput: '',
    badges: ['featured'] as ProductBadge[],
    isFreeDelivery: false,
    isActive: true,
    sku: `BZR-${Math.floor(100 + Math.random() * 900)}`
  });

  // Dynamic Category Custom Attributes Form State
  const [categoryAttrs, setCategoryAttrs] = useState<CategoryAttributes>({
    genderAudience: 'Men',
    apparelType: 'Panjabi',
    fabricMaterial: '100% Cotton',
    availableSizes: ['M', 'L', 'XL'],
    fitType: 'Regular Fit',
    careInstructions: 'Gentle Hand Wash'
  });

  // Unique Categories list for Filter Bar
  const categoryFilterOptions = useMemo(() => {
    const set = new Set<string>(STORE_CATEGORIES);
    products.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return ['all', ...Array.from(set)];
  }, [products]);

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    return products
      .filter(p => {
        // Search
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch =
          !q ||
          p.title.toLowerCase().includes(q) ||
          (p.titleBn && p.titleBn.toLowerCase().includes(q)) ||
          p.sku.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q)) ||
          p.tags.some(tag => tag.toLowerCase().includes(q));

        // Category
        const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;

        // Stock
        let matchesStock = true;
        if (selectedStockFilter === 'in_stock') matchesStock = p.stock >= 2;
        if (selectedStockFilter === 'low_stock') matchesStock = p.stock < 2;
        if (selectedStockFilter === 'out_of_stock') matchesStock = p.stock === 0;

        // Badge
        const matchesBadge =
          selectedBadgeFilter === 'all' ||
          (selectedBadgeFilter === 'free_delivery'
            ? Boolean(p.isFreeDelivery || p.badges.includes('free_delivery'))
            : p.badges.includes(selectedBadgeFilter as ProductBadge));

        return matchesSearch && matchesCat && matchesStock && matchesBadge;
      })
      .sort((a, b) => {
        if (sortBy === 'price_low') return a.price - b.price;
        if (sortBy === 'price_high') return b.price - a.price;
        if (sortBy === 'stock_low') return a.stock - b.stock;
        if (sortBy === 'title') return a.title.localeCompare(b.title);
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [products, searchQuery, selectedCategory, selectedStockFilter, selectedBadgeFilter, sortBy]);

  // Reset page when search or filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedStockFilter, selectedBadgeFilter, sortBy]);

  // Pagination Slice
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage]);

  // Handle Bulk Selection
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(paginatedProducts.map(p => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]));
  };

  // Generate personal direct link for main website bazarcomm.netlify.app
  const getProductPersonalLink = (product: Product) => {
    return `https://bazarcomm.netlify.app/product/${product.id}`;
  };

  // Copy personal product link to clipboard with user feedback
  const handleCopyProductLink = (product: Product) => {
    const link = getProductPersonalLink(product);
    navigator.clipboard.writeText(link);
    addToast(
      '📋 প্রোডাক্ট লিংক কপি হয়েছে!',
      `লিংক: ${link}। হিরো কার্সোল ট্যাবে গিয়ে পেস্ট করলে পণ্যটি কার্সোলে যুক্ত হবে।`,
      'success'
    );
  };

  // Direct 1-click push to Hero Carousel
  const handlePushToHeroCarousel = (product: Product) => {
    const directLink = getProductPersonalLink(product);
    const existing = (heroBanners || []).find(b => b.productId === product.id);
    if (existing) {
      addToast(
        'ইতিমধ্যে কার্সোলে আছে',
        `"${product.title}" ইতিমধ্যে হিরো কার্সোলে সক্রিয় রয়েছে।`,
        'info'
      );
      setActiveTab('hero_carousel');
      return;
    }

    addHeroBanner({
      imageUrl: product.images[0] || 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1600&auto=format&fit=crop&q=80',
      tagline: product.badges.includes('flash_sale')
        ? '🔥 FLASH SALE DEAL • EXCLUSIVE'
        : '⭐ FEATURED PRODUCT • TOP PICK',
      taglineBn: product.badges.includes('flash_sale')
        ? '🔥 মেগা ফ্ল্যাশ ডিল • সীমিত অফার'
        : '⭐ সেরা ও জনপ্রিয় পণ্য • মেইন বাজার',
      title: product.title,
      titleBn: product.titleBn || product.title,
      subtitle: `৳${product.price.toLocaleString()} (${product.discountPercentage > 0 ? `${product.discountPercentage}% OFF` : 'Best Price Guarantee'}) • Fast Delivery All Over Bangladesh`,
      subtitleBn: `৳${product.price.toLocaleString()} (${product.discountPercentage > 0 ? `${product.discountPercentage}% ছাড়` : 'সেরা বাজার মূল্যে'}) • সারা দেশে হোম ডেলিভারি`,
      targetCategoryOrUrl: directLink,
      targetProductLink: directLink,
      productId: product.id,
      productSku: product.sku,
      productPrice: product.price,
      productOriginalPrice: product.originalPrice,
      badgeText: product.discountPercentage > 0 ? `${product.discountPercentage}% OFF` : 'HOT DEAL',
      buttonLabel: `Shop Now ৳${product.price.toLocaleString()}`,
      buttonLabelBn: `এখনই কিনুন ৳${product.price.toLocaleString()}`,
      isActive: true,
      order: (heroBanners || []).length + 1
    });

    addToast(
      '🎉 হিরো কার্সোলে যুক্ত হয়েছে!',
      `"${product.title}" সফলভাবে মেইন ওয়েবসাইট (mainbazar.com) এর হিরো কার্সোলে পাঠানো হয়েছে।`,
      'success'
    );
    setActiveTab('hero_carousel');
  };

  // Helper when category changes in Add/Edit modal
  const handleCategoryChange = (newCat: string) => {
    setFormData(prev => ({ ...prev, category: newCat }));

    // Auto setup default preset values for category attributes if empty or switching category
    if (newCat === 'Phones') {
      setCategoryAttrs(prev => ({
        brand: prev.brand || 'Bazar Tech',
        ramGbs: prev.ramGbs || '8 GB',
        storageGbs: prev.storageGbs || '128 GB',
        batteryCapacity: prev.batteryCapacity || '5000 mAh',
        powerRating: prev.powerRating || '67W Fast Charge',
        displaySize: prev.displaySize || '6.7" AMOLED 120Hz',
        cameraSpecs: prev.cameraSpecs || '50MP OIS Camera',
        networkType: prev.networkType || '5G Dual SIM',
        warrantyPeriod: prev.warrantyPeriod || '1 Year Official Warranty'
      }));
    } else if (newCat === 'Laptops') {
      setCategoryAttrs(prev => ({
        brand: prev.brand || 'ZenBook',
        processor: prev.processor || 'Intel Core i7 13th Gen',
        ramGbs: prev.ramGbs || '16 GB',
        storageGbs: prev.storageGbs || '512 GB NVMe SSD',
        graphicsCard: prev.graphicsCard || 'Intel Iris Xe',
        screenResolution: prev.screenResolution || '15.6" FHD 144Hz',
        batteryCapacity: prev.batteryCapacity || '10 Hours Battery',
        warrantyPeriod: prev.warrantyPeriod || '2 Years Warranty'
      }));
    } else if (newCat === 'Cameras') {
      setCategoryAttrs(prev => ({
        brand: prev.brand || 'OptiMax',
        sensorResolution: prev.sensorResolution || '24.2 MP Full Frame',
        lensType: prev.lensType || '24-70mm f/2.8 Lens',
        videoResolution: prev.videoResolution || '4K 60fps',
        batteryCapacity: prev.batteryCapacity || '720 Shots',
        warrantyPeriod: prev.warrantyPeriod || '3 Years Warranty'
      }));
    } else if (newCat === 'Electronics') {
      setCategoryAttrs(prev => ({
        brand: prev.brand || 'SoundPulse',
        batteryCapacity: prev.batteryCapacity || '30 Hours',
        connectivity: prev.connectivity || 'Bluetooth 5.3',
        powerRating: prev.powerRating || '65W Fast Charge',
        warrantyPeriod: prev.warrantyPeriod || '6 Months Warranty'
      }));
    } else if (newCat === 'Fashion') {
      setCategoryAttrs(prev => ({
        genderAudience: prev.genderAudience || 'Men',
        apparelType: prev.apparelType || 'Panjabi',
        fabricMaterial: prev.fabricMaterial || '100% Organic Cotton',
        availableSizes: prev.availableSizes && prev.availableSizes.length > 0 ? prev.availableSizes : ['M', 'L', 'XL'],
        fitType: prev.fitType || 'Regular Fit',
        careInstructions: prev.careInstructions || 'Dry Clean or Gentle Wash'
      }));
    } else if (newCat === 'Home') {
      setCategoryAttrs(prev => ({
        roomType: prev.roomType || 'Living Room',
        primaryMaterial: prev.primaryMaterial || 'Solid Teak Wood',
        dimensions: prev.dimensions || '120 x 60 x 75 cm',
        itemWeight: prev.itemWeight || '15 kg'
      }));
    } else if (newCat === 'Beauty') {
      setCategoryAttrs(prev => ({
        skinType: prev.skinType || 'All Skin Types',
        netVolumeWeight: prev.netVolumeWeight || '100 ml',
        shelfLife: prev.shelfLife || '24 Months',
        keyIngredients: prev.keyIngredients || 'Niacinamide 10%, Vitamin C',
        certifications: prev.certifications || ['Cruelty-Free 🐰', 'Organic 🌱']
      }));
    } else if (newCat === 'Accessories') {
      setCategoryAttrs(prev => ({
        accessoryType: prev.accessoryType || 'Leather Wallet & Belt',
        primaryMaterial: prev.primaryMaterial || '100% Genuine Leather',
        compatibility: prev.compatibility || 'Universal Fit',
        colorVariants: prev.colorVariants || 'Black & Brown'
      }));
    } else if (newCat === 'Deals') {
      setCategoryAttrs(prev => ({
        dealSaverTag: prev.dealSaverTag || '🔥 SUPER SAVER 40% OFF',
        dealExpiryDate: prev.dealExpiryDate || '2026-12-31',
        promoCode: prev.promoCode || 'FLASH50',
        dealPriorityTag: prev.dealPriorityTag || 'Hot Deal 🔥'
      }));
    }
  };

  // Open Modal for Add
  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormData({
      title: '',
      titleBn: '',
      description: '',
      descriptionBn: '',
      category: 'Fashion',
      tagsInput: 'Panjabi, Eid, Cotton',
      price: 1800,
      wholesalePrice: 1250,
      originalPrice: 2200,
      discountPercentage: 18,
      stock: 30,
      lowStockLimit: 10,
      images: ['https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800&auto=format&fit=crop&q=80'],
      newImageUrlInput: '',
      badges: ['featured', 'fast_delivery'],
      isFreeDelivery: false,
      isActive: true,
      sku: `BZR-${Math.floor(1000 + Math.random() * 9000)}`
    });
    setCategoryAttrs({
      genderAudience: 'Men',
      apparelType: 'Panjabi',
      fabricMaterial: '100% Cotton',
      availableSizes: ['S', 'M', 'L', 'XL'],
      fitType: 'Regular Fit',
      careInstructions: 'Gentle Hand Wash'
    });
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    const isFree = Boolean(product.isFreeDelivery || product.badges?.includes('free_delivery'));
    setFormData({
      title: product.title,
      titleBn: product.titleBn || '',
      description: product.description,
      descriptionBn: product.descriptionBn || '',
      category: product.category || 'Fashion',
      tagsInput: product.tags.join(', '),
      price: product.price,
      wholesalePrice: product.wholesalePrice || Math.round(product.price * 0.7),
      originalPrice: product.originalPrice,
      discountPercentage: product.discountPercentage,
      stock: product.stock,
      lowStockLimit: product.lowStockLimit,
      images: product.images.length > 0 ? product.images : ['https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800&auto=format&fit=crop&q=80'],
      newImageUrlInput: '',
      badges: product.badges || [],
      isFreeDelivery: isFree,
      isActive: product.isActive,
      sku: product.sku
    });
    setCategoryAttrs(product.categoryAttributes || {});
    setIsModalOpen(true);
  };

  // Auto-calculate discount
  const handlePriceChange = (priceVal: number, origPriceVal: number) => {
    const calcDiscount = origPriceVal > priceVal ? Math.round(((origPriceVal - priceVal) / origPriceVal) * 100) : 0;
    setFormData(prev => ({
      ...prev,
      price: priceVal,
      originalPrice: origPriceVal,
      discountPercentage: calcDiscount
    }));
  };

  // Submit Product Form
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const tagsArr = formData.tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    const isFree = Boolean(formData.isFreeDelivery || formData.badges.includes('free_delivery'));
    const finalBadges = isFree
      ? (formData.badges.includes('free_delivery') ? formData.badges : [...formData.badges, 'free_delivery' as ProductBadge])
      : formData.badges.filter(b => b !== 'free_delivery');

    const productPayload: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> = {
      title: formData.title,
      titleBn: formData.titleBn,
      description: formData.description,
      descriptionBn: formData.descriptionBn,
      category: formData.category,
      categoryAttributes: categoryAttrs,
      tags: tagsArr,
      price: Number(formData.price),
      wholesalePrice: Number(formData.wholesalePrice),
      originalPrice: Number(formData.originalPrice),
      discountPercentage: Number(formData.discountPercentage),
      stock: Number(formData.stock),
      lowStockLimit: Number(formData.lowStockLimit),
      images: formData.images.filter(Boolean),
      badges: finalBadges,
      isFreeDelivery: isFree,
      isActive: formData.isActive,
      rating: editingProduct ? editingProduct.rating : 5.0,
      reviewCount: editingProduct ? editingProduct.reviewCount : 0,
      sku: formData.sku
    };

    if (editingProduct) {
      updateProduct(editingProduct.id, productPayload);
    } else {
      addProduct(productPayload);
    }

    setIsModalOpen(false);
  };

  // Toggle badge selection in form
  const handleToggleBadge = (badge: ProductBadge) => {
    setFormData(prev => {
      const currentBadges = Array.isArray(prev.badges) ? prev.badges : [];
      const isAdding = !currentBadges.includes(badge);
      const newBadges = isAdding
        ? [...currentBadges, badge]
        : currentBadges.filter(b => b !== badge);
      return {
        ...prev,
        badges: newBadges,
        isFreeDelivery: badge === 'free_delivery' ? isAdding : prev.isFreeDelivery
      };
    });
  };

  // Add image URL in form
  const handleAddImageUrl = () => {
    if (!formData.newImageUrlInput.trim()) return;
    setFormData(prev => ({
      ...prev,
      images: [...(Array.isArray(prev.images) ? prev.images : []), prev.newImageUrlInput.trim()],
      newImageUrlInput: ''
    }));
  };

  // Size toggle for Fashion
  const toggleSizeOption = (size: string) => {
    const current = categoryAttrs.availableSizes || [];
    const updated = current.includes(size)
      ? current.filter(s => s !== size)
      : [...current, size];
    setCategoryAttrs(prev => ({ ...prev, availableSizes: updated }));
  };

  // Render Category Custom Specifications Dashboard Fields in Modal
  const renderCategoryCustomDashboardFields = () => {
    const cat = formData.category;

    if (cat === 'Phones') {
      return (
        <div className="bg-sky-50/80 dark:bg-sky-950/40 p-4 rounded-2xl border border-sky-200 dark:border-sky-800/80 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-sky-800 dark:text-sky-300 pb-1 border-b border-sky-200/80 dark:border-sky-800">
            <Smartphone className="w-4 h-4 text-sky-600" />
            <span>📱 Smartphone Specifications Custom Dashboard</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Brand / Manufacturer</label>
              <input
                type="text"
                value={categoryAttrs.brand || ''}
                onChange={e => setCategoryAttrs({ ...categoryAttrs, brand: e.target.value })}
                placeholder="e.g. Samsung, Apple, Bazar"
                className="w-full p-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">RAM (GB)</label>
              <input
                type="text"
                value={categoryAttrs.ramGbs || ''}
                onChange={e => setCategoryAttrs({ ...categoryAttrs, ramGbs: e.target.value })}
                placeholder="e.g. 8 GB / 12 GB"
                className="w-full p-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Storage (GB)</label>
              <input
                type="text"
                value={categoryAttrs.storageGbs || ''}
                onChange={e => setCategoryAttrs({ ...categoryAttrs, storageGbs: e.target.value })}
                placeholder="e.g. 128 GB / 256 GB"
                className="w-full p-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Battery Capacity (mAh)</label>
              <input
                type="text"
                value={categoryAttrs.batteryCapacity || ''}
                onChange={e => setCategoryAttrs({ ...categoryAttrs, batteryCapacity: e.target.value })}
                placeholder="e.g. 5000 mAh"
                className="w-full p-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Fast Charging Power</label>
              <input
                type="text"
                value={categoryAttrs.powerRating || ''}
                onChange={e => setCategoryAttrs({ ...categoryAttrs, powerRating: e.target.value })}
                placeholder="e.g. 67W Fast Charge"
                className="w-full p-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Display Specs</label>
              <input
                type="text"
                value={categoryAttrs.displaySize || ''}
                onChange={e => setCategoryAttrs({ ...categoryAttrs, displaySize: e.target.value })}
                placeholder="e.g. 6.7 inch AMOLED 120Hz"
                className="w-full p-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Camera Megapixels</label>
              <input
                type="text"
                value={categoryAttrs.cameraSpecs || ''}
                onChange={e => setCategoryAttrs({ ...categoryAttrs, cameraSpecs: e.target.value })}
                placeholder="e.g. 50MP OIS Triple Cam"
                className="w-full p-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Network & SIM</label>
              <input
                type="text"
                value={categoryAttrs.networkType || ''}
                onChange={e => setCategoryAttrs({ ...categoryAttrs, networkType: e.target.value })}
                placeholder="e.g. 5G Dual SIM"
                className="w-full p-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Warranty Period</label>
              <input
                type="text"
                value={categoryAttrs.warrantyPeriod || ''}
                onChange={e => setCategoryAttrs({ ...categoryAttrs, warrantyPeriod: e.target.value })}
                placeholder="e.g. 1 Year Official Warranty"
                className="w-full p-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>
        </div>
      );
    }

    if (cat === 'Laptops') {
      return (
        <div className="bg-indigo-50/80 dark:bg-indigo-950/40 p-4 rounded-2xl border border-indigo-200 dark:border-indigo-800/80 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-800 dark:text-indigo-300 pb-1 border-b border-indigo-200/80 dark:border-indigo-800">
            <LaptopIcon className="w-4 h-4 text-indigo-600" />
            <span>💻 Laptop Specifications Custom Dashboard</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Brand</label>
              <input
                type="text"
                value={categoryAttrs.brand || ''}
                onChange={e => setCategoryAttrs({ ...categoryAttrs, brand: e.target.value })}
                placeholder="e.g. Asus, Apple, Lenovo"
                className="w-full p-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Processor (CPU)</label>
              <input
                type="text"
                value={categoryAttrs.processor || ''}
                onChange={e => setCategoryAttrs({ ...categoryAttrs, processor: e.target.value })}
                placeholder="e.g. Intel Core i7 13th Gen / M3"
                className="w-full p-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">RAM Size</label>
              <input
                type="text"
                value={categoryAttrs.ramGbs || ''}
                onChange={e => setCategoryAttrs({ ...categoryAttrs, ramGbs: e.target.value })}
                placeholder="e.g. 16 GB LPDDR5"
                className="w-full p-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">SSD Storage</label>
              <input
                type="text"
                value={categoryAttrs.storageGbs || ''}
                onChange={e => setCategoryAttrs({ ...categoryAttrs, storageGbs: e.target.value })}
                placeholder="e.g. 512 GB NVMe SSD"
                className="w-full p-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Graphics Card (GPU)</label>
              <input
                type="text"
                value={categoryAttrs.graphicsCard || ''}
                onChange={e => setCategoryAttrs({ ...categoryAttrs, graphicsCard: e.target.value })}
                placeholder="e.g. NVIDIA RTX 4060 8GB"
                className="w-full p-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Screen Display</label>
              <input
                type="text"
                value={categoryAttrs.screenResolution || ''}
                onChange={e => setCategoryAttrs({ ...categoryAttrs, screenResolution: e.target.value })}
                placeholder="e.g. 15.6 inch FHD IPS 144Hz"
                className="w-full p-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Battery Backup</label>
              <input
                type="text"
                value={categoryAttrs.batteryCapacity || ''}
                onChange={e => setCategoryAttrs({ ...categoryAttrs, batteryCapacity: e.target.value })}
                placeholder="e.g. 10 Hours Battery Life"
                className="w-full p-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Warranty Period</label>
              <input
                type="text"
                value={categoryAttrs.warrantyPeriod || ''}
                onChange={e => setCategoryAttrs({ ...categoryAttrs, warrantyPeriod: e.target.value })}
                placeholder="e.g. 2 Years Replacement Warranty"
                className="w-full p-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>
        </div>
      );
    }

    if (cat === 'Cameras') {
      return (
        <div className="bg-purple-50/80 dark:bg-purple-950/40 p-4 rounded-2xl border border-purple-200 dark:border-purple-800/80 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-purple-800 dark:text-purple-300 pb-1 border-b border-purple-200/80 dark:border-purple-800">
            <CameraIcon className="w-4 h-4 text-purple-600" />
            <span>📷 Camera & Optics Custom Dashboard</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Brand</label>
              <input
                type="text"
                value={categoryAttrs.brand || ''}
                onChange={e => setCategoryAttrs({ ...categoryAttrs, brand: e.target.value })}
                placeholder="e.g. Sony, Canon, Nikon"
                className="w-full p-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Sensor Resolution</label>
              <input
                type="text"
                value={categoryAttrs.sensorResolution || ''}
                onChange={e => setCategoryAttrs({ ...categoryAttrs, sensorResolution: e.target.value })}
                placeholder="e.g. 24.2 MP Full Frame"
                className="w-full p-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Lens Mount & Type</label>
              <input
                type="text"
                value={categoryAttrs.lensType || ''}
                onChange={e => setCategoryAttrs({ ...categoryAttrs, lensType: e.target.value })}
                placeholder="e.g. 24-70mm f/2.8 GM Lens"
                className="w-full p-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Video Recording</label>
              <input
                type="text"
                value={categoryAttrs.videoResolution || ''}
                onChange={e => setCategoryAttrs({ ...categoryAttrs, videoResolution: e.target.value })}
                placeholder="e.g. 4K 60fps HDR"
                className="w-full p-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Battery / Shot Count</label>
              <input
                type="text"
                value={categoryAttrs.batteryCapacity || ''}
                onChange={e => setCategoryAttrs({ ...categoryAttrs, batteryCapacity: e.target.value })}
                placeholder="e.g. 720 Shots per Charge"
                className="w-full p-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Warranty</label>
              <input
                type="text"
                value={categoryAttrs.warrantyPeriod || ''}
                onChange={e => setCategoryAttrs({ ...categoryAttrs, warrantyPeriod: e.target.value })}
                placeholder="e.g. 3 Years Warranty"
                className="w-full p-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>
        </div>
      );
    }

    if (cat === 'Electronics') {
      return (
        <div className="bg-amber-50/80 dark:bg-amber-950/40 p-4 rounded-2xl border border-amber-200 dark:border-amber-800/80 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300 pb-1 border-b border-amber-200/80 dark:border-amber-800">
            <Cpu className="w-4 h-4 text-amber-600" />
            <span>⚡ Electronics & Gadget Specifications Custom Dashboard</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Brand Name</label>
              <input
                type="text"
                value={categoryAttrs.brand || ''}
                onChange={e => setCategoryAttrs({ ...categoryAttrs, brand: e.target.value })}
                placeholder="e.g. SoundPulse, Anker"
                className="w-full p-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Battery Capacity / Backup</label>
              <input
                type="text"
                value={categoryAttrs.batteryCapacity || ''}
                onChange={e => setCategoryAttrs({ ...categoryAttrs, batteryCapacity: e.target.value })}
                placeholder="e.g. 32 Hours Case Battery"
                className="w-full p-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Connectivity Options</label>
              <input
                type="text"
                value={categoryAttrs.connectivity || ''}
                onChange={e => setCategoryAttrs({ ...categoryAttrs, connectivity: e.target.value })}
                placeholder="e.g. Bluetooth 5.3 + Dual Sync"
                className="w-full p-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Warranty Period</label>
              <input
                type="text"
                value={categoryAttrs.warrantyPeriod || ''}
                onChange={e => setCategoryAttrs({ ...categoryAttrs, warrantyPeriod: e.target.value })}
                placeholder="e.g. 6 Months Warranty"
                className="w-full p-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>
        </div>
      );
    }

    if (cat === 'Fashion') {
      const allSizes = ['S', 'M', 'L', 'XL', 'XXL', 'Free Size'];
      return (
        <div className="bg-rose-50/80 dark:bg-rose-950/40 p-4 rounded-2xl border border-rose-200 dark:border-rose-800/80 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-rose-800 dark:text-rose-300 pb-1 border-b border-rose-200/80 dark:border-rose-800">
            <Shirt className="w-4 h-4 text-rose-600" />
            <span>👔 Fashion Apparel & Fabric Custom Dashboard</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Target Audience / Gender</label>
              <select
                value={categoryAttrs.genderAudience || 'Men'}
                onChange={e => setCategoryAttrs({ ...categoryAttrs, genderAudience: e.target.value })}
                className="w-full p-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <option value="Men">Men (পুরুষ)</option>
                <option value="Women">Women (মহিলা)</option>
                <option value="Unisex">Unisex (উভয়)</option>
                <option value="Kids">Kids (শিশু)</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Apparel / Outfit Type</label>
              <input
                type="text"
                value={categoryAttrs.apparelType || ''}
                onChange={e => setCategoryAttrs({ ...categoryAttrs, apparelType: e.target.value })}
                placeholder="e.g. Panjabi, Saree, Shirt, Jeans"
                className="w-full p-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Fabric & Material (কাপড়)</label>
              <input
                type="text"
                value={categoryAttrs.fabricMaterial || ''}
                onChange={e => setCategoryAttrs({ ...categoryAttrs, fabricMaterial: e.target.value })}
                placeholder="e.g. 100% Organic Cotton, Silk, Denim"
                className="w-full p-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">Available Sizes (সাইজ অপশন)</label>
            <div className="flex flex-wrap gap-2">
              {allSizes.map(sz => {
                const selected = (categoryAttrs.availableSizes || []).includes(sz);
                return (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => toggleSizeOption(sz)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border ${
                      selected
                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-rose-400'
                    }`}
                  >
                    {sz}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Fit Type</label>
              <input
                type="text"
                value={categoryAttrs.fitType || ''}
                onChange={e => setCategoryAttrs({ ...categoryAttrs, fitType: e.target.value })}
                placeholder="e.g. Slim Fit, Regular Fit, Oversized"
                className="w-full p-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Care & Washing Guide</label>
              <input
                type="text"
                value={categoryAttrs.careInstructions || ''}
                onChange={e => setCategoryAttrs({ ...categoryAttrs, careInstructions: e.target.value })}
                placeholder="e.g. Dry Clean Only, Gentle Hand Wash"
                className="w-full p-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>
        </div>
      );
    }

    if (cat === 'Home') {
      return (
        <div className="bg-emerald-50/80 dark:bg-emerald-950/40 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800/80 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300 pb-1 border-b border-emerald-200/80 dark:border-emerald-800">
            <HomeIcon className="w-4 h-4 text-emerald-600" />
            <span>🏠 Home & Furniture Custom Dashboard</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Room Placement</label>
              <input
                type="text"
                value={categoryAttrs.roomType || ''}
                onChange={e => setCategoryAttrs({ ...categoryAttrs, roomType: e.target.value })}
                placeholder="e.g. Living Room, Bedroom, Study Desk"
                className="w-full p-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Primary Material</label>
              <input
                type="text"
                value={categoryAttrs.primaryMaterial || ''}
                onChange={e => setCategoryAttrs({ ...categoryAttrs, primaryMaterial: e.target.value })}
                placeholder="e.g. Solid Teak Wood (সেগুন কাঠ)"
                className="w-full p-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Dimensions (L x W x H)</label>
              <input
                type="text"
                value={categoryAttrs.dimensions || ''}
                onChange={e => setCategoryAttrs({ ...categoryAttrs, dimensions: e.target.value })}
                placeholder="e.g. 135 cm x 65 cm x 78 cm"
                className="w-full p-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Item Weight (kg)</label>
              <input
                type="text"
                value={categoryAttrs.itemWeight || ''}
                onChange={e => setCategoryAttrs({ ...categoryAttrs, itemWeight: e.target.value })}
                placeholder="e.g. 28.5 kg"
                className="w-full p-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>
        </div>
      );
    }

    if (cat === 'Beauty') {
      return (
        <div className="bg-pink-50/80 dark:bg-pink-950/40 p-4 rounded-2xl border border-pink-200 dark:border-pink-800/80 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-pink-800 dark:text-pink-300 pb-1 border-b border-pink-200/80 dark:border-pink-800">
            <Sparkles className="w-4 h-4 text-pink-600" />
            <span>✨ Beauty & Skincare Custom Dashboard</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Target Skin / Hair Type</label>
              <input
                type="text"
                value={categoryAttrs.skinType || ''}
                onChange={e => setCategoryAttrs({ ...categoryAttrs, skinType: e.target.value })}
                placeholder="e.g. All Skin Types & Sensitive"
                className="w-full p-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Net Volume / Weight</label>
              <input
                type="text"
                value={categoryAttrs.netVolumeWeight || ''}
                onChange={e => setCategoryAttrs({ ...categoryAttrs, netVolumeWeight: e.target.value })}
                placeholder="e.g. 50 ml / 1.7 fl oz"
                className="w-full p-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Shelf Life / Expiry</label>
              <input
                type="text"
                value={categoryAttrs.shelfLife || ''}
                onChange={e => setCategoryAttrs({ ...categoryAttrs, shelfLife: e.target.value })}
                placeholder="e.g. 24 Months (Exp: Dec 2028)"
                className="w-full p-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Key Active Ingredients</label>
            <input
              type="text"
              value={categoryAttrs.keyIngredients || ''}
              onChange={e => setCategoryAttrs({ ...categoryAttrs, keyIngredients: e.target.value })}
              placeholder="e.g. Vitamin C 15%, Niacinamide 10%, Hyaluronic Acid"
              className="w-full p-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>
        </div>
      );
    }

    if (cat === 'Accessories') {
      return (
        <div className="bg-teal-50/80 dark:bg-teal-950/40 p-4 rounded-2xl border border-teal-200 dark:border-teal-800/80 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-teal-800 dark:text-teal-300 pb-1 border-b border-teal-200/80 dark:border-teal-800">
            <Watch className="w-4 h-4 text-teal-600" />
            <span>⌚ Accessories Specifications Custom Dashboard</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Accessory Type</label>
              <input
                type="text"
                value={categoryAttrs.accessoryType || ''}
                onChange={e => setCategoryAttrs({ ...categoryAttrs, accessoryType: e.target.value })}
                placeholder="e.g. Leather Wallet & Belt Set"
                className="w-full p-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Material</label>
              <input
                type="text"
                value={categoryAttrs.primaryMaterial || ''}
                onChange={e => setCategoryAttrs({ ...categoryAttrs, primaryMaterial: e.target.value })}
                placeholder="e.g. 100% Full Grain Leather"
                className="w-full p-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Compatibility / Fit</label>
              <input
                type="text"
                value={categoryAttrs.compatibility || ''}
                onChange={e => setCategoryAttrs({ ...categoryAttrs, compatibility: e.target.value })}
                placeholder="e.g. Universal Fit (Waist 30-44)"
                className="w-full p-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>
        </div>
      );
    }

    if (cat === 'Deals') {
      return (
        <div className="bg-amber-50/80 dark:bg-amber-950/40 p-4 rounded-2xl border border-amber-200 dark:border-amber-800/80 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300 pb-1 border-b border-amber-200/80 dark:border-amber-800">
            <Tag className="w-4 h-4 text-amber-600" />
            <span>🏷️ Promotional Deal & Flash Campaign Custom Dashboard</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Saver Highlight Tag</label>
              <input
                type="text"
                value={categoryAttrs.dealSaverTag || ''}
                onChange={e => setCategoryAttrs({ ...categoryAttrs, dealSaverTag: e.target.value })}
                placeholder="e.g. 🔥 SUPER SAVER 45% OFF BUNDLE"
                className="w-full p-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Promo Coupon Code</label>
              <input
                type="text"
                value={categoryAttrs.promoCode || ''}
                onChange={e => setCategoryAttrs({ ...categoryAttrs, promoCode: e.target.value })}
                placeholder="e.g. DEAL65W"
                className="w-full p-2 text-xs font-mono font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-amber-600"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Deal Expiry Date</label>
              <input
                type="date"
                value={categoryAttrs.dealExpiryDate || ''}
                onChange={e => setCategoryAttrs({ ...categoryAttrs, dealExpiryDate: e.target.value })}
                className="w-full p-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  // Render Table Category Attribute Summary Badges
  const renderCategoryAttributeBadges = (p: Product) => {
    const attrs = p.categoryAttributes;
    if (!attrs) return null;

    const badgesList: React.ReactNode[] = [];

    if (attrs.ramGbs || attrs.storageGbs) {
      badgesList.push(
        <span key="ram" className="px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 font-mono text-[10px]">
          💾 {attrs.ramGbs} / {attrs.storageGbs}
        </span>
      );
    }

    if (attrs.batteryCapacity) {
      badgesList.push(
        <span key="bat" className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-mono text-[10px]">
          🔋 {attrs.batteryCapacity}
        </span>
      );
    }

    if (attrs.processor) {
      badgesList.push(
        <span key="cpu" className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 font-mono text-[10px]">
          💻 {attrs.processor}
        </span>
      );
    }

    if (attrs.sensorResolution) {
      badgesList.push(
        <span key="sensor" className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 font-mono text-[10px]">
          📷 {attrs.sensorResolution}
        </span>
      );
    }

    if (attrs.genderAudience || attrs.fabricMaterial) {
      badgesList.push(
        <span key="fabric" className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 text-[10px]">
          👔 {attrs.genderAudience || ''} {attrs.fabricMaterial ? `• ${attrs.fabricMaterial}` : ''}
        </span>
      );
    }

    if (attrs.availableSizes && attrs.availableSizes.length > 0) {
      badgesList.push(
        <span key="sizes" className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200 font-mono text-[10px]">
          📏 {attrs.availableSizes.join(', ')}
        </span>
      );
    }

    if (attrs.roomType || attrs.primaryMaterial) {
      badgesList.push(
        <span key="room" className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px]">
          🏠 {attrs.roomType || ''} {attrs.primaryMaterial ? `• ${attrs.primaryMaterial}` : ''}
        </span>
      );
    }

    if (attrs.skinType || attrs.netVolumeWeight) {
      badgesList.push(
        <span key="beauty" className="px-1.5 py-0.5 rounded bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-300 text-[10px]">
          ✨ {attrs.skinType || ''} {attrs.netVolumeWeight ? `(${attrs.netVolumeWeight})` : ''}
        </span>
      );
    }

    if (attrs.promoCode) {
      badgesList.push(
        <span key="promo" className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 font-bold font-mono text-[10px]">
          🎟️ Code: {attrs.promoCode}
        </span>
      );
    }

    if (badgesList.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {badgesList.slice(0, 3)}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800/90 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <span>{t('allProducts')}</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono">
              {filteredProducts.length} items
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage catalog, dynamic category specifications, price, stock & badges.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 active:scale-95 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{t('addProduct')}</span>
        </button>
      </div>

      {/* Filters & Search Control Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 bg-white dark:bg-slate-800/90 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm">
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search title, SKU, tags..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Category Filter */}
        <div>
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="w-full py-2 px-3 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-medium"
          >
            <option value="all">Category: All</option>
            {categoryFilterOptions.filter(c => c !== 'all').map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Stock Status Filter */}
        <div>
          <select
            value={selectedStockFilter}
            onChange={e => setSelectedStockFilter(e.target.value)}
            className="w-full py-2 px-3 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">Stock: All</option>
            <option value="in_stock">In Stock (&gt; Limit)</option>
            <option value="low_stock">Low Stock (⚠️ Warning)</option>
            <option value="out_of_stock">Out of Stock (0)</option>
          </select>
        </div>

        {/* Badge Filter */}
        <div>
          <select
            value={selectedBadgeFilter}
            onChange={e => setSelectedBadgeFilter(e.target.value)}
            className="w-full py-2 px-3 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-medium"
          >
            <option value="all">Badges: All</option>
            <option value="free_delivery">Free Delivery 🚚 (ফ্রি ডেলিভারি)</option>
            <option value="flash_sale">Flash Sale ⚡</option>
            <option value="fast_delivery">Fast Delivery 🚚</option>
            <option value="featured">Featured ⭐</option>
            <option value="royal_exclusive">Royal Exclusive 👑</option>
          </select>
        </div>

        {/* Sorting */}
        <div>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="w-full py-2 px-3 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-medium"
          >
            <option value="newest">Sort: Newest First</option>
            <option value="price_low">Sort: Price Low to High</option>
            <option value="price_high">Sort: Price High to Low</option>
            <option value="stock_low">Sort: Stock Level Low First</option>
            <option value="title">Sort: Title A-Z</option>
          </select>
        </div>

      </div>

      {/* Bulk Action Bar (Visible when items selected) */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between p-3.5 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 rounded-2xl animate-in fade-in duration-200">
          <span className="text-xs font-bold text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{selectedIds.length} items selected for bulk actions</span>
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                updateProductStatusBulk(selectedIds, true);
                setSelectedIds([]);
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100"
            >
              Set Active
            </button>
            <button
              onClick={() => {
                updateProductStatusBulk(selectedIds, false);
                setSelectedIds([]);
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-100"
            >
              Set Inactive
            </button>
            <button
              onClick={() => setShowBulkDeleteModal(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 shadow-sm flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected ({selectedIds.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3 w-10 text-center">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={
                      paginatedProducts.length > 0 &&
                      paginatedProducts.every(p => selectedIds.includes(p.id))
                    }
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                </th>
                <th className="p-3">Product</th>
                <th className="p-3">Category</th>
                <th className="p-3">Selling Price</th>
                <th className="p-3 text-amber-700 dark:text-amber-400">Wholesale / Cost</th>
                <th className="p-3">Discount</th>
                <th className="p-3">Stock Quantity</th>
                <th className="p-3">Badges & Carousel Link</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
                        <ShoppingBag className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        ওয়েবসাইটটি সম্পূর্ণ নতুন — বর্তমানে কোনো প্রোডাক্ট নেই (০ পণ্য)
                      </p>
                      <p className="text-xs text-slate-400 max-w-md">
                        উপরে থাকা "+ নতুন প্রোডাক্ট যোগ করুন" বাটনে ক্লিক করে আপনি যখন প্রথম প্রোডাক্ট যোগ করবেন, তখন তা এখানে এবং মেইন ওয়েবসাইটে শো হবে।
                      </p>
                      <button
                        onClick={handleOpenAddModal}
                        className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-transform hover:scale-105"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[3]" />
                        <span>প্রথম প্রোডাক্ট যোগ করুন</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedProducts.map(product => {
                  const isSelected = selectedIds.includes(product.id);
                  const isLowStock = product.stock < 2; // Low Stock Red Alert (< 2 items)

                  return (
                    <tr
                      key={product.id}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors ${
                        isSelected ? 'bg-emerald-50/50 dark:bg-emerald-950/30' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectOne(product.id)}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                      </td>

                      {/* Product Thumbnail & Title */}
                      <td className="p-3">
                        <div className="flex items-center gap-3 max-w-sm">
                          <img
                            src={product.images[0] || 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800&auto=format&fit=crop&q=80'}
                            alt={product.title}
                            className="w-12 h-12 rounded-xl object-cover bg-slate-100 dark:bg-slate-900 shrink-0 border border-slate-200 dark:border-slate-700"
                          />
                          <div className="min-w-0">
                            <h4 className="font-bold text-slate-900 dark:text-slate-100 truncate">
                              {product.title}
                            </h4>
                            {product.titleBn && (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                {product.titleBn}
                              </p>
                            )}
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-400 font-mono">
                                SKU: {product.sku}
                              </span>
                            </div>
                            {/* Render Category Custom Attributes Badges */}
                            {renderCategoryAttributeBadges(product)}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="p-3">
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200/60 dark:border-emerald-800/60 inline-flex items-center gap-1.5">
                          {product.category === 'Phones' && <Smartphone className="w-3 h-3 text-sky-500" />}
                          {product.category === 'Laptops' && <LaptopIcon className="w-3 h-3 text-indigo-500" />}
                          {product.category === 'Cameras' && <CameraIcon className="w-3 h-3 text-purple-500" />}
                          {product.category === 'Electronics' && <Cpu className="w-3 h-3 text-amber-500" />}
                          {product.category === 'Fashion' && <Shirt className="w-3 h-3 text-rose-500" />}
                          {product.category === 'Home' && <HomeIcon className="w-3 h-3 text-emerald-500" />}
                          {product.category === 'Beauty' && <Sparkles className="w-3 h-3 text-pink-500" />}
                          {product.category === 'Accessories' && <Watch className="w-3 h-3 text-teal-500" />}
                          {product.category === 'Deals' && <Tag className="w-3 h-3 text-amber-500" />}
                          <span>{product.category}</span>
                        </span>
                      </td>

                      {/* Selling Price & Original Price */}
                      <td className="p-3 font-mono">
                        <div className="font-bold text-slate-900 dark:text-white">
                          ৳{product.price.toLocaleString()}
                        </div>
                        {product.originalPrice > product.price && (
                          <div className="text-[10px] text-slate-400 line-through">
                            ৳{product.originalPrice.toLocaleString()}
                          </div>
                        )}
                      </td>

                      {/* Private Wholesale Cost & Profit */}
                      <td className="p-3 font-mono">
                        <div className="font-bold text-amber-700 dark:text-amber-300 text-xs flex items-center gap-1">
                          <Lock className="w-3 h-3 text-amber-500 shrink-0" />
                          <span>৳{(product.wholesalePrice || Math.round(product.price * 0.7)).toLocaleString()}</span>
                        </div>
                        <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                          Profit: +৳{(product.price - (product.wholesalePrice || Math.round(product.price * 0.7))).toLocaleString()}
                        </div>
                      </td>

                      {/* Discount % Badge */}
                      <td className="p-3">
                        {product.discountPercentage > 0 ? (
                          <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-bold font-mono text-[11px]">
                            {product.discountPercentage}% OFF
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono text-xs">-</span>
                        )}
                      </td>

                      {/* Stock Inline Quick Edit (Red Low Stock Alert only if < 2) */}
                      <td className="p-3">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => updateStockInline(product.id, product.stock - 1)}
                              className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold flex items-center justify-center hover:bg-slate-200"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              value={product.stock}
                              onChange={e => updateStockInline(product.id, Number(e.target.value))}
                              className={`w-14 py-1 text-center font-black font-mono text-xs rounded border transition-all ${
                                isLowStock
                                  ? 'border-2 border-rose-600 bg-rose-100 dark:bg-rose-950/90 text-rose-700 dark:text-rose-200 shadow-sm'
                                  : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100'
                              }`}
                            />
                            <button
                              onClick={() => updateStockInline(product.id, product.stock + 1)}
                              className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold flex items-center justify-center hover:bg-slate-200"
                            >
                              +
                            </button>
                          </div>

                          {isLowStock && (
                            <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white font-black text-[10px] animate-pulse flex items-center justify-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              <span>Low Stock ({product.stock})</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Badges & Carousel Link */}
                      <td className="p-3">
                        <div className="flex flex-col gap-1.5 min-w-[170px]">
                          {/* Badges list */}
                          <div className="flex flex-wrap items-center gap-1">
                            {Boolean(product.isFreeDelivery || product.badges?.includes('free_delivery')) && (
                              <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 font-bold text-[10px] inline-flex items-center gap-1 border border-emerald-300 dark:border-emerald-700 shadow-2xs" title="Free Delivery / ফ্রি ডেলিভারি (মূল ওয়েবসাইটে ছবির পাশে ব্যাজ শো করে)">
                                <Truck className="w-3 h-3 text-emerald-600" />
                                <span>ফ্রি ডেলিভারি</span>
                              </span>
                            )}
                            {product.badges.includes('flash_sale') && (
                              <span className="p-1 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" title="Flash Sale">
                                <Zap className="w-3 h-3 fill-amber-500" />
                              </span>
                            )}
                            {product.badges.includes('fast_delivery') && (
                              <span className="p-1 rounded bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300" title="Fast Delivery">
                                <Truck className="w-3 h-3" />
                              </span>
                            )}
                            {product.badges.includes('featured') && (
                              <span className="p-1 rounded bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300" title="Featured Item">
                                <Star className="w-3 h-3 fill-purple-500" />
                              </span>
                            )}
                            {product.badges.includes('royal_exclusive') && (
                              <span className="p-1 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" title="Royal Exclusive">
                                <Crown className="w-3 h-3" />
                              </span>
                            )}
                            {(!product.isFreeDelivery && (!product.badges || product.badges.length === 0)) && (
                              <span className="text-[10px] text-slate-400">Regular</span>
                            )}
                          </div>

                          {/* Personal Product Link to Copy & Send to Hero Carousel */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            <button
                              type="button"
                              onClick={() => handleCopyProductLink(product)}
                              className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-md font-mono text-[10px] flex items-center gap-1 border border-indigo-200 dark:border-indigo-800 transition-colors shadow-2xs group"
                              title={`Copy Personal Product Link: ${getProductPersonalLink(product)} (হিরো কার্সোলে পেস্ট করার লিংক)`}
                            >
                              <Copy className="w-2.5 h-2.5 text-indigo-500 shrink-0" />
                              <span className="font-sans font-semibold">হিরো লিংক কপি</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handlePushToHeroCarousel(product)}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-md border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold flex items-center gap-1 shrink-0 transition-colors shadow-2xs"
                              title="Add to Hero Carousel (মেইন ওয়েবসাইটের হিরো কার্সোলে পাঠান)"
                            >
                              <GalleryHorizontalEnd className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                              <span>কার্সোলে দিন</span>
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Status (ON/OFF Toggle) */}
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateProduct(product.id, { isActive: !product.isActive })}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              product.isActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                            }`}
                            title={product.isActive ? 'Active (Click to turn OFF)' : 'Inactive (Click to turn ON)'}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                product.isActive ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                          <span className={`text-xs font-bold font-mono ${product.isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                            {product.isActive ? 'ON' : 'OFF'}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEditModal(product)}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all hover:scale-105 shrink-0"
                            title="Edit Product"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>{t('editProduct')}</span>
                          </button>
                          <button
                            onClick={() => setProductToDelete(product)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            title="Delete Product (Firebase & Store)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs text-slate-500">
          <span>
            Page <strong className="text-slate-900 dark:text-white">{currentPage}</strong> of {totalPages}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
          <div className="relative bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 my-8 overflow-hidden">
            
            <div className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-600" />
                <span>{editingProduct ? t('editProduct') : t('addProduct')}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">
              
              {/* Titles EN & BN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t('productTitle')} (English) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Ultra 5G Smartphone Pro"
                    className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t('productTitle')} (বাংলা)
                  </label>
                  <input
                    type="text"
                    value={formData.titleBn}
                    onChange={e => setFormData({ ...formData, titleBn: e.target.value })}
                    placeholder="যেমন: আল্ট্রা ৫জি স্মার্টফোন প্রো"
                    className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              {/* Main Website Category Select & SKU */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Category (ওয়েবসাইট ক্যাটাগরি নির্বাচন) *
                  </label>
                  <select
                    required
                    value={formData.category}
                    onChange={e => handleCategoryChange(e.target.value)}
                    className="w-full p-2.5 text-xs font-bold bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 rounded-xl text-emerald-900 dark:text-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {STORE_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                     dynamic custom specification dashboard below automatically adjusts according to selected category.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t('sku')}
                  </label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={e => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full p-2.5 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              {/* Dynamic Category Custom Dashboard Specification Panel */}
              {renderCategoryCustomDashboardFields()}

              {/* Pricing Grid & Wholesale Cost */}
              <div className="space-y-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {t('price')} *
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.price}
                      onChange={e => handlePriceChange(Number(e.target.value), formData.originalPrice)}
                      className="w-full p-2 text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-emerald-700 dark:text-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                      <Lock className="w-3 h-3 text-amber-500" />
                      <span>{t('wholesalePrice')} *</span>
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.wholesalePrice}
                      onChange={e => setFormData({ ...formData, wholesalePrice: Number(e.target.value) })}
                      className="w-full p-2 text-xs font-mono font-bold bg-amber-50/80 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 rounded-lg text-amber-900 dark:text-amber-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {t('originalPrice')}
                    </label>
                    <input
                      type="number"
                      value={formData.originalPrice}
                      onChange={e => handlePriceChange(formData.price, Number(e.target.value))}
                      className="w-full p-2 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {t('discount')} (%)
                    </label>
                    <input
                      type="number"
                      value={formData.discountPercentage}
                      onChange={e => setFormData({ ...formData, discountPercentage: Number(e.target.value) })}
                      className="w-full p-2 text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-rose-600"
                    />
                  </div>
                </div>

                {/* Live Profit Calculation Banner */}
                <div className="bg-emerald-50/80 dark:bg-emerald-950/40 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200 font-bold">
                    <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>🔒 {t('wholesalePriceNotice')}</span>
                  </div>
                  <div className="flex items-center gap-3 font-mono shrink-0">
                    <span className="text-slate-600 dark:text-slate-300 text-[11px]">
                      Cost: ৳{Number(formData.wholesalePrice || 0).toLocaleString()}
                    </span>
                    <span className="font-black text-emerald-800 dark:text-emerald-200 bg-emerald-200/80 dark:bg-emerald-900/90 px-2.5 py-1 rounded-lg border border-emerald-300 dark:border-emerald-700">
                      Unit Profit: ৳{(Number(formData.price || 0) - Number(formData.wholesalePrice || 0)).toLocaleString()} (
                      {Number(formData.price || 0) > 0
                        ? (((Number(formData.price || 0) - Number(formData.wholesalePrice || 0)) / Number(formData.price || 1)) * 100).toFixed(1)
                        : '0'}
                      % Margin)
                    </span>
                  </div>
                </div>
              </div>

              {/* Stock & Low Stock Threshold */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t('stock')} *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.stock}
                    onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })}
                    className="w-full p-2.5 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t('lowStockLimit')}
                  </label>
                  <input
                    type="number"
                    value={formData.lowStockLimit}
                    onChange={e => setFormData({ ...formData, lowStockLimit: Number(e.target.value) })}
                    className="w-full p-2.5 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              {/* ImgBB Image Gallery Uploader */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xs">
                <ImgbbImageUploader
                  label="প্রোডাক্ট ইমেজ গ্যালারি (ImgBB Cloud Hosted)"
                  hint="ডিভাইস বা গ্যালারি থেকে যেকোনো ছবি সিলেক্ট করুন। হাই-রেজ্যুলেশন MB সাইজের ছবি স্বয়ংক্রিয়ভাবে হালকা KB-তে কমপ্রেস হয়ে আপনার দেওয়া ImgBB API দিয়ে আপলোড হবে এবং ওয়েবসাইটে চমৎকারভাবে দেখাবে।"
                  value={formData.images}
                  multiple={true}
                  aspectRatio="square"
                  onImagesChange={(urls) => setFormData(prev => ({ ...prev, images: urls }))}
                  presetOptions={PRESET_GALLERY_IMAGES}
                />
              </div>

              {/* Badges & Placement Flags */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  {t('badgesAndPlacement')}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleBadge('free_delivery')}
                    className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
                      formData.isFreeDelivery || formData.badges.includes('free_delivery')
                        ? 'bg-emerald-100 border-emerald-500 text-emerald-950 dark:bg-emerald-950 dark:text-emerald-200 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                    }`}
                  >
                    <Truck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Free Delivery</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleBadge('flash_sale')}
                    className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
                      formData.badges.includes('flash_sale')
                        ? 'bg-amber-100 border-amber-400 text-amber-900 dark:bg-amber-950 dark:text-amber-200'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5 fill-amber-500" />
                    <span>Flash Sale</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleBadge('fast_delivery')}
                    className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
                      formData.badges.includes('fast_delivery')
                        ? 'bg-sky-100 border-sky-400 text-sky-900 dark:bg-sky-950 dark:text-sky-200'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                    }`}
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Fast Delivery</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleBadge('featured')}
                    className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
                      formData.badges.includes('featured')
                        ? 'bg-purple-100 border-purple-400 text-purple-900 dark:bg-purple-950 dark:text-purple-200'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                    }`}
                  >
                    <Star className="w-3.5 h-3.5 fill-purple-500" />
                    <span>Featured</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleBadge('royal_exclusive')}
                    className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
                      formData.badges.includes('royal_exclusive')
                        ? 'bg-emerald-100 border-emerald-400 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                    }`}
                  >
                    <Crown className="w-3.5 h-3.5" />
                    <span>Royal Exclusive</span>
                  </button>
                </div>
              </div>

              {/* Dedicated Free Delivery Setting Switch Card */}
              <div className={`p-4 rounded-2xl border transition-all ${
                formData.isFreeDelivery || formData.badges.includes('free_delivery')
                  ? 'bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 dark:from-emerald-950/60 dark:via-teal-950/40 dark:to-emerald-950/60 border-emerald-400 dark:border-emerald-600 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
              } flex items-center justify-between gap-4`}>
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    formData.isFreeDelivery || formData.badges.includes('free_delivery')
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                  }`}>
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                        ফ্রি ডেলিভারি অফার (Free Delivery)
                      </h5>
                      {(formData.isFreeDelivery || formData.badges.includes('free_delivery')) ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white shadow-2xs">
                          ✓ ফ্রি ডেলিভারি সক্রিয়
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          বন্ধ রয়েছে
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                      এই প্রোডাক্টে ফ্রি ডেলিভারি চালু করলে মূল ওয়েবসাইটে (mainbazar.com) প্রোডাক্ট ছবির পাশে <strong className="text-emerald-700 dark:text-emerald-300">"Free Delivery / ফ্রি ডেলিভারি"</strong> আকর্ষণীয় টেক্সট ও ব্যাজ ভেসে উঠবে এবং অর্ডারে ডেলিভারি চার্জ ০ টাকা হবে।
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleBadge('free_delivery')}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    formData.isFreeDelivery || formData.badges.includes('free_delivery')
                      ? 'bg-emerald-600'
                      : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                  title="Toggle Free Delivery"
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      formData.isFreeDelivery || formData.badges.includes('free_delivery') ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Tags & Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t('tags')}
                </label>
                <input
                  type="text"
                  value={formData.tagsInput}
                  onChange={e => setFormData({ ...formData, tagsInput: e.target.value })}
                  placeholder="e.g. Panjabi, Cotton, Eid"
                  className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              {/* Product Active Status Switch */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>Product Store Visibility Status</span>
                  </h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {formData.isActive ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        ✓ Product is Active and visible on main customer website
                      </span>
                    ) : (
                      <span className="text-rose-600 dark:text-rose-400 font-semibold">
                        🚫 Product is Inactive — Hidden from main customer website
                      </span>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      formData.isActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        formData.isActive ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                  <span className="text-xs font-bold font-mono">
                    {formData.isActive ? 'ON' : 'OFF'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
                {editingProduct ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setProductToDelete(editingProduct);
                    }}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 flex items-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>পণ্যটি ডিলিট করুন (Firebase & Website)</span>
                  </button>
                ) : <div />}

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/20"
                  >
                    {t('save')}
                  </button>
                </div>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Product Delete Confirmation Modal (Purges from Firebase & Main Website) */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 text-center">
              <div className="w-14 h-14 bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-200 dark:border-rose-800">
                <Trash2 className="w-7 h-7" />
              </div>
              
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                পণ্যটি মুছে ফেলতে চান?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Confirm Product Deletion from Firebase & Store
              </p>

              {/* Product preview card */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-left mb-4">
                <img
                  src={productToDelete.images[0] || 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800&auto=format&fit=crop&q=80'}
                  alt={productToDelete.title}
                  className="w-12 h-12 object-cover rounded-lg border border-slate-200 dark:border-slate-700 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {productToDelete.title}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      ৳{productToDelete.price.toLocaleString()}
                    </span>
                    <span>•</span>
                    <span className="font-mono text-[10px] text-slate-400">{productToDelete.sku}</span>
                  </div>
                </div>
              </div>

              {/* Firebase warning notice */}
              <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl text-left mb-5">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-rose-700 dark:text-rose-300 leading-relaxed font-medium">
                    এই পণ্যটি ডিলিট করলে তা <strong>Firebase (Cloud Firestore ও Realtime Database)</strong> থেকে স্থায়ীভাবে মুছে যাবে এবং <strong>মেইন ওয়েবসাইট (mainbazar.com)</strong>-এ আর দেখা যাবে না।
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setProductToDelete(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  বাতিল করুন (Cancel)
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleExecuteDelete}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 flex items-center gap-2 transition-all hover:scale-[1.02] disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Firebase থেকে মোছা হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>হ্যাঁ, সম্পূর্ণ মুছে ফেলুন</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 text-center">
              <div className="w-14 h-14 bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-200 dark:border-rose-800">
                <Trash2 className="w-7 h-7" />
              </div>
              
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                নির্বাচিত {selectedIds.length}টি পণ্য মুছে ফেলতে চান?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Confirm Bulk Deletion from Firebase
              </p>

              <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl text-left mb-5">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-rose-700 dark:text-rose-300 leading-relaxed font-medium">
                    নির্বাচিত সকল পণ্য <strong>Firebase</strong> এবং <strong>মেইন ওয়েবসাইট (mainbazar.com)</strong> থেকে চিরতরে মুছে যাবে।
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setShowBulkDeleteModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  বাতিল (Cancel)
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleExecuteBulkDelete}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 flex items-center gap-2 transition-all hover:scale-[1.02] disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>মুছে ফেলা হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>হ্যাঁ, সবকটি মুছে ফেলুন ({selectedIds.length})</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
