import React, { useState } from "react";
import { dbService, Order } from "../lib/firebase";
import { Search, Package, Clock, CheckCircle, Truck, ArrowLeft, AlertCircle } from "lucide-react";

interface OrderTrackingPageProps {
  onNavigateToHome: () => void;
}

export const OrderTrackingPage: React.FC<OrderTrackingPageProps> = ({ onNavigateToHome }) => {
  const [orderId, setOrderId] = useState("");
  const [phone, setPhone] = useState("");
  const [foundOrder, setFoundOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const handleTrackOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFoundOrder(null);
    setIsSearching(true);

    if (!orderId.trim() || !phone.trim()) {
      setError("Please enter both Order ID and Phone Number.");
      setIsSearching(false);
      return;
    }

    try {
      // Fetch all orders (we can optimize this later with a direct query if needed)
      const allOrders: Order[] = await dbService.getOrders();
      
      const normalizedPhone = phone.trim();
      const normalizedId = orderId.trim().toUpperCase();

      const match = allOrders.find(
        (order) =>
          order.id.toUpperCase() === normalizedId &&
          order.phone.replace(/\s/g, "") === normalizedPhone.replace(/\s/g, "")
      );

      if (match) {
        setFoundOrder(match);
      } else {
        setError("Order not found. Please check your Order ID and Phone Number.");
      }
    } catch (err) {
      setError("An error occurred while tracking. Please try again.");
    }
    setIsSearching(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Pending":
        return <Clock className="w-6 h-6 text-yellow-500" />;
      case "Confirmed":
        return <CheckCircle className="w-6 h-6 text-blue-500" />;
      case "Delivered":
        return <Truck className="w-6 h-6 text-emerald-500" />;
      default:
        return <Package className="w-6 h-6 text-zinc-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "Confirmed":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "Delivered":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      default:
        return "bg-zinc-800 text-zinc-400 border-zinc-700";
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg">
        
        {/* Header */}
        <div className="text-center mb-10">
          <button 
            onClick={onNavigateToHome}
            className="flex items-center gap-2 text-zinc-400 hover:text-white mb-4 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Shop</span>
          </button>
          <h1 className="text-3xl font-black uppercase tracking-wider">Track Your Order</h1>
          <p className="text-zinc-400 mt-2">Enter your details below to check the status of your drop.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleTrackOrder} className="bg-zinc-950 border border-zinc-800 p-6 rounded-sm">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-zinc-500 mb-1.5">Order ID</label>
              <input
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="PC-1234"
                className="w-full bg-zinc-900 border border-zinc-800 p-3 text-sm focus:outline-none focus:border-[#E8FF6B] text-white uppercase font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-zinc-500 mb-1.5">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+234 808 817 1549"
                className="w-full bg-zinc-900 border border-zinc-800 p-3 text-sm focus:outline-none focus:border-[#E8FF6B] text-white font-mono"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isSearching}
            className="w-full mt-6 py-3 bg-[#E8FF6B] text-black font-extrabold uppercase tracking-widest text-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span>{isSearching ? "SEARCHING..." : "TRACK ORDER"}</span>
          </button>
        </form>

        {/* Results */}
        {error && (
          <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-sm flex items-center gap-3 text-red-400">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {foundOrder && (
          <div className="mt-6 bg-zinc-950 border border-zinc-800 p-6 rounded-sm">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 mb-4">Order Status</h3>
            
            <div className="flex items-center gap-4 mb-6">
              <div className={`p-3 rounded-sm border ${getStatusColor(foundOrder.status)}`}>
                {getStatusIcon(foundOrder.status)}
              </div>
              <div>
                <span className="block text-sm font-black uppercase tracking-wider text-white">ORDER #{foundOrder.id}</span>
                <span className="block text-lg font-black text-[#E8FF6B]">{foundOrder.status}</span>
              </div>
            </div>

            <div className="border-t border-zinc-800 pt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-400">Customer</span>
                <span className="font-bold text-white">{foundOrder.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Total Amount</span>
                <span className="font-bold text-white">₦{foundOrder.totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-zinc-800">
                <span className="text-zinc-400">Delivery Estimate</span>
                <span className="font-bold text-[#E8FF6B]">3-5 Business Days</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};