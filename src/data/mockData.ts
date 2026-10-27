import {
  Product,
  Order,
  CustomerUser,
  RegisteredUser,
  Review,
  RoyalClubCampaignSettings,
  HeroBanner,
  GlobalStoreSettings
} from '../types';

// Clean Slate: 0 Products, 0 Orders, 0 Customers, 0 Hero Banners
export const INITIAL_PRODUCTS: Product[] = [];

export const INITIAL_ORDERS: Order[] = [];

export const INITIAL_CUSTOMERS: CustomerUser[] = [];

export const INITIAL_REVIEWS: Review[] = [];

export const INITIAL_HERO_BANNERS: HeroBanner[] = [];

export const INITIAL_REGISTERED_USERS: RegisteredUser[] = [];

export const INITIAL_ROYAL_CLUB_SETTINGS: RoyalClubCampaignSettings = {
  campaignActive: true,
  offerName: 'Royal Club Daily Spin & Win',
  offerNameBn: 'রয়্যাল ক্লাব স্পিন ও উইন',
  bannerSubtitle: 'Spin the lucky wheel for exclusive discount vouchers & instant cashback prizes.',
  cooldownHours: 24,
  minPurchaseAmount: 500,
  bigWinChancePercentage: 5,
  slices: [
    { id: 's1', discountPercentage: 5, label: '5% OFF', probabilityWeight: 45, color: '#10B981' },
    { id: 's2', discountPercentage: 10, label: '10% OFF', probabilityWeight: 30, color: '#3B82F6' },
    { id: 's3', discountPercentage: 15, label: '15% OFF', probabilityWeight: 15, color: '#8B5CF6' },
    { id: 's4', discountPercentage: 20, label: '20% OFF', probabilityWeight: 7, color: '#F59E0B' },
    { id: 's5', discountPercentage: 25, label: '25% OFF', probabilityWeight: 2.5, color: '#EC4899', isBigWin: true },
    { id: 's6', discountPercentage: 50, label: '50% MEGA', probabilityWeight: 0.5, color: '#EF4444', isBigWin: true }
  ],
  userOverrides: []
};

export const INITIAL_STORE_SETTINGS: GlobalStoreSettings = {
  currencySymbol: '৳',
  currencyCode: 'BDT',
  announcementText: '⚡ Welcome to bazarcomm.netlify.app! Enjoy fast delivery and exclusive deals.',
  announcementTextBn: '⚡ bazarcomm.netlify.app এ স্বাগতম! সারা দেশে ক্যাশ অন ডেলিভারি ও বিশেষ অফার।',
  announcementActive: true,
  announcementBgColor: '#059669', // Emerald green
  announcementLink: '/products',
  deliveryFeeInsideDhaka: 60,
  deliveryFeeOutsideDhaka: 120,
  freeShippingThreshold: 2000,
  storePhone: '+8809612345678',
  storeEmail: 'support@bazarcomm.netlify.app',
  storeAddress: 'Level 8, Bazar Commerce Tower, Gulshan-2, Dhaka-1212',
  facebookUrl: 'https://facebook.com/mainbazar',
  whatsappNumber: '+8801712345678'
};
