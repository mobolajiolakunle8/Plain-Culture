import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  dbService, 
  Product, 
  Order, 
  OrderItem, 
  StoreSettings,
  auth as firebaseAuth, 
  isFirebaseConfigured 
} from "../lib/firebase";
import { signInWithEmailAndPassword, signOut as fbSignOut, onAuthStateChanged } from "firebase/auth";

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

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, size: string) => void;
  removeFromCart: (id: string, size: string) => void;
  updateQty: (id: string, size: string, change: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
  isCheckingOut: boolean;
  submitCheckout: (checkoutForm: { name: string; phone: string; address: string; email?: string }) => Promise<Order | null>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem("pc_cart");
    return saved ? JSON.parse(saved) : [];
  });
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  useEffect(() => {
    localStorage.setItem("pc_cart", JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product: Product, size: string) => {
    // 1. Check stock availability
    if (product.stockQuantity <= 0) {
      alert("This product is currently Sold Out.");
      return;
    }

    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.id === product.id && item.size === size);
      
      // Calculate total quantity of this product currently in cart
      const currentQtyInCart = prev
        .filter((item) => item.id === product.id)
        .reduce((sum, item) => sum + item.qty, 0);

      if (currentQtyInCart >= product.stockQuantity) {
        alert(`Sorry, you cannot add more than ${product.stockQuantity} items (available stock limit).`);
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

  const submitCheckout = async (checkoutForm: { name: string; phone: string; address: string; email?: string }) => {
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

      // 2. Submit order to DB service (triggers stock update and customer profile syncing)
      const orderData = {
        customerName: checkoutForm.name,
        phone: checkoutForm.phone,
        address: checkoutForm.address,
        items: cart,
        totalAmount: cartTotal
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

      const message = `Hello, I want to confirm my order:

Order ID: #${createdOrder.id}
Items:
${itemsString}

Total: ₦${orderData.totalAmount.toLocaleString()}
Name: ${orderData.customerName}
Phone: ${orderData.phone}
Address: ${orderData.address}

💳 Payment: I've made the bank transfer to ${contactSettings.payment.bankName} - ${contactSettings.payment.accountNumber} (${contactSettings.payment.accountName}). Proof of payment attached.`;

      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${shopPhone}?text=${encodedMessage}`;
      
      // Delay slightly for smooth transitions
      setTimeout(() => {
        window.open(whatsappUrl, "_blank");
      }, 300);

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
  logout: () => Promise<void>;
  updateAdminPassword: (newPassword: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Handle real Firebase Auth listener
    if (isFirebaseConfigured && firebaseAuth) {
      const unsubscribe = onAuthStateChanged(firebaseAuth, (firebaseUser) => {
        if (firebaseUser) {
          const emailStr = firebaseUser.email || "plainculture.ng@gmail.com";
          setUser({
            email: emailStr,
            name: "Plain Culture Admin",
            role: emailStr.toLowerCase() === "plainculture.ng@gmail.com" ? "Super Admin" : "Admin"
          });
        } else {
          const localUser = localStorage.getItem("pc_active_admin");
          if (localUser) {
            const parsed = JSON.parse(localUser);
            setUser({ ...parsed, role: parsed.email?.toLowerCase() === "plainculture.ng@gmail.com" ? "Super Admin" : "Admin" });
          } else {
            setUser(null);
          }
        }
        setIsLoading(false);
      });
      return unsubscribe;
    } else {
      const localUser = localStorage.getItem("pc_active_admin");
      if (localUser) {
        const parsed = JSON.parse(localUser);
        setUser({ ...parsed, role: parsed.email?.toLowerCase() === "plainculture.ng@gmail.com" ? "Super Admin" : "Admin" });
      } else {
        setUser(null);
      }
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    const settings = dbService.getSettings();
    const admins = dbService.getAdmins(); // Use local sync for instant response
    const savedPassword = localStorage.getItem("pc_admin_password") || "ibadanminimalist2026";

    // 1. Try local/mock authentication FIRST for instant response
    let matchedAdmin = admins.find((admin) => {
      const sameEmail = admin.email.toLowerCase() === email.toLowerCase();
      const primaryEmail = settings.email.toLowerCase() === email.toLowerCase();
      const passwordMatches = admin.password === password || (primaryEmail && password === savedPassword);
      return sameEmail && passwordMatches;
    });

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
        throw new Error("This admin account has been deactivated.");
      }

      const role = (matchedAdmin.email.toLowerCase() === "plainculture.ng@gmail.com" ? "Super Admin" : "Admin") as "Super Admin" | "Admin";
      
      const userProfile: UserProfile = { 
        email: matchedAdmin.email, 
        name: matchedAdmin.name || "Plain Culture Admin",
        role: role as "Super Admin" | "Admin"
      };
      localStorage.setItem("pc_active_admin", JSON.stringify(userProfile));
      setUser(userProfile as UserProfile);
      setIsLoading(false);

      // Critical fix for cross-browser sync:
      // local login remains instant, but we also authenticate with Firebase in the background
      // so Firestore-protected collections (orders, customers, settings) can sync across browsers/devices.
      if (isFirebaseConfigured && firebaseAuth && !firebaseAuth.currentUser) {
        signInWithEmailAndPassword(firebaseAuth, email, password)
          .then(() => console.log("🔐 Background Firebase admin auth succeeded — cross-browser sync active."))
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
    setUser(null);
    setIsLoading(false);
  };

  const updateAdminPassword = async (newPassword: string): Promise<boolean> => {
    // Save new password locally for simulated auth
    localStorage.setItem("pc_admin_password", newPassword);
    
    // In production, real auth password updating can be done but we support local mock persistence
    console.log("Admin password updated to:", newPassword);
    return true;
  };

  const isAdmin = !!user;

  return (
    <AuthContext.Provider value={{
      user,
      isAdmin,
      isLoading,
      login,
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
