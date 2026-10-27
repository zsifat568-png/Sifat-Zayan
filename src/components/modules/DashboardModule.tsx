import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';
import {
  TrendingUp,
  ShoppingBag,
  Users,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  Plus,
  Eye,
  Crown,
  Download,
  CreditCard,
  CheckCircle2,
  Lock,
  DollarSign,
  Coins,
  BarChart3
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';

export const DashboardModule: React.FC = () => {
  const {
    products,
    orders,
    customers,
    registeredUsers,
    royalClub,
    setActiveTab,
    addNewSimulatedOrder,
    exportDataBackup,
    t
  } = useApp();

  // Product Map for profit calculations
  const productMap = useMemo(() => {
    const map = new Map<string, Product>();
    products.forEach(p => map.set(p.id, p));
    return map;
  }, [products]);

  // Total Sales / Revenue
  const totalSales = orders
    .filter(o => o.status !== 'cancelled')
    .reduce((acc, curr) => acc + curr.grandTotal, 0);

  // Accurate unique customers count (Firebase registered users)
  const totalUniqueCustomersCount = useMemo(() => {
    const keys = new Set<string>();
    (registeredUsers || []).forEach(u => {
      if (u.uid) keys.add(u.uid);
    });
    return keys.size;
  }, [registeredUsers]);

  // Total Net Profit & Wholesale Cost Calculations across orders
  const { totalProfit, totalWholesaleCost } = useMemo(() => {
    let profit = 0;
    let cost = 0;

    orders
      .filter(o => o.status !== 'cancelled')
      .forEach(order => {
        order.items.forEach(item => {
          const matchedProd = productMap.get(item.productId);
          const wholesalePrice =
            item.wholesalePrice ??
            matchedProd?.wholesalePrice ??
            Math.round(item.price * 0.7);
          const itemCost = wholesalePrice * item.quantity;
          const itemRevenue = item.price * item.quantity;
          const itemProfit = itemRevenue - itemCost;

          cost += itemCost;
          profit += itemProfit;
        });
      });

    return { totalProfit: profit, totalWholesaleCost: cost };
  }, [orders, productMap]);

  const profitMarginPercentage = totalSales > 0 ? ((totalProfit / totalSales) * 100).toFixed(1) : '0';

  // Bottom Profit & Revenue Chart Data (Per Product breakdown)
  const productProfitChartData = useMemo(() => {
    return products.slice(0, 8).map(p => {
      const sellingPrice = p.price;
      const wholesaleCost = p.wholesalePrice || Math.round(p.price * 0.7);
      const netProfit = sellingPrice - wholesaleCost;
      const marginPct = sellingPrice > 0 ? Math.round((netProfit / sellingPrice) * 100) : 0;

      return {
        id: p.id,
        shortName: p.title.length > 18 ? p.title.substring(0, 16) + '...' : p.title,
        fullTitle: p.title,
        productPrice: sellingPrice, // Selling Price (বিক্রি দাম)
        wholesaleCost: wholesaleCost, // Wholesale Cost (পাইকারি দাম)
        netProfit: netProfit, // Unit Profit (নিট লাভ)
        marginPct: marginPct,
        category: p.category
      };
    });
  }, [products]);

  const totalOrdersCount = orders.length;
  const activeCustomersCount = customers.filter(c => c.status !== 'suspended').length;
  const pendingDeliveriesCount = orders.filter(o => o.status === 'pending' || o.status === 'processing').length;
  const lowStockCount = products.filter(p => p.stock <= p.lowStockLimit).length;

  // Chart Data Preparation: Daily Sales Trend
  const salesTrendData = [
    { day: 'Jul 24', sales: 18200, orders: 8 },
    { day: 'Jul 25', sales: 24500, orders: 12 },
    { day: 'Jul 26', sales: 19800, orders: 9 },
    { day: 'Jul 27', sales: 32100, orders: 15 },
    { day: 'Jul 28', sales: 28400, orders: 11 },
    { day: 'Jul 29', sales: 41200, orders: 18 },
    { day: 'Jul 30', sales: totalSales > 50000 ? totalSales / 2 : 36800, orders: totalOrdersCount }
  ];

  // Category Distribution Data
  const categoryMap: Record<string, number> = {};
  products.forEach(p => {
    categoryMap[p.category] = (categoryMap[p.category] || 0) + p.stock;
  });

  const categoryData = Object.entries(categoryMap).map(([name, count]) => ({
    name,
    count
  }));

  // Payment Method Breakdown
  const paymentMethodCounts = {
    bKash: orders.filter(o => o.paymentMethod === 'bkash').length,
    Nagad: orders.filter(o => o.paymentMethod === 'nagad').length,
    COD: orders.filter(o => o.paymentMethod === 'cod').length
  };

  const paymentChartData = [
    { name: 'bKash', value: paymentMethodCounts.bKash || 1, color: '#EC4899' },
    { name: 'Nagad', value: paymentMethodCounts.Nagad || 1, color: '#F97316' },
    { name: 'Cash on Delivery', value: paymentMethodCounts.COD || 1, color: '#10B981' }
  ];

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Quick Shortcuts */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900 via-slate-900 to-teal-900 text-white p-6 rounded-2xl shadow-lg border border-emerald-800/40">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-400">
            Real-time Merchant Overview
          </span>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight mt-0.5">
            Bazar Store Analytics & Live Hub
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Controlling customer web application in real-time with BDT (৳) currency metrics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setActiveTab('products')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold backdrop-blur-md transition-all border border-white/10"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>{t('quickAddProduct')}</span>
          </button>

          <button
            onClick={addNewSimulatedOrder}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-black transition-all shadow-md shadow-emerald-500/20"
          >
            <ShoppingBag className="w-4 h-4 text-slate-950" />
            <span>+ Test Order</span>
          </button>

          <button
            onClick={exportDataBackup}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            title={t('exportBackup')}
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Live Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        
        {/* Total Revenue */}
        <div className="bg-white dark:bg-slate-800/90 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/80">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest">
              {t('totalSales')}
            </p>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
            ৳ {totalSales.toLocaleString()}
          </h3>
        </div>

        {/* Total Net Profit */}
        <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 text-white p-5 rounded-2xl shadow-md border border-emerald-700/50">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-emerald-300 uppercase tracking-widest flex items-center gap-1">
              <Lock className="w-3 h-3 text-emerald-400" />
              <span>{t('totalProfit')}</span>
            </p>
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-emerald-300 font-mono">
            ৳ {totalProfit.toLocaleString()}
          </h3>
          <p className="text-[11px] text-emerald-400 mt-2 font-bold font-mono">
            🔥 {profitMarginPercentage}% {t('profitMargin')}
          </p>
        </div>

        {/* Wholesale Cost */}
        <div className="bg-white dark:bg-slate-800/90 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/80">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest flex items-center gap-1">
              <Lock className="w-3 h-3 text-amber-500" />
              <span>{t('totalWholesaleCost')}</span>
            </p>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
            ৳ {totalWholesaleCost.toLocaleString()}
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-medium">
            Cost of Goods Sold (COGS)
          </p>
        </div>

        {/* Total Orders */}
        <div className="bg-white dark:bg-slate-800/90 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/80">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest">
              {t('totalOrders')}
            </p>
            <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
            {totalOrdersCount} Units
          </h3>
          <p className="text-[11px] text-sky-600 dark:text-sky-400 mt-2 font-medium">
            Active order pipeline
          </p>
        </div>

        {/* Customer Directory Metric Card */}
        <div
          onClick={() => setActiveTab('customers')}
          className="bg-white dark:bg-slate-800/90 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/80 cursor-pointer hover:border-indigo-500 hover:shadow-md transition-all group"
          title="কাস্টমার ডিরেক্টরি খুলুন"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest group-hover:text-indigo-600 transition-colors">
              Customer Directory
            </p>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
            {totalUniqueCustomersCount} Users
          </h3>
          <p className="text-[11px] text-indigo-600 dark:text-indigo-400 mt-2 font-bold flex items-center gap-1">
            <span>ডিরেক্টরি দেখুন</span>
            <span>→</span>
          </p>
        </div>

        {/* Low Stock */}
        <div className="bg-white dark:bg-slate-800/90 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/80">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest">
              {t('lowStockAlerts')}
            </p>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
            {lowStockCount} Items
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-medium">
            Immediate refill required
          </p>
        </div>

      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Daily Sales Trend Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800/90 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {t('salesTrend')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Weekly revenue in BDT (৳) across customer purchases
              </p>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
              ৳ BDT
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                <XAxis dataKey="day" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} tickFormatter={val => `৳${val / 1000}k`} />
                <Tooltip
                  formatter={(val: number) => [`৳${val.toLocaleString()}`, 'Sales']}
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                />
                <Area type="monotone" dataKey="sales" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Methods Breakdown */}
        <div className="bg-white dark:bg-slate-800/90 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {t('paymentMethods')}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  bKash, Nagad & Cash on Delivery share
                </p>
              </div>
              <CreditCard className="w-5 h-5 text-indigo-500" />
            </div>

            <div className="h-56 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {paymentChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#334155',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/80 grid grid-cols-3 text-center">
            <div>
              <p className="text-[10px] font-bold text-pink-600 dark:text-pink-400 uppercase">bKash</p>
              <p className="text-sm font-black text-slate-900 dark:text-white font-mono">{paymentMethodCounts.bKash}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase">Nagad</p>
              <p className="text-sm font-black text-slate-900 dark:text-white font-mono">{paymentMethodCounts.Nagad}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">COD</p>
              <p className="text-sm font-black text-slate-900 dark:text-white font-mono">{paymentMethodCounts.COD}</p>
            </div>
          </div>
        </div>

      </div>

      {/* Category Inventory Bar Chart & Recent Order Activity Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Category Inventory Chart */}
        <div className="bg-white dark:bg-slate-800/90 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
            {t('categoryDistribution')}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Stock item volume per category
          </p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" opacity={0.2} />
                <XAxis type="number" stroke="#94A3B8" fontSize={11} />
                <YAxis dataKey="name" type="category" stroke="#94A3B8" fontSize={10} width={80} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="count" fill="#3B82F6" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Recent Orders Stream Table */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800/90 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {t('recentOrders')}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Real-time feed of customer purchases
                </p>
              </div>
              <button
                onClick={() => setActiveTab('orders')}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <span>View All Orders</span>
                <Eye className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-2.5">Order ID</th>
                    <th className="p-2.5">Customer</th>
                    <th className="p-2.5">Payment</th>
                    <th className="p-2.5">Total</th>
                    <th className="p-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {orders.slice(0, 5).map(o => (
                    <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="p-2.5 font-bold font-mono text-emerald-600 dark:text-emerald-400">
                        {o.id}
                      </td>
                      <td className="p-2.5">
                        <p className="font-semibold text-slate-900 dark:text-slate-100">{o.customerName}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{o.customerPhone}</p>
                      </td>
                      <td className="p-2.5 font-mono uppercase">
                        <span className="inline-flex items-center gap-1">
                          {o.paymentMethod}
                          {o.isTxIdVerified && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                        </span>
                      </td>
                      <td className="p-2.5 font-bold font-mono text-slate-900 dark:text-white">
                        ৳{o.grandTotal.toLocaleString()}
                      </td>
                      <td className="p-2.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            o.status === 'delivered'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : o.status === 'pending'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : o.status === 'shipped'
                              ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                              : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>

      {/* ==================== BOTTOM PROFIT & REVENUE ANALYTICS CHART ==================== */}
      <div className="bg-white dark:bg-slate-800/90 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-md space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-700/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                <BarChart3 className="w-5 h-5" />
              </span>
              <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                {t('profitChartTitle')} (প্রফিট ও রেভিনিউ চার্ট)
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {t('profitChartSubtitle')} — Product Selling Price (বিক্রি দাম) vs Wholesale Cost (পাইকারি দাম) vs Net Profit (নিট লাভ)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 font-mono text-xs">
            <div className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <span className="font-bold text-emerald-900 dark:text-emerald-300">Selling Price</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800/60 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500"></span>
              <span className="font-bold text-amber-900 dark:text-amber-300">Wholesale Cost</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800/60 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-indigo-500"></span>
              <span className="font-bold text-indigo-900 dark:text-indigo-300">Unit Profit</span>
            </div>
          </div>
        </div>

        {/* Visual Bar Chart */}
        {productProfitChartData.length > 0 ? (
          <div className="h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={productProfitChartData}
                margin={{ top: 10, right: 10, left: 10, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
                <XAxis
                  dataKey="shortName"
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis
                  stroke="#64748B"
                  fontSize={11}
                  tickFormatter={value => `৳${value}`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-3.5 rounded-xl shadow-xl border border-slate-700 text-xs font-sans space-y-1.5">
                          <p className="font-black text-emerald-400 border-b border-slate-700 pb-1">
                            {data.fullTitle}
                          </p>
                          <p className="text-slate-300 flex items-center justify-between gap-4">
                            <span>Selling Price (বিক্রি দাম):</span>
                            <span className="font-mono font-bold text-white">৳{data.productPrice.toLocaleString()}</span>
                          </p>
                          <p className="text-amber-300 flex items-center justify-between gap-4">
                            <span>Wholesale Cost (পাইকারি দাম):</span>
                            <span className="font-mono font-bold">৳{data.wholesaleCost.toLocaleString()}</span>
                          </p>
                          <p className="text-emerald-400 flex items-center justify-between gap-4 font-bold">
                            <span>Net Unit Profit (নিট লাভ):</span>
                            <span className="font-mono text-emerald-300">৳{data.netProfit.toLocaleString()} ({data.marginPct}%)</span>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend verticalAlign="top" height={36} />
                <Bar name="Selling Price (৳)" dataKey="productPrice" fill="#10B981" radius={[6, 6, 0, 0]} />
                <Bar name="Wholesale Cost (৳)" dataKey="wholesaleCost" fill="#F59E0B" radius={[6, 6, 0, 0]} />
                <Bar name="Net Profit (৳)" dataKey="netProfit" fill="#6366F1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-700/80 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30">
            <BarChart3 className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              কোনো পণ্য এখনো তালিকাভুক্ত নেই (০ প্রোডাক্ট)
            </p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
              নতুন প্রোডাক্ট অ্যাড করলে এখানে স্বয়ংক্রিয়ভাবে প্রফিট ও পাইকারি মার্জিন গ্রাফ প্রদর্শিত হবে।
            </p>
          </div>
        )}

        {/* Product Profit Breakdown Mini Table */}
        {productProfitChartData.length > 0 && (
          <div className="pt-4 border-t border-slate-100 dark:border-slate-700/80">
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
              Product Price & Wholesale Profit Matrix
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-50 dark:bg-slate-700/40 text-slate-500 dark:text-slate-400 font-bold uppercase">
                  <tr>
                    <th className="p-2.5">Product Title</th>
                    <th className="p-2.5">Category</th>
                    <th className="p-2.5">Selling Price</th>
                    <th className="p-2.5 text-amber-600 dark:text-amber-400">Wholesale Cost</th>
                    <th className="p-2.5 text-emerald-600 dark:text-emerald-400">Unit Profit</th>
                    <th className="p-2.5">Profit Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-sans">
                  {productProfitChartData.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="p-2.5 font-bold text-slate-900 dark:text-slate-100">
                        {item.fullTitle}
                      </td>
                      <td className="p-2.5">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                          {item.category}
                        </span>
                      </td>
                      <td className="p-2.5 font-mono font-bold text-slate-900 dark:text-white">
                        ৳{item.productPrice.toLocaleString()}
                      </td>
                      <td className="p-2.5 font-mono font-bold text-amber-600 dark:text-amber-400">
                        ৳{item.wholesaleCost.toLocaleString()}
                      </td>
                      <td className="p-2.5 font-mono font-black text-emerald-600 dark:text-emerald-400">
                        +৳{item.netProfit.toLocaleString()}
                      </td>
                      <td className="p-2.5 font-mono">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-[10px]">
                          {item.marginPct}% Margin
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
