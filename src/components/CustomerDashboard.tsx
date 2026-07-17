import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AppContext";
import { dbService, Order } from "../lib/firebase";
import { ArrowLeft, Clock, CheckCircle, Truck, LogOut, Package, User, Search, AlertCircle } from "lucide-react";

interface CustomerDashboardProps {
  onNavigateToHome: () => void;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({ onNavigateToHome }) => {
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [trackForm, setTrackForm] = useState({ orderId: "", phone: "" });
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);
  const [trackError, setTrackError] = useState("");

  useEffect(() => {
    if (!user?.email) return;
    const unsubscribe = dbService.subscribeOrders((allOrders) => {
      const userOrders = allOrders
        .filter((order) => order.customerEmail?.toLowerCase() === user.email.toLowerCase())
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setOrders(userOrders);
    });
    return unsubscribe;
  }, [user?.email]);

  const statusStyle = (status: string) => {
    if (status === "Delivered") return "bg-emerald-500/10 text-emerald-500";
    if (status === "Confirmed") return "bg-blue-500/10 text-blue-500";
    return "bg-yellow-500/10 text-yellow-500";
  };

  const statusIcon = (status: string) => {
    if (status === "Delivered") return <Truck className="w-3.5 h-3.5" />;
    if (status === "Confirmed") return <CheckCircle className="w-3.5 h-3.5" />;
    return <Clock className="w-3.5 h-3.5" />;
  };

  const handleTrackOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setTrackError("");
    setTrackedOrder(null);

    if (!trackForm.orderId.trim() || !trackForm.phone.trim()) {
      setTrackError("Please enter both Order ID and phone number.");
      return;
    }

    const allOrders = await dbService.getOrders();
    const normalizedId = trackForm.orderId.trim().replace(/^#/, "").toUpperCase();
    const normalizedPhone = trackForm.phone.replace(/\s/g, "");

    const match = allOrders.find((order) =>
      order.id.toUpperCase() === normalizedId &&
      order.phone.replace(/\s/g, "") === normalizedPhone
    );

    if (!match) {
      setTrackError("Order not found. Please check your Order ID and phone number.");
      return;
    }

    setTrackedOrder(match);
  };

  return (
    <main className="min-h-screen bg-white dark:bg-black text-black dark:text-white py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={onNavigateToHome}
          className="mb-8 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500 hover:text-[#E8FF6B] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to shop
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 mb-10 pb-6 border-b border-zinc-200 dark:border-zinc-900">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#E8FF6B] text-black flex items-center justify-center">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wider">My Account</h1>
              <p className="text-sm text-zinc-500">{user?.name || "Plain Culture Customer"} • {user?.email}</p>
            </div>
          </div>

          <button
            onClick={async () => { await logout(); onNavigateToHome(); }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:text-red-500 font-bold uppercase tracking-wider text-xs rounded-sm cursor-pointer transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 p-5 rounded-sm">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Total Orders</span>
            <p className="text-3xl font-black mt-2">{orders.length}</p>
          </div>
          <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 p-5 rounded-sm">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Pending</span>
            <p className="text-3xl font-black mt-2 text-yellow-500">{orders.filter((o) => o.status === "Pending").length}</p>
          </div>
          <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 p-5 rounded-sm">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Delivered</span>
            <p className="text-3xl font-black mt-2 text-emerald-500">{orders.filter((o) => o.status === "Delivered").length}</p>
          </div>
        </section>

        {/* Track My Order */}
        <section className="mb-10 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 p-5 rounded-sm">
          <div className="flex items-center gap-2 mb-4">
            <Search className="w-5 h-5 text-[#E8FF6B]" />
            <h2 className="text-lg font-black uppercase tracking-wider">Track My Order</h2>
          </div>
          <p className="text-xs text-zinc-500 mb-4">Enter an Order ID and phone number to check any order status.</p>

          <form onSubmit={handleTrackOrder} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3">
            <input
              type="text"
              value={trackForm.orderId}
              onChange={(e) => setTrackForm({ ...trackForm, orderId: e.target.value })}
              placeholder="Order ID e.g. PC-1234"
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 text-sm focus:outline-none focus:border-[#E8FF6B]"
            />
            <input
              type="tel"
              value={trackForm.phone}
              onChange={(e) => setTrackForm({ ...trackForm, phone: e.target.value })}
              placeholder="Phone number used for order"
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 text-sm focus:outline-none focus:border-[#E8FF6B]"
            />
            <button
              type="submit"
              className="px-5 py-3 bg-black dark:bg-[#E8FF6B] text-white dark:text-black font-extrabold uppercase tracking-widest text-xs rounded-sm hover:opacity-90 cursor-pointer"
            >
              Track
            </button>
          </form>

          {trackError && (
            <div className="mt-4 flex items-center gap-2 text-red-500 text-xs font-bold bg-red-500/10 border border-red-500/20 p-3 rounded-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{trackError}</span>
            </div>
          )}

          {trackedOrder && (
            <div className="mt-5 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 p-4 rounded-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="font-black text-[#E8FF6B] bg-black inline-block px-2.5 py-1 rounded-sm">#{trackedOrder.id}</p>
                  <p className="text-xs text-zinc-500 mt-2">Placed on {new Date(trackedOrder.createdAt).toLocaleString()}</p>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${statusStyle(trackedOrder.status)}`}>
                  {statusIcon(trackedOrder.status)}
                  {trackedOrder.status}
                </span>
              </div>
              <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-900 text-sm space-y-2">
                <div className="flex justify-between"><span className="text-zinc-500">Customer</span><span className="font-bold">{trackedOrder.customerName}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Total</span><span className="font-bold text-emerald-500">₦{trackedOrder.totalAmount.toLocaleString()}</span></div>
              </div>
            </div>
          )}
        </section>

        <section>
          <h2 className="text-lg font-black uppercase tracking-wider mb-4">My Orders</h2>
          {orders.length === 0 ? (
            <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 p-12 text-center rounded-sm">
              <Package className="w-12 h-12 mx-auto text-zinc-300 dark:text-zinc-700 mb-4" />
              <p className="text-sm text-zinc-500">No orders found for this email yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 p-5 rounded-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-zinc-200 dark:border-zinc-900">
                    <div>
                      <p className="font-black text-[#E8FF6B] bg-black inline-block px-2.5 py-1 rounded-sm">#{order.id}</p>
                      <p className="text-xs text-zinc-500 mt-2">Placed on {new Date(order.createdAt).toLocaleString()}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${statusStyle(order.status)}`}>
                      {statusIcon(order.status)}
                      {order.status}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span>{item.name} ({item.size}) × {item.qty}</span>
                        <span className="font-bold">₦{(item.price * item.qty).toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="pt-3 mt-3 border-t border-zinc-200 dark:border-zinc-900 flex justify-between font-black">
                      <span>Total</span>
                      <span className="text-emerald-500">₦{order.totalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
};