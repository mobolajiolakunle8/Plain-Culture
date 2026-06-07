import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy
} from "firebase/firestore";

// Cast to any to prevent TS build errors on import.meta environment fields
const env = (import.meta as any).env || {};

// Official Premium Brand Firebase configuration provided by user
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || "AIzaSyA2V2MJsqIj5J-MYJCjQcuVayeltLoqNTs",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "plain-culture.firebaseapp.com",
  databaseURL: env.VITE_FIREBASE_DATABASE_URL || "https://plain-culture-default-rtdb.firebaseio.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "plain-culture",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "plain-culture.firebasestorage.app",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "523508759359",
  appId: env.VITE_FIREBASE_APP_ID || "1:523508759359:web:4e30a0b1021589abe0318a",
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || "G-RMSCY5FMXM"
};

// Check if valid Firebase configuration is provided (always true now with provided config)
const isFirebaseConfigured = true;

export let app: any = null;
export let auth: any = null;
export let db: any = null;
export let analytics: any = null;

export const ensureFirebaseAuthSession = async () => {
  if (!isFirebaseConfigured || !auth) return null;
  if (auth.currentUser) return auth.currentUser;

  try {
    const credential = await signInAnonymously(auth);
    return credential.user;
  } catch (error) {
    console.error("Anonymous Firebase auth failed. Cross-browser sync may be blocked by Firebase rules:", error);
    return null;
  }
};

if (isFirebaseConfigured) {
  try {
    // Uses the exact Firebase app bootstrap pattern provided by the user.
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);

    // Analytics intentionally disabled to avoid ad-blocker/gtag connection errors during order sync testing.
    analytics = null;

    console.log("🔥 Firebase initialized successfully!");
  } catch (error) {
    console.error("❌ Error initializing Firebase, falling back to Mock DB:", error);
    app = null;
    analytics = null;
  }
}

export { isFirebaseConfigured };

// ==========================================
// TYPES & SCHEMAS
// ==========================================
export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  images: string[];
  sizes: string[]; // ['S', 'M', 'L', 'XL']
  stockQuantity: number;
  isActive: boolean;
  createdAt: string; // ISO string
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  qty: number;
  size: string;
  image: string;
}

export interface Order {
  id: string;
  customerName: string;
  phone: string;
  address: string;
  items: OrderItem[];
  totalAmount: number;
  status: "Pending" | "Confirmed" | "Delivered";
  createdAt: string; // ISO string
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  location: string;
  totalOrders: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUserRecord {
  id: string;
  name: string;
  email: string;
  password: string;
  role: "Super Admin" | "Admin" | "Partner" | "Manager";
  customRoleName?: string; // Custom display name for the role (e.g. "Senior Manager", "Co-Founder")
  createdAt: string;
  isActive: boolean;
  trackingCode: string;
}

export interface AdminActivity {
  id: string;
  adminEmail: string;
  adminName: string;
  action: string;
  timestamp: string;
}

// ==========================================
// MOCK DATA SEED
// ==========================================
const DEFAULT_PRODUCTS: Product[] = [
  {
    id: "prod-onyx",
    name: "Onyx Black Heavyweight Tee",
    price: 15000,
    description: "Our signature boxy-fit tee made from 280GSM ultra-soft organic cotton. Features custom ribbed neck detail, dropped shoulders, and structural drape. Tailored for comfort and styled for luxury minimalism in Ibadan's creative spaces.",
    images: ["/images/tee_onyx.jpg"],
    sizes: ["S", "M", "L", "XL"],
    stockQuantity: 12,
    isActive: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString() // 5 days ago
  },
  {
    id: "prod-sand",
    name: "Sand Cream Boxy Tee",
    price: 13500,
    description: "An exceptional heavyweight tee inspired by natural sand dunes. Crafted with premium combed cotton that gets softer with every wash. Perfect minimalist colorway that elevates any neutral outfit coordinate.",
    images: ["/images/tee_sand.jpg"],
    sizes: ["S", "M", "L", "XL"],
    stockQuantity: 8,
    isActive: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString() // 4 days ago
  },
  {
    id: "prod-charcoal",
    name: "Acid Charcoal Ribbed Tee",
    price: 14000,
    description: "A gorgeous acid-washed charcoal black tee offering a subtle vintage fade. Pre-shrunk and double-stitched for active wear, providing unmatched heavy structure and a high-fashion drape.",
    images: ["/images/tee_charcoal.jpg"],
    sizes: ["S", "M", "L", "XL"],
    stockQuantity: 5,
    isActive: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString() // 3 days ago
  },
  {
    id: "prod-olive",
    name: "Ibadan Earth Olive Tee",
    price: 12000,
    description: "Artisanal deep forest green tee reflecting the rich natural soils and tropical canopy of Ibadan. Highly breathable 240GSM cotton tailored with double-needle hems for maximum longevity.",
    images: ["/images/tee_olive.jpg"],
    sizes: ["S", "M", "L"],
    stockQuantity: 0, // This one is Sold Out! Perfect for testing stock handling
    isActive: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString() // 2 days ago
  }
];

const DEFAULT_ORDERS: Order[] = [
  {
    id: "PC-9871",
    customerName: "Adebayo Alao",
    phone: "+234805551234",
    address: "Ventures Park, Ibadan, Oyo State",
    items: [
      {
        id: "prod-onyx",
        name: "Onyx Black Heavyweight Tee",
        price: 15000,
        qty: 1,
        size: "L",
        image: "/images/tee_onyx.jpg"
      }
    ],
    totalAmount: 15000,
    status: "Confirmed",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString() // 5 hours ago
  },
  {
    id: "PC-4321",
    customerName: "Chinonso Okafor",
    phone: "+2348123456789",
    address: "UI Campus, Ibadan",
    items: [
      {
        id: "prod-sand",
        name: "Sand Cream Boxy Tee",
        price: 13500,
        qty: 1,
        size: "M",
        image: "/images/tee_sand.jpg"
      }
    ],
    totalAmount: 13500,
    status: "Pending",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() // 2 hours ago
  }
];

const DEFAULT_CUSTOMERS: Customer[] = [
  {
    id: "+234805551234",
    name: "Adebayo Alao",
    phone: "+234805551234",
    email: "adebayo@gmail.com",
    location: "Ventures Park, Ibadan",
    totalOrders: 1,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString()
  },
  {
    id: "+2348123456789",
    name: "Chinonso Okafor",
    phone: "+2348123456789",
    email: "chinonso.okafor@tech.io",
    location: "UI Campus, Ibadan",
    totalOrders: 1,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
  }
];

// Settings Store with fully editable website texts and updated address
const DEFAULT_SETTINGS = {
  email: "plainculture.ng@gmail.com",
  phone: "+2348088171549",
  dropEndDate: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(), // 48 hours from now (editable)
  countdownEnabled: true, // admin toggle to show/hide countdown timer
  marqueeText: "CURRENT DROP 01: IBADAN ARTISANAL MINIMALISM • VERY LIMITED STOCK • SAME DAY DELIVERY WITHIN IBADAN • FREE SHIPPING ON ORDERS ABOVE ₦25,000",
  marqueeEnabled: true,
  logoUrl: "", // legacy fallback
  logoUrlDark: "", // dark mode logo (empty = text logo)
  logoUrlLight: "", // light mode logo (empty = text logo)
  showLogoAndText: true, // true allows logo and text brand title to be shown simultaneously
  brandName: "PLAIN CULTURE",
  brandTagline: "IBADAN • NIGERIA",
  physicalAddress: "Ibadan, Oyo-State, Nigeria.",
  // HERO SECTION TEXTS AND CUSTOM RESPONSIVE BACKGROUNDS
  heroTitle: "CHANNELS OF PURE CULTURE",
  heroSubtitle: "Heavyweight luxury blanks tailored for creative minds. Zero compromise. Structured boxy drapes engineered to handle the Nigerian weather while holding an exquisite minimalist shape.",
  heroImageDesktop: "/images/hero.jpg",
  heroImageMobile: "/images/hero.jpg",
  // MANIFESTO SECTION TEXTS AND CUSTOM RESPONSIVE BACKGROUNDS
  manifestoTitle: "WHY DO WE ONLY MAKE HEAVYWEIGHT BLANKS?",
  manifestoText1: "Most standard fashion brands produce 140GSM-160GSM lightweight polyester blend shirts. They lose form instantly, shrink in standard Ibadan wash cycles, and look flat.",
  manifestoText2: "Plain Culture shirts are structured from 280GSM pure combed organic cotton. This provides an exquisite boxy drape, drops beautifully around the shoulders, provides breathable comfort in our warm tropical climate, and retains structural shape forever.",
  manifestoImageDesktop: "/images/hero.jpg",
  manifestoImageMobile: "/images/hero.jpg",
  // FOOTER SOCIAL HANDLES (fully editable from Admin)
  instagramHandle: "@plainculture.ng",
  twitterHandle: "@plainculture",
  tiktokHandle: "@plainculture",
  facebookHandle: "@plainculture", // Facebook (icon only, text hidden in footer)
  // FOOTER BRAND DESCRIPTION
  footerBrandDescription: "We engineer luxury minimalist garments with a focus on heavyweight structure. Every single piece is sourced, assembled, and dispatched by hand from our creative studio.",
  // DROP POLICY TEXT
  dropPolicy: "Small-Batch Releases. All sales final. No stock holds without WhatsApp checkout verification. Same-day delivery within Ibadan city limits.",
  // TRUST FACTORS
  trustFactor1Title: "100% SECURE CHECKOUT",
  trustFactor1Subtitle: "Order verification directly via WhatsApp channel",
  trustFactor2Title: "LOCAL COURIER NETWORK",
  trustFactor2Subtitle: "Same-day packaging & swift courier delivery within Ibadan",
  trustFactor3Title: "EXCLUSIVE LIMITED DROPS",
  trustFactor3Subtitle: "Scarcity-driven batches. Once sold out, it is gone.",
  // RETURN POLICY PAGE CONTENT
  returnPolicyTitle: "Return & Exchange Policy",
  returnPolicyContent: "At Plain Culture, we stand behind the quality of our products. However, we have a strict return policy to maintain the integrity of our small-batch releases.\n\n**Return Eligibility:**\n• Returns must be initiated within 7 days of delivery\n• Items must be unworn, unwashed, and in original condition\n• All tags must be attached and intact\n• Items must be in resalable condition\n\n**Non-Returnable Items:**\n• Items purchased during final sale events\n• Customized or personalized pieces\n• Items with signs of wear or damage\n\n**Return Process:**\n1. Contact us via WhatsApp at +2348088171549\n2. Provide your order ID and reason for return\n3. We will provide return shipping details\n4. Once received and inspected, refunds are processed within 5-7 business days\n\n**Exchange:**\nWe offer exchanges for size or color at no original condition within 14 days of purchase.\n\n**Contact Us:**\nEmail: plainculture.ng@gmail.com\nWhatsApp: +2348088171549",
  payment: {
    bankName: "GTBank",
    accountNumber: "0123456789",
    accountName: "Plain Culture Clothing Ltd"
  },
  presetAssets: [
    { label: "Onyx", value: "/images/tee_onyx.jpg" },
    { label: "Sand", value: "/images/tee_sand.jpg" },
    { label: "Charcoal", value: "/images/tee_charcoal.jpg" },
    { label: "Olive", value: "/images/tee_olive.jpg" }
  ]
};

export type StoreSettings = typeof DEFAULT_SETTINGS;

const DEFAULT_ADMINS: AdminUserRecord[] = [
  {
    id: "plainculture-super-admin",
    name: "Chief Super Admin",
    email: "plainculture.ng@gmail.com",
    password: "ibadanminimalist2026",
    role: "Super Admin",
    createdAt: new Date().toISOString(),
    isActive: true,
    trackingCode: "ADM-SUPER"
  }
];

// Initial mock activities array to give immediate helpful demonstration context
const DEFAULT_ACTIVITIES: AdminActivity[] = [
  {
    id: "act-1",
    adminEmail: "system@plainculture.ng",
    adminName: "System Engine",
    action: "Initialized exclusive Super Admin security token controls for plainculture.ng@gmail.com",
    timestamp: new Date(Date.now() - 1000 * 60 * 65).toISOString()
  }
];

// ==========================================
// SIMULATED DATABASE LOGIC (LOCAL STORAGE)
// ==========================================
class SimulatedDatabase {
  private listeners: { [key: string]: Function[] } = {};

  constructor() {
    this.init();
  }

  private init() {
    if (!localStorage.getItem("pc_products")) {
      localStorage.setItem("pc_products", JSON.stringify(DEFAULT_PRODUCTS));
    }
    if (!localStorage.getItem("pc_orders")) {
      localStorage.setItem("pc_orders", JSON.stringify(DEFAULT_ORDERS));
    }
    if (!localStorage.getItem("pc_customers")) {
      localStorage.setItem("pc_customers", JSON.stringify(DEFAULT_CUSTOMERS));
    }
    if (!localStorage.getItem("pc_settings")) {
      localStorage.setItem("pc_settings", JSON.stringify(DEFAULT_SETTINGS));
    }
    if (!localStorage.getItem("pc_admins")) {
      localStorage.setItem("pc_admins", JSON.stringify(DEFAULT_ADMINS));
    }
    if (!localStorage.getItem("pc_activities")) {
      localStorage.setItem("pc_activities", JSON.stringify(DEFAULT_ACTIVITIES));
    }
    if (!localStorage.getItem("pc_admin_user")) {
      localStorage.setItem("pc_admin_user", JSON.stringify({ email: "plainculture.ng@gmail.com", name: "Chief Super Admin" }));
    }
  }

  // Real-time Simulation Trigger
  private notify(collectionName: string) {
    if (this.listeners[collectionName]) {
      const data = this.getData(collectionName);
      this.listeners[collectionName].forEach(cb => cb(data));
    }
  }

  public getData(collectionName: string): any[] {
    const key = `pc_${collectionName}`;
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : [];
  }

  public saveData(collectionName: string, data: any[]) {
    localStorage.setItem(`pc_${collectionName}`, JSON.stringify(data));
    this.notify(collectionName);
  }

  public subscribe(collectionName: string, callback: Function): () => void {
    if (!this.listeners[collectionName]) {
      this.listeners[collectionName] = [];
    }
    this.listeners[collectionName].push(callback);
    // Initial call
    callback(this.getData(collectionName));

    // Return unsubscribe function
    return () => {
      this.listeners[collectionName] = this.listeners[collectionName].filter(cb => cb !== callback);
    };
  }
}

export const mockDb = new SimulatedDatabase();

// ==========================================
// UNIFIED DATA SERVICE (FIREBASE WITH FALLBACK)
// ==========================================

export const dbService = {
  // PRODUCTS
  subscribeProducts: (callback: (products: Product[]) => void) => {
    // Show cache immediately while Firestore connects.
    callback(mockDb.getData("products") as Product[]);
    let unsubscribeFirebase: (() => void) | undefined;

    if (isFirebaseConfigured && db) {
      ensureFirebaseAuthSession().then(() => {
        const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
        unsubscribeFirebase = onSnapshot(q, (snapshot) => {
          // Firestore snapshot is the full product list. No merging with stale local cache.
          // This makes edits/deletes sync correctly across browsers.
          const productsList: Product[] = [];
          snapshot.forEach((docItem) => {
            productsList.push({ id: docItem.id, ...docItem.data() } as Product);
          });
          mockDb.saveData("products", productsList);
          callback(productsList);
        }, (error) => {
          console.warn("Firebase products sync error:", error);
        });
      });
    }

    return () => {
      if (unsubscribeFirebase) unsubscribeFirebase();
    };
  },

  getProducts: async (): Promise<Product[]> => {
    if (isFirebaseConfigured && db) {
      try {
        await ensureFirebaseAuthSession();
        const querySnapshot = await getDocs(collection(db, "products"));
        const productsList: Product[] = [];
        querySnapshot.forEach((doc) => {
          productsList.push({ id: doc.id, ...doc.data() } as Product);
        });
        return productsList;
      } catch (e) {
        console.error("Error loading products from Firebase:", e);
        return mockDb.getData("products");
      }
    } else {
      return mockDb.getData("products");
    }
  },

  addProduct: async (productData: Omit<Product, "id" | "createdAt">): Promise<Product> => {
    const newProduct: Product = {
      ...productData,
      id: "prod-" + Math.random().toString(36).substring(2, 9),
      createdAt: new Date().toISOString()
    };

    if (isFirebaseConfigured && db) {
      try {
        await ensureFirebaseAuthSession();
        await setDoc(doc(db, "products", newProduct.id), newProduct);
        console.log("Product saved to Firebase!");
      } catch (e) {
        console.error("Firebase addProduct error:", e);
      }
    }

    const products = mockDb.getData("products");
    products.unshift(newProduct);
    mockDb.saveData("products", products);
    return newProduct;
  },

  updateProduct: async (id: string, updatedFields: Partial<Product>): Promise<void> => {
    const products = mockDb.getData("products");
    const index = products.findIndex((p) => p.id === id);
    if (index !== -1) {
      products[index] = { ...products[index], ...updatedFields };
      mockDb.saveData("products", products);
    }

    if (isFirebaseConfigured && db) {
      try {
        await ensureFirebaseAuthSession();
        const docRef = doc(db, "products", id);
        await updateDoc(docRef, updatedFields);
        console.log("Product updated in Firebase!");
      } catch (e) {
        console.error("Firebase updateProduct error:", e);
      }
    }

  },

  deleteProduct: async (id: string): Promise<void> => {
    const products = mockDb.getData("products");
    const filtered = products.filter((p) => p.id !== id);
    mockDb.saveData("products", filtered);

    if (isFirebaseConfigured && db) {
      try {
        await ensureFirebaseAuthSession();
        await deleteDoc(doc(db, "products", id));
        console.log("Product deleted from Firebase!");
      } catch (e) {
        console.error("Firebase deleteProduct error:", e);
      }
    }
  },

  // ORDERS — Firestore is the single source of truth for cross-browser sync.
  // Local cache is only used as immediate fallback before Firestore connects.
  subscribeOrders: (callback: (orders: Order[]) => void) => {
    // Show local cache immediately so the UI is not empty while Firebase connects.
    callback(mockDb.getData("orders") as Order[]);

    let unsubscribeFirebase: (() => void) | undefined;

    if (isFirebaseConfigured && db) {
      ensureFirebaseAuthSession().then(() => {
        const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
        unsubscribeFirebase = onSnapshot(q, (snapshot) => {
          // Firestore snapshot IS the full order list. No merging. No tombstones.
          // If an order was deleted, it simply won't be in this list.
          const orders: Order[] = [];
          snapshot.forEach((d) => {
            orders.push({ id: d.id, ...d.data() } as Order);
          });
          // Replace local cache completely so all browsers show the same data.
          mockDb.saveData("orders", orders);
          callback(orders);
        }, (error) => {
          console.warn("Firebase orders sync error:", error);
        });
      });
    }

    return () => {
      if (unsubscribeFirebase) unsubscribeFirebase();
    };
  },

  addOrder: async (orderData: Omit<Order, "id" | "createdAt" | "status">): Promise<Order> => {
    // Generate order ID like PC-7489
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const newOrder: Order = {
      ...orderData,
      id: `PC-${randomNum}`,
      status: "Pending",
      createdAt: new Date().toISOString()
    };

    const orders = mockDb.getData("orders");
    orders.unshift(newOrder);
    mockDb.saveData("orders", orders);

    // 1. Save order to Firestore — triggers onSnapshot in all browsers for cross-browser sync.
    if (isFirebaseConfigured && db) {
      try {
        await ensureFirebaseAuthSession();
        await setDoc(doc(db, "orders", newOrder.id), newOrder);
        console.log("Order saved to Firebase!");
      } catch (e) {
        console.error("Firebase addOrder error:", e);
      }
    }

    // 2. Decrement stock for purchased products
    for (const item of newOrder.items) {
      const currentProducts = mockDb.getData("products");
      const prodIndex = currentProducts.findIndex((p) => p.id === item.id);
      if (prodIndex !== -1) {
        const currentStock = currentProducts[prodIndex].stockQuantity;
        const newStock = Math.max(0, currentStock - item.qty);
        currentProducts[prodIndex].stockQuantity = newStock;
        mockDb.saveData("products", currentProducts);

        // Notify admin dashboard when a product hits the critical 2-piece threshold.
        if (newStock === 2) {
          dbService.logActivity(
            "system@plainculture.ng",
            "Inventory Alert",
            `LOW STOCK ALERT: "${currentProducts[prodIndex].name}" has only 2 pieces remaining after Order #${newOrder.id}.`
          ).catch((e) => console.error("Low stock activity log error:", e));

          window.dispatchEvent(new CustomEvent("pc_low_stock_alert", {
            detail: {
              productId: item.id,
              productName: currentProducts[prodIndex].name,
              stockQuantity: newStock,
              orderId: newOrder.id
            }
          }));
        }

        // Update firebase stock asynchronously
        if (isFirebaseConfigured && db) {
          updateDoc(doc(db, "products", item.id), { stockQuantity: newStock })
            .then(() => console.log("Firebase stock updated!"))
            .catch((e) => console.error("Firebase stock update error:", e));
        }
      }
    }

    // 3. Automatically create/update customer record (match by Phone Number)
    dbService.upsertCustomer({
      name: newOrder.customerName,
      phone: newOrder.phone,
      location: newOrder.address,
      email: "" // Optional
    }).catch((e) => console.error("Error upserting customer:", e));

    return newOrder;
  },

  updateOrderStatus: async (id: string, status: "Pending" | "Confirmed" | "Delivered"): Promise<void> => {
    // Local-first update: dashboard buttons must respond instantly even if Firebase is slow/offline.
    const orders = mockDb.getData("orders");
    const index = orders.findIndex((o) => o.id === id);
    if (index !== -1) {
      orders[index].status = status;
      mockDb.saveData("orders", orders);
    }

    if (isFirebaseConfigured && db) {
      try {
        await ensureFirebaseAuthSession();
        await updateDoc(doc(db, "orders", id), { status });
        console.log("Order status updated in Firebase!");
      } catch (e) {
        console.error("Firebase updateOrderStatus error:", e);
      }
    }
  },

  deleteOrder: async (id: string): Promise<void> => {
    // Remove locally for instant UI response.
    const orders = mockDb.getData("orders");
    const filtered = orders.filter((o) => o.id !== id);
    mockDb.saveData("orders", filtered);

    // Delete from Firestore. The onSnapshot listener in every other browser
    // will fire automatically and deliver a new snapshot WITHOUT this order.
    // That is all that is needed for cross-browser delete sync.
    if (isFirebaseConfigured && db) {
      try {
        await ensureFirebaseAuthSession();
        await deleteDoc(doc(db, "orders", id));
      } catch (e) {
        console.error("Firebase deleteOrder error:", e);
      }
    }
  },

  // CUSTOMERS
  subscribeCustomers: (callback: (customers: Customer[]) => void) => {
    if (isFirebaseConfigured && db) {
      const q = query(collection(db, "customers"), orderBy("updatedAt", "desc"));
      return onSnapshot(q, (snapshot) => {
        const customersList: Customer[] = [];
        snapshot.forEach((doc) => {
          customersList.push({ id: doc.id, ...doc.data() } as Customer);
        });
        callback(customersList);
      }, (error) => {
        console.error("Firebase customers subscription error:", error);
        return mockDb.subscribe("customers", callback);
      });
    } else {
      return mockDb.subscribe("customers", callback);
    }
  },

  getCustomers: async (): Promise<Customer[]> => {
    if (isFirebaseConfigured && db) {
      try {
        const querySnapshot = await getDocs(collection(db, "customers"));
        const customers: Customer[] = [];
        querySnapshot.forEach((doc) => {
          customers.push({ id: doc.id, ...doc.data() } as Customer);
        });
        return customers;
      } catch (e) {
        return mockDb.getData("customers");
      }
    } else {
      return mockDb.getData("customers");
    }
  },

  upsertCustomer: async (customerData: { name: string; phone: string; location: string; email?: string }): Promise<void> => {
    const customers = mockDb.getData("customers");
    const formattedPhone = customerData.phone.trim();
    const existingIndex = customers.findIndex((c) => c.phone.trim() === formattedPhone);

    const nowStr = new Date().toISOString();

    if (existingIndex !== -1) {
      // Update existing customer
      const existing = customers[existingIndex];
      const updatedCustomer: Customer = {
        ...existing,
        name: customerData.name || existing.name,
        location: customerData.location || existing.location,
        email: customerData.email || existing.email || "",
        totalOrders: existing.totalOrders + 1,
        updatedAt: nowStr
      };

      customers[existingIndex] = updatedCustomer;
      mockDb.saveData("customers", customers);

      if (isFirebaseConfigured && db) {
        setDoc(doc(db, "customers", formattedPhone), updatedCustomer, { merge: true })
          .catch((e) => console.error("Firebase upsertCustomer error:", e));
      }
    } else {
      // Create new customer
      const newCustomer: Customer = {
        id: formattedPhone,
        name: customerData.name,
        phone: formattedPhone,
        email: customerData.email || "",
        location: customerData.location,
        totalOrders: 1,
        createdAt: nowStr,
        updatedAt: nowStr
      };

      customers.unshift(newCustomer);
      mockDb.saveData("customers", customers);

      if (isFirebaseConfigured && db) {
        setDoc(doc(db, "customers", formattedPhone), newCustomer)
          .catch((e) => console.error("Firebase upsertCustomer error:", e));
      }
    }
  },

  addManualCustomer: async (customer: Omit<Customer, "id" | "createdAt" | "updatedAt">): Promise<Customer> => {
    const nowStr = new Date().toISOString();
    const newCustomer: Customer = {
      ...customer,
      id: customer.phone.trim(),
      createdAt: nowStr,
      updatedAt: nowStr
    };

    const customers = mockDb.getData("customers");
    // check duplicate phone
    const existingIndex = customers.findIndex((c) => c.phone.trim() === newCustomer.phone.trim());
    if (existingIndex !== -1) {
      customers[existingIndex] = {
        ...customers[existingIndex],
        ...newCustomer,
        updatedAt: nowStr
      };
    } else {
      customers.unshift(newCustomer);
    }

    mockDb.saveData("customers", customers);

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, "customers", newCustomer.id), newCustomer);
      } catch (e) {
        console.error("Firebase addManualCustomer error:", e);
      }
    }

    return newCustomer;
  },

  deleteCustomer: async (phone: string): Promise<void> => {
    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, "customers", phone));
      } catch (e) {
        console.error("Firebase deleteCustomer error:", e);
      }
    }

    const customers = mockDb.getData("customers");
    const filtered = customers.filter((c) => c.phone !== phone);
    mockDb.saveData("customers", filtered);
  },

  // ADMINS
  getAdmins: (): AdminUserRecord[] => {
    const saved = localStorage.getItem("pc_admins");
    if (!saved) return DEFAULT_ADMINS;
    const parsed = JSON.parse(saved) as AdminUserRecord[];
    const merged = [...DEFAULT_ADMINS];
    parsed.forEach((admin) => {
      if (!merged.some((item) => item.email.toLowerCase() === admin.email.toLowerCase())) {
        merged.push(admin);
      } else {
        const idx = merged.findIndex((item) => item.email.toLowerCase() === admin.email.toLowerCase());
        merged[idx] = { ...merged[idx], ...admin };
      }
    });
    localStorage.setItem("pc_admins", JSON.stringify(merged));
    return merged;
  },

  getAdminsAsync: async (): Promise<AdminUserRecord[]> => {
    if (isFirebaseConfigured && db) {
      try {
        await ensureFirebaseAuthSession();
        const snapshot = await getDocs(collection(db, "admins"));
        const firebaseAdmins: AdminUserRecord[] = [];
        snapshot.forEach((docItem) => {
          firebaseAdmins.push({ ...docItem.data() } as AdminUserRecord);
        });
        if (firebaseAdmins.length > 0) {
          const merged = [...DEFAULT_ADMINS];
          firebaseAdmins.forEach((admin) => {
            if (!merged.some((item) => item.email.toLowerCase() === admin.email.toLowerCase())) {
              merged.push(admin);
            } else {
              const idx = merged.findIndex((item) => item.email.toLowerCase() === admin.email.toLowerCase());
              merged[idx] = { ...merged[idx], ...admin };
            }
          });
          localStorage.setItem("pc_admins", JSON.stringify(merged));
          return merged;
        }
      } catch (e) {
        console.error("Firebase getAdminsAsync error:", e);
      }
    }
    return dbService.getAdmins();
  },

  subscribeAdmins: (callback: (admins: AdminUserRecord[]) => void): (() => void) => {
    if (isFirebaseConfigured && db) {
      const q = query(collection(db, "admins"), orderBy("createdAt", "asc"));
      const unsubscribeFirebase = onSnapshot(q, (snapshot) => {
        const firebaseAdmins: AdminUserRecord[] = [];
        snapshot.forEach((docItem) => {
          firebaseAdmins.push({ ...docItem.data() } as AdminUserRecord);
        });
        if (firebaseAdmins.length > 0) {
          const merged = [...DEFAULT_ADMINS];
          firebaseAdmins.forEach((admin) => {
            if (!merged.some((item) => item.email.toLowerCase() === admin.email.toLowerCase())) {
              merged.push(admin);
            } else {
              const idx = merged.findIndex((item) => item.email.toLowerCase() === admin.email.toLowerCase());
              merged[idx] = { ...merged[idx], ...admin };
            }
          });
          localStorage.setItem("pc_admins", JSON.stringify(merged));
          window.dispatchEvent(new CustomEvent("pc_admins_changed", { detail: merged }));
          callback(merged);
        } else {
          callback(dbService.getAdmins());
        }
      }, (error) => {
        console.error("Firebase admins subscription error:", error);
      });

      const handler = (e: Event) => {
        const evt = e as CustomEvent;
        callback(evt.detail || dbService.getAdmins());
      };
      window.addEventListener("pc_admins_changed", handler);
      callback(dbService.getAdmins());
      return () => {
        unsubscribeFirebase();
        window.removeEventListener("pc_admins_changed", handler);
      };
    }

    callback(dbService.getAdmins());
    const handler = (e: Event) => {
      const evt = e as CustomEvent;
      callback(evt.detail || dbService.getAdmins());
    };
    window.addEventListener("pc_admins_changed", handler);
    return () => window.removeEventListener("pc_admins_changed", handler);
  },

  addAdmin: async (adminData: { name: string; email: string; password: string; role?: "Admin" | "Partner"; customRoleName?: string }): Promise<AdminUserRecord> => {
    const admins = dbService.getAdmins();
    const email = adminData.email.trim().toLowerCase();
    const existing = admins.find((admin) => admin.email.toLowerCase() === email);

    if (existing) {
      throw new Error("A team member with this email already exists.");
    }

    const role = adminData.role || "Admin";
    // Partners get a "PTR-" tracking code, Admins get "ADM-"
    const codePrefix = role === "Partner" ? "PTR" : "ADM";

    const newAdmin: AdminUserRecord = {
      id: `${role === "Partner" ? "partner" : "admin"}-${Math.random().toString(36).slice(2, 10)}`,
      name: adminData.name.trim(),
      email,
      password: adminData.password,
      role,
      customRoleName: adminData.customRoleName || undefined,
      createdAt: new Date().toISOString(),
      isActive: true,
      trackingCode: `${codePrefix}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    };

    const updated = [...admins, newAdmin];
    localStorage.setItem("pc_admins", JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("pc_admins_changed", { detail: updated }));

    if (isFirebaseConfigured && db) {
      // Write the full admin record (including password) so other browsers can authenticate this user.
      // Firestore rules already restrict reads to authenticated sessions.
      ensureFirebaseAuthSession()
        .then(() => setDoc(doc(db, "admins", newAdmin.id), newAdmin))
        .catch((e) => console.error("Firebase addAdmin error:", e));
    }

    return newAdmin;
  },

  // Convenience helper for adding a Business Partner with read-only financial access.
  addPartner: async (partnerData: { name: string; email: string; password: string }): Promise<AdminUserRecord> => {
    return dbService.addAdmin({ ...partnerData, role: "Partner" });
  },

  deleteAdmin: async (id: string): Promise<void> => {
    const admins = dbService.getAdmins();
    const protectedIds = new Set(DEFAULT_ADMINS.map((admin) => admin.id));

    if (protectedIds.has(id)) {
      throw new Error("Primary admin accounts cannot be deleted.");
    }

    const updated = admins.filter((admin) => admin.id !== id);
    localStorage.setItem("pc_admins", JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("pc_admins_changed", { detail: updated }));

    if (isFirebaseConfigured && db) {
      deleteDoc(doc(db, "admins", id)).catch((e) => console.error("Firebase deleteAdmin metadata error:", e));
    }
  },

  // Update an admin/partner password (used by the account owner themselves).
  // Verifies current password, then updates both local cache and Firestore.
  updateSelfPassword: async (email: string, currentPassword: string, newPassword: string): Promise<boolean> => {
    const admins = dbService.getAdmins();
    const targetIndex = admins.findIndex((a) => a.email.toLowerCase() === email.toLowerCase());

    if (targetIndex === -1) {
      throw new Error("Account not found.");
    }

    if (admins[targetIndex].password !== currentPassword) {
      throw new Error("Current password is incorrect.");
    }

    admins[targetIndex].password = newPassword;
    localStorage.setItem("pc_admins", JSON.stringify(admins));
    window.dispatchEvent(new CustomEvent("pc_admins_changed", { detail: admins }));

    if (isFirebaseConfigured && db) {
      try {
        await ensureFirebaseAuthSession();
        await updateDoc(doc(db, "admins", admins[targetIndex].id), { password: newPassword });
      } catch (e) {
        console.error("Firebase updateSelfPassword error:", e);
        throw new Error("Failed to sync new password to cloud.");
      }
    }

    return true;
  },

  toggleAdminStatus: async (id: string): Promise<void> => {
    const admins = dbService.getAdmins();
    const adminIndex = admins.findIndex((a) => a.id === id);
    
    if (adminIndex === -1) throw new Error("Admin not found.");
    
    if (admins[adminIndex].role === "Super Admin") {
      throw new Error("Cannot deactivate a Super Admin account.");
    }

    admins[adminIndex].isActive = !admins[adminIndex].isActive;
    
    localStorage.setItem("pc_admins", JSON.stringify(admins));
    window.dispatchEvent(new CustomEvent("pc_admins_changed", { detail: admins }));

    if (isFirebaseConfigured && db) {
      updateDoc(doc(db, "admins", id), { isActive: admins[adminIndex].isActive })
        .catch((e) => console.error("Firebase toggleAdminStatus error:", e));
    }
  },

  // ACTIVITIES TRACKING
  getActivities: (): AdminActivity[] => {
    const saved = localStorage.getItem("pc_activities");
    return saved ? JSON.parse(saved) : [];
  },

  logActivity: async (email: string, name: string, action: string): Promise<void> => {
    const logs = dbService.getActivities();
    const newLog: AdminActivity = {
      id: `log-${Math.random().toString(36).substring(2, 9)}`,
      adminEmail: email,
      adminName: name,
      action,
      timestamp: new Date().toISOString()
    };
    logs.unshift(newLog);
    localStorage.setItem("pc_activities", JSON.stringify(logs));
    window.dispatchEvent(new CustomEvent("pc_activities_changed", { detail: logs }));

    if (isFirebaseConfigured && db) {
      setDoc(doc(db, "activities", newLog.id), newLog).catch((e) => console.error("Firebase activity log error:", e));
    }
  },

  subscribeActivities: (callback: (logs: AdminActivity[]) => void): (() => void) => {
    if (isFirebaseConfigured && db) {
      const q = query(collection(db, "activities"), orderBy("timestamp", "desc"));
      const unsubscribeFirebase = onSnapshot(q, (snapshot) => {
        const firebaseLogs: AdminActivity[] = [];
        snapshot.forEach((docItem) => {
          firebaseLogs.push({ ...docItem.data() } as AdminActivity);
        });
        if (firebaseLogs.length > 0) {
          localStorage.setItem("pc_activities", JSON.stringify(firebaseLogs));
          window.dispatchEvent(new CustomEvent("pc_activities_changed", { detail: firebaseLogs }));
          callback(firebaseLogs);
        } else {
          callback(dbService.getActivities());
        }
      }, (error) => {
        console.error("Firebase activities subscription error:", error);
      });

      const handler = (e: Event) => {
        const evt = e as CustomEvent;
        callback(evt.detail || dbService.getActivities());
      };
      window.addEventListener("pc_activities_changed", handler);
      callback(dbService.getActivities());
      return () => {
        unsubscribeFirebase();
        window.removeEventListener("pc_activities_changed", handler);
      };
    }

    callback(dbService.getActivities());
    const handler = (e: Event) => {
      const evt = e as CustomEvent;
      callback(evt.detail || dbService.getActivities());
    };
    window.addEventListener("pc_activities_changed", handler);
    return () => window.removeEventListener("pc_activities_changed", handler);
  },

  deleteActivity: async (id: string): Promise<void> => {
    const logs = dbService.getActivities();
    const filtered = logs.filter((log) => log.id !== id);
    localStorage.setItem("pc_activities", JSON.stringify(filtered));
    window.dispatchEvent(new CustomEvent("pc_activities_changed", { detail: filtered }));

    if (isFirebaseConfigured && db) {
      deleteDoc(doc(db, "activities", id)).catch((e) => console.error("Firebase deleteActivity error:", e));
    }
  },

  deleteAllActivities: async (): Promise<void> => {
    const logs = dbService.getActivities();
    localStorage.setItem("pc_activities", JSON.stringify([]));
    window.dispatchEvent(new CustomEvent("pc_activities_changed", { detail: [] }));

    if (isFirebaseConfigured && db) {
      logs.forEach((log) => {
        deleteDoc(doc(db, "activities", log.id)).catch((e) => console.error("Firebase deleteActivity error:", e));
      });
    }
  },

  // SETTINGS (with real-time cross-browser support)
  getSettings: (): StoreSettings => {
    const settings = localStorage.getItem("pc_settings");
    if (!settings) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(settings) };
  },

  updateSettings: (newSettings: Partial<StoreSettings>): StoreSettings => {
    const current = dbService.getSettings();
    const updated = { ...current, ...newSettings };
    localStorage.setItem("pc_settings", JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("pc_settings_changed", { detail: updated }));

    if (isFirebaseConfigured && db) {
      setDoc(doc(db, "settings", "global"), updated, { merge: true })
        .catch((e) => console.error("Firebase updateSettings error:", e));
    }

    return updated;
  },

  subscribeSettings: (callback: (settings: StoreSettings) => void): (() => void) => {
    if (isFirebaseConfigured && db) {
      const unsubscribeFirebase = onSnapshot(doc(db, "settings", "global"), (snapshot) => {
        if (snapshot.exists()) {
          const remoteSettings = { ...DEFAULT_SETTINGS, ...(snapshot.data() as Partial<StoreSettings>) } as StoreSettings;
          localStorage.setItem("pc_settings", JSON.stringify(remoteSettings));
          window.dispatchEvent(new CustomEvent("pc_settings_changed", { detail: remoteSettings }));
          callback(remoteSettings);
        } else {
          callback(dbService.getSettings());
        }
      }, (error) => {
        console.error("Firebase settings subscription error:", error);
      });

      const handler = (e: Event) => {
        const evt = e as CustomEvent;
        callback(evt.detail || dbService.getSettings());
      };
      window.addEventListener("pc_settings_changed", handler);
      callback(dbService.getSettings());
      return () => {
        unsubscribeFirebase();
        window.removeEventListener("pc_settings_changed", handler);
      };
    }

    callback(dbService.getSettings());
    const handler = (e: Event) => {
      const evt = e as CustomEvent;
      callback(evt.detail || dbService.getSettings());
    };
    window.addEventListener("pc_settings_changed", handler);
    const storageHandler = (e: StorageEvent) => {
      if (e.key === "pc_settings") callback(dbService.getSettings());
    };
    window.addEventListener("storage", storageHandler);
    return () => {
      window.removeEventListener("pc_settings_changed", handler);
      window.removeEventListener("storage", storageHandler);
    };
  }
};

// Security instructions metadata for firestore rules (as requested by rule specs)
export const FIREBASE_SECURITY_RULES_DECLARATION = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Products rules: read active is public, write is admin only
    match /products/{productId} {
      allow read: if resource == null || resource.data.isActive == true || request.auth != null;
      allow write: if request.auth != null;
    }

    // Orders rules: create is public, read/write is admin only
    match /orders/{orderId} {
      allow create: if true;
      allow read, write: if request.auth != null;
    }

    // Customers rules: create/update is public (so order flow works), read/write is admin only
    match /customers/{phone} {
      allow create, update: if true;
      allow read, delete: if request.auth != null;
    }
  }
}
`;
