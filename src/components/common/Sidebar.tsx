import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  UserCheck,
  Crown,
  MessageSquareQuote,
  Sliders,
  Store,
  GalleryHorizontalEnd,
  X
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  isMobileOpen,
  onMobileClose
}) => {
  const { activeTab, setActiveTab, orders, products, customers, registeredUsers, heroBanners, royalClub, storeSettings, t } = useApp();

  const openState = isMobileOpen ?? isOpen ?? false;
  const closeFunc = onMobileClose ?? onClose ?? (() => {});

  const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;
  const lowStockCount = products.filter(p => p.stock <= p.lowStockLimit).length;
  const activeBannersCount = (heroBanners || []).filter(b => b.isActive).length;
  const totalCustomersCount = React.useMemo(() => {
    const keys = new Set<string>();
    (registeredUsers || []).forEach(u => {
      if (u.uid) keys.add(u.uid);
    });
    return keys.size;
  }, [registeredUsers]);

  const navItems = [
    {
      id: 'dashboard',
      label: t('dashboard'),
      icon: LayoutDashboard
    },
    {
      id: 'products',
      label: t('products'),
      icon: Package,
      badge: lowStockCount > 0 ? `${lowStockCount} low` : null,
      badgeColor: 'bg-rose-500'
    },
    {
      id: 'hero_carousel',
      label: t('heroCarousel'),
      icon: GalleryHorizontalEnd,
      badge: activeBannersCount > 0 ? `${activeBannersCount} Live` : null,
      badgeColor: 'bg-emerald-600'
    },
    {
      id: 'orders',
      label: t('orders'),
      icon: ShoppingBag,
      badge: pendingOrdersCount > 0 ? `${pendingOrdersCount}` : null,
      badgeColor: 'bg-amber-500'
    },
    {
      id: 'customers',
      label: t('customers'),
      icon: Users,
      badge: totalCustomersCount > 0 ? `${totalCustomersCount}` : '0',
      badgeColor: 'bg-emerald-600'
    },
    {
      id: 'registered_users',
      label: t('registeredUsers'),
      icon: UserCheck,
      badge: `${registeredUsers.length}`,
      badgeColor: 'bg-indigo-600'
    },
    {
      id: 'royal_club',
      label: t('royalClub'),
      icon: Crown,
      badge: royalClub.campaignActive ? 'LIVE' : null,
      badgeColor: 'bg-emerald-500'
    },
    {
      id: 'reviews',
      label: t('reviews'),
      icon: MessageSquareQuote
    },
    {
      id: 'settings',
      label: t('settings'),
      icon: Sliders
    }
  ];

  const handleSelectTab = (tabId: string) => {
    setActiveTab(tabId);
    closeFunc();
  };

  return (
    <>
      {/* Mobile overlay backdrop */}
      {openState && (
        <div
          onClick={closeFunc}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed top-0 left-0 z-50 lg:z-20 h-full w-64 bg-white text-slate-800 flex flex-col border-r border-slate-200 shadow-sm transition-transform duration-300 ease-in-out ${
          openState ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {storeSettings?.storeLogo ? (
              <img
                src={storeSettings.storeLogo}
                alt="Store Logo"
                className="w-8 h-8 rounded-lg object-cover shadow-sm border border-emerald-500/20"
                onError={e => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center shadow-sm">
                <Store className="w-4 h-4 text-white" />
              </div>
            )}
            <span className="text-xl font-bold tracking-tight text-slate-900 truncate">
              {storeSettings?.storeName || 'BAZAR'} <span className="text-emerald-600">ADMIN</span>
            </span>
          </div>

          <button
            onClick={closeFunc}
            className="lg:hidden text-slate-400 hover:text-slate-700 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Menu Links */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 font-bold'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-5 h-5 ${
                      isActive ? 'text-emerald-600' : 'text-slate-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Store Campaign Footer Card */}
        <div className="p-4 border-t border-slate-100">
          <div className="bg-slate-900 rounded-xl p-4 text-white">
            <p className="text-xs text-slate-400 mb-1 uppercase tracking-wider font-semibold">
              Royal Club Active
            </p>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-amber-400" />
                Campaign Mode
              </span>
              <div
                onClick={() => handleSelectTab('royal_club')}
                className={`w-10 h-5 rounded-full flex items-center px-1 cursor-pointer transition-colors ${
                  royalClub.campaignActive ? 'bg-emerald-500 justify-end' : 'bg-slate-700 justify-start'
                }`}
              >
                <div className="w-3 h-3 bg-white rounded-full shadow-sm" />
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="py-3 px-4 text-[11px] text-slate-400 text-center font-mono border-t border-slate-50">
          Bazar Admin v2.5
        </div>
      </aside>
    </>
  );
};
