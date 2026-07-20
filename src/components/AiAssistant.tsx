import React, { useState, useRef, useEffect } from "react";
import { useSettings } from "../context/AppContext";
import { dbService, Product } from "../lib/firebase";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";

interface Message {
  id: string;
  role: "assistant" | "user";
  text: string;
}

// Simple English AI knowledge base — friendly, clear, and helpful
const generateResponse = (input: string, products: Product[], settings: any): string => {
  const q = input.toLowerCase().trim();
  const brandName = settings.brandName || "Plain Culture";
  const phone = settings.phone || "+2348088171549";
  const address = settings.physicalAddress || "Ibadan, Oyo-State, Nigeria";
  const activeProducts = products.filter(p => p.isActive);

  // Wishlist
  if (/wishlist|save.*later|heart|save.*item/.test(q)) {
    return `You can use the **Heart icon** on any product to save it to your wishlist! ❤️\n\nYou'll find your saved items in your **My Wishlist** page (accessible via the Heart icon in the navbar).\n\nIf you sign up for an account, your wishlist will be saved permanently across all your devices! 😊`;
  }

  // Greetings
  if (/^(hi|hello|hey|good morning|good afternoon|good evening|how far|what's up|wassup|sup|omo|abeg|e kaaro|e kaasan)/.test(q)) {
    return `Hello! 👋 Welcome to ${brandName}! Great to have you here.\n\nI can help you with:\n• Our available products\n• Wishlist and saving for later\n• Sizes and stock\n• Pricing and delivery\n• How to place an order\n\nWhat would you like to know? 😊`;
  }

  // Products / What do you sell
  if (/product|sell|available|what do you have|wetin you get|collection|drop|catalogue|catalog/.test(q)) {
    if (activeProducts.length === 0) {
      return `Our current drop has completely sold out! 😅 But a new drop is coming soon.\n\nReach us on WhatsApp for updates: ${phone}`;
    }
    let response = `Here are our currently available pieces: 🔥\n\n`;
    activeProducts.forEach((p) => {
      const totalStock = Object.values(p.sizeStock || {}).reduce((sum: number, v: any) => sum + Number(v), 0);
      response += `🏷️ ${p.name}\n   Price: ₦${p.price.toLocaleString()}\n   ${totalStock > 0 ? `Stock: ${totalStock} pieces left` : "❌ Sold Out"}\n\n`;
    });
    response += `Would you like details on any of these? Just tell me the name or ask about sizes!`;
    return response;
  }

  // Specific product inquiry
  const matchedProduct = activeProducts.find(p => 
    q.includes(p.name.toLowerCase()) || 
    p.name.toLowerCase().split(" ").some(word => word.length > 3 && q.includes(word))
  );

  if (matchedProduct) {
    const sizeStock = matchedProduct.sizeStock || {};
    const sizeInfo = Object.entries(sizeStock)
      .map(([size, qty]) => `${size}: ${qty > 0 ? `${qty} left` : "Sold Out ❌"}`)
      .join("\n   ");
    
    return `Great choice! 🔥 Here are the details for ${matchedProduct.name}:\n\n💰 Price: ₦${matchedProduct.price.toLocaleString()}\n📏 Sizes available:\n   ${sizeInfo}\n\n${matchedProduct.description}\n\nTo add it to your cart, click "SELECT SIZE" on the product page! 😊`;
  }

  // Size inquiry
  if (/size|sizing|fit|measurement|how.*fit/.test(q)) {
    return `Our tees have a boxy oversized fit — very comfortable and stylish! 👕\n\nSize guide:\n• S — Fits chest 36-38"\n• M — Fits chest 38-40"\n• L — Fits chest 40-42"\n• XL — Fits chest 42-44"\n\n💡 Tip: For a fitted look, go with your normal size. For the oversized drape, size up one.\n\nWant to know which sizes are available for a specific product? Just ask!`;
  }

  // Price inquiry
  if (/price|cost|how much|naira|₦|money|expensive|cheap/.test(q)) {
    if (activeProducts.length === 0) {
      return `Our pieces are usually priced between ₦10,000 - ₦15,000. The current drop has sold out, but a new one is coming soon! 🙏`;
    }
    let response = `Here's our current pricing: 💰\n\n`;
    activeProducts.forEach((p) => {
      response += `• ${p.name} — ₦${p.price.toLocaleString()}\n`;
    });
    response += `\nAll prices reflect our premium 280GSM heavyweight cotton quality.\n\nDelivery fees depend on your location within Ibadan. You can see the exact fee during checkout.`;
    return response;
  }

  // Delivery / Shipping
  if (/deliver|shipping|ship|location|where|address|how.*get|dispatch|courier/.test(q)) {
    return `Yes, we deliver! 🚀\n\n📍 Our store is located at: ${address}\n\n🏍️ Ibadan Delivery:\nWe deliver to all major landmarks within Ibadan. Delivery fees range from ₦1,000 to ₦2,500 depending on your area.\n\n🌍 Outside Ibadan:\nWe can ship to any state! Select "Other State" during checkout and we'll discuss the rate on WhatsApp.\n\n⏰ Timeline:\nSame-day delivery within Ibadan for orders placed before 2pm!`;
  }

  // Order / How to buy
  if (/order|buy|purchase|cart|checkout|how.*order|how.*buy|i want to buy/.test(q)) {
    return `Ordering is quick and easy! Here's how: 🛒\n\n1️⃣ Browse products on the homepage\n2️⃣ Click any product and select your size\n3️⃣ Click "ADD TO DROP CART"\n4️⃣ Open your cart and fill in your delivery details\n5️⃣ Select your delivery landmark\n6️⃣ Make a bank transfer\n7️⃣ Confirm on WhatsApp — done!\n\nThe whole process takes about 2 minutes.\n\nYou can also reach us directly on WhatsApp: ${phone}`;
  }

  // Payment
  if (/pay|payment|transfer|bank|account|how.*pay/.test(q)) {
    return `We currently accept bank transfer. Here's how it works:\n\n1️⃣ Add items to your cart and proceed to checkout\n2️⃣ Our bank details will be shown on the payment screen\n3️⃣ Make the transfer from your banking app\n4️⃣ Click "Confirm via WhatsApp" to send proof of payment\n5️⃣ We confirm and dispatch your order! ✅\n\nSimple and secure.`;
  }

  // WhatsApp / Contact
  if (/whatsapp|contact|reach|call|phone|talk|chat|speak/.test(q)) {
    return `You can reach us anytime! 📱\n\n📞 WhatsApp: ${phone}\n📧 Email: ${settings.email || "plainculture.ng@gmail.com"}\n📍 Location: ${address}\n\nOur WhatsApp is active and we respond quickly! ⚡`;
  }

  // Return / Refund
  if (/return|refund|exchange|change|wrong.*size|no.*fit/.test(q)) {
    return `Here's our return policy: 📋\n\n• Returns must be initiated within 7 days of delivery\n• Items must be unworn with tags still attached\n• We offer free size exchanges within 14 days\n• Final sale items are not refundable\n\nFor any issues, message us on WhatsApp: ${phone}\nWe'll get it sorted for you! 🤝`;
  }

  // Quality / Material
  if (/quality|material|fabric|cotton|gsm|heavyweight|weight/.test(q)) {
    return `Our quality is top-tier! 💎\n\n🧵 280GSM Pure Combed Organic Cotton\n   — Nearly 2x heavier than standard tees\n\n✂️ Boxy Oversized Cut\n   — Structured drape that holds its shape\n\n🌡️ Pre-shrunk\n   — Won't shrink after washing\n\n🇳🇬 Designed for warm weather\n   — Breathable despite the heavy weight\n\nOnce you try one, you'll feel the difference immediately! 🔥`;
  }

  // Track order
  if (/track|where.*order|order.*status|my.*order/.test(q)) {
    return `You can easily track your order! 📦\n\nScroll down to the footer and click "Track My Order". Enter your Order ID (like PC-1234) and your phone number.\n\nYour order status will show as:\n• ⏳ Pending — Payment not yet confirmed\n• ✅ Confirmed — Payment received, being packaged\n• 🚀 Delivered — Successfully delivered\n\nFor any issues, message us on WhatsApp: ${phone}`;
  }

  // Thank you
  if (/thank|thanks|thank you|appreciate/.test(q)) {
    return `You're welcome! 🙏 Thank you for choosing ${brandName}.\n\nIf you need anything else, feel free to ask. We're always happy to help! 💪`;
  }

  // Fallback
  return `Thanks for your message! 😊 I wasn't quite sure what you meant.\n\nI can help you with:\n• 🏷️ Products and prices\n• 📏 Sizes and fit guide\n• 🚀 Delivery and shipping\n• 🛒 How to place an order\n• 💰 Payment methods\n• 📦 Order tracking\n• 📱 Contact information\n\nOr reach our team directly on WhatsApp: ${phone}`;
};

export const AiAssistant: React.FC = () => {
  const settings = useSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = dbService.subscribeProducts((p) => setProducts(p));
    return () => unsub();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: "welcome",
        role: "assistant",
        text: `Hello! 👋 Welcome to ${settings.brandName || "Plain Culture"}!\n\nI'm your shopping assistant. I can help you find products, check sizes, see prices, and place your order.\n\nWhat are you looking for today? 😊`
      }]);
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      text: trimmed
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Simulate typing delay for natural feel
    setTimeout(() => {
      const response = generateResponse(trimmed, products, settings);
      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        role: "assistant",
        text: response
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 600 + Math.random() * 800);
  };

  return (
    <>
      {/* Floating chat button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#E8FF6B] text-black rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform cursor-pointer"
          title="Chat with us"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 z-50 w-[360px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-2rem)] bg-black border border-zinc-800 rounded-lg shadow-2xl flex flex-col overflow-hidden animate-slide-in">
          
          {/* Header */}
          <div className="bg-zinc-950 border-b border-zinc-800 px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-[#E8FF6B] rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-black" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">{settings.brandName || "Plain Culture"}</h3>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[10px] text-emerald-500 font-bold">Online now</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-zinc-500 hover:text-white cursor-pointer p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`flex items-end gap-2 max-w-[85%] ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                    msg.role === "user" ? "bg-zinc-800" : "bg-[#E8FF6B]"
                  }`}>
                    {msg.role === "user" ? <User className="w-3 h-3 text-zinc-400" /> : <Bot className="w-3 h-3 text-black" />}
                  </div>
                  <div className={`px-3.5 py-2.5 rounded-lg text-[13px] leading-relaxed whitespace-pre-line ${
                    msg.role === "user"
                      ? "bg-[#E8FF6B] text-black rounded-br-sm"
                      : "bg-zinc-900 text-zinc-200 border border-zinc-800 rounded-bl-sm"
                  }`}>
                    {msg.text}
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-end gap-2">
                <div className="w-6 h-6 rounded-full bg-[#E8FF6B] flex items-center justify-center shrink-0">
                  <Bot className="w-3 h-3 text-black" />
                </div>
                <div className="bg-zinc-900 border border-zinc-800 px-4 py-3 rounded-lg rounded-bl-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-zinc-800 p-3 shrink-0">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Ask me anything..."
                className="flex-1 bg-zinc-900 border border-zinc-800 px-3 py-2.5 text-sm text-white rounded-sm focus:outline-none focus:border-[#E8FF6B] placeholder:text-zinc-600"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="p-2.5 bg-[#E8FF6B] text-black rounded-sm hover:opacity-90 disabled:opacity-30 cursor-pointer transition-opacity"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[9px] text-zinc-600 text-center mt-2">
              AI Shopping Assistant • {settings.brandName || "Plain Culture"}
            </p>
          </div>
        </div>
      )}
    </>
  );
};
