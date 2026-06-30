import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronRight, ChevronLeft, ShoppingBag, Heart, Share2, GitCompare, Eye, Link as LinkIcon, Pause, Play } from 'lucide-react';
import TestimonialCarousel from './TestimonialCarousel';
import { BACKEND_URL, PLACEHOLDER_IMG } from '../api/api';

const getProductImageUrl = (product) => {
  if (!product?.media?.length) return PLACEHOLDER_IMG;
  const m = product.media.find(m => m.mediaType !== 'manufacturer') || product.media[0];
  if (!m?.fileName) return PLACEHOLDER_IMG;
  if (m.fileName.startsWith('http')) return m.fileName;
  return `${BACKEND_URL}/uploads/products/${m.fileName}`;
};

function ProductCard({ product, onSelect, onHeart, onCart, inWishlist, inCompare, addCompare, removeCompare, shareId, onShare, onWhatsApp, onFacebook, onTwitter, onLinkedIn, onCopyLink, onImgErr }) {
  if (!product) return null;
  const img = getProductImageUrl(product);
  const img2 = product.media?.length > 1 ? `${BACKEND_URL}/uploads/products/${product.media[1].fileName}` : null;
  const dp = product.discountPrice || product.regularPrice || 0;
  const dpct = product.discountPrice && product.regularPrice > product.discountPrice ? Math.round(((product.regularPrice - product.discountPrice) / product.regularPrice) * 100) : null;
  const wishlisted = inWishlist(product.id);
  const compared = inCompare(product.id);
  return (
    <div key={product.id} className="figma-product-card" onClick={() => onSelect({ ...product, image: img, price: dp, details: product.details || { material: 'Handwoven' } })}>
      <div className="figma-img-wrapper">
        {dpct && <span className="discount-badge">-{dpct}%</span>}
        <div className="figma-actions">
          <button className={`figma-action-btn${wishlisted ? ' figma-action-active' : ''}`} title="Wishlist" onClick={e => { e.stopPropagation(); onHeart(e, product); }}>
            <Heart size={15} fill={wishlisted ? "#ef4444" : "none"} color={wishlisted ? "#ef4444" : "#555"} strokeWidth={2} />
          </button>
          <button className={`figma-action-btn${compared ? ' figma-action-active' : ''}`} title={compared ? "Remove from Compare" : "Compare"}
            onClick={e => { e.stopPropagation(); compared ? removeCompare(product.id) : addCompare(product); }}>
            <GitCompare size={15} strokeWidth={2} />
          </button>
          <div className="hp-share-wrapper">
            <button className="figma-action-btn" title="Share" onClick={e => { e.stopPropagation(); onShare(e, product); }}>
              <Share2 size={15} strokeWidth={2} />
            </button>
            {shareId === product.id && (
              <div className="hp-share-dropdown">
                <p className="hp-share-dropdown-title">Share via</p>
                <div className="hp-share-icons-row">
                  <button onClick={e => { e.stopPropagation(); onWhatsApp(product); }} className="share-icon-btn whatsapp">W</button>
                  <button onClick={e => { e.stopPropagation(); onFacebook(product); }} className="share-icon-btn facebook">f</button>
                  <button onClick={e => { e.stopPropagation(); onTwitter(product); }} className="share-icon-btn twitter">X</button>
                  <button onClick={e => { e.stopPropagation(); onLinkedIn(product); }} className="share-icon-btn linkedin">in</button>
                  <button onClick={e => { e.stopPropagation(); onCopyLink(product); }} className="share-icon-btn copy"><LinkIcon size={14} /></button>
                </div>
              </div>
            )}
          </div>
          <button className="figma-action-btn" title="Quick View" onClick={e => { e.stopPropagation(); onSelect({ ...product, image: img, price: dp, details: product.details || { material: 'Handwoven' } }); }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
        </div>
        <img src={img} alt={product.name} className="figma-img-primary" style={{ objectFit: 'contain', backgroundColor: 'white' }} onError={onImgErr} />
        {img2 && <img src={img2} alt={product.name} className="figma-img-secondary" style={{ objectFit: 'contain', backgroundColor: 'white' }} onError={onImgErr} />}
        <div className="inner-rating-badge">{(product.averageRating || 0).toFixed(1)} <span style={{ color: '#FFB800' }}>★</span> ({product.reviewCount || 0})</div>
      </div>
      <div className="figma-info-wrapper">
        <h3 className="figma-product-title">{product.name}</h3>
        <p className="figma-product-subtitle">{product.vendor?.storeName || 'SreeMarket Vendor'}</p>
        <div className="figma-price-row">
          <span className="price-new">₹{parseFloat(dp).toFixed(2)}</span>
          {dpct && <span className="price-old">₹{parseFloat(product.regularPrice).toFixed(2)}</span>}
        </div>
        <button className="card-add-to-cart-btn" onClick={e => { e.stopPropagation(); onCart(e, product); }}>
          <ShoppingBag size={14} strokeWidth={2} /> Add to Cart
        </button>
      </div>
    </div>
  );
}

function getProductsForGrid(cfg, allProducts, topDeals, trendingProducts, featuredProducts) {
  const src = cfg.source || 'custom';
  if (src === 'top_deals') return (topDeals || []).filter(Boolean);
  if (src === 'trending') return (trendingProducts || []).filter(Boolean);
  if (src === 'featured') return (featuredProducts || []).filter(Boolean);
  const ids = (cfg.product_ids || []).map(String);
  const matched = (allProducts || []).filter(p => p && ids.includes(String(p.id)));
  return matched.slice(0, Number(cfg.limit) || 12);
}

function TopDealsSection({ td, cfg, p }) {
  const trackRef = useRef(null);
  const [centerIdx, setCenterIdx] = useState(0);
  const scrollAmt = useCallback((dir) => {
    if (!trackRef.current) return;
    const cw = trackRef.current.children[0]?.offsetWidth || 220;
    const gap = 16;
    trackRef.current.scrollBy({ left: dir * (cw + gap), behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const updateCenter = () => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      let closestIdx = 0;
      let minDist = Infinity;
      Array.from(el.children).forEach((child, i) => {
        const cr = child.getBoundingClientRect();
        const cc = cr.left + cr.width / 2;
        const dist = Math.abs(cc - cx);
        if (dist < minDist) { minDist = dist; closestIdx = i; }
      });
      setCenterIdx(closestIdx);
    };
    updateCenter();
    el.addEventListener('scroll', updateCenter, { passive: true });
    return () => el.removeEventListener('scroll', updateCenter);
  }, [td.length]);

  return (
    <section className="td-section">
      <div className="td-ambient" />
      <div className="td-ambient td-ambient--2" />
      <div className="td-ambient td-ambient--3" />
      <div className="section-header-row">
        <div className="td-heading-row">
          <div className="td-fire-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 23c-4.97 0-9-3.58-9-8 0-3.5 2.5-6.5 4-8 .5-.5 1-.3 1 .2 0 1.5-.5 2.8-.5 3.8 0 2.2 1.5 4 3.5 4s3.5-1.8 3.5-4c0-1-.5-2.3-.5-3.8 0-.5.5-.7 1-.2 1.5 1.5 4 4.5 4 8 0 4.42-4.03 8-9 8z" fill="url(#tdFireGrad)"/><defs><linearGradient id="tdFireGrad" x1="12" y1="2" x2="12" y2="23"><stop offset="0%" stopColor="#f97316"/><stop offset="100%" stopColor="#dc2626"/></linearGradient></defs></svg>
          </div>
          <h2 className="section-heading">{cfg.heading || 'TOP DEALS'}</h2>
          <span className="td-hot-badge">HOT</span>
        </div>
        {cfg.sa_enabled !== false && <Link to={cfg.sa_link || '/shop'} className="view-all-link" style={{ background: cfg.sa_bg, color: cfg.sa_text }}>{cfg.sa_label || 'View All'} <ChevronRight size={16} /></Link>}
      </div>

      {td.length === 0 ? (
        <p style={{ textAlign: 'center', padding: '3rem 0', color: '#666' }}>No top deals found.</p>
      ) : (
        <div className="td-carousel">
          {td.length > 4 && (
            <button className="td-arr td-arr--prev" onClick={() => scrollAmt(-1)} aria-label="Scroll left"><ChevronLeft size={18} /></button>
          )}
          <div className="td-track" ref={trackRef}>
            {td.map((product, i) => (
              <div key={product?.id || i} className={`td-card-wrap${i === centerIdx ? ' td-card-wrap--center' : ''}`}>
                <ProductCard product={product} {...p} />
              </div>
            ))}
          </div>
          {td.length > 4 && (
            <button className="td-arr td-arr--next" onClick={() => scrollAmt(1)} aria-label="Scroll right"><ChevronRight size={18} /></button>
          )}
        </div>
      )}
    </section>
  );
}

function ProductGridCarousel({ products, cfg, p }) {
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const trackRef = useRef(null);
  const CARD_WIDTH = 260;
  const GAP = 20;
  const SCROLL_AMOUNT = (CARD_WIDTH + GAP) * 2;

  const updateScrollState = () => {
    const el = trackRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);
    return () => { el.removeEventListener('scroll', updateScrollState); window.removeEventListener('resize', updateScrollState); };
  }, [products.length]);

  const scroll = (dir) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * SCROLL_AMOUNT, behavior: 'smooth' });
  };

  if (!products.length) {
    return (
      <section className="trending-featured-section">
        <div className="section-header-row">
          <h2 className="section-heading">{cfg.heading || 'Products'}</h2>
          {cfg.btn_enabled !== false && <Link to={cfg.btn_link || '/shop'} className="view-all-link" style={{ background: cfg.btn_bg, color: cfg.btn_text }}>{cfg.btn_label || 'View All'} <ChevronRight size={16} /></Link>}
        </div>
        <p style={{ textAlign: 'center', padding: '3rem 0', color: '#666' }}>No products found</p>
      </section>
    );
  }

  return (
    <section className="trending-featured-section product-carousel-section">
      <div className="section-header-row">
        <div className="section-header-left">
          <h2 className="section-heading">{cfg.heading || 'Products'}</h2>
          {cfg.tagline && <span className="section-tagline">{cfg.tagline}</span>}
        </div>
        {cfg.btn_enabled !== false && <Link to={cfg.btn_link || '/shop'} className="view-all-link" style={{ background: cfg.btn_bg, color: cfg.btn_text }}>{cfg.btn_label || 'View All'} <ChevronRight size={16} /></Link>}
      </div>
      <div className="product-carousel-wrapper">
        {canScrollLeft && (
          <button className="product-carousel-arrow product-carousel-arrow-left" onClick={() => scroll(-1)} aria-label="Previous products">
            <ChevronLeft size={22} />
          </button>
        )}
        <div className="product-carousel-viewport" ref={trackRef}>
          {products.map((product, idx) => (
            <div className="product-carousel-card" key={`pg-${product?.id ?? idx}`} style={{ minWidth: CARD_WIDTH, maxWidth: CARD_WIDTH }}>
              <ProductCard product={product} {...p} />
            </div>
          ))}
        </div>
        {canScrollRight && (
          <button className="product-carousel-arrow product-carousel-arrow-right" onClick={() => scroll(1)} aria-label="Next products">
            <ChevronRight size={22} />
          </button>
        )}
      </div>
    </section>
  );
}

function HandcraftedSection({ cfg, tabs }) {
  const bannerImages = [cfg.banner_img, cfg.banner_img2, cfg.banner_img3].filter(Boolean);
  const [activeIdx, setActiveIdx] = useState(0);
  const fallbackImg = 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=900&q=80';

  useEffect(() => {
    if (bannerImages.length <= 1) return;
    const timer = setInterval(() => setActiveIdx(prev => (prev + 1) % bannerImages.length), 5000);
    return () => clearInterval(timer);
  }, [bannerImages.length]);

  return (
    <section className="handcrafted-section">
      <div className="handcrafted-header">
        <h2 className="section-heading">{cfg.heading || 'HAND CRAFTED WITH TRADITION'}</h2>
        {cfg.badge_text && <span className="handcrafted-badge">{cfg.badge_text}</span>}
      </div>
      <div className="handcrafted-content">
        <div className="handcrafted-banner">
          <div className="handcrafted-slider">
            {(bannerImages.length > 0 ? bannerImages : [fallbackImg]).map((src, i) => (
              <img key={i} src={src} alt="" className={`handcrafted-slide${i === activeIdx ? ' active' : ''}`} onError={e => { e.target.src = fallbackImg; }} />
            ))}
          </div>
          <div className="handcrafted-overlay">
            <p className="handcrafted-overlay-text">{cfg.overlay_text || 'WOVEN IN TRADITION AND ROOTED IN TIMELESS CRAFT'}</p>
            {cfg.btn_enabled !== false && <Link to={cfg.btn_link || '/shop'} className="handcrafted-view-all" style={{ background: cfg.btn_bg, color: cfg.btn_text }}>{cfg.btn_label || 'View All'}</Link>}
          </div>
          {bannerImages.length > 1 && (
            <div className="handcrafted-dots">
              {bannerImages.map((_, i) => (
                <button key={i} className={`handcrafted-dot${i === activeIdx ? ' active' : ''}`} onClick={() => setActiveIdx(i)} />
              ))}
            </div>
          )}
        </div>
        <div className="handcrafted-categories">
          {tabs.map((t, i) => (
            <Link key={i} to={t.link} className="handcrafted-cat-tab">
              <span className="handcrafted-cat-icon">{t.icon}</span>
              <span className="handcrafted-cat-label">{t.label}</span>
              <svg className="handcrafted-cat-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function PromoBannerCarousel({ cfg, images }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const hasImages = images.length > 0;
  const fallbackImg = 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&q=80';

  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(() => setActiveIdx(prev => (prev + 1) % images.length), 4000);
    return () => clearInterval(timer);
  }, [images.length]);

  return (
    <div className="promo-banner-fullwidth">
      <div className="promo-banner-container">
        <div className="promo-shape promo-shape-1"></div>
        <div className="promo-shape promo-shape-2"></div>
        <div className="promo-shape promo-shape-3"></div>
        <div className="promo-banner-content">
          <div className="promo-badge-tag">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>
            <span>{cfg.badge_text || 'Handcrafted with Love'}</span>
          </div>
          <h2 className="promo-banner-title">{cfg.title || 'Authentic Indian Handmade Products'}</h2>
          <p className="promo-banner-desc">{cfg.description || 'Supporting local artisans with quality products at retail and wholesale prices across India.'}</p>
          <div className="promo-stats-row">
            <div className="promo-stat">
              <span className="promo-stat-num">{cfg.stat1_val || '500+'}</span>
              <span className="promo-stat-lbl">{cfg.stat1_lbl || 'Artisans'}</span>
            </div>
            <div className="promo-stat-divider"></div>
            <div className="promo-stat">
              <span className="promo-stat-num">{cfg.stat2_val || '50+'}</span>
              <span className="promo-stat-lbl">{cfg.stat2_lbl || 'Crafts'}</span>
            </div>
            <div className="promo-stat-divider"></div>
            <div className="promo-stat">
              <span className="promo-stat-num">{cfg.stat3_val || '100%'}</span>
              <span className="promo-stat-lbl">{cfg.stat3_lbl || 'Authentic'}</span>
            </div>
          </div>
          {cfg.btn_enabled !== false && (
            <Link to={cfg.btn_link || '/shop'} className="promo-cta-btn">
              <span>{cfg.btn_label || 'Shop Now'}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </Link>
          )}
        </div>
        <div className="promo-banner-image">
          <div className="promo-img-slider">
            {(hasImages ? images : [fallbackImg]).map((src, i) => (
              <img key={i} src={src} alt={`Promo ${i + 1}`} className={`promo-img-slide${i === activeIdx ? ' active' : ''}`} onError={e => { e.target.src = fallbackImg; }} />
            ))}
          </div>
          {images.length > 1 && (
            <div className="promo-img-dots">
              {images.map((_, i) => (
                <button key={i} className={`promo-img-dot${i === activeIdx ? ' active' : ''}`} onClick={() => setActiveIdx(i)} />
              ))}
            </div>
          )}
          <div className="promo-image-glow"></div>
        </div>
      </div>
    </div>
  );
}

export default function DynamicSectionRenderer({ section, allProducts, topDeals, trendingProducts, featuredProducts, ...ctx }) {
  const cfg = section.cfg || {};
  const p = { onSelect: ctx.onProductClick, onHeart: ctx.handleHeartClick, onCart: ctx.handleAddToCart, inWishlist: ctx.isInWishlist, inCompare: ctx.isInCompare, addCompare: ctx.addToCompare, removeCompare: ctx.removeFromCompare, shareId: ctx.shareProductId, onShare: ctx.handleShareClick, onWhatsApp: ctx.shareToWhatsApp, onFacebook: ctx.shareToFacebook, onTwitter: ctx.shareToTwitter, onLinkedIn: ctx.shareToLinkedIn, onCopyLink: ctx.copyShareLink, onImgErr: ctx.handleImageError };

  switch (section.t) {

    case 'hero_banner': {
      const s = cfg.slides || [];
      return (
        <section className="hero-grid-section">
          <div className="hero-main-banner" style={{ backgroundImage: `linear-gradient(rgba(0,0,0,${cfg.overlay || 0.3}), rgba(0,0,0,${Number(cfg.overlay || 0.3) + 0.3})), url(${cfg.bg_img || ''})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
            <div className="hero-main-content">
              <h2>{cfg.headline || 'online experiences for indian handmade goods'}</h2>
              {cfg.subheadline && <p style={{ color: '#fff', fontSize: '.85rem', marginTop: 6, opacity: 0.9 }}>{cfg.subheadline}</p>}
              {cfg.btn_enabled !== false && <Link to={cfg.btn_link || '/shop'} className="btn-hero-explore">{cfg.btn_label || 'EXPLORE'}</Link>}
            </div>
          </div>
          <div className="hero-side-banners">
            {s.length === 0 ? (
              <>
                <div className="hero-side-banner" style={{ background: 'linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.4)), center/cover no-repeat' }}>
                  <div className="hero-side-content"><h3>Timeless Traditions</h3><Link to="/shop" className="btn-hero-link">Shop now <ArrowRight size={14} /></Link></div>
                </div>
                <div className="hero-side-banner" style={{ background: 'linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.4)), center/cover no-repeat' }}>
                  <div className="hero-side-content"><h3>Premium Quality</h3><Link to="/shop" className="btn-hero-link">Shop now <ArrowRight size={14} /></Link></div>
                </div>
              </>
            ) : s.map(sl => (
              <div key={sl.id} className="hero-side-banner" style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.4)), url(${sl.img || ''})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                <div className="hero-side-content">
                  <h3>{sl.title || ''}</h3>
                  {sl.btn_enabled !== false && <Link to={sl.btn_link || '/shop'} className="btn-hero-link" style={{ background: sl.btn_bg, color: sl.btn_text }}>{sl.btn_label || 'Shop now'} <ArrowRight size={14} /></Link>}
                </div>
              </div>
            ))}
          </div>
        </section>
      );
    }

    case 'featured_cats': {
      return null;
    }

    case 'top_deals': {
      const td = (topDeals || []).filter(Boolean);
      return <TopDealsSection td={td} cfg={cfg} p={p} />;
    }

    case 'trust_banners': {
      const defaultIcons = [
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>,
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 12a9 9 0 1 0 9-9"/><polyline points="3 3 3 12 12 12"/></svg>,
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
      ];
      const items = [
        { h: cfg.h1 || 'Easy Payment Options', s: cfg.s1 || '100% Protected' },
        { h: cfg.h2 || 'Easy Returns', s: cfg.s2 || '7 Day Return Policy' },
        { h: cfg.h3 || 'Verified Artisans', s: cfg.s3 || 'Certified & Authenticated' },
        { h: cfg.h4 || 'Genuine Products', s: cfg.s4 || 'Directly Sourced' },
      ];
      return (
        <div className="trust-banners-fullwidth">
          <div className="trust-banners-container">
            {items.map((it, i) => (
              <div key={i} className="trust-item">
                <div className="trust-icon-wrap">
                  {cfg[`ic${i+1}`] ? <img src={cfg[`ic${i+1}`]} alt="" style={{ width:24, height:24, objectFit:"contain" }} /> : defaultIcons[i]}
                </div>
                <div className="trust-text">
                  <h4>{it.h}</h4>
                  <p>{it.s}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    case 'product_grid': {
      const products = getProductsForGrid(cfg, allProducts, topDeals, trendingProducts, featuredProducts);
      return <ProductGridCarousel products={products} cfg={cfg} p={p} />;
    }

    case 'promo_banner': {
      const promoImages = [cfg.promo_img, cfg.promo_img2, cfg.promo_img3, cfg.promo_img4].filter(Boolean);
      return <PromoBannerCarousel cfg={cfg} images={promoImages} />;
    }

    case 'handcrafted': {
      const tabs = [
        { icon: cfg.c1_icon || '🏺', label: cfg.c1_label || 'HANDMADE POTTERY', link: cfg.c1_link || '/shop?cat=pottery' },
        { icon: cfg.c2_icon || '🎨', label: cfg.c2_label || 'ART & CRAFT PIECES', link: cfg.c2_link || '/shop?cat=art' },
        { icon: cfg.c3_icon || '🧴', label: cfg.c3_label || 'AYURVEDIC HANDMADE SOAPS', link: cfg.c3_link || '/shop?cat=soaps' },
        { icon: cfg.c4_icon || '🔔', label: cfg.c4_label || 'BRASS & WOODEN CRAFTS', link: cfg.c4_link || '/shop?cat=brass' },
      ];
      return <HandcraftedSection cfg={cfg} tabs={tabs} />;
    }

    case 'testimonials':
    case 'reviews':
      return <TestimonialCarousel />;

    case 'values_mission':
      return (
        <div className="values-mission-fullwidth">
          <section className="values-mission-section">
            <div className="vm-content">
              {cfg.show_logo !== false && (
                <div className="vm-logo">
                  <img src={cfg.logo_img || PLACEHOLDER_IMG} alt="Logo" className="vm-logo-image" style={{ height: 60, width: 'auto', marginBottom: 15 }} />
                </div>
              )}
              <h2 className="vm-title">{cfg.title || 'We believe a home should reflect your values.'}</h2>
              <p className="vm-desc">{cfg.description || ''}</p>
              <div className="vm-stats-row">
                <div className="vm-stat">
                  <span className="vm-stat-number">{cfg.stat1_val || '45+'}</span>
                  <span className="vm-stat-label">{cfg.stat1_lbl || 'PARTNER CO-OPS'}</span>
                </div>
                <div className="vm-stat">
                  <span className="vm-stat-number">{cfg.stat2_val || '₹2.4M'}</span>
                  <span className="vm-stat-label">{cfg.stat2_lbl || 'DIRECT ARTISAN INCOME'}</span>
                </div>
              </div>
            </div>
            {cfg.artisan_img && (
              <div className="vm-image">
                <img src={cfg.artisan_img} alt="Artisan" />
              </div>
            )}
          </section>
        </div>
      );

    case 'rich_text':
      return (
        <section className="values-mission-fullwidth" style={{ padding: '60px 0' }}>
          <div className="values-mission-section" style={{ flexDirection: cfg.img_pos === 'left' ? 'row-reverse' : 'row' }}>
            <div className="vm-content">
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 12 }}>{cfg.heading || ''}</h2>
              <p style={{ color: '#475569', lineHeight: 1.7, fontSize: '.9rem' }}>{cfg.body || ''}</p>
              {cfg.btn_enabled !== false && (
                <Link to={cfg.btn_link || '/shop'} style={{ display: 'inline-block', marginTop: 16, padding: '8px 20px', borderRadius: 8, fontSize: '.8rem', fontWeight: 700, textDecoration: 'none', background: cfg.btn_bg || '#E03E1A', color: cfg.btn_text || '#fff' }}>
                  {cfg.btn_label || 'Read More'}
                </Link>
              )}
            </div>
            {cfg.img && (
              <div className="vm-image">
                <img src={cfg.img} alt={cfg.heading || ''} style={{ width: '100%', borderRadius: 12 }} />
              </div>
            )}
          </div>
        </section>
      );

    case 'video':
      return (
        <section style={{ padding: '40px 20px', maxWidth: 900, margin: '0 auto' }}>
          {cfg.heading && <h2 className="section-heading" style={{ textAlign: 'center', marginBottom: 20 }}>{cfg.heading}</h2>}
          {cfg.video_url && (
            <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, borderRadius: 12, overflow: 'hidden' }}>
              <iframe src={cfg.video_url} title={cfg.heading || 'Video'} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }} allow="autoplay; encrypted-media" allowFullScreen />
            </div>
          )}
          {cfg.description && <p style={{ textAlign: 'center', color: '#475569', marginTop: 16 }}>{cfg.description}</p>}
          {cfg.btn_enabled && (
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Link to={cfg.btn_link || '/'} style={{ display: 'inline-block', padding: '8px 20px', borderRadius: 8, fontSize: '.8rem', fontWeight: 700, textDecoration: 'none', background: cfg.btn_bg || '#E03E1A', color: cfg.btn_text || '#fff' }}>{cfg.btn_label || 'Watch Now'}</Link>
            </div>
          )}
        </section>
      );

    case 'brands':
      return (
        <section style={{ padding: '40px 20px', background: '#f8fafc' }}>
          {cfg.show_heading !== false && cfg.heading && <h2 className="section-heading" style={{ textAlign: 'center', marginBottom: 24 }}>{cfg.heading}</h2>}
          <div style={{ display: 'flex', gap: 24, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', opacity: 0.6 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ width: 120, height: 60, background: '#e2e8f0', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.7rem', color: '#94a3b8', fontWeight: 700 }}>Brand {i + 1}</div>
            ))}
          </div>
        </section>
      );

    default:
      return null;
  }
}
