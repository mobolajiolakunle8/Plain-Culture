import React from "react";
import { useTheme, useCart, useSettings } from "../context/AppContext";
import { ShoppingBag, Sun, Moon } from "lucide-react";
import { Marquee } from "./Marquee";
import { LocationDetector } from "./LocationDetector";

interface NavbarProps {
  onOpenCart: () => void;
  onNavigateToHome: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  onOpenCart, 
  onNavigateToHome
}) => {
  const { theme, toggleTheme } = useTheme();
  const { cartCount, cartTotal } = useCart();
  const settings = useSettings();

  return (
    <header className="sticky top-0 z-40 w-full bg-white dark:bg-black border-b border-zinc-200 dark:border-zinc-900 transition-colors duration-300">
      {/* Scrolling Marquee Banner (editable from Admin) */}
      <Marquee />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo - supports dual-mode image, text fallback, or BOTH simultaneously */}
        <button 
          onClick={onNavigateToHome}
          className="flex items-center gap-3.5 text-left cursor-pointer group"
        >
          {/* 1. Image Logo (if uploaded) */}
          {(theme === "dark" && settings.logoUrlDark) ? (
            <img 
              src={settings.logoUrlDark} 
              alt={settings.brandName}
              className="h-9 sm:h-11 max-w-[150px] object-contain transition-transform group-hover:scale-105"
            />
          ) : (theme === "light" && settings.logoUrlLight) ? (
            <img 
              src={settings.logoUrlLight} 
              alt={settings.brandName}
              className="h-9 sm:h-11 max-w-[150px] object-contain transition-transform group-hover:scale-105"
            />
          ) : settings.logoUrl ? (
            <img 
              src={settings.logoUrl} 
              alt={settings.brandName}
              className="h-9 sm:h-11 max-w-[150px] object-contain transition-transform group-hover:scale-105"
            />
          ) : null}

          {/* 2. Text Brand Title (if enabled OR no logo uploaded) */}
          {(settings.showLogoAndText || (!settings.logoUrlDark && !settings.logoUrlLight && !settings.logoUrl)) && (
            <div className="flex flex-col items-start border-l border-zinc-200 dark:border-zinc-800 pl-3.5 first:border-0 first:pl-0">
              <span className="font-extrabold text-lg sm:text-xl tracking-[0.25em] text-black dark:text-white uppercase transition-colors group-hover:text-[#E8FF6B]">
                {settings.brandName}
              </span>
              <span className="text-[8px] tracking-[0.4em] font-semibold text-zinc-500 uppercase">
                {settings.brandTagline}
              </span>
            </div>
          )}
        </button>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Location Detector */}
          <LocationDetector />

          {/* Theme Toggle Button (Dark/Light Mode) */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-300 transition-all cursor-pointer relative group"
            aria-label="Toggle Theme"
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5 text-[#E8FF6B] transition-transform group-hover:rotate-45" />
            ) : (
              <Moon className="w-5 h-5 text-zinc-900 transition-transform group-hover:-rotate-12" />
            )}
          </button>

          {/* Shopping Cart Trigger */}
          <button
            onClick={onOpenCart}
            className="flex items-center gap-2 px-3 py-2 bg-black dark:bg-white text-white dark:text-black rounded-sm hover:opacity-90 transition-opacity cursor-pointer shadow-sm relative"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="text-xs font-bold tracking-widest hidden sm:inline">
              ₦{cartTotal.toLocaleString()}
            </span>
            
            {/* Cart Count Badge */}
            <div className="bg-[#E8FF6B] text-black font-extrabold text-[10px] w-5 h-5 rounded-full flex items-center justify-center absolute -top-1.5 -right-1.5 shadow-md border-2 border-white dark:border-black animate-bounce">
              {cartCount}
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};
