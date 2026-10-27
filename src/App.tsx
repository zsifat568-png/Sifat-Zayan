import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { ToastContainer } from './components/common/ToastContainer';
import { DashboardModule } from './components/modules/DashboardModule';
import { ProductsModule } from './components/modules/ProductsModule';
import { OrdersModule } from './components/modules/OrdersModule';
import { CustomersModule } from './components/modules/CustomersModule';
import { RegisteredUsersModule } from './components/modules/RegisteredUsersModule';
import { RoyalClubModule } from './components/modules/RoyalClubModule';
import { ReviewsModule } from './components/modules/ReviewsModule';
import { HeroCarouselModule } from './components/modules/HeroCarouselModule';
import { SettingsModule } from './components/modules/SettingsModule';

const MainLayout: React.FC = () => {
  const { activeTab } = useApp();
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans">
      
      {/* Sidebar Navigation */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        
        {/* Top Header */}
        <Header onOpenSidebar={() => setIsSidebarOpen(true)} />

        {/* Dynamic Active Module Container */}
        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {activeTab === 'dashboard' && <DashboardModule />}
          {activeTab === 'products' && <ProductsModule />}
          {activeTab === 'hero_carousel' && <HeroCarouselModule />}
          {activeTab === 'orders' && <OrdersModule />}
          {activeTab === 'customers' && <CustomersModule />}
          {activeTab === 'registered_users' && <RegisteredUsersModule />}
          {activeTab === 'royal_club' && <RoyalClubModule />}
          {activeTab === 'reviews' && <ReviewsModule />}
          {activeTab === 'settings' && <SettingsModule />}
        </main>

        {/* Footer Bar */}
        <footer className="border-t border-slate-200 bg-white p-4 text-center text-xs text-slate-500">
          <p>© {new Date().getFullYear()} <strong>BAZAR (বাজার) ADMIN</strong> • Modern E-Commerce Platform</p>
        </footer>

      </div>

      {/* Global Toast Notifications */}
      <ToastContainer />

    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
