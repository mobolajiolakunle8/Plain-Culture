import React from "react";
import { useSettings } from "../context/AppContext";
import { MessageCircle, ArrowLeft, Clock, Wrench } from "lucide-react";

interface MaintenancePageProps {
  onNavigateToHome: () => void;
}

export const MaintenancePage: React.FC<MaintenancePageProps> = ({ onNavigateToHome }) => {
  const s = useSettings();
  const whatsappNumber = (s.maintenanceWhatsApp || s.phone || "+2348088171549").replace(/\+/g, "");

  const message = encodeURIComponent(
    `Hello Plain Culture,\n\nI'd like to place a manual/local order while the website is under maintenance.\n\nPlease advise on delivery options and rates.`
  );

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center">
            <Wrench className="w-10 h-10 text-[#E8FF6B]" />
          </div>
        </div>

        <h1 className="text-3xl font-black uppercase tracking-[3px] mb-2">Site Under Maintenance</h1>
        <p className="text-zinc-400 text-sm mb-8">
          We’re currently performing updates to improve your experience.<br />
          You can still place orders manually via WhatsApp.
        </p>

        <a
          href={`https://wa.me/${whatsappNumber}?text=${message}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-3 w-full bg-[#E8FF6B] hover:bg-[#d4e85f] text-black font-extrabold uppercase tracking-[2px] py-4 rounded-sm transition-all active:scale-[0.985]"
        >
          <MessageCircle className="w-5 h-5" />
          <span>Place Order via WhatsApp</span>
        </a>

        <button
          onClick={onNavigateToHome}
          className="mt-4 inline-flex items-center gap-2 text-xs uppercase tracking-[2px] text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to homepage
        </button>

        <div className="mt-10 pt-6 border-t border-zinc-800 text-[10px] text-zinc-500 flex flex-col items-center gap-1">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3" /> <span>Expected downtime: ~30 minutes</span>
          </div>
          <div>Thank you for your patience.</div>
        </div>
      </div>
    </div>
  );
};
