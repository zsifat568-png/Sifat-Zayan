import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { HeroBanner, WheelSlice } from '../../types';
import {
  Crown,
  Play,
  Settings,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  PhoneCall,
  Layout,
  X,
  RefreshCw
} from 'lucide-react';

export const RoyalClubModule: React.FC = () => {
  const {
    royalClub,
    toggleCampaignActive,
    updateRoyalClubSettings,
    heroBanners,
    addHeroBanner,
    updateHeroBanner,
    deleteHeroBanner,
    addUserOverride,
    removeUserOverride,
    t
  } = useApp();

  // Test Wheel Simulator State
  const [simulatedResult, setSimulatedResult] = useState<WheelSlice | null>(null);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);

  // Phone Override Form State
  const [overridePhone, setOverridePhone] = useState<string>('');
  const [overrideSliceId, setOverrideSliceId] = useState<string>('s2');
  const [overrideNote, setOverrideNote] = useState<string>('VIP guaranteed reward');

  // Hero Banner Form State
  const [isBannerModalOpen, setIsBannerModalOpen] = useState<boolean>(false);
  const [editingBanner, setEditingBanner] = useState<HeroBanner | null>(null);
  const [bannerFormData, setBannerFormData] = useState({
    imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1600&auto=format&fit=crop&q=80',
    tagline: 'Eid Festive Sale',
    taglineBn: 'ঈদ অফার',
    title: 'Up to 50% Off Exclusive Panjabi & Saree',
    titleBn: 'পাঞ্জাবি ও শাড়িতে ৫০% পর্যন্ত ছাড়',
    subtitle: 'Free delivery on orders over ৳2000.',
    subtitleBn: 'ফ্রি হোম ডেলিভারি।',
    targetCategoryOrUrl: 'Men\'s Fashion',
    buttonLabel: 'Shop Now',
    isActive: true,
    order: 1
  });

  // Simulate Wheel Spin Engine
  const handleSimulateSpin = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setSimulatedResult(null);

    setTimeout(() => {
      // Weighted random calculation
      const totalWeight = royalClub.slices.reduce((acc, s) => acc + s.probabilityWeight, 0);
      let randomNum = Math.random() * totalWeight;

      let selected = royalClub.slices[0];
      for (const slice of royalClub.slices) {
        if (randomNum < slice.probabilityWeight) {
          selected = slice;
          break;
        }
        randomNum -= slice.probabilityWeight;
      }

      setSimulatedResult(selected);
      setIsSpinning(false);
    }, 1200);
  };

  // Add/Edit Hero Banner Form Handler
  const handleSaveBanner = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBanner) {
      updateHeroBanner(editingBanner.id, bannerFormData);
    } else {
      addHeroBanner(bannerFormData);
    }
    setIsBannerModalOpen(false);
  };

  const handleOpenAddBanner = () => {
    setEditingBanner(null);
    setBannerFormData({
      imageUrl: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=1600&auto=format&fit=crop&q=80',
      tagline: 'New Season Arrival',
      taglineBn: 'নতুন কালেকশন',
      title: 'Smart Gadgets & TWS Earbuds',
      titleBn: 'ট্রেন্দি স্মার্টওয়াচ ও ইয়ারবাডস',
      subtitle: 'Official warranty with bKash cashback.',
      subtitleBn: 'বিকাশ ক্যাশব্যাক সহ।',
      targetCategoryOrUrl: 'Electronics & Gadgets',
      buttonLabel: 'Explore Tech',
      isActive: true,
      order: heroBanners.length + 1
    });
    setIsBannerModalOpen(true);
  };

  const handleOpenEditBanner = (b: HeroBanner) => {
    setEditingBanner(b);
    setBannerFormData({
      imageUrl: b.imageUrl,
      tagline: b.tagline,
      taglineBn: b.taglineBn || '',
      title: b.title,
      titleBn: b.titleBn || '',
      subtitle: b.subtitle,
      subtitleBn: b.subtitleBn || '',
      targetCategoryOrUrl: b.targetCategoryOrUrl,
      buttonLabel: b.buttonLabel,
      isActive: b.isActive,
      order: b.order
    });
    setIsBannerModalOpen(true);
  };

  return (
    <div className="space-y-6">
      
      {/* Master Campaign Toggle Banner */}
      <div className="bg-gradient-to-r from-amber-900 via-slate-900 to-yellow-950 text-white p-6 rounded-2xl border border-amber-700/50 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20 shrink-0">
            <Crown className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black tracking-tight text-amber-200">
                {royalClub.offerName}
              </h2>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                  royalClub.campaignActive ? 'bg-emerald-500 text-slate-950 animate-pulse' : 'bg-slate-700 text-slate-300'
                }`}
              >
                {royalClub.campaignActive ? 'ACTIVE LIVE' : 'PAUSED'}
              </span>
            </div>
            <p className="text-xs text-amber-100/80 mt-1">
              {royalClub.campaignActive ? t('campaignActiveMsg') : t('campaignInactiveMsg')}
            </p>
          </div>
        </div>

        <button
          onClick={() => toggleCampaignActive(!royalClub.campaignActive)}
          className={`px-5 py-2.5 rounded-xl font-extrabold text-xs transition-all shadow-md active:scale-95 shrink-0 ${
            royalClub.campaignActive
              ? 'bg-rose-600 hover:bg-rose-700 text-white'
              : 'bg-amber-400 hover:bg-amber-500 text-slate-950'
          }`}
        >
          {royalClub.campaignActive ? 'Deactivate Campaign' : '⚡ Activate Campaign Now'}
        </button>
      </div>

      {/* Grid: Spin Wheel Configuration & Live Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Spin Wheel Rewards Engine Settings */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800/90 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-amber-500" />
                <span>{t('wheelRewardsEngine')}</span>
              </h3>
              <p className="text-xs text-slate-500">
                Set available discount percentages, probability weights & spin cooldowns.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Cooldown Duration (Hours)
              </label>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <input
                  type="number"
                  value={royalClub.cooldownHours}
                  onChange={e => updateRoyalClubSettings({ cooldownHours: Number(e.target.value) })}
                  className="w-full p-2.5 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Minimum Purchase Required (৳ BDT)
              </label>
              <input
                type="number"
                value={royalClub.minPurchaseAmount}
                onChange={e => updateRoyalClubSettings({ minPurchaseAmount: Number(e.target.value) })}
                className="w-full p-2.5 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          {/* Slices & Probability Weights Table */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              Wheel Slices & Outcome Probabilities (Weights)
            </h4>
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-700/50 text-slate-500 font-bold uppercase">
                  <tr>
                    <th className="p-2.5">Slice Label</th>
                    <th className="p-2.5">Discount %</th>
                    <th className="p-2.5">Weight (%)</th>
                    <th className="p-2.5">Color Badge</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {royalClub.slices.map(slice => (
                    <tr key={slice.id}>
                      <td className="p-2.5 font-bold font-mono text-slate-900 dark:text-white">
                        {slice.label}
                      </td>
                      <td className="p-2.5 font-mono">{slice.discountPercentage}% OFF</td>
                      <td className="p-2.5 font-mono font-bold text-amber-600 dark:text-amber-400">
                        {slice.probabilityWeight}%
                      </td>
                      <td className="p-2.5">
                        <span
                          className="w-4 h-4 rounded-full inline-block border border-slate-300"
                          style={{ backgroundColor: slice.color }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Live Wheel Spin Simulator Box */}
        <div className="bg-white dark:bg-slate-800/90 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span>{t('testSimulator')}</span>
              </h3>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Test probability weights in real-time before releasing to customer app.
            </p>

            {/* Visual Spin Target Box */}
            <div className="relative p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-amber-950 text-center border border-amber-800/40 shadow-inner flex flex-col items-center justify-center min-h-[160px]">
              {isSpinning ? (
                <div className="flex flex-col items-center gap-2 animate-spin text-amber-400">
                  <RefreshCw className="w-8 h-8" />
                  <span className="text-xs font-mono font-bold">Spinning Engine...</span>
                </div>
              ) : simulatedResult ? (
                <div className="animate-in zoom-in-95 duration-300">
                  <span className="text-[10px] font-bold text-amber-300 uppercase tracking-widest">
                    Simulated Result:
                  </span>
                  <h4 className="text-3xl font-black text-white font-mono mt-1" style={{ color: simulatedResult.color }}>
                    {simulatedResult.label}
                  </h4>
                  <p className="text-xs text-slate-300 mt-1">
                    {simulatedResult.isBigWin ? '🎉 BIG WIN Mega Cashback!' : 'Standard Discount Reward'}
                  </p>
                </div>
              ) : (
                <div className="text-slate-400 text-xs">
                  Click "Simulate Spin Now" to test probability algorithm.
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleSimulateSpin}
            disabled={isSpinning}
            className="mt-6 w-full py-3 px-4 rounded-xl font-black text-xs bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-slate-950 shadow-md shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>{t('spinTestBtn')}</span>
          </button>
        </div>

      </div>

      {/* User Overrides & Exclusions */}
      <div className="bg-white dark:bg-slate-800/90 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <PhoneCall className="w-5 h-5 text-indigo-500" />
          <span>{t('userOverridesTitle')}</span>
        </h3>
        <p className="text-xs text-slate-500">
          Configure guaranteed reward slice or restrictions for specific phone numbers (+880...).
        </p>

        {/* Add Override Inline Form */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
          <input
            type="text"
            value={overridePhone}
            onChange={e => setOverridePhone(e.target.value)}
            placeholder="Phone e.g. +8801712345678"
            className="p-2 text-xs font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
          />

          <select
            value={overrideSliceId}
            onChange={e => setOverrideSliceId(e.target.value)}
            className="p-2 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
          >
            {royalClub.slices.map(s => (
              <option key={s.id} value={s.id}>
                Guaranteed: {s.label}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={overrideNote}
            onChange={e => setOverrideNote(e.target.value)}
            placeholder="Note e.g. VIP Member"
            className="p-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
          />

          <button
            onClick={() => {
              if (overridePhone) {
                addUserOverride(overridePhone, overrideSliceId, overrideNote);
                setOverridePhone('');
              }
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
          >
            {t('addOverride')}
          </button>
        </div>

        {/* Active Overrides Table */}
        <div className="divide-y divide-slate-100 dark:divide-slate-700/60 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
          {royalClub.userOverrides.length === 0 ? (
            <p className="p-4 text-xs text-slate-400 italic">No phone overrides configured.</p>
          ) : (
            royalClub.userOverrides.map(ov => (
              <div key={ov.phone} className="p-3 flex items-center justify-between text-xs bg-white dark:bg-slate-900">
                <span className="font-bold font-mono text-slate-900 dark:text-white">{ov.phone}</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                  Guaranteed Slice ID: {ov.guaranteedSliceId}
                </span>
                <span className="text-slate-500">{ov.note}</span>
                <button
                  onClick={() => removeUserOverride(ov.phone)}
                  className="p-1 text-rose-500 hover:text-rose-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Hero Carousel Banner Manager */}
      <div className="bg-white dark:bg-slate-800/90 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layout className="w-5 h-5 text-emerald-500" />
              <span>{t('heroCarouselManager')}</span>
            </h3>
            <p className="text-xs text-slate-500">
              Manage front page slides, image URLs, main headings & CTA click targets.
            </p>
          </div>

          <button
            onClick={handleOpenAddBanner}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>{t('addBanner')}</span>
          </button>
        </div>

        {/* Banners Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {heroBanners.map(banner => (
            <div
              key={banner.id}
              className="relative group rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-50 dark:bg-slate-900"
            >
              <img
                src={banner.imageUrl}
                alt={banner.title}
                className="w-full h-36 object-cover"
              />
              <div className="p-4 space-y-1">
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  {banner.tagline}
                </span>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  {banner.title}
                </h4>
                <p className="text-xs text-slate-500">{banner.subtitle}</p>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] font-mono text-indigo-600">
                    Target: {banner.targetCategoryOrUrl}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEditBanner(banner)}
                      className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-300"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteHeroBanner(banner.id)}
                      className="p-1.5 rounded-lg bg-rose-100 text-rose-700 hover:bg-rose-200"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Hero Banner Add/Edit Modal */}
      {isBannerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
          <div className="relative bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 my-8 overflow-hidden">
            
            <div className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-base font-bold">
                {editingBanner ? 'Edit Hero Banner' : t('addBanner')}
              </h3>
              <button onClick={() => setIsBannerModalOpen(false)} className="text-slate-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBanner} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold mb-1">Slide Image URL *</label>
                <input
                  type="url"
                  required
                  value={bannerFormData.imageUrl}
                  onChange={e => setBannerFormData({ ...bannerFormData, imageUrl: e.target.value })}
                  className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">Main Heading *</label>
                <input
                  type="text"
                  required
                  value={bannerFormData.title}
                  onChange={e => setBannerFormData({ ...bannerFormData, title: e.target.value })}
                  className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">Subtitle / Offer</label>
                <input
                  type="text"
                  value={bannerFormData.subtitle}
                  onChange={e => setBannerFormData({ ...bannerFormData, subtitle: e.target.value })}
                  className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1">Tagline Badge</label>
                  <input
                    type="text"
                    value={bannerFormData.tagline}
                    onChange={e => setBannerFormData({ ...bannerFormData, tagline: e.target.value })}
                    className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">CTA Button Text</label>
                  <input
                    type="text"
                    value={bannerFormData.buttonLabel}
                    onChange={e => setBannerFormData({ ...bannerFormData, buttonLabel: e.target.value })}
                    className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">Target Category / URL</label>
                <input
                  type="text"
                  value={bannerFormData.targetCategoryOrUrl}
                  onChange={e => setBannerFormData({ ...bannerFormData, targetCategoryOrUrl: e.target.value })}
                  className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsBannerModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white"
                >
                  {t('save')}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
