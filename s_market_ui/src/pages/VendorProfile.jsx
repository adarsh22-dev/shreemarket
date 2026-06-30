import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { getVendorById, getVendorProducts, getVendorReviews, getVendorReviewStats, BACKEND_URL, getPrimaryGalleryImage } from '../api/api';
import './VendorProfile.css';
import {
  Heart, Star, MapPin, Phone, Mail, Package,
  ChevronRight, ChevronLeft, Shield, Award, Clock,
  Grid, List, Search, ShoppingCart,
  Leaf, Droplets, Wheat, FlaskConical, Sparkles, Box,
  CheckCircle, AlertCircle, Lock, Share2, MessageCircle,
  Truck, RotateCcw, FileText, Building2, CreditCard,
  Loader2,
} from 'lucide-react';

/* ─── Default Vendor (fallback) ─── */
const DEFAULT_VENDOR = {
  id: '', name: 'Loading...',
  tagline: 'Loading vendor information...',
  owner: '', email: '',
  phone: '',
  city: '', since: '',
  rating: 0, reviews: 0, totalProducts: 0,
  fulfillment: '-', responseTime: '-',
  category: '', verified: false, featured: false,
};

const INITIAL_PRODUCTS = [
  { id:1, name:'Walnut Broken Kernels',          tag:'Low Stock',      orange:true,  price:1092, mrp:1365, cat:'Nuts',       origin:'Kashmir, India',     Icon:Leaf        },
  { id:2, name:'Sandalwood & Saffron Soap',       tag:'Community Fave', orange:false, price:299,  mrp:589,  cat:'Soaps',      origin:'Mysore, India',      Icon:Sparkles    },
  { id:3, name:'Cold-Pressed Mustard Oil 1L',     tag:'Sustainable',    orange:false, price:280,  mrp:350,  cat:'Oils',       origin:'Rajasthan, India',   Icon:Droplets    },
  { id:4, name:'Organic Turmeric Powder 100g',    tag:'Only 3 Left',    orange:true,  price:120,  mrp:180,  cat:'Spices',     origin:'Kerala, India',      Icon:FlaskConical},
  { id:5, name:'Brown Rice 5kg Premium',          tag:'Sustainable',    orange:false, price:350,  mrp:480,  cat:'Grains',     origin:'West Bengal, India', Icon:Wheat       },
  { id:6, name:'Farm Fresh Organic Tomatoes 1kg', tag:'Community Fave', orange:false, price:60,   mrp:90,   cat:'Vegetables', origin:'Nashik, India',      Icon:Leaf        },
  { id:7, name:'Organic Spinach 250g',            tag:'Low Stock',      orange:true,  price:45,   mrp:65,   cat:'Vegetables', origin:'Pune, India',        Icon:Leaf        },
  { id:8, name:'Himalayan Pink Salt 500g',        tag:'New Arrival',    orange:false, price:180,  mrp:240,  cat:'Spices',     origin:'Himachal, India',    Icon:Box         },
];

const REVIEWS = [
  { id:1, name:'Anjali M.',  av:'AM', rating:5, date:'8 Jan 2025',  text:'Excellent quality products! The organic spinach is always fresh and delivered on time.',          product:'Organic Spinach 250g'     },
  { id:2, name:'Rohit S.',   av:'RS', rating:4, date:'5 Jan 2025',  text:'Good products overall. Packaging could be better but the quality is top notch.',                  product:'Sandalwood Soap'          },
  { id:3, name:'Priya K.',   av:'PK', rating:5, date:'2 Jan 2025',  text:'Fast delivery and fresh produce. The farm-to-door concept really works!',                        product:'Farm Fresh Tomatoes'      },
  { id:4, name:'Suresh V.',  av:'SV', rating:3, date:'28 Dec 2024', text:'Average experience. Products are good but delivery was delayed by 2 days.',                       product:'Cold-Pressed Mustard Oil' },
  { id:5, name:'Meena T.',   av:'MT', rating:5, date:'20 Dec 2024', text:'Love this vendor! Everything is organic and well-packaged. Highly recommended.',                  product:'Walnut Broken Kernels'    },
  { id:6, name:'Vikram P.',  av:'VP', rating:4, date:'15 Dec 2024', text:'Great range of organic products. Prices are fair and packaging is eco-friendly.',                 product:'Brown Rice 5kg'           },
];

const TAGS = ['All', 'Vegetables', 'Oils', 'Spices', 'Grains', 'Nuts', 'Soaps'];
const disc = (p, m) => Math.round((m - p) / m * 100);

/* ─── Stars ─── */
const Stars = ({ rating, size = 14 }) => (
  <span className="vp-stars">
    {[1,2,3,4,5].map(i => (
      <Star key={i} size={size}
        fill={i <= Math.round(rating) ? '#FF5722' : 'none'}
        color={i <= Math.round(rating) ? '#FF5722' : '#ddd'} />
    ))}
  </span>
);

/* ─── Toast ─── */
const Toast = ({ msg, visible }) => (
  <div className={`vp-toast${visible ? ' vp-toast--on' : ''}`}>{msg}</div>
);

/* ─── RatingBar ─── */
const RatingBar = ({ label, count, total }) => (
  <div className="vp-rbar">
    <span className="vp-rbar-lbl">{label}</span>
    <div className="vp-rbar-track">
      <div className="vp-rbar-fill" style={{ width: `${total > 0 ? Math.round(count/total*100) : 0}%` }} />
    </div>
    <span className="vp-rbar-cnt">{count}</span>
  </div>
);

/* ─── Product Card ─── */
const ProductCard = ({ p, onWish, onCart, list }) => {
  const Icon = p.Icon;
  const productImage = getPrimaryGalleryImage(p);

  return (
    <Link to={`/product/${p.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div className={`vp-card${list ? ' vp-card--list' : ''}`}>
        <div className="vp-card-img">
          <button className={`vp-wish${p.wishlisted ? ' on' : ''}`}
            onClick={e => { e.stopPropagation(); onWish(p.id); }}>
            <Heart size={14} fill={p.wishlisted ? '#FF5722' : 'none'}
              color={p.wishlisted ? '#FF5722' : '#000'} />
          </button>
          <span className="vp-badge" style={p.orange ? { color:'#FF5722' } : {}}>{p.tag}</span>
          {productImage ? (
            <img src={productImage} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'contain', background: 'white' }} />
          ) : (
            <div className="vp-card-icon"><Icon size={52} color="#d4d4d4" strokeWidth={1} /></div>
          )}
        </div>
        <div className="vp-card-body">
          <h3 className="vp-card-name">{p.name}</h3>
          <p className="vp-card-origin">{p.cat} · {p.origin}</p>
          <div className="vp-card-prices">
            <span className="vp-price">₹{p.price.toLocaleString('en-IN')}</span>
            {p.mrp > p.price && <span className="vp-mrp">₹{p.mrp.toLocaleString('en-IN')}</span>}
            {p.mrp > p.price && <span className="vp-disc">-{disc(p.price, p.mrp)}%</span>}
          </div>
        </div>
        <button className="vp-cart-btn" onClick={e => { e.stopPropagation(); e.preventDefault(); onCart(p.id); }}>
          <ShoppingCart size={14} /> Add to Cart
        </button>
      </div>
    </Link>
  );
};

/* ─── Main ─── */
export default function VendorProfile() {
  const tagRowRef = useRef(null);
  const [searchParams] = useSearchParams();
  const vendorId = searchParams.get('vendorId');

  const [tab,       setTab]      = useState('products');
  const [tag,       setTag]      = useState('All');
  const [sort,      setSort]     = useState('default');
  const [view,      setView]     = useState('grid');
  const [search,    setSearch]   = useState('');
  const [canL,      setCanL]     = useState(false);
  const [canR,      setCanR]     = useState(true);
  const [followed,  setFollowed] = useState(false);
  const [cart,      setCart]     = useState({});
  const [email,     setEmail]    = useState('');
  const [subbed,    setSubbed]   = useState(false);
  const [inquiry,   setInquiry]  = useState(false);
  const [toast,     setToast]    = useState({ msg:'', visible:false });
  const [loading,   setLoading]  = useState(true);
  const [vendor,    setVendor]   = useState(DEFAULT_VENDOR);
  const [products,  setProducts] = useState([]);
  const [reviews,   setReviews]  = useState([]);
  const [reviewStats, setReviewStats] = useState({ averageRating: 0, totalReviews: 0, distribution: {} });
  const [store,     setStore]    = useState(null);

  // Fetch vendor data
  useEffect(() => {
    const fetchVendorData = async () => {
      if (!vendorId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Fetch vendor details
        const vendorData = await getVendorById(vendorId);
        const vendorStore = vendorData.stores && vendorData.stores.length > 0 ? vendorData.stores[0] : null;
        setStore(vendorStore);

        setVendor({
          id: vendorData.id || vendorId,
          name: vendorStore?.storeName || vendorData.fullName || 'Vendor',
          tagline: vendorStore?.storeDescription || 'Quality products from a trusted vendor.',
          owner: vendorData.fullName || '',
          email: vendorData.email || '',
          phone: vendorData.phone || '',
          city: vendorStore ? `${vendorStore.city || ''}, ${vendorStore.state || ''}`.replace(/^,\s*|,\s*$/g, '') : '',
          since: vendorData.createdAt ? new Date(vendorData.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : '',
          rating: 0,
          reviews: 0,
          totalProducts: 0,
          fulfillment: '98%',
          responseTime: '< 2 hrs',
          category: vendorStore?.storeDescription?.substring(0, 30) || 'General',
          verified: vendorData.status === 'Active' || vendorData.status === 'Approved',
          featured: false,
          storeLogo: vendorStore?.storeLogo || null,
          paymentMethod: vendorData.paymentMethod || '',
        });

        // Fetch vendor products
        try {
          const productsData = await getVendorProducts(vendorId);
          const productsList = Array.isArray(productsData) ? productsData : productsData?.content || [];
          const mappedProducts = productsList.map((p, idx) => ({
            id: p.id,
            name: p.name,
            tag: p.discountPrice ? 'Sale' : 'New',
            orange: idx % 2 === 0,
            price: p.discountPrice || p.regularPrice || 0,
            mrp: p.regularPrice || 0,
            cat: p.category || 'General',
            origin: vendorStore ? `${vendorStore.city || ''}, ${vendorStore.state || ''}`.replace(/^,\s*|,\s*$/g, '') : '',
            Icon: Leaf,
            wishlisted: false,
            media: p.media || [],
            shortDescription: p.shortDescription || '',
            averageRating: p.averageRating || 0,
            reviewCount: p.reviewCount || 0,
          }));
          setProducts(mappedProducts);
          setVendor(prev => ({ ...prev, totalProducts: mappedProducts.length }));
        } catch (err) {
          console.error('Failed to fetch vendor products:', err);
        }

        // Fetch vendor review stats
        try {
          const stats = await getVendorReviewStats(vendorId);
          setReviewStats(stats);
          setVendor(prev => ({
            ...prev,
            rating: stats.averageRating || 0,
            reviews: stats.totalReviews || 0,
          }));
        } catch (err) {
          console.error('Failed to fetch review stats:', err);
        }

        // Fetch vendor reviews
        try {
          const reviewsData = await getVendorReviews(vendorId);
          const reviewsList = Array.isArray(reviewsData) ? reviewsData : reviewsData?.content || [];
          const mappedReviews = reviewsList.map(r => ({
            id: r.id,
            name: r.reviewerName || 'Anonymous',
            av: (r.reviewerName || 'AN').substring(0, 2).toUpperCase(),
            rating: r.rating || 5,
            date: r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '',
            text: r.title ? `${r.title} - ${r.text || ''}` : r.text || '',
            product: r.productName || '',
          }));
          setReviews(mappedReviews);
        } catch (err) {
          console.error('Failed to fetch vendor reviews:', err);
        }

      } catch (err) {
        console.error('Failed to fetch vendor data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchVendorData();
  }, [vendorId]);

  const cartTotal = Object.values(cart).reduce((a, b) => a + b, 0);

  /* scroll arrows */
  const checkScroll = useCallback(() => {
    const el = tagRowRef.current;
    if (!el) return;
    setCanL(el.scrollLeft > 0);
    setCanR(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  }, []);

  useEffect(() => {
    const el = tagRowRef.current;
    if (!el) return;
    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);
    checkScroll();
    return () => { el.removeEventListener('scroll', checkScroll); window.removeEventListener('resize', checkScroll); };
  }, [tab, checkScroll]);

  const scrollTags = dir => tagRowRef.current?.scrollBy({ left: dir === 'l' ? -260 : 260, behavior: 'smooth' });

  /* toast */
  const flash = msg => {
    setToast({ msg, visible: true });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 2000);
  };

  /* actions */
  const handleWish = id => setProducts(ps => ps.map(p => {
    if (p.id !== id) return p;
    const next = { ...p, wishlisted: !p.wishlisted };
    flash(next.wishlisted ? '❤️ Added to wishlist' : 'Removed from wishlist');
    return next;
  }));

  const handleCart = id => {
    setCart(c => ({ ...c, [id]: (c[id] || 0) + 1 }));
    flash('🛒 Added to cart!');
  };

  const handleFollow = () => {
    setFollowed(v => !v);
    flash(followed ? 'Unfollowed store' : `✓ Now following ${vendor.name}`);
  };

  const handleInquiry = () => {
    if (inquiry) return;
    setInquiry(true);
    flash('📩 Inquiry sent! We\'ll reply shortly.');
    setTimeout(() => setInquiry(false), 3000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: vendor.name, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(window.location.href);
      flash('🔗 Link copied to clipboard!');
    }
  };

  const handleSubscribe = e => {
    e.preventDefault();
    if (!email.includes('@')) { flash('⚠️ Enter a valid email'); return; }
    setSubbed(true); setEmail('');
    flash('🎉 Subscribed successfully!');
  };

  /* filtered products */
  const filtered = products
    .filter(p => tag === 'All' || p.cat === tag)
    .filter(p => !search.trim() || p.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === 'price-asc')  return a.price - b.price;
      if (sort === 'price-desc') return b.price - a.price;
      if (sort === 'discount')   return disc(b.price, b.mrp) - disc(a.price, a.mrp);
      return 0;
    });

  // Loading state
  if (loading) {
    return (
      <div className="vp-root">
        <Navbar />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' }}>
          <Loader2 size={48} className="animate-spin" color="#FF5722" />
          <p style={{ color: '#8A7F75', fontSize: '1.1rem' }}>Loading vendor profile...</p>
        </div>
        <Footer />
      </div>
    );
  }

  // No vendorId provided
  if (!vendorId) {
    return (
      <div className="vp-root">
        <Navbar />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", color: '#2C2C2C' }}>Vendor Not Found</h2>
          <p style={{ color: '#8A7F75' }}>No vendor ID provided. Please go back and select a vendor.</p>
          <Link to="/shop" className="vp-btn-solid" style={{ textDecoration: 'none' }}>Browse Products</Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="vp-root">
      <Navbar />
      <Toast msg={toast.msg} visible={toast.visible} />

      {/* ── BANNER ── */}
      <header className="vp-banner">
        <div className="vp-banner-overlay" />
        <div className="vp-banner-body">
          <span className="vp-banner-tag">Vendor Profile / {vendor.category}</span>
          <h1 className="vp-banner-title">
            {vendor.name}<br />
            <span className="vp-orange">Trusted Vendor.</span>
          </h1>
          <p className="vp-banner-sub">{vendor.tagline}</p>
          <div className="vp-banner-btns">
            <button className="vp-btn-solid" onClick={() => setTab('products')}>Browse Products</button>
            <button className={`vp-btn-ghost${followed ? ' vp-btn-ghost--on' : ''}`} onClick={handleFollow}>
              <Heart size={14} fill={followed ? '#fff' : 'none'} />
              {followed ? 'Following' : 'Follow Store'}
            </button>
          </div>
        </div>
        <div className="vp-banner-actions">
          <button className={`vp-action-btn${inquiry ? ' sent' : ''}`} onClick={handleInquiry} disabled={inquiry}>
            <AlertCircle size={13} /> {inquiry ? 'Sent!' : 'Inquiry'}
          </button>
          <button className="vp-action-btn" onClick={handleShare}>
            <Share2 size={13} /> Share
          </button>
        </div>
        {cartTotal > 0 && (
          <div className="vp-cart-pill"><ShoppingCart size={14} /> {cartTotal} item{cartTotal > 1 ? 's' : ''}</div>
        )}
      </header>

      {/* ── INFO BAND ── */}
      <section className="vp-info-band">
        <div className="vp-avatar-wrap">
          <div className="vp-avatar">OR</div>
          {vendor.verified && <span className="vp-dot"><Shield size={10} color="#fff" /></span>}
        </div>

        <div className="vp-identity">
          <div className="vp-name-row">
            <h2 className="vp-name">{vendor.name}</h2>
            {vendor.verified && <span className="vp-pill vp-pill--verified"><CheckCircle size={10} /> Verified</span>}
            {vendor.featured && <span className="vp-pill vp-pill--featured"><Award size={10} /> Featured</span>}
          </div>
          <div className="vp-meta-row">
            <span className="vp-meta"><MapPin size={12} /> {vendor.city}</span>
            <a href={`tel:${vendor.phone}`} className="vp-meta vp-meta-a"><Phone size={12} /> {vendor.phone}</a>
            <a href={`mailto:${vendor.email}`} className="vp-meta vp-meta-a"><Mail size={12} /> {vendor.email}</a>
          </div>
          <div className="vp-meta-row">
            <Stars rating={vendor.rating} />
            <b className="vp-rating-num">{vendor.rating}</b>
            <span className="vp-muted">({vendor.reviews} reviews)</span>
            <span className="vp-meta"><Clock size={12} /> Since {vendor.since}</span>
          </div>
        </div>

        <div className="vp-stats">
          {[[vendor.totalProducts, 'Products'], [vendor.fulfillment, 'Fulfilment'], [vendor.responseTime, 'Response']].map(([v, l]) => (
            <div className="vp-stat" key={l}>
              <div className="vp-stat-v">{v}</div>
              <div className="vp-stat-l">{l}</div>
            </div>
          ))}
        </div>

        <div className="vp-actions">
          <button className={followed ? 'vp-btn-solid' : 'vp-btn-outline'} onClick={handleFollow}>
            <Heart size={13} fill={followed ? '#fff' : 'none'} /> {followed ? 'Following' : 'Follow'}
          </button>
          <a href={`mailto:${vendor.email}`} className="vp-btn-outline">
            <Mail size={13} /> Message
          </a>
        </div>
      </section>

      {/* ── TABS ── */}
      <nav className="vp-tabs-wrap">
        <div className="vp-tabs">
          {['products','about','policies','reviews'].map(t => (
            <button key={t} className={`vp-tab${tab === t ? ' on' : ''}`} onClick={() => setTab(t)}>
              {t === 'reviews' ? `Reviews (${vendor.reviews})` : t[0].toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </nav>

      {/* ════ PRODUCTS ════ */}
      {tab === 'products' && (
        <div className="vp-section">
          {/* toolbar */}
          <div className="vp-toolbar">
            <div className="vp-toolbar-left">
              <h2 className="vp-section-title">Browse Products</h2>
              <p className="vp-section-sub">
                {filtered.length} of {products.length} items
                {tag !== 'All' && <span className="vp-orange"> · {tag}</span>}
              </p>
            </div>
            <div className="vp-toolbar-right">
              <div className="vp-search-box">
                <Search size={13} color="#bbb" />
                <input className="vp-search-input" placeholder="Search…"
                  value={search} onChange={e => setSearch(e.target.value)} />
                {search && <button className="vp-clear" onClick={() => setSearch('')}>×</button>}
              </div>
              <select className="vp-sort-sel" value={sort} onChange={e => setSort(e.target.value)}>
                <option value="default">Default</option>
                <option value="price-asc">Price ↑</option>
                <option value="price-desc">Price ↓</option>
                <option value="discount">Discount</option>
              </select>
              <button className={`vp-view-btn${view === 'grid' ? ' on' : ''}`} onClick={() => setView('grid')}><Grid size={15} /></button>
              <button className={`vp-view-btn${view === 'list' ? ' on' : ''}`} onClick={() => setView('list')}><List size={15} /></button>
            </div>
          </div>

          {/* category pills */}
          <div className="vp-pills-wrap">
            {canL && <button className="vp-scroll-btn" onClick={() => scrollTags('l')}><ChevronLeft size={16} /></button>}
            <div className="vp-pills-row" ref={tagRowRef}>
              {TAGS.map(t => (
                <button key={t} className={`vp-pill${tag === t ? ' on' : ''}`} onClick={() => setTag(t)}>{t}</button>
              ))}
            </div>
            {canR && <button className="vp-scroll-btn" onClick={() => scrollTags('r')}><ChevronRight size={16} /></button>}
          </div>

          {/* grid */}
          <div className={`vp-grid${view === 'list' ? ' vp-grid--list' : ''}`}>
            {filtered.length === 0 ? (
              <div className="vp-empty">
                <Search size={32} color="#ddd" />
                <p>No products found</p>
                <button className="vp-reset-btn" onClick={() => { setSearch(''); setTag('All'); }}>Clear filters</button>
              </div>
            ) : filtered.map(p => (
              <ProductCard key={p.id} p={p} onWish={handleWish} onCart={handleCart} list={view === 'list'} />
            ))}
          </div>
        </div>
      )}

      {/* ════ ABOUT ════ */}
      {tab === 'about' && (
        <div className="vp-section">
          <div className="vp-story">
            <div className="vp-story-img" />
            <div className="vp-story-text">
              <span className="vp-label">Our Story</span>
              <h2 className="vp-story-title">Rooted in nature,<br />grown with care.</h2>
              <p className="vp-story-desc">
                Organic Roots was founded by Ramesh Verma in 2023 — bringing 100% certified organic
                produce directly from farm to table. We partner with 12+ local farms practising
                sustainable agriculture and zero-pesticide cultivation.
              </p>
              <div className="vp-impact">
                {[['12+','Farm Partners'],['98%','Fulfilment Rate'],['4.7','Avg. Rating']].map(([v,l]) => (
                  <div key={l}><div className="vp-impact-v">{v}</div><div className="vp-impact-l">{l}</div></div>
                ))}
              </div>
              <a href="https://organicroots.in" target="_blank" rel="noopener noreferrer" className="vp-link">
                Visit official website →
              </a>
            </div>
          </div>

          <div className="vp-cards-row">
            {[
              { Icon: Building2, title: 'Business Info',
                rows: [['Vendor ID', vendor.id],['Owner', vendor.owner],['Category', vendor.category],['GST','27AADCB2230M1ZX'],['Member Since', vendor.since]] },
              { Icon: MapPin, title: 'Location & Contact',
                rows: [['Phone', vendor.phone],['Email', vendor.email],['City','Thane'],['State','Maharashtra'],['Pincode','400602']] },
              { Icon: CreditCard, title: 'Payout & Bank',
                rows: [['Bank','HDFC Bank'],['Account','****3821'],['IFSC','HDFC0001234'],['Holder','Ramesh Verma'],['Last Payout','₹18,420 · Jan 10']] },
            ].map(({ Icon, title, rows }) => (
              <div key={title} className="vp-info-card">
                <div className="vp-info-card-icon"><Icon size={20} /></div>
                <h3 className="vp-info-card-title">{title}</h3>
                <dl className="vp-dl">
                  {rows.map(([k,v]) => (
                    <div key={k} className="vp-dl-row">
                      <dt className="vp-dt">{k}</dt>
                      <dd className="vp-dd">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ════ POLICIES ════ */}
      {tab === 'policies' && (
        <div className="vp-section vp-policies">
          {[
            { Icon: Truck,     title: 'Shipping Policy',    text: 'Orders dispatched within 1–2 business days. Standard delivery takes 3–7 days. We ship across all serviceable pin codes in India. Expedited shipping available at extra cost.' },
            { Icon: RotateCcw, title: 'Returns & Refunds',  text: 'Returns accepted within 7 days for damaged or incorrect items. Refunds processed within 5–7 business days to the original payment method.' },
            { Icon: FileText,  title: 'Terms & Conditions', text: 'By purchasing you agree to our marketplace terms. Product descriptions are accurate to the best of our knowledge. Bulk orders may need additional lead time.' },
            { Icon: Lock,      title: 'Privacy Policy',     text: 'Your information is used solely for order processing. We never sell your data. All information stored securely per applicable Indian data protection laws.' },
          ].map(({ Icon, title, text }) => (
            <div key={title} className="vp-policy-card">
              <div className="vp-policy-icon"><Icon size={22} /></div>
              <h3 className="vp-policy-title">{title}</h3>
              <p className="vp-policy-text">{text}</p>
            </div>
          ))}
        </div>
      )}

      {/* ════ REVIEWS ════ */}
      {tab === 'reviews' && (
        <div className="vp-section">
          <div className="vp-review-summary">
            <div className="vp-review-score">
              <div className="vp-big-score">{vendor.rating}</div>
              <Stars rating={vendor.rating} size={20} />
              <p className="vp-review-count">{vendor.reviews} verified reviews</p>
              <div className="vp-review-stats">
                <div><div className="vp-impact-v">96%</div><div className="vp-impact-l">Recommend</div></div>
                <div><div className="vp-impact-v">4.9</div><div className="vp-impact-l">Quality</div></div>
              </div>
            </div>
            <div className="vp-review-bars">
              <p className="vp-label">Rating Breakdown</p>
              <RatingBar label="5 Stars" count={77} total={128} />
              <RatingBar label="4 Stars" count={26} total={128} />
              <RatingBar label="3 Stars" count={13} total={128} />
              <RatingBar label="2 Stars" count={6}  total={128} />
              <RatingBar label="1 Star"  count={6}  total={128} />
            </div>
          </div>

          <div className="vp-review-grid">
            {reviews.length > 0 ? reviews.map(r => (
              <div key={r.id} className="vp-review-card">
                <div className="vp-review-top">
                  <div className="vp-review-av">{r.av}</div>
                  <div>
                    <div className="vp-review-name">{r.name}</div>
                    <div className="vp-review-meta"><Stars rating={r.rating} size={11} /><span className="vp-review-date">{r.date}</span></div>
                  </div>
                </div>
                <p className="vp-review-text">"{r.text}"</p>
                {r.product && <div className="vp-review-prod"><Package size={11} /> {r.product}</div>}
              </div>
            )) : (
              <p style={{ gridColumn: '1/-1', textAlign: 'center', color: '#8A7F75', padding: '2rem' }}>No reviews yet.</p>
            )}
          </div>
        </div>
      )}

      {/* ── NEWSLETTER ── */}
      <section className="vp-newsletter">
        {subbed ? (
          <div className="vp-subbed">
            <CheckCircle size={36} color="#FF5722" />
            <h3>You're subscribed!</h3>
            <p>We'll notify you about new arrivals from {vendor.name}.</p>
          </div>
        ) : (
          <>
            <h3 className="vp-nl-title">Follow {vendor.name}'s Store</h3>
            <p className="vp-nl-desc">Get notified about new arrivals, flash deals, and seasonal harvests.</p>
            <form className="vp-nl-form" onSubmit={handleSubscribe} noValidate>
              <input type="email" className="vp-nl-input" placeholder="Your email address"
                value={email} onChange={e => setEmail(e.target.value)} />
              <button type="submit" className="vp-nl-btn">Subscribe</button>
            </form>
            <p className="vp-nl-note">By subscribing you agree to our Privacy Policy.</p>
          </>
        )}
      </section>

      <Footer />
    </div>
  );
}