import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AppContext";
import { X, User } from "lucide-react";

interface WelcomeBackCustomerProps {
  onNavigateToAccount: () => void;
}

export const WelcomeBackCustomer: React.FC<WelcomeBackCustomerProps> = ({ onNavigateToAccount }) => {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!user || user.role !== "Customer") return;
    const key = `pc_customer_seen_${user.email.toLowerCase()}`;
    const sessionKey = `pc_customer_welcome_shown_${user.email.toLowerCase()}`;

    const hasSeenBefore = localStorage.getItem(key) === "true";
    const shownThisSession = sessionStorage.getItem(sessionKey) === "true";

    if (hasSeenBefore && !shownThisSession) {
      const timer = setTimeout(() => {
        setVisible(true);
        sessionStorage.setItem(sessionKey, "true");
      }, 1200);
      return () => clearTimeout(timer);
    }

    if (!hasSeenBefore) {
      localStorage.setItem(key, "true");
    }
  }, [user]);

  if (!visible || !user || user.role !== "Customer") return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[90] sm:left-auto sm:right-4 sm:max-w-sm animate-slide-in">
      <div className="bg-black border border-zinc-800 text-white rounded-lg p-4 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-[#E8FF6B] text-black flex items-center justify-center shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider">Welcome back, {user.name || "friend"}!</h3>
                <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                  Your account is ready. You can check your order history any time from your customer dashboard.
                </p>
              </div>
              <button onClick={() => setVisible(false)} className="text-zinc-500 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={() => {
                setVisible(false);
                onNavigateToAccount();
              }}
              className="mt-3 px-4 py-2 bg-[#E8FF6B] text-black text-[10px] font-extrabold uppercase tracking-widest rounded-sm hover:opacity-90 cursor-pointer"
            >
              Open My Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
