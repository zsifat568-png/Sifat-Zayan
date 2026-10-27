import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Search,
  Globe,
  Sun,
  Moon,
  PlusCircle,
  Menu,
  ShieldCheck,
  X,
  BellRing,
  GalleryHorizontalEnd,
  Sliders,
  Store,
  Sparkles,
  Users,
  ExternalLink
} from 'lucide-react';
import { MainBazarDemoModal } from './MainBazarDemoModal';

interface HeaderProps {
  onOpenSidebar?: () => void;
  onMobileMenuToggle?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSidebar, onMobileMenuToggle }) => {
  const {
    language,
    setLanguage,
    searchQuery,
    setSearchQuery,
    addNewSimulatedOrder,
    orders,
    products,
    customers,
    registeredUsers,
    heroBanners,
    activeTab,
    setActiveTab,
    clearAllData,
    t
  } = useApp();

  const handleToggleMenu = onOpenSidebar ?? onMobileMenuToggle ?? (() => {});
  const [showNotifications, setShowNotifications] = useState(false);
  const [isDemoOpen, setIsDemoOpen] = useState(false);

  const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;
  const lowStockCount = products.filter(p => p.stock <= p.lowStockLimit).length;
  const activeBannersCount = (heroBanners || []).filter(b => b.isActive).length;

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between flex-shrink-0 sticky top-0 z-30">
      
      {/* Mobile toggle & Search Input */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={handleToggleMenu}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Search Input Bar */}
        <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-full border border-slate-200 w-full max-w-md focus-within:border-emerald-500 focus-within:bg-white transition-all">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search products, orders or users..."
            className="bg-transparent text-sm w-full outline-none text-slate-800 placeholder-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Header Right Control Tools */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">

        {/* Customer Directory Shortcut Button */}
        <button
          onClick={() => setActiveTab('customers')}
          className={`relative px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all border text-xs font-bold ${
            activeTab === 'customers'
              ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
              : 'bg-indigo-50/70 hover:bg-indigo-100/80 border-indigo-200 text-indigo-800'
          }`}
          title="কাস্টমার ডিরেক্টরি (Customer Directory)"
        >
          <Users className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span className="hidden sm:inline">Customer Directory</span>
          <span className="sm:hidden">গ্রাহক</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
              activeTab === 'customers'
                ? 'bg-white text-indigo-900'
                : 'bg-indigo-600 text-white'
            }`}
          >
            {Math.max(customers.length, registeredUsers.length)}
          </span>
        </button>

        {/* Hero Carousel Icon Shortcut & Customizer */}
        <button
          onClick={() => setActiveTab('hero_carousel')}
          className={`relative px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all border ${
            activeTab === 'hero_carousel'
              ? 'bg-emerald-600 border-emerald-600 text-white shadow-md'
              : 'bg-slate-50 hover:bg-emerald-50/60 border-slate-200 dark:border-slate-700 text-slate-700 hover:text-emerald-700'
          }`}
          title="হিরো কার্সোল কাস্টমাইজ করুন (Hero Carousel)"
        >
          <GalleryHorizontalEnd className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span className="hidden md:inline text-xs font-bold">হিরো কার্সোল</span>
          {activeBannersCount > 0 && (
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                activeTab === 'hero_carousel'
                  ? 'bg-white text-emerald-800'
                  : 'bg-emerald-600 text-white'
              }`}
            >
              {activeBannersCount}
            </span>
          )}
        </button>

        {/* Main Website Domain Link & Live Action */}
        <div className="flex items-center bg-slate-900 border border-slate-700 rounded-xl p-0.5 shadow-sm">
          <a
            href="https://bazarcomm.netlify.app"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white hover:text-emerald-300 transition-colors group"
            title="মেইন ওয়েবসাইট ওপেন করুন: https://bazarcomm.netlify.app"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-400 group-hover:rotate-45 transition-transform" />
            <span className="hidden sm:inline">bazarcomm.netlify.app</span>
            <span className="sm:hidden">ওয়েবসাইট</span>
            <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-emerald-400" />
          </a>
          
          <button
            onClick={() => setIsDemoOpen(true)}
            className="px-2 py-1 text-[11px] font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors border-l border-slate-700"
            title="ইন-অ্যাপ ডেমো প্রিভিউ খুলুন"
          >
            লাইভ প্রিভিউ
          </button>
        </div>
        
        {/* Language Pill Switcher */}
        <div className="flex bg-slate-100 rounded-lg p-1 text-xs font-semibold">
          <button
            onClick={() => setLanguage('en')}
            className={`px-3 py-1 rounded-md transition-all ${
              language === 'en'
                ? 'bg-white text-slate-900 shadow-sm font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            EN
          </button>
          <button
            onClick={() => setLanguage('bn')}
            className={`px-3 py-1 rounded-md transition-all ${
              language === 'bn'
                ? 'bg-white text-slate-900 shadow-sm font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            বাংলা
          </button>
        </div>

        {/* Notifications Icon */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
          >
            {(pendingOrdersCount > 0 || lowStockCount > 0) && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
                {pendingOrdersCount + lowStockCount}
              </div>
            )}
            <BellRing className="w-5 h-5" />
          </button>

          {/* Notifications Popover */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">
                  {t('notifications')}
                </h3>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto mt-2">
                {pendingOrdersCount > 0 ? (
                  <div className="py-2.5 flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-slate-800">
                        {pendingOrdersCount} Pending Orders
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Verify bKash & Nagad TxIDs in Orders module.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="py-2 text-xs text-slate-500">
                    No pending orders.
                  </div>
                )}

                {lowStockCount > 0 && (
                  <div className="py-2.5 flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-slate-800">
                        {lowStockCount} Products Low on Stock
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Update inventory levels in Products.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-100 border-2 border-emerald-500 flex items-center justify-center text-emerald-800 font-bold text-xs shadow-sm">
            BZ
          </div>
        </div>

      </div>

      {/* Main Website Storefront Interactive Demo Modal */}
      <MainBazarDemoModal
        isOpen={isDemoOpen}
        onClose={() => setIsDemoOpen(false)}
        onOpenCustomizer={() => setActiveTab('hero_carousel')}
      />
    </header>
  );
};
