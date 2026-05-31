import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  dbService, 
  Product, 
  Order, 
  OrderItem, 
  StoreSettings,
  AdminUserRecord,
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

      // Send the order details to the brand email via Web3Forms
      // Web3Forms is a serverless form-to-email API that requires no backend.
      const WEB3FORMS_ACCESS_KEY = "52088c98-2160-4097-b0be-e9ada15f3c7e";
      
      // Build product images HTML section for email
      const baseUrl = window.location.origin;
      const productImagesHtml = orderData.items.map((item) => {
        const imageUrl = item.image.startsWith('http') ? item.image : `${baseUrl}${item.image}`;
        return `
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e5e5e5;">
              <img src="${imageUrl}" alt="${item.name}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 4px;" />
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; vertical-align: top;">
              <strong style="font-size: 14px; color: #1a1a1a;">${item.name}</strong><br/>
              <span style="font-size: 12px; color: #666;">Size: ${item.size} | Qty: ${item.qty}</span><br/>
              <span style="font-size: 14px; font-weight: bold; color: #1a1a1a;">₦${(item.price * item.qty).toLocaleString()}</span>
            </td>
          </tr>
        `;
      }).join('');

      // Full HTML email template with product images
      const htmlEmailContent = `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: #000; padding: 20px; text-align: center;">
            <h1 style="color: #E8FF6B; margin: 0; font-size: 24px; letter-spacing: 2px;">PLAIN CULTURE</h1>
            <p style="color: #fff; margin: 10px 0 0 0; font-size: 12px; letter-spacing: 1px;">NEW ORDER RECEIVED</p>
          </div>
          
          <div style="background-color: #fff; padding: 24px; border: 1px solid #e5e5e5;">
            <h2 style="margin: 0 0 16px 0; font-size: 18px; color: #1a1a1a;">Order #${createdOrder.id}</h2>
            <p style="margin: 0 0 16px 0; font-size: 14px; color: #666;">
              ${new Date(createdOrder.createdAt).toLocaleString('en-NG', { dateStyle: 'full', timeStyle: 'short' })}
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 16px 0;" />
            
            <h3 style="margin: 0 0 12px 0; font-size: 14px; color: #1a1a1a; text-transform: uppercase; letter-spacing: 1px;">Order Items</h3>
            <table style="width: 100%; border-collapse: collapse;">
              ${productImagesHtml}
            </table>
            
            <div style="background-color: #f5f5f5; padding: 16px; margin-top: 16px; border-radius: 4px;">
              <table style="width: 100%;">
                <tr>
                  <td style="font-size: 14px; color: #666;">Subtotal:</td>
                  <td style="font-size: 14px; color: #1a1a1a; text-align: right;">₦${orderData.totalAmount.toLocaleString()}</td>
                </tr>
                <tr>
                  <td style="font-size: 16px; font-weight: bold; color: #1a1a1a; padding-top: 8px;">Total:</td>
                  <td style="font-size: 16px; font-weight: bold; color: #1a1a1a; text-align: right; padding-top: 8px;">₦${orderData.totalAmount.toLocaleString()}</td>
                </tr>
              </table>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
            
            <h3 style="margin: 0 0 12px 0; font-size: 14px; color: #1a1a1a; text-transform: uppercase; letter-spacing: 1px;">Customer Details</h3>
            <table style="width: 100%; font-size: 14px;">
              <tr>
                <td style="padding: 4px 0; color: #666; width: 120px;">Name:</td>
                <td style="padding: 4px 0; color: #1a1a1a;">${orderData.customerName}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #666;">Phone:</td>
                <td style="padding: 4px 0; color: #1a1a1a;">${orderData.phone}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #666;">Email:</td>
                <td style="padding: 4px 0; color: #1a1a1a;">${checkoutForm.email || 'Not provided'}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #666; vertical-align: top;">Address:</td>
                <td style="padding: 4px 0; color: #1a1a1a;">${orderData.address}</td>
              </tr>
            </table>
            
            <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
            
            <h3 style="margin: 0 0 12px 0; font-size: 14px; color: #1a1a1a; text-transform: uppercase; letter-spacing: 1px;">Payment Details</h3>
            <div style="background-color: #E8FF6B; padding: 16px; border-radius: 4px;">
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #1a1a1a;"><strong>Bank:</strong> ${contactSettings.payment.bankName}</p>
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #1a1a1a;"><strong>Account:</strong> ${contactSettings.payment.accountNumber}</p>
              <p style="margin: 0; font-size: 14px; color: #1a1a1a;"><strong>Name:</strong> ${contactSettings.payment.accountName}</p>
            </div>
            
            <p style="margin: 24px 0 0 0; font-size: 12px; color: #999; text-align: center;">
              Status: <span style="color: #f59e0b; font-weight: bold;">PENDING</span> - Awaiting payment confirmation
            </p>
          </div>
          
          <p style="margin: 16px 0 0 0; font-size: 11px; color: #999; text-align: center;">
            This is an automated order notification from Plain Culture website.
          </p>
        </div>
      `;

      try {
        await fetch("https://api.web3forms.com/submit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify({
            access_key: WEB3FORMS_ACCESS_KEY,
            subject: `New Plain Culture Order #${createdOrder.id} - ₦${orderData.totalAmount.toLocaleString()}`,
            from_name: "Plain Culture Website",
            to_email: contactSettings.email || "plainculture.ng@gmail.com",
            // Send HTML email with product images
            message: htmlEmailContent,
            // Botcheck honeypot to prevent spam
            botcheck: ""
          })
        });
        console.log(`Order #${createdOrder.id} email notification sent to ${contactSettings.email}`);
      } catch (emailError) {
        console.error("Web3Forms email notification failed (order still saved):", emailError);
      }
      
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
    //    IMPORTANT: anonymous auth users (no email) MUST NOT overwrite the
    //    manually-logged-in user state. Otherwise Partners get clobbered by
    //    the Super Admin default.
    if (isFirebaseConfigured && firebaseAuth) {
      const unsubscribe = onAuthStateChanged(firebaseAuth, (firebaseUser) => {
        if (firebaseUser) {
          const emailStr = firebaseUser.email;
          // Skip anonymous users — they have no real email.
          // The login() function is responsible for setting the user profile.
          if (!emailStr) return;

          setUser({
            email: emailStr,
            name: "Plain Culture Admin",
            role: emailStr.toLowerCase() === "plainculture.ng@gmail.com" ? "Super Admin" : "Admin"
          });
        } else {
          // Real sign-out event — clear state
          localStorage.removeItem("pc_active_admin");
          setUser(null);
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
