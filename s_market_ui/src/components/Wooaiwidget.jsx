import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, Mic, Star, ThumbsUp, Zap, Tag, Search, FileText, User, Package, Phone, ShoppingBag, Heart, MapPin, ArrowLeft, List, CreditCard, ChevronDown, ShoppingCart, RefreshCw, Users, HelpCircle } from 'lucide-react';
import {
  getWooAISettings,
  getWooAIQuickActions,
  getWooAIPolicies,
  getWooAIProductAssignments,
  createWooAIChatSession,
  addWooAIMessage,
  endWooAISession,
  trackOrderByNumber,
  lookupOrderById,
  getUserDetails,
  fetchUserOrders,
  fetchUserWishlist,
  fetchUserAddresses,
  createWooAICallback,
  getAllProducts,
  getPrimaryGalleryImage,
  addToUserCart,
  PLACEHOLDER_IMG
} from '@/api/api';
import './Wooaiwidget.css';

const FALLBACK_WELCOME = "Hello! Welcome to SreeMarket. How can I help you today?";
const FALLBACK_NAME = "SreeMarket Assistant";
const FALLBACK_COLOR = "#ff5722";

const SECTION_KEYS = ['bestselling', 'recommended', 'new_arrivals', 'offers'];
const SECTION_LABEL_MAP = { Bestselling: 'bestselling', 'Best Selling': 'bestselling', Recommended: 'recommended', 'New Arrival': 'new_arrivals', 'New Arrivals': 'new_arrivals', Offers: 'offers' };
const SECTION_META = {
  bestselling: { icon: Star, label: 'Best Selling' },
  recommended: { icon: ThumbsUp, label: 'Recommended' },
  new_arrivals: { icon: Zap, label: 'New Arrivals' },
  offers: { icon: Tag, label: 'Offers' },
};

const ICON_MAP = {
  ShoppingCart: ShoppingBag,
  RefreshCw: Package,
  Tag: Tag,
  Users: User,
  Search: Search,
  HelpCircle: FileText,
  Star: Star,
  ThumbsUp: ThumbsUp,
  Zap: Zap,
  Phone: Phone,
  FileText: FileText,
  User: User,
  Package: Package,
  ShoppingBag: ShoppingBag,
  Heart: Heart,
  MapPin: MapPin,
  CreditCard: CreditCard,
  ArrowLeft: ArrowLeft,
  List: List,
};

const ACCOUNT_SUB_ACTIONS = [
  { label: 'My Details',   icon: User,        action: 'details' },
  { label: 'Order History', icon: ShoppingBag, action: 'orders' },
  { label: 'Wishlist',     icon: Heart,       action: 'wishlist' },
  { label: 'Address',      icon: MapPin,      action: 'addresses' },
  { label: 'Invoices',     icon: CreditCard,  action: 'invoices' },
  { label: 'Back',         icon: ArrowLeft,   action: 'back' },
];

function formatMsgTime() {
  const d = new Date();
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function MsgTime() {
  return <span className="woo-bubble-time">{formatMsgTime()}</span>;
}

function TypingIndicator() {
  return (
    <div className="woo-msg woo-msg--bot">
      <div className="woo-bot-avatar">SM</div>
      <div className="woo-typing"><span /><span /><span /></div>
    </div>
  );
}

function CallbackForm({ onSubmitted }) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' });
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) return;
    setSending(true);
    try {
      await createWooAICallback({
        customerName: form.name,
        phone: form.phone,
        email: form.email || undefined,
        issue: form.message || 'Callback request',
        status: 'pending',
        priority: 'normal'
      });
      setDone(true);
      onSubmitted('✅ Your callback request has been submitted! Our team will contact you shortly.');
    } catch {
      setSending(false);
      onSubmitted('❌ Failed to submit. Please try again.');
    }
  };

  if (done) return null;

  return (
    <form className="woo-cb-form" onSubmit={handleSubmit}>
      <input className="woo-cb-input" placeholder="Full Name *" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} required />
      <input className="woo-cb-input" placeholder="Mobile Number *" type="tel" value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} required />
      <input className="woo-cb-input" placeholder="Email ID" type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} />
      <textarea className="woo-cb-input woo-cb-textarea" placeholder="Your Message" value={form.message} onChange={e => setForm(f => ({...f, message: e.target.value}))} rows={3} />
      <button className="woo-cb-submit" type="submit" disabled={sending}>{sending ? 'Submitting...' : 'Submit'}</button>
    </form>
  );
}

function PolicyAccordion({ policies, primaryColor }) {
  const [openIndex, setOpenIndex] = useState(null);
  return (
    <div className="woo-accordion">
      {policies.map((p, i) => (
        <div key={p.id || i} className={"woo-acc-item" + (openIndex === i ? ' woo-acc-item--open' : '')}>
          <button className="woo-acc-header" style={{ color: primaryColor }} onClick={() => setOpenIndex(openIndex === i ? null : i)}>
            <span className="woo-acc-title">{p.name}</span>
            <ChevronDown size={16} className={"woo-acc-chevron" + (openIndex === i ? ' woo-acc-chevron--open' : '')} />
          </button>
          <div className="woo-acc-body">
            <p>{p.content}</p>
            {p.category && <span className="woo-acc-cat">{p.category}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

function ProductCard({ product, primaryColor, onAddToCart }) {
  const imgSrc = getPrimaryGalleryImage(product) || PLACEHOLDER_IMG;
  return (
    <div className="woo-prod-card">
      <div className="woo-prod-card-img">
        <img src={imgSrc} alt={product.name} onError={e => { if (e.target.src !== PLACEHOLDER_IMG) e.target.src = PLACEHOLDER_IMG; }} />
      </div>
      <div className="woo-prod-card-body">
        <div className="woo-prod-card-title">{product.name}</div>
        <div className="woo-prod-card-price">₹{(product.regularPrice||0).toLocaleString('en-IN')}</div>
        <button className="woo-prod-card-btn" style={{ background: primaryColor }} onClick={onAddToCart}>
          <ShoppingBag size={14} /> Add to Cart
        </button>
      </div>
    </div>
  );
}

function ChatPanel({ open, onClose, msgs, typing, input, setInput, onSend, showGrid, gridActions, showSubGrid, subActions, endRef, inputRef, botName, tagline, primaryColor, welcomeText, onShowMenu, onEndSession, onNewChat }) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); }
  };
  const actions = showSubGrid ? subActions : gridActions;
  return (
    <div className={"woo-panel" + (open ? " woo-panel--open" : "")} role="dialog" aria-label={botName}>
      <div className="woo-hd" style={{ background: primaryColor }}>
        <div className="woo-hd-avatar" style={{ background: primaryColor + '40' }}>SM</div>
        <div className="woo-hd-info">
          <div className="woo-hd-name">{botName}</div>
          <div className="woo-hd-status"><span className="woo-online-dot" />Online &bull; {tagline || 'Replies instantly'}</div>
        </div>
        <button className="woo-close" onClick={onClose} aria-label="Close chat"><X size={18} /></button>
      </div>

      <div className="woo-body">
        {msgs.length === 0 && (
          <div className="woo-msg woo-msg--bot">
            <div className="woo-bot-avatar" style={{ background: primaryColor }}>SM</div>
            <div className="woo-bubble woo-bubble--bot">{welcomeText}</div>
          </div>
        )}

        {showGrid && actions.length > 0 && (
          <div className="woo-grid">
            {actions.map((item) => {
              const GridIcon = item.icon;
              return (
                <button key={item.label} className={"woo-grid-btn" + (item.action === 'back' ? ' woo-grid-btn--back' : '')} onClick={() => onSend(item.label)} aria-label={item.label}>
                  <GridIcon size={21} strokeWidth={1.5} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {msgs.map((m, i) => (
          <div key={i} className={"woo-msg woo-msg--" + m.role}>
            {m.role === 'bot' && <div className="woo-bot-avatar" style={{ background: primaryColor }}>SM</div>}
            <div className={"woo-bubble woo-bubble--" + m.role}>
              {m.component || m.text}
              <MsgTime />
            </div>
          </div>
        ))}

        {typing && <TypingIndicator />}
        <div ref={endRef} />
      </div>

      <div className="woo-actions-bar">
        <button className="woo-action-btn" onClick={onShowMenu}><List size={14} /> Quick Actions</button>
        <button className="woo-action-btn woo-action-btn--new" onClick={onNewChat}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg> New Chat</button>
        <button className="woo-action-btn woo-action-btn--end" onClick={onEndSession}><X size={14} /> End</button>
      </div>
      <div className="woo-input-row">
        <input
          ref={inputRef}
          className="woo-input"
          placeholder="Type a message..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="Chat input"
        />
        <button className="woo-icon-btn woo-mic" aria-label="Voice input"><Mic size={17} /></button>
        <button className="woo-icon-btn woo-send" style={{ background: primaryColor }} onClick={() => onSend()} aria-label="Send message"><Send size={15} /></button>
      </div>
      <div className="woo-footer">Powered by <strong>{botName}</strong></div>
    </div>
  );
}

function getLoggedInUser() {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export default function WooAIWidget() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [showGrid, setGrid] = useState(true);
  const [showSubGrid, setShowSubGrid] = useState(false);
  const [isMobile, setMobile] = useState(false);

  const [botName, setBotName] = useState(FALLBACK_NAME);
  const [tagline, setTagline] = useState('');
  const [primaryColor, setPrimaryColor] = useState(FALLBACK_COLOR);
  const [welcomeMsg, setWelcomeMsg] = useState(FALLBACK_WELCOME);
  const [gridActions, setGridActions] = useState([]);
  const [products, setProducts] = useState({});
  const [allProducts, setAllProducts] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [awaitingOrderInput, setAwaitingOrderInput] = useState(false);

  const [chatKey, setChatKey] = useState(0);
  const endRef = useRef(null);
  const inputRef = useRef(null);
  const lastEndRef = useRef(0);
  const NEW_SESSION_COOLDOWN = 3 * 60 * 1000; // 3 minutes

  useEffect(() => {
    (async () => {
      try {
        const s = await getWooAISettings();
        if (s) {
          setBotName(s.botName || FALLBACK_NAME);
          setTagline(s.tagline || '');
          setPrimaryColor(s.primaryColor || FALLBACK_COLOR);
          setWelcomeMsg(s.welcomeMessage || FALLBACK_WELCOME);
        }
      } catch { /* ignore */ }
    })();
    (async () => {
      try {
        const res = await getWooAIQuickActions();
        const actions = Array.isArray(res) ? res : [];
        const filtered = actions.filter(a => a.active).map(a => ({
          label: a.label,
          icon: ICON_MAP[a.icon] || Star
        }));
        if (filtered.length > 0) {
          setGridActions(filtered);
        } else {
          setGridActions([
            { label: 'Best Selling', icon: Star },
            { label: 'New Arrivals', icon: Zap },
            { label: 'Offers', icon: Tag },
            { label: 'Recommended', icon: ThumbsUp },
            { label: 'Track Order', icon: Package },
            { label: 'My Account', icon: User },
            { label: 'Search Product', icon: Search },
            { label: 'Policies', icon: FileText },
            { label: 'Callbacks', icon: Phone },
          ]);
        }
      } catch {
        setGridActions([
          { label: 'Best Selling', icon: Star },
          { label: 'New Arrivals', icon: Zap },
          { label: 'Offers', icon: Tag },
          { label: 'Recommended', icon: ThumbsUp },
          { label: 'Track Order', icon: Package },
          { label: 'My Account', icon: User },
          { label: 'Search Product', icon: Search },
          { label: 'Policies', icon: FileText },
          { label: 'Callbacks', icon: Phone },
        ]);
      }
    })();
    (async () => {
      const result = {};
      try {
        for (const key of SECTION_KEYS) {
          const res = await getWooAIProductAssignments(key);
          result[key] = Array.isArray(res) ? res.map(item => typeof item === 'string' ? item : item.productId).filter(Boolean) : [];
        }
      } catch { /* ignore */ }
      setProducts(result);
    })();
    (async () => {
      try {
        const res = await getAllProducts();
        setAllProducts(Array.isArray(res) ? res : []);
      } catch { /* ignore */ }
    })();
    (async () => {
      try {
        const res = await getWooAIPolicies();
        setPolicies(Array.isArray(res) ? res.filter(p => p.active) : []);
      } catch { /* ignore */ }
    })();
  }, []);

  useEffect(() => {
    const check = () => setMobile(window.innerWidth <= 480);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
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

  useEffect(() => {
    if (!open) return;
    const elapsed = Date.now() - lastEndRef.current;
    if (elapsed < NEW_SESSION_COOLDOWN && chatKey > 0) {
      setMsgs(m => [...m, { role: 'bot', text: `⏳ Please wait a moment before starting a new chat. You can continue in ${Math.ceil((NEW_SESSION_COOLDOWN - elapsed) / 60000)} minute(s).` }]);
      return;
    }
    (async () => {
      try {
        const res = await createWooAIChatSession(0, 'Guest', 'General Inquiry');
        if (res && res.id) setSessionId(res.id);
      } catch { /* ignore */ }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, chatKey]);

  async function fetchAccountData(action) {
    const user = getLoggedInUser();
    if (!user) return "You need to be logged in to view this. Please log in to your account first.";

    try {
      switch (action) {
        case 'details': {
          const d = await getUserDetails(user.userId || user.id);
          return `👤 **My Details**\n\nName: ${d.fullName || 'N/A'}\nEmail: ${d.email || 'N/A'}\nPhone: ${d.phone || 'N/A'}\nRole: ${d.roleId === 1 ? 'Admin' : d.roleId === 3 ? 'Vendor' : 'Customer'}`;
        }
        case 'orders': {
          const orders = await fetchUserOrders(user.userId || user.id);
          if (!orders || orders.length === 0) return "📦 **Order History**\n\nYou have no orders yet. Start shopping to see your orders here!";
          const lines = orders.slice(0, 10).map(o =>
            `• ${o.orderNumber || '#'+o.id} — ${o.status} — ₹${o.totalAmount?.toLocaleString?.('en-IN') || o.totalAmount}`
          );
          return `📦 **Order History** (${orders.length} orders)\n\n${lines.join('\n')}`;
        }
        case 'wishlist': {
          const items = await fetchUserWishlist(user.userId || user.id);
          if (!items || items.length === 0) return "❤️ **Wishlist**\n\nYour wishlist is empty. Browse products and add your favorites!";
          const lines = items.slice(0, 10).map((item, i) => {
            const p = item.product || item;
            return `${i+1}. ${p.name || p.productName || 'Product'} — ₹${p.price?.toLocaleString?.('en-IN') || p.discountPrice || 'N/A'}`;
          });
          return `❤️ **Wishlist** (${items.length} items)\n\n${lines.join('\n')}`;
        }
        case 'addresses': {
          const addrs = await fetchUserAddresses(user.userId || user.id);
          if (!addrs || addrs.length === 0) return "📍 **Saved Addresses**\n\nNo addresses saved. Add an address in your account settings.";
          const lines = addrs.map((a, i) =>
            `${i+1}. ${a.streetAddress}, ${a.city}, ${a.state} ${a.zipCode}, ${a.country}${a.isDefaultAddress ? ' (Default)' : ''}`
          );
          return `📍 **Saved Addresses** (${addrs.length})\n\n${lines.join('\n\n')}`;
        }
        case 'invoices':
          return "🧾 **Invoices**\n\nYou can view and download your invoices from your account settings page.";
        default:
          return null;
      }
    } catch (err) {
      return "Sorry, I couldn't fetch that information right now. Please try again later.";
    }
  }

  async function addToCartFromWidget(product, user) {
    if (!user) {
      setMsgs(prev => [...prev, { role: 'bot', text: '⚠️ Please log in first to add items to your cart.' }]);
      return;
    }
    try {
      await addToUserCart(user.userId || user.id, { productId: product.id, quantity: 1 });
    } catch {
      setMsgs(prev => [...prev, { role: 'bot', text: '❌ Failed to add to cart. Please try again.' }]);
    }
  }

  const send = useCallback(async (labelOverride) => {
    const text = labelOverride || input.trim();
    if (!text) return;
    const isAction = !!labelOverride;

    setInput('');
    setMsgs(m => [...m, { role: 'user', text }]);

    if (sessionId) {
      try { await addWooAIMessage(sessionId, text, 'USER'); } catch { /* ignore */ }
    }

    if (awaitingOrderInput && !isAction) {
      setAwaitingOrderInput(false);
      setGrid(true);
      setShowSubGrid(false);
      setTyping(true);
      let orderReply;
      try {
        const isNumeric = /^\d+$/.test(text);
        const data = isNumeric ? await lookupOrderById(Number(text)) : await trackOrderByNumber(text);
        orderReply = `📦 **Order ${data.orderNumber}**\n` +
          `Status: *${data.status}*\n` +
          `Customer: ${data.customerName || 'N/A'}\n` +
          `Total: ₹${data.totalAmount?.toLocaleString?.('en-IN') || data.totalAmount}\n` +
          `Delivery: ${data.deliveryLocation || 'N/A'}\n` +
          `Est. Delivery: ${data.estimatedDelivery || 'N/A'}\n\n` +
          `Want to track another order? Just type the order number!`;
      } catch {
        orderReply = `Sorry, I couldn't find an order matching "${text}". Please check the order number and try again.`;
      }
      setTimeout(async () => {
        setTyping(false);
        setMsgs(m => [...m, { role: 'bot', text: orderReply }]);
        if (sessionId) {
          try { await addWooAIMessage(sessionId, orderReply, 'BOT'); } catch { /* ignore */ }
        }
      }, 600 + Math.random() * 300);
      return;
    }

    if (isAction) {
      const subAction = ACCOUNT_SUB_ACTIONS.find(a => a.label === text);

      if (subAction) {
        if (subAction.action === 'back') {
          setShowSubGrid(false);
          setGrid(true);
          const reply = "Back to main menu. How can I help you?";
          setTyping(true);
          setTimeout(async () => {
            setTyping(false);
            setMsgs(m => [...m, { role: 'bot', text: reply }]);
            if (sessionId) {
              try { await addWooAIMessage(sessionId, reply, 'BOT'); } catch { /* ignore */ }
            }
          }, 400);
          return;
        }

        setGrid(false);
        setShowSubGrid(false);
        setTyping(true);
        const accountReply = await fetchAccountData(subAction.action);
        setTimeout(async () => {
          setTyping(false);
          setMsgs(m => [...m, { role: 'bot', text: accountReply }]);
          if (sessionId) {
            try { await addWooAIMessage(sessionId, accountReply, 'BOT'); } catch { /* ignore */ }
          }
        }, 600 + Math.random() * 400);
        return;
      }

      const key = SECTION_LABEL_MAP[text];
      if (key && products[key]) {
        const assignedIds = products[key];
        setGrid(false);
        setShowSubGrid(false);
        if (!assignedIds || assignedIds.length === 0) {
          const reply = "I don't have any products listed in this section right now. Check back soon!";
          setTyping(true);
          setTimeout(async () => {
            setTyping(false);
            setMsgs(m => [...m, { role: 'bot', text: reply }]);
            if (sessionId) {
              try { await addWooAIMessage(sessionId, reply, 'BOT'); } catch { /* ignore */ }
            }
          }, 800 + Math.random() * 400);
          return;
        }
        const matched = allProducts.filter(p => assignedIds.includes(String(p.id)) || assignedIds.includes(Number(p.id))).slice(0, 10);
        const label = SECTION_META[key].label;
        const user = getLoggedInUser();
        if (matched.length === 0) {
          const reply = "Products for this section are being set up. Check back soon!";
          setTyping(true);
          setTimeout(async () => {
            setTyping(false);
            setMsgs(m => [...m, { role: 'bot', text: reply }]);
            if (sessionId) {
              try { await addWooAIMessage(sessionId, reply, 'BOT'); } catch { /* ignore */ }
            }
          }, 800 + Math.random() * 400);
          return;
        }
        const productCards = matched.map(p => (
          <ProductCard key={p.id} product={p} primaryColor={primaryColor} onAddToCart={() => {
            addToCartFromWidget(p, user);
            const confirm = `✅ **${p.name}** added to your cart!`;
            setMsgs(prev => [...prev, { role: 'bot', text: confirm }]);
            if (sessionId) {
              addWooAIMessage(sessionId, confirm, 'BOT').catch(() => {});
            }
          }} />
        ));
        const msgText = `Here are our ${label}:`;
        setMsgs(m => [...m, { role: 'bot', component: <><p>{msgText}</p><div className="woo-prod-grid">{productCards}</div></>, text: '' }]);
        if (sessionId) {
          try { await addWooAIMessage(sessionId, msgText, 'BOT'); } catch { /* ignore */ }
        }
        return;
      }

      if (text === 'Policies') {
        setGrid(false);
        setShowSubGrid(false);
        if (policies.length === 0) {
          const reply = "No policies are currently available. Please visit the Policies page on our website or contact support for assistance.";
          setTyping(true);
          setTimeout(async () => {
            setTyping(false);
            setMsgs(m => [...m, { role: 'bot', text: reply }]);
            if (sessionId) {
              try { await addWooAIMessage(sessionId, reply, 'BOT'); } catch { /* ignore */ }
            }
          }, 800 + Math.random() * 400);
          return;
        }
        setMsgs(m => [...m, { role: 'bot', component: <PolicyAccordion policies={policies} primaryColor={primaryColor} />, text: '' }]);
        if (sessionId) {
          try { await addWooAIMessage(sessionId, 'Showing ' + policies.length + ' policies', 'BOT'); } catch { /* ignore */ }
        }
        return;
      }

      if (text === 'Callbacks') {
        setGrid(false);
        setShowSubGrid(false);
        setMsgs(m => [...m, { role: 'bot', component: <CallbackForm onSubmitted={(msg) => {
          setMsgs(prev => [...prev, { role: 'bot', text: msg }]);
          if (sessionId) {
            addWooAIMessage(sessionId, msg, 'BOT').catch(() => {});
          }
        }} />, text: '' }]);
        if (sessionId) {
          try { await addWooAIMessage(sessionId, 'Requesting callback', 'BOT'); } catch { /* ignore */ }
        }
        return;
      }

      if (text === 'Track Order') {
        setGrid(false);
        setShowSubGrid(false);
        setAwaitingOrderInput(true);
        const reply = "Please enter your order number (e.g. ORD-12345) or order ID and I'll pull up the latest status for you right away!";
        setTyping(true);
        setTimeout(async () => {
          setTyping(false);
          setMsgs(m => [...m, { role: 'bot', text: reply }]);
          if (sessionId) {
            try { await addWooAIMessage(sessionId, reply, 'BOT'); } catch { /* ignore */ }
          }
        }, 800 + Math.random() * 400);
        return;
      }

      if (text === 'My Account') {
        setGrid(false);
        setShowSubGrid(true);
        const reply = "What would you like to see?";
        setTyping(true);
        setTimeout(async () => {
          setTyping(false);
          setMsgs(m => [...m, { role: 'bot', text: reply }]);
          if (sessionId) {
            try { await addWooAIMessage(sessionId, reply, 'BOT'); } catch { /* ignore */ }
          }
        }, 600);
        return;
      }

      if (text === 'Search Product') {
        setGrid(false);
        setShowSubGrid(false);
        const reply = "Sure! What product are you looking for? Just type a name, category, or keyword.";
        setTyping(true);
        setTimeout(async () => {
          setTyping(false);
          setMsgs(m => [...m, { role: 'bot', text: reply }]);
          if (sessionId) {
            try { await addWooAIMessage(sessionId, reply, 'BOT'); } catch { /* ignore */ }
          }
        }, 800 + Math.random() * 400);
        return;
      }

      // Fallback for unknown action
      setGrid(false);
      setShowSubGrid(false);
      const reply = "Thanks for your message! Let me look that up for you. One moment...";
      setTyping(true);
      setTimeout(async () => {
        setTyping(false);
        setMsgs(m => [...m, { role: 'bot', text: reply }]);
        if (sessionId) {
          try { await addWooAIMessage(sessionId, reply, 'BOT'); } catch { /* ignore */ }
        }
      }, 800 + Math.random() * 400);
      return;
    }

    // Non-action message — get real auto-reply from backend
    setGrid(false);
    setShowSubGrid(false);
    setTyping(true);
    try {
      const updatedSession = await addWooAIMessage(sessionId, text, 'USER');
      if (updatedSession && updatedSession.messages) {
        const botMessages = updatedSession.messages.filter(m => m.role === 'BOT');
        if (botMessages.length > 0) {
          const lastBot = botMessages[botMessages.length - 1];
          setTyping(false);
          setMsgs(m => [...m, { role: 'bot', text: lastBot.content || lastBot.text }]);
          return;
        }
      }
    } catch { /* fallback below */ }

    // Fallback if API fails
    const reply = "Thanks for your message! Let me look that up for you. One moment...";
    setTimeout(async () => {
      setTyping(false);
      setMsgs(m => [...m, { role: 'bot', text: reply }]);
      if (sessionId) {
        try { await addWooAIMessage(sessionId, reply, 'BOT'); } catch { /* ignore */ }
      }
    }, 800 + Math.random() * 400);
  }, [input, sessionId, products, allProducts, policies, awaitingOrderInput, primaryColor]);

  const handleOpen = () => { setOpen(true); };

  const endCurrentSession = useCallback(async () => {
    if (sessionId) {
      try { await endWooAISession(sessionId); } catch { /* ignore */ }
    }
    lastEndRef.current = Date.now();
    setSessionId(null);
  }, [sessionId]);

  const handleClose = () => {
    setOpen(false);
    setShowSubGrid(false);
    setAwaitingOrderInput(false);
    endCurrentSession();
  };

  const handleShowMenu = () => {
    setGrid(true);
    setShowSubGrid(false);
    setMsgs(m => [...m, { role: 'bot', text: 'Here are the available options. How can I help you?' }]);
  };

  const handleEndSession = () => {
    setMsgs(m => [...m, { role: 'bot', text: '👋 Thank you for chatting with us! Feel free to come back anytime.' }]);
    setTimeout(() => {
      handleClose();
    }, 1500);
  };

  const handleNewChat = async () => {
    if (sessionId) {
      try { await endWooAISession(sessionId); } catch { /* ignore */ }
    }
    setSessionId(null);
    setMsgs([]);
    setGrid(true);
    setShowSubGrid(false);
    setAwaitingOrderInput(false);
    setChatKey(k => k + 1);
  };

  const welcomeText = msgs.length > 0 ? msgs[0].text : welcomeMsg;

  return (
    <>
      {open && isMobile && <div className="woo-backdrop" onClick={handleClose} />}

      <ChatPanel
        open={open}
        onClose={handleClose}
        msgs={msgs}
        typing={typing}
        input={input}
        setInput={setInput}
        onSend={send}
        showGrid={showGrid}
        gridActions={gridActions}
        showSubGrid={showSubGrid}
        subActions={ACCOUNT_SUB_ACTIONS}
        endRef={endRef}
        inputRef={inputRef}
        botName={botName}
        tagline={tagline}
        primaryColor={primaryColor}
        welcomeText={welcomeText}
        onShowMenu={handleShowMenu}
        onEndSession={handleEndSession}
        onNewChat={handleNewChat}
      />

      <div className="woo-root">
        <button
          className={"woo-fab" + (open && isMobile ? " woo-fab--hidden" : "")}
          onClick={() => open ? handleClose() : handleOpen()}
          aria-label={open ? 'Close chat' : 'Open chat'}
          style={{ background: primaryColor, boxShadow: `0 6px 24px ${primaryColor}80` }}
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
