import React, { useState, useEffect } from "react";
import { AppProvider, useSettings } from "./context/AppContext";
import { dbService, Product } from "./lib/firebase";
import { Navbar } from "./components/Navbar";
import { HeroSection } from "./components/HeroSection";
import { ProductCard } from "./components/ProductCard";
import { ProductDetailModal } from "./components/ProductDetailModal";
import { CartAndCheckoutDrawer } from "./components/CartAndCheckoutDrawer";
import { AdminDashboard } from "./components/AdminDashboard";
import { Footer } from "./components/Footer";
import { ReturnPolicyPage } from "./components/ReturnPolicyPage";
import { OrderTrackingPage } from "./components/OrderTrackingPage";
import { MaintenancePage } from "./components/MaintenancePage";
import { ToastContainer, ToastMessage } from "./components/Toast";
import { InstallPrompt } from "./components/InstallPrompt";
import { AiAssistant } from "./components/AiAssistant";
import { Sparkles, Cpu, RefreshCw, Layers, Compass } from "lucide-react";

// Inner core of the application to gain access to Cart state and contexts safely
const StorefrontContent: React.FC = () => {
  const settings = useSettings();
  // Navigation Routing — detect ?admin=true in URL for secret admin access
  const [currentView, setCurrentView] = useState<"home" | "admin" | "return-policy" | "track-order" | "maintenance">(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("admin") === "true" ? "admin" : "home";
  });

  // Interactive UI state
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Real-time live products list
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Custom Toast state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (text: string, type: "success" | "error" | "info") => {
    const newToast: ToastMessage = {
      id: Math.random().toString(36).substring(2, 9),
      text,
      type
    };
    setToasts((prev) => [...prev, newToast]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Real-time listener for available public products
  useEffect(() => {
    const unsubscribe = dbService.subscribeProducts((pList) => {
      setProducts(pList);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filter public catalog to only show active products
  const activeProducts = products.filter((p) => p.isActive);

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-black text-black dark:text-zinc-100 transition-colors duration-300">
      
      {/* Navigation Bar */}
      <Navbar 
        onOpenCart={() => setIsCartOpen(true)}
        onNavigateToHome={() => {
          setCurrentView("home");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />

      {/* MAINTENANCE MODE (global) — shown to non-admins when enabled */}
      {settings.maintenanceMode && currentView !== "admin" ? (
        <div className="flex-grow animate-fade-in">
          <MaintenancePage 
            onNavigateToHome={() => {
              setCurrentView("home");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </div>
      ) : currentView === "maintenance" ? (
        <div className="flex-grow animate-fade-in">
          <MaintenancePage 
            onNavigateToHome={() => {
              setCurrentView("home");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </div>
      ) : currentView === "return-policy" ? (
        <div className="flex-grow animate-fade-in">
          <ReturnPolicyPage 
            onNavigateBack={() => {
              setCurrentView("home");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </div>
      ) : currentView === "track-order" ? (
        <div className="flex-grow animate-fade-in">
          <OrderTrackingPage 
            onNavigateToHome={() => {
              setCurrentView("home");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </div>
      ) : currentView === "admin" ? (
        <div className="flex-grow animate-fade-in">
          <AdminDashboard 
            onAddToast={addToast} 
            onNavigateToHome={() => setCurrentView("home")} 
          />
        </div>
      ) : (
        // RENDER VIEW: CUSTOMER FACING WEBSITE
        <main className="flex-grow flex flex-col">
          
          {/* High-fashion Hero campaign section */}
          <HeroSection 
            onShopClick={() => {
              const element = document.getElementById("active-drop-grid");
              element?.scrollIntoView({ behavior: "smooth" });
            }}
          />

          {/* Core Product Catalog Grid */}
          <section id="active-drop-grid" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="w-2.5 h-2.5 bg-[#E8FF6B] rounded-full animate-ping" />
                  <span className="text-xs uppercase font-extrabold tracking-[0.25em] text-[#E8FF6B]">
                    LIVE DROP FEED
                  </span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-zinc-900 dark:text-white">
                  COLLECTION 01: RAW & STRUCTURED
                </h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-450 mt-1 max-w-xl font-light">
                  Explore our carefully calibrated, heavy cotton blanks engineered for beautiful silhouettes and durable daily wear in Ibadan's dynamic cityscape.
                </p>
              </div>

              <div className="text-right self-start md:self-auto text-xs text-zinc-400 uppercase tracking-widest bg-zinc-100 dark:bg-zinc-950 p-3 rounded-sm border border-zinc-200 dark:border-zinc-900">
                <span>Free dispatch delivery within Ibadan</span>
              </div>
            </div>

            {isLoading ? (
              // Loading Skeleton loader
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="border border-zinc-200 dark:border-zinc-900 rounded-sm p-4 animate-pulse space-y-4">
                    <div className="aspect-square bg-zinc-200 dark:bg-zinc-900 rounded-sm" />
                    <div className="h-4 bg-zinc-200 dark:bg-zinc-900 rounded w-2/3" />
                    <div className="h-4 bg-zinc-200 dark:bg-zinc-900 rounded w-1/3" />
                  </div>
                ))}
              </div>
            ) : activeProducts.length === 0 ? (
              // Empty list state fallback
              <div className="text-center py-20 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-sm">
                <Compass className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
                <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-sm mx-auto">
                  All pieces of the current drop have been successfully claimed. Sign in as Admin to add more items or refresh stock counters!
                </p>
                <button
                  onClick={() => setCurrentView("admin")}
                  className="mt-6 px-5 py-2.5 bg-black dark:bg-white text-white dark:text-black font-extrabold text-xs uppercase tracking-widest hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Configure Drop as Admin
                </button>
              </div>
            ) : (
              // Product Cards Grid
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {activeProducts.map((prod) => (
                  <ProductCard 
                    key={prod.id} 
                    product={prod} 
                    onPreview={(p) => setSelectedProduct(p)}
                    onAddToast={addToast}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Brand Manifesto / Philosophy block */}
          <section id="brand-manifesto" className="bg-zinc-950 text-white py-24 border-t border-zinc-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                
                {/* Manifesto Left block */}
                <div className="space-y-6">
                  <div className="inline-flex items-center gap-2 text-[#E8FF6B] text-xs font-black tracking-[0.2em] uppercase">
                    <Sparkles className="w-4 h-4 animate-spin" />
                    <span>ENGINEERED IN NIGERIA</span>
                  </div>
                  
                  <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight leading-tight">
                    {settings.manifestoTitle}
                  </h2>

                  <p className="text-zinc-300 text-sm font-light leading-relaxed">
                    {settings.manifestoText1}
                  </p>

                  <p className="text-zinc-300 text-sm font-light leading-relaxed">
                    {settings.manifestoText2}
                  </p>

                  {/* Icon Specs Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6">
                    <div className="space-y-2 border-l border-zinc-800 pl-4">
                      <Cpu className="w-5 h-5 text-[#E8FF6B]" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-white">280GSM WEAVE</h4>
                      <p className="text-[11px] text-zinc-400">Heavier cotton composition holding a permanent elegant form.</p>
                    </div>

                    <div className="space-y-2 border-l border-zinc-800 pl-4">
                      <Layers className="w-5 h-5 text-[#E8FF6B]" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-white">PRE-SHRUNK</h4>
                      <p className="text-[11px] text-zinc-400">Treated with hot steam to prevent shrinkage during local washes.</p>
                    </div>

                    <div className="space-y-2 border-l border-zinc-800 pl-4">
                      <RefreshCw className="w-5 h-5 text-[#E8FF6B]" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-white">BOX FIT</h4>
                      <p className="text-[11px] text-zinc-400">Carefully designed slightly wide, short-cut premium street drapes.</p>
                    </div>
                  </div>
                </div>

                 {/* Manifesto Editorial Image (Right block) - supports custom responsive uploads */}
                <div className="relative aspect-square sm:aspect-[4/3] lg:aspect-square bg-zinc-900 rounded-sm overflow-hidden border border-zinc-850 group">
                  <picture>
                    <source media="(max-width: 768px)" srcSet={settings.manifestoImageMobile || "/images/hero.jpg"} />
                    <img
                      src={settings.manifestoImageDesktop || "/images/hero.jpg"}
                      alt="Plain Culture Streetwear Detail"
                      className="w-full h-full object-cover object-center opacity-85 transition-transform duration-1000 group-hover:scale-105"
                    />
                  </picture>
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                  
                  <div className="absolute bottom-6 left-6 right-6 space-y-1.5">
                    <span className="text-[10px] font-black tracking-widest text-[#E8FF6B] uppercase">{settings.dropInspirationTag}</span>
                    <h3 className="text-lg font-extrabold uppercase text-white">{settings.dropInspirationTitle}</h3>
                    <p className="text-xs text-zinc-400 font-light">
                      {settings.dropInspirationText}
                    </p>
                  </div>
                </div>

              </div>
            </div>
          </section>

            {/* Trust factors badge bar */}
          <section className="bg-zinc-50 dark:bg-zinc-950 py-12 border-t border-b border-zinc-200 dark:border-zinc-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
              <div>
                <span className="block text-lg font-black text-black dark:text-white uppercase tracking-wider">{settings.trustFactor1Title}</span>
                <span className="text-xs text-zinc-500">{settings.trustFactor1Subtitle}</span>
              </div>
              <div className="border-t sm:border-t-0 sm:border-l sm:border-r border-zinc-200 dark:border-zinc-850 py-6 sm:py-0">
                <span className="block text-lg font-black text-black dark:text-white uppercase tracking-wider">{settings.trustFactor2Title}</span>
                <span className="text-xs text-zinc-500">{settings.trustFactor2Subtitle}</span>
              </div>
              <div>
                <span className="block text-lg font-black text-black dark:text-white uppercase tracking-wider">{settings.trustFactor3Title}</span>
                <span className="text-xs text-zinc-500">{settings.trustFactor3Subtitle}</span>
              </div>
            </div>
          </section>

        </main>
      )}

      {/* Persistent global layout Footer */}
      <Footer 
        onNavigateToReturnPolicy={() => {
          setCurrentView("return-policy");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        onNavigateToTrackOrder={() => {
          setCurrentView("track-order");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />

      {/* POPUP MODAL: PRODUCT DETAILS & ADD-TO-CART SIZE SELECTOR */}
      {selectedProduct && (
        <ProductDetailModal 
          product={selectedProduct} 
          onClose={() => setSelectedProduct(null)} 
          onAddToast={addToast}
        />
      )}

      {/* SLIDE-OUT DRAWER: SHOPPING BAG & INTEGRATED CHECKOUT */}
      <CartAndCheckoutDrawer 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        onAddToast={addToast}
      />

      {/* GLOBAL NOTIFICATION TOAST POPPER */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* PWA Install Prompt */}
      <InstallPrompt />

      {/* Nigerian AI Shopping Assistant */}
      <AiAssistant />

    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <StorefrontContent />
    </AppProvider>
  );
}
