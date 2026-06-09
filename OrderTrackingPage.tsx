import React from "react";
import { useSettings } from "../context/AppContext";
import { Sparkles } from "lucide-react";

export const Marquee: React.FC = () => {
  const settings = useSettings();

  if (!settings.marqueeEnabled || !settings.marqueeText.trim()) return null;

  // Repeat content for seamless infinite scroll effect
  const marqueeContent = (
    <>
      <Sparkles className="w-3.5 h-3.5 shrink-0" />
      <span>{settings.marqueeText}</span>
      <span className="px-3">•</span>
    </>
  );

  return (
    <div className="bg-[#E8FF6B] text-black overflow-hidden border-b border-[#d0e54d] relative">
      <div className="flex whitespace-nowrap py-2 animate-marquee text-[11px] font-bold tracking-[0.2em] uppercase">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex items-center gap-2 px-2 shrink-0">
            {marqueeContent}
          </div>
        ))}
      </div>
    </div>
  );
};
