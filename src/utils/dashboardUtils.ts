import { Order, Customer } from "../lib/firebase";

// ==========================================
// GEO-DISTANCE CALCULATOR (Haversine Formula)
// ==========================================
export const getDistanceFromLatLonInKm = (lat1: number, lon1: number, lat2: number, lon2: number): string => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d.toFixed(1);
};

const deg2rad = (deg: number) => {
  return deg * (Math.PI / 180);
};

// ==========================================
// CSV EXPORT HELPERS
// ==========================================

/**
 * Convert array of objects to CSV string with UTF-8 BOM for Excel compatibility
 */
export const convertToCSV = (data: Record<string, any>[], columns: { key: string; label: string }[]): string => {
  // UTF-8 BOM for proper Excel rendering of special characters (₦, etc.)
  const BOM = "\uFEFF";

  // Header row
  const headerRow = columns.map((col) => `"${col.label}"`).join(",");

  // Data rows
  const rows = data.map((row) => {
    return columns
      .map((col) => {
        const value = row[col.key];
        const cell = value === null || value === undefined ? "" : String(value);
        // Escape double quotes and wrap in quotes
        return `"${cell.replace(/"/g, '""')}"`;
      })
      .join(",");
  });

  return BOM + [headerRow, ...rows].join("\n");
};

/**
 * Trigger browser download of a CSV file
 */
export const downloadCSV = (csvContent: string, filename: string): void => {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Format orders for CSV export
 */
export const formatOrdersForCSV = (orders: Order[]): Record<string, any>[] => {
  return orders.map((order) => ({
    orderId: order.id,
    status: order.status,
    customerName: order.customerName,
    phone: order.phone,
    address: order.address,
    items: order.items.map((item) => `${item.name} (${item.size}) x ${item.qty}`).join(" | "),
    totalAmount: order.totalAmount,
    createdAt: new Date(order.createdAt).toLocaleString()
  }));
};

/**
 * Format customers for CSV export
 */
export const formatCustomersForCSV = (customers: Customer[]): Record<string, any>[] => {
  return customers.map((customer) => ({
    name: customer.name,
    phone: customer.phone,
    email: customer.email || "N/A",
    location: customer.location,
    totalOrders: customer.totalOrders,
    createdAt: new Date(customer.createdAt).toLocaleString(),
    updatedAt: new Date(customer.updatedAt).toLocaleString()
  }));
};

// ==========================================
// CHART DATA TRANSFORMERS
// ==========================================

/**
 * Generate line chart data for revenue over last 30 days
 */
export const getRevenueChartData = (orders: Order[]) => {
  const today = new Date();
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Initialize with zeroed days
  const dateMap: Record<string, number> = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().split("T")[0];
    dateMap[key] = 0;
  }

  // Sum revenue per day (paid orders only)
  orders
    .filter((o) => o.status !== "Pending" && new Date(o.createdAt) >= thirtyDaysAgo)
    .forEach((order) => {
      const key = new Date(order.createdAt).toISOString().split("T")[0];
      if (key in dateMap) {
        dateMap[key] += order.totalAmount;
      }
    });

  return Object.entries(dateMap).map(([date, revenue]) => ({
    date: new Date(date).toLocaleDateString("en-NG", { day: "numeric", month: "short" }),
    revenue
  }));
};

/**
 * Generate bar chart data for top selling products
 */
export const getTopProductsChartData = (orders: Order[], limit: number = 7) => {
  const productMap: Record<string, number> = {};

  orders.forEach((order) => {
    order.items.forEach((item) => {
      if (!productMap[item.name]) {
        productMap[item.name] = 0;
      }
      productMap[item.name] += item.qty;
    });
  });

  return Object.entries(productMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([name, qty]) => ({
      name: name.length > 20 ? name.slice(0, 18) + "…" : name,
      quantity: qty
    }));
};

/**
 * Generate pie chart data for order status breakdown
 */
export const getOrderStatusChartData = (orders: Order[]) => {
  const counts: Record<string, number> = {
    Pending: 0,
    Confirmed: 0,
    Delivered: 0
  };

  orders.forEach((order) => {
    if (order.status in counts) {
      counts[order.status]++;
    }
  });

  return [
    { name: "Pending", value: counts.Pending },
    { name: "Confirmed", value: counts.Confirmed },
    { name: "Delivered", value: counts.Delivered }
  ].filter((item) => item.value > 0);
};

/**
 * Generate revenue summary data for KPI cards
 */
export const getRevenueSummary = (orders: Order[]) => {
  const now = new Date();
  const paidOrders = orders.filter((o) => o.status !== "Pending");

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfWeek = startOfToday - 6 * 24 * 60 * 60 * 1000;
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  return {
    allTime: paidOrders.reduce((sum, o) => sum + o.totalAmount, 0),
    today: paidOrders
      .filter((o) => new Date(o.createdAt).getTime() >= startOfToday)
      .reduce((sum, o) => sum + o.totalAmount, 0),
    week: paidOrders
      .filter((o) => new Date(o.createdAt).getTime() >= startOfWeek)
      .reduce((sum, o) => sum + o.totalAmount, 0),
    month: paidOrders
      .filter((o) => new Date(o.createdAt).getTime() >= startOfMonth)
      .reduce((sum, o) => sum + o.totalAmount, 0)
  };
};

/**
 * Pie chart color palette (Brand-aligned)
 */
export const PIE_COLORS = ["#FACC15", "#3B82F6", "#10B981", "#F43F5E", "#8B5CF6"];
export const STATUS_COLORS = {
  Pending: "#FACC15",
  Confirmed: "#3B82F6",
  Delivered: "#10B981"
};
