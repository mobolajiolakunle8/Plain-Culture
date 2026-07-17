import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  dbService, 
  Product, 
  Order, 
  OrderItem, 
  StoreSettings,
  AdminUserRecord,
  BrandingDetails,
  auth as firebaseAuth, 
  isFirebaseConfigured 
} from "../lib/firebase";
import { GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup, signOut as fbSignOut, onAuthStateChanged } from "firebase/auth";
import { sanitizeText, sanitizePhone, sanitizeEmail, validateFieldLengths } from "../utils/sanitize";

// ==========================================
// SETTINGS HOOK (REAL-TIME SUBSCRIPTION)
// ==========================================
export const useSettings = (): StoreSettings => {
  const [settings, setSettings] = React.useState<StoreSettings>(() => dbService.getSettings());

  React.useEffect(() => {
    const unsubscribe = dbService.subscribeSettings((s) => setSettings(s));
    return unsubscribe;
  }, []);

  return settings;
};

// ==========================================
// 1. THEME CONTEXT
// ==========================================
interface ThemeContextType {
  theme: "dark" | "light";
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    const saved = localStorage.getItem("pc_theme");
    return (saved as "dark" | "light") || "dark";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      root.style.colorScheme = "dark";
    } else {
      root.classList.remove("dark");
      root.style.colorScheme = "light";
    }
    localStorage.setItem("pc_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
};


// ==========================================
// 2. CART CONTEXT
// ==========================================
interface CartItem extends OrderItem {}

interface CheckoutPayload {
  name: string;
  phone: string;
  address: string;
  email?: string;
  deliveryFee?: number;
  deliveryLocation?: string;
  brandingDetails?: BrandingDetails;
  paymentMethod?: "Bank Transfer" | "Paystack";
  paymentReference?: string;
  skipWhatsApp?: boolean;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, size: string) => void;
  removeFromCart: (id: string, size: string) => void;
  updateQty: (id: string, size: string, change: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
  isCheckingOut: boolean;
  submitCheckout: (checkoutForm: CheckoutPayload) => Promise<Order | null>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const getCustomerCartKey = () => {
  const existingId = localStorage.getItem("pc_customer_cart_id");
  if (existingId) return `pc_cart_${existingId}`;

  const newId = `customer-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  localStorage.setItem("pc_customer_cart_id", newId);
  return `pc_cart_${newId}`;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartKey] = useState(() => getCustomerCartKey());
  const [cart, setCart] = useState<CartItem[]>(() => {
    // Remove legacy shared cart key so carts are no longer shared through one global bucket.
    localStorage.removeItem("pc_cart");
    const saved = localStorage.getItem(getCustomerCartKey());
    return saved ? JSON.parse(saved) : [];
  });
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  useEffect(() => {
    localStorage.setItem(cartKey, JSON.stringify(cart));
  }, [cart, cartKey]);

  const addToCart = (product: Product, size: string) => {
    // 1. Check per-size stock availability
    const sizeStock = product.sizeStock?.[size] ?? 0;
    if (sizeStock <= 0) {
      alert(`Size ${size} is currently Sold Out.`);
      return;
    }

    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.id === product.id && item.size === size);
      
      // Calculate quantity of THIS SIZE currently in cart
      const currentSizeQtyInCart = prev
        .filter((item) => item.id === product.id && item.size === size)
        .reduce((sum, item) => sum + item.qty, 0);

      if (currentSizeQtyInCart >= sizeStock) {
        alert(`Sorry, only ${sizeStock} unit(s) of Size ${size} available.`);
        return prev;
      }

      if (existingIndex !== -1) {
        const updated = [...prev];
        updated[existingIndex].qty += 1;
        return updated;
      } else {
        return [
          ...prev,
          {
            id: product.id,
            name: product.name,
            price: product.price,
            qty: 1,
            size: size,
            image: product.images[0] || "/images/tee_onyx.jpg"
          }
        ];
      }
    });
  };

  const removeFromCart = (id: string, size: string) => {
    setCart((prev) => prev.filter((item) => !(item.id === id && item.size === size)));
  };

  const updateQty = (id: string, size: string, change: number) => {
    setCart((prev) => {
      return prev.map((item) => {
        if (item.id === id && item.size === size) {
          const newQty = item.qty + change;
          if (newQty <= 0) return item; // remove handled separately or let it stay 1
          
          // Verify stock limit
          const products = JSON.parse(localStorage.getItem("pc_products") || "[]");
          const realProduct = products.find((p: any) => p.id === id);
          if (realProduct && newQty > realProduct.stockQuantity) {
            alert(`Only ${realProduct.stockQuantity} items are available in stock.`);
            return item;
          }

          return { ...item, qty: newQty };
        }
        return item;
      });
    });
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartTotal = cart.reduce((total, item) => total + item.price * item.qty, 0);
  const cartCount = cart.reduce((count, item) => count + item.qty, 0);

  const submitCheckout = async (checkoutForm: CheckoutPayload) => {
    if (cart.length === 0) return null;
    setIsCheckingOut(true);

    try {
      // 1. Perform final stock verification
      const products = await dbService.getProducts();
      for (const item of cart) {
        const dbProd = products.find((p) => p.id === item.id);
        if (!dbProd) {
          throw new Error(`Product "${item.name}" not found.`);
        }
        if (dbProd.stockQuantity < item.qty) {
          throw new Error(`Insufficient stock for "${item.name}". Only ${dbProd.stockQuantity} left.`);
        }
      }

      // 2. Sanitize all user inputs before storing
      const safeName = sanitizeText(checkoutForm.name);
      const safePhone = sanitizePhone(checkoutForm.phone);
      const safeAddress = sanitizeText(checkoutForm.address);
      const safeEmail = sanitizeEmail(checkoutForm.email || "");
      const safeDeliveryLocation = sanitizeText(checkoutForm.deliveryLocation || "");
      const deliveryFee = checkoutForm.deliveryFee || 0;
      const brandingDetails = checkoutForm.brandingDetails;
      const grandTotal = cartTotal + deliveryFee + (brandingDetails?.price || 0);

      // Validate field lengths to prevent abuse
      if (!validateFieldLengths({ safeName, safePhone, safeAddress, safeEmail }, 500)) {
        throw new Error("Input fields are too long. Please shorten your entries.");
      }

      const orderData = {
        customerName: safeName,
        customerEmail: safeEmail,
        phone: safePhone,
        address: safeAddress,
        items: cart,
        totalAmount: grandTotal,
        deliveryFee,
        deliveryLocation: safeDeliveryLocation,
        paymentMethod: checkoutForm.paymentMethod || "Bank Transfer",
        paymentReference: checkoutForm.paymentReference || "",
        ...(brandingDetails ? { brandingDetails } : {})
      };

      const createdOrder = await dbService.addOrder(orderData);

      // 3. Clear cart
      clearCart();

      // 4. Trigger WhatsApp redirect in background
      const contactSettings = dbService.getSettings();
      const shopPhone = contactSettings.phone.replace(/\+/g, ""); // strip '+'
      
      const itemsString = orderData.items
        .map((item) => `• ${item.name} (${item.size}) x ${item.qty}`)
        .join("\n");

      const deliveryLine = safeDeliveryLocation
        ? deliveryFee > 0
          ? `Delivery Location: ${safeDeliveryLocation}\nDelivery Fee: ₦${deliveryFee.toLocaleString()}`
          : `Delivery Location: ${safeDeliveryLocation}\nDelivery Fee: To be quoted via WhatsApp`
        : "";

      const message = `Hello, I want to confirm my order:

Order ID: #${createdOrder.id}
Items:
${itemsString}

Subtotal: ₦${cartTotal.toLocaleString()}
${deliveryLine}${brandingDetails && brandingDetails.enabled ? `\n\n🎨 Branding (${brandingDetails.type}):\nAreas: ${brandingDetails.areas.join(", ")}${brandingDetails.designText ? `\nDesign: "${brandingDetails.designText}"` : ""}\nBranding Fee: ₦${brandingDetails.price.toLocaleString()}` : ""}
Total (incl. delivery${brandingDetails && brandingDetails.enabled ? " & branding" : ""}): ₦${orderData.totalAmount.toLocaleString()}
Name: ${orderData.customerName}
Phone: ${orderData.phone}
Address: ${orderData.address}

💳 Payment: I've made the bank transfer to ${contactSettings.payment.bankName} - ${contactSettings.payment.accountNumber} (${contactSettings.payment.accountName}). Proof of payment attached.`;

      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${shopPhone}?text=${encodedMessage}`;

      // Send the order details to the brand email via Web3Forms
      // Web3Forms is a serverless form-to-email API that requires no backend.
      const WEB3FORMS_ACCESS_KEY = "52088c98-2160-4097-b0be-e9ada15f3c7e";
      
      try {
        await fetch("https://api.web3forms.com/submit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify({
            access_key: WEB3FORMS_ACCESS_KEY,
            subject: `🛍️ New Plain Culture Order #${createdOrder.id} - ₦${orderData.totalAmount.toLocaleString()}`,
            from_name: "Plain Culture Website",
            to_email: contactSettings.email || "plainculture.ng@gmail.com",
            // Customer information
            customer_name: orderData.customerName,
            customer_phone: orderData.phone,
            customer_email: safeEmail || "Not provided",
            delivery_address: orderData.address,
            // Order details
            order_id: createdOrder.id,
            order_items: itemsString,
            order_total: `₦${orderData.totalAmount.toLocaleString()}`,
            order_status: "Pending",
            order_date: new Date(createdOrder.createdAt).toLocaleString(),
            // Payment details
            payment_bank: contactSettings.payment.bankName,
            payment_account_number: contactSettings.payment.accountNumber,
            payment_account_name: contactSettings.payment.accountName,
            // Full message
            message: message,
            // Botcheck honeypot to prevent spam
            botcheck: ""
          })
        });
      } catch (emailError) {
        console.error("Web3Forms email notification failed (order still saved):", emailError);
      }

      // Delay slightly for smooth transitions
      if (!checkoutForm.skipWhatsApp) {
        setTimeout(() => {
          window.open(whatsappUrl, "_blank");
        }, 300);
      }

      return createdOrder;
    } catch (error: any) {
      alert(error.message || "An error occurred during checkout.");
      return null;
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      removeFromCart,
      updateQty,
      clearCart,
      cartTotal,
      cartCount,
      isCheckingOut,
      submitCheckout
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
};


// ==========================================
// 3. AUTH CONTEXT
// ==========================================
interface UserProfile {
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: UserProfile | null;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, name: string) => Promise<boolean>;
  signInWithGoogle: () => Promise<boolean>;
  logout: () => Promise<void>;
  updateAdminPassword: (newPassword: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const resolveRoleForEmail = async (email: string): Promise<string> => {
    if (email.toLowerCase() === "plainculture.ng@gmail.com") return "Super Admin";
    try {
      const admins = await dbService.getAdminsAsync();
      const found = admins.find((admin) => admin.email.toLowerCase() === email.toLowerCase());
      return found?.role || "Customer";
    } catch {
      return "Customer";
    }
  };

  useEffect(() => {
    // 1. Handle real Firebase Auth listener
    //    IMPORTANT: anonymous auth users (no email) MUST NOT overwrite the
    //    manually-logged-in user state. Otherwise Partners get clobbered by
    //    the Super Admin default.
    if (isFirebaseConfigured && firebaseAuth) {
      const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
        if (firebaseUser) {
          const emailStr = firebaseUser.email;
          // Skip anonymous users — they have no real email.
          // The login() function is responsible for setting the user profile.
          if (!emailStr) return;

          const role = await resolveRoleForEmail(emailStr);
          setUser({
            email: emailStr,
            name: firebaseUser.displayName || "Plain Culture Customer",
            role
          });
        } else {
          // Real sign-out event — clear state
          localStorage.removeItem("pc_active_admin");
          localStorage.removeItem("pc_active_customer");
          setUser(null);
        }
        setIsLoading(false);
      });
      return unsubscribe;
    } else {
      const localUser = localStorage.getItem("pc_active_admin") || localStorage.getItem("pc_active_customer");
      if (localUser) {
        const parsed = JSON.parse(localUser);
        setUser({
          ...parsed,
          role: parsed.role || (parsed.email?.toLowerCase() === "plainculture.ng@gmail.com" ? "Super Admin" : "Customer")
        });
      } else {
        setUser(null);
      }
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    const settings = dbService.getSettings();
    const localAdmins = dbService.getAdmins(); // instant local lookup
    const savedPassword = localStorage.getItem("pc_admin_password") || "ibadanminimalist2026";

    const findMatchingAdmin = (adminsList: AdminUserRecord[]) => {
      return adminsList.find((admin) => {
        const sameEmail = admin.email.toLowerCase() === email.toLowerCase();
        const primaryEmail = settings.email.toLowerCase() === email.toLowerCase();
        const passwordMatches = admin.password === password || (primaryEmail && password === savedPassword);
        return sameEmail && passwordMatches;
      });
    };

    // 1. Try local cache first for instant response
    let matchedAdmin = findMatchingAdmin(localAdmins);

    // 2. If not found locally, pull fresh admin list from Firestore (cross-browser support)
    if (!matchedAdmin) {
      try {
        const remoteAdmins = await dbService.getAdminsAsync();
        matchedAdmin = findMatchingAdmin(remoteAdmins);
      } catch (e) {
        console.warn("Could not fetch remote admins during login:", e);
      }
    }

    if (!matchedAdmin && settings.email.toLowerCase() === email.toLowerCase() && password === savedPassword) {
      matchedAdmin = { 
        id: "settings-primary-admin", 
        name: "Primary Admin", 
        email, 
        password, 
        role: "Super Admin", 
        createdAt: new Date().toISOString(),
        isActive: true,
        trackingCode: "ADM-SUPER"
      };
    }

    if (matchedAdmin) {
      if (!matchedAdmin.isActive) {
        setIsLoading(false);
        throw new Error("This account has been deactivated.");
      }

      // Super Admin always wins for the primary email; otherwise respect the stored role (Admin or Partner).
      const role = matchedAdmin.email.toLowerCase() === "plainculture.ng@gmail.com"
        ? "Super Admin"
        : (matchedAdmin.role || "Admin");
      
      const userProfile: UserProfile = { 
        email: matchedAdmin.email, 
        name: matchedAdmin.name || "Plain Culture Team",
        role: role
      };
      localStorage.setItem("pc_active_admin", JSON.stringify(userProfile));
      setUser(userProfile as UserProfile);
      setIsLoading(false);

      // Critical fix for cross-browser sync:
      // local login remains instant, but we also authenticate with Firebase in the background
      // so Firestore-protected collections (orders, customers, settings) can sync across browsers/devices.
      if (isFirebaseConfigured && firebaseAuth && !firebaseAuth.currentUser) {
        signInWithEmailAndPassword(firebaseAuth, email, password)
          .then(() => undefined)
          .catch((e) => console.warn("Background Firebase admin auth failed — local admin access still works, but cross-browser sync may be limited.", e));
      }

      return true;
    }

    // 2. Fallback to real Firebase Authenticator if local authentication failed
    if (isFirebaseConfigured && firebaseAuth) {
      try {
        const credential = await signInWithEmailAndPassword(firebaseAuth, email, password);
        if (credential.user) {
          const emailStr = credential.user.email || email;
          const userProfile = {
            email: emailStr,
            name: "Plain Culture Admin",
            role: emailStr.toLowerCase() === "plainculture.ng@gmail.com" ? "Super Admin" : "Admin"
          };
          setUser(userProfile);
          setIsLoading(false);
          return true;
        }
      } catch (e) {
        console.warn("Firebase Auth login failed", e);
      }
    }

    setIsLoading(false);
    return false;
  };

  const logout = async () => {
    setIsLoading(true);
    if (isFirebaseConfigured && firebaseAuth) {
      try {
        await fbSignOut(firebaseAuth);
      } catch (e) {
        console.error("Firebase logout error:", e);
      }
    }
    localStorage.removeItem("pc_active_admin");
    localStorage.removeItem("pc_active_customer");
    setUser(null);
    setIsLoading(false);
  };

  const signUp = async (email: string, password: string, name: string): Promise<boolean> => {
    setIsLoading(true);
    if (isFirebaseConfigured && firebaseAuth) {
      try {
        const { createUserWithEmailAndPassword } = await import("firebase/auth");
        const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
        if (credential.user) {
          const userProfile: UserProfile = { email, name, role: "Customer" };
          localStorage.setItem("pc_active_customer", JSON.stringify(userProfile));
          setUser(userProfile);
          setIsLoading(false);
          return true;
        }
      } catch (e) {
        console.error("Firebase Sign Up failed", e);
      }
    }
    setIsLoading(false);
    return false;
  };

  const signInWithGoogle = async (): Promise<boolean> => {
    if (!isFirebaseConfigured || !firebaseAuth) return false;
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const credential = await signInWithPopup(firebaseAuth, provider);
      const email = credential.user.email || "";
      if (!email) throw new Error("Google account has no email address.");
      const role = await resolveRoleForEmail(email);
      const userProfile: UserProfile = {
        email,
        name: credential.user.displayName || "Plain Culture Customer",
        role
      };
      localStorage.setItem("pc_active_customer", JSON.stringify(userProfile));
      setUser(userProfile);
      setIsLoading(false);
      return true;
    } catch (e) {
      console.error("Google sign-in failed", e);
      setIsLoading(false);
      return false;
    }
  };

  const updateAdminPassword = async (newPassword: string): Promise<boolean> => {
    // Save new password locally for simulated auth
    localStorage.setItem("pc_admin_password", newPassword);
    
    // In production, real auth password updating can be done but we support local mock persistence
    return true;
  };

  const isAdmin = !!user && ["Super Admin", "Admin", "Manager", "Partner"].includes(user.role);

  return (
    <AuthContext.Provider value={{
      user,
      isAdmin,
      isLoading,
      login,
      signUp,
      signInWithGoogle,
      logout,
      updateAdminPassword
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};


// ==========================================
// UNIFIED GLOBAL STATE PROVIDER
// ==========================================
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          {children}
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};
