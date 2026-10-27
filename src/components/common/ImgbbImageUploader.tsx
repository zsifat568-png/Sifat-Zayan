import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  Image as ImageIcon,
  CheckCircle2,
  Trash2,
  Link as LinkIcon,
  Copy,
  ExternalLink,
  Sparkles,
  Loader2,
  AlertCircle,
  Plus
} from 'lucide-react';
import { uploadImageToImgbb, formatFileSize } from '../../lib/imgbb';

interface ImgbbImageUploaderProps {
  label?: string;
  hint?: string;
  value?: string | string[];
  onChange?: (url: string) => void;
  onImagesChange?: (urls: string[]) => void;
  multiple?: boolean;
  aspectRatio?: 'square' | 'video' | 'banner' | 'auto';
  presetOptions?: Array<{ label: string; url: string }>;
  className?: string;
}

export const ImgbbImageUploader: React.FC<ImgbbImageUploaderProps> = ({
  label = 'ছবি আপলোড (ImgBB Cloud)',
  hint = 'গ্যালারি থেকে ছবি সিলেক্ট করলে স্বয়ংক্রিয়ভাবে MB ফাইলকে হালকা KB-তে কমপ্রেস করে ImgBB-তে আপলোড করা হবে।',
  value,
  onChange,
  onImagesChange,
  multiple = false,
  aspectRatio = 'auto',
  presetOptions = [],
  className = ''
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [uploadStats, setUploadStats] = useState<{
    originalSizeKb: number;
    compressedSizeKb: number;
    reduction: number;
  } | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [manualUrl, setManualUrl] = useState('');
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Normalize image list
  const imageList: string[] = Array.isArray(value)
    ? value.filter(Boolean)
    : typeof value === 'string' && value.trim()
    ? [value.trim()]
    : [];

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setErrorNotice(null);
    setUploadStats(null);

    const fileArray = Array.from(files);
    const newUploadedUrls: string[] = [];

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      setUploadStatus(
        multiple && fileArray.length > 1
          ? `ফাইল ${i + 1}/${fileArray.length}: কমপ্রেস ও আপলোড হচ্ছে...`
          : 'ছবি কমপ্রেস (MB ➔ KB) ও ImgBB-তে আপলোড হচ্ছে...'
      );

      const result = await uploadImageToImgbb(file, file.name, (status, stats) => {
        setUploadStatus(status);
        if (stats) setUploadStats(stats);
      });

      if (result.success && result.url) {
        newUploadedUrls.push(result.url);
        if (result.originalSizeKb && result.compressedSizeKb) {
          setUploadStats({
            originalSizeKb: result.originalSizeKb,
            compressedSizeKb: result.compressedSizeKb,
            reduction: result.reductionPercent || 0
          });
        }
        if (result.error) {
          setErrorNotice(result.error);
        }
      } else {
        setErrorNotice(result.error || 'ছবি আপলোড ব্যর্থ হয়েছে');
      }
    }

    setIsUploading(false);
    setUploadStatus('');

    if (newUploadedUrls.length > 0) {
      if (multiple && onImagesChange) {
        onImagesChange([...imageList, ...newUploadedUrls]);
      } else if (onChange) {
        onChange(newUploadedUrls[0]);
      } else if (onImagesChange) {
        onImagesChange(newUploadedUrls);
      }
    }

    // Reset native input so user can pick the exact same file again if desired
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const handleAddManualUrl = () => {
    if (!manualUrl.trim()) return;
    const trimmed = manualUrl.trim();
    if (multiple && onImagesChange) {
      onImagesChange([...imageList, trimmed]);
    } else if (onChange) {
      onChange(trimmed);
    } else if (onImagesChange) {
      onImagesChange([trimmed]);
    }
    setManualUrl('');
    setShowUrlInput(false);
  };

  const handleRemoveImage = (indexToRemove: number) => {
    if (multiple && onImagesChange) {
      const updated = imageList.filter((_, idx) => idx !== indexToRemove);
      onImagesChange(updated);
    } else if (onChange) {
      onChange('');
    } else if (onImagesChange) {
      onImagesChange([]);
    }
  };

  const handleSetPrimary = (indexToPrimary: number) => {
    if (indexToPrimary === 0 || !onImagesChange) return;
    const selected = imageList[indexToPrimary];
    const filtered = imageList.filter((_, idx) => idx !== indexToPrimary);
    onImagesChange([selected, ...filtered]);
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const aspectClass =
    aspectRatio === 'square'
      ? 'aspect-square'
      : aspectRatio === 'video'
      ? 'aspect-video'
      : aspectRatio === 'banner'
      ? 'aspect-[21/9]'
      : 'aspect-[4/3]';

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Label & ImgBB Badge Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>{label}</span>
          {multiple && <span className="text-[10px] text-slate-400">(একাধিক ছবি গ্রহণযোগ্য)</span>}
        </label>
        
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[10px] font-mono text-emerald-700 dark:text-emerald-300">
          <Sparkles className="w-2.5 h-2.5 text-emerald-600 animate-pulse" />
          <span>ImgBB API সংযুক্ত • Auto MB➔KB Optimizer</span>
        </div>
      </div>

      {hint && (
        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
          {hint}
        </p>
      )}

      {/* Hidden File Picker Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="hidden"
        onChange={e => handleFileSelect(e.target.files)}
      />

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={e => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-4 sm:p-5 transition-all text-center cursor-pointer select-none group ${
          isDragging
            ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 ring-4 ring-emerald-500/10'
            : 'border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 hover:border-emerald-400 dark:hover:border-emerald-500 hover:bg-emerald-50/30'
        } ${isUploading ? 'opacity-90 pointer-events-none' : ''}`}
      >
        <div className="flex flex-col items-center justify-center space-y-2">
          {isUploading ? (
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 animate-spin">
              <Loader2 className="w-6 h-6" />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform shadow-xs">
              <UploadCloud className="w-6 h-6" />
            </div>
          )}

          <div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
              {isUploading
                ? uploadStatus || 'কমপ্রেস ও আপলোড করা হচ্ছে...'
                : 'গ্যালারি বা ডিভাইস থেকে ছবি নির্বাচন করুন'}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              ক্লিক করুন অথবা ড্র্যাগ & ড্রপ করুন • যেকোনো বড় MB সাইজের ছবি স্বয়ংক্রিয়ভাবে KB-তে কমপ্রেস হয়ে যাবে
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-medium">
              JPG, PNG, WebP, Camera Photos
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-semibold">
              ⚡ Instant ImgBB Link
            </span>
          </div>
        </div>
      </div>

      {/* Live Compression Statistics Banner */}
      {uploadStats && (
        <div className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 border border-emerald-300 dark:border-emerald-700 flex items-center justify-between text-xs animate-in fade-in">
          <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">
              ছবি অপ্টিমাইজড: {formatFileSize(uploadStats.originalSizeKb * 1024)} ➔{' '}
              <strong className="text-emerald-700 dark:text-emerald-300 font-mono font-bold">
                {formatFileSize(uploadStats.compressedSizeKb * 1024)}
              </strong>
            </span>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white font-mono">
            {uploadStats.reduction}% সাইজ হ্রাস
          </span>
        </div>
      )}

      {/* Error / Notice Display */}
      {errorNotice && (
        <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="flex-1">{errorNotice}</span>
        </div>
      )}

      {/* Uploaded Image Previews / Gallery */}
      {imageList.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
            <span>আপলোডকৃত ছবিসমূহ ({imageList.length})</span>
            {multiple && imageList.length > 1 && (
              <span className="text-[10px] text-slate-400 font-normal">
                ★ প্রথম ছবিটি মূল ডিসপ্লে ফটো হিসেবে ব্যবহৃত হবে
              </span>
            )}
          </div>

          <div
            className={`grid gap-2.5 ${
              multiple
                ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4'
                : 'grid-cols-1 sm:grid-cols-2'
            }`}
          >
            {imageList.map((url, idx) => (
              <div
                key={`${url}-${idx}`}
                className={`relative rounded-xl overflow-hidden border bg-white dark:bg-slate-900 shadow-xs group transition-all ${
                  idx === 0
                    ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                {/* Image Display */}
                <div className={`w-full ${aspectClass} relative bg-slate-900/10 dark:bg-slate-950 overflow-hidden`}>
                  <img
                    src={url}
                    alt={`Uploaded-${idx}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={e => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600';
                    }}
                  />

                  {/* Primary Badge */}
                  {idx === 0 && (
                    <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md text-[9px] font-black bg-emerald-600 text-white shadow-md flex items-center gap-1">
                      ★ মূল ছবি
                    </span>
                  )}

                  {/* Action Buttons Overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-2">
                    {multiple && idx !== 0 && (
                      <button
                        type="button"
                        onClick={() => handleSetPrimary(idx)}
                        className="p-1.5 rounded-lg bg-emerald-600 text-white text-[10px] font-bold hover:bg-emerald-700 transition-colors"
                        title="মূল ছবি হিসেবে নির্ধারণ করুন"
                      >
                        মূল করুন
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => copyToClipboard(url)}
                      className="p-1.5 rounded-lg bg-white/90 text-slate-800 hover:bg-white text-[10px] font-bold transition-colors"
                      title="ImgBB লিংক কপি করুন"
                    >
                      {copiedUrl === url ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>

                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-white/90 text-slate-800 hover:bg-white transition-colors"
                      title="নতুন ট্যাবে দেখুন"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>

                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="p-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-colors"
                      title="মুছে ফেলুন"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Footer URL Snippet */}
                <div className="p-1.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-700/80 flex items-center justify-between text-[10px]">
                  <span className="font-mono text-slate-500 dark:text-slate-400 truncate max-w-[120px]">
                    {url.startsWith('data:') ? 'Local Optim' : url.replace(/^https?:\/\//, '')}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="text-rose-600 hover:text-rose-700 font-semibold shrink-0"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alternative Options: Manual URL & Presets */}
      <div className="pt-1 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowUrlInput(!showUrlInput)}
            className="text-[11px] font-bold text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1 transition-colors"
          >
            <LinkIcon className="w-3 h-3" />
            <span>{showUrlInput ? 'লিংক ইনপুট বন্ধ করুন' : 'সরাসরি ইমেজ লিংক দিয়ে যুক্ত করতে চান?'}</span>
          </button>
        </div>

        {presetOptions.length > 0 && (
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-[10px] text-slate-400">প্রিসেট স্যাম্পল:</span>
            {presetOptions.slice(0, 4).map((preset, pIdx) => (
              <button
                key={pIdx}
                type="button"
                onClick={() => {
                  if (multiple && onImagesChange) {
                    onImagesChange([...imageList, preset.url]);
                  } else if (onChange) {
                    onChange(preset.url);
                  } else if (onImagesChange) {
                    onImagesChange([preset.url]);
                  }
                }}
                className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Collapsible Manual URL Input */}
      {showUrlInput && (
        <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 animate-in fade-in">
          <input
            type="url"
            value={manualUrl}
            onChange={e => setManualUrl(e.target.value)}
            placeholder="https://i.ibb.co/... বা অন্য কোনো ছবির সরাসরি লিংক পেস্ট করুন"
            className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-slate-800 dark:text-slate-200 focus:outline-emerald-500"
          />
          <button
            type="button"
            onClick={handleAddManualUrl}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shrink-0 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>যুক্ত করুন</span>
          </button>
        </div>
      )}
    </div>
  );
};
