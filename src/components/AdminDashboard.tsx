import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AppContext";
import { PartnerDashboard } from "./PartnerDashboard";
import { 
  dbService, 
  Product, 
  Order, 
  Customer,
  AdminUserRecord
} from "../lib/firebase";
import { 
  Shield, 
  LayoutDashboard, 
  ShoppingBag, 
  ClipboardList, 
  Users, 
  Settings, 
  Edit, 
  Trash2, 
  CheckCircle, 
  Clock, 
  Truck, 
  Search, 
  Filter, 
  Lock, 
  Mail, 
  Image as ImageIcon,
  Upload,
  Star,
  PlusCircle, 
  ToggleLeft, 
  ToggleRight, 
  TrendingUp, 
  X, 
  MapPin, 
  ArrowLeft 
} from "lucide-react";

const PRODUCT_IMAGE_LIMIT = 8;

const compressImageFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Only image files are allowed."));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Unable to read the image file."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Unable to decode the uploaded image."));
      img.onload = () => {
        const maxDimension = 900;
        const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
        const width = Math.round(img.width * scale);
        const height = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Image compression is not supported in this browser."));
          return;
        }

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // JPEG gives broad cross-browser support and keeps Firestore/local payloads small.
        resolve(canvas.toDataURL("image/jpeg", 0.68));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
};

interface AdminDashboardProps {
  onAddToast: (text: string, type: "success" | "error" | "info") => void;
  onNavigateToHome: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onAddToast, onNavigateToHome }) => {
  const { user, login, logout, updateAdminPassword } = useAuth();

  // Navigation within admin panel
  const [activeTab, setActiveTab] = useState<"dashboard" | "products" | "orders" | "customers" | "settings" | "activities">("dashboard");

  // Authentication inputs
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Live collections state
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [admins, setAdmins] = useState<AdminUserRecord[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [storeSettings, setStoreSettings] = useState(() => dbService.getSettings());

  // Subscription registers for real-time syncing
  useEffect(() => {
    if (!user) return;

    const unsubProducts = dbService.subscribeProducts((p) => setProducts(p));
    const unsubOrders = dbService.subscribeOrders((o) => setOrders(o));
    const unsubCustomers = dbService.subscribeCustomers((c) => setCustomers(c));
    const unsubAdmins = dbService.subscribeAdmins((a) => setAdmins(a));
    const unsubActivities = dbService.subscribeActivities((act) => setActivities(act));

    return () => {
      unsubProducts();
      unsubOrders();
      unsubCustomers();
      unsubAdmins();
      unsubActivities();
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const handler = (event: Event) => {
      const customEvent = event as CustomEvent;
      const detail = customEvent.detail as { productName: string; stockQuantity: number; orderId: string };
      onAddToast(
        `Low stock alert: ${detail.productName} has only ${detail.stockQuantity} pieces left after Order #${detail.orderId}.`,
        "error"
      );
    };

    window.addEventListener("pc_low_stock_alert", handler);
    return () => window.removeEventListener("pc_low_stock_alert", handler);
  }, [user, onAddToast]);

  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: "",
    price: 0,
    description: "",
    stockQuantity: 10,
    sizes: ["S", "M", "L", "XL"] as string[],
    images: ["/images/tee_onyx.jpg"] as string[],
    isActive: true
  });

  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerForm, setCustomerForm] = useState({
    name: "",
    phone: "",
    email: "",
    location: ""
  });

  const [adminForm, setAdminForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "Admin" as "Admin" | "Partner"
  });

  // Settings inputs - covers all editable fields
  const [settingsForm, setSettingsForm] = useState({
    email: storeSettings.email,
    phone: storeSettings.phone,
    newPassword: "",
    marqueeText: storeSettings.marqueeText,
    marqueeEnabled: storeSettings.marqueeEnabled,
    dropEndDate: storeSettings.dropEndDate.slice(0, 16),
    countdownEnabled: storeSettings.countdownEnabled,
    logoUrl: storeSettings.logoUrl,
    logoUrlDark: storeSettings.logoUrlDark,
    logoUrlLight: storeSettings.logoUrlLight,
    showLogoAndText: storeSettings.showLogoAndText !== false, // default true
    brandName: storeSettings.brandName,
    brandTagline: storeSettings.brandTagline,
    physicalAddress: storeSettings.physicalAddress,
    heroTitle: storeSettings.heroTitle,
    heroSubtitle: storeSettings.heroSubtitle,
    heroImageDesktop: storeSettings.heroImageDesktop || "/images/hero.jpg",
    heroImageMobile: storeSettings.heroImageMobile || "/images/hero.jpg",
    manifestoTitle: storeSettings.manifestoTitle,
    manifestoText1: storeSettings.manifestoText1,
    manifestoText2: storeSettings.manifestoText2,
    manifestoImageDesktop: storeSettings.manifestoImageDesktop || "/images/hero.jpg",
    manifestoImageMobile: storeSettings.manifestoImageMobile || "/images/hero.jpg",
    footerBrandDescription: storeSettings.footerBrandDescription,
    dropPolicy: storeSettings.dropPolicy,
    returnPolicyTitle: storeSettings.returnPolicyTitle,
    returnPolicyContent: storeSettings.returnPolicyContent,
    instagramHandle: storeSettings.instagramHandle,
    twitterHandle: storeSettings.twitterHandle,
    tiktokHandle: storeSettings.tiktokHandle,
    facebookHandle: storeSettings.facebookHandle || "",
    paymentBankName: storeSettings.payment.bankName,
    paymentAccountNumber: storeSettings.payment.accountNumber,
    paymentAccountName: storeSettings.payment.accountName
  });

  // Sync form when storeSettings update from elsewhere
  useEffect(() => {
    setSettingsForm({
      email: storeSettings.email,
      phone: storeSettings.phone,
      newPassword: "",
      marqueeText: storeSettings.marqueeText,
      marqueeEnabled: storeSettings.marqueeEnabled,
      dropEndDate: storeSettings.dropEndDate.slice(0, 16),
      countdownEnabled: storeSettings.countdownEnabled,
      logoUrl: storeSettings.logoUrl,
      logoUrlDark: storeSettings.logoUrlDark,
      logoUrlLight: storeSettings.logoUrlLight,
      showLogoAndText: storeSettings.showLogoAndText !== false,
      brandName: storeSettings.brandName,
      brandTagline: storeSettings.brandTagline,
      physicalAddress: storeSettings.physicalAddress,
      heroTitle: storeSettings.heroTitle,
      heroSubtitle: storeSettings.heroSubtitle,
      heroImageDesktop: storeSettings.heroImageDesktop || "/images/hero.jpg",
      heroImageMobile: storeSettings.heroImageMobile || "/images/hero.jpg",
      manifestoTitle: storeSettings.manifestoTitle,
      manifestoText1: storeSettings.manifestoText1,
      manifestoText2: storeSettings.manifestoText2,
      manifestoImageDesktop: storeSettings.manifestoImageDesktop || "/images/hero.jpg",
      manifestoImageMobile: storeSettings.manifestoImageMobile || "/images/hero.jpg",
      footerBrandDescription: storeSettings.footerBrandDescription,
      dropPolicy: storeSettings.dropPolicy,
      returnPolicyTitle: storeSettings.returnPolicyTitle,
      returnPolicyContent: storeSettings.returnPolicyContent,
      instagramHandle: storeSettings.instagramHandle,
      twitterHandle: storeSettings.twitterHandle,
      tiktokHandle: storeSettings.tiktokHandle,
      facebookHandle: storeSettings.facebookHandle || "",
      paymentBankName: storeSettings.payment.bankName,
      paymentAccountNumber: storeSettings.payment.accountNumber,
      paymentAccountName: storeSettings.payment.accountName
    });
  }, [storeSettings]);

  // Handle logo upload (file -> base64)
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith("image/")) {
      onAddToast("Please upload a valid image file (PNG, JPG, SVG).", "error");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      onAddToast("Logo file is too large. Maximum 2MB allowed.", "error");
      return;
    }

    try {
      if (file.type === "image/svg+xml") {
        const reader = new FileReader();
        reader.onloadend = () => {
          setSettingsForm(prev => ({ ...prev, logoUrl: reader.result as string }));
          onAddToast("SVG logo loaded! Click Save to apply globally.", "info");
        };
        reader.readAsDataURL(file);
        return;
      }

      const compressedLogo = await compressImageFile(file);
      setSettingsForm(prev => ({ ...prev, logoUrl: compressedLogo }));
      onAddToast("Logo compressed and loaded! Click Save to apply globally.", "info");
    } catch (error: any) {
      onAddToast(error.message || "Failed to process logo image.", "error");
    } finally {
      e.target.value = "";
    }
  };

  const handleRemoveLogo = () => {
    setSettingsForm(prev => ({ ...prev, logoUrl: "" }));
    onAddToast("Logo removed. Save to apply.", "info");
  };

  // Dark mode logo upload handlers
  const handleLogoUploadDark = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      if (file.type === "image/svg+xml") {
        const reader = new FileReader();
        reader.onloadend = () => {
          setSettingsForm(prev => ({ ...prev, logoUrlDark: reader.result as string }));
          onAddToast("Dark mode SVG logo loaded! Click Save to apply.", "info");
        };
        reader.readAsDataURL(file);
        return;
      }

      const compressedLogo = await compressImageFile(file);
      setSettingsForm(prev => ({ ...prev, logoUrlDark: compressedLogo }));
      onAddToast("Dark mode logo compressed and loaded! Click Save to apply.", "info");
    } catch (error: any) {
      onAddToast(error.message || "Failed to process dark mode logo.", "error");
    } finally {
      e.target.value = "";
    }
  };

  const handleRemoveLogoDark = () => {
    setSettingsForm(prev => ({ ...prev, logoUrlDark: "" }));
    onAddToast("Dark mode logo removed. Save to apply.", "info");
  };

  // Light mode logo upload handlers
  const handleLogoUploadLight = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      if (file.type === "image/svg+xml") {
        const reader = new FileReader();
        reader.onloadend = () => {
          setSettingsForm(prev => ({ ...prev, logoUrlLight: reader.result as string }));
          onAddToast("Light mode SVG logo loaded! Click Save to apply.", "info");
        };
        reader.readAsDataURL(file);
        return;
      }

      const compressedLogo = await compressImageFile(file);
      setSettingsForm(prev => ({ ...prev, logoUrlLight: compressedLogo }));
      onAddToast("Light mode logo compressed and loaded! Click Save to apply.", "info");
    } catch (error: any) {
      onAddToast(error.message || "Failed to process light mode logo.", "error");
    } finally {
      e.target.value = "";
    }
  };

  const handleRemoveLogoLight = () => {
    setSettingsForm(prev => ({ ...prev, logoUrlLight: "" }));
    onAddToast("Light mode logo removed. Save to apply.", "info");
  };

  // Customizable Hero and Manifesto image upload/compression handlers
  const handleHeroImageUploadDesktop = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file);
      setSettingsForm(prev => ({ ...prev, heroImageDesktop: compressed }));
      onAddToast("Hero Desktop image compressed & loaded! Save to publish.", "info");
    } catch (err: any) {
      onAddToast(err.message || "Error processing Hero Desktop image", "error");
    } finally {
      e.target.value = "";
    }
  };

  const handleHeroImageUploadMobile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file);
      setSettingsForm(prev => ({ ...prev, heroImageMobile: compressed }));
      onAddToast("Hero Mobile image compressed & loaded! Save to publish.", "info");
    } catch (err: any) {
      onAddToast(err.message || "Error processing Hero Mobile image", "error");
    } finally {
      e.target.value = "";
    }
  };

  const handleManifestoImageUploadDesktop = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file);
      setSettingsForm(prev => ({ ...prev, manifestoImageDesktop: compressed }));
      onAddToast("Manifesto Desktop image compressed & loaded! Save to publish.", "info");
    } catch (err: any) {
      onAddToast(err.message || "Error processing Manifesto Desktop image", "error");
    } finally {
      e.target.value = "";
    }
  };

  const handleManifestoImageUploadMobile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file);
      setSettingsForm(prev => ({ ...prev, manifestoImageMobile: compressed }));
      onAddToast("Manifesto Mobile image compressed & loaded! Save to publish.", "info");
    } catch (err: any) {
      onAddToast(err.message || "Error processing Manifesto Mobile image", "error");
    } finally {
      e.target.value = "";
    }
  };

  // Orders searching & filtering
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState<"All" | "Pending" | "Confirmed" | "Delivered">("All");

  // Customers searching
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");

  // Activity log searching & filtering
  const [activitySearchQuery, setActivitySearchQuery] = useState("");

  // ==========================================
  // HANDLERS
  // ==========================================
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword) {
      onAddToast("Please fill in both email and password.", "error");
      return;
    }

    setIsAuthenticating(true);
    const success = await login(authEmail, authPassword);
    setIsAuthenticating(false);

    if (success) {
      onAddToast("Welcome back, Chief Admin! Real-time syncing active.", "success");
      setAuthPassword("");
    } else {
      onAddToast("Access Denied. Invalid admin email or password.", "error");
    }
  };

  // PRODUCTS ACTIONS
  const openAddProductModal = () => {
    setEditingProduct(null);
    setProductForm({
      name: "",
      price: 13000,
      description: "",
      stockQuantity: 15,
      sizes: ["S", "M", "L", "XL"],
      images: ["/images/tee_onyx.jpg"],
      isActive: true
    });
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      price: product.price,
      description: product.description,
      stockQuantity: product.stockQuantity,
      sizes: [...product.sizes],
      images: [...product.images],
      isActive: product.isActive
    });
    setIsProductModalOpen(true);
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name.trim()) {
      onAddToast("Product Name is required.", "error");
      return;
    }
    if (productForm.price <= 0) {
      onAddToast("Price must be a positive number.", "error");
      return;
    }

    try {
      if (editingProduct) {
        await dbService.updateProduct(editingProduct.id, productForm);
        if (user) dbService.logActivity(user.email, user.name || "Admin", `Updated product "${productForm.name}" details.`);
        onAddToast(`Product "${productForm.name}" updated successfully.`, "success");
      } else {
        await dbService.addProduct(productForm);
        if (user) dbService.logActivity(user.email, user.name || "Admin", `Created new drop product "${productForm.name}".`);
        onAddToast(`Product "${productForm.name}" created successfully.`, "success");
      }
      setIsProductModalOpen(false);
    } catch (err) {
      onAddToast("Failed to save product.", "error");
    }
  };

  const handleToggleProductSize = (size: string) => {
    setProductForm((prev) => {
      const sizes = prev.sizes.includes(size)
        ? prev.sizes.filter((s) => s !== size)
        : [...prev.sizes, size];
      return { ...prev, sizes };
    });
  };

  const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remainingSlots = PRODUCT_IMAGE_LIMIT - productForm.images.length;
    if (remainingSlots <= 0) {
      onAddToast(`You can upload up to ${PRODUCT_IMAGE_LIMIT} images per product.`, "error");
      e.target.value = "";
      return;
    }

    const acceptedFiles = files.slice(0, remainingSlots);
    const skippedCount = files.length - acceptedFiles.length;

    try {
      onAddToast("Compressing product images for faster loading...", "info");
      const compressedImages = await Promise.all(acceptedFiles.map((file) => compressImageFile(file)));
      setProductForm((prev) => ({
        ...prev,
        images: [...prev.images, ...compressedImages]
      }));
      onAddToast(
        `Added ${compressedImages.length} compressed image${compressedImages.length > 1 ? "s" : ""}${skippedCount ? `; ${skippedCount} skipped due to limit.` : "."}`,
        "success"
      );
    } catch (error: any) {
      onAddToast(error.message || "Failed to compress uploaded image.", "error");
    } finally {
      e.target.value = "";
    }
  };

  const handleRemoveProductImage = (index: number) => {
    setProductForm((prev) => {
      const nextImages = prev.images.filter((_, i) => i !== index);
      return { ...prev, images: nextImages.length ? nextImages : ["/images/tee_onyx.jpg"] };
    });
  };

  const handleSetProductCover = (index: number) => {
    setProductForm((prev) => {
      const selected = prev.images[index];
      if (!selected) return prev;
      const rest = prev.images.filter((_, i) => i !== index);
      return { ...prev, images: [selected, ...rest] };
    });
    onAddToast("Cover image updated. Save product to publish it.", "info");
  };

  const handleAddPresetProductImage = (imageUrl: string) => {
    setProductForm((prev) => {
      if (prev.images.includes(imageUrl)) return prev;
      if (prev.images.length >= PRODUCT_IMAGE_LIMIT) return prev;
      return { ...prev, images: [...prev.images, imageUrl] };
    });
  };

  // Add Preset Asset
  const [newPresetLabel, setNewPresetLabel] = useState("");

  const handleAddPresetAsset = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!newPresetLabel.trim()) {
      onAddToast("Please enter a label for the preset first.", "error");
      e.target.value = "";
      return;
    }

    try {
      const compressed = await compressImageFile(file);
      const updatedPresets = [...(storeSettings.presetAssets || []), { label: newPresetLabel.trim(), value: compressed }];
      const updated = dbService.updateSettings({ presetAssets: updatedPresets });
      setStoreSettings(updated);
      if (user) dbService.logActivity(user.email, user.name, `Added new preset asset "${newPresetLabel}".`);
      onAddToast(`Preset asset "${newPresetLabel}" saved successfully!`, "success");
      setNewPresetLabel("");
    } catch (err: any) {
      onAddToast(err.message || "Failed to compress preset image.", "error");
    } finally {
      e.target.value = "";
    }
  };

  const handleRemovePresetAsset = (assetValue: string) => {
    const updatedPresets = (storeSettings.presetAssets || []).filter(a => a.value !== assetValue);
    const updated = dbService.updateSettings({ presetAssets: updatedPresets });
    setStoreSettings(updated);
    if (user) dbService.logActivity(user.email, user.name, "Removed a preset asset.");
    onAddToast("Preset asset removed.", "info");
  };

  const handleToggleProductActive = async (product: Product) => {
    const updatedState = !product.isActive;
    await dbService.updateProduct(product.id, { isActive: updatedState });
    if (user) dbService.logActivity(user.email, user.name, `Changed visibility of product "${product.name}" to ${updatedState ? 'Active' : 'Inactive'}.`);
    onAddToast(`"${product.name}" is now ${updatedState ? 'Active' : 'Inactive'}.`, "info");
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (window.confirm(`Are you absolutely sure you want to delete "${name}"? This cannot be undone.`)) {
      await dbService.deleteProduct(id);
      if (user) dbService.logActivity(user.email, user.name, `Deleted product "${name}".`);
      onAddToast(`"${name}" deleted.`, "info");
    }
  };

  // CUSTOMERS ACTIONS
  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerForm.name.trim() || !customerForm.phone.trim() || !customerForm.location.trim()) {
      onAddToast("Name, Phone, and Location are mandatory fields.", "error");
      return;
    }

    try {
      await dbService.addManualCustomer({
        name: customerForm.name,
        phone: customerForm.phone,
        email: customerForm.email,
        location: customerForm.location,
        totalOrders: 1
      });
      if (user) dbService.logActivity(user.email, user.name, `Manually added customer "${customerForm.name}".`);
      onAddToast(`Customer "${customerForm.name}" registered successfully.`, "success");
      setIsCustomerModalOpen(false);
      setCustomerForm({ name: "", phone: "", email: "", location: "" });
    } catch (err) {
      onAddToast("Error saving customer.", "error");
    }
  };

  const handleDeleteCustomer = async (phone: string, name: string) => {
    if (window.confirm(`Delete customer profile for "${name}" (${phone})?`)) {
      await dbService.deleteCustomer(phone);
      if (user) dbService.logActivity(user.email, user.name, `Deleted customer profile "${name}".`);
      onAddToast(`Deleted customer "${name}".`, "info");
    }
  };

  const handleAddAdmin = async () => {
    if (!adminForm.name.trim() || !adminForm.email.trim() || !adminForm.password.trim()) {
      onAddToast("Name, email, and password are required.", "error");
      return;
    }

    if (adminForm.password.length < 8) {
      onAddToast("Password must be at least 8 characters.", "error");
      return;
    }

    try {
      const created = await dbService.addAdmin({
        name: adminForm.name,
        email: adminForm.email,
        password: adminForm.password,
        role: adminForm.role
      });
      const accessLabel = adminForm.role === "Partner" ? "read-only Business Partner access" : "full admin access";
      if (user) dbService.logActivity(user.email, user.name, `Granted ${accessLabel} to ${created.email}.`);
      onAddToast(`${created.name} now has ${accessLabel}. Tracking code: ${created.trackingCode}`, "success");
      setAdminForm({ name: "", email: "", password: "", role: "Admin" });
    } catch (error: any) {
      onAddToast(error.message || "Failed to add team member.", "error");
    }
  };

  const handleDeleteAdmin = async (id: string, name: string, email: string) => {
    if (!window.confirm(`Remove full admin access for ${name}?`)) return;
    try {
      await dbService.deleteAdmin(id);
      if (user) dbService.logActivity(user.email, user.name, `Removed admin access for ${email}.`);
      onAddToast(`${name} was removed from admin access.`, "info");
    } catch (error: any) {
      onAddToast(error.message || "Unable to remove admin.", "error");
    }
  };

  const handleToggleAdminStatus = async (id: string, name: string, email: string, currentStatus: boolean) => {
    if (!window.confirm(`${currentStatus ? 'Deactivate' : 'Activate'} admin access for ${name}?`)) return;
    try {
      await dbService.toggleAdminStatus(id);
      if (user) dbService.logActivity(user.email, user.name, `${currentStatus ? 'Deactivated' : 'Activated'} admin access for ${email}.`);
      onAddToast(`Admin ${name} is now ${currentStatus ? 'inactive' : 'active'}.`, "success");
    } catch (error: any) {
      onAddToast(error.message || "Failed to update admin status.", "error");
    }
  };

  // ACTIVITY LOG ACTIONS
  const handleDeleteActivity = async (id: string) => {
    try {
      await dbService.deleteActivity(id);
      onAddToast("Activity log entry deleted.", "info");
    } catch (error: any) {
      onAddToast(error.message || "Failed to delete activity.", "error");
    }
  };

  const handleDeleteAllActivities = async () => {
    if (!window.confirm("Permanently delete ALL activity logs? This cannot be undone.")) return;
    try {
      await dbService.deleteAllActivities();
      onAddToast("All activity logs cleared.", "info");
    } catch (error: any) {
      onAddToast(error.message || "Failed to clear logs.", "error");
    }
  };

  // Filtered activities
  const filteredActivities = activities.filter((act) => {
    if (!activitySearchQuery.trim()) return true;
    const q = activitySearchQuery.toLowerCase();
    return (
      act.adminName.toLowerCase().includes(q) ||
      act.adminEmail.toLowerCase().includes(q) ||
      act.action.toLowerCase().includes(q)
    );
  });

  // ORDERS ACTIONS
  const handleUpdateOrderStatus = async (orderId: string, currentStatus: string) => {
    let nextStatus: "Pending" | "Confirmed" | "Delivered" = "Pending";
    if (currentStatus === "Pending") nextStatus = "Confirmed";
    else if (currentStatus === "Confirmed") nextStatus = "Delivered";
    else return; // already delivered, no further progression

    await dbService.updateOrderStatus(orderId, nextStatus);
    if (user) dbService.logActivity(user.email, user.name, `Updated status of Order #${orderId} to ${nextStatus}.`);
    onAddToast(`Order #${orderId} status set to ${nextStatus}!`, "success");
  };

  const handleDeleteOrder = async (id: string) => {
    if (window.confirm(`Delete Order record #${id}? This will free up reserved customer metric values.`)) {
      await dbService.deleteOrder(id);
      if (user) dbService.logActivity(user.email, user.name, `Deleted Order record #${id}.`);
      onAddToast(`Order #${id} deleted from database.`, "info");
    }
  };

  // SETTINGS ACTION - saves all editable global settings
  const handleSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate drop date
    let dropEndIso = storeSettings.dropEndDate;
    if (settingsForm.dropEndDate) {
      const parsedDate = new Date(settingsForm.dropEndDate);
      if (isNaN(parsedDate.getTime())) {
        onAddToast("Invalid drop end date format.", "error");
        return;
      }
      dropEndIso = parsedDate.toISOString();
    }

    const updated = dbService.updateSettings({
      email: settingsForm.email,
      phone: settingsForm.phone,
      marqueeText: settingsForm.marqueeText,
      marqueeEnabled: settingsForm.marqueeEnabled,
      dropEndDate: dropEndIso,
      countdownEnabled: settingsForm.countdownEnabled,
      logoUrl: settingsForm.logoUrl,
      logoUrlDark: settingsForm.logoUrlDark,
      logoUrlLight: settingsForm.logoUrlLight,
      showLogoAndText: settingsForm.showLogoAndText,
      brandName: settingsForm.brandName,
      brandTagline: settingsForm.brandTagline,
      physicalAddress: settingsForm.physicalAddress,
      heroTitle: settingsForm.heroTitle,
      heroSubtitle: settingsForm.heroSubtitle,
      heroImageDesktop: settingsForm.heroImageDesktop,
      heroImageMobile: settingsForm.heroImageMobile,
      manifestoTitle: settingsForm.manifestoTitle,
      manifestoText1: settingsForm.manifestoText1,
      manifestoText2: settingsForm.manifestoText2,
      manifestoImageDesktop: settingsForm.manifestoImageDesktop,
      manifestoImageMobile: settingsForm.manifestoImageMobile,
      footerBrandDescription: settingsForm.footerBrandDescription,
      dropPolicy: settingsForm.dropPolicy,
      returnPolicyTitle: settingsForm.returnPolicyTitle,
      returnPolicyContent: settingsForm.returnPolicyContent,
      instagramHandle: settingsForm.instagramHandle,
      twitterHandle: settingsForm.twitterHandle,
      tiktokHandle: settingsForm.tiktokHandle,
      facebookHandle: settingsForm.facebookHandle,
      payment: {
        bankName: settingsForm.paymentBankName,
        accountNumber: settingsForm.paymentAccountNumber,
        accountName: settingsForm.paymentAccountName
      }
    });
    setStoreSettings(updated);

    if (user) dbService.logActivity(user.email, user.name, "Updated platform configurations and website content.");

    if (settingsForm.newPassword.trim()) {
      updateAdminPassword(settingsForm.newPassword);
      onAddToast("All website content & settings saved & admin password updated!", "success");
      setSettingsForm(prev => ({ ...prev, newPassword: "" }));
    } else {
      onAddToast("All website content & settings saved & broadcasted live!", "success");
    }
  };

  // METRICS CALCULATIONS
  const totalRevenue = orders
    .filter((o) => o.status !== "Pending")
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const pendingOrdersCount = orders.filter((o) => o.status === "Pending").length;
  const activeProductsCount = products.filter((p) => p.isActive).length;

  // ORDER FILTERS & SEARCH
  const filteredOrders = orders.filter((o) => {
    const matchesSearch = 
      o.customerName.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
      o.phone.includes(orderSearchQuery) ||
      o.id.toLowerCase().includes(orderSearchQuery.toLowerCase());

    const matchesStatus = 
      orderStatusFilter === "All" || o.status === orderStatusFilter;

    return matchesSearch && matchesStatus;
  });

  // CUSTOMERS SEARCH
  const filteredCustomers = customers.filter((c) => {
    return (
      c.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
      c.phone.includes(customerSearchQuery) ||
      c.location.toLowerCase().includes(customerSearchQuery.toLowerCase())
    );
  });

  // ==========================================
  // VIEW: AUTHENTICATION SCREEN (IF NOT LOGGED IN)
  // ==========================================
  if (!user) {
    return (
      <div className="min-h-screen bg-black flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12">
        <button 
          onClick={onNavigateToHome}
          className="mb-8 flex items-center gap-2 text-zinc-400 hover:text-[#E8FF6B] text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>BACK TO PLAIN CULTURE SHOP</span>
        </button>

        <div className="w-full max-w-md bg-zinc-950 border border-zinc-900 rounded-sm p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-[#E8FF6B]/15 rounded-full flex items-center justify-center mx-auto mb-3 border border-[#E8FF6B]/30">
              <Shield className="w-6 h-6 text-[#E8FF6B]" />
            </div>
            <h2 className="text-2xl font-black text-white uppercase tracking-widest">
              ADMIN GATEWAY
            </h2>
            <p className="text-xs text-zinc-400 tracking-wider uppercase mt-1">
              Plain Culture Command Suite
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1.5">
                Admin Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4.5 h-4.5 text-zinc-500" />
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="e.g. plainculture.ng@gmail.com"
                  className="w-full bg-zinc-900 border border-zinc-850 p-3 pl-10 text-sm focus:outline-none focus:border-[#E8FF6B] rounded-sm text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1.5">
                Security Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4.5 h-4.5 text-zinc-500" />
                <input
                  type="password"
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-zinc-900 border border-zinc-850 p-3 pl-10 text-sm focus:outline-none focus:border-[#E8FF6B] rounded-sm text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isAuthenticating}
              className="w-full py-3.5 bg-[#E8FF6B] hover:bg-[#d0e54d] text-black font-extrabold uppercase tracking-widest text-xs rounded-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
            >
              {isAuthenticating ? (
                <span>VERIFYING SYSTEM KEY...</span>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  <span>AUTHORIZE AND SYNC SESSION</span>
                </>
              )}
            </button>
          </form>

          {/* Local testing advisory box removed */}
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW: PARTNER REDIRECT
  // Business Partners get a dedicated executive read-only dashboard, never the admin panel.
  // ==========================================
  if (user.role === "Partner") {
    return <PartnerDashboard onNavigateToHome={onNavigateToHome} onAddToast={onAddToast} />;
  }

  // ==========================================
  // VIEW: MAIN PANEL LAYOUT
  // ==========================================
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-black dark:text-white transition-colors duration-300">
      
      {/* Mini Title bar */}
      <div className="bg-zinc-100 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-900 py-3 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-zinc-500">
            <Shield className="w-4 h-4 text-[#E8FF6B]" />
            <span>Logged in as: <strong className="text-black dark:text-white">{user.email}</strong></span>
            <span className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-800 text-[10px] uppercase font-bold text-zinc-600 dark:text-zinc-400 rounded">
              Ibadan Warehouse Sync
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={onNavigateToHome}
              className="text-zinc-500 hover:text-black dark:hover:text-white font-bold uppercase tracking-wider"
            >
              ← Return to Live Shop
            </button>
            <button
              onClick={logout}
              className="text-red-500 hover:underline font-bold uppercase tracking-wider"
            >
              Sign Out Securely
            </button>
          </div>
        </div>
      </div>

      {/* Main Dashboard Workspace */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Dashboard Title & Tabs Navigation */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10 pb-6 border-b border-zinc-200 dark:border-zinc-900">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-black dark:text-white">
              COMMAND SUITE
            </h1>
            <p className="text-xs text-zinc-400 mt-1 uppercase tracking-widest">
              Small-batch drop strategy controls • Ibadan physical hub
            </p>
          </div>

          {/* Navigation Controls */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: "dashboard", label: "Overview", icon: LayoutDashboard },
              { id: "products", label: "Products Drop", icon: ShoppingBag },
              { id: "orders", label: "Orders Stream", icon: ClipboardList, badge: pendingOrdersCount },
              { id: "customers", label: "Customers", icon: Users },
              ...(user?.role === "Super Admin" ? [{ id: "activities", label: "Admin Activities", icon: ClipboardList }] : []),
              { id: "settings", label: "Settings & Keys", icon: Settings }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-sm text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border ${
                    activeTab === tab.id
                      ? "bg-black text-[#E8FF6B] border-black dark:bg-white dark:text-black dark:border-white"
                      : "bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:text-black dark:hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className="bg-[#E8FF6B] text-black font-extrabold text-[10px] w-5 h-5 rounded-full flex items-center justify-center">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ==========================================
            TAB 1: OVERVIEW METRICS PANEL
            ========================================== */}
        {activeTab === "dashboard" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Card 1: Revenue */}
              <div className="bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-sm p-6 relative overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                    TOTAL REVENUE
                  </span>
                  <div className="w-8 h-8 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black tracking-tight text-black dark:text-white">
                  ₦{totalRevenue.toLocaleString()}
                </div>
                <p className="text-[10px] text-zinc-400 mt-2 uppercase tracking-wide">
                  Sum of Confirmed & Delivered orders
                </p>
              </div>

              {/* Card 2: Orders count */}
              <div className="bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-sm p-6 relative overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                    TOTAL ORDERS
                  </span>
                  <div className="w-8 h-8 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-500">
                    <ClipboardList className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black tracking-tight text-black dark:text-white">
                  {orders.length}
                </div>
                <p className="text-[10px] text-zinc-400 mt-2 uppercase tracking-wide">
                  {pendingOrdersCount} Pending, {orders.filter(o => o.status === 'Confirmed').length} Confirmed
                </p>
              </div>

              {/* Card 3: Active products */}
              <div className="bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-sm p-6 relative overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                    ACTIVE PRODUCTS
                  </span>
                  <div className="w-8 h-8 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-500">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black tracking-tight text-black dark:text-white">
                  {activeProductsCount}
                </div>
                <p className="text-[10px] text-zinc-400 mt-2 uppercase tracking-wide">
                  Out of {products.length} total products loaded
                </p>
              </div>

              {/* Card 4: Customers count */}
              <div className="bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-sm p-6 relative overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                    TOTAL CUSTOMERS
                  </span>
                  <div className="w-8 h-8 bg-purple-500/10 rounded-full flex items-center justify-center text-purple-500">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black tracking-tight text-black dark:text-white">
                  {customers.length}
                </div>
                <p className="text-[10px] text-zinc-400 mt-2 uppercase tracking-wide">
                  Auto-synced from placed orders & retail
                </p>
              </div>

            </div>

            {/* Quick Actions & Urgent Stock Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Low Stock Watch */}
              <div className="bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-sm p-6 lg:col-span-2">
                <div className="flex items-center justify-between mb-6 pb-2 border-b border-zinc-200 dark:border-zinc-800">
                  <h3 className="text-sm font-black uppercase tracking-wider text-black dark:text-white">
                    ⚠️ SCARCITY CONTROL & STOCK WATCH
                  </h3>
                  <span className="text-[10px] bg-[#E8FF6B] text-black font-extrabold px-2 py-0.5 rounded">
                    LOW UNITS ALERT
                  </span>
                </div>

                <div className="space-y-4">
                  {products.map((p) => {
                    const isSoldOut = p.stockQuantity <= 0;
                    return (
                      <div key={p.id} className="flex items-center justify-between p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-sm text-sm">
                        <div className="flex items-center gap-3">
                          <img src={p.images[0]} alt="" className="w-8 h-8 object-cover rounded-sm" />
                          <div>
                            <span className="block font-bold uppercase text-xs">{p.name}</span>
                            <span className="text-[10px] text-zinc-400 uppercase">₦{p.price.toLocaleString()} • Size {p.sizes.join(", ")}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-extrabold px-2 py-1 rounded-sm ${
                            isSoldOut 
                              ? "bg-red-500/10 text-red-500" 
                              : p.stockQuantity <= 5 
                                ? "bg-amber-500/15 text-amber-500" 
                                : "bg-emerald-500/10 text-emerald-500"
                          }`}>
                            {isSoldOut ? "SOLD OUT" : `${p.stockQuantity} UNITS`}
                          </span>

                          <button
                            onClick={() => openEditProductModal(p)}
                            className="text-zinc-400 hover:text-[#E8FF6B] p-1 transition-colors"
                            title="Edit Inventory Stock"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quick instructions & stats */}
              <div className="bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-sm p-6">
                <h3 className="text-sm font-black uppercase tracking-wider mb-4 text-black dark:text-white">
                  🔌 FIRESTORE SYNC STATUS
                </h3>
                <div className="space-y-4 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                  <p>
                    All modules listen directly to Firestore collections. Placed orders instantly reflect across active monitors.
                  </p>
                  
                  <div className="p-3 bg-black/90 dark:bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono text-[10px] rounded space-y-1">
                    <p className="text-[#E8FF6B] font-bold">● LIVE UPDATES ACTIVE</p>
                    <p>Channel: {activeProductsCount} active tees</p>
                    <p>Drop Status: LIVE RUNNING</p>
                    <p>Orders Buffer: {orders.length} events</p>
                  </div>

                  <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
                    <button
                      onClick={openAddProductModal}
                      className="w-full py-2.5 bg-black dark:bg-white text-white dark:text-black font-extrabold text-center uppercase tracking-wider text-[11px] rounded-sm hover:opacity-90 cursor-pointer"
                    >
                      + ADD NEW DROP PIECE
                    </button>
                    <button
                      onClick={() => setActiveTab("orders")}
                      className="w-full py-2.5 bg-transparent border border-zinc-300 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-center uppercase tracking-wider text-[11px] rounded-sm hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer"
                    >
                      PROCESS ORDERS STEAM
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ==========================================
            TAB 2: PRODUCTS DROP MANAGEMENT
            ========================================== */}
        {activeTab === "products" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black uppercase tracking-wider text-black dark:text-white">
                  PRODUCT DROP INVENTORY
                </h2>
                <p className="text-xs text-zinc-400">Set active state, adjust quantities for scarcity, or load new minimalist tees.</p>
              </div>

              <button
                onClick={openAddProductModal}
                className="px-4 py-2.5 bg-[#E8FF6B] hover:bg-[#d0e54d] text-black font-extrabold text-xs uppercase tracking-widest flex items-center gap-1.5 rounded-sm transition-all cursor-pointer"
              >
                <PlusCircle className="w-4.5 h-4.5" />
                <span>ADD NEW DROP PRODUCT</span>
              </button>
            </div>

            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-sm overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-zinc-100 dark:bg-zinc-900 text-zinc-500 uppercase tracking-wider text-[10px] border-b border-zinc-200 dark:border-zinc-800">
                    <th className="py-4 px-6">Product details</th>
                    <th className="py-4 px-6">Sizes Available</th>
                    <th className="py-4 px-6">Price</th>
                    <th className="py-4 px-6">Inventory Stock</th>
                    <th className="py-4 px-6">Visibility</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-900">
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-zinc-500 font-medium">
                        No products found. Click "Add New Drop Product" to seed your catalog.
                      </td>
                    </tr>
                  ) : (
                    products.map((p) => {
                      const isSoldOut = p.stockQuantity <= 0;
                      return (
                        <tr key={p.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-4">
                              <img src={p.images[0]} alt="" className="w-12 h-12 object-cover bg-zinc-100 rounded" />
                              <div>
                                <span className="block font-bold text-black dark:text-white uppercase text-xs">{p.name}</span>
                                <span className="text-[10px] text-zinc-400 font-light block max-w-xs truncate">{p.description}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6 font-mono text-xs text-zinc-600 dark:text-zinc-300">
                            {p.sizes.map(s => (
                              <span key={s} className="inline-block bg-zinc-100 dark:bg-zinc-900 px-1.5 py-0.5 rounded mr-1 font-bold">
                                {s}
                              </span>
                            ))}
                          </td>
                          <td className="py-4 px-6 font-bold text-black dark:text-white">
                            ₦{p.price.toLocaleString()}
                          </td>
                          <td className="py-4 px-6">
                            <span className={`inline-block px-2.5 py-1 text-xs font-black rounded-sm ${
                              isSoldOut 
                                ? "bg-red-500/10 text-red-500" 
                                : p.stockQuantity <= 5 
                                  ? "bg-amber-500/15 text-amber-500 font-extrabold" 
                                  : "bg-emerald-500/10 text-emerald-500"
                            }`}>
                              {isSoldOut ? "SOLD OUT" : `${p.stockQuantity} Left`}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <button
                              onClick={() => handleToggleProductActive(p)}
                              className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
                              title="Toggle Visibility"
                            >
                              {p.isActive ? (
                                <div className="flex items-center gap-1 text-emerald-500 text-xs font-semibold">
                                  <ToggleRight className="w-6 h-6" />
                                  <span>Active</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-zinc-500 text-xs font-semibold">
                                  <ToggleLeft className="w-6 h-6" />
                                  <span>Inactive</span>
                                </div>
                              )}
                            </button>
                          </td>
                          <td className="py-4 px-6 text-right space-x-2">
                            <button
                              onClick={() => openEditProductModal(p)}
                              className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded text-blue-500 hover:text-blue-400 inline-block cursor-pointer"
                              title="Edit Product"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(p.id, p.name)}
                              className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded text-red-500 hover:text-red-400 inline-block cursor-pointer"
                              title="Delete Product"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==========================================
            TAB 3: ORDERS STREAM MANAGEMENT
            ========================================== */}
        {activeTab === "orders" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black uppercase tracking-wider text-black dark:text-white">
                  ORDERS STREAM
                </h2>
                <p className="text-xs text-zinc-400">Review pending checkout logs and change dispatch fulfillment states.</p>
              </div>
            </div>

            {/* Filter and Search controls */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-zinc-100 dark:bg-zinc-950 p-4 border border-zinc-200 dark:border-zinc-900 rounded-sm">
              {/* Search */}
              <div className="relative w-full md:max-w-md">
                <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search orders by customer name, phone, or ID..."
                  value={orderSearchQuery}
                  onChange={(e) => setOrderSearchQuery(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 pl-10 p-2.5 rounded text-sm focus:outline-none"
                />
              </div>

              {/* Status Filters */}
              <div className="flex items-center gap-1.5 self-end md:self-auto overflow-x-auto w-full md:w-auto">
                <Filter className="w-4.5 h-4.5 text-zinc-400 hidden sm:inline" />
                <span className="text-xs uppercase font-bold text-zinc-400 mr-2 hidden sm:inline">Fulfillment Filter:</span>
                
                {["All", "Pending", "Confirmed", "Delivered"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setOrderStatusFilter(status as any)}
                    className={`px-3 py-1.5 text-xs font-bold uppercase rounded-full cursor-pointer transition-all ${
                      orderStatusFilter === status
                        ? "bg-black text-white dark:bg-[#E8FF6B] dark:text-black"
                        : "bg-white dark:bg-zinc-900 text-zinc-500 border border-zinc-200 dark:border-zinc-800"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders Feed */}
            <div className="space-y-4">
              {filteredOrders.length === 0 ? (
                <div className="bg-white dark:bg-zinc-950 p-12 text-center text-zinc-500 font-medium border border-zinc-200 dark:border-zinc-900 rounded">
                  No orders match your filter and query criteria.
                </div>
              ) : (
                filteredOrders.map((order) => {
                  return (
                    <div 
                      key={order.id} 
                      className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 p-6 rounded-sm space-y-4 shadow-sm"
                    >
                      {/* Order Title Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-900">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-[#E8FF6B] bg-black px-2.5 py-1 rounded">
                              #{order.id}
                            </span>
                            <span className="text-xs text-zinc-400">
                              Placed on {new Date(order.createdAt).toLocaleString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Status Badge */}
                          <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-extrabold uppercase rounded-full ${
                            order.status === "Pending"
                              ? "bg-yellow-500/10 text-yellow-500"
                              : order.status === "Confirmed"
                                ? "bg-blue-500/10 text-blue-500"
                                : "bg-emerald-500/10 text-emerald-500"
                          }`}>
                            {order.status === "Pending" ? <Clock className="w-3.5 h-3.5" /> : order.status === "Confirmed" ? <CheckCircle className="w-3.5 h-3.5" /> : <Truck className="w-3.5 h-3.5" />}
                            {order.status}
                          </span>
                        </div>
                      </div>

                      {/* Customer Details block & Items breakdown */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                        
                        {/* Customer Info */}
                        <div className="space-y-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">CUSTOMER DETAILS</h4>
                          <p className="font-bold text-black dark:text-white uppercase">{order.customerName}</p>
                          <p className="text-xs text-zinc-500">Phone: {order.phone}</p>
                          <p className="text-xs text-zinc-500 flex items-start gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                            <span>Address: {order.address}</span>
                          </p>
                        </div>

                        {/* Items listed */}
                        <div className="space-y-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">ORDER ITEMS</h4>
                          <div className="space-y-1.5">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-900 p-2 border border-zinc-200/40 dark:border-zinc-800 rounded-sm">
                                <span className="font-medium text-xs uppercase text-zinc-800 dark:text-zinc-200">
                                  {item.name} <strong className="text-[#E8FF6B]">({item.size})</strong> x {item.qty}
                                </span>
                                <span className="font-bold text-xs text-black dark:text-zinc-100">
                                  ₦{(item.price * item.qty).toLocaleString()}
                                </span>
                              </div>
                            ))}
                          </div>

                          <div className="flex justify-between items-center pt-2 font-bold">
                            <span>TOTAL AMOUNT Due:</span>
                            <span className="text-base text-emerald-500 font-extrabold">
                              ₦{order.totalAmount.toLocaleString()}
                            </span>
                          </div>
                        </div>

                      </div>

                      {/* Manual advancement buttons */}
                      <div className="pt-3 border-t border-zinc-100 dark:border-zinc-900 flex flex-col lg:flex-row gap-3 justify-between items-start lg:items-center">
                        
                        {/* WhatsApp redirection generator for convenient follow-up */}
                        <a
                          href={`https://wa.me/${order.phone.replace(/\+/g, "")}?text=${encodeURIComponent(`Hello ${order.customerName}, about your Plain Culture Order #${order.id} for ₦${order.totalAmount.toLocaleString()}...`)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-2 border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 text-xs font-bold uppercase tracking-wider hover:bg-emerald-500/20 rounded-sm flex items-center gap-1.5 transition-colors w-full sm:w-auto justify-center"
                        >
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                          <span>CHASE VIA WHATSAPP</span>
                        </a>

                        <div className="w-full lg:w-auto flex flex-col sm:flex-row flex-wrap gap-2">
                          {/* Quick flow button */}
                          {order.status !== "Delivered" && (
                            <button
                              type="button"
                              onClick={() => handleUpdateOrderStatus(order.id, order.status)}
                              className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black hover:bg-[#E8FF6B] dark:hover:bg-[#E8FF6B] hover:text-black dark:hover:text-black text-xs font-extrabold uppercase tracking-wider rounded-sm transition-all cursor-pointer w-full sm:w-auto"
                            >
                              {order.status === "Pending" ? "CONFIRM MANUALLY" : "MARK AS DELIVERED"}
                            </button>
                          )}

                          {/* Explicit status controls */}
                          {(["Pending", "Confirmed", "Delivered"] as const).map((statusOption) => {
                            const isActive = order.status === statusOption;
                            return (
                              <button
                                type="button"
                                key={statusOption}
                                onClick={() => !isActive && dbService.updateOrderStatus(order.id, statusOption).then(() => {
                                  if (user) dbService.logActivity(user.email, user.name, `Manually set Order #${order.id} status to ${statusOption}.`);
                                  onAddToast(`Order #${order.id} status set to ${statusOption}.`, "success");
                                }).catch(() => onAddToast(`Failed to update Order #${order.id}.`, "error"))}
                                disabled={isActive}
                                className={`px-3 py-2 text-[10px] font-extrabold uppercase tracking-wider rounded-sm transition-all w-full sm:w-auto ${
                                  isActive
                                    ? "bg-[#E8FF6B] text-black cursor-default"
                                    : "bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:border-[#E8FF6B] hover:text-[#E8FF6B] cursor-pointer"
                                }`}
                              >
                                {statusOption}
                              </button>
                            );
                          })}

                          <button
                            type="button"
                            onClick={() => handleDeleteOrder(order.id)}
                            className="p-2 border border-zinc-200 dark:border-zinc-800 hover:bg-red-500/10 text-zinc-400 hover:text-red-500 rounded transition-colors cursor-pointer inline-flex items-center justify-center"
                            title="Delete Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ==========================================
            TAB 4: CUSTOMERS DATABASE
            ========================================== */}
        {activeTab === "customers" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black uppercase tracking-wider text-black dark:text-white">
                  CUSTOMERS MASTER LIST
                </h2>
                <p className="text-xs text-zinc-400">Keep track of retail locations, orders frequencies, and physical buyer registers.</p>
              </div>

              <button
                onClick={() => setIsCustomerModalOpen(true)}
                className="px-4 py-2.5 bg-[#E8FF6B] hover:bg-[#d0e54d] text-black font-extrabold text-xs uppercase tracking-widest flex items-center gap-1.5 rounded-sm transition-all cursor-pointer"
              >
                <PlusCircle className="w-4.5 h-4.5" />
                <span>ADD PHYSICAL CUSTOMER</span>
              </button>
            </div>

            {/* Customer search bar */}
            <div className="relative w-full max-w-md bg-white dark:bg-zinc-950">
              <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search customers by name, phone, or address..."
                value={customerSearchQuery}
                onChange={(e) => setCustomerSearchQuery(e.target.value)}
                className="w-full bg-transparent border border-zinc-200 dark:border-zinc-800 pl-10 p-2.5 rounded text-sm text-black dark:text-white focus:outline-none"
              />
            </div>

            {/* Customers table */}
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-sm overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-zinc-100 dark:bg-zinc-900 text-zinc-500 uppercase tracking-wider text-[10px] border-b border-zinc-200 dark:border-zinc-800">
                    <th className="py-4 px-6">Name</th>
                    <th className="py-4 px-6">Phone Number</th>
                    <th className="py-4 px-6">Email Address</th>
                    <th className="py-4 px-6">Location</th>
                    <th className="py-4 px-6">Purchase Count</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-900">
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-zinc-500 font-medium">
                        No customer profiles found. Submit orders to automatically generate records.
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map((customer) => (
                      <tr key={customer.phone} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10">
                        <td className="py-4 px-6">
                          <span className="font-bold text-black dark:text-white uppercase text-xs block">
                            {customer.name}
                          </span>
                        </td>
                        <td className="py-4 px-6 font-mono text-xs text-zinc-600 dark:text-zinc-300">
                          {customer.phone}
                        </td>
                        <td className="py-4 px-6 text-zinc-500 dark:text-zinc-400 text-xs">
                          {customer.email || "No email provided"}
                        </td>
                        <td className="py-4 px-6 text-xs max-w-xs truncate" title={customer.location}>
                          {customer.location}
                        </td>
                        <td className="py-4 px-6">
                          <span className="inline-block bg-[#E8FF6B]/10 text-black dark:text-[#E8FF6B] px-3 py-1 rounded text-xs font-black">
                            {customer.totalOrders} Orders
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => handleDeleteCustomer(customer.phone, customer.name)}
                            className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded text-red-500 hover:text-red-400 inline-block cursor-pointer"
                            title="Remove profile"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==========================================
            TAB 5: PLATFORM CONFIGURATIONS (FULLY EDITABLE)
            ========================================== */}
        {activeTab === "settings" && (
          user?.role === "Super Admin" ? (
          <form onSubmit={handleSettingsSubmit} className="space-y-6 max-w-4xl">
            
            {/* SECTION A: BRAND IDENTITY & LOGO */}
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-sm p-6">
              <h2 className="text-base font-black uppercase tracking-wider text-black dark:text-white mb-1 flex items-center gap-2">
                <span className="w-2 h-2 bg-[#E8FF6B] rounded-full" />
                BRAND IDENTITY & LOGO
              </h2>
              <p className="text-xs text-zinc-500 mb-6">Upload your custom logo or update the brand name and tagline shown in the navbar.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-500 mb-2">
                    Website Logo (PNG/JPG/SVG, max 2MB)
                  </label>
                  
                  <div className="flex items-center gap-4 p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-sm">
                    <div className="w-24 h-24 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-sm flex items-center justify-center overflow-hidden">
                      {settingsForm.logoUrl ? (
                        <img src={settingsForm.logoUrl} alt="Logo preview" className="max-w-full max-h-full object-contain" />
                      ) : (
                        <span className="text-[9px] text-zinc-400 text-center font-bold uppercase tracking-widest p-1">No Logo<br/>(Text Fallback)</span>
                      )}
                    </div>

                    <div className="flex-1 space-y-2">
                      <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black text-xs font-bold uppercase tracking-wider hover:opacity-90 rounded-sm">
                        <span>Choose Logo File</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                      </label>
                      {settingsForm.logoUrl && (
                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          className="ml-2 inline-flex items-center gap-1 px-3 py-2 bg-red-500/10 text-red-500 text-xs font-bold uppercase tracking-wider hover:bg-red-500/20 rounded-sm cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      )}
                      <p className="text-[10px] text-zinc-400">Recommended: 200x60px transparent PNG. Will appear in navbar instantly.</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-500 mb-1.5">Brand Name</label>
                  <input
                    type="text"
                    value={settingsForm.brandName}
                    onChange={(e) => setSettingsForm({ ...settingsForm, brandName: e.target.value })}
                    placeholder="PLAIN CULTURE"
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 text-sm focus:outline-none focus:border-[#E8FF6B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-500 mb-1.5">Brand Tagline</label>
                  <input
                    type="text"
                    value={settingsForm.brandTagline}
                    onChange={(e) => setSettingsForm({ ...settingsForm, brandTagline: e.target.value })}
                    placeholder="IBADAN • NIGERIA"
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 text-sm focus:outline-none focus:border-[#E8FF6B]"
                  />
                </div>

                <div className="md:col-span-2 pt-4 border-t border-zinc-100 dark:border-zinc-900 flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="showLogoAndText"
                    checked={settingsForm.showLogoAndText}
                    onChange={(e) => setSettingsForm({ ...settingsForm, showLogoAndText: e.target.checked })}
                    className="w-4.5 h-4.5 accent-[#E8FF6B] cursor-pointer"
                  />
                  <label htmlFor="showLogoAndText" className="text-xs font-bold uppercase text-zinc-700 dark:text-zinc-300 cursor-pointer">
                    Show BOTH Logo Image and Brand Text simultaneously (Navbar)
                  </label>
                </div>

                {/* Dark Mode Logo Upload */}
                <div className="md:col-span-2 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-500 mb-2">
                    Dark Mode Logo (Optional - PNG/JPG/SVG, max 2MB)
                  </label>
                  <div className="flex items-center gap-4 p-4 bg-zinc-950 border border-zinc-800 rounded-sm">
                    <div className="w-24 h-24 bg-black border border-zinc-800 rounded-sm flex items-center justify-center overflow-hidden">
                      {settingsForm.logoUrlDark ? (
                        <img src={settingsForm.logoUrlDark} alt="Dark mode logo" className="max-w-full max-h-full object-contain" />
                      ) : (
                        <span className="text-[9px] text-zinc-600 text-center font-bold uppercase tracking-widest p-1">No Logo<br/>(Text Fallback)</span>
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-[#E8FF6B] text-black text-xs font-bold uppercase tracking-wider hover:opacity-90 rounded-sm">
                        <span>Upload Dark Mode Logo</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleLogoUploadDark}
                          className="hidden"
                        />
                      </label>
                      {settingsForm.logoUrlDark && (
                        <button
                          type="button"
                          onClick={handleRemoveLogoDark}
                          className="ml-2 inline-flex items-center gap-1 px-3 py-2 bg-red-500/10 text-red-500 text-xs font-bold uppercase tracking-wider hover:bg-red-500/20 rounded-sm cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      )}
                      <p className="text-[10px] text-zinc-500">Shown when dark mode is active. Recommended: 200x60px transparent PNG.</p>
                    </div>
                  </div>
                </div>

                {/* Light Mode Logo Upload */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-500 mb-2">
                    Light Mode Logo (Optional - PNG/JPG/SVG, max 2MB)
                  </label>
                  <div className="flex items-center gap-4 p-4 bg-zinc-50 border border-zinc-200 rounded-sm">
                    <div className="w-24 h-24 bg-white border border-zinc-200 rounded-sm flex items-center justify-center overflow-hidden">
                      {settingsForm.logoUrlLight ? (
                        <img src={settingsForm.logoUrlLight} alt="Light mode logo" className="max-w-full max-h-full object-contain" />
                      ) : (
                        <span className="text-[9px] text-zinc-400 text-center font-bold uppercase tracking-widest p-1">No Logo<br/>(Text Fallback)</span>
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-black text-white text-xs font-bold uppercase tracking-wider hover:opacity-90 rounded-sm">
                        <span>Upload Light Mode Logo</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleLogoUploadLight}
                          className="hidden"
                        />
                      </label>
                      {settingsForm.logoUrlLight && (
                        <button
                          type="button"
                          onClick={handleRemoveLogoLight}
                          className="ml-2 inline-flex items-center gap-1 px-3 py-2 bg-red-500/10 text-red-500 text-xs font-bold uppercase tracking-wider hover:bg-red-500/20 rounded-sm cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      )}
                      <p className="text-[10px] text-zinc-500">Shown when light mode is active. Recommended: 200x60px transparent PNG.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION B: SCROLLING ANNOUNCEMENT MARQUEE */}
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-sm p-6">
              <div className="flex items-start justify-between mb-1">
                <h2 className="text-base font-black uppercase tracking-wider text-black dark:text-white flex items-center gap-2">
                  <span className="w-2 h-2 bg-[#E8FF6B] rounded-full" />
                  SCROLLING ANNOUNCEMENT BAR
                </h2>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settingsForm.marqueeEnabled}
                    onChange={(e) => setSettingsForm({ ...settingsForm, marqueeEnabled: e.target.checked })}
                    className="w-4 h-4 accent-[#E8FF6B]"
                  />
                  <span className="text-xs font-bold uppercase text-zinc-700 dark:text-zinc-300">
                    {settingsForm.marqueeEnabled ? "Enabled" : "Disabled"}
                  </span>
                </label>
              </div>
              <p className="text-xs text-zinc-500 mb-5">Live scrolling text shown at the very top of every page. Edits broadcast instantly.</p>

              <textarea
                rows={2}
                value={settingsForm.marqueeText}
                onChange={(e) => setSettingsForm({ ...settingsForm, marqueeText: e.target.value })}
                placeholder="Use • as separators, e.g. NEW DROP LIVE • FREE SHIPPING • LIMITED STOCK"
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 text-sm focus:outline-none focus:border-[#E8FF6B] font-mono"
              />

              {/* Live preview */}
              <div className="mt-3 bg-[#E8FF6B] text-black overflow-hidden rounded-sm">
                <div className="py-2 px-4 text-[11px] font-bold uppercase tracking-[0.2em] truncate">
                  PREVIEW: {settingsForm.marqueeText || "(Enter text above)"}
                </div>
              </div>
            </div>

            {/* SECTION C: DROP COUNTDOWN TIMING */}
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-sm p-6">
              <div className="flex items-start justify-between mb-1">
                <h2 className="text-base font-black uppercase tracking-wider text-black dark:text-white flex items-center gap-2">
                  <span className="w-2 h-2 bg-[#E8FF6B] rounded-full" />
                  DROP COUNTDOWN TIMER
                </h2>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settingsForm.countdownEnabled}
                    onChange={(e) => setSettingsForm({ ...settingsForm, countdownEnabled: e.target.checked })}
                    className="w-4 h-4 accent-[#E8FF6B]"
                  />
                  <span className="text-xs font-bold uppercase text-zinc-700 dark:text-zinc-300">
                    {settingsForm.countdownEnabled ? "Visible" : "Hidden"}
                  </span>
                </label>
              </div>
              <p className="text-xs text-zinc-500 mb-5">Toggle countdown visibility and set when the current drop ends. The hero countdown updates in real-time.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-500 mb-1.5">Drop End Date & Time</label>
                  <input
                    type="datetime-local"
                    value={settingsForm.dropEndDate}
                    onChange={(e) => setSettingsForm({ ...settingsForm, dropEndDate: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 text-sm focus:outline-none focus:border-[#E8FF6B] text-black dark:text-white"
                  />
                </div>

                <div className="bg-zinc-100 dark:bg-zinc-900 p-3 rounded-sm border border-zinc-200 dark:border-zinc-800">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Current Setting</span>
                  <p className="text-xs font-bold text-black dark:text-white mt-1">
                    {settingsForm.dropEndDate ? new Date(settingsForm.dropEndDate).toLocaleString() : "Not set"}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="text-[10px] uppercase font-bold text-zinc-500 mr-2 self-center">Quick Set:</span>
                {[
                  { label: "+12 Hours", hours: 12 },
                  { label: "+1 Day", hours: 24 },
                  { label: "+3 Days", hours: 72 },
                  { label: "+1 Week", hours: 168 }
                ].map(opt => (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => {
                      const future = new Date(Date.now() + opt.hours * 3600000);
                      setSettingsForm({ ...settingsForm, dropEndDate: future.toISOString().slice(0, 16) });
                    }}
                    className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-900 hover:bg-[#E8FF6B] hover:text-black text-xs font-bold uppercase tracking-wider rounded-sm cursor-pointer transition-colors border border-zinc-200 dark:border-zinc-800"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* SECTION D: PAYMENT METHOD / BANK ACCOUNT */}
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-sm p-6">
              <h2 className="text-base font-black uppercase tracking-wider text-black dark:text-white mb-1 flex items-center gap-2">
                <span className="w-2 h-2 bg-[#E8FF6B] rounded-full" />
                PAYMENT METHOD (BANK ACCOUNT)
              </h2>
              <p className="text-xs text-zinc-500 mb-5">Account info shown to customers at checkout. Updated values appear instantly across all sessions.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-500 mb-1.5">
                    Bank Name {user?.role !== "Super Admin" && <span className="text-[10px] text-zinc-400 font-normal lowercase">(Super Admin Only)</span>}
                  </label>
                  <input
                    type="text"
                    required
                    disabled={user?.role !== "Super Admin"}
                    value={settingsForm.paymentBankName}
                    onChange={(e) => setSettingsForm({ ...settingsForm, paymentBankName: e.target.value })}
                    placeholder="GTBank"
                    className={`w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 text-sm focus:outline-none focus:border-[#E8FF6B] ${user?.role !== "Super Admin" ? "opacity-50 cursor-not-allowed" : ""}`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-500 mb-1.5">
                    Account Number {user?.role !== "Super Admin" && <span className="text-[10px] text-zinc-400 font-normal lowercase">(Super Admin Only)</span>}
                  </label>
                  <input
                    type="text"
                    required
                    disabled={user?.role !== "Super Admin"}
                    value={settingsForm.paymentAccountNumber}
                    onChange={(e) => setSettingsForm({ ...settingsForm, paymentAccountNumber: e.target.value })}
                    placeholder="0123456789"
                    maxLength={20}
                    className={`w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 text-sm focus:outline-none focus:border-[#E8FF6B] font-mono tracking-widest ${user?.role !== "Super Admin" ? "opacity-50 cursor-not-allowed" : ""}`}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-500 mb-1.5">
                    Account Name {user?.role !== "Super Admin" && <span className="text-[10px] text-zinc-400 font-normal lowercase">(Super Admin Only)</span>}
                  </label>
                  <input
                    type="text"
                    required
                    disabled={user?.role !== "Super Admin"}
                    value={settingsForm.paymentAccountName}
                    onChange={(e) => setSettingsForm({ ...settingsForm, paymentAccountName: e.target.value })}
                    placeholder="Plain Culture Clothing Ltd"
                    className={`w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 text-sm focus:outline-none focus:border-[#E8FF6B] ${user?.role !== "Super Admin" ? "opacity-50 cursor-not-allowed" : ""}`}
                  />
                </div>
              </div>
            </div>

            {/* SECTION E: WEBSITE CONTENT - HERO PAGE */}
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-sm p-6">
              <h2 className="text-base font-black uppercase tracking-wider text-black dark:text-white mb-1 flex items-center gap-2">
                <span className="w-2 h-2 bg-[#E8FF6B] rounded-full" />
                HERO PAGE CONTENT
              </h2>
              <p className="text-xs text-zinc-500 mb-5">Edit the main headline and subtitle shown on the homepage hero section.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-500 mb-1.5">Hero Title (Main Headline)</label>
                  <textarea
                    rows={2}
                    value={settingsForm.heroTitle}
                    onChange={(e) => setSettingsForm({ ...settingsForm, heroTitle: e.target.value })}
                    placeholder="CHANNELS OF PURE CULTURE"
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 text-sm focus:outline-none focus:border-[#E8FF6B]"
                  />
                </div>

                 <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-500 mb-1.5">Hero Subtitle (Description)</label>
                  <textarea
                    rows={3}
                    value={settingsForm.heroSubtitle}
                    onChange={(e) => setSettingsForm({ ...settingsForm, heroSubtitle: e.target.value })}
                    placeholder="Heavyweight luxury blanks tailored for creative minds..."
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 text-sm focus:outline-none focus:border-[#E8FF6B]"
                  />
                </div>

                {/* Hero Desktop and Mobile Background Image upload */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-zinc-100 dark:border-zinc-900">

                  {/* HERO DESKTOP */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-black uppercase tracking-wider text-zinc-500">Hero Image — Desktop</label>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">Landscape</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded">
                      <div className="w-16 h-10 bg-zinc-100 dark:bg-zinc-950 rounded flex items-center justify-center overflow-hidden shrink-0 border border-zinc-200 dark:border-zinc-800">
                        <img src={settingsForm.heroImageDesktop} alt="" className="w-full h-full object-cover" />
                      </div>
                      <label className="cursor-pointer px-3 py-1.5 bg-black dark:bg-white text-white dark:text-black text-[10px] font-bold uppercase tracking-wider rounded hover:opacity-90 flex-1 text-center">
                        Upload Desktop
                        <input type="file" accept="image/*" onChange={handleHeroImageUploadDesktop} className="hidden" />
                      </label>
                    </div>
                    {/* Size Recommendations */}
                    <div className="bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded p-3 space-y-1.5">
                      <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">📐 Recommended Specs</p>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] text-zinc-500">
                        <span className="font-semibold text-zinc-400">Ideal Size:</span><span>1920 × 1080 px</span>
                        <span className="font-semibold text-zinc-400">Min Size:</span><span>1280 × 720 px</span>
                        <span className="font-semibold text-zinc-400">Aspect Ratio:</span><span>16:9 Landscape</span>
                        <span className="font-semibold text-zinc-400">Max File:</span><span>5 MB (auto-compressed)</span>
                        <span className="font-semibold text-zinc-400">Format:</span><span>JPG / PNG preferred</span>
                        <span className="font-semibold text-zinc-400">DPI:</span><span>72 dpi (screen-only)</span>
                      </div>
                      <p className="text-[10px] text-[#E8FF6B] mt-1">💡 High-contrast subjects (dark/black tones) work best with the overlay effect.</p>
                    </div>
                  </div>

                  {/* HERO MOBILE */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-black uppercase tracking-wider text-zinc-500">Hero Image — Mobile</label>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded">Portrait</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded">
                      <div className="w-10 h-14 bg-zinc-100 dark:bg-zinc-950 rounded flex items-center justify-center overflow-hidden shrink-0 border border-zinc-200 dark:border-zinc-800">
                        <img src={settingsForm.heroImageMobile} alt="" className="w-full h-full object-cover" />
                      </div>
                      <label className="cursor-pointer px-3 py-1.5 bg-black dark:bg-white text-white dark:text-black text-[10px] font-bold uppercase tracking-wider rounded hover:opacity-90 flex-1 text-center">
                        Upload Mobile
                        <input type="file" accept="image/*" onChange={handleHeroImageUploadMobile} className="hidden" />
                      </label>
                    </div>
                    {/* Size Recommendations */}
                    <div className="bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded p-3 space-y-1.5">
                      <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">📐 Recommended Specs</p>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] text-zinc-500">
                        <span className="font-semibold text-zinc-400">Ideal Size:</span><span>828 × 1472 px</span>
                        <span className="font-semibold text-zinc-400">Min Size:</span><span>390 × 700 px</span>
                        <span className="font-semibold text-zinc-400">Aspect Ratio:</span><span>9:16 Portrait</span>
                        <span className="font-semibold text-zinc-400">Max File:</span><span>3 MB (auto-compressed)</span>
                        <span className="font-semibold text-zinc-400">Format:</span><span>JPG / PNG preferred</span>
                        <span className="font-semibold text-zinc-400">Focus:</span><span>Centre subject — top/bottom may crop</span>
                      </div>
                      <p className="text-[10px] text-[#E8FF6B] mt-1">💡 Keep the main subject centred — the hero text overlays the bottom 50% on mobile.</p>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* SECTION F: WEBSITE CONTENT - MANIFESTO SECTION */}
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-sm p-6">
              <h2 className="text-base font-black uppercase tracking-wider text-black dark:text-white mb-1 flex items-center gap-2">
                <span className="w-2 h-2 bg-[#E8FF6B] rounded-full" />
                BRAND MANIFESTO CONTENT
              </h2>
              <p className="text-xs text-zinc-500 mb-5">Edit the "Why Do We Make..." section on the homepage.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-500 mb-1.5">Manifesto Title</label>
                  <textarea
                    rows={2}
                    value={settingsForm.manifestoTitle}
                    onChange={(e) => setSettingsForm({ ...settingsForm, manifestoTitle: e.target.value })}
                    placeholder="WHY DO WE ONLY MAKE HEAVYWEIGHT BLANKS?"
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 text-sm focus:outline-none focus:border-[#E8FF6B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-500 mb-1.5">Manifesto First Paragraph</label>
                  <textarea
                    rows={3}
                    value={settingsForm.manifestoText1}
                    onChange={(e) => setSettingsForm({ ...settingsForm, manifestoText1: e.target.value })}
                    placeholder="Most standard fashion brands produce..."
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 text-sm focus:outline-none focus:border-[#E8FF6B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-500 mb-1.5">Manifesto Second Paragraph</label>
                  <textarea
                    rows={3}
                    value={settingsForm.manifestoText2}
                    onChange={(e) => setSettingsForm({ ...settingsForm, manifestoText2: e.target.value })}
                    placeholder="Plain Culture shirts are structured from 280GSM..."
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 text-sm focus:outline-none focus:border-[#E8FF6B]"
                  />
                </div>

                {/* Manifesto Desktop and Mobile Background Image upload */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-zinc-100 dark:border-zinc-900">

                  {/* MANIFESTO DESKTOP */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-black uppercase tracking-wider text-zinc-500">Manifesto Image — Desktop</label>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">Square</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded">
                      <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-950 rounded flex items-center justify-center overflow-hidden shrink-0 border border-zinc-200 dark:border-zinc-800">
                        <img src={settingsForm.manifestoImageDesktop} alt="" className="w-full h-full object-cover" />
                      </div>
                      <label className="cursor-pointer px-3 py-1.5 bg-black dark:bg-white text-white dark:text-black text-[10px] font-bold uppercase tracking-wider rounded hover:opacity-90 flex-1 text-center">
                        Upload Desktop
                        <input type="file" accept="image/*" onChange={handleManifestoImageUploadDesktop} className="hidden" />
                      </label>
                    </div>
                    {/* Size Recommendations */}
                    <div className="bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded p-3 space-y-1.5">
                      <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">📐 Recommended Specs</p>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] text-zinc-500">
                        <span className="font-semibold text-zinc-400">Ideal Size:</span><span>900 × 900 px</span>
                        <span className="font-semibold text-zinc-400">Min Size:</span><span>600 × 600 px</span>
                        <span className="font-semibold text-zinc-400">Aspect Ratio:</span><span>1:1 Square</span>
                        <span className="font-semibold text-zinc-400">Max File:</span><span>4 MB (auto-compressed)</span>
                        <span className="font-semibold text-zinc-400">Format:</span><span>JPG / PNG preferred</span>
                        <span className="font-semibold text-zinc-400">Style:</span><span>Editorial fashion / dark tone</span>
                      </div>
                      <p className="text-[10px] text-[#E8FF6B] mt-1">💡 Square editorial garment shots or flat-lays look premium here. Dark/shadowed images work best.</p>
                    </div>
                  </div>

                  {/* MANIFESTO MOBILE */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-black uppercase tracking-wider text-zinc-500">Manifesto Image — Mobile</label>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded">Portrait</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded">
                      <div className="w-10 h-14 bg-zinc-100 dark:bg-zinc-950 rounded flex items-center justify-center overflow-hidden shrink-0 border border-zinc-200 dark:border-zinc-800">
                        <img src={settingsForm.manifestoImageMobile} alt="" className="w-full h-full object-cover" />
                      </div>
                      <label className="cursor-pointer px-3 py-1.5 bg-black dark:bg-white text-white dark:text-black text-[10px] font-bold uppercase tracking-wider rounded hover:opacity-90 flex-1 text-center">
                        Upload Mobile
                        <input type="file" accept="image/*" onChange={handleManifestoImageUploadMobile} className="hidden" />
                      </label>
                    </div>
                    {/* Size Recommendations */}
                    <div className="bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded p-3 space-y-1.5">
                      <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">📐 Recommended Specs</p>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] text-zinc-500">
                        <span className="font-semibold text-zinc-400">Ideal Size:</span><span>750 × 1000 px</span>
                        <span className="font-semibold text-zinc-400">Min Size:</span><span>390 × 520 px</span>
                        <span className="font-semibold text-zinc-400">Aspect Ratio:</span><span>3:4 Portrait</span>
                        <span className="font-semibold text-zinc-400">Max File:</span><span>3 MB (auto-compressed)</span>
                        <span className="font-semibold text-zinc-400">Format:</span><span>JPG / PNG preferred</span>
                        <span className="font-semibold text-zinc-400">Focus:</span><span>Centre — text overlays bottom area</span>
                      </div>
                      <p className="text-[10px] text-[#E8FF6B] mt-1">💡 A close-up fabric or garment texture works beautifully here on mobile screens.</p>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* SECTION G: WEBSITE CONTENT - FOOTER & POLICIES */}
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-sm p-6">
              <h2 className="text-base font-black uppercase tracking-wider text-black dark:text-white mb-1 flex items-center gap-2">
                <span className="w-2 h-2 bg-[#E8FF6B] rounded-full" />
                FOOTER & POLICIES CONTENT
              </h2>
              <p className="text-xs text-zinc-500 mb-5">Edit the footer brand description, drop policy, and return policy content.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-500 mb-1.5">Physical Address</label>
                  <input
                    type="text"
                    value={settingsForm.physicalAddress}
                    onChange={(e) => setSettingsForm({ ...settingsForm, physicalAddress: e.target.value })}
                    placeholder="Ibadan, Oyo-State, Nigeria."
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 text-sm focus:outline-none focus:border-[#E8FF6B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-500 mb-1.5">Footer Brand Description</label>
                  <textarea
                    rows={2}
                    value={settingsForm.footerBrandDescription}
                    onChange={(e) => setSettingsForm({ ...settingsForm, footerBrandDescription: e.target.value })}
                    placeholder="We engineer luxury minimalist garments..."
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 text-sm focus:outline-none focus:border-[#E8FF6B]"
                  />
                </div>

                {/* TRUST FACTORS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-zinc-100 dark:border-zinc-900">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-2">
                      <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-500">Trust Factor {i} Title</label>
                      <input
                        type="text"
                        value={settingsForm[`trustFactor${i}Title` as keyof typeof settingsForm] as string}
                        onChange={(e) => setSettingsForm({ ...settingsForm, [`trustFactor${i}Title`]: e.target.value })}
                        className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2 text-xs focus:outline-none focus:border-[#E8FF6B]"
                      />
                      <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-500">Subtitle</label>
                      <textarea
                        rows={2}
                        value={settingsForm[`trustFactor${i}Subtitle` as keyof typeof settingsForm] as string}
                        onChange={(e) => setSettingsForm({ ...settingsForm, [`trustFactor${i}Subtitle`]: e.target.value })}
                        className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2 text-xs focus:outline-none focus:border-[#E8FF6B]"
                      />
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-500 mb-1.5">Drop Policy Text</label>
                  <textarea
                    rows={2}
                    value={settingsForm.dropPolicy}
                    onChange={(e) => setSettingsForm({ ...settingsForm, dropPolicy: e.target.value })}
                    placeholder="Small-Batch Releases. All sales final..."
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 text-sm focus:outline-none focus:border-[#E8FF6B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-500 mb-1.5">Return Policy Title</label>
                  <input
                    type="text"
                    value={settingsForm.returnPolicyTitle}
                    onChange={(e) => setSettingsForm({ ...settingsForm, returnPolicyTitle: e.target.value })}
                    placeholder="Return & Exchange Policy"
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 text-sm focus:outline-none focus:border-[#E8FF6B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-500 mb-1.5">Return Policy Full Content (Markdown supported)</label>
                  <textarea
                    rows={5}
                    value={settingsForm.returnPolicyContent}
                    onChange={(e) => setSettingsForm({ ...settingsForm, returnPolicyContent: e.target.value })}
                    placeholder="Use **Bold** for titles, bullet points with •, and numbered lists..."
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 text-sm focus:outline-none focus:border-[#E8FF6B] font-mono text-[11px]"
                  />
                  <p className="text-[10px] text-zinc-400 mt-1">💡 Use **text** for bold, • for bullets, and separate sections with blank lines.</p>
                </div>
              </div>
            </div>

            {/* SECTION H: SOCIAL MEDIA HANDLES */}
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-sm p-6">
              <h2 className="text-base font-black uppercase tracking-wider text-black dark:text-white mb-1 flex items-center gap-2">
                <span className="w-2 h-2 bg-[#E8FF6B] rounded-full" />
                SOCIAL MEDIA HANDLES
              </h2>
              <p className="text-xs text-zinc-500 mb-5">Edit your social media handles shown in the footer. These appear directly on the website.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-500 mb-1.5">Instagram Handle</label>
                  <input
                    type="text"
                    value={settingsForm.instagramHandle}
                    onChange={(e) => setSettingsForm({ ...settingsForm, instagramHandle: e.target.value })}
                    placeholder="@plainculture.ng"
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 text-sm focus:outline-none focus:border-[#E8FF6B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-500 mb-1.5">Twitter Handle</label>
                  <input
                    type="text"
                    value={settingsForm.twitterHandle}
                    onChange={(e) => setSettingsForm({ ...settingsForm, twitterHandle: e.target.value })}
                    placeholder="@plainculture"
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 text-sm focus:outline-none focus:border-[#E8FF6B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-500 mb-1.5">TikTok Handle</label>
                  <input
                    type="text"
                    value={settingsForm.tiktokHandle}
                    onChange={(e) => setSettingsForm({ ...settingsForm, tiktokHandle: e.target.value })}
                    placeholder="@plainculture"
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 text-sm focus:outline-none focus:border-[#E8FF6B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-500 mb-1.5">Facebook Handle</label>
                  <input
                    type="text"
                    value={settingsForm.facebookHandle}
                    onChange={(e) => setSettingsForm({ ...settingsForm, facebookHandle: e.target.value })}
                    placeholder="plainculture"
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 text-sm focus:outline-none focus:border-[#E8FF6B]"
                  />
                </div>
              </div>
            </div>

            {/* SECTION I: CONTACT & ADMIN ACCESS */}
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-sm p-6">
              <h2 className="text-base font-black uppercase tracking-wider text-black dark:text-white mb-1 flex items-center gap-2">
                <span className="w-2 h-2 bg-[#E8FF6B] rounded-full" />
                CONTACT & ADMIN ACCESS
              </h2>
              <p className="text-xs text-zinc-500 mb-5">Update store contact channels and admin password.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-500 mb-1.5">WhatsApp Phone</label>
                  <input
                    type="text"
                    required
                    value={settingsForm.phone}
                    onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                    placeholder="+2348088171549"
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 text-sm focus:outline-none focus:border-[#E8FF6B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-500 mb-1.5">Admin Email</label>
                  <input
                    type="email"
                    required
                    value={settingsForm.email}
                    onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
                    placeholder="plainculture.ng@gmail.com"
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 text-sm focus:outline-none focus:border-[#E8FF6B]"
                  />
                </div>

                <div className="md:col-span-2 pt-4 border-t border-zinc-100 dark:border-zinc-900">
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-500 mb-1.5">New Admin Password</label>
                  <input
                    type="password"
                    value={settingsForm.newPassword}
                    onChange={(e) => setSettingsForm({ ...settingsForm, newPassword: e.target.value })}
                    placeholder="Leave empty to keep current"
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 text-sm focus:outline-none focus:border-[#E8FF6B]"
                  />
                </div>
              </div>
            </div>

            {/* SECTION J: TEAM & PARTNER ACCESS */}
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-sm p-6">
              <h2 className="text-base font-black uppercase tracking-wider text-black dark:text-white mb-1 flex items-center gap-2">
                <span className="w-2 h-2 bg-[#E8FF6B] rounded-full" />
                TEAM & PARTNER ACCESS
              </h2>
              <p className="text-xs text-zinc-500 mb-5">
                Add an <strong className="text-black dark:text-white">Admin</strong> (full operational access) or a <strong className="text-black dark:text-white">Business Partner</strong> (read-only executive dashboard with financial intelligence — cannot edit products, orders, or settings).
              </p>

              {/* Role selector */}
              <div className="mb-5">
                <label className="block text-xs font-black uppercase tracking-wider text-zinc-500 mb-2">Access Role</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAdminForm({ ...adminForm, role: "Admin" })}
                    className={`text-left p-3 rounded-sm border transition-all cursor-pointer ${
                      adminForm.role === "Admin"
                        ? "border-[#E8FF6B] bg-[#E8FF6B]/10"
                        : "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 hover:border-zinc-400"
                    }`}
                  >
                    <span className="block text-xs font-black uppercase tracking-wider text-black dark:text-white">Admin</span>
                    <span className="block text-[10px] text-zinc-500 mt-0.5">Full operational access to manage the store.</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdminForm({ ...adminForm, role: "Partner" })}
                    className={`text-left p-3 rounded-sm border transition-all cursor-pointer ${
                      adminForm.role === "Partner"
                        ? "border-[#E8FF6B] bg-[#E8FF6B]/10"
                        : "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 hover:border-zinc-400"
                    }`}
                  >
                    <span className="block text-xs font-black uppercase tracking-wider text-black dark:text-white">Business Partner</span>
                    <span className="block text-[10px] text-zinc-500 mt-0.5">Read-only executive dashboard. Cannot change anything.</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-500 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={adminForm.name}
                    onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })}
                    placeholder={adminForm.role === "Partner" ? "e.g. Business Partner" : "e.g. Store Manager"}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 text-sm focus:outline-none focus:border-[#E8FF6B]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-500 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={adminForm.email}
                    onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                    placeholder="name@plainculture.ng"
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 text-sm focus:outline-none focus:border-[#E8FF6B]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-500 mb-1.5">Temporary Password</label>
                  <input
                    type="password"
                    value={adminForm.password}
                    onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                    placeholder="Minimum 8 characters"
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 text-sm focus:outline-none focus:border-[#E8FF6B]"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddAdmin}
                className="w-full md:w-auto px-5 py-3 bg-black dark:bg-[#E8FF6B] text-white dark:text-black font-extrabold uppercase tracking-widest text-xs rounded-sm hover:opacity-90 transition-opacity cursor-pointer"
              >
                {adminForm.role === "Partner" ? "Add Business Partner" : "Add Full Access Admin"}
              </button>

              <div className="mt-6 pt-5 border-t border-zinc-100 dark:border-zinc-900 space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-zinc-500">Current Team & Partners</h3>
                {admins.map((admin) => {
                  const isProtected = admin.id === "plainculture-primary-admin" || admin.id === "plainculture-fallback-admin";
                  const isPartner = admin.role === "Partner";
                  const roleLabel = admin.role === "Super Admin" ? "Super Admin" : isPartner ? "Partner • Read-Only" : "Full Access";
                  return (
                    <div key={admin.id} className="flex items-center justify-between gap-4 p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-sm">
                      <div>
                        <p className="text-sm font-bold text-black dark:text-white uppercase tracking-wide">{admin.name}</p>
                        <p className="text-xs text-zinc-500">{admin.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono mr-2 border border-zinc-200 dark:border-zinc-800 px-2 py-1 rounded-sm">
                          {admin.trackingCode}
                        </span>
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-sm ${
                          isPartner
                            ? "bg-purple-500/15 text-purple-600 dark:text-purple-400"
                            : "bg-[#E8FF6B]/15 text-black dark:text-[#E8FF6B]"
                        }`}>
                          {roleLabel}
                        </span>
                        {!isProtected && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleToggleAdminStatus(admin.id, admin.name, admin.email, admin.isActive)}
                              className="text-zinc-400 hover:text-white transition-colors cursor-pointer mr-2"
                              title={admin.isActive ? "Deactivate Admin" : "Activate Admin"}
                            >
                              {admin.isActive ? (
                                <div className="flex items-center gap-1 text-emerald-500 text-[10px] font-semibold uppercase tracking-wider">
                                  <ToggleRight className="w-5 h-5" />
                                  <span>Active</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-zinc-500 text-[10px] font-semibold uppercase tracking-wider">
                                  <ToggleLeft className="w-5 h-5" />
                                  <span>Inactive</span>
                                </div>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteAdmin(admin.id, admin.name, admin.email)}
                              className="p-2 text-red-500 hover:bg-red-500/10 rounded-sm transition-colors cursor-pointer"
                              title="Remove admin access"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* GLOBAL SAVE ACTION */}
            <button
              type="submit"
              className="w-full py-4 bg-[#E8FF6B] hover:bg-[#d0e54d] text-black font-extrabold uppercase tracking-widest text-xs rounded-sm transition-all shadow-md cursor-pointer"
            >
              💾 SAVE ALL SETTINGS & BROADCAST CHANGES LIVE
            </button>
          </form>
          ) : (
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-sm p-12 text-center shadow-md">
              <Shield className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
              <h2 className="text-lg font-black uppercase tracking-wider text-black dark:text-white mb-2">Restricted Access</h2>
              <p className="text-sm text-zinc-500 max-w-md mx-auto">
                Only the Super Admin can view and modify global store settings, configuration details, and administrative access controls.
              </p>
            </div>
          )
        )}

        {/* ==========================================
            TAB 6: ADMIN ACTIVITIES LOG
            ========================================== */}
        {activeTab === "activities" && user?.role === "Super Admin" && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black uppercase tracking-wider text-black dark:text-white">
                  ADMIN ACTIVITIES STREAM
                </h2>
                <p className="text-xs text-zinc-400">Real-time audit log of all system changes and assigned admin actions. Filter, search, or clear entries.</p>
              </div>
            </div>

            {/* Filter & Search Controls */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-zinc-100 dark:bg-zinc-950 p-4 border border-zinc-200 dark:border-zinc-900 rounded-sm">
              <div className="relative w-full md:max-w-md">
                <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search logs by admin name, email, or action..."
                  value={activitySearchQuery}
                  onChange={(e) => setActivitySearchQuery(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 pl-10 p-2.5 rounded text-sm focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-3 self-end md:self-auto">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  {filteredActivities.length} of {activities.length} logs
                </span>
                {filteredActivities.length > 0 && (
                  <button
                    onClick={handleDeleteAllActivities}
                    className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-extrabold uppercase tracking-wider text-xs rounded-sm cursor-pointer transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear All Logs</span>
                  </button>
                )}
              </div>
            </div>

            {/* Activities Table */}
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm min-w-[600px]">
                  <thead>
                    <tr className="bg-zinc-100 dark:bg-zinc-900 text-zinc-500 uppercase tracking-wider text-[10px] border-b border-zinc-200 dark:border-zinc-800">
                      <th className="py-4 px-6 w-48">Timestamp</th>
                      <th className="py-4 px-6 w-48">Admin Name</th>
                      <th className="py-4 px-6">Action / Event Details</th>
                      <th className="py-4 px-6 w-16 text-right">Delete</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-900">
                    {filteredActivities.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-zinc-500 font-medium">
                          {activities.length === 0 ? "No system activities recorded yet." : "No logs match your search query."}
                        </td>
                      </tr>
                    ) : (
                      filteredActivities.map((act) => (
                        <tr key={act.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10 transition-colors">
                          <td className="py-4 px-6 text-xs text-zinc-500 whitespace-nowrap">
                            {new Date(act.timestamp).toLocaleString(undefined, { 
                              year: 'numeric', month: 'short', day: 'numeric', 
                              hour: '2-digit', minute: '2-digit', second: '2-digit' 
                            })}
                          </td>
                          <td className="py-4 px-6">
                            <span className="font-bold text-black dark:text-white uppercase text-xs flex items-center gap-1.5 mb-0.5">
                              {act.adminName}
                              {(() => {
                                const matchedAdmin = admins.find(a => a.email.toLowerCase() === act.adminEmail.toLowerCase());
                                if (matchedAdmin) {
                                  return (
                                    <span className="bg-zinc-100 dark:bg-zinc-800 text-[9px] px-1.5 rounded-sm font-mono text-zinc-500">
                                      {matchedAdmin.trackingCode}
                                    </span>
                                  );
                                }
                                return null;
                              })()}
                            </span>
                            <span className="text-[10px] text-zinc-400">{act.adminEmail}</span>
                          </td>
                          <td className="py-4 px-6 text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                            {act.action}
                          </td>
                          <td className="py-4 px-6 text-right">
                            <button
                              onClick={() => handleDeleteActivity(act.id)}
                              className="p-1.5 hover:bg-red-500/10 rounded text-zinc-400 hover:text-red-500 cursor-pointer transition-colors"
                              title="Delete this log entry"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ==========================================
          MODAL 1: ADD / EDIT PRODUCT DROP FORM
          ========================================== */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
          <div onClick={() => setIsProductModalOpen(false)} className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
          
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative transform overflow-hidden rounded-sm bg-white dark:bg-zinc-950 text-black dark:text-white p-6 w-full max-w-lg border border-zinc-200 dark:border-zinc-900 shadow-2xl">
              <button 
                onClick={() => setIsProductModalOpen(false)} 
                className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-black dark:hover:text-white rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-base font-black uppercase tracking-wider mb-6 pb-2 border-b border-zinc-200 dark:border-zinc-800">
                {editingProduct ? `Edit "${editingProduct.name}"` : "ADD NEW EXCLUSIVE DROP PIECE"}
              </h3>

              <form onSubmit={handleProductSubmit} className="space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">T-Shirt Name *</label>
                  <input
                    type="text"
                    required
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    placeholder="Onyx Heavyweight Tee"
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded text-sm focus:outline-none focus:border-[#E8FF6B]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">
                      Price (₦) * {user?.role !== "Super Admin" && <span className="text-[10px] text-zinc-400 font-normal lowercase">(Super Admin Only)</span>}
                    </label>
                    <input
                      type="number"
                      required
                      disabled={user?.role !== "Super Admin"}
                      value={productForm.price}
                      onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                      placeholder="15000"
                      className={`w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded text-sm focus:outline-none focus:border-[#E8FF6B] ${user?.role !== "Super Admin" ? "opacity-50 cursor-not-allowed" : ""}`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Initial Stock Quantity *</label>
                    <input
                      type="number"
                      required
                      value={productForm.stockQuantity}
                      onChange={(e) => setProductForm({ ...productForm, stockQuantity: Number(e.target.value) })}
                      placeholder="15"
                      className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded text-sm focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Product Description</label>
                  <textarea
                    rows={3}
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    placeholder="Highlight fabric structure, combed cotton weight, and fit style parameters..."
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded text-sm focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold uppercase text-zinc-500">Product Images ({productForm.images.length}/{PRODUCT_IMAGE_LIMIT})</label>
                    <span className="text-[10px] text-zinc-400 uppercase font-bold">Auto-compressed on upload</span>
                  </div>

                  <label className="flex flex-col items-center justify-center gap-2 w-full border-2 border-dashed border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 hover:border-[#E8FF6B] rounded-sm p-5 cursor-pointer transition-colors">
                    <Upload className="w-5 h-5 text-[#E8FF6B]" />
                    <span className="text-xs font-black uppercase tracking-widest text-zinc-700 dark:text-zinc-300">
                      Upload Multiple Product Images
                    </span>
                    <span className="text-[10px] text-zinc-400 text-center">
                      JPG, PNG, WEBP supported. Images are resized to 900px max and compressed for fast mobile loading.
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleProductImageUpload}
                      className="hidden"
                    />
                  </label>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                    {productForm.images.map((image, index) => (
                      <div key={`${image}-${index}`} className="relative group aspect-square bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-sm overflow-hidden">
                        <img src={image} alt={`Product image ${index + 1}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                          {index !== 0 && (
                            <button
                              type="button"
                              onClick={() => handleSetProductCover(index)}
                              className="p-1.5 bg-[#E8FF6B] text-black rounded-full cursor-pointer"
                              title="Set as cover image"
                            >
                              <Star className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveProductImage(index)}
                            className="p-1.5 bg-red-500 text-white rounded-full cursor-pointer"
                            title="Remove image"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {index === 0 && (
                          <span className="absolute top-1 left-1 bg-[#E8FF6B] text-black text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-sm">
                            Cover
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-sm">
                    <div className="flex items-center gap-1.5 mb-2 text-[10px] uppercase tracking-widest font-black text-zinc-500">
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Add preset brand assets</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {storeSettings.presetAssets?.map((asset) => (
                        <div key={asset.value} className="flex items-stretch bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-sm overflow-hidden">
                          <button
                            type="button"
                            onClick={() => handleAddPresetProductImage(asset.value)}
                            disabled={productForm.images.includes(asset.value) || productForm.images.length >= PRODUCT_IMAGE_LIMIT}
                            className="px-2.5 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#E8FF6B] hover:text-black text-[10px] font-bold uppercase tracking-wider cursor-pointer border-r border-zinc-200 dark:border-zinc-800"
                          >
                            + {asset.label}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemovePresetAsset(asset.value)}
                            className="px-2 py-1.5 text-zinc-400 hover:bg-red-500 hover:text-white transition-colors cursor-pointer"
                            title="Delete Preset Asset"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                      <input
                        type="text"
                        value={newPresetLabel}
                        onChange={(e) => setNewPresetLabel(e.target.value)}
                        placeholder="New Preset Label (e.g. Acid Wash)"
                        className="flex-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2 text-[10px] uppercase font-bold focus:outline-none focus:border-[#E8FF6B] rounded-sm"
                      />
                      <label className={`cursor-pointer px-3 py-2 bg-black dark:bg-white text-white dark:text-black text-[10px] font-bold uppercase tracking-wider rounded-sm ${!newPresetLabel.trim() ? "opacity-50 cursor-not-allowed" : "hover:opacity-90"}`}>
                        <span>Upload & Save</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          disabled={!newPresetLabel.trim()}
                          onChange={handleAddPresetAsset} 
                          className="hidden" 
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 mb-2">Sizes Available</label>
                  <div className="flex gap-4">
                    {["S", "M", "L", "XL"].map((size) => (
                      <label key={size} className="flex items-center gap-1.5 font-bold text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={productForm.sizes.includes(size)}
                          onChange={() => handleToggleProductSize(size)}
                          className="w-4 h-4 accent-[#E8FF6B]"
                        />
                        <span>{size}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={productForm.isActive}
                    onChange={(e) => setProductForm({ ...productForm, isActive: e.target.checked })}
                    className="w-4.5 h-4.5 accent-[#E8FF6B]"
                  />
                  <label htmlFor="isActive" className="text-xs font-bold uppercase text-zinc-700 dark:text-zinc-300 cursor-pointer">
                    Product Is Active (visible to the public on homepage)
                  </label>
                </div>

                <div className="pt-4 border-t border-zinc-200 dark:border-zinc-850 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsProductModalOpen(false)}
                    className="flex-1 py-3 bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 font-bold uppercase tracking-wider text-xs rounded-sm transition-colors cursor-pointer text-center"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="flex-1 py-3 bg-[#E8FF6B] text-black font-extrabold uppercase tracking-widest text-xs rounded-sm hover:opacity-90 transition-opacity cursor-pointer text-center"
                  >
                    {editingProduct ? "Save Changes" : "Create Product"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL 2: ADD MANUAL PHYSICAL CUSTOMER
          ========================================== */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
          <div onClick={() => setIsCustomerModalOpen(false)} className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
          
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative transform overflow-hidden rounded-sm bg-white dark:bg-zinc-950 text-black dark:text-white p-6 w-full max-w-md border border-zinc-200 dark:border-zinc-900 shadow-2xl">
              <button 
                onClick={() => setIsCustomerModalOpen(false)} 
                className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-black dark:hover:text-white rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-base font-black uppercase tracking-wider mb-6 pb-2 border-b border-zinc-200 dark:border-zinc-800">
                ADD MANUAL PHYSICAL CUSTOMER
              </h3>

              <form onSubmit={handleCustomerSubmit} className="space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Customer Full Name *</label>
                  <input
                    type="text"
                    required
                    value={customerForm.name}
                    onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                    placeholder="e.g. Kolawole Balogun"
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded text-sm focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">WhatsApp Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={customerForm.phone}
                    onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                    placeholder="e.g. +2348033211222"
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded text-sm focus:outline-none"
                  />
                  <p className="text-[10px] text-zinc-400 mt-1">This will be the unique record ID to prevent duplicates.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Email Address (Optional)</label>
                  <input
                    type="email"
                    value={customerForm.email}
                    onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                    placeholder="e.g. kolabalo@gmail.com"
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded text-sm focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Customer Location / Delivery Spot *</label>
                  <input
                    type="text"
                    required
                    value={customerForm.location}
                    onChange={(e) => setCustomerForm({ ...customerForm, location: e.target.value })}
                    placeholder="e.g. Ring Road, Ibadan"
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded text-sm focus:outline-none"
                  />
                </div>

                <div className="pt-4 border-t border-zinc-200 dark:border-zinc-850 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCustomerModalOpen(false)}
                    className="flex-1 py-3 bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 font-bold uppercase tracking-wider text-xs rounded-sm transition-colors cursor-pointer text-center"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="flex-1 py-3 bg-[#E8FF6B] text-black font-extrabold uppercase tracking-widest text-xs rounded-sm hover:opacity-90 transition-opacity cursor-pointer text-center"
                  >
                    Add Customer
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
