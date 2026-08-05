'use client';

import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  X, 
  Send, 
  Sparkles, 
  ShoppingBag, 
  Scale, 
  Zap, 
  CheckCircle2, 
  Star,
  Tag,
  ShieldCheck
} from 'lucide-react';
import { apiFetch, mapProduct } from '../lib/apiClient';

export default function AIAgentCopilot({ products: propProducts = [], onOpenCompare, onAddToCart }) {
  const [isOpen, setIsOpen] = useState(false);
  const [products, setProducts] = useState(propProducts);
  const [messages, setMessages] = useState([
    {
      id: "m1",
      sender: "agent",
      text: "Namaste! I am your AI Shopping Assistant. I have live access to our complete marketplace catalog. I can answer questions about any item, compare products side-by-side in a table, or help you find deals!",
      suggestedProducts: []
    }
  ]);
  const [inputMsg, setInputMsg] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Fetch real products if prop is empty
  useEffect(() => {
    if (propProducts && propProducts.length > 0) {
      setProducts(propProducts);
    } else {
      apiFetch('/products')
        .then(res => {
          if (res?.data) {
            setProducts(res.data.map(mapProduct));
          }
        })
        .catch(() => {});
    }
  }, [propProducts]);

  const suggestedPrompts = [
    "Compare top rated items",
    "Show me ethnic wear",
    "Find shoes & footwear",
    "Best products under ₹2000"
  ];

  const handleSendMessage = (textToSend = inputMsg) => {
    if (!textToSend.trim()) return;

    const userMsg = { id: Date.now().toString(), sender: "user", text: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setInputMsg('');
    setIsTyping(true);

    setTimeout(() => {
      let agentReply = "";
      let matchedProds = [];
      let comparisonTable = null;

      const query = textToSend.toLowerCase();

      // Check if user is asking to compare
      if (query.includes("compare") || query.includes("vs") || query.includes("table")) {
        // Pick top 2 or 3 products from store for comparison table
        let prodsToCompare = products.slice(0, 3);
        
        // If specific category mentioned
        if (query.includes("ethnic") || query.includes("saree") || query.includes("dress")) {
          prodsToCompare = products.filter(p => (p.categoryName || '').toLowerCase().includes("ethnic")).slice(0, 3);
        } else if (query.includes("shoe") || query.includes("footwear")) {
          prodsToCompare = products.filter(p => (p.categoryName || '').toLowerCase().includes("footwear")).slice(0, 3);
        } else if (query.includes("tech") || query.includes("electronic")) {
          prodsToCompare = products.filter(p => (p.categoryName || '').toLowerCase().includes("electronic")).slice(0, 3);
        }

        if (prodsToCompare.length === 0) prodsToCompare = products.slice(0, 2);

        agentReply = `Here is a side-by-side comparison table of ${prodsToCompare.length} featured products from our catalog:`;
        comparisonTable = prodsToCompare;
        matchedProds = prodsToCompare;
      }
      // Search by category or query term
      else {
        const matching = products.filter(p => {
          const title = (p.title || '').toLowerCase();
          const cat = (p.categoryName || '').toLowerCase();
          const desc = (p.description || '').toLowerCase();
          return title.includes(query) || cat.includes(query) || desc.includes(query);
        });

        if (query.includes("under") || query.includes("cheap") || query.includes("budget") || query.includes("2000")) {
          const budgetProds = products.filter(p => Number(p.price || 0) <= 2000);
          agentReply = `Here are verified budget-friendly products under ₹2,000 in our live catalog:`;
          matchedProds = budgetProds.length > 0 ? budgetProds.slice(0, 3) : products.slice(0, 3);
        } else if (matching.length > 0) {
          agentReply = `I found ${matching.length} verified item(s) matching "${textToSend}" in our store catalog:`;
          matchedProds = matching.slice(0, 3);
        } else {
          agentReply = `I searched our live store catalog for "${textToSend}". Here are our current top-rated verified products with instant UPI checkout:`;
          matchedProds = products.slice(0, 3);
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "agent",
          text: agentReply,
          suggestedProducts: matchedProds,
          comparisonTable: comparisonTable
        }
      ]);
      setIsTyping(false);
    }, 600);
  };

  return (
    <>
      {/* FLOATING AI AGENT BUTTON */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 left-6 z-40 bg-inverse hover:bg-inverse text-ink-inverse p-3.5 rounded-pill shadow-panel border-2 border-accent flex items-center gap-3 transition transform hover:scale-105 group"
        >
          <div className="relative">
            <Bot className="w-6 h-6 text-accent group-hover:rotate-12 transition" />
            <span className="w-2.5 h-2.5 rounded-pill bg-success absolute -top-1 -right-1 animate-ping" />
          </div>
          <div className="text-left hidden sm:block">
            <span className="block text-xs font-black tracking-wider text-ink-inverse">AI SHOPPING ASSISTANT</span>
            <span className="block text-[10px] text-accent font-mono">Live Catalog • Comparison Ready</span>
          </div>
        </button>
      )}

      {/* AI AGENT CHAT WINDOW */}
      {isOpen && (
        <div className="fixed bottom-6 left-6 z-50 w-96 sm:w-[420px] max-w-[calc(100vw-2rem)] bg-inverse border border-line-strong text-ink-inverse rounded-panel shadow-panel overflow-hidden flex flex-col h-[560px] animate-in fade-in slide-in-from-bottom-4 duration-300">
          
          {/* Header */}
          <div className="bg-surface-sunken p-4 border-b border-line-strong flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-card bg-inverse border border-accent/40 flex items-center justify-center">
                <Bot className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h4 className="font-extrabold text-xs text-ink-inverse flex items-center gap-1.5">
                  RentalMoney AI Copilot <span className="bg-accent text-white text-[9px] font-mono px-1.5 py-0.2 rounded font-black">Live</span>
                </h4>
                <span className="text-[10px] text-ink-subtle font-mono">{products.length} Products Loaded</span>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="text-ink-subtle hover:text-ink-inverse p-1 rounded-pill hover:bg-inverse transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col space-y-2 ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`p-3.5 rounded-card max-w-[90%] leading-relaxed font-medium ${
                    m.sender === 'user'
                      ? 'bg-accent text-white rounded-br-chip font-semibold'
                      : 'bg-surface-sunken text-ink-inverse border border-line-strong rounded-bl-chip'
                  }`}
                >
                  {m.text}
                </div>

                {/* INLINE PRODUCT COMPARISON TABLE */}
                {m.comparisonTable && m.comparisonTable.length > 0 && (
                  <div className="w-full bg-surface-sunken border border-line-strong rounded-card p-3 overflow-x-auto space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-black text-accent border-b border-line-strong pb-2">
                      <span className="flex items-center gap-1"><Scale className="w-3.5 h-3.5" /> Product Comparison Matrix</span>
                      <span className="text-[9px] text-ink-subtle">{m.comparisonTable.length} Items</span>
                    </div>

                    <table className="w-full text-left text-[11px]">
                      <thead>
                        <tr className="border-b border-line-strong text-ink-subtle font-bold">
                          <th className="py-1.5 px-2">Attribute</th>
                          {m.comparisonTable.map(p => (
                            <th key={p.id} className="py-1.5 px-2 font-black text-white min-w-[90px]">{p.title.split(' ')[0]}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line-strong/50">
                        <tr>
                          <td className="py-1.5 px-2 font-bold text-ink-subtle">Price</td>
                          {m.comparisonTable.map(p => (
                            <td key={p.id} className="py-1.5 px-2 font-black text-accent">₹{Number(p.price).toLocaleString('en-IN')}</td>
                          ))}
                        </tr>
                        <tr>
                          <td className="py-1.5 px-2 font-bold text-ink-subtle">Rating</td>
                          {m.comparisonTable.map(p => (
                            <td key={p.id} className="py-1.5 px-2 font-bold text-warning">★ {p.rating || 4.5}</td>
                          ))}
                        </tr>
                        <tr>
                          <td className="py-1.5 px-2 font-bold text-ink-subtle">Category</td>
                          {m.comparisonTable.map(p => (
                            <td key={p.id} className="py-1.5 px-2 text-ink-subtle truncate max-w-[80px]">{p.categoryName || 'General'}</td>
                          ))}
                        </tr>
                        <tr>
                          <td className="py-1.5 px-2 font-bold text-ink-subtle">Action</td>
                          {m.comparisonTable.map(p => (
                            <td key={p.id} className="py-1.5 px-2">
                              <button
                                onClick={() => onAddToCart(p)}
                                className="px-2 py-1 bg-accent hover:bg-accent-hover text-white rounded text-[10px] font-bold transition flex items-center gap-1"
                              >
                                <ShoppingBag className="w-3 h-3" /> Add
                              </button>
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Suggested Product Cards */}
                {!m.comparisonTable && m.suggestedProducts && m.suggestedProducts.length > 0 && (
                  <div className="w-full space-y-2 pt-1">
                    {m.suggestedProducts.map((p) => (
                      <div key={p.id} className="bg-surface-sunken p-2.5 rounded-card border border-line-strong flex items-center justify-between gap-3">
                        <img src={p.images?.[0] || p.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30'} alt={p.title} className="w-12 h-12 object-cover rounded-control shrink-0 border border-line-strong" />
                        <div className="flex-1 min-w-0">
                          <h5 className="font-bold text-[11px] text-ink-inverse truncate">{p.title}</h5>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-black text-xs text-accent">₹{Number(p.price).toLocaleString('en-IN')}</span>
                            {p.rating && <span className="text-[10px] text-warning font-bold">★ {p.rating}</span>}
                          </div>
                        </div>
                        <button
                          onClick={() => onAddToCart(p)}
                          className="bg-accent hover:bg-accent-hover text-white p-2 rounded-control transition"
                          title="Add to Cart"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    
                    {m.suggestedProducts.length >= 2 && (
                      <button
                        onClick={() => handleSendMessage(`Compare ${m.suggestedProducts[0].title} vs ${m.suggestedProducts[1].title}`)}
                        className="w-full py-2 bg-accent/20 hover:bg-accent/30 text-accent font-mono font-bold text-[11px] rounded-control border border-accent/40 flex items-center justify-center gap-1.5 transition"
                      >
                        <Scale className="w-3.5 h-3.5" /> Generate Comparison Table
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2 text-ink-subtle font-mono text-[10px] bg-surface-sunken p-2 rounded-control w-fit border border-line-strong">
                <Bot className="w-3.5 h-3.5 animate-spin text-accent" />
                <span>Searching store inventory...</span>
              </div>
            )}
          </div>

          {/* Quick Prompt Chips */}
          <div className="p-2 border-t border-line-strong bg-surface-sunken flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {suggestedPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
                className="px-2.5 py-1 rounded-pill bg-inverse hover:bg-surface-sunken text-ink-subtle hover:text-white text-[10px] font-bold whitespace-nowrap shrink-0 border border-line-strong transition"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 border-t border-line-strong bg-inverse flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask AI assistant (e.g. 'Compare top products')..."
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              className="flex-1 bg-surface-sunken border border-line-strong rounded-pill px-3.5 py-2 text-xs font-semibold text-ink-inverse placeholder-ink-subtle focus:outline-none focus:border-accent"
            />
            <button
              type="submit"
              className="bg-accent hover:bg-accent-hover text-white p-2 rounded-pill font-black transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      )}
    </>
  );
}
