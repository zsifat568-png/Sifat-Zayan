import React from 'react';
import { Order, GlobalStoreSettings } from '../../types';
import { Printer, X, CheckCircle, Store, Phone, MapPin, Mail } from 'lucide-react';

interface InvoiceModalProps {
  order: Order;
  storeSettings: GlobalStoreSettings;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ order, storeSettings, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 my-8 overflow-hidden">
        
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 print:hidden">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>Customer Receipt / Invoice</span>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 font-mono">
              #{order.id}
            </span>
          </h3>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print Invoice</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Body */}
        <div className="p-6 sm:p-8 space-y-6 text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900" id="printable-invoice">
          
          {/* Header & Logo */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold">
                  <Store className="w-4 h-4" />
                </div>
                <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                  BAZAR <span className="text-emerald-600">E-Commerce</span>
                </h1>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                <MapPin className="w-3 h-3" />
                <span>{storeSettings.storeAddress}</span>
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-3 mt-0.5">
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3" /> {storeSettings.storePhone}
                </span>
                <span className="flex items-center gap-1">
                  <Mail className="w-3 h-3" /> {storeSettings.storeEmail}
                </span>
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className="inline-block text-xs font-bold text-slate-400 uppercase tracking-widest">
                Official Order Receipt
              </span>
              <h2 className="text-lg font-black text-slate-900 dark:text-white font-mono">
                {order.id}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Date: {new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Customer & Shipping Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Customer Information
              </h4>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {order.customerName}
              </p>
              {(order.customerId || order.userId) && (
                <p className="text-[10px] font-mono font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  ID: {order.customerId || order.userId}
                </p>
              )}
              <p className="text-xs text-slate-600 dark:text-slate-300 font-mono mt-0.5">
                📞 {order.customerPhone}
              </p>
              {order.customerEmail && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  ✉️ {order.customerEmail}
                </p>
              )}
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Shipping Destination
              </h4>
              <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
                {order.deliveryAddress}, <span className="font-bold">{order.district}</span>
              </p>
              {order.areaNote && (
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1 italic">
                  Note: "{order.areaNote}"
                </p>
              )}
              {order.courierName && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
                  Courier: {order.courierName} ({order.trackingNumber || 'Pending Tracking'})
                </p>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3">Item Description</th>
                  <th className="p-3 text-center">Qty</th>
                  <th className="p-3 text-right">Unit Price</th>
                  <th className="p-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {order.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="p-3 font-medium text-slate-900 dark:text-slate-100">
                      {item.title}
                    </td>
                    <td className="p-3 text-center font-mono">{item.quantity}</td>
                    <td className="p-3 text-right font-mono">৳{item.price.toLocaleString()}</td>
                    <td className="p-3 text-right font-bold font-mono">
                      ৳{(item.price * item.quantity).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary & Payment Verification Stamp */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-2">
            
            {/* Payment Method Verification Stamp */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 w-full sm:w-1/2 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase">
                  Payment Method:
                </span>
                <span className="text-xs font-black uppercase text-emerald-600 dark:text-emerald-400">
                  {order.paymentMethod}
                </span>
              </div>

              {order.transactionId && (
                <p className="text-xs font-mono text-slate-800 dark:text-slate-200">
                  TxID: <span className="font-bold text-indigo-600 dark:text-indigo-400">{order.transactionId}</span>
                </p>
              )}

              {(order.senderPhone || order.paymentNumber) && (
                <p className="text-xs font-mono text-slate-700 dark:text-slate-300">
                  Paid From: <span className="font-semibold">{order.senderPhone || order.paymentNumber}</span>
                </p>
              )}

              {order.paymentDetails && (
                <p className="text-[11px] text-slate-500 italic">
                  Note: {order.paymentDetails}
                </p>
              )}

              <div className="flex items-center gap-1.5 pt-1">
                {order.isTxIdVerified || order.paymentStatus === 'paid' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Verified & Paid
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
                    Pending Verification / COD
                  </span>
                )}
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="w-full sm:w-1/2 space-y-1.5 text-xs text-right font-mono">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Subtotal:</span>
                <span>৳{order.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Delivery Fee:</span>
                <span>৳{order.deliveryFee.toLocaleString()}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span>Discount:</span>
                  <span>- ৳{order.discountAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-700">
                <span>Grand Total:</span>
                <span>৳{order.grandTotal.toLocaleString()}</span>
              </div>
            </div>

          </div>

          {/* Footer Thank You Note */}
          <div className="text-center pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
            Thank you for shopping with <strong className="text-slate-900 dark:text-slate-100">Bazar BD</strong>. For support, call {storeSettings.storePhone}.
          </div>

        </div>

      </div>
    </div>
  );
};
