import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Review } from '../../types';
import { ImgbbImageUploader } from '../common/ImgbbImageUploader';
import {
  MessageSquareQuote,
  Star,
  CheckCircle2,
  Trash2,
  MessageSquare,
  X,
  Send,
  ShieldCheck,
  Plus,
  Image as ImageIcon
} from 'lucide-react';

export const ReviewsModule: React.FC = () => {
  const {
    reviews,
    products,
    addReview,
    deleteReview,
    toggleVerifiedReview,
    replyToReview,
    t
  } = useApp();

  const [activeReplyReview, setActiveReplyReview] = useState<Review | null>(null);
  const [replyText, setReplyText] = useState<string>('');
  const [starFilter, setStarFilter] = useState<number>(0);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // New review form state
  const [newReviewData, setNewReviewData] = useState({
    productId: products[0]?.id || '',
    productTitle: products[0]?.title || '',
    productImage: products[0]?.images?.[0] || 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800',
    userName: '',
    userPhone: '',
    rating: 5,
    comment: '',
    images: [] as string[],
    isVerifiedPurchase: true
  });

  const filteredReviews = reviews.filter(r => (starFilter === 0 ? true : r.rating === starFilter));

  const handleOpenReplyModal = (r: Review) => {
    setActiveReplyReview(r);
    setReplyText(r.adminReply || 'ধন্যবাদ আপনার মূল্যবান মতামতের জন্য! বাজার থেকে কেনাকাটা করার জন্য কৃতজ্ঞতা প্রকাশ করছি।');
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReplyReview || !replyText.trim()) return;
    replyToReview(activeReplyReview.id, replyText.trim());
    setActiveReplyReview(null);
  };

  const handleCreateReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewData.userName.trim() || !newReviewData.comment.trim()) return;
    addReview({
      productId: newReviewData.productId,
      productTitle: newReviewData.productTitle,
      productImage: newReviewData.productImage,
      userName: newReviewData.userName.trim(),
      userPhone: newReviewData.userPhone.trim() || '01700-000000',
      rating: newReviewData.rating,
      comment: newReviewData.comment.trim(),
      images: newReviewData.images,
      isVerifiedPurchase: newReviewData.isVerifiedPurchase
    });
    setShowAddModal(false);
    setNewReviewData({
      productId: products[0]?.id || '',
      productTitle: products[0]?.title || '',
      productImage: products[0]?.images?.[0] || '',
      userName: '',
      userPhone: '',
      rating: 5,
      comment: '',
      images: [],
      isVerifiedPurchase: true
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800/90 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <MessageSquareQuote className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            <span>{t('reviewsTitle')}</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono">
              {reviews.length} total
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Moderate customer product feedback, verify purchases & post official store replies.
          </p>
        </div>

        {/* Star Rating Filter & Add Review Button */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setStarFilter(0)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                starFilter === 0 ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'
              }`}
            >
              All Stars
            </button>
            {[5, 4, 3, 2, 1].map(stars => (
              <button
                key={stars}
                onClick={() => setStarFilter(stars)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                  starFilter === stars ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-500'
                }`}
              >
                <span>{stars}</span>
                <Star className="w-3 h-3 fill-current" />
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন রিভিউ যুক্ত করুন</span>
          </button>
        </div>
      </div>

      {/* Reviews Feed Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredReviews.length === 0 ? (
          <div className="col-span-2 p-12 text-center bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-400">
            No reviews matching this rating filter.
          </div>
        ) : (
          filteredReviews.map(review => (
            <div
              key={review.id}
              className="bg-white dark:bg-slate-800/90 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm space-y-3.5 flex flex-col justify-between"
            >
              <div>
                {/* Product Info Header */}
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-700">
                  <img
                    src={review.productImage}
                    alt={review.productTitle}
                    className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
                  />
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {review.productTitle}
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      Product ID: {review.productId}
                    </p>
                  </div>
                </div>

                {/* User Info & Rating */}
                <div className="flex items-center justify-between pt-2">
                  <div>
                    <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                      {review.userName}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono ml-2">
                      {review.userPhone}
                    </span>
                  </div>

                  <div className="flex items-center gap-0.5 text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${i < review.rating ? 'fill-amber-400' : 'text-slate-200 dark:text-slate-700'}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Review Comment Text */}
                <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed mt-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                  "{review.comment}"
                </p>

                {/* Review Attached Photos */}
                {review.images && review.images.length > 0 && (
                  <div className="mt-2.5">
                    <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
                      <ImageIcon className="w-3 h-3 text-emerald-500" />
                      <span>কাস্টমারের ছবি ({review.images.length})</span>
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {review.images.map((imgUrl, imgIdx) => (
                        <a
                          key={imgIdx}
                          href={imgUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-14 h-14 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 block hover:scale-105 transition-transform shadow-xs"
                          title="বড় করে দেখুন"
                        >
                          <img
                            src={imgUrl}
                            alt={`Review ${imgIdx + 1}`}
                            className="w-full h-full object-cover"
                            onError={e => {
                              (e.target as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=400';
                            }}
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Verified Purchase Toggle Badge */}
                <div className="mt-2.5 flex items-center justify-between">
                  <button
                    onClick={() => toggleVerifiedReview(review.id)}
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all ${
                      review.isVerifiedPurchase
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{review.isVerifiedPurchase ? 'Verified Purchase' : 'Unverified (Click to toggle)'}</span>
                  </button>

                  <span className="text-[10px] text-slate-400">
                    {new Date(review.createdAt).toLocaleDateString('en-GB')}
                  </span>
                </div>

                {/* Official Admin Reply Card */}
                {review.adminReply && (
                  <div className="mt-3 p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60">
                    <div className="flex items-center gap-1.5 text-purple-900 dark:text-purple-200 font-bold text-[11px]">
                      <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                      <span>{t('adminReply')}</span>
                    </div>
                    <p className="text-xs text-purple-950 dark:text-purple-100 mt-1 italic">
                      "{review.adminReply}"
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700/80">
                <button
                  onClick={() => handleOpenReplyModal(review)}
                  className="flex items-center gap-1.5 text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>{review.adminReply ? 'Edit Store Reply' : '+ Post Store Reply'}</span>
                </button>

                <button
                  onClick={() => deleteReview(review.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                  title="Delete Review"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

            </div>
          ))
        )}
      </div>

      {/* Reply Modal */}
      {activeReplyReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                <span>Post Official Store Response</span>
              </h3>
              <button onClick={() => setActiveReplyReview(null)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendReply} className="p-5 space-y-4">
              <p className="text-xs text-slate-500">
                Replying to <strong>{activeReplyReview.userName}</strong> regarding product "{activeReplyReview.productTitle}".
              </p>

              <textarea
                rows={4}
                required
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                placeholder={t('replyPlaceholder')}
                className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-purple-500"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveReplyReview(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-500"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 text-white hover:bg-purple-700 shadow-md shadow-purple-600/20"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{t('submitReply')}</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Add New Review Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
            <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-950/40 border-b border-purple-100 dark:border-purple-900/40">
              <h3 className="text-sm font-bold flex items-center gap-2 text-purple-900 dark:text-purple-200">
                <Plus className="w-4 h-4 text-purple-600" />
                <span>নতুন কাস্টমার রিভিউ যুক্ত করুন (Add Verified Review)</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateReview} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Product Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  প্রোডাক্ট নির্বাচন করুন:
                </label>
                <select
                  value={newReviewData.productId}
                  onChange={e => {
                    const sel = products.find(p => p.id === e.target.value);
                    if (sel) {
                      setNewReviewData({
                        ...newReviewData,
                        productId: sel.id,
                        productTitle: sel.title,
                        productImage: sel.images?.[0] || 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800'
                      });
                    }
                  }}
                  className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.sku || p.id})
                    </option>
                  ))}
                </select>
              </div>

              {/* Customer Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    কাস্টমারের নাম: *
                  </label>
                  <input
                    type="text"
                    required
                    value={newReviewData.userName}
                    onChange={e => setNewReviewData({ ...newReviewData, userName: e.target.value })}
                    placeholder="e.g. তানভীর আহমেদ"
                    className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    মোবাইল নম্বর:
                  </label>
                  <input
                    type="text"
                    value={newReviewData.userPhone}
                    onChange={e => setNewReviewData({ ...newReviewData, userPhone: e.target.value })}
                    placeholder="017xxxxxxxx"
                    className="w-full p-2.5 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              {/* Star Rating */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  রেটিং (স্টার):
                </label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewReviewData({ ...newReviewData, rating: star })}
                      className="p-1 text-amber-400 hover:scale-110 transition-transform"
                    >
                      <Star className={`w-6 h-6 ${star <= newReviewData.rating ? 'fill-amber-400' : 'text-slate-300 dark:text-slate-600'}`} />
                    </button>
                  ))}
                  <span className="text-xs font-bold ml-2 text-slate-600 dark:text-slate-300">
                    {newReviewData.rating} Star{newReviewData.rating > 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {/* Review Comment */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  কাস্টমারের মন্তব্য (Review Text): *
                </label>
                <textarea
                  rows={3}
                  required
                  value={newReviewData.comment}
                  onChange={e => setNewReviewData({ ...newReviewData, comment: e.target.value })}
                  placeholder="পণ্যটি খুব চমৎকার লেগেছে, সময়মতো ডেলিভারি পেয়েছি..."
                  className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* ImgBB Photo Upload for Review */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <ImgbbImageUploader
                  label="কাস্টমারের প্রোডাক্ট ফটো (ImgBB Gallery Uploader)"
                  hint="গ্যালারি থেকে কাস্টমারের পাঠানো ছবি সিলেক্ট করুন। সাইজ স্বয়ংক্রিয়ভাবে KB-তে কমপ্রেস হয়ে ImgBB-তে আপলোড হবে।"
                  value={newReviewData.images}
                  multiple={true}
                  aspectRatio="square"
                  onImagesChange={urls => setNewReviewData({ ...newReviewData, images: urls })}
                />
              </div>

              {/* Verified Purchase Checkbox */}
              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={newReviewData.isVerifiedPurchase}
                  onChange={e => setNewReviewData({ ...newReviewData, isVerifiedPurchase: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Verified Purchase (যাচাইকৃত ক্রেতা ব্যাজ প্রদর্শন করুন)
                </span>
              </label>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  বাতিল করুন
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-600/20"
                >
                  <Plus className="w-4 h-4" />
                  <span>রিভিউ সেভ করুন</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
