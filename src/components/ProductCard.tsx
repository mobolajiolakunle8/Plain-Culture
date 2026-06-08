import React, { useState } from "react";
import { Product } from "../lib/firebase";
import { Eye, Share2, Check, Copy, MessageCircle, Camera, X } from "lucide-react";

interface ProductCardProps {
  product: Product;
  onPreview: (product: Product) => void;
  onAddToast?: (text: string, type: "success" | "error" | "info") => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onPreview, onAddToast }) => {
  const [copied, setCopied] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const isSoldOut = product.stockQuantity <= 0;
  const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= 5;

  const shareUrl = `${window.location.origin}?product=${product.id}`;
  const shareText = `Plain Culture Drop: ${product.name} - ₦${product.price.toLocaleString()}. Limited pieces available. Shop here: ${shareUrl}`;

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      onAddToast?.("Product link copied!", "success");
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      onAddToast?.("Failed to copy link. Please try again.", "error");
    });
  };

  const handleWhatsAppShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank");
  };

  const handleInstagramGuide = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(shareUrl).catch(() => {});
    onAddToast?.("Instagram Story tip: Screenshot this product, open Instagram Story, add a Link sticker, and paste the copied product link.", "info");
  };

  return (
    <div className="group relative flex flex-col bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-sm overflow-hidden transition-all duration-300 hover:border-zinc-400 dark:hover:border-zinc-700">
      
      {/* Product Image Panel */}
      <div 
        onClick={() => onPreview(product)}
        className="relative aspect-square w-full bg-zinc-100 dark:bg-zinc-900 overflow-hidden cursor-pointer"
      >
        <img
          src={product.images[0] || "/images/tee_onyx.jpg"}
          alt={product.name}
          className="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
          loading="lazy"
        />

        {product.images.length > 1 && (
          <div className="absolute bottom-4 right-4 bg-black/80 text-white border border-white/10 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-sm">
            {product.images.length} Images
          </div>
        )}

        {/* Status Overlay Badges */}
        {isSoldOut ? (
          <div className="absolute top-4 left-4 bg-red-600 text-white font-black text-[10px] tracking-widest uppercase px-3 py-1.5 shadow-md">
            SOLD OUT
          </div>
        ) : isLowStock ? (
          <div className="absolute top-4 left-4 bg-amber-500 text-black font-black text-[10px] tracking-widest uppercase px-3 py-1.5 shadow-md">
            ONLY {product.stockQuantity} LEFT
          </div>
        ) : (
          <div className="absolute top-4 left-4 bg-[#E8FF6B] text-black font-black text-[10px] tracking-widest uppercase px-3 py-1.5 shadow-sm">
            EXCLUSIVE DROP
          </div>
        )}

        {/* View Details Hover Overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
          <button onClick={() => onPreview(product)} className="flex items-center gap-2 px-4 py-2.5 bg-[#E8FF6B] text-black font-extrabold text-xs uppercase tracking-wider rounded-sm transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 cursor-pointer">
            <Eye className="w-3.5 h-3.5" />
            <span>VIEW DROP PIECE</span>
          </button>
          {/* Public share button for customers */}
          <div className="relative transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShareOpen((prev) => !prev);
              }}
              className="flex items-center gap-1.5 px-3 py-2.5 bg-black/70 text-white border border-white/20 hover:bg-[#E8FF6B] hover:text-black hover:border-[#E8FF6B] font-extrabold text-xs uppercase tracking-wider rounded-sm cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copied ? "COPIED" : "SHARE"}</span>
            </button>

            {shareOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-full mt-2 w-52 bg-black border border-zinc-800 rounded-sm shadow-2xl overflow-hidden z-20"
              >
                <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#E8FF6B]">Share Drop</span>
                  <button onClick={() => setShareOpen(false)} className="text-zinc-500 hover:text-white cursor-pointer">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <button
                  onClick={handleCopyLink}
                  className="w-full px-3 py-2.5 flex items-center gap-2 text-xs text-zinc-300 hover:bg-zinc-900 hover:text-[#E8FF6B] transition-colors cursor-pointer text-left"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy link</span>
                </button>
                <button
                  onClick={handleWhatsAppShare}
                  className="w-full px-3 py-2.5 flex items-center gap-2 text-xs text-zinc-300 hover:bg-zinc-900 hover:text-[#E8FF6B] transition-colors cursor-pointer text-left"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Share to WhatsApp</span>
                </button>
                <button
                  onClick={handleInstagramGuide}
                  className="w-full px-3 py-2.5 flex items-center gap-2 text-xs text-zinc-300 hover:bg-zinc-900 hover:text-[#E8FF6B] transition-colors cursor-pointer text-left"
                >
                  <Camera className="w-4 h-4" />
                  <span>Instagram Story guide</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info details */}
      <div className="flex-1 p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
              {product.sizes.join(" • ")}
            </span>
            <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">
              280GSM Heavyweight
            </span>
          </div>

          <h3 
            onClick={() => onPreview(product)}
            className="text-base font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wide mb-1 hover:text-[#E8FF6B] dark:hover:text-[#E8FF6B] cursor-pointer transition-colors"
          >
            {product.name}
          </h3>
        </div>

        <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-900 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs text-zinc-400 dark:text-zinc-500 font-medium uppercase tracking-wider">PRICE</span>
            <span className="text-lg font-black text-black dark:text-white">
              ₦{product.price.toLocaleString()}
            </span>
            <span className={`text-[10px] font-black uppercase tracking-wider mt-1 ${isSoldOut ? "text-red-500" : "text-[#E8FF6B]"}`}>
              {isSoldOut ? "0 pieces left" : `${product.stockQuantity} pieces left`}
            </span>
          </div>

          {isSoldOut ? (
            <button 
              disabled
              className="px-3.5 py-2 bg-zinc-200 dark:bg-zinc-900 text-zinc-400 dark:text-zinc-600 font-extrabold text-xs uppercase tracking-widest cursor-not-allowed"
            >
              SOLD OUT
            </button>
          ) : (
            <button
              onClick={() => onPreview(product)}
              className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black hover:bg-[#E8FF6B] hover:text-black dark:hover:bg-[#E8FF6B] dark:hover:text-black font-extrabold text-xs uppercase tracking-widest transition-all cursor-pointer"
            >
              SELECT SIZE
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
