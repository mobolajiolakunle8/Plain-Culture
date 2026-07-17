import React, { useEffect, useMemo, useRef, useState } from "react";
import { Bell, CheckCheck, Package, Sparkles, Truck, X } from "lucide-react";
import { useAuth } from "../context/AppContext";
import { dbService, Order, Product } from "../lib/firebase";

type CustomerNotificationType = "order-status" | "delivery-update" | "drop-announcement" | "wishlist-low-stock";

interface CustomerNotification {
  id: string;
  type: CustomerNotificationType;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
}

const getNotificationsKey = (email: string) => `pc_customer_notifications_${email.toLowerCase()}`;
const getOrderStatusSnapshotKey = (email: string) => `pc_customer_order_snapshot_${email.toLowerCase()}`;
const getSeenDropKey = (email: string) => `pc_customer_seen_drop_${email.toLowerCase()}`;
const getWishlistAlertKey = (email: string) => `pc_customer_wishlist_alerts_${email.toLowerCase()}`;

const loadJson = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
};

export const CustomerNotificationsBell: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<CustomerNotification[]>([]);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const isCustomer = !!user && !isAdmin && user.role === "Customer";
  const email = user?.email || "";

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  useEffect(() => {
    if (!isCustomer || !email) {
      setNotifications([]);
      return;
    }
    setNotifications(loadJson<CustomerNotification[]>(getNotificationsKey(email), []));
  }, [isCustomer, email]);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  useEffect(() => {
    if (!isCustomer || !email) return;

    const pushNotification = (notification: CustomerNotification) => {
      setNotifications((prev) => {
        if (prev.some((n) => n.id === notification.id)) return prev;
        const next = [notification, ...prev].slice(0, 50);
        localStorage.setItem(getNotificationsKey(email), JSON.stringify(next));
        return next;
      });
    };

    const unsubOrders = dbService.subscribeOrders((allOrders: Order[]) => {
      const myOrders = allOrders.filter((order) => order.customerEmail?.toLowerCase() === email.toLowerCase());
      const snapshotKey = getOrderStatusSnapshotKey(email);
      const previousSnapshot = loadJson<Record<string, string>>(snapshotKey, {});
      const nextSnapshot: Record<string, string> = { ...previousSnapshot };

      myOrders.forEach((order) => {
        const previousStatus = previousSnapshot[order.id];
        nextSnapshot[order.id] = order.status;

        // First time seeing an existing order: just hydrate snapshot, don't notify retroactively.
        if (!previousStatus) return;
        if (previousStatus === order.status) return;

        pushNotification({
          id: `order-status-${order.id}-${order.status}`,
          type: order.status === "Delivered" ? "delivery-update" : "order-status",
          title: order.status === "Delivered" ? "Order delivered" : "Order status updated",
          message: `Your order #${order.id} is now ${order.status}.`,
          createdAt: new Date().toISOString(),
          read: false
        });
      });

      // Seed snapshot on first load if empty.
      if (Object.keys(previousSnapshot).length === 0) {
        myOrders.forEach((order) => {
          nextSnapshot[order.id] = order.status;
        });
      }

      localStorage.setItem(snapshotKey, JSON.stringify(nextSnapshot));
    });

    const unsubProducts = dbService.subscribeProducts((allProducts: Product[]) => {
      const activeProducts = allProducts.filter((p) => p.isActive);
      if (activeProducts.length === 0) return;

      // New drop announcements
      const latestProduct = [...activeProducts].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];
      const seenDropKey = getSeenDropKey(email);
      const seenDropTimestamp = localStorage.getItem(seenDropKey);
      if (!seenDropTimestamp) {
        localStorage.setItem(seenDropKey, latestProduct.createdAt);
      } else if (new Date(latestProduct.createdAt).getTime() > new Date(seenDropTimestamp).getTime()) {
        pushNotification({
          id: `drop-${latestProduct.id}`,
          type: "drop-announcement",
          title: "New drop live",
          message: `${latestProduct.name} is now available on the store.`,
          createdAt: new Date().toISOString(),
          read: false
        });
        localStorage.setItem(seenDropKey, latestProduct.createdAt);
      }

      // Wishlist low-stock alerts (future-friendly; works if wishlist exists in localStorage)
      const wishlistIds = loadJson<string[]>("pc_wishlist", []);
      const wishlistAlertMap = loadJson<Record<string, number>>(getWishlistAlertKey(email), {});
      const nextAlertMap = { ...wishlistAlertMap };

      wishlistIds.forEach((productId) => {
        const product = activeProducts.find((p) => p.id === productId);
        if (!product) return;
        const stock = product.stockQuantity;
        if (stock > 0 && stock <= 2 && nextAlertMap[productId] !== stock) {
          pushNotification({
            id: `wishlist-low-stock-${productId}-${stock}`,
            type: "wishlist-low-stock",
            title: "Wishlist item running low",
            message: `${product.name} has only ${stock} piece${stock === 1 ? "" : "s"} left.`,
            createdAt: new Date().toISOString(),
            read: false
          });
          nextAlertMap[productId] = stock;
        }
      });

      localStorage.setItem(getWishlistAlertKey(email), JSON.stringify(nextAlertMap));
    });

    return () => {
      unsubOrders();
      unsubProducts();
    };
  }, [email, isCustomer]);

  const markAllRead = () => {
    if (!email) return;
    const updated = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(updated);
    localStorage.setItem(getNotificationsKey(email), JSON.stringify(updated));
  };

  const dismissNotification = (id: string) => {
    if (!email) return;
    const updated = notifications.filter((n) => n.id !== id);
    setNotifications(updated);
    localStorage.setItem(getNotificationsKey(email), JSON.stringify(updated));
  };

  if (!isCustomer) return null;

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative p-2.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-300 transition-all cursor-pointer"
        title="Notifications"
        aria-label="Customer Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[#E8FF6B] text-black text-[10px] font-black rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-sm shadow-2xl overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-black dark:text-white">Notifications</h3>
              <p className="text-[10px] text-zinc-500">Stay updated on your orders and drops.</p>
            </div>
            {notifications.length > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500 hover:text-black dark:hover:text-white cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-zinc-500">
                No notifications yet.
              </div>
            ) : (
              notifications.map((notification) => {
                const icon = notification.type === "drop-announcement"
                  ? <Sparkles className="w-4 h-4 text-[#E8FF6B]" />
                  : notification.type === "delivery-update"
                    ? <Truck className="w-4 h-4 text-emerald-500" />
                    : <Package className="w-4 h-4 text-blue-500" />;

                return (
                  <div
                    key={notification.id}
                    className={`px-4 py-3 border-b border-zinc-100 dark:border-zinc-900 ${notification.read ? "opacity-70" : "bg-[#E8FF6B]/5"}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">{icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-bold uppercase tracking-wide text-black dark:text-white">
                            {notification.title}
                          </p>
                          <button
                            onClick={() => dismissNotification(notification.id)}
                            className="text-zinc-400 hover:text-red-500 cursor-pointer"
                            aria-label="Dismiss notification"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
                          {notification.message}
                        </p>
                        <p className="text-[10px] text-zinc-400 mt-2">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};