import React, { useState } from "react";
import { useCart, useSettings } from "../context/AppContext";
import { 
  X, ShoppingBag, Trash2, Plus, Minus, ArrowRight, 
  ShieldCheck, MapPin, Phone, Building2, Hash, User, 
  Copy, CheckCircle2, CreditCard, AlertCircle, Mail, Loader2
} from "lucide-react";
import { signInWithGoogle } from "../lib/firebase";

interface CartAndCheckoutDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToast: (text: string, type: "success" | "error" | "info") => void;
}

type CheckoutStep = "cart" | "form" | "payment";

// Country codes for phone number selection
const COUNTRY_CODES = [
  { code: "+234", label: "🇳🇬 Nigeria (+234)" },
  { code: "+1", label: "🇺🇸 USA (+1)" },
  { code: "+44", label: "🇬🇧 UK (+44)" },
  { code: "+233", label: "🇬🇭 Ghana (+233)" },
  { code: "+254", label: "🇰🇪 Kenya (+254)" },
  { code: "+27", label: "🇿🇦 South Africa (+27)" },
  { code: "+225", label: "🇨🇮 Côte d'Ivoire (+225)" },
  { code: "+221", label: "🇸🇳 Senegal (+221)" },
  { code: "+223", label: "🇲🇱 Mali (+223)" },
  { code: "+226", label: "🇧🇫 Burkina Faso (+226)" },
  { code: "+228", label: "🇹🇬 Togo (+228)" },
  { code: "+229", label: "🇧🇯 Benin (+229)" },
  { code: "+237", label: "🇨🇲 Cameroon (+237)" },
  { code: "+242", label: "🇨🇬 Congo (+242)" },
  { code: "+243", label: "🇨🇩 DRC (+243)" },
  { code: "+256", label: "🇺🇬 Uganda (+256)" },
  { code: "+250", label: "🇷🇼 Rwanda (+250)" },
  { code: "+257", label: "🇧🇮 Burundi (+257)" },
  { code: "+251", label: "🇪🇹 Ethiopia (+251)" },
  { code: "+20", label: "🇪🇬 Egypt (+20)" },
  { code: "+212", label: "🇲🇦 Morocco (+212)" },
  { code: "+213", label: "🇩🇿 Algeria (+213)" },
  { code: "+216", label: "🇹🇳 Tunisia (+216)" },
  { code: "+971", label: "🇦🇪 UAE (+971)" },
  { code: "+966", label: "🇸🇦 Saudi Arabia (+966)" },
  { code: "+91", label: "🇮🇳 India (+91)" },
  { code: "+86", label: "🇨🇳 China (+86)" },
  { code: "+33", label: "🇫🇷 France (+33)" },
  { code: "+49", label: "🇩🇪 Germany (+49)" },
  { code: "+39", label: "🇮🇹 Italy (+39)" },
  { code: "+34", label: "🇪🇸 Spain (+34)" },
  { code: "+31", label: "🇳🇱 Netherlands (+31)" },
  { code: "+46", label: "🇸🇪 Sweden (+46)" },
  { code: "+47", label: "🇳🇴 Norway (+47)" },
  { code: "+45", label: "🇩🇰 Denmark (+45)" },
  { code: "+358", label: "🇫🇮 Finland (+358)" },
  { code: "+48", label: "🇵🇱 Poland (+48)" },
  { code: "+7", label: "🇷🇺 Russia (+7)" },
  { code: "+55", label: "🇧🇷 Brazil (+55)" },
  { code: "+52", label: "🇲🇽 Mexico (+52)" },
  { code: "+54", label: "🇦🇷 Argentina (+54)" },
  { code: "+56", label: "🇨🇱 Chile (+56)" },
  { code: "+57", label: "🇨🇴 Colombia (+57)" },
  { code: "+61", label: "🇦🇺 Australia (+61)" },
  { code: "+64", label: "🇳🇿 New Zealand (+64)" },
  { code: "+81", label: "🇯🇵 Japan (+81)" },
  { code: "+82", label: "🇰🇷 South Korea (+82)" },
  { code: "+65", label: "🇸🇬 Singapore (+65)" },
  { code: "+60", label: "🇲🇾 Malaysia (+60)" },
  { code: "+66", label: "🇹🇭 Thailand (+66)" },
  { code: "+62", label: "🇮🇩 Indonesia (+62)" },
  { code: "+63", label: "🇵🇭 Philippines (+63)" },
  { code: "+84", label: "🇻🇳 Vietnam (+84)" },
  { code: "+92", label: "🇵🇰 Pakistan (+92)" },
  { code: "+880", label: "🇧🇩 Bangladesh (+880)" },
  { code: "+94", label: "🇱🇰 Sri Lanka (+94)" },
  { code: "+977", label: "🇳🇵 Nepal (+977)" },
  { code: "+93", label: "🇦🇫 Afghanistan (+93)" },
  { code: "+98", label: "🇮🇷 Iran (+98)" },
  { code: "+964", label: "🇮🇶 Iraq (+964)" },
  { code: "+90", label: "🇹🇷 Turkey (+90)" },
  { code: "+972", label: "🇮🇱 Israel (+972)" },
  { code: "+965", label: "🇰🇼 Kuwait (+965)" },
  { code: "+974", label: "🇶🇦 Qatar (+974)" },
  { code: "+968", label: "🇴🇲 Oman (+968)" },
  { code: "+973", label: "🇧🇭 Bahrain (+973)" },
  { code: "+962", label: "🇯🇴 Jordan (+962)" },
  { code: "+961", label: "🇱🇧 Lebanon (+961)" }
];

export const CartAndCheckoutDrawer: React.FC<CartAndCheckoutDrawerProps> = ({
  isOpen,
  onClose,
  onAddToast
}) => {
  const { 
    cart, 
    updateQty, 
    removeFromCart, 
    cartTotal, 
    cartCount, 
    isCheckingOut, 
    submitCheckout 
  } = useCart();
  const settings = useSettings();

  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>("cart");
  const [formData, setFormData] = useState({
    countryCode: "+234", // Default to Nigeria
    phone: "",
    name: "",
    address: "",
    email: ""
  });

  const [emailValidating, setEmailValidating] = useState(false);
  const [emailValid, setEmailValid] = useState<boolean | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [googleSignInLoading, setGoogleSignInLoading] = useState(false);
  const [googleVerified, setGoogleVerified] = useState(false);

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === "phone") {
      // Only allow numeric characters
      const numericValue = value.replace(/\D/g, "");
      setFormData((prev) => ({ ...prev, [name]: numericValue }));
    } else if (name === "email") {
      setFormData((prev) => ({ ...prev, [name]: value }));
      // Reset validation state when email changes
      setEmailValid(null);
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const validateEmail = async (email: string): Promise<boolean> => {
    if (!email) return true; // Email remains optional
    
    const emailLower = email.toLowerCase().trim();
    const domain = emailLower.split("@")[1];
    
    if (!domain) return false;
    
    // Always verify the email is registered with Google (ends with gmail.com or googlemail.com)
    const isGoogleRegistered = domain === "gmail.com" || domain === "googlemail.com";
    if (!isGoogleRegistered) {
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailLower);
  };

  const handleEmailBlur = async () => {
    if (!formData.email) {
      setEmailValid(null);
      return;
    }
    
    setEmailValidating(true);
    const isValid = await validateEmail(formData.email);
    setEmailValid(isValid);
    setEmailValidating(false);
    
    if (!isValid) {
      onAddToast("Only official Google-registered emails (@gmail.com) are accepted for order processing.", "error");
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleSignInLoading(true);
    try {
      const result = await signInWithGoogle();
      if (result) {
        setFormData((prev) => ({ 
          ...prev, 
          email: result.email,
          name: prev.name || result.name // Only auto-fill name if empty
        }));
        setEmailValid(true);
        setGoogleVerified(true);
        onAddToast("Google account verified successfully!", "success");
      }
    } catch (error: any) {
      if (error.message === "INVALID_EMAIL_DOMAIN") {
        onAddToast("Only Gmail accounts (@gmail.com) are accepted. Please sign in with a Gmail account.", "error");
        setEmailValid(false);
      } else if (error.code === "auth/popup-closed-by-user") {
        // User closed the popup, no error message needed
      } else {
        onAddToast("Google sign-in failed. Please try again or enter your email manually.", "error");
      }
    } finally {
      setGoogleSignInLoading(false);
    }
  };

  const clearGoogleEmail = () => {
    setFormData((prev) => ({ ...prev, email: "" }));
    setEmailValid(null);
    setGoogleVerified(false);
  };

  const handleNextStep = async () => {
    if (checkoutStep === "cart") {
      if (cart.length === 0) {
        onAddToast("Your cart is empty.", "error");
        return;
      }
      setCheckoutStep("form");
    } else if (checkoutStep === "form") {
      if (!formData.name.trim()) {
        onAddToast("Please enter your name.", "error");
        return;
      }
      if (!formData.phone.trim() || formData.phone.length < 7) {
        onAddToast("Please provide a valid phone number (at least 7 digits).", "error");
        return;
      }
      if (!formData.address.trim()) {
        onAddToast("Please enter your delivery address.", "error");
        return;
      }
      
      // Validate email if provided
      if (formData.email) {
        setEmailValidating(true);
        const isValid = await validateEmail(formData.email);
        setEmailValid(isValid);
        setEmailValidating(false);
        
        if (!isValid) {
          onAddToast("Only official Google-registered emails (@gmail.com) are accepted for order processing.", "error");
          return;
        }
      }
      
      setCheckoutStep("payment");
    }
  };

  const handlePrevStep = () => {
    if (checkoutStep === "payment") setCheckoutStep("form");
    else if (checkoutStep === "form") setCheckoutStep("cart");
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      onAddToast(`Copied ${field}!`, "success");
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  const handleFinalSubmit = async () => {
    const fullPhone = `${formData.countryCode}${formData.phone}`;
    
    const createdOrder = await submitCheckout({
      name: formData.name,
      phone: fullPhone,
      address: formData.address,
      email: formData.email
    });

    if (createdOrder) {
      onAddToast(`Order #${createdOrder.id} received! Redirecting to WhatsApp for confirmation...`, "success");
      
      // Reset form and close
      setFormData({ countryCode: "+234", phone: "", name: "", address: "", email: "" });
      setCheckoutStep("cart");
      setGoogleVerified(false);
      setEmailValid(null);
      onClose();
    }
  };

  const getStepTitle = () => {
    switch (checkoutStep) {
      case "cart": return "YOUR DROP BAG";
      case "form": return "DELIVERY DETAILS";
      case "payment": return "PAYMENT METHOD";
    }
  };

  const getFullPhoneNumber = () => {
    return `${formData.countryCode} ${formData.phone.replace(/(\d{3})(\d{3})(\d{4})/, "$1 $2 $3")}`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity" 
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-zinc-950 text-black dark:text-white flex flex-col shadow-2xl border-l border-zinc-200 dark:border-zinc-900">
          
          {/* Header */}
          <div className="p-6 border-b border-zinc-200 dark:border-zinc-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#E8FF6B]" />
              <h2 className="text-lg font-black uppercase tracking-wider">
                {getStepTitle()}
              </h2>
              <span className="text-xs bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 font-bold px-2 py-0.5 rounded-full">
                {cartCount}
              </span>
            </div>
            
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Step Progress Indicator */}
          {cart.length > 0 && (
            <div className="px-6 py-3 border-b border-zinc-200 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-950/50">
              <div className="flex items-center gap-2">
                {[
                  { id: "cart", label: "Bag" },
                  { id: "form", label: "Details" },
                  { id: "payment", label: "Payment" }
                ].map((step, idx) => {
                  const isActive = step.id === checkoutStep;
                  const isPast = ["cart", "form", "payment"].indexOf(checkoutStep) > idx;
                  return (
                    <React.Fragment key={step.id}>
                      <div className={`flex items-center gap-1.5 ${isActive ? "text-black dark:text-white" : isPast ? "text-[#E8FF6B]" : "text-zinc-400"}`}>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                          isActive ? "bg-black text-[#E8FF6B] dark:bg-[#E8FF6B] dark:text-black" : 
                          isPast ? "bg-[#E8FF6B] text-black" : "bg-zinc-200 dark:bg-zinc-800"
                        }`}>
                          {isPast ? "✓" : idx + 1}
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider">{step.label}</span>
                      </div>
                      {idx < 2 && <div className={`flex-1 h-px ${isPast ? "bg-[#E8FF6B]" : "bg-zinc-200 dark:bg-zinc-800"}`} />}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          )}

          {/* Core Body Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {checkoutStep === "cart" ? (
              // STEP 1: CART DISPLAY
              cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <ShoppingBag className="w-16 h-16 text-zinc-300 dark:text-zinc-800 mb-4 stroke-[1.5]" />
                  <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-6">
                    Your luxury drop bag is empty. Explore our current limited releases before they sell out!
                  </p>
                  <button
                    onClick={onClose}
                    className="px-6 py-3 bg-[#E8FF6B] text-black font-extrabold text-xs uppercase tracking-widest cursor-pointer"
                  >
                    CONTINUE EXPLORING
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="text-[10px] tracking-wider uppercase bg-[#E8FF6B]/10 text-[#E8FF6B] p-2 border border-[#E8FF6B]/20 rounded text-center font-bold">
                    🔥 HIGH PRODUCT DEMAND. STOCK RESERVED FOR 15:00 MINUTES.
                  </div>

                  <div className="divide-y divide-zinc-100 dark:divide-zinc-900">
                    {cart.map((item) => (
                      <div key={`${item.id}-${item.size}`} className="py-4 flex gap-4 first:pt-0 last:pb-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-16 h-16 object-cover bg-zinc-100 dark:bg-zinc-900"
                        />
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between">
                              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                                {item.name}
                              </h3>
                              <span className="text-xs font-bold text-zinc-950 dark:text-zinc-50">
                                ₦{(item.price * item.qty).toLocaleString()}
                              </span>
                            </div>
                            <span className="text-[10px] font-black uppercase text-zinc-400">
                              SIZE: {item.size}
                            </span>
                          </div>

                          <div className="flex items-center justify-between mt-2">
                            {/* Quantity Controls */}
                            <div className="flex items-center border border-zinc-200 dark:border-zinc-800">
                              <button
                                onClick={() => updateQty(item.id, item.size, -1)}
                                className="p-1 text-zinc-500 hover:text-black dark:hover:text-white cursor-pointer"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="px-3 text-xs font-bold">{item.qty}</span>
                              <button
                                onClick={() => updateQty(item.id, item.size, 1)}
                                className="p-1 text-zinc-500 hover:text-black dark:hover:text-white cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Remove button */}
                            <button
                              onClick={() => {
                                removeFromCart(item.id, item.size);
                                onAddToast(`Removed ${item.name} from cart.`, "info");
                              }}
                              className="text-zinc-400 hover:text-red-500 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            ) : checkoutStep === "form" ? (
              // STEP 2: CHECKOUT FORM
              <form onSubmit={(e) => e.preventDefault()} className="space-y-5">
                <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 pb-3 border-b border-zinc-200 dark:border-zinc-900">
                  <ShieldCheck className="w-4 h-4 text-[#E8FF6B]" />
                  <span>Secure delivery details. Payment instructions will follow.</span>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g. Segun Alabi"
                    required
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 text-sm focus:outline-none focus:border-[#E8FF6B] transition-all text-black dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Phone Number (WhatsApp) *
                  </label>
                  <div className="flex gap-2">
                    {/* Country Code Selector */}
                    <select
                      name="countryCode"
                      value={formData.countryCode}
                      onChange={handleInputChange}
                      className="w-28 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 text-sm focus:outline-none focus:border-[#E8FF6B] transition-all text-black dark:text-white font-mono"
                    >
                      {COUNTRY_CODES.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.code}
                        </option>
                      ))}
                    </select>
                    
                    {/* Phone Number Input (Numbers Only) */}
                    <div className="relative flex-1">
                      <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-400" />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="808 817 1549"
                        required
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={15}
                        className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 pl-10 text-sm focus:outline-none focus:border-[#E8FF6B] transition-all text-black dark:text-white font-mono"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-1">
                    {formData.phone && (
                      <span className="text-[#E8FF6B] font-bold">Preview: {getFullPhoneNumber()}</span>
                    )} {!formData.phone && "We will send delivery details via SMS and WhatsApp."}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Physical Delivery Address *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-400" />
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      rows={3}
                      placeholder="e.g. Block C4, UI Campus / Bodija, Ibadan"
                      required
                      className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 pl-10 text-sm focus:outline-none focus:border-[#E8FF6B] transition-all text-black dark:text-white"
                    />
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-1">Provide clear landmarks to ensure swift courier navigation within Ibadan.</p>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5" />
                    Email Address <span className="text-zinc-400 font-normal">(Google Account Verification)</span>
                  </label>
                  
                  {/* Google Sign-In Button - Primary Method */}
                  {!googleVerified ? (
                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      disabled={googleSignInLoading}
                      className="w-full mb-3 flex items-center justify-center gap-3 bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-700 hover:border-[#E8FF6B] dark:hover:border-[#E8FF6B] p-3 text-sm font-bold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-wait"
                    >
                      {googleSignInLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
                          <span className="text-zinc-600 dark:text-zinc-400">Connecting to Google...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                          <span className="text-zinc-800 dark:text-zinc-200">Sign in with Google</span>
                        </>
                      )}
                    </button>
                  ) : (
                    /* Verified Email Display */
                    <div className="mb-3 flex items-center justify-between gap-2 bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-500 p-3 rounded-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Google Verified</p>
                          <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{formData.email}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={clearGoogleEmail}
                        className="text-zinc-400 hover:text-red-500 p-1.5 cursor-pointer transition-colors"
                        title="Use different account"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Divider */}
                  {!googleVerified && (
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">or enter manually</span>
                      <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
                    </div>
                  )}

                  {/* Manual Email Input - Secondary Method */}
                  {!googleVerified && (
                    <div className="relative">
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        onBlur={handleEmailBlur}
                        placeholder="e.g. segunalabi@gmail.com"
                        disabled={emailValidating}
                        className={`w-full bg-zinc-50 dark:bg-zinc-900 border p-3 text-sm focus:outline-none transition-all text-black dark:text-white ${
                          emailValid === null 
                            ? "border-zinc-200 dark:border-zinc-800 focus:border-[#E8FF6B]" 
                            : emailValid 
                              ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10" 
                              : "border-red-500 bg-red-50/50 dark:bg-red-900/10"
                        } ${emailValidating ? "opacity-50" : ""}`}
                      />
                      {emailValidating && (
                        <div className="absolute right-3 top-3.5">
                          <div className="w-4 h-4 border-2 border-[#E8FF6B] border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                      {emailValid === true && !emailValidating && (
                        <div className="absolute right-3 top-3.5 text-emerald-500">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      )}
                      {emailValid === false && !emailValidating && (
                        <div className="absolute right-3 top-3.5 text-red-500">
                          <AlertCircle className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  )}

                  <p className="text-[10px] text-zinc-400 mt-2">
                    {googleVerified && (
                      <span className="text-emerald-500 font-bold">✓ Email verified via Google Sign-In. Order confirmations will be sent here.</span>
                    )}
                    {emailValid === false && !googleVerified && (
                      <span className="text-red-500 font-bold">⚠️ Only registered Gmail addresses (@gmail.com) are accepted. Use Sign in with Google for instant verification.</span>
                    )}
                    {emailValid === true && !googleVerified && (
                      <span className="text-emerald-500 font-bold">✓ Gmail Address Verified</span>
                    )}
                    {!emailValid && !emailValidating && !googleVerified && "For secure order tracking, please verify your Gmail account."}
                  </p>
                </div>
              </form>
            ) : (
              // STEP 3: PAYMENT METHOD
              <div className="space-y-5">
                <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 pb-3 border-b border-zinc-200 dark:border-zinc-900">
                  <CreditCard className="w-4 h-4 text-[#E8FF6B]" />
                  <span>Make a bank transfer to the account below. Send proof via WhatsApp.</span>
                </div>

                <div className="bg-gradient-to-br from-zinc-900 to-black text-white p-5 rounded-sm border border-zinc-800 shadow-xl">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-800">
                    <span className="text-[10px] font-black tracking-[0.25em] text-[#E8FF6B] uppercase">
                      OFFICIAL BRAND ACCOUNT
                    </span>
                    <Building2 className="w-4 h-4 text-[#E8FF6B]" />
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-1 block">Bank Name</label>
                      <div className="flex items-center justify-between gap-2 bg-zinc-900 p-2.5 rounded-sm border border-zinc-800">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-[#E8FF6B]" />
                          <span className="text-sm font-bold text-white">{settings.payment.bankName}</span>
                        </div>
                        <button
                          onClick={() => handleCopy(settings.payment.bankName, "Bank Name")}
                          className="text-zinc-400 hover:text-[#E8FF6B] p-1 cursor-pointer"
                        >
                          {copiedField === "Bank Name" ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-1 block">Account Number</label>
                      <div className="flex items-center justify-between gap-2 bg-zinc-900 p-2.5 rounded-sm border border-zinc-800">
                        <div className="flex items-center gap-2">
                          <Hash className="w-4 h-4 text-[#E8FF6B]" />
                          <span className="text-base font-mono font-extrabold text-[#E8FF6B] tracking-widest">{settings.payment.accountNumber}</span>
                        </div>
                        <button
                          onClick={() => handleCopy(settings.payment.accountNumber, "Account Number")}
                          className="text-zinc-400 hover:text-[#E8FF6B] p-1 cursor-pointer"
                        >
                          {copiedField === "Account Number" ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-1 block">Account Name</label>
                      <div className="flex items-center justify-between gap-2 bg-zinc-900 p-2.5 rounded-sm border border-zinc-800">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-[#E8FF6B]" />
                          <span className="text-sm font-bold text-white">{settings.payment.accountName}</span>
                        </div>
                        <button
                          onClick={() => handleCopy(settings.payment.accountName, "Account Name")}
                          className="text-zinc-400 hover:text-[#E8FF6B] p-1 cursor-pointer"
                        >
                          {copiedField === "Account Name" ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-zinc-800">
                      <label className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-1 block">Amount To Transfer</label>
                      <div className="bg-[#E8FF6B] text-black p-3 rounded-sm flex items-center justify-between">
                        <span className="text-xl font-black tracking-tight">₦{cartTotal.toLocaleString()}</span>
                        <button
                          onClick={() => handleCopy(cartTotal.toString(), "Amount")}
                          className="p-1 hover:bg-black/10 rounded cursor-pointer"
                        >
                          {copiedField === "Amount" ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-sm">
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 leading-relaxed">
                    <strong className="block mb-1">⚠️ IMPORTANT:</strong>
                    1. Make transfer using <strong>Order ID as the description</strong>.<br/>
                    2. Click the WhatsApp button below to send proof of payment.<br/>
                    3. Your order will be dispatched once payment is confirmed.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Drawer Footer Summary & Actions */}
          {cart.length > 0 && (
            <div className="p-6 border-t border-zinc-200 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-950/50">
              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-xs text-zinc-500">
                  <span>Subtotal</span>
                  <span>₦{cartTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs text-zinc-500">
                  <span>Dispatch Delivery (Ibadan courier)</span>
                  <span className="text-emerald-500 font-semibold uppercase">Free Drop Shipping</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-zinc-200 dark:border-zinc-900">
                  <span className="text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                    TOTAL AMOUNT
                  </span>
                  <span className="text-lg font-black text-black dark:text-white">
                    ₦{cartTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              {checkoutStep === "cart" ? (
                <button
                  onClick={handleNextStep}
                  className="w-full py-4 bg-black dark:bg-[#E8FF6B] text-white dark:text-black font-extrabold uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <span>PROCEED TO SECURE CHECKOUT</span>
                  <ArrowRight className="w-4.5 h-4.5" />
                </button>
              ) : checkoutStep === "form" ? (
                <div className="space-y-2">
                  <button
                    onClick={handleNextStep}
                    className="w-full py-4 bg-black dark:bg-[#E8FF6B] text-white dark:text-black font-extrabold uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>CONTINUE TO PAYMENT</span>
                    <ArrowRight className="w-4.5 h-4.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="w-full py-2 bg-transparent text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider text-[10px] hover:underline"
                  >
                    Go Back to Drop Bag
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={handleFinalSubmit}
                    disabled={isCheckingOut}
                    className={`w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-2 cursor-pointer ${
                      isCheckingOut ? "opacity-50 cursor-wait" : ""
                    }`}
                  >
                    {isCheckingOut ? (
                      <span>GENERATING ORDER ID...</span>
                    ) : (
                      <>
                        <span>I'VE PAID • CONFIRM VIA WHATSAPP</span>
                        <ArrowRight className="w-4.5 h-4.5" />
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="w-full py-2 bg-transparent text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider text-[10px] hover:underline"
                  >
                    Go Back to Edit Details
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
