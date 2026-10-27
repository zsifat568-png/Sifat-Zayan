import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  Language,
  ThemeMode,
  Product,
  Order,
  CustomerUser,
  RegisteredUser,
  Review,
  RoyalClubCampaignSettings,
  HeroBanner,
  GlobalStoreSettings,
  ToastMessage,
  OrderStatus,
  UserStatus
} from '../types';
import {
  INITIAL_PRODUCTS,
  INITIAL_ORDERS,
  INITIAL_CUSTOMERS,
  INITIAL_REGISTERED_USERS,
  INITIAL_REVIEWS,
  INITIAL_ROYAL_CLUB_SETTINGS,
  INITIAL_HERO_BANNERS,
  INITIAL_STORE_SETTINGS
} from '../data/mockData';
import { getTranslation } from '../lib/translations';
import { db, rtdb, auth, onAuthStateChanged, ref, set, update, remove, onValue, get, isFirebaseConfigured, logAnalyticsEvent } from '../lib/firebase';
import { doc, setDoc, deleteDoc, collection, onSnapshot, query, where, getDocs } from 'firebase/firestore';

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: ThemeMode;
  toggleTheme: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  
  // Data
  products: Product[];
  orders: Order[];
  customers: CustomerUser[];
  registeredUsers: RegisteredUser[];
  reviews: Review[];
  royalClub: RoyalClubCampaignSettings;
  heroBanners: HeroBanner[];
  storeSettings: GlobalStoreSettings;
  toasts: ToastMessage[];

  // Toast actions
  addToast: (title: string, message?: string, type?: ToastMessage['type']) => void;
  removeToast: (id: string) => void;

  // Product CRUD
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => Promise<void> | void;
  deleteProductsBulk: (ids: string[]) => Promise<void> | void;
  updateProductStatusBulk: (ids: string[], isActive: boolean) => void;
  updateStockInline: (id: string, newStock: number) => void;

  // Order CRUD
  updateOrderStatus: (
    orderId: string,
    status: OrderStatus,
    courierName?: Order['courierName'],
    trackingNumber?: string,
    adminNotes?: string
  ) => void;
  verifyOrderTxId: (orderId: string, isVerified: boolean) => void;
  addNewSimulatedOrder: () => void;
  deleteOrder: (orderId: string) => void;

  // Customer CRUD
  addCustomer: (customer: CustomerUser) => void;
  deleteCustomer: (id: string) => void;
  updateCustomerStatus: (id: string, status: CustomerUser['status']) => void;
  updateCustomerCustomDiscount: (id: string, discountPercentage: number) => void;
  adjustCustomerRewardPoints: (id: string, pointsDelta: number) => void;
  seedSampleCustomers: () => void;

  // Registered Users CRUD
  addRegisteredUser: (user: RegisteredUser) => void;
  updateRegisteredUserStatus: (uid: string, status: RegisteredUser['status']) => void;
  deleteRegisteredUser: (uid: string) => void;

  // Royal Club & Campaign CRUD
  toggleCampaignActive: (active: boolean) => void;
  updateRoyalClubSettings: (settings: Partial<RoyalClubCampaignSettings>) => void;
  addHeroBanner: (banner: Omit<HeroBanner, 'id'> & { id?: string }) => HeroBanner;
  updateHeroBanner: (id: string, banner: Partial<HeroBanner>) => void;
  deleteHeroBanner: (id: string) => void;
  reorderHeroBanners: (banners: HeroBanner[]) => void;
  addUserOverride: (phone: string, guaranteedSliceId?: string, note?: string) => void;
  removeUserOverride: (phone: string) => void;

  // Review CRUD
  addReview: (review: Omit<Review, 'id' | 'createdAt'>) => void;
  deleteReview: (id: string) => void;
  toggleVerifiedReview: (id: string) => void;
  replyToReview: (id: string, replyText: string) => void;

  // Store Settings & Tools
  updateStoreSettings: (settings: Partial<GlobalStoreSettings>) => void;
  resetToDemoData: () => void;
  clearAllData: () => void;
  exportDataBackup: () => void;
  importDataBackup: (jsonContent: string) => boolean;

  // Translations helper
  t: (key: Parameters<typeof getTranslation>[1]) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  LANG: 'bazar_admin_lang',
  THEME: 'bazar_admin_theme',
  PRODUCTS: 'bazar_admin_products_v3',
  ORDERS: 'bazar_admin_orders_v3',
  CUSTOMERS: 'bazar_admin_customers_v3',
  REGISTERED_USERS: 'bazar_admin_registered_users_v3',
  REVIEWS: 'bazar_admin_reviews_v3',
  ROYAL_CLUB: 'bazar_admin_royal_club_v3',
  HERO_BANNERS: 'bazar_admin_hero_banners_v3',
  SETTINGS: 'bazar_admin_settings_v3',
};

// Automatic one-time fresh clean slate initialization
if (typeof window !== 'undefined') {
  try {
    const isCleanActive = localStorage.getItem('bazar_store_clean_fresh_v3');
    if (!isCleanActive) {
      // Purge all legacy v1 and v2 stored mock data
      localStorage.removeItem('bazar_admin_products_v1');
      localStorage.removeItem('bazar_admin_products_v2');
      localStorage.removeItem('bazar_admin_orders_v1');
      localStorage.removeItem('bazar_admin_orders_v2');
      localStorage.removeItem('bazar_admin_customers_v1');
      localStorage.removeItem('bazar_admin_customers_v2');
      localStorage.removeItem('bazar_admin_hero_banners_v1');
      localStorage.removeItem('bazar_admin_hero_banners_v2');
      localStorage.removeItem('bazar_admin_reviews_v1');
      localStorage.removeItem('bazar_admin_reviews_v2');
      localStorage.removeItem('bazar_admin_registered_users_v1');
      localStorage.removeItem('bazar_admin_registered_users_v2');
      
      // Ensure clean 0 products and 0 banners
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.HERO_BANNERS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.REGISTERED_USERS, JSON.stringify([]));
      localStorage.setItem('bazar_store_clean_fresh_v3', 'true');
    }
  } catch (e) {
    console.warn('Clean fresh init notice:', e);
  }
}

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem(STORAGE_KEYS.LANG) as Language) || 'en';
  });

  const [theme, setTheme] = useState<ThemeMode>(() => {
    return (localStorage.getItem(STORAGE_KEYS.THEME) as ThemeMode) || 'light';
  });

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Persistent Collections State
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      const parsed = saved ? JSON.parse(saved) : null;
      return Array.isArray(parsed) ? parsed : INITIAL_PRODUCTS;
    } catch {
      return INITIAL_PRODUCTS;
    }
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ORDERS);
      const parsed = saved ? JSON.parse(saved) : null;
      return Array.isArray(parsed) ? parsed : INITIAL_ORDERS;
    } catch {
      return INITIAL_ORDERS;
    }
  });

  const [customers, setCustomers] = useState<CustomerUser[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
      const parsed = saved ? JSON.parse(saved) : null;
      if (Array.isArray(parsed)) {
        return parsed.filter(c => c && c.id && !c.id.startsWith('cust_sample_') && !c.id.startsWith('cust_mock_'));
      }
      return INITIAL_CUSTOMERS;
    } catch {
      return INITIAL_CUSTOMERS;
    }
  });

  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.REGISTERED_USERS);
      const parsed = saved ? JSON.parse(saved) : null;
      return Array.isArray(parsed) ? parsed : INITIAL_REGISTERED_USERS;
    } catch {
      return INITIAL_REGISTERED_USERS;
    }
  });

  const [reviews, setReviews] = useState<Review[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.REVIEWS);
      const parsed = saved ? JSON.parse(saved) : null;
      return Array.isArray(parsed) ? parsed : INITIAL_REVIEWS;
    } catch {
      return INITIAL_REVIEWS;
    }
  });

  const [royalClub, setRoyalClub] = useState<RoyalClubCampaignSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ROYAL_CLUB);
      const parsed = saved ? JSON.parse(saved) : null;
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : INITIAL_ROYAL_CLUB_SETTINGS;
    } catch {
      return INITIAL_ROYAL_CLUB_SETTINGS;
    }
  });

  const [heroBanners, setHeroBanners] = useState<HeroBanner[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.HERO_BANNERS);
      const parsed = saved ? JSON.parse(saved) : null;
      return Array.isArray(parsed) ? parsed : INITIAL_HERO_BANNERS;
    } catch {
      return INITIAL_HERO_BANNERS;
    }
  });

  const [storeSettings, setStoreSettings] = useState<GlobalStoreSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      const parsed = saved ? JSON.parse(saved) : null;
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : INITIAL_STORE_SETTINGS;
    } catch {
      return INITIAL_STORE_SETTINGS;
    }
  });

  // Theme synchronization
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEYS.LANG, lang);
  };

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  // Sync to local storage on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.REGISTERED_USERS, JSON.stringify(registeredUsers));
  }, [registeredUsers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));
  }, [reviews]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ROYAL_CLUB, JSON.stringify(royalClub));
  }, [royalClub]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.HERO_BANNERS, JSON.stringify(heroBanners));
  }, [heroBanners]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(storeSettings));
  }, [storeSettings]);

  // Realtime Database (RTDB) Live Listeners
  useEffect(() => {
    if (!isFirebaseConfigured() || !rtdb) return;

    let unsubProducts: (() => void) | undefined;
    let unsubOrders: (() => void) | undefined;
    let unsubBanners: (() => void) | undefined;
    let unsubSettings: (() => void) | undefined;
    let unsubReviews: (() => void) | undefined;
    let unsubUsers: (() => void) | undefined;
    let unsubCustomers: (() => void) | undefined;
    let unsubAuth: (() => void) | undefined;
    let unsubFirestoreProducts: (() => void) | undefined;
    let unsubFirestoreOrders: (() => void) | undefined;
    let unsubFirestoreUsers: (() => void) | undefined;
    let unsubFirestoreCustomers: (() => void) | undefined;

    // Helper function to safely normalize orders from any source (RTDB or Firestore)
    const normalizeOrder = (raw: any, docId?: string): Order => {
      const orderId = String(raw.id || docId || `BZR-${Date.now()}`);
      
      // Items parser
      let items: any[] = [];
      if (Array.isArray(raw.items)) {
        items = raw.items;
      } else if (raw.items && typeof raw.items === 'object') {
        items = Object.values(raw.items);
      } else if (Array.isArray(raw.cartItems)) {
        items = raw.cartItems;
      } else if (Array.isArray(raw.products)) {
        items = raw.products;
      }

      const parsedItems = items.map((it: any, idx: number) => ({
        id: String(it.id || `item-${idx}-${Date.now()}`),
        productId: String(it.productId || it.id || `prod-${idx}`),
        title: String(it.title || it.name || it.productName || 'Product'),
        price: Number(it.price || it.unitPrice || 0),
        wholesalePrice: it.wholesalePrice ? Number(it.wholesalePrice) : undefined,
        quantity: Math.max(1, Number(it.quantity || it.qty || it.count || 1)),
        image: String(it.image || it.imageUrl || (Array.isArray(it.images) && it.images[0]) || 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800&auto=format&fit=crop&q=80'),
        selectedVariant: it.selectedVariant || it.variant || it.size || it.color || undefined
      }));

      const subtotal = Number(raw.subtotal || raw.totalAmount || raw.total || (parsedItems.reduce((acc, it) => acc + (it.price * it.quantity), 0)));
      const deliveryFee = Number(raw.deliveryFee || raw.shippingFee || raw.delivery_charge || 0);
      const discountAmount = Number(raw.discountAmount || raw.discount || 0);
      const grandTotal = Number(raw.grandTotal || raw.total || raw.totalPrice || (subtotal + deliveryFee - discountAmount));

      // Transaction / Payment ID normalization
      const transactionId = raw.transactionId || raw.txId || raw.txid || raw.transId || raw.trxId || raw.trxID || raw.transaction_id || undefined;
      const senderPhone = raw.senderPhone || raw.senderNumber || raw.paymentNumber || raw.bkashNumber || raw.nagadNumber || undefined;

      return {
        id: orderId,
        customerId: raw.customerId || raw.userId || raw.user_id || raw.uid || undefined,
        userId: raw.userId || raw.customerId || raw.user_id || raw.uid || undefined,
        customerName: String(raw.customerName || raw.name || raw.userName || raw.buyerName || 'Valued Customer'),
        customerPhone: String(raw.customerPhone || raw.phone || raw.mobile || raw.phoneNumber || ''),
        customerEmail: raw.customerEmail || raw.email || undefined,
        deliveryAddress: String(raw.deliveryAddress || raw.address || raw.shippingAddress || 'Not specified'),
        district: String(raw.district || raw.city || 'Dhaka'),
        areaNote: raw.areaNote || raw.note || raw.customerNote || raw.deliveryNote || undefined,
        items: parsedItems.length > 0 ? parsedItems : [
          {
            id: `item-${orderId}`,
            productId: 'custom-product',
            title: raw.productName || 'Ordered Item',
            price: grandTotal,
            quantity: 1,
            image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800&auto=format&fit=crop&q=80'
          }
        ],
        subtotal,
        deliveryFee,
        discountAmount,
        grandTotal,
        paymentMethod: raw.paymentMethod || raw.payment_method || raw.method || 'cod',
        paymentStatus: raw.paymentStatus || raw.payment_status || (transactionId ? 'paid' : 'unpaid'),
        transactionId,
        senderPhone,
        paymentNumber: senderPhone,
        paymentDetails: raw.paymentDetails || raw.paymentNote || undefined,
        isTxIdVerified: Boolean(raw.isTxIdVerified || raw.txVerified || raw.isVerified),
        status: (['pending', 'processing', 'shipped', 'delivered', 'cancelled'].includes(raw.status) ? raw.status : 'pending'),
        courierName: raw.courierName || raw.courier || undefined,
        trackingNumber: raw.trackingNumber || raw.consignmentId || raw.consignment_id || undefined,
        createdAt: raw.createdAt || raw.orderDate || raw.date || new Date().toISOString(),
        updatedAt: raw.updatedAt || new Date().toISOString(),
        adminNotes: raw.adminNotes || raw.notes || undefined
      };
    };

    // Helper function to safely normalize customer records from RTDB or Firestore
    const normalizeCustomer = (raw: any, docId?: string): CustomerUser => {
      if (!raw || typeof raw !== 'object') {
        return {
          id: docId || `cust_${Date.now()}`,
          name: 'Customer',
          phone: '',
          email: '',
          joinedDate: new Date().toISOString(),
          completedOrdersCount: 0,
          totalSpent: 0,
          rewardPoints: 50,
          status: 'active',
          customDiscountPercentage: 0
        };
      }

      const id = String(raw.id || raw.uid || raw._id || raw.customerId || raw.userId || docId || `cust_${Date.now()}`);
      const name = String(raw.name || raw.customerName || raw.displayName || raw.fullName || raw.userName || raw.username || 'Customer').trim();
      const phone = String(raw.phone || raw.phoneNumber || raw.customerPhone || raw.mobile || raw.contact || '').trim();
      const email = String(raw.email || raw.customerEmail || raw.userEmail || '').trim();

      let joinedDate = new Date().toISOString();
      if (raw.joinedDate) {
        joinedDate = typeof raw.joinedDate === 'string' ? raw.joinedDate : new Date(raw.joinedDate).toISOString();
      } else if (raw.createdAt) {
        if (typeof raw.createdAt === 'object' && raw.createdAt.toDate) {
          joinedDate = raw.createdAt.toDate().toISOString();
        } else if (typeof raw.createdAt === 'object' && raw.createdAt.seconds) {
          joinedDate = new Date(raw.createdAt.seconds * 1000).toISOString();
        } else {
          joinedDate = new Date(raw.createdAt).toISOString();
        }
      } else if (raw.created_at) {
        joinedDate = new Date(raw.created_at).toISOString();
      }

      const completedOrdersCount = Number(raw.completedOrdersCount || raw.ordersCount || raw.totalOrders || raw.orderCount || 0);
      const totalSpent = Number(raw.totalSpent || raw.spent || raw.totalAmount || raw.total_spent || 0);
      const rewardPoints = Number(raw.rewardPoints || raw.points || raw.royalPoints || (50 + Math.floor(totalSpent / 100) * 10));
      // All customers are active by default; only VIP if explicitly set by admin, never auto-VIP on spend
      const status: UserStatus = raw.status === 'vip' ? 'vip' : (raw.status === 'suspended' ? 'suspended' : 'active');
      const customDiscountPercentage = Number(raw.customDiscountPercentage || raw.discountPercentage || raw.discount || 0);
      const defaultAddress = raw.defaultAddress || raw.deliveryAddress || raw.shippingAddress || raw.address || undefined;
      const avatar = raw.avatar || raw.photoURL || raw.image || undefined;

      return {
        id,
        name: name || 'Customer',
        phone,
        email,
        joinedDate,
        completedOrdersCount: isNaN(completedOrdersCount) ? 0 : completedOrdersCount,
        totalSpent: isNaN(totalSpent) ? 0 : totalSpent,
        rewardPoints: isNaN(rewardPoints) ? 50 : rewardPoints,
        status,
        customDiscountPercentage: isNaN(customDiscountPercentage) ? 0 : customDiscountPercentage,
        defaultAddress: defaultAddress ? String(defaultAddress).trim() : undefined,
        avatar: avatar ? String(avatar) : undefined
      };
    };

    try {
      unsubProducts = onValue(
        ref(rtdb, 'products'),
        (snapshot) => {
          if (snapshot.exists()) {
            const val = snapshot.val();
            if (val) {
              const list: Product[] = Array.isArray(val)
                ? val.filter(Boolean)
                : Object.values(val);
              if (list.length > 0) {
                setProducts(list);
              }
            }
          }
        },
        (error) => {
          console.warn('Realtime Database products sync notice:', error.message);
        }
      );

      unsubOrders = onValue(
        ref(rtdb, 'orders'),
        (snapshot) => {
          if (snapshot.exists()) {
            const val = snapshot.val();
            if (val) {
              const entries = typeof val === 'object' && !Array.isArray(val)
                ? Object.entries(val).map(([k, v]) => normalizeOrder(v, k))
                : (Array.isArray(val) ? val.filter(Boolean).map(v => normalizeOrder(v)) : []);
              if (entries.length > 0) {
                setOrders(prev => {
                  const map = new Map<string, Order>(prev.map((o: Order) => [o.id, o]));
                  entries.forEach(o => {
                    const existing = map.get(o.id);
                    map.set(o.id, existing ? { ...existing, ...o } : o);
                  });
                  return Array.from(map.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                });
              }
            }
          }
        },
        (error) => {
          console.warn('Realtime Database orders sync notice:', error.message);
        }
      );

      unsubBanners = onValue(
        ref(rtdb, 'banners'),
        (snapshot) => {
          if (snapshot.exists()) {
            const val = snapshot.val();
            if (val) {
              const list: HeroBanner[] = Array.isArray(val)
                ? val.filter(Boolean)
                : Object.values(val);
              if (list.length > 0) {
                setHeroBanners(list);
              }
            }
          }
        },
        (error) => {
          console.warn('Realtime Database banners sync notice:', error.message);
        }
      );

      unsubSettings = onValue(
        ref(rtdb, 'settings/global_store'),
        (snapshot) => {
          if (snapshot.exists()) {
            const val = snapshot.val();
            if (val && typeof val === 'object') {
              setStoreSettings(prev => ({ ...prev, ...val }));
            }
          }
        },
        (error) => {
          console.warn('Realtime Database settings sync notice:', error.message);
        }
      );

      unsubReviews = onValue(
        ref(rtdb, 'reviews'),
        (snapshot) => {
          if (snapshot.exists()) {
            const val = snapshot.val();
            if (val) {
              const list: Review[] = Array.isArray(val)
                ? val.filter(Boolean)
                : Object.values(val);
              if (list.length > 0) {
                setReviews(list);
              }
            }
          }
        },
        (error) => {
          console.warn('Realtime Database reviews sync notice:', error.message);
        }
      );

      // Realtime Database: Sync Registered Users
      unsubUsers = onValue(
        ref(rtdb, 'users'),
        (snapshot) => {
          if (snapshot.exists()) {
            const val = snapshot.val();
            if (val) {
              const list: RegisteredUser[] = Array.isArray(val)
                ? val.filter(Boolean)
                : Object.values(val);
              if (list.length > 0) {
                setRegisteredUsers(list);

                // Ensure all registered users are automatically mapped to customer directory
                setCustomers(prev => {
                  const existingIds = new Set(prev.map(c => c.id));
                  const newEntries: CustomerUser[] = [];
                  list.forEach(u => {
                    if (!existingIds.has(u.uid)) {
                      newEntries.push({
                        id: u.uid,
                        name: u.name || 'Customer',
                        phone: u.phone || '',
                        email: u.email || '',
                        joinedDate: u.createdAt || new Date().toISOString(),
                        completedOrdersCount: 0,
                        totalSpent: 0,
                        rewardPoints: 50,
                        status: u.status === 'suspended' ? 'suspended' : 'active',
                        customDiscountPercentage: 0,
                        avatar: u.photoURL
                      });
                    }
                  });
                  return newEntries.length > 0 ? [...prev, ...newEntries] : prev;
                });
              }
            }
          }
        },
        (error) => {
          console.warn('Realtime Database users sync notice:', error.message);
        }
      );

      // Realtime Database: Sync Customer Directory
      unsubCustomers = onValue(
        ref(rtdb, 'customers'),
        (snapshot) => {
          if (snapshot.exists()) {
            const val = snapshot.val();
            if (val) {
              const entries: CustomerUser[] = typeof val === 'object' && !Array.isArray(val)
                ? Object.entries(val).map(([k, v]) => normalizeCustomer(v, k))
                : (Array.isArray(val) ? val.filter(Boolean).map(v => normalizeCustomer(v)) : []);
              if (entries.length > 0) {
                setCustomers(prev => {
                  const map = new Map<string, CustomerUser>(prev.map((c: CustomerUser) => [c.id, c]));
                  entries.forEach(c => {
                    const existing = map.get(c.id);
                    map.set(c.id, existing ? { ...existing, ...c } : c);
                  });
                  return Array.from(map.values());
                });
              }
            }
          }
        },
        (error) => {
          console.warn('Realtime Database customers sync notice:', error.message);
        }
      );

      // Firebase Auth state listener (auto-register on login/signup)
      unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
          const creationDate = firebaseUser.metadata.creationTime || new Date().toISOString();
          const lastLogin = firebaseUser.metadata.lastSignInTime || new Date().toISOString();
          const newRegUser: RegisteredUser = {
            uid: firebaseUser.uid,
            name: firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'Customer'),
            email: firebaseUser.email || '',
            phone: firebaseUser.phoneNumber || '',
            photoURL: firebaseUser.photoURL || undefined,
            authProvider: firebaseUser.providerData[0]?.providerId === 'google.com' ? 'google_oauth' : 'firebase_email',
            emailVerified: firebaseUser.emailVerified,
            status: 'active',
            createdAt: creationDate,
            lastLoginAt: lastLogin,
            deviceInfo: 'Web Browser'
          };

          const newCustomer: CustomerUser = {
            id: firebaseUser.uid,
            name: newRegUser.name,
            phone: newRegUser.phone,
            email: newRegUser.email,
            joinedDate: creationDate,
            completedOrdersCount: 0,
            totalSpent: 0,
            rewardPoints: 50,
            status: 'active',
            customDiscountPercentage: 0,
            avatar: newRegUser.photoURL
          };

          // Save to state
          setRegisteredUsers(prev => [newRegUser, ...(Array.isArray(prev) ? prev.filter(u => u.uid !== firebaseUser.uid) : [])]);
          setCustomers(prev => [newCustomer, ...(Array.isArray(prev) ? prev.filter(c => c.id !== firebaseUser.uid) : [])]);

          // Save to Realtime Database
          try {
            set(ref(rtdb, `users/${firebaseUser.uid}`), newRegUser).catch(e => console.warn(e));
            set(ref(rtdb, `customers/${firebaseUser.uid}`), newCustomer).catch(e => console.warn(e));
          } catch (e) {
            console.warn(e);
          }
        }
      });

      // Firestore live listener for users & customers to ensure 100% sync
      if (db) {
        try {
          unsubFirestoreUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
            const list: RegisteredUser[] = [];
            snapshot.forEach((docSnap) => {
              const uData = docSnap.data() as any;
              list.push({
                uid: docSnap.id,
                name: String(uData.name || uData.displayName || uData.fullName || (uData.email ? uData.email.split('@')[0] : 'Customer')).trim(),
                email: String(uData.email || '').trim(),
                phone: String(uData.phone || uData.phoneNumber || uData.mobile || '').trim(),
                photoURL: uData.photoURL || uData.avatar || undefined,
                authProvider: (['firebase_email', 'firebase_phone', 'google_oauth', 'facebook'].includes(uData.authProvider) ? uData.authProvider : 'firebase_email'),
                emailVerified: Boolean(uData.emailVerified),
                status: uData.status === 'suspended' ? 'suspended' : 'active',
                createdAt: uData.createdAt || uData.created_at || new Date().toISOString(),
                lastLoginAt: uData.lastLoginAt || uData.last_login || new Date().toISOString(),
                deviceInfo: uData.deviceInfo || 'Web User'
              });
            });
            if (list.length > 0) {
              setRegisteredUsers(prev => {
                const map = new Map(prev.map(u => [u.uid, u]));
                list.forEach(u => {
                  const existing = map.get(u.uid);
                  map.set(u.uid, existing ? Object.assign({}, existing, u) : u);
                });
                return Array.from(map.values());
              });
              setCustomers(prev => {
                const map = new Map(prev.map(c => [c.id, c]));
                list.forEach(u => {
                  if (!map.has(u.uid)) {
                    map.set(u.uid, {
                      id: u.uid,
                      name: u.name || 'Customer',
                      phone: u.phone || '',
                      email: u.email || '',
                      joinedDate: u.createdAt || new Date().toISOString(),
                      completedOrdersCount: 0,
                      totalSpent: 0,
                      rewardPoints: 50,
                      status: u.status === 'suspended' ? 'suspended' : 'active',
                      customDiscountPercentage: 0,
                      avatar: u.photoURL
                    });
                  }
                });
                return Array.from(map.values());
              });
            }
          }, (err) => console.warn('Firestore users sync notice:', err.message));

          // Firestore live listener for orders (sync checkout orders from main website)
          unsubFirestoreOrders = onSnapshot(collection(db, 'orders'), (snapshot) => {
            const list: Order[] = [];
            snapshot.forEach((docSnap) => {
              list.push(normalizeOrder(docSnap.data(), docSnap.id));
            });
            if (list.length > 0) {
              setOrders(prev => {
                const map = new Map<string, Order>(prev.map((o: Order) => [o.id, o]));
                list.forEach(o => {
                  const existing = map.get(o.id);
                  map.set(o.id, existing ? { ...existing, ...o } : o);
                });
                return Array.from(map.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
              });
            }
          }, (err) => console.warn('Firestore orders sync notice:', err.message));

          unsubFirestoreCustomers = onSnapshot(collection(db, 'customers'), (snapshot) => {
            const list: CustomerUser[] = [];
            snapshot.forEach((docSnap) => {
              list.push(normalizeCustomer(docSnap.data(), docSnap.id));
            });
            if (list.length > 0) {
              setCustomers(prev => {
                const map = new Map<string, CustomerUser>(prev.map((c: CustomerUser) => [c.id, c]));
                list.forEach(c => {
                  const existing = map.get(c.id);
                  map.set(c.id, existing ? Object.assign({}, existing, c) : c);
                });
                return Array.from(map.values());
              });
            }
          }, (err) => console.warn('Firestore customers sync notice:', err.message));

          // Firestore live listener for products (100% sync with main website)
          unsubFirestoreProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
            const list: Product[] = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data() as any;
              if (data.isDeleted) return;
              list.push({
                id: String(data.id || docSnap.id),
                title: String(data.title || ''),
                titleBn: data.titleBn ? String(data.titleBn) : undefined,
                description: String(data.description || ''),
                descriptionBn: data.descriptionBn ? String(data.descriptionBn) : undefined,
                category: String(data.category || 'Fashion'),
                tags: Array.isArray(data.tags) ? data.tags : [],
                price: Number(data.price || 0),
                wholesalePrice: Number(data.wholesalePrice || Math.round((data.price || 0) * 0.7)),
                originalPrice: Number(data.originalPrice || data.price || 0),
                discountPercentage: Number(data.discountPercentage || 0),
                stock: Number(data.stock || 0),
                lowStockLimit: Number(data.lowStockLimit || 5),
                images: Array.isArray(data.images) && data.images.length > 0
                  ? data.images
                  : [data.image || 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800&auto=format&fit=crop&q=80'],
                badges: Array.isArray(data.badges) ? data.badges : [],
                isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
                isFreeDelivery: Boolean(data.isFreeDelivery),
                sku: String(data.sku || `SKU-${docSnap.id.substring(0, 6).toUpperCase()}`),
                rating: Number(data.rating || 4.5),
                reviewCount: Number(data.reviewCount || 0),
                createdAt: data.createdAt || new Date().toISOString(),
                updatedAt: data.updatedAt || new Date().toISOString()
              });
            });
            // Reflect deleted products or added products directly from Firestore
            setProducts(list);
          }, (err) => console.warn('Firestore products sync notice:', err.message));
        } catch (e) {
          console.warn('Firestore snapshot setup notice:', e);
        }
      }
    } catch (err) {
      console.warn('RTDB listener setup notice:', err);
    }

    return () => {
      if (unsubProducts) unsubProducts();
      if (unsubFirestoreProducts) unsubFirestoreProducts();
      if (unsubOrders) unsubOrders();
      if (unsubBanners) unsubBanners();
      if (unsubSettings) unsubSettings();
      if (unsubReviews) unsubReviews();
      if (unsubUsers) unsubUsers();
      if (unsubCustomers) unsubCustomers();
      if (unsubAuth) unsubAuth();
      if (unsubFirestoreOrders) unsubFirestoreOrders();
      if (unsubFirestoreUsers) unsubFirestoreUsers();
      if (unsubFirestoreCustomers) unsubFirestoreCustomers();
    };
  }, []);

  // Toast System
  const addToast = (title: string, message?: string, type: ToastMessage['type'] = 'success') => {
    const newToast: ToastMessage = {
      id: `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title,
      message,
      type
    };
    setToasts(prev => [...(Array.isArray(prev) ? prev : []), newToast]);
    setTimeout(() => {
      removeToast(newToast.id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const t = (key: Parameters<typeof getTranslation>[1]) => {
    return getTranslation(language, key);
  };

  // Product CRUD
  const addProduct = (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newProduct: Product = {
      ...productData,
      id: `prod-${Date.now()}`,
      createdAt: now,
      updatedAt: now
    };
    setProducts(prev => [newProduct, ...(Array.isArray(prev) ? prev : [])]);
    addToast(t('successSave'), `${newProduct.title} added to catalog.`);

    if (isFirebaseConfigured()) {
      // 1. Firebase Realtime Database
      try {
        set(ref(rtdb, `products/${newProduct.id}`), newProduct).catch(err => {
          console.error('Realtime Database add product error:', err);
        });
      } catch (err) {
        console.error('RTDB ref set error:', err);
      }

      // 2. Cloud Firestore (dual persistence)
      setDoc(doc(db, 'products', newProduct.id), newProduct).catch(err => {
        console.warn('Firestore add product notice:', err);
      });

      logAnalyticsEvent('product_added', {
        productId: newProduct.id,
        title: newProduct.title,
        price: newProduct.price,
        category: newProduct.category
      });
    }
  };

  const updateProduct = (id: string, productData: Partial<Product>) => {
    const updatedAt = new Date().toISOString();
    setProducts(prev =>
      prev.map(p => (p.id === id ? { ...p, ...productData, updatedAt } : p))
    );
    addToast(t('successSave'), `Product updated successfully.`);

    if (isFirebaseConfigured()) {
      // 1. Realtime Database
      try {
        update(ref(rtdb, `products/${id}`), { ...productData, updatedAt }).catch(err => {
          console.error('Realtime Database update product error:', err);
        });
      } catch (err) {
        console.error('RTDB update error:', err);
      }

      // 2. Cloud Firestore
      setDoc(doc(db, 'products', id), { ...productData, updatedAt }, { merge: true }).catch(err => {
        console.warn('Firestore update product notice:', err);
      });
      logAnalyticsEvent('product_updated', { productId: id });
    }
  };

  const deleteProduct = async (id: string) => {
    const targetProduct = products.find(p => p.id === id);

    // 1. Immediately remove from local state
    setProducts(prev => prev.filter(p => p.id !== id));

    // Also remove any linked hero carousel banners so homepage doesn't show deleted item
    setHeroBanners(prev => prev.filter(b => b.productId !== id && !b.targetCategoryOrUrl?.includes(id) && !b.targetProductLink?.includes(id)));

    // Update local storage
    try {
      const remaining = products.filter(p => p.id !== id);
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(remaining));
      const remainingBanners = heroBanners.filter(b => b.productId !== id && !b.targetCategoryOrUrl?.includes(id) && !b.targetProductLink?.includes(id));
      localStorage.setItem(STORAGE_KEYS.HERO_BANNERS, JSON.stringify(remainingBanners));
    } catch (e) {
      console.warn('LocalStorage delete notice:', e);
    }

    addToast(
      language === 'bn' ? 'পণ্য সফলভাবে মুছে ফেলা হয়েছে' : t('successDelete'),
      language === 'bn'
        ? 'পণ্যটি Firebase এবং মেইন ওয়েবসাইট থেকে সফলভাবে রিমুভ করা হয়েছে।'
        : 'Product permanently removed from Firebase & main website.',
      'success'
    );

    if (isFirebaseConfigured()) {
      try {
        // --- 1. Cloud Firestore Complete Deep Purge ---
        // A. Direct doc deletion
        deleteDoc(doc(db, 'products', id)).catch(err => {
          console.warn('Firestore direct doc delete notice:', err);
        });

        // B. Query matching docs by 'id' field in case doc ID was auto-generated
        try {
          const qId = query(collection(db, 'products'), where('id', '==', id));
          const snapId = await getDocs(qId);
          snapId.forEach((d) => {
            deleteDoc(doc(db, 'products', d.id)).catch(() => {});
          });
        } catch (e) {
          console.warn('Firestore query by id delete notice:', e);
        }

        // C. If id can be numeric
        if (!isNaN(Number(id))) {
          try {
            const qNum = query(collection(db, 'products'), where('id', '==', Number(id)));
            const snapNum = await getDocs(qNum);
            snapNum.forEach((d) => {
              deleteDoc(doc(db, 'products', d.id)).catch(() => {});
            });
          } catch (e) {
            console.warn('Firestore query by numeric id delete notice:', e);
          }
        }

        // D. Query matching by SKU if available
        if (targetProduct?.sku) {
          try {
            const qSku = query(collection(db, 'products'), where('sku', '==', targetProduct.sku));
            const snapSku = await getDocs(qSku);
            snapSku.forEach((d) => {
              deleteDoc(doc(db, 'products', d.id)).catch(() => {});
            });
          } catch (e) {
            console.warn('Firestore query by sku delete notice:', e);
          }
        }

        // E. Clean up associated hero banners from Firestore
        for (const colName of ['hero_banners', 'heroBanners', 'banners']) {
          try {
            deleteDoc(doc(db, colName, id)).catch(() => {});
            const qBanner = query(collection(db, colName), where('productId', '==', id));
            const snapBanner = await getDocs(qBanner);
            snapBanner.forEach((d) => {
              deleteDoc(doc(db, colName, d.id)).catch(() => {});
            });
          } catch (e) {
            console.warn(`Firestore banner cleanup notice for ${colName}:`, e);
          }
        }

        // F. Clean up product reviews from Firestore
        try {
          const qRev = query(collection(db, 'reviews'), where('productId', '==', id));
          const snapRev = await getDocs(qRev);
          snapRev.forEach((d) => {
            deleteDoc(doc(db, 'reviews', d.id)).catch(() => {});
          });
        } catch (e) {
          console.warn('Firestore reviews cleanup notice:', e);
        }

        // --- 2. Realtime Database Complete Purge ---
        // A. Direct path remove
        remove(ref(rtdb, `products/${id}`)).catch(err => {
          console.warn('RTDB remove product error:', err);
        });

        // B. Scan RTDB products for matching entries (array keys or numeric indices)
        try {
          const rtdbSnap = await get(ref(rtdb, 'products'));
          if (rtdbSnap.exists()) {
            const val = rtdbSnap.val();
            if (typeof val === 'object' && val !== null) {
              for (const [key, rawItem] of Object.entries(val)) {
                const item = rawItem as any;
                if (
                  item &&
                  (item.id === id ||
                    String(item.id) === String(id) ||
                    (targetProduct?.sku && item.sku === targetProduct.sku) ||
                    (targetProduct?.title && item.title === targetProduct.title))
                ) {
                  remove(ref(rtdb, `products/${key}`)).catch(() => {});
                }
              }
            }
          }
        } catch (err) {
          console.warn('RTDB products deep clean error:', err);
        }

        // C. Clean up RTDB banners
        try {
          for (const bCol of ['banners', 'heroBanners']) {
            const bSnap = await get(ref(rtdb, bCol));
            if (bSnap.exists()) {
              const bVal = bSnap.val();
              if (typeof bVal === 'object' && bVal !== null) {
                for (const [key, rawBanner] of Object.entries(bVal)) {
                  const banner = rawBanner as any;
                  if (
                    banner &&
                    (banner.productId === id ||
                      (banner.targetCategoryOrUrl && String(banner.targetCategoryOrUrl).includes(id)) ||
                      (banner.targetProductLink && String(banner.targetProductLink).includes(id)))
                  ) {
                    remove(ref(rtdb, `${bCol}/${key}`)).catch(() => {});
                  }
                }
              }
            }
          }
        } catch (err) {
          console.warn('RTDB banners deep clean error:', err);
        }

        // D. Clean up RTDB reviews
        try {
          const revSnap = await get(ref(rtdb, 'reviews'));
          if (revSnap.exists()) {
            const revVal = revSnap.val();
            if (typeof revVal === 'object' && revVal !== null) {
              for (const [key, rawReview] of Object.entries(revVal)) {
                const review = rawReview as any;
                if (review && review.productId === id) {
                  remove(ref(rtdb, `reviews/${key}`)).catch(() => {});
                }
              }
            }
          }
        } catch (err) {
          console.warn('RTDB reviews clean error:', err);
        }

        logAnalyticsEvent('product_deleted', { productId: id });
      } catch (err) {
        console.error('Firebase product delete error:', err);
      }
    }
  };

  const deleteProductsBulk = async (ids: string[]) => {
    if (!ids || ids.length === 0) return;
    const targetProducts = products.filter(p => ids.includes(p.id));

    setProducts(prev => prev.filter(p => !ids.includes(p.id)));
    setHeroBanners(prev => prev.filter(b => !ids.includes(b.productId || '') && !ids.some(id => b.targetCategoryOrUrl?.includes(id))));

    try {
      const remaining = products.filter(p => !ids.includes(p.id));
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(remaining));
      const remainingBanners = heroBanners.filter(b => !ids.includes(b.productId || '') && !ids.some(id => b.targetCategoryOrUrl?.includes(id)));
      localStorage.setItem(STORAGE_KEYS.HERO_BANNERS, JSON.stringify(remainingBanners));
    } catch (e) {
      console.warn('LocalStorage bulk delete notice:', e);
    }

    addToast(
      language === 'bn' ? 'পণ্যসমূহ মুছে ফেলা হয়েছে' : t('successDelete'),
      language === 'bn'
        ? `${ids.length}টি পণ্য Firebase ও মেইন ওয়েবসাইট থেকে সফলভাবে মুছে ফেলা হয়েছে।`
        : `${ids.length} products deleted from Firebase & main website.`,
      'success'
    );

    if (isFirebaseConfigured()) {
      for (const id of ids) {
        const targetProd = targetProducts.find(p => p.id === id);
        try {
          // Direct delete from Firestore
          deleteDoc(doc(db, 'products', id)).catch(() => {});

          // Query deletes
          try {
            const qId = query(collection(db, 'products'), where('id', '==', id));
            const sId = await getDocs(qId);
            sId.forEach(d => deleteDoc(doc(db, 'products', d.id)).catch(() => {}));
          } catch {}

          if (targetProd?.sku) {
            try {
              const qSku = query(collection(db, 'products'), where('sku', '==', targetProd.sku));
              const sSku = await getDocs(qSku);
              sSku.forEach(d => deleteDoc(doc(db, 'products', d.id)).catch(() => {}));
            } catch {}
          }

          // Clean hero banners
          for (const colName of ['hero_banners', 'heroBanners', 'banners']) {
            try {
              deleteDoc(doc(db, colName, id)).catch(() => {});
              const qB = query(collection(db, colName), where('productId', '==', id));
              const sB = await getDocs(qB);
              sB.forEach(d => deleteDoc(doc(db, colName, d.id)).catch(() => {}));
            } catch {}
          }

          // RTDB direct
          remove(ref(rtdb, `products/${id}`)).catch(() => {});
        } catch (e) {
          console.warn('Bulk delete item error:', e);
        }
      }

      // Deep clean RTDB arrays/objects
      try {
        const rtdbSnap = await get(ref(rtdb, 'products'));
        if (rtdbSnap.exists()) {
          const val = rtdbSnap.val();
          if (typeof val === 'object' && val !== null) {
            for (const [key, rawItem] of Object.entries(val)) {
              const item = rawItem as any;
              if (item && (ids.includes(item.id) || ids.includes(String(item.id)))) {
                remove(ref(rtdb, `products/${key}`)).catch(() => {});
              }
            }
          }
        }
      } catch (err) {
        console.warn('RTDB bulk deep clean error:', err);
      }

      logAnalyticsEvent('products_bulk_deleted', { count: ids.length });
    }
  };

  const updateProductStatusBulk = (ids: string[], isActive: boolean) => {
    const updatedAt = new Date().toISOString();
    setProducts(prev =>
      prev.map(p => (ids.includes(p.id) ? { ...p, isActive, updatedAt } : p))
    );
    addToast(t('successSave'), `${ids.length} products set to ${isActive ? 'Active' : 'Inactive'}.`);

    if (isFirebaseConfigured()) {
      ids.forEach(id => {
        try {
          update(ref(rtdb, `products/${id}`), { isActive, updatedAt }).catch(err => console.error(err));
        } catch (e) {
          console.error(e);
        }
        setDoc(doc(db, 'products', id), { isActive, updatedAt }, { merge: true }).catch(err => {
          console.warn('Firestore product status notice:', err);
        });
      });
      logAnalyticsEvent('products_status_updated', { count: ids.length, isActive });
    }
  };

  const updateStockInline = (id: string, newStock: number) => {
    const updatedAt = new Date().toISOString();
    setProducts(prev =>
      prev.map(p => (p.id === id ? { ...p, stock: Math.max(0, newStock), updatedAt } : p))
    );
    addToast(t('successSave'), `Stock quantity updated to ${newStock}.`);

    if (isFirebaseConfigured()) {
      try {
        update(ref(rtdb, `products/${id}`), { stock: Math.max(0, newStock), updatedAt }).catch(err => console.error(err));
      } catch (e) {
        console.error(e);
      }
      setDoc(doc(db, 'products', id), { stock: Math.max(0, newStock), updatedAt }, { merge: true }).catch(err => {
        console.warn('Firestore stock update notice:', err);
      });
      logAnalyticsEvent('product_stock_updated', { productId: id, newStock });
    }
  };

  // Order CRUD
  const updateOrderStatus = (
    orderId: string,
    status: OrderStatus,
    courierName?: Order['courierName'],
    trackingNumber?: string,
    adminNotes?: string
  ) => {
    const updatedAt = new Date().toISOString();
    setOrders(prev =>
      prev.map(o => {
        if (o.id === orderId) {
          return {
            ...o,
            status,
            ...(courierName ? { courierName } : {}),
            ...(trackingNumber !== undefined ? { trackingNumber } : {}),
            ...(adminNotes !== undefined ? { adminNotes } : {}),
            updatedAt
          };
        }
        return o;
      })
    );
    addToast(t('successStatus'), `Order ${orderId} updated to ${status.toUpperCase()}`);

    if (isFirebaseConfigured()) {
      const orderUpdatePayload = {
        status,
        ...(courierName ? { courierName } : {}),
        ...(trackingNumber !== undefined ? { trackingNumber } : {}),
        ...(adminNotes !== undefined ? { adminNotes } : {}),
        updatedAt
      };

      try {
        update(ref(rtdb, `orders/${orderId}`), orderUpdatePayload).catch(err => {
          console.error('Realtime Database update order error:', err);
        });
      } catch (err) {
        console.error('RTDB order update error:', err);
      }

      setDoc(doc(db, 'orders', orderId), orderUpdatePayload, { merge: true }).catch(err => {
        console.warn('Firestore update order notice:', err);
      });
      logAnalyticsEvent('order_status_updated', { orderId, status });
    }
  };

  const verifyOrderTxId = (orderId: string, isVerified: boolean) => {
    const updatedAt = new Date().toISOString();
    setOrders(prev =>
      prev.map(o => {
        if (o.id === orderId) {
          return {
            ...o,
            isTxIdVerified: isVerified,
            paymentStatus: isVerified ? 'paid' : 'verifying',
            updatedAt
          };
        }
        return o;
      })
    );
    addToast(isVerified ? 'TxID Verified' : 'TxID Unverified', `Payment status updated for ${orderId}`);

    if (isFirebaseConfigured()) {
      const txPayload = {
        isTxIdVerified: isVerified,
        paymentStatus: isVerified ? 'paid' : 'verifying',
        updatedAt
      };

      try {
        update(ref(rtdb, `orders/${orderId}`), txPayload).catch(err => {
          console.error('Realtime Database verify TxID error:', err);
        });
      } catch (err) {
        console.error('RTDB verify TxID error:', err);
      }

      setDoc(doc(db, 'orders', orderId), txPayload, { merge: true }).catch(err => {
        console.warn('Firestore verify TxID notice:', err);
      });
      logAnalyticsEvent('order_txid_verified', { orderId, isVerified });
    }
  };

  const addNewSimulatedOrder = () => {
    const nextNum = 1000 + orders.length + 1;
    const newOrder: Order = {
      id: `BZR-${nextNum}`,
      customerName: 'Sabbir Ahmed',
      customerPhone: '+8801755443322',
      customerEmail: 'sabbir.ahmed@gmail.com',
      deliveryAddress: 'House 88, Road 2, Block A, Mirpur 10',
      district: 'Dhaka',
      items: [
        {
          id: `item-${Date.now()}`,
          productId: 'prod-3',
          title: 'Wireless Active Noise Cancelling Earbuds ANC Pro v2',
          price: 1890,
          quantity: 1,
          image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=80'
        }
      ],
      subtotal: 1890,
      deliveryFee: 60,
      discountAmount: 0,
      grandTotal: 1950,
      paymentMethod: 'bkash',
      paymentStatus: 'paid',
      transactionId: `BK${Math.floor(100000000 + Math.random() * 900000000)}`,
      isTxIdVerified: false,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setOrders(prev => [newOrder, ...(Array.isArray(prev) ? prev : [])]);
    addToast('🔔 New Order Received!', `Order #${newOrder.id} from ${newOrder.customerName} (৳${newOrder.grandTotal})`, 'info');

    if (isFirebaseConfigured()) {
      try {
        set(ref(rtdb, `orders/${newOrder.id}`), newOrder).catch(err => {
          console.error('Realtime Database add order error:', err);
        });
      } catch (err) {
        console.error('RTDB order set error:', err);
      }

      setDoc(doc(db, 'orders', newOrder.id), newOrder).catch(err => {
        console.warn('Firestore add order notice:', err);
      });
      logAnalyticsEvent('order_placed', { orderId: newOrder.id, grandTotal: newOrder.grandTotal });
    }
  };

  const deleteOrder = (orderId: string) => {
    setOrders(prev => prev.filter(o => o.id !== orderId));
    addToast(t('successDelete'), `Order ${orderId} deleted.`);

    if (isFirebaseConfigured()) {
      try {
        remove(ref(rtdb, `orders/${orderId}`)).catch(err => {
          console.error('Realtime Database delete order error:', err);
        });
      } catch (err) {
        console.error('RTDB order remove error:', err);
      }

      deleteDoc(doc(db, 'orders', orderId)).catch(err => {
        console.warn('Firestore delete order notice:', err);
      });
      logAnalyticsEvent('order_deleted', { orderId });
    }
  };

  // Customer CRUD
  const addCustomer = (customer: CustomerUser) => {
    setCustomers(prev => {
      const filtered = prev.filter(c => c.id !== customer.id && c.phone !== customer.phone);
      return [customer, ...filtered];
    });

    if (isFirebaseConfigured()) {
      try {
        set(ref(rtdb, `customers/${customer.id}`), customer).catch(err => {
          console.error('Realtime Database add customer error:', err);
        });
      } catch (err) {
        console.error('RTDB customer set error:', err);
      }

      setDoc(doc(db, 'customers', customer.id), customer, { merge: true }).catch(err => {
        console.warn('Firestore customer set notice:', err);
      });
    }
  };

  const deleteCustomer = (id: string) => {
    setCustomers(prev => prev.filter(c => c.id !== id));
    addToast(t('successDelete'), 'Customer removed from directory.');

    if (isFirebaseConfigured()) {
      try {
        remove(ref(rtdb, `customers/${id}`)).catch(err => {
          console.error('Realtime Database delete customer error:', err);
        });
      } catch (err) {
        console.error('RTDB customer remove error:', err);
      }

      deleteDoc(doc(db, 'customers', id)).catch(err => {
        console.warn('Firestore customer delete notice:', err);
      });
    }
  };

  const updateCustomerStatus = (id: string, status: CustomerUser['status']) => {
    setCustomers(prev => prev.map(c => (c.id === id ? { ...c, status } : c)));
    addToast(t('successSave'), `Customer status set to ${status.toUpperCase()}`);

    if (isFirebaseConfigured()) {
      try {
        update(ref(rtdb, `customers/${id}`), { status }).catch(e => console.error(e));
      } catch (e) {
        console.error(e);
      }
      setDoc(doc(db, 'customers', id), { status }, { merge: true }).catch(e => console.warn(e));
    }
  };

  const updateCustomerCustomDiscount = (id: string, discountPercentage: number) => {
    setCustomers(prev => prev.map(c => (c.id === id ? { ...c, customDiscountPercentage: discountPercentage } : c)));
    addToast(t('successSave'), `VIP discount set to ${discountPercentage}%`);

    if (isFirebaseConfigured()) {
      try {
        update(ref(rtdb, `customers/${id}`), { customDiscountPercentage: discountPercentage }).catch(e => console.error(e));
      } catch (e) {
        console.error(e);
      }
      setDoc(doc(db, 'customers', id), { customDiscountPercentage: discountPercentage }, { merge: true }).catch(e => console.warn(e));
    }
  };

  const adjustCustomerRewardPoints = (id: string, pointsDelta: number) => {
    setCustomers(prev =>
      prev.map(c => (c.id === id ? { ...c, rewardPoints: Math.max(0, c.rewardPoints + pointsDelta) } : c))
    );
    addToast(t('successSave'), `Points adjusted by ${pointsDelta > 0 ? '+' : ''}${pointsDelta}`);

    const targetCustomer = customers.find(c => c.id === id);
    if (isFirebaseConfigured() && targetCustomer) {
      const newPoints = Math.max(0, targetCustomer.rewardPoints + pointsDelta);
      try {
        update(ref(rtdb, `customers/${id}`), { rewardPoints: newPoints }).catch(e => console.error(e));
      } catch (e) {
        console.error(e);
      }
      setDoc(doc(db, 'customers', id), { rewardPoints: newPoints }, { merge: true }).catch(e => console.warn(e));
    }
  };

  const seedSampleCustomers = () => {
    const samples: CustomerUser[] = [
      {
        id: 'cust_sample_1',
        name: 'মোঃ তানভীর আহমেদ',
        phone: '+8801712345678',
        email: 'tanvir.ahmed@gmail.com',
        joinedDate: new Date(Date.now() - 86400000 * 15).toISOString(),
        completedOrdersCount: 2,
        totalSpent: 3500,
        rewardPoints: 120,
        status: 'active',
        customDiscountPercentage: 0,
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
      },
      {
        id: 'cust_sample_2',
        name: 'ফারহানা ইয়াসমিন',
        phone: '+8801819876543',
        email: 'farhana.yasmin@gmail.com',
        joinedDate: new Date(Date.now() - 86400000 * 30).toISOString(),
        completedOrdersCount: 5,
        totalSpent: 8200,
        rewardPoints: 340,
        status: 'vip',
        customDiscountPercentage: 10,
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'
      },
      {
        id: 'cust_sample_3',
        name: 'রাফসান চৌধুরী',
        phone: '+8801911223344',
        email: 'rafsan.c@gmail.com',
        joinedDate: new Date().toISOString(),
        completedOrdersCount: 0,
        totalSpent: 0,
        rewardPoints: 50,
        status: 'active',
        customDiscountPercentage: 0,
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'
      }
    ];

    samples.forEach(s => addCustomer(s));
    addToast('ডেমো গ্রাহক যোগ হয়েছে', '৩ জন ডেমো কাস্টমার সফলভাবে ডিরেক্টরিতে যুক্ত করা হয়েছে।', 'success');
  };

  // Registered Users CRUD
  const addRegisteredUser = (user: RegisteredUser) => {
    setRegisteredUsers(prev => [user, ...(Array.isArray(prev) ? prev.filter(u => u.uid !== user.uid) : [])]);

    // Automatically map into Customer Directory
    const mappedCustomer: CustomerUser = {
      id: user.uid,
      name: user.name || 'Customer',
      phone: user.phone || '',
      email: user.email || '',
      joinedDate: user.createdAt || new Date().toISOString(),
      completedOrdersCount: 0,
      totalSpent: 0,
      rewardPoints: 50,
      status: user.status === 'suspended' ? 'suspended' : 'active',
      customDiscountPercentage: 0,
      avatar: user.photoURL
    };
    addCustomer(mappedCustomer);

    if (isFirebaseConfigured()) {
      try {
        set(ref(rtdb, `users/${user.uid}`), user).catch(err => {
          console.error('Realtime Database add user error:', err);
        });
      } catch (err) {
        console.error('RTDB user set error:', err);
      }

      setDoc(doc(db, 'users', user.uid), user, { merge: true }).catch(err => {
        console.warn('Firestore user set notice:', err);
      });
    }
  };

  const updateRegisteredUserStatus = (uid: string, status: RegisteredUser['status']) => {
    setRegisteredUsers(prev => prev.map(u => u.uid === uid ? { ...u, status } : u));
    setCustomers(prev => prev.map(c => c.id === uid ? { ...c, status: status === 'suspended' ? 'suspended' : 'active' } : c));

    if (isFirebaseConfigured()) {
      try {
        update(ref(rtdb, `users/${uid}`), { status }).catch(e => console.error(e));
        update(ref(rtdb, `customers/${uid}`), { status: status === 'suspended' ? 'suspended' : 'active' }).catch(e => console.error(e));
      } catch (e) {
        console.error(e);
      }
      setDoc(doc(db, 'users', uid), { status }, { merge: true }).catch(e => console.warn(e));
      setDoc(doc(db, 'customers', uid), { status: status === 'suspended' ? 'suspended' : 'active' }, { merge: true }).catch(e => console.warn(e));
    }
  };

  const deleteRegisteredUser = (uid: string) => {
    setRegisteredUsers(prev => prev.filter(u => u.uid !== uid));
    setCustomers(prev => prev.filter(c => c.id !== uid));
    addToast('Account Deleted', `User UID ${uid} deleted from directories.`);

    if (isFirebaseConfigured()) {
      try {
        remove(ref(rtdb, `users/${uid}`)).catch(e => console.error(e));
        remove(ref(rtdb, `customers/${uid}`)).catch(e => console.error(e));
      } catch (e) {
        console.error(e);
      }
      deleteDoc(doc(db, 'users', uid)).catch(e => console.warn(e));
      deleteDoc(doc(db, 'customers', uid)).catch(e => console.warn(e));
    }
  };

  // Royal Club & Campaign CRUD
  const toggleCampaignActive = (active: boolean) => {
    setRoyalClub(prev => ({ ...prev, campaignActive: active }));
    addToast(active ? 'Campaign Activated 👑' : 'Campaign Deactivated', active ? t('campaignActiveMsg') : t('campaignInactiveMsg'));
  };

  const updateRoyalClubSettings = (settings: Partial<RoyalClubCampaignSettings>) => {
    setRoyalClub(prev => ({ ...prev, ...settings }));
    addToast(t('successSave'), 'Royal Club settings updated.');

    if (isFirebaseConfigured()) {
      setDoc(doc(db, 'settings', 'royal_club'), settings, { merge: true }).catch(err => {
        console.warn('Firestore royal club notice:', err);
      });
      logAnalyticsEvent('royal_club_updated');
    }
  };

  const addHeroBanner = (bannerData: Omit<HeroBanner, 'id'> & { id?: string }): HeroBanner => {
    const newBanner: HeroBanner = {
      ...bannerData,
      id: bannerData.id || `banner-${Date.now()}`
    };
    setHeroBanners(prev => [...(Array.isArray(prev) ? prev : []), newBanner]);
    addToast(t('successSave'), 'Hero Banner added.');

    if (isFirebaseConfigured()) {
      const bannerPayload = {
        ...newBanner,
        image: newBanner.imageUrl, // Alias for storefronts expecting 'image'
        bannerImage: newBanner.imageUrl,
        updatedAt: new Date().toISOString()
      };

      // 1. Save to Realtime Database (multiple common paths)
      const rtdbPaths = ['banners', 'hero_banners', 'heroBanners'];
      rtdbPaths.forEach(path => {
        try {
          set(ref(rtdb, `${path}/${newBanner.id}`), bannerPayload).catch(err => {
            console.error(`RTDB ${path} set error:`, err);
          });
        } catch (err) {
          console.error(`RTDB error for ${path}:`, err);
        }
      });

      // 2. Save to Cloud Firestore (multiple common collections)
      const firestoreCollections = ['hero_banners', 'heroBanners', 'banners'];
      firestoreCollections.forEach(col => {
        setDoc(doc(db, col, newBanner.id), bannerPayload, { merge: true }).catch(err => {
          console.warn(`Firestore ${col} save notice:`, err);
        });
      });
    }

    return newBanner;
  };

  const updateHeroBanner = (id: string, bannerData: Partial<HeroBanner>) => {
    const updatedAt = new Date().toISOString();
    setHeroBanners(prev => prev.map(b => (b.id === id ? { ...b, ...bannerData, updatedAt } : b)));
    addToast(t('successSave'), 'Hero Banner updated.');

    if (isFirebaseConfigured()) {
      const updatePayload: Record<string, any> = {
        ...bannerData,
        updatedAt
      };
      if (bannerData.imageUrl) {
        updatePayload.image = bannerData.imageUrl;
        updatePayload.bannerImage = bannerData.imageUrl;
      }

      ['banners', 'hero_banners', 'heroBanners'].forEach(path => {
        try {
          update(ref(rtdb, `${path}/${id}`), updatePayload).catch(err => {
            console.error(`RTDB ${path} update error:`, err);
          });
        } catch (err) {
          console.error(`RTDB update error for ${path}:`, err);
        }
      });

      ['hero_banners', 'heroBanners', 'banners'].forEach(col => {
        setDoc(doc(db, col, id), updatePayload, { merge: true }).catch(err => {
          console.warn(`Firestore ${col} update notice:`, err);
        });
      });
    }
  };

  const deleteHeroBanner = (id: string) => {
    setHeroBanners(prev => prev.filter(b => b.id !== id));
    addToast(t('successDelete'), 'Hero Banner removed.');

    if (isFirebaseConfigured()) {
      ['banners', 'hero_banners', 'heroBanners'].forEach(path => {
        try {
          remove(ref(rtdb, `${path}/${id}`)).catch(err => {
            console.error(`RTDB ${path} remove error:`, err);
          });
        } catch (err) {
          console.error(`RTDB remove error for ${path}:`, err);
        }
      });

      ['hero_banners', 'heroBanners', 'banners'].forEach(col => {
        deleteDoc(doc(db, col, id)).catch(err => {
          console.warn(`Firestore ${col} delete notice:`, err);
        });
      });
    }
  };

  const reorderHeroBanners = (banners: HeroBanner[]) => {
    setHeroBanners(banners);
    addToast(t('successSave'), 'Hero Banners reordered.');

    if (isFirebaseConfigured()) {
      const bannersObj: Record<string, any> = {};
      banners.forEach(b => {
        bannersObj[b.id] = {
          ...b,
          image: b.imageUrl,
          bannerImage: b.imageUrl
        };
      });

      ['banners', 'hero_banners', 'heroBanners'].forEach(path => {
        try {
          set(ref(rtdb, path), bannersObj).catch(err => {
            console.error(`RTDB ${path} reorder error:`, err);
          });
        } catch (err) {
          console.error(`RTDB error:`, err);
        }
      });

      banners.forEach(b => {
        const payload = {
          ...b,
          image: b.imageUrl,
          bannerImage: b.imageUrl
        };
        ['hero_banners', 'heroBanners', 'banners'].forEach(col => {
          setDoc(doc(db, col, b.id), payload, { merge: true }).catch(err => {
            console.warn(`Firestore ${col} save notice:`, err);
          });
        });
      });
    }
  };

  const addUserOverride = (phone: string, guaranteedSliceId?: string, note?: string) => {
    setRoyalClub(prev => ({
      ...prev,
      userOverrides: [
        ...prev.userOverrides.filter(u => u.phone !== phone),
        { phone, guaranteedSliceId, note }
      ]
    }));
    addToast(t('successSave'), `User override configured for ${phone}`);
  };

  const removeUserOverride = (phone: string) => {
    setRoyalClub(prev => ({
      ...prev,
      userOverrides: prev.userOverrides.filter(u => u.phone !== phone)
    }));
    addToast(t('successDelete'), `Override removed for ${phone}`);
  };

  // Reviews CRUD
  const addReview = (reviewData: Omit<Review, 'id' | 'createdAt'>) => {
    const newRev: Review = {
      ...reviewData,
      id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString()
    };
    setReviews(prev => [newRev, ...prev]);
    addToast(t('successSave'), 'Customer review added successfully.');

    if (isFirebaseConfigured()) {
      try {
        set(ref(rtdb, `reviews/${newRev.id}`), newRev).catch(err => {
          console.error('Realtime Database add review error:', err);
        });
      } catch (err) {
        console.error('RTDB review set error:', err);
      }
    }
  };

  const deleteReview = (id: string) => {
    setReviews(prev => prev.filter(r => r.id !== id));
    addToast(t('successDelete'), 'Review removed.');

    if (isFirebaseConfigured()) {
      try {
        remove(ref(rtdb, `reviews/${id}`)).catch(err => {
          console.error('Realtime Database delete review error:', err);
        });
      } catch (err) {
        console.error('RTDB review remove error:', err);
      }
    }
  };

  const toggleVerifiedReview = (id: string) => {
    let updatedReview: Review | undefined;
    setReviews(prev =>
      prev.map(r => {
        if (r.id === id) {
          updatedReview = { ...r, isVerifiedPurchase: !r.isVerifiedPurchase };
          return updatedReview;
        }
        return r;
      })
    );
    addToast(t('successSave'), 'Verified purchase badge toggled.');

    if (isFirebaseConfigured() && updatedReview) {
      try {
        update(ref(rtdb, `reviews/${id}`), { isVerifiedPurchase: (updatedReview as Review).isVerifiedPurchase }).catch(err => console.error(err));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const replyToReview = (id: string, replyText: string) => {
    const now = new Date().toISOString();
    setReviews(prev =>
      prev.map(r => (r.id === id ? { ...r, adminReply: replyText, adminRepliedAt: now } : r))
    );
    addToast(t('successSave'), 'Official store reply published.');

    if (isFirebaseConfigured()) {
      try {
        update(ref(rtdb, `reviews/${id}`), { adminReply: replyText, adminRepliedAt: now }).catch(err => console.error(err));
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Store Settings & Tools
  const updateStoreSettings = (settings: Partial<GlobalStoreSettings>) => {
    setStoreSettings(prev => ({ ...prev, ...settings }));
    addToast(t('successSave'), 'Global store settings updated.');

    if (isFirebaseConfigured()) {
      try {
        update(ref(rtdb, 'settings/global_store'), settings).catch(err => {
          console.error('Realtime Database update store settings error:', err);
        });
      } catch (err) {
        console.error('RTDB update settings error:', err);
      }

      setDoc(doc(db, 'settings', 'global_store'), settings, { merge: true }).catch(err => {
        console.warn('Firestore store settings notice:', err);
      });
      logAnalyticsEvent('store_settings_updated');
    }
  };

  const resetToDemoData = () => {
    setProducts(INITIAL_PRODUCTS);
    setOrders(INITIAL_ORDERS);
    setCustomers(INITIAL_CUSTOMERS);
    setReviews(INITIAL_REVIEWS);
    setRoyalClub(INITIAL_ROYAL_CLUB_SETTINGS);
    setHeroBanners(INITIAL_HERO_BANNERS);
    setStoreSettings(INITIAL_STORE_SETTINGS);
    setRegisteredUsers(INITIAL_REGISTERED_USERS);
    addToast('রিসেট সম্পন্ন', 'সবকিছু নতুন ও ফ্রেশ অবস্থায় সেট করা হয়েছে।', 'info');
  };

  const clearAllData = () => {
    setProducts([]);
    setOrders([]);
    setCustomers([]);
    setReviews([]);
    setHeroBanners([]);
    setRegisteredUsers([]);
    setRoyalClub(INITIAL_ROYAL_CLUB_SETTINGS);
    setStoreSettings(INITIAL_STORE_SETTINGS);

    // Also clear and reset localStorage keys to empty arrays
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.REGISTERED_USERS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.HERO_BANNERS, JSON.stringify([]));
      localStorage.setItem('bazar_store_clean_fresh_v3', 'true');
      
      // Clean older v1 & v2 keys too if present
      localStorage.removeItem('bazar_admin_products_v1');
      localStorage.removeItem('bazar_admin_products_v2');
      localStorage.removeItem('bazar_admin_orders_v1');
      localStorage.removeItem('bazar_admin_orders_v2');
      localStorage.removeItem('bazar_admin_customers_v1');
      localStorage.removeItem('bazar_admin_customers_v2');
      localStorage.removeItem('bazar_admin_registered_users_v1');
      localStorage.removeItem('bazar_admin_registered_users_v2');
      localStorage.removeItem('bazar_admin_reviews_v1');
      localStorage.removeItem('bazar_admin_reviews_v2');
      localStorage.removeItem('bazar_admin_hero_banners_v1');
      localStorage.removeItem('bazar_admin_hero_banners_v2');
      localStorage.removeItem('bazar_admin_royal_club_v1');
      localStorage.removeItem('bazar_admin_royal_club_v2');
    } catch (e) {
      console.warn('Storage cleanup notice:', e);
    }

    addToast('সম্পূর্ণ নতুন ওয়েবসাইট', 'সকল প্রোডাক্ট, অর্ডার ও হিরো ব্যানার মুছে সম্পূর্ণ নতুন ও প্রস্তুত করা হয়েছে। (০ প্রোডাক্ট, ০ ব্যানার)', 'success');
  };

  const exportDataBackup = () => {
    const backup = {
      exportDate: new Date().toISOString(),
      products,
      orders,
      customers,
      reviews,
      royalClub,
      heroBanners,
      storeSettings
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bazar_admin_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('Backup Exported', 'Downloaded complete database JSON snapshot.');
  };

  const importDataBackup = (jsonContent: string): boolean => {
    try {
      const data = JSON.parse(jsonContent);
      if (data.products) setProducts(data.products);
      if (data.orders) setOrders(data.orders);
      if (data.customers) setCustomers(data.customers);
      if (data.reviews) setReviews(data.reviews);
      if (data.royalClub) setRoyalClub(data.royalClub);
      if (data.heroBanners) setHeroBanners(data.heroBanners);
      if (data.storeSettings) setStoreSettings(data.storeSettings);
      addToast('Backup Imported', 'Database state restored from file.');
      return true;
    } catch {
      addToast('Import Failed', 'Invalid backup JSON file format.', 'error');
      return false;
    }
  };

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        theme,
        toggleTheme,
        activeTab,
        setActiveTab,
        searchQuery,
        setSearchQuery,
        products,
        orders,
        customers,
        registeredUsers,
        reviews,
        royalClub,
        heroBanners,
        storeSettings,
        toasts,
        addToast,
        removeToast,
        addProduct,
        updateProduct,
        deleteProduct,
        deleteProductsBulk,
        updateProductStatusBulk,
        updateStockInline,
        updateOrderStatus,
        verifyOrderTxId,
        addNewSimulatedOrder,
        deleteOrder,
        addCustomer,
        deleteCustomer,
        updateCustomerStatus,
        updateCustomerCustomDiscount,
        adjustCustomerRewardPoints,
        seedSampleCustomers,
        addRegisteredUser,
        updateRegisteredUserStatus,
        deleteRegisteredUser,
        toggleCampaignActive,
        updateRoyalClubSettings,
        addHeroBanner,
        updateHeroBanner,
        deleteHeroBanner,
        reorderHeroBanners,
        addUserOverride,
        removeUserOverride,
        addReview,
        deleteReview,
        toggleVerifiedReview,
        replyToReview,
        updateStoreSettings,
        resetToDemoData,
        clearAllData,
        exportDataBackup,
        importDataBackup,
        t
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
