'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { X, Send, Mic, Star, ThumbsUp, Zap, Tag, Search, FileText, User, Package, Phone, ShoppingBag } from 'lucide-react';
import { 
  createWooAIChatSession, 
  addWooAIMessage,
  endWooAISession,
  searchWooAIProducts
} from '@/lib/api/client';
import { BACKEND_URL } from '@/lib/api/shared';
import './Wooaiwidget.css';

const QUICK_ACTIONS = [
  { label: 'Bestselling',     icon: Star      },
  { label: 'Recommended',    icon: ThumbsUp   },
  { label: 'New Arrivals',   icon: Zap        },
  { label: 'Offers',         icon: Tag        },
  { label: 'Search Product', icon: Search     },
  { label: 'Policies',       icon: FileText   },
  { label: 'My Account',     icon: User       },
  { label: 'Order Tracking', icon: Package    },
  { label: 'Callback',       icon: Phone      },
];

function formatMsgTime() {
  const d = new Date();
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function MsgTime() {
  return <span className="woo-bubble-time">{formatMsgTime()}</span>;
}

export default function WooAIWidget() {
  const [open,     setOpen]   = useState(false);
  const [msgs,     setMsgs]   = useState([]);
  const [input,    setInput]  = useState('');
  const [typing,   setTyping] = useState(false);
  const [showGrid, setGrid]   = useState(true);
  const [isMobile, setMobile] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState('Guest');

  const endRef     = useRef(null);
  const inputRef   = useRef(null);
  const lastEndRef = useRef(0);
  const NEW_SESSION_COOLDOWN = 3 * 60 * 1000;

  // Initialize user info from localStorage or defaults
  useEffect(() => {
    const checkMobile = () => setMobile(window.innerWidth <= 480);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Try to get user info from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        setUserId(parsed.id);
        setUserName(parsed.name || parsed.email || 'Guest');
      } catch (e) {
        console.warn('Could not parse user data from localStorage');
      }
    }
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs, typing]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  useEffect(() => {
    if (isMobile) document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open, isMobile]);

  const [chatKey, setChatKey] = useState(0);

  // Create chat session when widget opens
  useEffect(() => {
    if (!open || sessionId) return;
    const elapsed = Date.now() - lastEndRef.current;
    if (elapsed < NEW_SESSION_COOLDOWN && chatKey > 0) {
      setMsgs(m => [...m, { role: 'bot', text: `⏳ Please wait a moment before starting a new chat. You can continue in ${Math.ceil((NEW_SESSION_COOLDOWN - elapsed) / 60000)} minute(s).` }]);
      return;
    }
    createChatSession();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, chatKey]);

  const createChatSession = async () => {
    try {
      const response = await createWooAIChatSession(userId || 0, userName || 'Guest', 'General Inquiry');
      setSessionId(response.id);
    } catch (error) {
      console.error('Failed to create chat session:', error);
    }
  };

  const endCurrentSession = async () => {
    if (sessionId) {
      try { await endWooAISession(sessionId); } catch { /* ignore */ }
    }
    lastEndRef.current = Date.now();
    setSessionId(null);
  };

  const handleNewChat = async () => {
    await endCurrentSession();
    setMsgs([]);
    setGrid(true);
    setChatKey(k => k + 1);
  };

  const handleClose = () => {
    setOpen(false);
    endCurrentSession();
  };

  const parseBotMessage = (content) => {
    const text = content || '';
    const marker = '__AI_PRODUCTS__';
    const startIdx = text.indexOf(marker);
    if (startIdx !== -1) {
      const endIdx = text.indexOf(marker, startIdx + marker.length);
      if (endIdx !== -1) {
        const jsonStr = text.substring(startIdx + marker.length, endIdx);
        const displayText = text.substring(0, startIdx) + text.substring(endIdx + marker.length);
        try {
          const products = JSON.parse(jsonStr);
          return { text: displayText.trim(), products };
        } catch (e) {
          return { text: text.replaceAll(marker, '').trim(), products: null };
        }
      }
    }
    return { text, products: null };
  };

  const send = async (text) => {
    const t = (text || input).trim();
    if (!t) return;
    
    setInput('');
    setGrid(false);
    setMsgs(m => [...m, { role: 'user', text: t }]);
    setTyping(true);
    
    try {
      if (sessionId) {
        const updatedSession = await addWooAIMessage(sessionId, t, 'USER');
        if (updatedSession && updatedSession.messages) {
          const botMessages = updatedSession.messages.filter(msg => msg.role === 'BOT');
          if (botMessages.length > 0) {
            const lastBot = botMessages[botMessages.length - 1];
            const parsed = parseBotMessage(lastBot.content || lastBot.text);
            setTyping(false);
            setMsgs(prev => [...prev, { role: 'bot', ...parsed }]);
            return;
          }
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
    
    setTyping(false);
    setMsgs(prev => [...prev, { 
      role: 'bot', 
      text: 'Thanks for your message! Let me look that up for you. One moment...',
      products: null
    }]);
  };

  return (
    <>
      {open && isMobile && <div className="woo-backdrop" onClick={handleClose} />}

      <div className={"woo-panel" + (open ? " woo-panel--open" : "")} role="dialog" aria-label="SreeMarket Chat">
        <div className="woo-hd">
          <div className="woo-hd-avatar">SM</div>
          <div className="woo-hd-info">
            <div className="woo-hd-name">SreeMarket Assistant</div>
            <div className="woo-hd-status"><span className="woo-online-dot" />Online &bull; Replies instantly</div>
          </div>
          <button className="woo-close" onClick={handleClose} aria-label="Close chat"><X size={18} /></button>
        </div>

        <div className="woo-body">
          {msgs.length === 0 && (
            <div className="woo-msg woo-msg--bot">
              <div className="woo-bot-avatar">SM</div>
              <div className="woo-bubble woo-bubble--bot">Hello! Welcome to SreeMarket. How can I help you today?</div>
            </div>
          )}

          {showGrid && (
            <div className="woo-grid">
              {QUICK_ACTIONS.map(({ label, icon: Icon }) => (
                <button key={label} className="woo-grid-btn" onClick={() => send(label)} aria-label={label}>
                  <Icon size={21} strokeWidth={1.5} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          )}

          {msgs.map((m, i) => (
            <div key={i} className={"woo-msg woo-msg--" + m.role}>
              {m.role === 'bot' && <div className="woo-bot-avatar">SM</div>}
              <div className={"woo-bubble woo-bubble--" + m.role}>
                {m.text?.split('\n').map((line, j) => (
                  <React.Fragment key={j}>
                    {line}
                    {j < m.text.split('\n').length - 1 && <br />}
                  </React.Fragment>
                ))}
                <MsgTime />
                {m.products && m.products.length > 0 && (
                  <div className="woo-products">
                    {m.products.map((product) => (
                      <Link
                        key={product.id}
                        href={`/product/${product.id}`}
                        className="woo-product-card"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <div className="woo-product-img">
                          <img
                            src={product.image ? `${BACKEND_URL}${product.image}` : '/placeholder.png'}
                            alt={product.name}
                            loading="lazy"
                          />
                        </div>
                        <div className="woo-product-info">
                          <div className="woo-product-name">{product.name}</div>
                          {product.category && (
                            <div className="woo-product-category">{product.category}</div>
                          )}
                          <div className="woo-product-price">₹{Number(product.price).toLocaleString()}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {typing && (
            <div className="woo-msg woo-msg--bot">
              <div className="woo-bot-avatar">SM</div>
              <div className="woo-typing"><span /><span /><span /></div>
            </div>
          )}
          
          <div ref={endRef} />
        </div>

        {msgs.length > 0 && (
          <div className="woo-actions-bar">
            <button className="woo-action-btn woo-action-btn--new" onClick={handleNewChat}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg> New Chat
            </button>
            <button className="woo-action-btn woo-action-btn--end" onClick={() => { setMsgs(m => [...m, { role: 'bot', text: '👋 Thank you for chatting with us! Feel free to come back anytime.' }]); setTimeout(handleClose, 1500); }}>
              <X size={14} /> End
            </button>
          </div>
        )}

        <div className="woo-input-row">
          <input
            ref={inputRef}
            className="woo-input"
            placeholder="Ask me anything..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
            }}
            aria-label="Chat input"
          />
          <button className="woo-icon-btn woo-mic" aria-label="Voice input"><Mic size={17} /></button>
          <button className="woo-icon-btn woo-send" onClick={() => send()} aria-label="Send message"><Send size={15} /></button>
        </div>
        <div className="woo-footer">Powered by <strong>Sree Market Assistant</strong></div>
      </div>

      <div className="woo-root">
        <button
          className={"woo-fab" + (open && isMobile ? " woo-fab--hidden" : "")}
          onClick={() => open ? handleClose() : setOpen(true)}
          aria-label={open ? 'Close chat' : 'Open chat'}
        >
          {open
            ? <X size={22} color="#fff" />
            : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          }
        </button>
      </div>
    </>
  );
}