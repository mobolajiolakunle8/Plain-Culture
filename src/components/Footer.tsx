import React from "react";
import { useSettings } from "../context/AppContext";
import { MessageSquare, Mail, MapPin, Sparkles, LogIn } from "lucide-react";

interface FooterProps {
  onNavigateToAdmin: () => void;
  onNavigateToReturnPolicy: () => void;
  onNavigateToTrackOrder: () => void;
}



export const Footer: React.FC<FooterProps> = ({ onNavigateToAdmin, onNavigateToReturnPolicy, onNavigateToTrackOrder }) => {
  const s = useSettings();
  const rawPhone = s.phone.replace(/\+/g, "");

  return (
    <footer className="bg-black text-white border-t border-zinc-900 pt-16 pb-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Brand visual grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">

          {/* Col 1–2: Brand Pitch */}
          <div className="space-y-5 md:col-span-2">
            <h3 className="font-black text-2xl tracking-[0.25em] text-[#E8FF6B]">
              {s.brandName}
            </h3>
            <p className="text-zinc-400 text-xs tracking-wider uppercase">
              Heavyweight Blanks • Curated Design • Raw Character
            </p>
            <p className="text-zinc-500 text-xs font-light leading-relaxed max-w-sm">
              {s.footerBrandDescription}
            </p>
            <div className="flex items-center gap-1.5 text-zinc-400 text-xs">
              <MapPin className="w-4 h-4 text-[#E8FF6B] shrink-0" />
              <span>{s.physicalAddress}</span>
            </div>
          </div>

          {/* Col 3: Contact channels */}
          <div className="space-y-4">
            <h4 className="text-xs font-black tracking-widest text-[#E8FF6B] uppercase">CONTACT</h4>
            <ul className="space-y-3.5 text-xs text-zinc-400">
              <li>
                <a
                  href={`https://wa.me/${rawPhone}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[#E8FF6B] flex items-center gap-2 transition-colors"
                >
                  <MessageSquare className="w-4 h-4 text-zinc-500 shrink-0" />
                  <span>WhatsApp Concierge</span>
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${s.email}`}
                  className="hover:text-[#E8FF6B] flex items-center gap-2 transition-colors"
                >
                  <Mail className="w-4 h-4 text-zinc-500 shrink-0" />
                  <span className="break-all">{s.email}</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Policies & Legal */}
          <div className="space-y-4">
            <h4 className="text-xs font-black tracking-widest text-[#E8FF6B] uppercase">POLICIES</h4>
            <ul className="space-y-3.5 text-xs text-zinc-400">
              <li className="flex items-start gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-zinc-600 shrink-0 mt-0.5" />
                <span className="text-zinc-500 leading-relaxed">{s.dropPolicy}</span>
              </li>
              <li className="pt-2 border-t border-zinc-800">
                <button
                  onClick={onNavigateToReturnPolicy}
                  className="text-zinc-400 hover:text-[#E8FF6B] font-bold uppercase tracking-wider text-[10px] transition-colors cursor-pointer"
                >
                  ↳ View Full Return Policy
                </button>
              </li>
              <li>
                <button
                  onClick={onNavigateToTrackOrder}
                  className="text-zinc-400 hover:text-[#E8FF6B] font-bold uppercase tracking-wider text-[10px] transition-colors cursor-pointer"
                >
                  ↳ Track My Order
                </button>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-zinc-500 tracking-wider">
          <p className="text-center sm:text-left">
            © {new Date().getFullYear()} {s.brandName}. CO-ENGINEERED WITH CREATIVES IN IBADAN.
          </p>
          <div className="flex items-center gap-3 font-black text-zinc-400">
            <span>PREMIUM MINIMALIST APPAREL LAB</span>
            <span>•</span>
            <span className="text-[#E8FF6B]">NIGERIA</span>

            {/* Admin Login Icon - visible to all users */}
            <button
              onClick={onNavigateToAdmin}
              className="ml-2 p-2 rounded-full bg-zinc-900 hover:bg-[#E8FF6B] hover:text-black text-zinc-500 transition-all cursor-pointer border border-zinc-800 hover:border-[#E8FF6B] group"
              title="Admin Login"
              aria-label="Admin Login"
            >
              <LogIn className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
};
