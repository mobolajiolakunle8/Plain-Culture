import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AppContext";
import { dbService, Product } from "../lib/firebase";
import { ArrowLeft, Heart, ShoppingBag, Trash2, Smartphone, LogIn, AlertCircle } from "lucide-react";

interface WishlistPageProps {
  onNavigateToHome: () => void;
  onPreview: (product: Product) => void;
  onAddToast: (text: string, type: "success" | "error" | "info") => void;
}

export const WishlistPage: React.FC<WishlistPageProps> = ({ 
  onNavigateToHome, 
  onPreview,
  onAddToast 
}) => {
  const { user, signInWithGoogle } = useAuth();
  const [wishlistItems, setWishlistItems] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const wishlistKey = user ? `pc_wishlist_${user.email.toLowerCase()}` : "pc_wishlist_guest";

  useEffect(() => {
    const loadWishlist = async () => {
      setIsLoading(true);
      try {
        const savedIds = JSON.parse(localStorage.getItem(wishlistKey) || "[]");
        if (savedIds.length === 0) {
          setWishlistItems([]);
        } else {
          const allProducts = await dbService.getProducts();
          const items = allProducts.filter(p => savedIds.includes(p.id));
          setWishlistItems(items);
        }
      } catch (e) {
        console.error("Failed to load wishlist", e);
      }
      setIsLoading(false);
    };

    loadWishlist();
  }, [wishlistKey]);

  const removeFromWishlist = (productId: string) => {
    const savedIds = JSON.parse(localStorage.getItem(wishlistKey) || "[]");
    const updatedIds = savedIds.filter((id: string) => id !== productId);
    localStorage.setItem(wishlistKey, JSON.stringify(updatedIds));
    setWishlistItems(prev => prev.filter(p => p.id !== productId));
    onAddToast("Removed from wishlist", "info");
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white py-12 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <button
              onClick={onNavigateToHome}
              className="flex items-center gap-2 text-zinc-500 hover:text-[#E8FF6B] text-xs font-bold uppercase tracking-widest mb-4 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Catalog
            </button>
            <div className="flex items-center gap-3">
              <Heart className="w-8 h-8 text-[#E8FF6B] fill-[#E8FF6B]" />
              <h1 className="text-4xl font-black uppercase tracking-tight">Your Wishlist</h1>
            </div>
            <p className="text-zinc-500 mt-2 text-sm uppercase tracking-wider font-medium">
              Saved pieces from the current drop
            </p>
          </div>

          {!user && (
            <div className="bg-zinc-100 dark:bg-zinc-900 p-4 rounded-sm border border-zinc-200 dark:border-zinc-800 flex items-center gap-4">
              <div className="shrink-0 p-2 bg-[#E8FF6B]/10 rounded-full">
                <Smartphone className="w-5 h-5 text-[#E8FF6B]" />
              </div>
              <div>
                <p className="text-xs font-bold text-black dark:text-white uppercase tracking-tight">Save your wishlist permanently</p>
                <button 
                  onClick={() => signInWithGoogle()}
                  className="text-[10px] text-[#E8FF6B] font-black uppercase tracking-widest hover:underline mt-1 flex items-center gap-1"
                >
                  <LogIn className="w-3 h-3" /> Sign in with Google
                </button>
              </div>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(n => (
              <div key={n} className="h-96 bg-zinc-100 dark:bg-zinc-900 animate-pulse rounded-sm" />
            ))}
          </div>
        ) : wishlistItems.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-900 rounded-sm">
            <ShoppingBag className="w-12 h-12 mx-auto text-zinc-300 dark:text-zinc-800 mb-4" />
            <h2 className="text-xl font-bold uppercase text-zinc-400">Your wishlist is empty</h2>
            <p className="text-zinc-500 text-sm mt-2 mb-8">Save items here while you decide on your next fit.</p>
            <button
              onClick={onNavigateToHome}
              className="px-8 py-3 bg-[#E8FF6B] text-black font-black uppercase tracking-widest text-xs hover:opacity-90 transition-opacity cursor-pointer"
            >
              Explore Collection
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {wishlistItems.map((product) => {
              const lowStock = product.stockQuantity > 0 && product.stockQuantity <= 3;
              return (
                <div key={product.id} className="group relative bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 overflow-hidden">
                  <div className="relative aspect-square overflow-hidden cursor-pointer" onClick={() => onPreview(product)}>
                    <img 
                      src={product.images[0]} 
                      alt={product.name} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                    />
                    {product.stockQuantity <= 0 && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="bg-red-600 text-white text-[10px] font-black px-3 py-1.5 uppercase tracking-widest">Sold Out</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-sm uppercase tracking-wide truncate pr-4">{product.name}</h3>
                      <button 
                        onClick={() => removeFromWishlist(product.id)}
                        className="text-zinc-400 hover:text-red-500 transition-colors cursor-pointer"
                        title="Remove from wishlist"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <p className="font-black text-lg mb-4">₦{product.price.toLocaleString()}</p>
                    
                    {lowStock && (
                      <div className="flex items-center gap-1.5 text-amber-500 text-[10px] font-bold uppercase mb-4 animate-pulse">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Only {product.stockQuantity} pieces remaining</span>
                      </div>
                    )}

                    <button
                      onClick={() => onPreview(product)}
                      disabled={product.stockQuantity <= 0}
                      className="w-full py-3 bg-black dark:bg-white text-white dark:text-black font-black uppercase tracking-widest text-[10px] hover:bg-[#E8FF6B] hover:text-black transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {product.stockQuantity <= 0 ? "Unavailable" : "Select Size & Add"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
