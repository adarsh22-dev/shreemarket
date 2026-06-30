import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShoppingBag, Heart, Share2, GitCompare, Star } from 'lucide-react';
import { getFeaturedProducts, BACKEND_URL, PLACEHOLDER_IMG, PLACEHOLDER_FAILED } from '../api/api';
import './FeaturedProductSection.css';

const getProductImage = (product) => {
  if (!product?.media?.length) return PLACEHOLDER_IMG;
  const primary = product.media.find(m => m.isPrimary && m.mediaType !== 'manufacturer')
    || product.media.find(m => m.mediaType !== 'manufacturer')
    || product.media[0];
  if (!primary?.fileName) return PLACEHOLDER_IMG;
  if (primary.fileName.startsWith('http://') || primary.fileName.startsWith('https://')) return primary.fileName;
  return `${BACKEND_URL}/uploads/products/${primary.fileName}`;
};

const FeaturedProductSection = ({
  onAddToCart,
  onWishlist,
  isInWishlist,
  isInCompare,
  addToCompare,
  removeFromCompare,
  onProductClick,
  shareProductId,
  onShare,
  onWhatsApp,
  onFacebook,
  onTwitter,
  onLinkedIn,
  onCopyLink,
  onImgErr,
}) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const sectionRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    const fetchFeatured = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getFeaturedProducts();
        if (mounted) {
          setProducts((data || []).slice(0, 5));
        }
      } catch (err) {
        console.error('Failed to load featured products:', err);
        if (mounted) setError('Could not load featured products.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchFeatured();
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <section className="fp-section" ref={sectionRef}>
        <div className="fp-header-row">
          <h2 className="fp-heading">FEATURED PRODUCTS</h2>
          <Link to="/shop" className="fp-view-all">
            View All <ArrowRight size={14} />
          </Link>
        </div>
        <div className="fp-grid fp-grid--loading">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="figma-product-card fp-skeleton">
              <div className="fp-skeleton-img" />
              <div className="fp-skeleton-text" />
              <div className="fp-skeleton-text fp-skeleton-text--short" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="fp-section" ref={sectionRef}>
        <div className="fp-header-row">
          <h2 className="fp-heading">FEATURED PRODUCTS</h2>
          <Link to="/shop" className="fp-view-all">
            View All <ArrowRight size={14} />
          </Link>
        </div>
        <div className="fp-error">
          <p>{error}</p>
        </div>
      </section>
    );
  }

  if (!products.length) {
    return (
      <section className="fp-section" ref={sectionRef}>
        <div className="fp-header-row">
          <h2 className="fp-heading">FEATURED PRODUCTS</h2>
          <Link to="/shop" className="fp-view-all">
            View All <ArrowRight size={14} />
          </Link>
        </div>
        <div className="fp-error">
          <p>No featured products available yet. Check back soon!</p>
        </div>
      </section>
    );
  }

  return (
    <section className="fp-section" ref={sectionRef}>
      <div className="fp-header-row">
        <div className="fp-header-left">
          <div className="fp-header-icon">
            <Star size={18} fill="currentColor" />
          </div>
          <h2 className="fp-heading">FEATURED PRODUCTS</h2>
          <span className="fp-badge">Curated</span>
        </div>
        <Link to="/shop" className="fp-view-all">
          View All <ArrowRight size={14} />
        </Link>
      </div>

      <div className="fp-grid">
        {products.map(product => {
          const img = getProductImage(product);
          const img2 = product.media?.length > 1
            ? `${BACKEND_URL}/uploads/products/${product.media[1].fileName}`
            : null;
          const dp = product.discountPrice || product.regularPrice || 0;
          const dpct = product.discountPrice && product.regularPrice > product.discountPrice
            ? Math.round(((product.regularPrice - product.discountPrice) / product.regularPrice) * 100)
            : null;
          const wishlisted = isInWishlist && isInWishlist(product.id);
          const compared = isInCompare && isInCompare(product.id);

          return (
            <div key={product.id} className="figma-product-card" onClick={() => onProductClick && onProductClick({ ...product, image: img, price: dp, details: product.details || { material: 'Handwoven' } })}>
              <div className="figma-img-wrapper">
                {dpct && <span className="discount-badge">-{dpct}%</span>}
                <div className="figma-actions">
                  <button
                    className={`figma-action-btn${wishlisted ? ' figma-action-active' : ''}`}
                    title="Wishlist"
                    onClick={e => { e.stopPropagation(); onWishlist && onWishlist(product); }}
                  >
                    <Heart size={15} fill={wishlisted ? '#ef4444' : 'none'} color={wishlisted ? '#ef4444' : '#fff'} strokeWidth={2} />
                  </button>
                  <button
                    className={`figma-action-btn${compared ? ' figma-action-active' : ''}`}
                    title={compared ? 'Remove from Compare' : 'Compare'}
                    onClick={e => { e.stopPropagation(); compared ? (removeFromCompare && removeFromCompare(product.id)) : (addToCompare && addToCompare(product)); }}
                  >
                    <GitCompare size={15} strokeWidth={2} />
                  </button>
                  <div className="hp-share-wrapper">
                    <button className="figma-action-btn" title="Share" onClick={e => { e.stopPropagation(); onShare && onShare(e, product); }}>
                      <Share2 size={15} strokeWidth={2} />
                    </button>
                    {shareProductId === product.id && (
                      <div className="hp-share-dropdown">
                        <p className="hp-share-dropdown-title">Share via</p>
                        <div className="hp-share-icons-row">
                          <button onClick={e => { e.stopPropagation(); onWhatsApp && onWhatsApp(product); }} className="share-icon-btn whatsapp">W</button>
                          <button onClick={e => { e.stopPropagation(); onFacebook && onFacebook(product); }} className="share-icon-btn facebook">f</button>
                          <button onClick={e => { e.stopPropagation(); onTwitter && onTwitter(product); }} className="share-icon-btn twitter">X</button>
                          <button onClick={e => { e.stopPropagation(); onLinkedIn && onLinkedIn(product); }} className="share-icon-btn linkedin">in</button>
                          <button onClick={e => { e.stopPropagation(); onCopyLink && onCopyLink(product); }} className="share-icon-btn copy"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg></button>
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    className="figma-action-btn"
                    title="Quick View"
                    onClick={e => {
                      e.stopPropagation();
                      onProductClick && onProductClick({ ...product, image: img, price: dp, details: product.details || { material: 'Handwoven' } });
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
                  </button>
                </div>
                <img
                  src={img}
                  alt={product.name}
                  className="figma-img-primary"
                  style={{ objectFit: 'contain', backgroundColor: 'white' }}
                  onError={e => {
                    if (onImgErr) { onImgErr(e, product.name); return; }
                    e.target.onerror = null;
                    e.target.src = PLACEHOLDER_FAILED;
                    e.target.style.objectFit = 'contain';
                    e.target.style.padding = '24px';
                  }}
                />
                {img2 && (
                  <img
                    src={img2}
                    alt={product.name}
                    className="figma-img-secondary"
                    style={{ objectFit: 'contain', backgroundColor: 'white' }}
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                )}
                <div className="inner-rating-badge">
                  {(product.averageRating || 0).toFixed(1)} <span style={{ color: '#FFB800' }}>★</span> ({product.reviewCount || 0})
                </div>
              </div>
              <div className="figma-info-wrapper">
                <h3 className="figma-product-title">{product.name}</h3>
                <p className="figma-product-subtitle">{product.vendor?.storeName || 'SreeMarket Vendor'}</p>
                <div className="figma-price-row">
                  <span className="price-new">₹{parseFloat(dp).toFixed(2)}</span>
                  {dpct && <span className="price-old">₹{parseFloat(product.regularPrice).toFixed(2)}</span>}
                </div>
                <button
                  className="card-add-to-cart-btn"
                  onClick={e => { e.stopPropagation(); onAddToCart && onAddToCart(product); }}
                >
                  <ShoppingBag size={14} strokeWidth={2} /> Add to Cart
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="fp-footer">
        <Link to="/shop" className="fp-footer-link">
          Discover all featured products <ArrowRight size={14} />
        </Link>
      </div>
    </section>
  );
};

export default FeaturedProductSection;
