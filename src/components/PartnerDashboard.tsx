import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AppContext";
import { dbService, Product, Order, Customer } from "../lib/firebase";
import {
  TrendingUp,
  ClipboardList,
  Users,
  ShoppingBag,
  Wallet,
  Crown,
  Clock,
  CheckCircle,
  Truck,
  ShieldCheck,
  BarChart3,
  Eye,
  Lock,
  EyeOff,
  KeyRound,
  AlertCircle
} from "lucide-react";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

import {
  getRevenueChartData,
  getTopProductsChartData,
  getOrderStatusChartData,
  PIE_COLORS,
  STATUS_COLORS
} from "../utils/dashboardUtils";

interface PartnerDashboardProps {
  onNavigateToHome: () => void;
  onAddToast?: (text: string, type: "success" | "error" | "info") => void;
}

export const PartnerDashboard: React.FC<PartnerDashboardProps> = ({ onNavigateToHome, onAddToast }) => {
  const { user, logout } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "orders" | "security">("overview");

  // Password change form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  useEffect(() => {
    if (!user) return;
    const unsubOrders = dbService.subscribeOrders((o) => setOrders(o));
    const unsubProducts = dbService.subscribeProducts((p) => setProducts(p));
    const unsubCustomers = dbService.subscribeCustomers((c) => setCustomers(c));
    return () => {
      unsubOrders();
      unsubProducts();
      unsubCustomers();
    };
  }, [user]);

  // ============ METRICS (read-only intelligence) ============
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfWeek = startOfToday - 6 * 24 * 60 * 60 * 1000;
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  const paidOrders = orders.filter((o) => o.status !== "Pending");

  const revenueAllTime = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const revenueToday = paidOrders
    .filter((o) => new Date(o.createdAt).getTime() >= startOfToday)
    .reduce((sum, o) => sum + o.totalAmount, 0);
  const revenueWeek = paidOrders
    .filter((o) => new Date(o.createdAt).getTime() >= startOfWeek)
    .reduce((sum, o) => sum + o.totalAmount, 0);
  const revenueMonth = paidOrders
    .filter((o) => new Date(o.createdAt).getTime() >= startOfMonth)
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const totalOrders = orders.length;
  const pendingCount = orders.filter((o) => o.status === "Pending").length;
  const confirmedCount = orders.filter((o) => o.status === "Confirmed").length;
  const deliveredCount = orders.filter((o) => o.status === "Delivered").length;

  const avgOrderValue = paidOrders.length > 0 ? Math.round(revenueAllTime / paidOrders.length) : 0;
  const activeProducts = products.filter((p) => p.isActive).length;
  const inventoryValue = products.reduce((sum, p) => sum + p.price * p.stockQuantity, 0);

  // Top selling products by quantity sold (from delivered + confirmed orders)
  const productSales: Record<string, { name: string; qty: number; revenue: number; image: string }> = {};
  orders.forEach((order) => {
    order.items.forEach((item) => {
      if (!productSales[item.id]) {
        productSales[item.id] = { name: item.name, qty: 0, revenue: 0, image: item.image };
      }
      productSales[item.id].qty += item.qty;
      productSales[item.id].revenue += item.price * item.qty;
    });
  });
  const topProducts = Object.values(productSales).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  const sortedOrders = [...orders].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const notify = onAddToast || (() => {});

  const handlePasswordChange = async () => {
    if (!user) return;

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      notify("Please fill in all password fields.", "error");
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      notify("New password must be at least 8 characters.", "error");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      notify("New passwords do not match.", "error");
      return;
    }

    try {
      await dbService.updateSelfPassword(
        user.email,
        passwordForm.currentPassword,
        passwordForm.newPassword
      );

      // Log the password change for Super Admin visibility
      dbService.logActivity(user.email, user.name, `Changed their account password.`);

      notify("Password changed successfully. You'll need the new password on next login.", "success");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error: any) {
      notify(error.message || "Failed to change password.", "error");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-black dark:text-white transition-colors duration-300">

      {/* Top identity bar */}
      <div className="bg-zinc-100 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-900 py-3 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-zinc-500 flex-wrap">
            <Crown className="w-4 h-4 text-[#E8FF6B]" />
            <span>Business Partner: <strong className="text-black dark:text-white">{user?.name}</strong></span>
            <span className="px-1.5 py-0.5 bg-[#E8FF6B]/15 text-[10px] uppercase font-bold text-black dark:text-[#E8FF6B] rounded">
              Read-Only Access
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={onNavigateToHome}
              className="text-zinc-500 hover:text-black dark:hover:text-white font-bold uppercase tracking-wider"
            >
              ← View Live Shop
            </button>
            <button
              onClick={async () => { await logout(); onNavigateToHome(); }}
              className="text-red-500 hover:underline font-bold uppercase tracking-wider"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 pb-6 border-b border-zinc-200 dark:border-zinc-900">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-black dark:text-white flex items-center gap-2">
              <Crown className="w-6 h-6 text-[#E8FF6B]" />
              PARTNER SUITE
            </h1>
            <p className="text-xs text-zinc-400 mt-1 uppercase tracking-widest">
              Executive financial intelligence • Plain Culture, Ibadan
            </p>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: "overview", label: "Financial Overview", icon: BarChart3 },
              { id: "orders", label: "Orders", icon: ClipboardList },
              { id: "security", label: "Account Security", icon: Lock }
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
                </button>
              );
            })}
          </div>
        </div>

        {/* Read-only notice */}
        <div className="mb-8 flex items-center gap-2 bg-[#E8FF6B]/10 border border-[#E8FF6B]/30 text-black dark:text-[#E8FF6B] p-3 rounded-sm text-xs font-semibold">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>You have secure read-only partner access. You can view all business performance data but cannot modify products, orders, or settings.</span>
        </div>

        {/* ============ OVERVIEW TAB ============ */}
        {activeTab === "overview" && (
          <div className="space-y-8 animate-fade-in">

            {/* Revenue cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-zinc-900 to-black text-white border border-zinc-800 rounded-sm p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Total Revenue</span>
                  <Wallet className="w-5 h-5 text-[#E8FF6B]" />
                </div>
                <div className="text-2xl sm:text-3xl font-black tracking-tight text-[#E8FF6B]">₦{revenueAllTime.toLocaleString()}</div>
                <p className="text-[10px] text-zinc-500 mt-2 uppercase">Confirmed & delivered orders</p>
              </div>

              <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Revenue Today</span>
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                </div>
                <div className="text-2xl font-black tracking-tight text-black dark:text-white">₦{revenueToday.toLocaleString()}</div>
                <p className="text-[10px] text-zinc-400 mt-2 uppercase">Since midnight</p>
              </div>

              <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">This Week</span>
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                </div>
                <div className="text-2xl font-black tracking-tight text-black dark:text-white">₦{revenueWeek.toLocaleString()}</div>
                <p className="text-[10px] text-zinc-400 mt-2 uppercase">Last 7 days</p>
              </div>

              <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">This Month</span>
                  <TrendingUp className="w-5 h-5 text-purple-500" />
                </div>
                <div className="text-2xl font-black tracking-tight text-black dark:text-white">₦{revenueMonth.toLocaleString()}</div>
                <p className="text-[10px] text-zinc-400 mt-2 uppercase">Current month</p>
              </div>
            </div>

            {/* Secondary metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-sm p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Total Orders</span>
                  <ClipboardList className="w-4 h-4 text-zinc-400" />
                </div>
                <div className="text-2xl font-black text-black dark:text-white">{totalOrders}</div>
                <p className="text-[10px] text-zinc-400 mt-1 uppercase">{pendingCount} pending</p>
              </div>

              <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-sm p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Avg Order Value</span>
                  <Wallet className="w-4 h-4 text-zinc-400" />
                </div>
                <div className="text-2xl font-black text-black dark:text-white">₦{avgOrderValue.toLocaleString()}</div>
                <p className="text-[10px] text-zinc-400 mt-1 uppercase">Per paid order</p>
              </div>

              <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-sm p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Customers</span>
                  <Users className="w-4 h-4 text-zinc-400" />
                </div>
                <div className="text-2xl font-black text-black dark:text-white">{customers.length}</div>
                <p className="text-[10px] text-zinc-400 mt-1 uppercase">Registered buyers</p>
              </div>

              <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-sm p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Inventory Value</span>
                  <ShoppingBag className="w-4 h-4 text-zinc-400" />
                </div>
                <div className="text-2xl font-black text-black dark:text-white">₦{inventoryValue.toLocaleString()}</div>
                <p className="text-[10px] text-zinc-400 mt-1 uppercase">{activeProducts} active drops</p>
              </div>
            </div>

            {/* Order fulfillment + top products */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Fulfillment status */}
              <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-sm p-6">
                <h3 className="text-sm font-black uppercase tracking-wider text-black dark:text-white mb-5">Order Fulfillment</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-yellow-500 text-xs font-bold uppercase"><Clock className="w-4 h-4" /> Pending</div>
                    <span className="text-lg font-black text-black dark:text-white">{pendingCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-blue-500 text-xs font-bold uppercase"><CheckCircle className="w-4 h-4" /> Confirmed</div>
                    <span className="text-lg font-black text-black dark:text-white">{confirmedCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-500 text-xs font-bold uppercase"><Truck className="w-4 h-4" /> Delivered</div>
                    <span className="text-lg font-black text-black dark:text-white">{deliveredCount}</span>
                  </div>
                </div>
              </div>

              {/* Top products */}
              <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-sm p-6 lg:col-span-2">
                <h3 className="text-sm font-black uppercase tracking-wider text-black dark:text-white mb-5">Top Selling Products (by revenue)</h3>
                {topProducts.length === 0 ? (
                  <p className="text-xs text-zinc-400 py-6 text-center">No sales data yet.</p>
                ) : (
                  <div className="space-y-3">
                    {topProducts.map((p, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/40 dark:border-zinc-800 rounded-sm">
                        <span className="w-6 h-6 flex items-center justify-center bg-[#E8FF6B] text-black text-[10px] font-black rounded-full shrink-0">{idx + 1}</span>
                        <img src={p.image} alt="" className="w-9 h-9 object-cover rounded-sm" />
                        <div className="flex-1 min-w-0">
                          <span className="block text-xs font-bold uppercase text-black dark:text-white truncate">{p.name}</span>
                          <span className="text-[10px] text-zinc-400 uppercase">{p.qty} units sold</span>
                        </div>
                        <span className="text-xs font-black text-emerald-500">₦{p.revenue.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============ VISUAL ANALYTICS ============ */}
        {activeTab === "overview" && orders.length > 0 && (
          <div className="space-y-6 pt-4">
            <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-900 pb-3">
              <BarChart3 className="w-5 h-5 text-[#E8FF6B]" />
              <h2 className="text-sm font-black uppercase tracking-wider text-black dark:text-white">
                Business Intelligence Charts
              </h2>
              <span className="text-[10px] text-zinc-400">Real-time from Firestore</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Line Chart */}
              <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-black dark:text-white">
                      Revenue Trend
                    </h3>
                    <p className="text-[10px] text-zinc-400 uppercase">Last 30 days (Paid Orders)</p>
                  </div>
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={getRevenueChartData(orders)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                    <XAxis dataKey="date" stroke="#71717a" fontSize={10} />
                    <YAxis stroke="#71717a" fontSize={10} tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: "4px", fontSize: "12px" }}
                      formatter={(value: any) => [`₦${Number(value).toLocaleString()}`, "Revenue"]}
                    />
                    <Line type="monotone" dataKey="revenue" stroke="#E8FF6B" strokeWidth={2} dot={false} activeDot={{ r: 5, fill: "#E8FF6B" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Top Products Bar Chart */}
              <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-black dark:text-white">
                      Top Selling Products
                    </h3>
                    <p className="text-[10px] text-zinc-400 uppercase">By units sold (all-time)</p>
                  </div>
                  <ShoppingBag className="w-5 h-5 text-blue-500" />
                </div>
                {getTopProductsChartData(orders).length === 0 ? (
                  <div className="flex items-center justify-center h-[260px] text-xs text-zinc-500">No sales data yet.</div>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={getTopProductsChartData(orders)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                      <XAxis type="number" stroke="#71717a" fontSize={10} />
                      <YAxis type="category" dataKey="name" stroke="#71717a" fontSize={10} width={120} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: "4px", fontSize: "12px" }}
                        formatter={(value: any) => [`${Number(value)} units`, "Sold"]}
                      />
                      <Bar dataKey="quantity" fill="#E8FF6B" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Order Status Pie Chart */}
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-black dark:text-white">
                    Order Status Breakdown
                  </h3>
                  <p className="text-[10px] text-zinc-400 uppercase">Current pipeline</p>
                </div>
                <ClipboardList className="w-5 h-5 text-purple-500" />
              </div>
              {getOrderStatusChartData(orders).length === 0 ? (
                <div className="flex items-center justify-center h-[260px] text-xs text-zinc-500">No orders recorded yet.</div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={getOrderStatusChartData(orders)} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value" label={(entry: any) => `${entry.name}: ${entry.value}`}>
                      {getOrderStatusChartData(orders).map((entry, idx) => (
                        <Cell key={idx} fill={(STATUS_COLORS as Record<string, string>)[entry.name] || PIE_COLORS[idx % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend wrapperStyle={{ fontSize: "12px" }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: "4px", fontSize: "12px" }}
                      formatter={(value: any, name: any) => [`${Number(value)} orders`, String(name)]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}

        {/* ============ ORDERS TAB (read-only) ============ */}
        {activeTab === "orders" && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <Eye className="w-4 h-4" />
              <span>Viewing {sortedOrders.length} orders in read-only mode.</span>
            </div>

            {sortedOrders.length === 0 ? (
              <div className="bg-white dark:bg-zinc-950 p-12 text-center text-zinc-500 font-medium border border-zinc-200 dark:border-zinc-900 rounded">
                No orders recorded yet.
              </div>
            ) : (
              sortedOrders.map((order) => (
                <div key={order.id} className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 p-5 rounded-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-900">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-[#E8FF6B] bg-black px-2.5 py-1 rounded">#{order.id}</span>
                      <span className="text-xs text-zinc-400">{new Date(order.createdAt).toLocaleString()}</span>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-extrabold uppercase rounded-full ${
                      order.status === "Pending" ? "bg-yellow-500/10 text-yellow-500"
                      : order.status === "Confirmed" ? "bg-blue-500/10 text-blue-500"
                      : "bg-emerald-500/10 text-emerald-500"
                    }`}>
                      {order.status === "Pending" ? <Clock className="w-3.5 h-3.5" /> : order.status === "Confirmed" ? <CheckCircle className="w-3.5 h-3.5" /> : <Truck className="w-3.5 h-3.5" />}
                      {order.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 text-sm">
                    <div className="space-y-1">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Customer</h4>
                      <p className="font-bold text-black dark:text-white uppercase text-xs">{order.customerName}</p>
                      <p className="text-[11px] text-zinc-500">{order.phone}</p>
                      <p className="text-[11px] text-zinc-500">{order.address}</p>
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Items</h4>
                      {order.items.map((item, idx) => (
                        <p key={idx} className="text-[11px] text-zinc-600 dark:text-zinc-300">
                          {item.name} ({item.size}) × {item.qty}
                        </p>
                      ))}
                      <p className="text-sm font-black text-emerald-500 pt-1">₦{order.totalAmount.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ============ ACCOUNT SECURITY TAB ============ */}
        {activeTab === "security" && (
          <div className="space-y-6 animate-fade-in max-w-2xl">
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <KeyRound className="w-5 h-5 text-[#E8FF6B]" />
                <h3 className="text-sm font-black uppercase tracking-wider text-black dark:text-white">Change Password</h3>
              </div>
              <p className="text-xs text-zinc-500 mb-6">Update your login password. Your account email cannot be changed from here.</p>

              <div className="space-y-4">
                {/* Current password */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-500 mb-1.5">Current Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? "text" : "password"}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      placeholder="Enter your current password"
                      className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 pr-10 text-sm focus:outline-none focus:border-[#E8FF6B]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                      className="absolute right-3 top-3 text-zinc-400 hover:text-white cursor-pointer"
                      title={showPasswords.current ? "Hide" : "Show"}
                    >
                      {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* New password */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-500 mb-1.5">New Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? "text" : "password"}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      placeholder="Minimum 8 characters"
                      className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 pr-10 text-sm focus:outline-none focus:border-[#E8FF6B]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                      className="absolute right-3 top-3 text-zinc-400 hover:text-white cursor-pointer"
                      title={showPasswords.new ? "Hide" : "Show"}
                    >
                      {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm password */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-500 mb-1.5">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? "text" : "password"}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      placeholder="Re-enter your new password"
                      className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 pr-10 text-sm focus:outline-none focus:border-[#E8FF6B]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                      className="absolute right-3 top-3 text-zinc-400 hover:text-white cursor-pointer"
                      title={showPasswords.confirm ? "Hide" : "Show"}
                    >
                      {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-start gap-2 text-[10px] text-zinc-400 pt-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>Password must be at least 8 characters. You'll need to use the new password the next time you log in on any device.</span>
                </div>

                <button
                  type="button"
                  onClick={handlePasswordChange}
                  className="w-full px-5 py-3 bg-[#E8FF6B] text-black font-extrabold uppercase tracking-widest text-xs rounded-sm hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Update Password
                </button>
              </div>
            </div>

            <div className="bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-sm p-5">
              <h4 className="text-xs font-black uppercase tracking-wider text-black dark:text-white mb-3 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#E8FF6B]" />
                Security Tips
              </h4>
              <ul className="space-y-2 text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
                <li>• Never share your password with anyone, including Plain Culture staff.</li>
                <li>• Use a unique password that isn't used on other websites.</li>
                <li>• Your password change is immediately synced across all devices.</li>
                <li>• Password changes are logged and visible to the Super Admin for security.</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
