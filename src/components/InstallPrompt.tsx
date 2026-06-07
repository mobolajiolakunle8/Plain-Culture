import React, { useState, useEffect } from "react";
import { Download, X, Smartphone } from "lucide-react";

export const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already dismissed this session
    if (sessionStorage.getItem("pc_install_dismissed")) {
      setDismissed(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show our custom prompt after a short delay (don't interrupt browsing immediately)
      setTimeout(() => setShowPrompt(true), 5000);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    
    if (result.outcome === "accepted") {
      console.log("PWA installed!");
    }
    
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    sessionStorage.setItem("pc_install_dismissed", "true");
  };

  if (!showPrompt || dismissed || !deferredPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-slide-in sm:left-auto sm:right-4 sm:max-w-sm">
      <div className="bg-black border border-zinc-800 rounded-sm p-4 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-[#E8FF6B]/15 rounded-sm flex items-center justify-center shrink-0">
            <Smartphone className="w-5 h-5 text-[#E8FF6B]" />
          </div>
          
          <div className="flex-1">
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              Install Plain Culture
            </h3>
            <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
              Add to your home screen for instant access. No app store needed.
            </p>
            
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleInstall}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#E8FF6B] text-black font-extrabold text-[10px] uppercase tracking-widest rounded-sm cursor-pointer hover:opacity-90 transition-opacity"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install</span>
              </button>
              <button
                onClick={handleDismiss}
                className="px-3 py-2 bg-zinc-900 text-zinc-400 font-bold text-[10px] uppercase tracking-widest rounded-sm cursor-pointer hover:text-white transition-colors"
              >
                Not Now
              </button>
            </div>
          </div>
          
          <button
            onClick={handleDismiss}
            className="text-zinc-600 hover:text-zinc-400 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
