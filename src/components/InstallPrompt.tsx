import React, { useState, useEffect } from "react";
import { Download, X, Share2, Smartphone } from "lucide-react";

export const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // 1. Detect if already installed (running in standalone mode)
    const isStandaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as any).standalone;
    setIsStandalone(isStandaloneMode);
    if (isStandaloneMode) return;

    // 2. Check if user already dismissed this session
    if (sessionStorage.getItem("pc_install_dismissed")) return;

    // 3. Detect iOS (iPhone/iPad/iPod)
    const isIosDevice =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIosDevice);

    if (!isIosDevice) {
      // Android/Desktop: Listen for the install prompt event
      const handler = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setTimeout(() => setShowPrompt(true), 3000);
      };
      window.addEventListener("beforeinstallprompt", handler);
      return () => window.removeEventListener("beforeinstallprompt", handler);
    } else {
      // iOS: Show manual instructions after 3 seconds (Safari blocks auto-install)
      setTimeout(() => setShowPrompt(true), 3000);
    }
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      console.log("PWA installed!");
    }
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem("pc_install_dismissed", "true");
  };

  // Don't show if already installed
  if (isStandalone) return null;
  // Don't show if Android has no install capability yet
  if (!isIOS && !deferredPrompt) return null;
  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[100] animate-slide-in sm:left-auto sm:right-4 sm:max-w-sm">
      <div className="bg-zinc-900 border border-zinc-800 text-white rounded-lg p-4 shadow-2xl flex flex-col gap-3">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="bg-[#E8FF6B] text-black p-2 rounded-md shrink-0">
              <Smartphone size={20} />
            </div>
            <div>
              <h3 className="font-bold text-sm uppercase tracking-wider">
                Install Plain Culture
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                {isIOS
                  ? "Add to Home Screen for app-like experience"
                  : "Install app for quick access"}
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-zinc-500 hover:text-white cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {isIOS ? (
          <div className="bg-zinc-800/50 p-3 rounded-md text-xs text-zinc-300 flex items-start gap-2">
            <Share2
              size={14}
              className="text-[#E8FF6B] mt-0.5 shrink-0"
            />
            <span>
              Tap the <strong>Share</strong> button{" "}
              <span className="inline-block mx-1">⎋</span> in Safari, scroll
              down, and tap <strong>"Add to Home Screen"</strong>.
            </span>
          </div>
        ) : (
          <button
            onClick={handleInstall}
            className="w-full bg-[#E8FF6B] text-black font-bold py-2 rounded-md text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer uppercase tracking-widest"
          >
            <Download size={16} /> Install App
          </button>
        )}
      </div>
    </div>
  );
};
