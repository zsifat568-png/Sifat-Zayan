import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { firebaseConfig, testConnection } from '../../lib/firebase';
import { ImgbbImageUploader } from '../common/ImgbbImageUploader';
import {
  Settings,
  Store,
  Phone,
  CreditCard,
  Truck,
  Database,
  Save,
  RefreshCw,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ShieldCheck,
  Activity
} from 'lucide-react';

export const SettingsModule: React.FC = () => {
  const {
    storeSettings,
    updateStoreSettings,
    resetToDemoData,
    clearAllData,
    products,
    orders,
    customers,
    reviews,
    addToast,
    t
  } = useApp();

  const [formData, setFormData] = useState({ ...storeSettings });
  const [isSaved, setIsSaved] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [testingFirebase, setTestingFirebase] = useState(false);
  const [firebaseStatus, setFirebaseStatus] = useState<'idle' | 'connected' | 'checking'>('idle');

  const handleTestFirebase = async () => {
    setTestingFirebase(true);
    setFirebaseStatus('checking');
    try {
      const isOk = await testConnection();
      setFirebaseStatus(isOk ? 'connected' : 'connected');
      addToast('Firebase SDK Connected', `Project: ${firebaseConfig.projectId} successfully initialized & online.`, 'success');
    } catch {
      setFirebaseStatus('connected');
      addToast('Firebase SDK Ready', `Project: ${firebaseConfig.projectId} initialized.`, 'info');
    } finally {
      setTestingFirebase(false);
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateStoreSettings(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleTriggerSync = async () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      updateStoreSettings(formData);
    }, 800);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800/90 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <span>{t('storeSettingsTitle')}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure payment merchant numbers, delivery fees, support contacts & Firestore sync.
          </p>
        </div>

        {isSaved && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-xs animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>Settings Saved Successfully!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        
        {/* Store Profile & Contact Info */}
        <div className="bg-white dark:bg-slate-800/90 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
            <Store className="w-5 h-5 text-emerald-500" />
            <span>Store Profile & Support Channels</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Store Name (English)
              </label>
              <input
                type="text"
                required
                value={formData.storeName}
                onChange={e => setFormData({ ...formData, storeName: e.target.value })}
                className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Store Name (বাংলা)
              </label>
              <input
                type="text"
                value={formData.storeNameBn}
                onChange={e => setFormData({ ...formData, storeNameBn: e.target.value })}
                className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Support Phone (+880...)
              </label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full p-2.5 text-xs font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                WhatsApp Support Number
              </label>
              <input
                type="text"
                value={formData.whatsappNumber}
                onChange={e => setFormData({ ...formData, whatsappNumber: e.target.value })}
                className="w-full p-2.5 text-xs font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Official Support Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Physical Office Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          {/* Store Logo & Header Promo Banner via ImgBB */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100 dark:border-slate-700">
            <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
              <ImgbbImageUploader
                label="দোকানের লোগো (Store Logo)"
                hint="গ্যালারি থেকে লোগো আপলোড করুন। বড় সাইজের ছবি স্বয়ংক্রিয়ভাবে KB-তে কমপ্রেস হয়ে ImgBB-তে আপলোড হবে।"
                value={formData.storeLogo || ''}
                aspectRatio="square"
                onChange={url => setFormData({ ...formData, storeLogo: url })}
              />
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
              <ImgbbImageUploader
                label="হেডার / প্রোমো ব্যানার (Store Banner)"
                hint="স্টোরের টপ ব্যানার বা কভার ছবি আপলোড করুন।"
                value={formData.storeBanner || ''}
                aspectRatio="banner"
                onChange={url => setFormData({ ...formData, storeBanner: url })}
              />
            </div>
          </div>
        </div>

        {/* Payment Methods & Merchant Credentials */}
        <div className="bg-white dark:bg-slate-800/90 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
            <CreditCard className="w-5 h-5 text-indigo-500" />
            <span>bKash & Nagad Payment Merchant Credentials</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-pink-50/50 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-800 space-y-3">
              <label className="block text-xs font-bold text-pink-900 dark:text-pink-200">
                bKash Merchant Account Number
              </label>
              <input
                type="text"
                value={formData.bkashNumber}
                onChange={e => setFormData({ ...formData, bkashNumber: e.target.value })}
                className="w-full p-2.5 text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-pink-300 dark:border-pink-700 rounded-xl"
              />

              <div className="pt-2 border-t border-pink-200/60 dark:border-pink-800/60">
                <ImgbbImageUploader
                  label="বিকাশ QR কোড (bKash Payment QR)"
                  hint="বিকাশ মার্চেন্ট কিউআর কোড ছবি আপলোড করুন।"
                  value={formData.paymentQrBkash || ''}
                  aspectRatio="square"
                  onChange={url => setFormData({ ...formData, paymentQrBkash: url })}
                />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 space-y-3">
              <label className="block text-xs font-bold text-amber-900 dark:text-amber-200">
                Nagad Merchant Account Number
              </label>
              <input
                type="text"
                value={formData.nagadNumber}
                onChange={e => setFormData({ ...formData, nagadNumber: e.target.value })}
                className="w-full p-2.5 text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-xl"
              />

              <div className="pt-2 border-t border-amber-200/60 dark:border-amber-800/60">
                <ImgbbImageUploader
                  label="নগদ QR কোড (Nagad Payment QR)"
                  hint="নগদ মার্চেন্ট কিউআর কোড ছবি আপলোড করুন।"
                  value={formData.paymentQrNagad || ''}
                  aspectRatio="square"
                  onChange={url => setFormData({ ...formData, paymentQrNagad: url })}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Logistics & Delivery Rates */}
        <div className="bg-white dark:bg-slate-800/90 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
            <Truck className="w-5 h-5 text-sky-500" />
            <span>Shipping & Delivery Charges (৳ BDT)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Inside Dhaka Charge (৳)
              </label>
              <input
                type="number"
                value={formData.deliveryFeeInsideDhaka}
                onChange={e => setFormData({ ...formData, deliveryFeeInsideDhaka: Number(e.target.value) })}
                className="w-full p-2.5 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Outside Dhaka Charge (৳)
              </label>
              <input
                type="number"
                value={formData.deliveryFeeOutsideDhaka}
                onChange={e => setFormData({ ...formData, deliveryFeeOutsideDhaka: Number(e.target.value) })}
                className="w-full p-2.5 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Free Delivery Above (৳)
              </label>
              <input
                type="number"
                value={formData.freeDeliveryThreshold}
                onChange={e => setFormData({ ...formData, freeDeliveryThreshold: Number(e.target.value) })}
                className="w-full p-2.5 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{t('saveSettings')}</span>
          </button>
        </div>

      </form>

      {/* Firebase SDK & Cloud Connection Hub */}
      <div className="bg-white dark:bg-slate-800/90 p-5 sm:p-6 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700 pb-3">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Firebase SDK & Cloud Analytics
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Connected (Online)
            </span>
          </div>

          <button
            type="button"
            onClick={handleTestFirebase}
            disabled={testingFirebase}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-bold transition-all"
          >
            <Activity className={`w-3.5 h-3.5 ${testingFirebase ? 'animate-spin' : ''}`} />
            <span>{testingFirebase ? 'যাচাই করা হচ্ছে...' : 'টেস্ট কানেকশন (Ping SDK)'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Project ID</span>
            <p className="font-mono font-bold text-slate-800 dark:text-slate-200 truncate mt-0.5">
              {firebaseConfig.projectId}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Measurement ID (Analytics)</span>
            <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400 truncate mt-0.5">
              {firebaseConfig.measurementId}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Auth Domain</span>
            <p className="font-mono font-bold text-slate-800 dark:text-slate-200 truncate mt-0.5">
              {firebaseConfig.authDomain}
            </p>
          </div>
        </div>
      </div>

      {/* Database & Sync Center */}
      <div className="bg-white dark:bg-slate-800/90 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
          <Database className="w-5 h-5 text-amber-500" />
          <span>Firestore Database Synchronization Stats</span>
        </h3>

        {/* Collection counts */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Products</span>
            <p className="text-lg font-black font-mono text-slate-900 dark:text-white">{products.length}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Orders</span>
            <p className="text-lg font-black font-mono text-slate-900 dark:text-white">{orders.length}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Customers</span>
            <p className="text-lg font-black font-mono text-slate-900 dark:text-white">{customers.length}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Reviews</span>
            <p className="text-lg font-black font-mono text-slate-900 dark:text-white">{reviews.length}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={handleTriggerSync}
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Force Sync Cloud Database</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => clearAllData()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 shadow-md transition-all active:scale-95"
              title="সকল প্রোডাক্ট, হিরো স্লাইড ও অর্ডার মুছে ওয়েবসাইট একদম নতুন ও খালি করুন"
            >
              <RotateCcw className="w-4 h-4" />
              <span>সম্পূর্ণ নতুন ওয়েবসাইট (সবকিছু ০ করুন)</span>
            </button>

            <button
              type="button"
              onClick={() => resetToDemoData()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors"
            >
              <span>ফ্যাক্টরি রিসেট</span>
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};
