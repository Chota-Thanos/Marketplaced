'use client';

import React, { useState } from 'react';
import { 
  Bot, 
  X, 
  Send, 
  Sparkles, 
  ShoppingBag, 
  Scale, 
  Zap, 
  ChevronRight, 
  CheckCircle2, 
  Mic,
  ShieldCheck
} from 'lucide-react';
import { PRODUCTS } from '../data/mockData';

export default function AIAgentCopilot({ onOpenCompare, onAddToCart }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: "m1",
      sender: "agent",
      text: "Namaste! I am BazaarX AI Shopping Agent. I can help you find products, compare specs, check express delivery, and recommend festive gifts. How can I assist your shopping today?",
      suggestedProducts: [PRODUCTS[0], PRODUCTS[1]]
    }
  ]);
  const [inputMsg, setInputMsg] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const suggestedPrompts = [
    "Compare Anarkali Set vs ANC Headphones",
    "Which product is best for marathon running?",
    "Recommend a 100% organic skincare product",
    "Show me items with 1-day express delivery"
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

      const query = textToSend.toLowerCase();

      if (query.includes("compare") || query.includes("vs")) {
        agentReply = "I have initiated a side-by-side comparison matrix for you! I compared price, BIS IS 19000 verification status, local store pickup, and technical durability.";
        matchedProds = [PRODUCTS[0], PRODUCTS[1]];
      } else if (query.includes("shoe") || query.includes("marathon") || query.includes("running")) {
        agentReply = "For marathon running, I strongly recommend the AeroGlide Pro Carbon Running Shoes (₹1,899). It features a full-length propulsive carbon plate returning 85% energy and 42 CFM airflow mesh.";
        matchedProds = [PRODUCTS[2]];
      } else if (query.includes("organic") || query.includes("skin") || query.includes("ayurveda")) {
        agentReply = "The Kumkumadi Tailam Night Rejuvenating Facial Oil (₹999) is 100% AYUSH Organic Certified, infused with Grade-A Kashmiri Mongra Saffron for radiant texture.";
        matchedProds = [PRODUCTS[4]];
      } else if (query.includes("saree") || query.includes("festive") || query.includes("silk")) {
        agentReply = "The Hand-Embroidered Chanderi Silk Anarkali Set (₹3,499) is GI Heritage certified by Madhya Pradesh master weavers, featuring tested 24K gold zari.";
        matchedProds = [PRODUCTS[0]];
      } else {
        agentReply = `I analyzed your request "${textToSend}". Here are our top-rated verified products under BIS IS 19000 standards with 1-click UPI checkout!`;
        matchedProds = [PRODUCTS[0], PRODUCTS[1]];
      }

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "agent",
          text: agentReply,
          suggestedProducts: matchedProds
        }
      ]);
      setIsTyping(false);
    }, 1000);
  };

  return (
    <>
      {/* FLOATING AI AGENT BUTTON IN BOTTOM-LEFT */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 left-6 z-40 bg-inverse hover:bg-inverse text-ink-inverse p-3.5 rounded-pill shadow-panel border-2 border-agent flex items-center gap-3 transition transform hover:scale-105 group"
        >
          <div className="relative">
            <Bot className="w-6 h-6 text-agent group-hover:rotate-12 transition" />
            <span className="w-2.5 h-2.5 rounded-pill bg-agent absolute -top-1 -right-1 animate-ping" />
          </div>
          <div className="text-left hidden sm:block">
            <span className="block text-xs font-black tracking-wider text-ink-inverse">AI SHOPPING AGENT</span>
            <span className="block text-[10px] text-agent font-mono">Online • Ask Anything</span>
          </div>
        </button>
      )}

      {/* AI AGENT SLIDE-OUT CHAT WINDOW */}
      {isOpen && (
        <div className="fixed bottom-6 left-6 z-50 w-96 max-w-[calc(100vw-3rem)] bg-inverse border border-line-strong text-ink-inverse rounded-panel shadow-panel overflow-hidden flex flex-col h-[520px] animate-in fade-in slide-in-from-bottom-4 duration-300">
          
          {/* Header */}
          <div className="bg-agent-surface p-4 border-b border-line-strong flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-card bg-inverse border border-agent/40 flex items-center justify-center">
                <Bot className="w-5 h-5 text-agent" />
              </div>
              <div>
                <h4 className="font-extrabold text-xs text-ink-inverse flex items-center gap-1.5">
                  BazaarX AI Agent <span className="bg-agent text-ink text-[9px] font-mono px-1.5 py-0.2 rounded font-black">v2.6</span>
                </h4>
                <span className="text-[10px] text-ink-subtle font-mono">Agentic Shopping & Comparison</span>
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
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col space-y-2 ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`p-3.5 rounded-card max-w-[85%] leading-relaxed font-medium ${
                    m.sender === 'user'
                      ? 'bg-danger text-ink-inverse rounded-br-chip font-semibold'
                      : 'bg-inverse text-ink-inverse border border-line-strong rounded-bl-chip'
                  }`}
                >
                  {m.text}
                </div>

                {/* Suggested Product Cards inside Agent Chat */}
                {m.suggestedProducts && m.suggestedProducts.length > 0 && (
                  <div className="w-full space-y-2 pt-1">
                    {m.suggestedProducts.map((p) => (
                      <div key={p.id} className="bg-inverse p-2.5 rounded-card border border-line-strong flex items-center justify-between gap-3">
                        <img src={p.image} alt={p.title} className="w-12 h-12 object-cover rounded-control shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h5 className="font-bold text-[11px] text-ink-inverse truncate">{p.title}</h5>
                          <span className="font-black text-xs text-agent">₹{p.price.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onAddToCart(p)}
                            className="bg-surface text-ink p-1.5 rounded-pill hover:bg-surface-sunken transition"
                            title="Add to Cart"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    {m.suggestedProducts.length >= 2 && (
                      <button
                        onClick={() => {
                          onOpenCompare(m.suggestedProducts);
                          setIsOpen(false);
                        }}
                        className="w-full py-2 bg-success/20 hover:bg-success/30 text-agent font-mono font-bold text-[11px] rounded-control border border-success/40 flex items-center justify-center gap-1.5 transition"
                      >
                        <Scale className="w-3.5 h-3.5" /> Open Side-by-Side Comparison Matrix
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2 text-ink-subtle font-mono text-[10px] bg-inverse/50 p-2 rounded-control w-fit">
                <Bot className="w-3.5 h-3.5 animate-spin text-agent" />
                <span>AI Agent is analyzing catalog data...</span>
              </div>
            )}
          </div>

          {/* Quick Prompt Chips */}
          <div className="p-2 border-t border-line-strong bg-agent-surface flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {suggestedPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
                className="px-2.5 py-1 rounded-pill bg-inverse hover:bg-inverse text-ink-subtle text-[10px] font-medium whitespace-nowrap shrink-0 border border-line-strong transition"
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
              placeholder="Ask AI agent (e.g. 'Compare products')..."
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              className="flex-1 bg-inverse border border-line-strong rounded-pill px-3.5 py-2 text-xs font-semibold text-ink-inverse placeholder-ink-subtle focus:outline-none focus:border-agent"
            />
            <button
              type="submit"
              className="bg-agent hover:bg-success text-ink p-2 rounded-pill font-black transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      )}
    </>
  );
}
