import React, { useState, useEffect } from "react";
import { Sparkles, ArrowRight, MapPin, Zap } from "lucide-react";
import { useSettings } from "../context/AppContext";

interface HeroSectionProps {
  onShopClick: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onShopClick }) => {
  const settings = useSettings();
  
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    expired: false
  });

  useEffect(() => {
    // Use the admin-editable drop end date
    const target = new Date(settings.dropEndDate);

    const tick = () => {
      const now = new Date();
      const diff = target.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true });
        return;
      }

      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / 1000 / 60) % 60);
      const s = Math.floor((diff / 1000) % 60);

      setTimeLeft({ days: d, hours: h, minutes: m, seconds: s, expired: false });
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [settings.dropEndDate]);

  return (
    <section className="relative w-full overflow-hidden bg-black text-white">
      {/* Visual background wrapper - responsive desktop vs mobile imagery */}
      <div className="absolute inset-0 z-0">
        <picture>
          <source media="(max-width: 768px)" srcSet={settings.heroImageMobile || "/images/hero.jpg"} />
          <img
            src={settings.heroImageDesktop || "/images/hero.jpg"}
            alt="Plain Culture Streetwear Editorial"
            className="w-full h-full object-cover opacity-45 dark:opacity-35 scale-105 transition-all duration-1000"
          />
        </picture>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/70" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 flex flex-col items-center text-center">
        {/* Brand tag */}
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-900/90 border border-zinc-800 rounded-full text-xs font-semibold uppercase tracking-widest text-[#E8FF6B] mb-8 shadow-sm">
          <Sparkles className="w-3.5 h-3.5" />
          <span>ESTABLISHED IN IBADAN • NIGERIA</span>
        </div>

        {/* Brand Headline (fully dynamic from Admin settings) */}
        <h1 className="text-4xl sm:text-6xl lg:text-8xl font-black tracking-tight leading-none uppercase mb-6 max-w-5xl whitespace-pre-line text-transparent bg-clip-text bg-gradient-to-r from-white via-[#E8FF6B] to-zinc-400">
          {settings.heroTitle}
        </h1>

        {/* Sub-headline / Manifesto (fully dynamic from Admin settings) */}
        <p className="text-base sm:text-lg md:text-xl text-zinc-300 font-light max-w-2xl tracking-wide leading-relaxed mb-10">
          {settings.heroSubtitle}
        </p>

        {/* Scarcity countdown panel - only visible if admin enabled it */}
        {settings.countdownEnabled && (
          <div className="w-full max-w-lg bg-zinc-950/85 backdrop-blur-md border border-zinc-800 rounded-sm p-5 mb-12 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
              <span className="text-xs font-bold tracking-[0.2em] text-zinc-400 uppercase flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-[#E8FF6B] animate-pulse" />
                {timeLeft.expired ? "DROP ENDED" : "DROP CLOSES IN"}
              </span>
              <span className="text-[10px] font-bold text-[#E8FF6B] uppercase tracking-[0.1em] px-2 py-0.5 bg-[#E8FF6B]/10 rounded">
                {timeLeft.expired ? "RESTOCK SOON" : "LAST PIECES REMAINING"}
              </span>
            </div>
            
            {timeLeft.expired ? (
              <div className="py-6 text-center">
                <p className="text-2xl font-black text-[#E8FF6B] tracking-wider">DROP CLOSED</p>
                <p className="text-xs text-zinc-400 mt-1 uppercase tracking-widest">Sign up for next drop notifications</p>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <span className="block text-2xl sm:text-4xl font-extrabold tracking-tight text-[#E8FF6B]">
                    {String(timeLeft.days).padStart(2, "0")}
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">DAYS</span>
                </div>
                <div className="text-center">
                  <span className="block text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
                    {String(timeLeft.hours).padStart(2, "0")}
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">HOURS</span>
                </div>
                <div className="text-center">
                  <span className="block text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
                    {String(timeLeft.minutes).padStart(2, "0")}
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">MINS</span>
                </div>
                <div className="text-center col-span-1">
                  <span className="block text-2xl sm:text-4xl font-extrabold tracking-tight text-[#E8FF6B] transition-all">
                    {String(timeLeft.seconds).padStart(2, "0")}
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">SECS</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* CTA Actions */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center w-full">
          <button
            onClick={onShopClick}
            className="w-full sm:w-auto px-8 py-4 bg-[#E8FF6B] hover:bg-[#d0e54d] text-black font-extrabold uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <span>SHOP ACTIVE DROP</span>
            <ArrowRight className="w-4.5 h-4.5" />
          </button>
          
          <button
            onClick={() => {
              const element = document.getElementById("brand-manifesto");
              element?.scrollIntoView({ behavior: "smooth" });
            }}
            className="w-full sm:w-auto px-8 py-4 bg-zinc-900 hover:bg-zinc-800 text-white font-bold uppercase tracking-[0.2em] text-xs border border-zinc-800 transition-colors cursor-pointer"
          >
            EXPLORE BRAND MANIFESTO
          </button>
        </div>

        {/* Ibadan Localized micro footer */}
        <div className="mt-14 flex items-center gap-2 text-zinc-500 text-xs tracking-wider">
          <MapPin className="w-3.5 h-3.5 text-zinc-600" />
          <span>Curated, packaged & hand-delivered from Ibadan, Oyo State</span>
        </div>
      </div>
    </section>
  );
};
