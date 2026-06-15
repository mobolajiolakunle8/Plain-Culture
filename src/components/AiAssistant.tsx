import React, { useState, useRef, useEffect } from "react";
import { useSettings } from "../context/AppContext";
import { dbService, Product } from "../lib/firebase";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";

interface Message {
  id: string;
  role: "assistant" | "user";
  text: string;
}

const generateResponse = (input: string, products: Product[], settings: any): string => {
  const q = input.toLowerCase().trim();
  const brandName = settings.brandName || "Plain Culture";
  const phone = settings.phone || "+2348088171549";
  const address = settings.physicalAddress || "Ibadan, Oyo-State, Nigeria";
  const activeProducts = products.filter(p => p.isActive);
  const totalStock = activeProducts.reduce((sum, p) => sum + Object.values(p.sizeStock || {}).reduce((s: number, v: any) => s + Number(v), 0), 0);

  // GREETINGS
  if (/^(hi|hello|hey|good morning|good afternoon|good evening|how far|what's up|wassup|sup)/.test(q)) {
    return `Hello! 👋 Welcome to ${brandName}!\n\nI'm your shopping assistant. I can help you with:\n\n🛍️ Browse products and collections\n📏 Size guide and fit recommendations\n💰 Pricing and available discounts\n🚚 Delivery options and timelines\n🛒 How to place an order\n💳 Payment methods\n📦 Track your order\n🔄 Returns and exchanges\n📞 Contact information\n\nWhat would you like to know today? 😊`;
  }

  // PRODUCTS
  if (/product|sell|available|what do you have|collection|drop|catalogue|catalog|item|tee|shirt|bag/.test(q)) {
    if (activeProducts.length === 0) {
      return `Our current drop has completely sold out! 😅\n\nBut don't worry - a new drop is coming soon! Follow us on social media or reach us on WhatsApp (${phone}) to get notified when new stock arrives.`;
    }
    let response = `Here's what we currently have available: 🔥\n\n`;
    activeProducts.forEach((p, idx) => {
      const pieceStock = Object.values(p.sizeStock || {}).reduce((s: number, v: any) => s + Number(v), 0);
      response += `${idx + 1}. ${p.name}\n   Price: ₦${p.price.toLocaleString()}\n   ${pieceStock > 0 ? `${pieceStock} pieces in stock` : "Sold Out"}\n\n`;
    });
    response += `Want more details on any item? Just ask me about it by name!`;
    return response;
  }

  // SPECIFIC PRODUCT
  const matchedProduct = activeProducts.find(p => 
    q.includes(p.name.toLowerCase()) || 
    p.name.toLowerCase().split(" ").some(word => word.length > 3 && q.includes(word))
  );

  if (matchedProduct) {
    const sizeStock = matchedProduct.sizeStock || {};
    const sizeInfo = Object.entries(sizeStock)
      .map(([size, qty]) => `${size}: ${qty > 0 ? `${qty} available` : "Sold Out"}`)
      .join("\n");
    const totalPieceStock = Object.values(sizeStock).reduce((s: number, v: any) => s + Number(v), 0);
    
    return `Great choice! Here are the full details for ${matchedProduct.name}:\n\nPrice: ₦${matchedProduct.price.toLocaleString()}\n\nAvailable Sizes:\n${sizeInfo}\n\nTotal Stock: ${totalPieceStock} pieces\n\nDescription:\n${matchedProduct.description}\n\nTo add it to your cart, click SELECT SIZE on the product page! 😊`;
  }

  // SIZE GUIDE
  if (/size|sizing|fit|measurement|how.*fit|which.*size|what.*size|size.*guide|chart|small|medium|large|xl|chest|bust/.test(q)) {
    return `SIZE GUIDE\n\nOur tees feature a boxy oversized fit - comfortable, stylish, and perfect for the streetwear look!\n\nChest Measurements:\n• S: 36-38 inches\n• M: 38-40 inches\n• L: 40-42 inches\n• XL: 42-44 inches\n\nLength (all sizes): Approximately 28-30 inches\n\nFit Tips:\n• For a fitted look: Go with your normal size\n• For oversized drape: Size up one\n• Prefer very oversized: Size up two\n\nExample: If you usually wear M and want oversized, choose L or XL.\n\nWant to check stock for a specific size? Tell me which product you're interested in! 😊`;
  }

  // PRICING
  if (/price|cost|how much|naira|money|expensive|cheap|affordable|discount|sale|promo/.test(q)) {
    if (activeProducts.length === 0) {
      return `Our pieces are typically priced between ₦10,000 - ₦15,000 depending on the item.\n\nThe current drop has sold out, but new stock is coming soon! Reach us on WhatsApp (${phone}) to get notified.\n\nNote: Our premium 280GSM heavyweight cotton quality means you're getting nearly 2x the quality of standard market tees!`;
    }
    let response = `CURRENT PRICING\n\n`;
    activeProducts.forEach((p) => {
      response += `• ${p.name} - ₦${p.price.toLocaleString()}\n`;
    });
    response += `\nWhat's included:\n✅ Premium 280GSM heavyweight cotton\n✅ Pre-shrunk (won't shrink after wash)\n✅ Boxy oversized cut\n✅ Made for Nigerian weather\n\nDelivery fees: ₦1,000 - ₦2,500 within Ibadan (based on your landmark)`;
    return response;
  }

  // DELIVERY
  if (/deliver|shipping|ship|location|where|address|how.*get|dispatch|courier|send|receive|when.*arrive|how long|timeline|duration/.test(q)) {
    return `DELIVERY INFORMATION\n\nOur Location:\n${address}\n\nWithin Ibadan:\n• Delivery to all major landmarks\n• Fee: ₦1,000 - ₦2,500 (based on your area)\n• Timeline: Same-day delivery for orders before 2pm!\n• Next-day for orders after 2pm\n\nOutside Ibadan (All Nigeria):\n• We ship to any state\n• Select "Other State" during checkout\n• We'll discuss shipping rate on WhatsApp\n• Timeline: 2-5 business days depending on location\n\nPro tip: During checkout, select your nearest landmark for accurate delivery fee calculation!\n\nQuestions about your specific area? Message us on WhatsApp: ${phone}`;
  }

  // HOW TO ORDER
  if (/order|buy|purchase|cart|checkout|how.*order|how.*buy|i want to buy|step|process|procedure/.test(q)) {
    return `HOW TO PLACE AN ORDER\n\nIt's quick and easy! Follow these steps:\n\nStep 1: Browse products on the homepage\nStep 2: Click any product you like\nStep 3: Select your size (check stock availability)\nStep 4: Click "ADD TO DROP CART"\nStep 5: Click the cart icon to review\nStep 6: Fill in your delivery details\nStep 7: Select your delivery landmark\nStep 8: Note the bank details shown\nStep 9: Make the bank transfer\nStep 10: Click "Confirm via WhatsApp" to send proof\nStep 11: Wait for confirmation and dispatch!\n\nTotal time: About 2 minutes!\n\nAlternative: You can also order directly via WhatsApp at ${phone}\n\nNeed help with any step? Just ask! 😊`;
  }

  // PAYMENT
  if (/pay|payment|transfer|bank|account|how.*pay|method|card|cash|account number/.test(q)) {
    return `PAYMENT INFORMATION\n\nWe currently accept bank transfer only for security and simplicity.\n\nHow it works:\n\n1. Add items to cart and proceed to checkout\n2. Fill in your delivery details\n3. On the payment screen, you'll see:\n   - Bank Name\n   - Account Number\n   - Account Name\n4. Copy the details and make transfer from your bank app\n5. Click "Confirm via WhatsApp" button\n6. Send screenshot of payment proof\n7. We confirm within minutes and dispatch!\n\nSecure: Your payment is protected\nFast: Confirmation within minutes\nSimple: No card details needed\n\nImportant: Always confirm the account name matches before transferring!\n\nQuestions? Reach us on WhatsApp: ${phone}`;
  }

  // CONTACT
  if (/whatsapp|contact|reach|call|phone|talk|chat|speak|email|message|get in touch|connect/.test(q)) {
    return `CONTACT INFORMATION\n\nWhatsApp (Fastest Response):\n${phone}\n\nEmail:\n${settings.email || "plainculture.ng@gmail.com"}\n\nStore Location:\n${address}\n\nHours:\nWe're available on WhatsApp 24/7!\n\nResponse Time:\n• WhatsApp: Usually within minutes\n• Email: Within 24 hours\n\nBest way to reach us: WhatsApp! We respond fastest there.`;
  }

  // RETURNS
  if (/return|refund|exchange|change|wrong.*size|no.*fit|too.*small|too.*big|exchange.*size/.test(q)) {
    return `RETURNS & EXCHANGES POLICY\n\nReturns:\n• Must be initiated within 7 days of delivery\n• Item must be unworn with tags attached\n• Original packaging preferred\n• Proof of purchase required\n\nExchanges (Free):\n• Free size exchanges within 14 days\n• Subject to availability\n• We cover return shipping for exchanges\n\nNot Refundable:\n• Final sale items\n• Items without tags\n• Worn or washed items\n\nHow to Request:\n1. Message us on WhatsApp: ${phone}\n2. Provide your Order ID\n3. Explain the issue\n4. We'll guide you through the process\n\nTip: Check our size guide before ordering to avoid exchanges!`;
  }

  // QUALITY
  if (/quality|material|fabric|cotton|gsm|heavyweight|weight|thick|premium|durability|last|long|shrink|wash|care/.test(q)) {
    return `QUALITY & MATERIALS\n\nFabric:\n• 280GSM Pure Combed Organic Cotton\n• Nearly 2x heavier than standard tees (140-160GSM)\n• Soft yet structured feel\n\nConstruction:\n• Boxy oversized cut for modern streetwear look\n• Pre-shrunk (won't shrink after washing)\n• Double-stitched hems for durability\n• Reinforced shoulders\n\nCare Instructions:\n• Machine wash cold (30°C or below)\n• Wash with similar colors\n• Do not bleach\n• Tumble dry low or hang dry\n• Iron on low heat if needed\n\nWhy Heavyweight?\n✅ Holds shape better\n✅ More durable\n✅ Premium drape\n✅ Less transparent\n✅ Made for Nigerian weather (breathable despite weight)\n\nOnce you try one, regular tees won't feel the same!`;
  }

  // TRACKING
  if (/track|where.*order|order.*status|my.*order|dispatch|package|parcel|delivery.*status/.test(q)) {
    return `ORDER TRACKING\n\nHow to Track:\n1. Scroll to the footer of the website\n2. Click "Track My Order"\n3. Enter your Order ID (e.g., PC-1234)\n4. Enter your phone number\n5. View your order status!\n\nOrder Statuses:\n• Pending - Payment not yet confirmed\n• Confirmed - Payment received, being packaged\n• Delivered - Successfully delivered to you\n\nTypical Timeline:\n• Pending to Confirmed: Within hours (same day)\n• Confirmed to Delivered: Same day (if before 2pm) or next day\n\nCan't find your order?\nMessage us on WhatsApp with your Order ID: ${phone}\n\nWe'll help you track it down! 😊`;
  }

  // STOCK
  if (/stock|available|left|remaining|sold out|when.*back|restock|new.*drop|next.*drop|notify/.test(q)) {
    const soldOutCount = products.filter(p => !p.isActive || Object.values(p.sizeStock || {}).every((v: any) => Number(v) === 0)).length;
    return `STOCK INFORMATION\n\nCurrent Availability:\n• ${activeProducts.length} products currently available\n• ${totalStock} total pieces in stock\n• ${soldOutCount} items sold out\n\nSold Out Items:\nWhen an item sells out, it's marked as "Sold Out" on the website.\n\nRestocks:\n• We do limited drops (small batches)\n• Restocks announced on WhatsApp and social media\n• Popular items may not return\n\nGet Notified:\n• Follow us on social media\n• Save our WhatsApp: ${phone}\n• Check the website regularly\n\nPro tip: Our drops sell out fast! When you see something you like, grab it quickly.`;
  }

  // DELIVERY ZONES
  if (/landmark|area|zone|location.*ibadan|ibadan.*area|delivery.*fee|how much.*delivery/.test(q)) {
    return `DELIVERY ZONES & FEES (IBADAN)\n\nZone 1 (₦1,000):\nUI, Bodija, Agodi, Aleshinloye, Mokola\n\nZone 2 (₦1,500):\nRing Road, Dugbe, Secretariat, Challenge, Iwo Road, Ojoo\n\nZone 3 (₦2,000):\nAkobo, Ajibode, Oluyole, Adamasingba, Apata, Abule Ijebu, Sango, Eleyele, Eleiyele, Basorun, Alao Akala, Toll Gate\n\nZone 4 (₦2,500):\nEgbeda, Awotan, Akala, Olunde, Moniya, Apete, Ido, Kabba Road, Idi-Ape, Agugu, Oremeji, Olodo, Elebu\n\nOther States:\nSelect "Other State" during checkout and we'll discuss the rate on WhatsApp.\n\nDuring checkout: Select your nearest landmark from the dropdown for accurate fee calculation!`;
  }

  // MAINTENANCE
  if (/maintenance|down|not.*working|website.*issue|site.*down|error|problem/.test(q)) {
    return `WEBSITE MAINTENANCE\n\nIf you're seeing a maintenance screen:\n\n• We're currently updating the website\n• This usually takes less than 30 minutes\n• You can still order via WhatsApp!\n\nAlternative Ordering:\nWhatsApp: ${phone}\nEmail: ${settings.email || "plainculture.ng@gmail.com"}\n\nJust send us:\n• Product name\n• Size\n• Your delivery address\n• Payment proof screenshot\n\nWe'll process your order manually! 😊`;
  }

  // ADMIN
  if (/admin|login|sign in|dashboard|staff|worker|employee|access/.test(q)) {
    return `ADMIN ACCESS\n\nThe admin dashboard is for Plain Culture staff only.\n\nFor Customers:\nYou don't need to log in to shop! Just browse, add to cart, and checkout as a guest.\n\nFor Staff:\nAccess the admin dashboard via the secret URL to manage products, orders, and settings.\n\nNeed Help?\nIf you're a staff member having login issues, contact the admin directly.\n\nWant to Shop?\nJust browse the website - no account needed! 😊`;
  }

  // GIFT
  if (/gift|card|voucher|present|birthday|gift.*card/.test(q)) {
    return `GIFT CARDS\n\nWe currently don't offer digital gift cards.\n\nAlternative Gift Ideas:\n• Purchase a product and have it delivered to the recipient\n• Include a personalized note in the order comments\n• We can gift-wrap upon request (message us on WhatsApp)\n\nTo Order a Gift:\n1. Select the product\n2. During checkout, add a note: "This is a gift"\n3. Provide recipient's delivery address\n4. We'll handle the rest!\n\nQuestions? Message us: ${phone}`;
  }

  // BULK
  if (/bulk|custom|wholesale|multiple|many|10|20|50|100|corporate|business|uniform|team/.test(q)) {
    return `BULK & CUSTOM ORDERS\n\nYes! We handle bulk and custom orders.\n\nBulk Orders (10+ pieces):\n• Special pricing available\n• Custom sizes can be arranged\n• Delivery can be coordinated\n\nCustom Orders:\n• Custom colors (subject to availability)\n• Custom branding/logos (minimum quantity applies)\n• Lead time: 2-4 weeks\n\nHow to Order:\n1. Message us on WhatsApp: ${phone}\n2. Specify quantity and requirements\n3. We'll provide a quote\n4. Confirm and make payment\n5. Production begins!\n\nTip: For bulk orders, contact us at least 2 weeks in advance!`;
  }

  // STUDENT
  if (/student|discount|promo|code|coupon|cheap|affordable|school|university|ui|polytechnic/.test(q)) {
    return `STUDENT DISCOUNTS\n\nWe love supporting students!\n\nCurrent Offers:\n• Follow us on social media for occasional student promos\n• Bulk orders (5+ pieces) may qualify for discounts\n• End-of-semester sales announced on WhatsApp\n\nHow to Stay Updated:\n• Save our WhatsApp: ${phone}\n• Follow our social media\n• Check the website regularly\n\nNote: Standard prices reflect our premium quality. We don't do regular discounts, but we occasionally run student-friendly promos!`;
  }

  // HOURS
  if (/hour|open|close|time|when.*available|working.*hour|business.*hour/.test(q)) {
    return `WORKING HOURS\n\nWhatsApp Support:\nAvailable 24/7!\nWe respond quickly at any time.\n\nOrder Processing:\n• Orders before 2pm: Same-day dispatch\n• Orders after 2pm: Next-day dispatch\n• Weekend orders: Processed on Monday\n\nDelivery:\n• Monday - Saturday: 9am - 6pm\n• Sunday: Limited delivery (by arrangement)\n\nStore Pickup:\nBy appointment only. Message us to schedule!\n\nLocation: ${address}\nWhatsApp: ${phone}`;
  }

  // SOCIAL
  if (/social|instagram|twitter|tiktok|facebook|follow|page|account|media/.test(q)) {
    return `SOCIAL MEDIA\n\nFollow us for:\n• New drop announcements\n• Styling tips and inspiration\n• Behind-the-scenes content\n• Customer features\n• Exclusive promos\n\nPlatforms:\n• Instagram: @plainculture.ng\n• Twitter: @plainculture\n• TikTok: @plainculture\n• Facebook: Plain Culture\n\nBest for updates: Instagram!\n\nOr save our WhatsApp for direct ordering: ${phone}`;
  }

  // BRAND
  if (/brand|story|about|who.*you|company|business|started|founder|origin|plain.*culture/.test(q)) {
    return `ABOUT PLAIN CULTURE\n\nWho We Are:\nPlain Culture is a premium minimalist streetwear brand based in Ibadan, Oyo-State, Nigeria.\n\nWhat We Do:\nWe create heavyweight, high-quality tees designed for creative minds who appreciate quality over quantity.\n\nWhy Heavyweight?\n• 280GSM cotton (2x standard weight)\n• Boxy oversized fit for modern streetwear\n• Pre-shrunk, won't lose shape\n• Made for Nigerian weather\n\nOur Mission:\nTo provide premium, affordable streetwear that lasts - no fast fashion, no compromise on quality.\n\nBased In:\n${address}\n\nFounded:\nBy creatives, for creatives.\n\nQuestions? We're always happy to chat! 😊`;
  }

  // PRIVACY
  if (/privacy|secure|security|safe|data|information|personal|protect/.test(q)) {
    return `PRIVACY & SECURITY\n\nYour Data:\n• We only collect necessary information (name, phone, address)\n• Your data is never sold or shared\n• Secure bank transfer payments (no card details stored)\n\nOrder Information:\n• Used only for delivery and order updates\n• Stored securely in our system\n• You can request deletion anytime\n\nPayment Security:\n• Bank transfer only (no card details needed)\n• Always verify account name before transferring\n• Payment proof sent via WhatsApp (encrypted)\n\nYour Rights:\n• Access your order history\n• Request data deletion\n• Update your information anytime\n\nQuestions about privacy? Message us! 😊`;
  }

  // THANK YOU
  if (/thank|thanks|thank you|appreciate|grateful|helpful|good.*job|well.*done/.test(q)) {
    return `You're very welcome!\n\nThank you for choosing ${brandName}. We appreciate you!\n\nIf you need anything else - whether it's about your order, sizing, or just a chat - we're always here.\n\nHappy shopping! 😊\n\n${brandName} - Premium Minimalist Streetwear, Ibadan.`;
  }

  // FALLBACK
  return `Thanks for your message! 😊 Let me help you.\n\nI can assist with:\n\nProducts & Shopping:\n• Available products and prices\n• Size guide and fit tips\n• Stock availability\n• How to place an order\n\nDelivery:\n• Delivery zones and fees\n• Shipping timelines\n• Outside Ibadan shipping\n\nPayment:\n• Payment methods\n• Bank transfer process\n• Order confirmation\n\nAfter Order:\n• Track your order\n• Returns and exchanges\n• Size exchanges\n\nContact:\n• WhatsApp, email, location\n• Working hours\n• Social media\n\nQuality:\n• Materials and fabric\n• Care instructions\n• Brand story\n\nStill not sure? Just ask me anything!\n\nOr reach our team directly:\nWhatsApp: ${phone}\nEmail: ${settings.email || "plainculture.ng@gmail.com"}`;
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
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#E8FF6B] text-black rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform cursor-pointer"
          title="Chat with us"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-4 right-4 z-50 w-[360px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-2rem)] bg-black border border-zinc-800 rounded-lg shadow-2xl flex flex-col overflow-hidden animate-slide-in">
          
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
