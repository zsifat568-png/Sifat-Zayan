export type Language = 'en' | 'bn';

export type ThemeMode = 'light' | 'dark';

export type ProductBadge = 'flash_sale' | 'fast_delivery' | 'featured' | 'royal_exclusive' | 'free_delivery';

export const STORE_CATEGORIES = [
  'Electronics',
  'Fashion',
  'Home',
  'Beauty',
  'Phones',
  'Laptops',
  'Cameras',
  'Accessories',
  'Deals'
] as const;

export type StoreCategory = typeof STORE_CATEGORIES[number] | string;

export interface CategoryAttributes {
  // Gadgets / Tech / Electronics
  batteryCapacity?: string; // e.g. "5000 mAh", "12 Hours Battery"
  warrantyPeriod?: string; // e.g. "1 Year Official Warranty"
  brand?: string; // e.g. "Samsung", "Sony", "Bazar"
  connectivity?: string; // e.g. "Bluetooth 5.3 & Wi-Fi 6"
  powerRating?: string; // e.g. "65W Fast Charging"

  // Phones
  ramGbs?: string; // e.g. "8 GB", "12 GB"
  storageGbs?: string; // e.g. "128 GB", "256 GB"
  displaySize?: string; // e.g. "6.7 inch AMOLED 120Hz"
  cameraSpecs?: string; // e.g. "50MP OIS Dual Camera"
  networkType?: string; // e.g. "5G Dual SIM"

  // Laptops
  processor?: string; // e.g. "Intel Core i7 13th Gen", "Apple M3"
  graphicsCard?: string; // e.g. "NVIDIA RTX 4060 8GB"
  screenResolution?: string; // e.g. "15.6 inch FHD IPS 144Hz"

  // Cameras
  sensorResolution?: string; // e.g. "24.2 MP Full Frame"
  lensType?: string; // e.g. "24-70mm f/2.8 Lens"
  videoResolution?: string; // e.g. "4K 60fps / 8K RAW"

  // Fashion
  genderAudience?: 'Men' | 'Women' | 'Unisex' | 'Kids' | string;
  apparelType?: string; // e.g. "Panjabi", "Saree", "Shirt", "Jeans", "Jacket"
  fabricMaterial?: string; // e.g. "100% Cotton", "Jamdani Silk", "Denim", "Linen"
  availableSizes?: string[]; // e.g. ["S", "M", "L", "XL", "XXL"]
  colorVariants?: string; // e.g. "Maroon, Navy Blue, Olive"
  fitType?: string; // e.g. "Slim Fit", "Regular Fit", "Oversized"
  careInstructions?: string; // e.g. "Dry Clean Only", "Machine Wash"

  // Home
  roomType?: string; // e.g. "Living Room", "Bedroom", "Kitchen", "Office"
  primaryMaterial?: string; // e.g. "Solid Teak Wood", "Engineered Wood", "Ceramic"
  dimensions?: string; // e.g. "120 x 60 x 75 cm"
  itemWeight?: string; // e.g. "12.5 kg"

  // Beauty
  skinType?: string; // e.g. "All Skin Types", "Oily & Sensitive", "Dry"
  netVolumeWeight?: string; // e.g. "100 ml", "50 g"
  shelfLife?: string; // e.g. "24 Months", "Exp: 2028"
  keyIngredients?: string; // e.g. "Niacinamide 10%, Vitamin C, Hyaluronic Acid"
  certifications?: string[]; // e.g. ["Cruelty-Free", "Organic", "Dermatologist Tested"]

  // Accessories
  accessoryType?: string; // e.g. "Wrist Watch", "Leather Belt", "Sunglasses", "Wallet"
  compatibility?: string; // e.g. "iPhone 15/16", "Universal", "15.6 inch Laptop"

  // Deals
  dealSaverTag?: string; // e.g. "Super Saver 40% OFF", "Buy 1 Get 1 Free"
  dealExpiryDate?: string; // e.g. "2026-12-31"
  promoCode?: string; // e.g. "FLASH50"
  dealPriorityTag?: string; // e.g. "Hot Deal 🔥", "Clearance"
}

export interface Product {
  id: string;
  title: string;
  titleBn?: string;
  description: string;
  descriptionBn?: string;
  category: StoreCategory;
  categoryAttributes?: CategoryAttributes;
  tags: string[];
  price: number; // In BDT (৳) - Selling Price to Customer
  wholesalePrice: number; // In BDT (৳) - Purchase/Wholesale Cost (Private to Admin)
  originalPrice: number; // In BDT (৳) - Regular MSRP
  discountPercentage: number; // Auto-calculated or override
  stock: number;
  lowStockLimit: number;
  images: string[];
  badges: ProductBadge[];
  isFreeDelivery?: boolean;
  isActive: boolean;
  rating: number;
  reviewCount: number;
  sku: string;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export type PaymentMethod = 'bkash' | 'nagad' | 'cod' | 'card';

export interface OrderItem {
  id: string;
  productId: string;
  title: string;
  price: number;
  wholesalePrice?: number;
  quantity: number;
  image: string;
  selectedVariant?: string;
}

export interface Order {
  id: string;
  customerId?: string; // Firebase Auth UID or User ID
  userId?: string; // Alternative alias for customer ID
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryAddress: string;
  district: string; // e.g. "Dhaka", "Chittagong"
  areaNote?: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  discountAmount: number;
  grandTotal: number;
  paymentMethod: PaymentMethod | string;
  paymentStatus: 'paid' | 'unpaid' | 'verifying' | string;
  transactionId?: string; // bKash or Nagad TxID
  isTxIdVerified?: boolean;
  senderPhone?: string; // Sender phone number from which bKash/Nagad was paid
  paymentNumber?: string; // Alternative alias for sender number
  paymentDetails?: string; // Any note about payment/gateway
  status: OrderStatus;
  courierName?: 'Pathao' | 'Steadfast' | 'RedX' | 'Paperfly' | 'eCourier' | 'Self Delivery' | string;
  trackingNumber?: string;
  createdAt: string;
  updatedAt: string;
  adminNotes?: string;
}

export type UserStatus = 'active' | 'suspended' | 'vip';

export type AuthProviderType = 'firebase_email' | 'firebase_phone' | 'google_oauth' | 'facebook';

export interface RegisteredUser {
  uid: string; // Firebase Authentication UID
  name: string;
  email: string;
  phone: string;
  photoURL?: string;
  authProvider: AuthProviderType;
  emailVerified: boolean;
  status: 'active' | 'suspended' | 'unverified';
  createdAt: string; // Account registration date/time
  lastLoginAt: string; // Last active / login time
  deviceInfo?: string;
}

export interface CustomerUser {
  id: string;
  name: string;
  phone: string;
  email: string;
  joinedDate: string;
  completedOrdersCount: number;
  totalSpent: number; // In BDT
  rewardPoints: number; // Royal Points
  status: UserStatus;
  customDiscountPercentage: number; // Override discount percentage for this user
  defaultAddress?: string;
  avatar?: string;
}

export interface Review {
  id: string;
  productId: string;
  productTitle: string;
  productImage: string;
  userName: string;
  userPhone: string;
  rating: number; // 1 - 5
  comment: string;
  images?: string[];
  isVerifiedPurchase: boolean;
  createdAt: string;
  adminReply?: string;
  adminRepliedAt?: string;
}

export interface WheelSlice {
  id: string;
  discountPercentage: number; // e.g., 5, 10, 15, 20, 25, 50
  label: string; // e.g. "5% OFF"
  probabilityWeight: number; // e.g., 50 for 50%
  color: string;
  isBigWin?: boolean;
}

export interface UserOverride {
  phone: string;
  guaranteedSliceId?: string;
  isBlockedFromSpin?: boolean;
  note?: string;
}

export interface RoyalClubCampaignSettings {
  campaignActive: boolean;
  offerName: string;
  offerNameBn?: string;
  bannerSubtitle: string;
  cooldownHours: number; // default 24
  minPurchaseAmount: number; // e.g., 500 BDT
  slices: WheelSlice[];
  userOverrides: UserOverride[];
  bigWinChancePercentage: number; // Global big win multiplier %
}

export interface HeroBanner {
  id: string;
  imageUrl: string;
  tagline: string;
  taglineBn?: string;
  title: string;
  titleBn?: string;
  subtitle: string;
  subtitleBn?: string;
  targetCategoryOrUrl: string;
  buttonLabel: string;
  buttonLabelBn?: string;
  isActive: boolean;
  order: number;
  productId?: string;
  productSku?: string;
  productPrice?: number;
  productOriginalPrice?: number;
  badgeText?: string;
  targetProductLink?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface GlobalStoreSettings {
  storeName?: string;
  storeNameBn?: string;
  phone?: string;
  email?: string;
  address?: string;
  bkashNumber?: string;
  nagadNumber?: string;
  freeDeliveryThreshold?: number;
  currencySymbol: string; // '৳'
  currencyCode: string; // 'BDT'
  announcementText: string;
  announcementTextBn?: string;
  announcementActive: boolean;
  announcementBgColor: string;
  announcementLink?: string;
  deliveryFeeInsideDhaka: number; // e.g. 60
  deliveryFeeOutsideDhaka: number; // e.g. 120
  freeShippingThreshold: number; // e.g. 2000
  storePhone: string;
  storeEmail: string;
  storeAddress: string;
  facebookUrl?: string;
  whatsappNumber?: string;
  storeLogo?: string;
  storeBanner?: string;
  paymentQrBkash?: string;
  paymentQrNagad?: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
}
