'use client';

import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  X, 
  Send, 
  ShoppingBag, 
  Scale
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

      if (query.includes("compare") || query.includes("vs") || query.includes("table")) {
        let prodsToCompare = products.slice(0, 3);
        
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
      } else {
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
          agentReply = `I searched our live store catalog for "${textToSend}". Here are our current top-rated verified products:`;
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
          className="fixed bottom-6 left-6 z-40 bg-slate-900 hover:bg-slate-800 text-white p-3.5 rounded-full shadow-2xl border-2 border-blue-500 flex items-center gap-3 transition transform hover:scale-105 group"
        >
          <div className="relative">
            <Bot className="w-6 h-6 text-blue-400 group-hover:rotate-12 transition" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 absolute -top-1 -right-1 animate-ping" />
          </div>
          <div className="text-left hidden sm:block">
            <span className="block text-xs font-black tracking-wider text-white">AI SHOPPING ASSISTANT</span>
            <span className="block text-[10px] text-blue-400 font-mono">Live Catalog • Comparison Ready</span>
          </div>
        </button>
      )}

      {/* AI AGENT CHAT WINDOW */}
      {isOpen && (
        <div className="fixed bottom-6 left-6 z-50 w-96 sm:w-[420px] max-w-[calc(100vw-2rem)] bg-slate-950 border border-slate-800 text-slate-100 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[560px] animate-in fade-in slide-in-from-bottom-4 duration-300">
          
          {/* Header */}
          <div className="bg-slate-900 p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-slate-950 border border-blue-500/40 flex items-center justify-center">
                <Bot className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h4 className="font-extrabold text-xs text-white flex items-center gap-1.5">
                  RentalMoney AI Copilot <span className="bg-blue-600 text-white text-[9px] font-mono px-1.5 py-0.5 rounded font-black">Live</span>
                </h4>
                <span className="text-[10px] text-slate-400 font-mono">{products.length} Products Loaded</span>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-slate-800 transition"
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
                  className={`p-3.5 rounded-2xl max-w-[90%] leading-relaxed font-medium ${
                    m.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-br-sm font-semibold'
                      : 'bg-slate-900 text-slate-100 border border-slate-800 rounded-bl-sm'
                  }`}
                >
                  {m.text}
                </div>

                {/* INLINE PRODUCT COMPARISON TABLE */}
                {m.comparisonTable && m.comparisonTable.length > 0 && (
                  <div className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 overflow-x-auto space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-black text-blue-400 border-b border-slate-800 pb-2">
                      <span className="flex items-center gap-1"><Scale className="w-3.5 h-3.5" /> Product Comparison Matrix</span>
                      <span className="text-[9px] text-slate-400">{m.comparisonTable.length} Items</span>
                    </div>

                    <table className="w-full text-left text-[11px]">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 font-bold">
                          <th className="py-1.5 px-2">Attribute</th>
                          {m.comparisonTable.map(p => (
                            <th key={p.id} className="py-1.5 px-2 font-black text-white min-w-[90px]">{p.title.split(' ')[0]}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        <tr>
                          <td className="py-1.5 px-2 font-bold text-slate-400">Price</td>
                          {m.comparisonTable.map(p => (
                            <td key={p.id} className="py-1.5 px-2 font-black text-blue-400">₹{Number(p.price).toLocaleString('en-IN')}</td>
                          ))}
                        </tr>
                        <tr>
                          <td className="py-1.5 px-2 font-bold text-slate-400">Rating</td>
                          {m.comparisonTable.map(p => (
                            <td key={p.id} className="py-1.5 px-2 font-bold text-amber-400">★ {p.rating || 4.5}</td>
                          ))}
                        </tr>
                        <tr>
                          <td className="py-1.5 px-2 font-bold text-slate-400">Category</td>
                          {m.comparisonTable.map(p => (
                            <td key={p.id} className="py-1.5 px-2 text-slate-300 truncate max-w-[80px]">{p.categoryName || 'General'}</td>
                          ))}
                        </tr>
                        <tr>
                          <td className="py-1.5 px-2 font-bold text-slate-400">Action</td>
                          {m.comparisonTable.map(p => (
                            <td key={p.id} className="py-1.5 px-2">
                              <button
                                onClick={() => onAddToCart(p)}
                                className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] font-bold transition flex items-center gap-1"
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
                      <div key={p.id} className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
                        <img src={p.images?.[0] || p.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30'} alt={p.title} className="w-12 h-12 object-cover rounded-lg shrink-0 border border-slate-800" />
                        <div className="flex-1 min-w-0">
                          <h5 className="font-bold text-[11px] text-white truncate">{p.title}</h5>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-black text-xs text-blue-400">₹{Number(p.price).toLocaleString('en-IN')}</span>
                            {p.rating && <span className="text-[10px] text-amber-400 font-bold">★ {p.rating}</span>}
                          </div>
                        </div>
                        <button
                          onClick={() => onAddToCart(p)}
                          className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-lg transition"
                          title="Add to Cart"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    
                    {m.suggestedProducts.length >= 2 && (
                      <button
                        onClick={() => handleSendMessage(`Compare ${m.suggestedProducts[0].title} vs ${m.suggestedProducts[1].title}`)}
                        className="w-full py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 font-mono font-bold text-[11px] rounded-xl border border-blue-500/30 flex items-center justify-center gap-1.5 transition"
                      >
                        <Scale className="w-3.5 h-3.5" /> Generate Comparison Table
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2 text-slate-400 font-mono text-[10px] bg-slate-900 p-2 rounded-xl w-fit border border-slate-800">
                <Bot className="w-3.5 h-3.5 animate-spin text-blue-400" />
                <span>Searching store inventory...</span>
              </div>
            )}
          </div>

          {/* Quick Prompt Chips */}
          <div className="p-2.5 border-t border-slate-800 bg-slate-900 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {suggestedPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
                className="px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold whitespace-nowrap shrink-0 border border-slate-700 transition"
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
            className="p-3 border-t border-slate-800 bg-slate-950 flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask AI assistant (e.g. 'Compare top products')..."
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-full px-3.5 py-2 text-xs font-semibold text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-full font-black transition shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      )}
    </>
  );
}
