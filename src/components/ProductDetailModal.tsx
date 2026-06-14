import React, { useState } from "react";
import { Product } from "../lib/firebase";
import { useCart } from "../context/AppContext";
import { X, Sparkles, Check, ShieldAlert } from "lucide-react";

interface ProductDetailModalProps {
  product: Product;
  onClose: () => void;
  onAddToast: (text: string, type: "success" | "error" | "info") => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ 
  product, 
  onClose,
  onAddToast
}) => {
  const { addToCart } = useCart();
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [activeImage, setActiveImage] = useState<string>(product.images[0] || "/images/tee_onyx.jpg");
  const isSoldOut = product.stockQuantity <= 0;

  const handleAddToCart = () => {
    if (!selectedSize) {
      onAddToast("Please select a size to continue.", "error");
      return;
    }
    
    addToCart(product, selectedSize);
    onAddToast(`Added ${product.name} (Size ${selectedSize}) to cart!`, "success");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity" 
      />

      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-6 md:p-10">
        <div className="relative transform overflow-hidden rounded-sm bg-white dark:bg-zinc-950 text-left align-middle shadow-2xl transition-all w-full max-w-4xl border border-zinc-200 dark:border-zinc-900 grid grid-cols-1 md:grid-cols-2">
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 text-zinc-400 hover:text-black dark:hover:text-white bg-zinc-100 dark:bg-zinc-900 rounded-full transition-colors cursor-pointer"
            aria-label="Close Modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Left Side: Product Image Showcase */}
          <div className="relative aspect-square w-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
            <img
              src={activeImage}
              alt={product.name}
              className="w-full h-full object-cover object-center"
            />

            {product.images.length > 1 && (
              <div className="absolute left-4 right-4 top-4 flex gap-2 overflow-x-auto pb-1">
                {product.images.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    onClick={() => setActiveImage(image)}
                    className={`w-14 h-14 shrink-0 border-2 rounded-sm overflow-hidden bg-zinc-950/50 cursor-pointer transition-all ${
                      activeImage === image ? "border-[#E8FF6B] scale-105" : "border-white/30 hover:border-white"
                    }`}
                    title={`View image ${index + 1}`}
                  >
                    <img src={image} alt={`${product.name} view ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
            
            {/* Stamp Overlay */}
            <div className="absolute bottom-4 left-4 bg-black/80 text-white border border-zinc-800 p-2 flex items-center gap-1.5 rounded-sm">
              <Sparkles className="w-3.5 h-3.5 text-[#E8FF6B] animate-spin" />
              <span className="text-[9px] uppercase font-bold tracking-widest">
                Ibadan Limited Batch No. {Math.floor(product.price % 31 + 1)}
              </span>
            </div>
          </div>

          {/* Right Side: Product Customization & Details */}
          <div className="p-6 sm:p-8 flex flex-col justify-between">
            <div>
              {/* Collection header */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#E8FF6B] bg-[#E8FF6B]/15 px-2 py-0.5 rounded-sm">
                  DROP 01 ACTIVE
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">
                  Premium Streetwear
                </span>
              </div>

              {/* Title & Price */}
              <h2 className="text-xl sm:text-2xl font-black text-black dark:text-white uppercase tracking-wider mb-2">
                {product.name}
              </h2>
              
              <div className="text-xl sm:text-2xl font-extrabold text-[#E8FF6B] bg-black dark:bg-zinc-900 px-3 py-1.5 inline-block rounded-sm mb-6">
                ₦{product.price.toLocaleString()}
              </div>

              <div className="mb-5 inline-flex items-center gap-2 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3 py-2 rounded-sm">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Available Quantity:</span>
                <span className={`text-xs font-black uppercase tracking-wider ${isSoldOut ? "text-red-500" : "text-[#E8FF6B]"}`}>
                  {product.stockQuantity} piece{product.stockQuantity === 1 ? "" : "s"}
                </span>
              </div>

              {/* Description */}
              <div className="space-y-4 text-zinc-600 dark:text-zinc-300 text-sm leading-relaxed mb-6 font-light">
                <p>{product.description}</p>
                
                {/* Specs Box */}
                <div className="bg-zinc-100 dark:bg-zinc-900/50 p-4 rounded-sm text-xs space-y-2 border border-zinc-200/50 dark:border-zinc-900">
                  <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
                    <span className="font-semibold">Composition:</span>
                    <span>100% Combed Ringspun Cotton</span>
                  </div>
                  <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
                    <span className="font-semibold">Weight:</span>
                    <span>280GSM Heavyweight Jersey</span>
                  </div>
                  <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
                    <span className="font-semibold">Fit Style:</span>
                    <span>Boxy, slightly cropped, oversized drop shoulder</span>
                  </div>
                </div>
              </div>

              {/* Size Selector */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black uppercase tracking-wider text-black dark:text-white">
                    SELECT SIZE:
                  </span>
                  <span className="text-xs text-[#E8FF6B] font-bold">
                    * True to Size Oversized
                  </span>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  {["S", "M", "L", "XL"].map((size) => {
                    const isSizeAvailable = product.sizes.includes(size);
                    if (!isSizeAvailable) return null;

                    const sizeQty = product.sizeStock?.[size] ?? 0;
                    const isSizeSoldOut = sizeQty <= 0;

                    return (
                      <button
                        key={size}
                        onClick={() => !isSoldOut && !isSizeSoldOut && setSelectedSize(size)}
                        disabled={isSizeSoldOut}
                        className={`w-14 h-14 flex flex-col items-center justify-center font-bold text-sm tracking-wide transition-all border ${
                          isSizeSoldOut
                            ? "bg-zinc-200 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-800 text-zinc-400 cursor-not-allowed line-through"
                            : selectedSize === size
                              ? "bg-black text-white dark:bg-white dark:text-black border-black dark:border-white scale-105 cursor-pointer"
                              : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 hover:border-black dark:hover:border-zinc-400 cursor-pointer"
                        }`}
                      >
                        <span>{size}</span>
                        <span className={`text-[8px] font-bold ${isSizeSoldOut ? "text-red-400" : "text-[#E8FF6B]"}`}>
                          {isSizeSoldOut ? "OUT" : `${sizeQty}`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Scarcity / Stock Notification */}
              <div className="mb-8">
                {isSoldOut ? (
                  <div className="flex items-center gap-2 text-red-500 text-xs font-bold uppercase tracking-wider bg-red-500/10 p-3 border border-red-500/20 rounded-sm">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>SOLD OUT — All current drop units have been claimed.</span>
                  </div>
                ) : product.stockQuantity <= 5 ? (
                  <div className="flex items-center gap-2 text-amber-500 text-xs font-bold uppercase tracking-wider bg-amber-500/10 p-3 border border-amber-500/20 rounded-sm">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>LIMITED STOCK — Only {product.stockQuantity} pieces left in our Ibadan warehouse.</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-emerald-500 text-xs font-bold uppercase tracking-wider bg-emerald-500/10 p-3 border border-emerald-500/20 rounded-sm">
                    <Check className="w-4 h-4 shrink-0" />
                    <span>In Stock — Ships within 24 Hours.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Final Action Button */}
            <div>
              {isSoldOut ? (
                <button
                  disabled
                  className="w-full py-4 bg-zinc-200 dark:bg-zinc-900 text-zinc-400 dark:text-zinc-600 font-extrabold uppercase tracking-widest text-sm cursor-not-allowed text-center"
                >
                  SOLD OUT
                </button>
              ) : (
                <button
                  onClick={handleAddToCart}
                  className="w-full py-4 bg-black dark:bg-[#E8FF6B] text-white dark:text-black hover:opacity-90 font-extrabold uppercase tracking-[0.2em] text-sm transition-all cursor-pointer text-center"
                >
                  ADD TO DROP CART
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
