import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Order, OrderStatus } from '../../types';
import { InvoiceModal } from '../common/InvoiceModal';
import {
  ShoppingBag,
  Search,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  Printer,
  X,
  Truck,
  CreditCard,
  MapPin,
  Trash2,
  Lock,
  ShieldAlert,
  Eye,
  EyeOff,
  User,
  ArrowUpDown,
  Banknote,
  Sparkles
} from 'lucide-react';

const ORDER_DELETE_PASSWORD = '374212';

export const OrdersModule: React.FC = () => {
  const {
    orders,
    updateOrderStatus,
    verifyOrderTxId,
    deleteOrder,
    storeSettings,
    searchQuery,
    setSearchQuery,
    addToast,
    t
  } = useApp();

  // Status Filter Tab
  const [selectedStatusTab, setSelectedStatusTab] = useState<string>('all');

  // Selected Order for Details Modal
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);

  // Invoice Modal State
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);

  // Details Modal Form State
  const [courierName, setCourierName] = useState<Order['courierName']>('Pathao');
  const [trackingNumber, setTrackingNumber] = useState<string>('');
  const [adminNotes, setAdminNotes] = useState<string>('');

  // Checkbox Selection State
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

  // Password Confirmation Modal State
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    type: 'single' | 'bulk';
    orderId?: string;
    orderIds?: string[];
    title: string;
    description: string;
  }>({
    isOpen: false,
    type: 'single',
    title: '',
    description: ''
  });

  const [enteredPassword, setEnteredPassword] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      // Search
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        o.id.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerPhone.toLowerCase().includes(q) ||
        (o.transactionId && o.transactionId.toLowerCase().includes(q));

      // Status Tab
      const matchesStatus = selectedStatusTab === 'all' || o.status === selectedStatusTab;

      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, selectedStatusTab]);

  // Open Details Modal
  const handleOpenDetails = (order: Order) => {
    setActiveOrder(order);
    setCourierName(order.courierName || 'Pathao');
    setTrackingNumber(order.trackingNumber || '');
    setAdminNotes(order.adminNotes || '');
  };

  // Save Order Updates from Modal
  const handleSaveOrderDetails = (newStatus: OrderStatus) => {
    if (!activeOrder) return;
    updateOrderStatus(activeOrder.id, newStatus, courierName, trackingNumber, adminNotes);
    setActiveOrder(null);
  };

  // Check if all filtered orders are selected
  const isAllFilteredSelected = useMemo(() => {
    return (
      filteredOrders.length > 0 &&
      filteredOrders.every(o => selectedOrderIds.includes(o.id))
    );
  }, [filteredOrders, selectedOrderIds]);

  // Toggle select all filtered orders
  const handleToggleSelectAll = () => {
    if (isAllFilteredSelected) {
      const filteredIdSet = new Set(filteredOrders.map(o => o.id));
      setSelectedOrderIds(prev => prev.filter(id => !filteredIdSet.has(id)));
    } else {
      const newIds = filteredOrders.map(o => o.id);
      setSelectedOrderIds(prev => Array.from(new Set([...prev, ...newIds])));
    }
  };

  // Toggle select one order
  const handleToggleSelectOne = (orderId: string) => {
    setSelectedOrderIds(prev =>
      prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
    );
  };

  // Select all pending orders
  const handleSelectPendingOrders = () => {
    const pendingIds = orders.filter(o => o.status === 'pending').map(o => o.id);
    if (pendingIds.length === 0) {
      addToast('পেন্ডিং অর্ডার নেই', 'বর্তমানে কোনো পেন্ডিং অর্ডার নেই।', 'info');
      return;
    }
    setSelectedOrderIds(Array.from(new Set([...selectedOrderIds, ...pendingIds])));
    addToast('পেন্ডিং অর্ডার সিলেক্টেড', `${pendingIds.length} টি পেন্ডিং অর্ডার সিলেক্ট করা হয়েছে।`, 'info');
  };

  // Deselect all
  const handleDeselectAll = () => {
    setSelectedOrderIds([]);
  };

  // Trigger single order delete
  const handleRequestDeleteSingle = (order: Order) => {
    setDeleteModal({
      isOpen: true,
      type: 'single',
      orderId: order.id,
      title: `অর্ডার #${order.id} ডিলিট করুন`,
      description: `ক্রেতা: ${order.customerName} (৳${order.grandTotal.toLocaleString()})। এই অর্ডারটি স্থায়ীভাবে ডিলিট করতে ৬ সংখ্যার পাসওয়ার্ড দিন:`
    });
    setEnteredPassword('');
    setPasswordError('');
    setShowPassword(false);
  };

  // Trigger bulk delete
  const handleRequestDeleteBulk = () => {
    if (selectedOrderIds.length === 0) return;
    setDeleteModal({
      isOpen: true,
      type: 'bulk',
      orderIds: [...selectedOrderIds],
      title: `বাছাইকৃত ${selectedOrderIds.length} টি অর্ডার ডিলিট করুন`,
      description: `আপনি মোট ${selectedOrderIds.length} টি অর্ডার স্থায়ীভাবে মুছে ফেলতে যাচ্ছেন। মুছে ফেলতে ৬ সংখ্যার পাসওয়ার্ড দিন:`
    });
    setEnteredPassword('');
    setPasswordError('');
    setShowPassword(false);
  };

  // Execute delete after verifying password
  const handleConfirmDelete = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (enteredPassword.trim() !== ORDER_DELETE_PASSWORD) {
      setPasswordError('❌ ভুল পাসওয়ার্ড! সঠিক ৬ সংখ্যার পাসওয়ার্ড (374212) লিখুন।');
      return;
    }

    if (deleteModal.type === 'single' && deleteModal.orderId) {
      deleteOrder(deleteModal.orderId);
      setSelectedOrderIds(prev => prev.filter(id => id !== deleteModal.orderId));
      addToast('অর্ডার ডিলিট সম্পন্ন', `অর্ডার #${deleteModal.orderId} স্থায়ীভাবে মুছে ফেলা হয়েছে।`, 'success');
    } else if (deleteModal.type === 'bulk' && deleteModal.orderIds) {
      const idsToDelete = deleteModal.orderIds;
      idsToDelete.forEach(id => deleteOrder(id));
      setSelectedOrderIds(prev => prev.filter(id => !idsToDelete.includes(id)));
      addToast('বাল্ক ডিলিট সম্পন্ন', `সফলভাবে ${idsToDelete.length} টি অর্ডার ডিলিট করা হয়েছে।`, 'success');
    }

    setDeleteModal({ isOpen: false, type: 'single', title: '', description: '' });
    setEnteredPassword('');
    setPasswordError('');
  };

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800/90 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <span>{t('orders')}</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono">
              {filteredOrders.length} orders
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Verify bKash & Nagad Transaction IDs, dispatch couriers & print receipts.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search BZR-1001, phone, TxID..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'all', label: 'All Orders' },
          { id: 'pending', label: 'Pending ⚠️' },
          { id: 'processing', label: 'Processing' },
          { id: 'shipped', label: 'Shipped 🚚' },
          { id: 'delivered', label: 'Delivered ✅' },
          { id: 'cancelled', label: 'Cancelled' }
        ].map(tab => {
          const count = tab.id === 'all' ? orders.length : orders.filter(o => o.status === tab.id).length;
          const isActive = selectedStatusTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setSelectedStatusTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 border ${
                isActive
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Bulk Selection Toolbar & Helper Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
        <div className="flex flex-wrap items-center gap-2">
          {/* Header Select All Checkbox */}
          <label className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs font-bold cursor-pointer select-none text-slate-700 dark:text-slate-200 hover:bg-slate-50">
            <input
              type="checkbox"
              checked={isAllFilteredSelected}
              onChange={handleToggleSelectAll}
              className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
            />
            <span>সকল অর্ডার সিলেক্ট ({filteredOrders.length})</span>
          </label>

          {/* Quick Select Pending Shortcut */}
          <button
            type="button"
            onClick={handleSelectPendingOrders}
            className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-bold transition-all"
            title="সকল পেন্ডিং অর্ডার একসাথে সিলেক্ট করুন"
          >
            ⚡ পেন্ডিং অর্ডার সিলেক্ট ({orders.filter(o => o.status === 'pending').length})
          </button>
        </div>

        {/* Bulk Action Controls */}
        {selectedOrderIds.length > 0 && (
          <div className="flex items-center gap-2 animate-fadeIn">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{selectedOrderIds.length} টি সিলেক্টেড</span>
            </span>

            <button
              type="button"
              onClick={handleRequestDeleteBulk}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-transform hover:scale-105 active:scale-95"
              title="পাসওয়ার্ড দিয়ে নির্বাচিত সকল অর্ডার ডিলিট করুন"
            >
              <Trash2 className="w-4 h-4" />
              <span>বাছাইকৃত ডিলিট ({selectedOrderIds.length})</span>
            </button>

            <button
              type="button"
              onClick={handleDeselectAll}
              className="px-2.5 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors"
            >
              বাতিল
            </button>
          </div>
        )}
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3.5 text-center w-10">
                  <input
                    type="checkbox"
                    checked={isAllFilteredSelected}
                    onChange={handleToggleSelectAll}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                    title="সকল অর্ডার সিলেক্ট করুন (Select All)"
                  />
                </th>
                <th className="p-3.5">Order ID</th>
                <th className="p-3.5">Buyer Info</th>
                <th className="p-3.5">Items Summary</th>
                <th className="p-3.5">Payment & TxID</th>
                <th className="p-3.5">Grand Total</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    No orders found matching the criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => {
                  const isSelected = selectedOrderIds.includes(order.id);
                  return (
                    <tr
                      key={order.id}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors ${
                        isSelected ? 'bg-emerald-50/60 dark:bg-emerald-950/20' : ''
                      }`}
                    >
                      {/* Selection Checkbox */}
                      <td className="p-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectOne(order.id)}
                          className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                        />
                      </td>
                      
                      {/* Order ID & Date */}
                      <td className="p-3.5">
                        <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400 text-sm">
                          {order.id}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(order.createdAt).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </td>

                      {/* Buyer Details */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-slate-900 dark:text-slate-100">
                            {order.customerName}
                          </p>
                          {(order.customerId || order.userId) && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800" title={`User ID: ${order.customerId || order.userId}`}>
                              UID
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 font-mono">
                          📞 {order.customerPhone}
                        </p>
                        {order.customerEmail && (
                          <p className="text-[10px] text-slate-400 truncate max-w-[180px]">
                            ✉️ {order.customerEmail}
                          </p>
                        )}
                        <p className="text-[10px] text-slate-400 truncate max-w-[180px] mt-0.5">
                          📍 {order.deliveryAddress}, {order.district}
                        </p>
                      </td>

                      {/* Items Summary */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <img
                            src={order.items[0]?.image || 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800&auto=format&fit=crop&q=80'}
                            alt={order.items[0]?.title}
                            className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
                          />
                          <div>
                            <p className="font-medium text-slate-800 dark:text-slate-200 line-clamp-1 max-w-[160px]">
                              {order.items[0]?.title}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {order.items.length > 1
                                ? `+ ${order.items.length - 1} more items`
                                : `Qty: ${order.items[0]?.quantity}`}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Payment Method & TxID Verification */}
                      <td className="p-3.5">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className={`inline-block font-mono text-[11px] uppercase font-extrabold px-1.5 py-0.5 rounded ${
                              order.paymentMethod === 'bkash'
                                ? 'bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300'
                                : order.paymentMethod === 'nagad'
                                ? 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300'
                                : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                            }`}>
                              {order.paymentMethod}
                            </span>
                            <span className={`text-[10px] font-bold ${
                              order.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-amber-600'
                            }`}>
                              • {order.paymentStatus}
                            </span>
                          </div>

                          {order.transactionId && (
                            <p className="text-[11px] font-mono font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-700/60 px-1.5 py-0.5 rounded inline-block">
                              TxID: {order.transactionId}
                            </p>
                          )}

                          {(order.senderPhone || order.paymentNumber) && (
                            <p className="text-[10px] font-mono text-slate-500">
                              From: {order.senderPhone || order.paymentNumber}
                            </p>
                          )}

                          <div>
                            {order.isTxIdVerified ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Verified
                              </span>
                            ) : (
                              <button
                                onClick={() => verifyOrderTxId(order.id, true)}
                                className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 hover:bg-amber-200"
                              >
                                <AlertCircle className="w-3 h-3" />
                                Verify TxID
                              </button>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Grand Total */}
                      <td className="p-3.5 font-bold font-mono text-sm text-slate-900 dark:text-white">
                        ৳{order.grandTotal.toLocaleString()}
                      </td>

                      {/* Status */}
                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                            order.status === 'delivered'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : order.status === 'pending'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : order.status === 'shipped'
                              ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                              : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenDetails(order)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-xs hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800"
                          >
                            Manage
                          </button>
                          <button
                            onClick={() => setInvoiceOrder(order)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                            title="Print Invoice"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRequestDeleteSingle(order)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                            title="পাসওয়ার্ড দিয়ে অর্ডার ডিলিট করুন (374212)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details & Logistics Modal */}
      {activeOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
          <div className="relative bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 my-8 overflow-hidden">
            
            {/* Modal Top */}
            <div className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-slate-900 dark:text-white font-mono">
                    Order Management: {activeOrder.id}
                  </h3>
                  {(activeOrder.customerId || activeOrder.userId) && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      User: {activeOrder.customerId || activeOrder.userId}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Buyer: <span className="font-semibold text-slate-700 dark:text-slate-300">{activeOrder.customerName}</span> ({activeOrder.customerPhone})
                  {activeOrder.customerEmail ? ` • ${activeOrder.customerEmail}` : ''}
                </p>
              </div>

              <button
                onClick={() => setActiveOrder(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              
              {/* Delivery Destination */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-1">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Delivery Destination</span>
                </h4>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {activeOrder.deliveryAddress}, {activeOrder.district}
                </p>
                {activeOrder.areaNote && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 italic">
                    Note: "{activeOrder.areaNote}"
                  </p>
                )}
              </div>

              {/* Items Ordered */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Items Ordered
                </h4>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                  {activeOrder.items.map(item => (
                    <div key={item.id} className="p-3 flex items-center justify-between bg-white dark:bg-slate-900">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">
                            {item.title}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            Qty: {item.quantity} × ৳{item.price.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-bold font-mono text-slate-900 dark:text-white">
                        ৳{(item.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Verification Box */}
              <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-indigo-600" />
                    <span>Payment Method: {activeOrder.paymentMethod.toUpperCase()}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      activeOrder.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}>
                      {activeOrder.paymentStatus.toUpperCase()}
                    </span>
                  </h4>
                  {activeOrder.transactionId && (
                    <p className="text-xs font-mono font-bold text-indigo-700 dark:text-indigo-300">
                      Transaction ID (TxID): <span className="bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">{activeOrder.transactionId}</span>
                    </p>
                  )}
                  {(activeOrder.senderPhone || activeOrder.paymentNumber) && (
                    <p className="text-xs font-mono text-slate-700 dark:text-slate-300">
                      Paid From Mobile: <span className="font-bold">{activeOrder.senderPhone || activeOrder.paymentNumber}</span>
                    </p>
                  )}
                  {activeOrder.paymentDetails && (
                    <p className="text-xs text-slate-500 italic">
                      Payment Note: {activeOrder.paymentDetails}
                    </p>
                  )}
                </div>

                <div>
                  {activeOrder.isTxIdVerified ? (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Verified & Confirmed
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        verifyOrderTxId(activeOrder.id, true);
                        setActiveOrder({ ...activeOrder, isTxIdVerified: true, paymentStatus: 'paid' });
                      }}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 shadow-sm"
                    >
                      Confirm TxID Paid
                    </button>
                  )}
                </div>
              </div>

              {/* Courier Logistics & Status Transition */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-emerald-500" />
                  <span>Courier Partner & Tracking Update</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      Select Courier Partner
                    </label>
                    <select
                      value={courierName}
                      onChange={e => setCourierName(e.target.value as Order['courierName'])}
                      className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    >
                      <option value="Pathao">Pathao Courier</option>
                      <option value="Steadfast">Steadfast Courier</option>
                      <option value="RedX">RedX Express</option>
                      <option value="Paperfly">Paperfly</option>
                      <option value="eCourier">eCourier BD</option>
                      <option value="Self Delivery">Self Merchant Delivery</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      Tracking ID / Consignment No.
                    </label>
                    <input
                      type="text"
                      value={trackingNumber}
                      onChange={e => setTrackingNumber(e.target.value)}
                      placeholder="e.g. PTH-982103"
                      className="w-full p-2.5 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Internal Admin Notes
                  </label>
                  <input
                    type="text"
                    value={adminNotes}
                    onChange={e => setAdminNotes(e.target.value)}
                    placeholder="e.g. bKash payment verified. Packed in bubble wrap."
                    className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              {/* Status Transition Action Buttons */}
              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Transition Order Status To:
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleSaveOrderDetails('processing')}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-sky-600 text-white hover:bg-sky-700 shadow-sm"
                  >
                    Processing
                  </button>
                  <button
                    onClick={() => handleSaveOrderDetails('shipped')}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
                  >
                    Shipped (Courier)
                  </button>
                  <button
                    onClick={() => handleSaveOrderDetails('delivered')}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
                  >
                    Mark Delivered ✅
                  </button>
                  <button
                    onClick={() => handleSaveOrderDetails('cancelled')}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 shadow-sm"
                  >
                    Cancel Order
                  </button>
                  <button
                    onClick={() => {
                      const toDelete = activeOrder;
                      setActiveOrder(null);
                      handleRequestDeleteSingle(toDelete);
                    }}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 shadow-sm flex items-center gap-1.5"
                    title="পাসওয়ার্ড দিয়ে অর্ডার ডিলিট করুন"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>অর্ডার ডিলিট</span>
                  </button>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* Invoice Modal Popup */}
      {invoiceOrder && (
        <InvoiceModal
          order={invoiceOrder}
          storeSettings={storeSettings}
          onClose={() => setInvoiceOrder(null)}
        />
      )}

      {/* Password Protection Modal for Order Deletion */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl border border-rose-200 dark:border-rose-900/60 overflow-hidden animate-scaleUp">
            
            {/* Header */}
            <div className="p-5 bg-rose-50/80 dark:bg-rose-950/40 border-b border-rose-100 dark:border-rose-900/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-md">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    {deleteModal.title}
                  </h3>
                  <span className="text-[11px] font-mono text-rose-600 dark:text-rose-400 font-semibold">
                    🔒 নিরাপত্তা পাসওয়ার্ড প্রয়োজন
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setDeleteModal({ isOpen: false, type: 'single', title: '', description: '' })}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-white/80 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleConfirmDelete} className="p-6 space-y-4">
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>সতর্কবার্তা: অর্ডার স্থায়ীভাবে মুছে যাবে!</span>
                </p>
                <p className="text-[11px] text-amber-800 dark:text-amber-300">
                  {deleteModal.description}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  ৬ সংখ্যার এডমিন পাসওয়ার্ড দিন (Security Password):
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoFocus
                    maxLength={10}
                    value={enteredPassword}
                    onChange={e => {
                      setEnteredPassword(e.target.value);
                      if (passwordError) setPasswordError('');
                    }}
                    placeholder="পাসওয়ার্ড লিখুন..."
                    className="w-full pl-10 pr-10 py-3 text-center tracking-widest text-lg font-mono font-bold bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 focus:border-rose-500 dark:focus:border-rose-500 rounded-2xl text-slate-900 dark:text-white outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                    title={showPassword ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {passwordError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs font-bold text-rose-700 dark:text-rose-300 animate-shake">
                  {passwordError}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteModal({ isOpen: false, type: 'single', title: '', description: '' })}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors"
                >
                  বাতিল করুন
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition-transform hover:scale-105 active:scale-95"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>ডিলিট নিশ্চিত করুন</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
