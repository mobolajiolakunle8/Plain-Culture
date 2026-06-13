import React from "react";
import { useSettings } from "../context/AppContext";
import { MessageSquare, Mail, MapPin, Sparkles } from "lucide-react";

interface FooterProps {
  onNavigateToReturnPolicy: () => void;
  onNavigateToTrackOrder: () => void;
}



export const Footer: React.FC<FooterProps> = ({ onNavigateToReturnPolicy, onNavigateToTrackOrder }) => {
  const s = useSettings();
  const rawPhone = s.phone.replace(/\+/g, "");

  const normalizeHandle = (value: string = "") => value.trim().replace(/^@/, "");
  const socialLinks = [
    {
      key: "instagram",
      label: "Instagram",
      value: s.instagramHandle,
      href: `https://instagram.com/${normalizeHandle(s.instagramHandle)}`,
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163S15.403 8.001 12 8.001zm0 10.162c-2.209 0-4-1.79-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4z" />
        </svg>
      )
    },
    {
      key: "twitter",
      label: "Twitter / X",
      value: s.twitterHandle,
      href: `https://twitter.com/${normalizeHandle(s.twitterHandle)}`,
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      )
    },
    {
      key: "tiktok",
      label: "TikTok",
      value: s.tiktokHandle,
      href: `https://tiktok.com/@${normalizeHandle(s.tiktokHandle)}`,
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.84-.1z" />
        </svg>
      )
    },
    {
      key: "facebook",
      label: "Facebook",
      value: s.facebookHandle,
      href: `https://facebook.com/${normalizeHandle(s.facebookHandle)}`,
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M22.675 0h-21.35C.593 0 0 .593 0 1.325v21.351C0 23.407.593 24 1.325 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116c.73 0 1.323-.593 1.323-1.325V1.325C24 .593 23.407 0 22.675 0z" />
        </svg>
      )
    }
  ].filter((item) => item.value && item.value.trim());

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
            {socialLinks.length > 0 && (
              <div className="flex items-center gap-2 pt-1">
                {socialLinks.map((social) => (
                  <a
                    key={social.key}
                    href={social.href}
                    target="_blank"
                    rel="noreferrer"
                    title={social.label}
                    aria-label={social.label}
                    className="w-9 h-9 flex items-center justify-center rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:bg-[#E8FF6B] hover:text-black hover:border-[#E8FF6B] transition-all duration-200 cursor-pointer"
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            )}
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


          </div>
        </div>

      </div>
    </footer>
  );
};
