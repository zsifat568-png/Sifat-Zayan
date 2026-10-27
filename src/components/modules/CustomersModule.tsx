import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { CustomerUser, RegisteredUser, UserStatus } from '../../types';
import { auth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from '../../lib/firebase';
import {
  Users,
  Search,
  Crown,
  ShoppingBag,
  ShieldCheck,
  CheckCircle,
  X,
  Phone,
  Mail,
  Calendar,
  Gift,
  Trash2,
  Sparkles,
  Smartphone,
  LogIn,
  KeyRound,
  RotateCcw,
  User,
  ArrowDown
} from 'lucide-react';

export const CustomersModule: React.FC = () => {
  const {
    customers,
    registeredUsers,
    orders,
    deleteCustomer,
    updateCustomerStatus,
    updateCustomerCustomDiscount,
    addRegisteredUser,
    addCustomer,
    addToast,
    searchQuery,
    setSearchQuery,
    t
  } = useApp();

  const [selectedUser, setSelectedUser] = useState<CustomerUser | null>(null);
  const [modalStatus, setModalStatus] = useState<UserStatus>('active');
  const [modalDiscount, setModalDiscount] = useState<number>(0);
  const [filterType, setFilterType] = useState<'all' | 'buyers' | 'new_signups' | 'vip'>('all');
  const [showAuthTestModal, setShowAuthTestModal] = useState<boolean>(false);
  const [authTestTab, setAuthTestTab] = useState<'signup' | 'login'>('signup');
  const [authTestForm, setAuthTestForm] = useState({ name: '', phone: '', email: '', password: '' });
  const [authTestLoading, setAuthTestLoading] = useState<boolean>(false);
  const [authTestError, setAuthTestError] = useState<string>('');

  // 7 users per page / batch infinite scroll
  const [visibleCount, setVisibleCount] = useState<number>(7);
  const scrollSentinelRef = useRef<HTMLDivElement | null>(null);

  // Sync modal state when selected user changes
  useEffect(() => {
    if (selectedUser) {
      setModalStatus(selectedUser.status);
      setModalDiscount(selectedUser.customDiscountPercentage || 0);
    }
  }, [selectedUser]);

  // Helper to extract clean last 10 digits for BD phone format
  const getPhoneKey = (p?: string) => {
    const d = (p || '').replace(/[^0-9]/g, '');
    return d.length >= 10 ? d.slice(-10) : d;
  };

  const formatDateSafe = (d?: string) => {
    if (!d) return 'Recent';
    try {
      const dt = new Date(d);
      return isNaN(dt.getTime()) ? 'Recent' : dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return 'Recent';
    }
  };

  // Only real Firebase logged-in / registered customers
  const allDirectoryCustomers = useMemo(() => {
    const list: CustomerUser[] = [];
    const seenUids = new Set<string>();

    (registeredUsers || []).forEach(u => {
      if (!u.uid || seenUids.has(u.uid)) return;
      seenUids.add(u.uid);

      const custOverride = (customers || []).find(c => c.id === u.uid);
      const uPhoneKey = getPhoneKey(u.phone);
      const uEmailKey = (u.email || '').toLowerCase().trim();

      // Find orders belonging to this Firebase user
      const matchedOrders = (orders || []).filter(o => {
        if (o.userId === u.uid || o.customerId === u.uid) return true;
        if (uPhoneKey && getPhoneKey(o.customerPhone) === uPhoneKey) return true;
        if (uEmailKey && o.customerEmail && o.customerEmail.toLowerCase().trim() === uEmailKey) return true;
        return false;
      });

      const orderCount = matchedOrders.length;
      const totalSpentFromOrders = matchedOrders
        .filter(o => o.status !== 'cancelled')
        .reduce((sum, o) => sum + (o.grandTotal || 0), 0);

      // Latest delivery address
      let address = custOverride?.defaultAddress;
      if (!address && matchedOrders.length > 0) {
        const sorted = [...matchedOrders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        address = sorted[0].deliveryAddress;
      }

      // Earliest joined date
      let earliestDate = u.createdAt || custOverride?.joinedDate || new Date().toISOString();
      if (matchedOrders.length > 0) {
        matchedOrders.forEach(o => {
          if (o.createdAt && new Date(o.createdAt).getTime() < new Date(earliestDate).getTime()) {
            earliestDate = o.createdAt;
          }
        });
      }

      const totalSpent = Math.max(custOverride?.totalSpent || 0, totalSpentFromOrders);
      const completedOrdersCount = Math.max(custOverride?.completedOrdersCount || 0, orderCount);
      const rewardPoints = custOverride?.rewardPoints ?? (50 + Math.floor(totalSpent / 100) * 10);

      // All new customers are ACTIVE. No one is VIP unless admin explicitly makes them VIP
      const finalStatus: UserStatus = 
        (custOverride?.status === 'vip' || (u as any).status === 'vip') ? 'vip' :
        (custOverride?.status === 'suspended' || u.status === 'suspended') ? 'suspended' : 'active';

      const customDiscount = custOverride?.customDiscountPercentage || 0;
      const avatarUrl = u.photoURL || custOverride?.avatar;

      list.push({
        id: u.uid,
        name: u.name || custOverride?.name || (u.email ? u.email.split('@')[0] : 'Customer'),
        phone: u.phone || custOverride?.phone || '',
        email: u.email || custOverride?.email || '',
        joinedDate: earliestDate,
        completedOrdersCount,
        totalSpent,
        rewardPoints,
        status: finalStatus,
        customDiscountPercentage: customDiscount,
        defaultAddress: address,
        avatar: avatarUrl
      });
    });

    return list.sort((a, b) => (b.totalSpent - a.totalSpent) || (new Date(b.joinedDate).getTime() - new Date(a.joinedDate).getTime()));
  }, [registeredUsers, customers, orders]);

  // Filtered Customers
  const filteredCustomers = useMemo(() => {
    return allDirectoryCustomers.filter(c => {
      const hasPurchased = (c.completedOrdersCount > 0);

      // Filter tabs
      if (filterType === 'buyers' && !hasPurchased) return false;
      if (filterType === 'new_signups' && hasPurchased) return false;
      if (filterType === 'vip' && c.status !== 'vip') return false;

      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      const name = (c.name || '').toLowerCase();
      const phone = (c.phone || '').toLowerCase();
      const email = (c.email || '').toLowerCase();
      const id = (c.id || '').toLowerCase();
      const addr = (c.defaultAddress || '').toLowerCase();
      return name.includes(q) || phone.includes(q) || email.includes(q) || id.includes(q) || addr.includes(q);
    });
  }, [allDirectoryCustomers, filterType, searchQuery]);

  // Reset pagination to 7 whenever search or filter changes
  useEffect(() => {
    setVisibleCount(7);
  }, [searchQuery, filterType]);

  // Customers sliced for infinite scroll: 7 initially, +7 on scroll
  const displayedCustomers = useMemo(() => {
    return filteredCustomers.slice(0, visibleCount);
  }, [filteredCustomers, visibleCount]);

  // Lightning-fast nanosecond infinite scroll using IntersectionObserver
  useEffect(() => {
    const sentinel = scrollSentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount(prev => {
            if (prev < filteredCustomers.length) {
              return prev + 7;
            }
            return prev;
          });
        }
      },
      {
        root: null,
        rootMargin: '250px', // Trigger 250px ahead for instant zero-lag rendering
        threshold: 0.1
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [filteredCustomers.length]);

  // Orders for selected user
  const userOrders = useMemo(() => {
    if (!selectedUser) return [];
    const pKey = getPhoneKey(selectedUser.phone);
    const eKey = (selectedUser.email || '').toLowerCase().trim();
    return (orders || []).filter(o => {
      if (selectedUser.id && (o.customerId === selectedUser.id || o.userId === selectedUser.id)) return true;
      if (pKey && getPhoneKey(o.customerPhone) === pKey) return true;
      if (eKey && o.customerEmail && o.customerEmail.toLowerCase().trim() === eKey) return true;
      return false;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, selectedUser]);

  // Handle Save Customer Custom Settings (Admin can make VIP or change discount)
  const handleSaveCustomerSettings = () => {
    if (!selectedUser) return;
    updateCustomerStatus(selectedUser.id, modalStatus);
    updateCustomerCustomDiscount(selectedUser.id, modalDiscount);

    // Update local selected user state
    setSelectedUser(prev =>
      prev ? { ...prev, status: modalStatus, customDiscountPercentage: modalDiscount } : null
    );
  };

  // Firebase Auth Quick Simulator (Allows creating real Firebase login customers)
  const handleAuthTestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthTestError('');
    setAuthTestLoading(true);

    try {
      if (authTestTab === 'signup') {
        let fbUid = `usr_${Date.now()}`;
        if (auth && authTestForm.email && authTestForm.password) {
          try {
            const res = await createUserWithEmailAndPassword(auth, authTestForm.email, authTestForm.password);
            fbUid = res.user.uid;
          } catch (err: unknown) {
            console.warn('Firebase signup notice:', err);
          }
        }

        const newCustomer: CustomerUser = {
          id: fbUid,
          name: authTestForm.name.trim() || 'Valued Customer',
          phone: authTestForm.phone.trim() || '+8801700000000',
          email: authTestForm.email.trim() || `${authTestForm.name.toLowerCase().replace(/\s+/g, '')}@bazar.customer`,
          joinedDate: new Date().toISOString(),
          completedOrdersCount: 0,
          totalSpent: 0,
          rewardPoints: 100,
          status: 'active', // All new users are active, never VIP unless admin does it
          customDiscountPercentage: 0,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(authTestForm.name || 'User')}&background=4F46E5&color=fff&size=256`
        };

        const regUser: RegisteredUser = {
          uid: fbUid,
          name: newCustomer.name,
          phone: newCustomer.phone,
          email: newCustomer.email,
          authProvider: 'firebase_email',
          emailVerified: true,
          status: 'active', // Always active
          createdAt: newCustomer.joinedDate,
          lastLoginAt: newCustomer.joinedDate,
          deviceInfo: 'Directory Simulator'
        };

        addRegisteredUser(regUser);
        addCustomer(newCustomer);
        setShowAuthTestModal(false);
        setAuthTestForm({ name: '', phone: '', email: '', password: '' });
        addToast('🎉 সাইন-আপ সফল!', `${newCustomer.name}, একাউন্ট তৈরি হয়ে কাস্টমার ডিরেক্টরিতে যুক্ত হয়েছে!`, 'success');
      } else {
        // Login Flow
        if (auth && authTestForm.email && authTestForm.password) {
          try {
            await signInWithEmailAndPassword(auth, authTestForm.email, authTestForm.password);
          } catch (err: unknown) {
            console.warn('Firebase login notice:', err);
          }
        }

        const existing = allDirectoryCustomers.find(
          c => (authTestForm.email && c.email.toLowerCase() === authTestForm.email.toLowerCase()) || (authTestForm.phone && c.phone === authTestForm.phone)
        );

        if (existing) {
          addToast('লগইন সফল!', `স্বাগতম ${existing.name}! একাউন্টটি ডিরেক্টরিতে পাওয়া গেছে।`, 'success');
          setSelectedUser(existing);
          setShowAuthTestModal(false);
        } else {
          const newUid = `usr_${Date.now()}`;
          const newCust: CustomerUser = {
            id: newUid,
            name: authTestForm.name.trim() || authTestForm.email.split('@')[0] || 'Logged In Customer',
            phone: authTestForm.phone.trim() || '+8801700000000',
            email: authTestForm.email.trim(),
            joinedDate: new Date().toISOString(),
            completedOrdersCount: 0,
            totalSpent: 0,
            rewardPoints: 50,
            status: 'active', // Always active
            customDiscountPercentage: 0,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(authTestForm.email.split('@')[0])}&background=4F46E5&color=fff&size=256`
          };
          const regUser: RegisteredUser = {
            uid: newUid,
            name: newCust.name,
            phone: newCust.phone,
            email: newCust.email,
            authProvider: 'firebase_email',
            emailVerified: true,
            status: 'active',
            createdAt: newCust.joinedDate,
            lastLoginAt: newCust.joinedDate,
            deviceInfo: 'Web Browser'
          };
          addRegisteredUser(regUser);
          addCustomer(newCust);
          setShowAuthTestModal(false);
          addToast('লগইন সম্পন্ন!', `${newCust.name} লগইন হয়েছে এবং ডিরেক্টরিতে যুক্ত হয়েছে।`, 'success');
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setAuthTestError(msg);
    } finally {
      setAuthTestLoading(false);
    }
  };

  const buyersCount = allDirectoryCustomers.filter(c => c.completedOrdersCount > 0).length;
  const newSignupsCount = allDirectoryCustomers.length - buyersCount;
  const vipCount = allDirectoryCustomers.filter(c => c.status === 'vip').length;

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-800/90 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span>{t('customers')} (গ্রাহক ডিরেক্টরি)</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono font-bold">
              {allDirectoryCustomers.length} Firebase Users
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            ফায়ারবেসে লগইন ও নিবন্ধিত রিয়েল গ্রাহক তালিকা। নতুন লগইন করা সকল ইউজার প্রাথমিক অবস্থায় এক্টিভ থাকে (এডমিন ব্যতীত কেউ ভিআইপি হয় না)।
          </p>
        </div>

        {/* Action Controls (Search & Live Auth Simulator) */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search name, phone, email, UID..."
              className="w-full pl-9 pr-7 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                title="ফিল্টার ক্লিয়ার করুন"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Quick Firebase Auth Test / Simulator Trigger */}
          <button
            onClick={() => {
              setAuthTestError('');
              setShowAuthTestModal(true);
            }}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-transform hover:scale-105 shrink-0"
            title="নতুন একাউন্ট সাইন-আপ বা লগইন করে রিয়েলটাইমে টেস্ট করুন"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>লগইন / সাইন-আপ টেস্ট</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs Bar */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs">
        <button
          onClick={() => setFilterType('all')}
          className={`px-3.5 py-1.5 rounded-xl font-bold transition-colors flex items-center gap-1.5 ${
            filterType === 'all'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600'
          }`}
        >
          <span>সকল গ্রাহক</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-mono">{allDirectoryCustomers.length}</span>
        </button>

        <button
          onClick={() => setFilterType('buyers')}
          className={`px-3.5 py-1.5 rounded-xl font-bold transition-colors flex items-center gap-1.5 ${
            filterType === 'buyers'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:text-emerald-600'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>পণ্য ক্রেতা (Active Buyers)</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-mono">{buyersCount}</span>
        </button>

        <button
          onClick={() => setFilterType('new_signups')}
          className={`px-3.5 py-1.5 rounded-xl font-bold transition-colors flex items-center gap-1.5 ${
            filterType === 'new_signups'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:text-blue-600'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>নতুন সাইন-আপ (New Users)</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-mono">{newSignupsCount}</span>
        </button>

        <button
          onClick={() => setFilterType('vip')}
          className={`px-3.5 py-1.5 rounded-xl font-bold transition-colors flex items-center gap-1.5 ${
            filterType === 'vip'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:text-amber-600'
          }`}
        >
          <Crown className="w-3.5 h-3.5" />
          <span>এডমিন নির্বাচিত VIP</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-mono">{vipCount}</span>
        </button>
      </div>

      {/* Customer Directory Table */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3.5">Customer Profile & Photo</th>
                <th className="p-3.5">Contact Details</th>
                <th className="p-3.5">Joined Date</th>
                <th className="p-3.5">Orders & Spent</th>
                <th className="p-3.5">VIP Discount Override</th>
                <th className="p-3.5">Account Status</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400">
                    <Users className="w-10 h-10 mx-auto mb-3 text-indigo-400 opacity-60" />
                    <p className="font-bold text-base text-slate-700 dark:text-slate-200">
                      {searchQuery ? `"${searchQuery}" দিয়ে কোনো ফায়ারবেস গ্রাহক মেলেনি` : 'কাস্টমার ডিরেক্টরি বর্তমানে খালি'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                      {searchQuery
                        ? 'অন্য কোনো নাম, ফোন বা ইমেইল দিয়ে খুঁজুন অথবা সার্চ ফিল্টার ক্লিয়ার করুন।'
                        : 'ওয়েবসাইটে ইউজার সাইন-আপ বা লগইন করলে সাথে সাথে এই ডিরেক্টরিতে যুক্ত হবে। এখনই টেস্ট করতে পারেন:'}
                    </p>
                    
                    <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="px-3.5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-xs flex items-center gap-1.5 transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>সার্চ ফিল্টার মুছুন</span>
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setAuthTestError('');
                          setShowAuthTestModal(true);
                        }}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all hover:scale-105"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        <span>🚀 টেস্ট একাউন্ট সাইন-আপ করুন</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                displayedCustomers.map(customer => {
                  const liveOrderCount = customer.completedOrdersCount || 0;
                  const liveTotalSpent = customer.totalSpent || 0;
                  const isNewSignup = liveOrderCount === 0;

                  return (
                    <tr key={customer.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                      
                      {/* Profile Picture & Name */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <div className="relative shrink-0">
                            <img
                              src={
                                customer.avatar ||
                                `https://ui-avatars.com/api/?name=${encodeURIComponent(customer.name || 'User')}&background=4F46E5&color=fff&size=128`
                              }
                              alt={customer.name}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(customer.name || 'User')}&background=4F46E5&color=fff&size=128`;
                              }}
                              className="w-11 h-11 rounded-2xl object-cover ring-2 ring-indigo-500/20 border border-slate-200 dark:border-slate-700 shadow-sm"
                            />
                            {customer.avatar && (
                              <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-900" title="Profile Photo Available" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                                {customer.name || 'Customer'}
                              </p>
                              {isNewSignup && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                  New User
                                </span>
                              )}
                            </div>
                            <span className="inline-block text-[10px] text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950 px-1.5 py-0.5 rounded font-mono font-bold border border-indigo-200/80 dark:border-indigo-800/80 mt-0.5">
                              UID: {customer.id && customer.id.length > 18 ? customer.id.slice(0, 18) + '...' : customer.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Phone & Email */}
                      <td className="p-3.5">
                        <p className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                          {customer.phone || 'No phone'}
                        </p>
                        <p className="text-[11px] text-slate-500 font-mono">{customer.email || 'No email'}</p>
                      </td>

                      {/* Joined Date */}
                      <td className="p-3.5 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                        {formatDateSafe(customer.joinedDate)}
                      </td>

                      {/* Orders & Total Spent */}
                      <td className="p-3.5">
                        <p className="font-bold text-slate-900 dark:text-white font-mono">
                          {liveOrderCount} {liveOrderCount === 1 ? 'order' : 'orders'}
                        </p>
                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono font-semibold">
                          ৳{liveTotalSpent.toLocaleString()} spent
                        </p>
                      </td>

                      {/* Custom VIP Discount Override */}
                      <td className="p-3.5 font-mono">
                        {(customer.customDiscountPercentage || 0) > 0 ? (
                          <span className="px-2.5 py-1 rounded-lg bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 font-black text-xs border border-purple-300 dark:border-purple-800">
                            {customer.customDiscountPercentage}% VIP OFF
                          </span>
                        ) : customer.status === 'vip' ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300">
                            👑 VIP Club
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono text-[11px]">Regular</span>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                            customer.status === 'vip'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300'
                              : customer.status === 'suspended'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300'
                          }`}
                        >
                          {customer.status === 'vip' ? '👑 VIP' : customer.status === 'suspended' ? 'Suspended' : 'Active'}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="p-3.5 text-right space-x-2">
                        <button
                          onClick={() => setSelectedUser(customer)}
                          className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all hover:scale-105"
                        >
                          প্রোফাইল দেখুন
                        </button>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Sentinel for Nanosecond Infinite Scroll (Triggers auto-load when scrolled into view) */}
        <div ref={scrollSentinelRef} className="h-1 w-full pointer-events-none" />

        {/* Pagination & Fast Scroll Footer */}
        {filteredCustomers.length > 0 && (
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
              <span>
                প্রদর্শিত হচ্ছে: <strong className="text-slate-900 dark:text-white font-mono">{displayedCustomers.length}</strong> / <span className="font-mono">{filteredCustomers.length}</span> জন গ্রাহক
              </span>
              {visibleCount < filteredCustomers.length && (
                <span className="hidden md:inline-flex items-center gap-1 text-[11px] text-indigo-700 dark:text-indigo-300 font-semibold bg-indigo-50 dark:bg-indigo-950/80 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                  <ArrowDown className="w-3 h-3 animate-bounce" />
                  <span>স্ক্রল করলে অটোমেটিক আরও ৭ জন লোড হবে</span>
                </span>
              )}
            </div>

            {visibleCount < filteredCustomers.length ? (
              <button
                onClick={() => setVisibleCount(prev => Math.min(prev + 7, filteredCustomers.length))}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm hover:scale-105 transition-all flex items-center gap-1.5"
              >
                <span>+ আরও ৭ জন ইউজার দেখুন (+7)</span>
              </button>
            ) : (
              <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                ✓ সকল {filteredCustomers.length} জন গ্রাহক প্রদর্শিত হয়েছে
              </span>
            )}
          </div>
        )}
      </div>

      {/* Customer Profile & Control Modal (Displays Full Profile Picture Prominently) */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm overflow-y-auto">
          <div className="relative bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 my-8 overflow-hidden animate-fadeIn">
            
            {/* Modal Top Profile Picture Header */}
            <div className="p-6 bg-gradient-to-r from-slate-50 via-indigo-50/40 to-slate-50 dark:from-slate-800/90 dark:via-indigo-950/30 dark:to-slate-800/90 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  
                  {/* Prominent High-Resolution Profile Picture */}
                  <div className="relative group shrink-0">
                    <img
                      src={
                        selectedUser.avatar ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUser.name)}&background=4F46E5&color=fff&size=256`
                      }
                      alt={selectedUser.name}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUser.name)}&background=4F46E5&color=fff&size=256`;
                      }}
                      className="w-24 h-24 rounded-2xl object-cover ring-4 ring-indigo-500/30 shadow-xl border-2 border-white dark:border-slate-800"
                    />
                    <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full text-[9px] font-black bg-indigo-600 text-white shadow flex items-center gap-0.5">
                      <ShieldCheck className="w-3 h-3 text-emerald-300" />
                      <span>Firebase</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-black text-slate-900 dark:text-white">
                        {selectedUser.name}
                      </h3>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        selectedUser.status === 'vip'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300'
                          : selectedUser.status === 'suspended'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300'
                      }`}>
                        {selectedUser.status === 'vip' ? '👑 VIP Club' : selectedUser.status === 'suspended' ? '🚫 Suspended' : '✓ Active Customer'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 font-mono flex items-center gap-2 flex-wrap">
                      <span>📞 {selectedUser.phone || 'No phone'}</span>
                      <span>•</span>
                      <span>✉️ {selectedUser.email || 'No email'}</span>
                    </p>

                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      <span className="text-[11px] px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono font-bold">
                        UID: {selectedUser.id}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        📅 Joined: {formatDateSafe(selectedUser.joinedDate)}
                      </span>
                    </div>
                  </div>

                </div>

                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-xl hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6 max-h-[72vh] overflow-y-auto">
              
              {/* Summary Stats Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                  <p className="text-[10px] uppercase font-bold text-slate-500">মোট অর্ডার</p>
                  <p className="text-base font-black text-slate-900 dark:text-white font-mono mt-0.5">{selectedUser.completedOrdersCount}</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                  <p className="text-[10px] uppercase font-bold text-slate-500">মোট খরচ</p>
                  <p className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">৳{selectedUser.totalSpent.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                  <p className="text-[10px] uppercase font-bold text-slate-500">রয়্যাল পয়েন্ট</p>
                  <p className="text-base font-black text-indigo-600 dark:text-indigo-400 font-mono mt-0.5">{selectedUser.rewardPoints}</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                  <p className="text-[10px] uppercase font-bold text-slate-500">VIP ডিসকাউন্ট</p>
                  <p className="text-base font-black text-purple-600 dark:text-purple-400 font-mono mt-0.5">{selectedUser.customDiscountPercentage || 0}%</p>
                </div>
              </div>

              {/* Admin Controls: Account Status & Custom VIP Discount */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-700 pb-2">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    <span>এডমিন কন্ট্রোল (স্ট্যাটাস ও ভিআইপি সেটিং)</span>
                  </h4>
                  <span className="text-[10px] text-slate-400">শুধুমাত্র এডমিন পরিবর্তন করতে পারেন</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      গ্রাহক স্ট্যাটাস নির্ধারণ
                    </label>
                    <select
                      value={modalStatus}
                      onChange={e => setModalStatus(e.target.value as UserStatus)}
                      className="w-full p-2.5 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="active">Active Customer (সাধারণ এক্টিভ)</option>
                      <option value="vip">👑 VIP Customer (এডমিন নির্ধারিত ভিআইপি)</option>
                      <option value="suspended">Suspended / Blocked (স্থগিত)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Custom VIP Discount Override (%)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={modalDiscount}
                        onChange={e => setModalDiscount(Math.min(100, Math.max(0, Number(e.target.value))))}
                        className="w-full p-2.5 text-xs font-mono font-black bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500"
                      />
                      <span className="text-xs font-black text-purple-600 shrink-0">% OFF</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to remove ${selectedUser.name} from customer directory?`)) {
                        deleteCustomer(selectedUser.id);
                        setSelectedUser(null);
                      }
                    }}
                    className="px-3 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Customer</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveCustomerSettings}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow transition-all hover:scale-105 flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Save Account Settings</span>
                  </button>
                </div>
              </div>

              {/* Delivery Address */}
              {selectedUser.defaultAddress && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Default Shipping Address
                  </h4>
                  <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 font-mono">
                    {selectedUser.defaultAddress}
                  </p>
                </div>
              )}

              {/* Order History */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4 text-emerald-500" />
                  <span>Live Order History ({userOrders.length})</span>
                </h4>

                {userOrders.length === 0 ? (
                  <p className="text-xs text-slate-400 italic bg-slate-50 dark:bg-slate-800 p-4 rounded-xl text-center">
                    No order history recorded for this customer account.
                  </p>
                ) : (
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                    {userOrders.map(o => (
                      <div
                        key={o.id}
                        className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200/80 dark:border-slate-700/80">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-slate-900 dark:text-white font-mono">Order #{o.id}</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {new Date(o.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">৳{o.grandTotal.toLocaleString()}</span>
                            <span className={`uppercase text-[10px] font-black px-2 py-0.5 rounded ${
                              o.status === 'delivered' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                              o.status === 'cancelled' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' :
                              'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                            }`}>
                              {o.status}
                            </span>
                          </div>
                        </div>

                        {/* Ordered Product Titles */}
                        <div className="space-y-1.5 pt-0.5">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ordered Products:</p>
                          {o.items.map(item => (
                            <div key={item.id} className="flex items-center gap-2.5 text-xs bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                              <img src={item.image} alt={item.title} className="w-8 h-8 rounded object-cover shrink-0 border border-slate-200 dark:border-slate-700" />
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-slate-800 dark:text-slate-200 text-xs truncate" title={item.title}>
                                  {item.title}
                                </p>
                                <p className="text-[10px] text-slate-500 font-mono">
                                  Qty: {item.quantity} × ৳{item.price.toLocaleString()}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>
      )}

      {/* Customer Auth Test & Simulator Modal */}
      {showAuthTestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <LogIn className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    {authTestTab === 'signup' ? 'টেস্ট সাইন-আপ (নতুন কাস্টমার)' : 'টেস্ট কাস্টমার লগইন'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    ফায়ারবেস অথেন্টিকেশন ও ডিরেক্টরি লাইভ টেস্ট সিমুলেটর
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAuthTestModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Tab Selector */}
              <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setAuthTestTab('signup')}
                  className={`py-2 rounded-lg transition-colors ${
                    authTestTab === 'signup'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  নতুন সাইন-আপ (Sign Up)
                </button>
                <button
                  type="button"
                  onClick={() => setAuthTestTab('login')}
                  className={`py-2 rounded-lg transition-colors ${
                    authTestTab === 'login'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  লগইন টেস্ট (Sign In)
                </button>
              </div>

              {authTestError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
                  {authTestError}
                </div>
              )}

              <form onSubmit={handleAuthTestSubmit} className="space-y-3.5">
                {authTestTab === 'signup' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      গ্রাহকের পূর্ণ নাম *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="যেমন: তানভীর আহমেদ"
                      value={authTestForm.name}
                      onChange={e => setAuthTestForm({ ...authTestForm, name: e.target.value })}
                      className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    মোবাইল নম্বর *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+8801700000000"
                    value={authTestForm.phone}
                    onChange={e => setAuthTestForm({ ...authTestForm, phone: e.target.value })}
                    className="w-full p-2.5 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    ইমেইল এড্রেস {authTestTab === 'signup' ? '(ঐচ্ছিক)' : '*'}
                  </label>
                  <input
                    type="email"
                    required={authTestTab === 'login'}
                    placeholder="customer@gmail.com"
                    value={authTestForm.email}
                    onChange={e => setAuthTestForm({ ...authTestForm, email: e.target.value })}
                    className="w-full p-2.5 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    পাসওয়ার্ড {authTestTab === 'signup' ? '(ঐচ্ছিক)' : '*'}
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={authTestForm.password}
                    onChange={e => setAuthTestForm({ ...authTestForm, password: e.target.value })}
                    className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={authTestLoading}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-1.5"
                  >
                    {authTestLoading ? (
                      <span>প্রসেসিং হচ্ছে...</span>
                    ) : (
                      <>
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>{authTestTab === 'signup' ? 'একাউন্ট তৈরি ও ডিরেক্টরিতে যোগ' : 'লগইন করুন'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
