'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Minus, Plus, Star, ThumbsUp, ThumbsDown, Package, RotateCcw,
  ShieldCheck, HeartHandshake, Leaf, MapPin, Heart,   CornerDownRight, Share2, ChevronLeft, ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { submitProductReview, searchProducts } from '@/lib/api/client';
import { BACKEND_URL } from '@/lib/api/shared';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import './ProductPage.css';

const ProductPageClient = ({ product, vendor, relatedProducts, initialReviews }) => {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const { addToCart, addToRecentlyViewed } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist, isLoggedIn } = useWishlist();

  const [upsellProducts, setUpsellProducts] = useState([]);
  const [crossSellProducts, setCrossSellProducts] = useState([]);
  const [reviews, setReviews] = useState(initialReviews || []);
  const [activeImage, setActiveImage] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState(-1);
  const [sliderIndex, setSliderIndex] = useState(0);
  const [productLightboxIndex, setProductLightboxIndex] = useState(-1);

  // Review Form State
  const [isWritingReview, setIsWritingReview] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, title: '', text: '', reviewerName: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  // Add to recently viewed on mount
  useEffect(() => {
    if (product) {
      addToRecentlyViewed({
        id: product.id,
        name: product.name,
        price: product.discountPrice || product.regularPrice,
        image: product.media && product.media.length > 0
          ? `${BACKEND_URL}/uploads/products/${product.media.find(m => m.isPrimary)?.fileName || product.media[0].fileName}`
          : "https://via.placeholder.com/400x400",
        category: product.category
      });
      window.scrollTo(0, 0);
    }
  }, [product?.id]);

  // Fetch linked products (upsells & cross-sells) client-side since it requires searching by name
  useEffect(() => {
    if (!product?.linkedProducts || product.linkedProducts.length === 0) return;

    const upsellNames = product.linkedProducts
      .filter(lp => lp.linkedType === 'UPSELL')
      .map(lp => lp.linkedProductName);
    const crossSellNames = product.linkedProducts
      .filter(lp => lp.linkedType === 'CROSS_SELL')
      .map(lp => lp.linkedProductName);

    const fetchLinkedByNames = async (names) => {
      const results = [];
      const seen = new Set();
      for (const name of names) {
        try {
          const searchResult = await searchProducts(name);
          const products = Array.isArray(searchResult) ? searchResult : searchResult?.content || [];
          const exact = products.find(p => p.name === name) || products[0];
          if (exact && !seen.has(exact.id) && exact.id !== product.id) {
            seen.add(exact.id);
            results.push(exact);
          }
        } catch { /* skip */ }
      }
      return results;
    };

    if (upsellNames.length > 0) {
      fetchLinkedByNames(upsellNames).then(setUpsellProducts);
    }
    if (crossSellNames.length > 0) {
      fetchLinkedByNames(crossSellNames).then(setCrossSellProducts);
    }
  }, [product?.id]);

  // Gallery data — filter image URLs from media
  const galleryMedia = product?.media?.filter(m => m.fileName && m.fileType === 'instagram-url') || [];
  const galleryLayout = product?.instagramFeedLayout || 'slider';

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setSubmittingReview(true);
    try {
      const savedReview = await submitProductReview({
        ...newReview,
        productId: product.id,
        reviewerName: newReview.reviewerName || 'Anonymous',
      });
      setReviews(prev => [savedReview, ...prev]);
      setIsWritingReview(false);
      setNewReview({ rating: 5, title: '', text: '', reviewerName: '' });
      toast.success("Review submitted successfully!");
    } catch (err) {
      console.error("Failed to submit review:", err);
      toast.error("Could not submit the review. Please try again.");
    } finally {
      setSubmittingReview(false);
    }
  };

  // Derived Statistics
  const averageRating = reviews.length > 0
    ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1)
    : (product?.averageRating || 0).toFixed(1);

  const getRatingDistribution = () => {
    const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => {
      if (dist[r.rating] !== undefined) dist[r.rating]++;
    });
    return Object.keys(dist).sort((a, b) => b - a).map(stars => ({
      stars: parseInt(stars),
      count: dist[stars],
      pct: reviews.length > 0 ? Math.round((dist[stars] / reviews.length) * 100) : 0
    }));
  };

  const renderStars = (rating) => {
    return (
      <div className="star-rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star key={star} size={14} className={star <= rating ? "star-icon filled" : "star-icon"} />
        ))}
      </div>
    );
  };

  const handleHeartClick = (e) => {
    e.preventDefault();
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist({
        ...product,
        image: product.media && product.media.length > 0 ? `${BACKEND_URL}/uploads/products/${product.media.find(m => m.isPrimary)?.fileName || product.media[0].fileName}` : "https://via.placeholder.com/400x400",
        price: product.discountPrice || product.regularPrice || 0
      });
    }
  };

  const handleAddToCart = () => {
    addToCart({
      ...product,
      title: product.name,
      price: product.discountPrice || product.regularPrice || 0,
      image: product.media && product.media.length > 0 ? `${BACKEND_URL}/uploads/products/${product.media.find(m => m.isPrimary)?.fileName || product.media[0].fileName}` : null
    }, quantity, null, true);
  };

  const handleShareClick = async (e) => {
    e.preventDefault();
    const shareData = {
      title: product.name,
      text: `Check out ${product.name} on SreeMarket!`,
      url: window.location.href
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Product link copied to clipboard!");
      }
    } catch (err) {
      console.error("Error sharing:", err);
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Product link copied to clipboard!");
    }
  };

  const mainImageUrl = product.media && product.media.length > 0
    ? `${BACKEND_URL}/uploads/products/${product.media[activeImage]?.fileName}`
    : "https://via.placeholder.com/600x600?text=No+Image";

  const store = vendor?.stores?.[0];

  // Gallery helpers
  const handleImageError = (e) => {
    e.target.style.display = 'none';
    const fallback = e.target.nextElementSibling;
    if (fallback) fallback.style.display = 'flex';
  };

  const getImageUrl = (url) => {
    if (!url || url === 'null' || url === 'undefined') return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${BACKEND_URL}/uploads/products/${url}`;
  };

  return (
    <div className="product-page-wrapper">
      <Navbar />

      <main className="product-page-main">
        {/* Breadcrumbs */}
        <div className="breadcrumbs">
          <Link href="/">Home</Link> <span className="separator">&gt;</span> <Link href="/shop">Shop All</Link> <span className="separator">&gt;</span> <span className="current">{product.name}</span>
        </div>

        {/* Hero Section */}
        <section className="product-hero">
          <div className="product-gallery">
            <div className="main-image-wrapper" style={{ position: 'relative' }}>
              <button
                className="share-btn"
                onClick={handleShareClick}
                style={{
                  position: 'absolute',
                  top: '64px',
                  right: '16px',
                  backgroundColor: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  zIndex: 10
                }}
                title="Share Product"
              >
                <Share2 size={20} color="#555" />
              </button>
              {isLoggedIn && (
                <button
                  className="heart-btn"
                  onClick={handleHeartClick}
                  style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    backgroundColor: 'white',
                    border: 'none',
                    borderRadius: '20px',
                    padding: '0 12px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    zIndex: 10,
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    color: '#555'
                  }}
                >
                  <Heart
                    size={18}
                    fill={isInWishlist(product.id) ? "#FF0000" : "none"}
                    color={isInWishlist(product.id) ? "#FF0000" : "#ccc"}
                  />
                  Wishlist
                </button>
              )}
               <img 
                 src={mainImageUrl} 
                 alt={product.name} 
                 className="main-image"
                 onClick={() => setProductLightboxIndex(activeImage)}
               />
            </div>
            <div className="thumbnails">
              {product.media && product.media.map((med, index) => (
                <div
                  key={med.id}
                  className={`thumb-wrapper ${index === activeImage ? 'active' : ''}`}
                  onClick={() => setActiveImage(index)}
                >
                  <img src={`${BACKEND_URL}/uploads/products/${med.fileName}`} alt={`Thumbnail ${index + 1}`} />
                </div>
              ))}
            </div>
          </div>

          <div className="product-details">
            <div className="tag">{product.category?.toUpperCase()} | {product.status?.toUpperCase() || 'AVAILABLE'}</div>
            <h1 className="product-title">{product.name}</h1>
            <p className="product-price">
              {product.discountPrice ? (
                <span className="price-container">
                  <span className="discount-price">&#8377;{product.discountPrice.toFixed(2)}</span>
                  <span className="regular-price-strike">&#8377;{product.regularPrice.toFixed(2)}</span>
                  {product.regularPrice > product.discountPrice && (
                    <span className="discount-badge-inline">
                      -{Math.round(((product.regularPrice - product.discountPrice) / product.regularPrice) * 100)}%
                    </span>
                  )}
                </span>
              ) : (
                `\u20B9${product.regularPrice.toFixed(2)}`
              )}
            </p>

            <div className="product-rating-summary" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              {renderStars(Math.round(parseFloat(averageRating)))}
              <span style={{ fontSize: '0.9rem', color: '#666' }}>
                {averageRating} ({reviews.length} reviews)
              </span>
            </div>

            <p className="product-description">{product.shortDescription || product.description?.substring(0, 150) + '...'}</p>

            <div className="product-specs">
              {product.brand && (
                <div className="spec-item">
                  <span className="spec-label">BRAND</span>
                  <span className="spec-value">{product.brand}</span>
                </div>
              )}
              {product.sku && (
                <div className="spec-item">
                  <span className="spec-label">SKU</span>
                  <span className="spec-value">{product.sku}</span>
                </div>
              )}
              {product.attributes && product.attributes.map(attr => (
                <div key={attr.id} className="spec-item">
                  <span className="spec-label">{attr.name?.toUpperCase()}</span>
                  <span className="spec-value">{attr.value}</span>
                </div>
              ))}
            </div>

            <div className="product-actions">
              <div className="quantity-selector">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="qty-btn"><Minus size={16} /></button>
                <span className="qty-value">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="qty-btn"><Plus size={16} /></button>
              </div>
              <button className="add-to-cart-btn" onClick={handleAddToCart}>Add to Cart</button>
            </div>

            <div className="product-guarantees">
              <div className="guarantee">
                <Package size={14} /> Free Worldwide Shipping
              </div>
              <div className="guarantee">
                <RotateCcw size={14} /> 14-Day Free Returns
              </div>
            </div>
          </div>
        </section>

        {/* Full Description Section */}
        {product.description && (
          <section className="product-full-description">
            <h2 className="section-heading">Product Details</h2>
            <div className="description-content">
              {product.description.split('\n').map((line, index) => (
                <p key={index}>{line}</p>
              ))}
            </div>

            {/* Additional details */}
            <div className="additional-details" style={{ marginTop: '2rem' }}>
              <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem', fontSize: '1.2rem', color: '#333' }}>Specifications</h3>
              <table className="specs-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                <tbody>
                  {product.brand && (
                    <tr style={{ borderBottom: '1px solid #f5f5f5' }}>
                      <td style={{ padding: '12px 8px', fontWeight: '500', color: '#555', width: '30%' }}>Brand</td>
                      <td style={{ padding: '12px 8px' }}>{product.brand}</td>
                    </tr>
                  )}
                  {product.sku && (
                    <tr style={{ borderBottom: '1px solid #f5f5f5' }}>
                      <td style={{ padding: '12px 8px', fontWeight: '500', color: '#555' }}>SKU</td>
                      <td style={{ padding: '12px 8px' }}>{product.sku}</td>
                    </tr>
                  )}
                  {product.category && (
                    <tr style={{ borderBottom: '1px solid #f5f5f5' }}>
                      <td style={{ padding: '12px 8px', fontWeight: '500', color: '#555' }}>Category</td>
                      <td style={{ padding: '12px 8px', textTransform: 'capitalize' }}>{product.category}</td>
                    </tr>
                  )}
                  {product.status && (
                    <tr style={{ borderBottom: '1px solid #f5f5f5' }}>
                      <td style={{ padding: '12px 8px', fontWeight: '500', color: '#555' }}>Availability</td>
                      <td style={{ padding: '12px 8px', textTransform: 'capitalize' }}>
                        {product.status === 'in' ? 'In Stock' : product.status === 'low' ? 'Low Stock' : product.status === 'out' ? 'Out of Stock' : product.status}
                      </td>
                    </tr>
                  )}
                  {product.weight > 0 && (
                    <tr style={{ borderBottom: '1px solid #f5f5f5' }}>
                      <td style={{ padding: '12px 8px', fontWeight: '500', color: '#555' }}>Weight</td>
                      <td style={{ padding: '12px 8px' }}>{product.weight} kg</td>
                    </tr>
                  )}
                  {(product.length > 0 || product.width > 0 || product.height > 0) && (
                    <tr style={{ borderBottom: '1px solid #f5f5f5' }}>
                      <td style={{ padding: '12px 8px', fontWeight: '500', color: '#555' }}>Dimensions</td>
                      <td style={{ padding: '12px 8px' }}>
                        {product.length || 0} x {product.width || 0} x {product.height || 0} cm <span style={{ fontSize: '0.8rem', color: '#999' }}>(L x W x H)</span>
                      </td>
                    </tr>
                  )}
                  {product.shippingClass && (
                    <tr style={{ borderBottom: '1px solid #f5f5f5' }}>
                      <td style={{ padding: '12px 8px', fontWeight: '500', color: '#555' }}>Shipping Class</td>
                      <td style={{ padding: '12px 8px', textTransform: 'capitalize' }}>{product.shippingClass}</td>
                    </tr>
                  )}
                  {product.taxStatus && product.taxStatus !== 'none' && (
                    <tr style={{ borderBottom: '1px solid #f5f5f5' }}>
                      <td style={{ padding: '12px 8px', fontWeight: '500', color: '#555' }}>Tax Status</td>
                      <td style={{ padding: '12px 8px', textTransform: 'capitalize' }}>
                        {product.taxStatus} {product.taxClass && `(${product.taxClass})`}
                      </td>
                    </tr>
                  )}
                  {product.attributes && product.attributes.map(attr => (
                    <tr key={attr.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                      <td style={{ padding: '12px 8px', fontWeight: '500', color: '#555' }}>{attr.name?.charAt(0).toUpperCase() + attr.name?.slice(1)}</td>
                      <td style={{ padding: '12px 8px' }}>{attr.value}</td>
                    </tr>
                  ))}
                  {product.tags && product.tags.length > 0 && (
                    <tr style={{ borderBottom: '1px solid #f5f5f5' }}>
                      <td style={{ padding: '12px 8px', fontWeight: '500', color: '#555' }}>Tags</td>
                      <td style={{ padding: '12px 8px' }}>
                        {product.tags.map((tag, index) => (
                          <span key={tag.id || index} style={{
                            display: 'inline-block',
                            background: '#f0f0f0',
                            padding: '4px 10px',
                            borderRadius: '16px',
                            fontSize: '0.85rem',
                            marginRight: '8px',
                            marginBottom: '4px',
                            color: '#444'
                          }}>
                            {tag.name}
                          </span>
                        ))}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Artisan Section */}
        {store && (
          <section className="artisan-section">
            <div className="artisan-card">
              <div className="artisan-image-wrapper">
                <img
                  src={store.storeLogo ? `${BACKEND_URL}/uploads/logos/${store.storeLogo}` : "https://via.placeholder.com/400x400?text=Artisan"}
                  alt={store.storeName}
                />
                <div className="artisan-location-badge">
                  <span className="location-label">LOCATION</span>
                  <strong>{store.city || store.country || 'Global'}</strong>
                </div>
              </div>
              <div className="artisan-info">
                <h3>Meet the Artisan</h3>
                <div className="artisan-name-title">
                  <span className="name">{store.storeName}</span>
                </div>
                <div className="artisan-story">
                  {store.description ? (
                    store.description.split('\n\n').map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    ))
                  ) : (
                    <p>A dedicated creator committed to the highest standards of quality and traditional craftsmanship.</p>
                  )}
                </div>
                <Link href={`/shop?vendor=${vendor.id}`} className="view-collection-link">View Store Collection &gt;</Link>
              </div>
            </div>
          </section>
        )}

        {/* Why It Matters */}
        <section className="why-it-matters-section">
          <h2 className="section-heading">Why It Matters</h2>
          <p className="section-subheading">Your purchase supports sustainable practices and empowers artisan communities worldwide.</p>

          <div className="matters-grid">
            <div className="matter-card">
              <div className="matter-icon"><HeartHandshake size={24} color="#FF5722" /></div>
              <h4>Fair Wages</h4>
              <p>Artisans set their own prices, ensuring they earn a living wage that supports their families and communities.</p>
            </div>
            <div className="matter-card">
              <div className="matter-icon"><ShieldCheck size={24} color="#FF5722" /></div>
              <h4>Cultural Preservation</h4>
              <p>By prioritizing traditional techniques, we help keep centuries-old crafting traditions alive for future generations.</p>
            </div>
            <div className="matter-card">
              <div className="matter-icon"><Leaf size={24} color="#FF5722" /></div>
              <h4>100% Organic</h4>
              <p>We use only locally sourced natural dyes and sustainable materials that are kind to both the maker and the earth.</p>
            </div>
          </div>
        </section>

        {/* Top Picks (Upsells) */}
        {upsellProducts.length > 0 && (
          <section className="related-products-section top-picks-section">
            <h3 className="related-heading">Top Picks</h3>
            <p className="section-subheading">Recommended alternatives you might love</p>
            <div className="related-grid">
              {upsellProducts.map(item => (
                <Link href={`/product/${item.id}`} key={item.id} className="related-card top-pick-card">
                  <div className="top-pick-badge">Top Pick</div>
                  <div className="related-image-wrapper">
                    <img
                      src={item.media && item.media.length > 0 ? `${BACKEND_URL}/uploads/products/${item.media.find(m => m.isPrimary)?.fileName || item.media[0].fileName}` : "https://via.placeholder.com/400x400"}
                      alt={item.name}
                    />
                  </div>
                  <div className="related-info">
                    <h5 className="related-name">{item.name}</h5>
                    <p className="related-price">&#8377;{(item.discountPrice || item.regularPrice).toFixed(2)}</p>
                    <span className="view-product-link">View Product &gt;</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Reviews */}
        <section className="reviews-section">
          <h2 className="section-heading-left">Customer Reviews</h2>

          <div className="reviews-overview">
            <div className="rating-summary">
              <div className="big-rating">
                <span className="number">{averageRating}</span>
                <div className="stars-and-count">
                  {renderStars(Math.round(parseFloat(averageRating)))}
                  <span className="count">Based on {reviews.length} reviews</span>
                </div>
              </div>
              {isLoggedIn ? (
                <button className="write-review-btn" onClick={() => setIsWritingReview(!isWritingReview)}>
                  {isWritingReview ? "Cancel" : "Write a Review"}
                </button>
              ) : (
                <Link href="/login" className="write-review-btn" style={{ textDecoration: 'none', display: 'inline-block', textAlign: 'center' }}>
                  Login to Write a Review
                </Link>
              )}
            </div>

            <div className="rating-bars">
              {getRatingDistribution().map((bar) => (
                <div key={bar.stars} className="rating-bar-row">
                  <span className="star-label">{bar.stars} Star</span>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${bar.pct}%` }}></div>
                  </div>
                  <span className="pct-label">{bar.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          {isWritingReview && (
            <div className="review-form-container" style={{ background: '#fcfcfc', padding: '20px', borderRadius: '8px', marginBottom: '30px', border: '1px solid #eee' }}>
              <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '1.2rem' }}>Write Your Review</h3>
              <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Rating</label>
                  <select
                    value={newReview.rating}
                    onChange={e => setNewReview({ ...newReview, rating: parseInt(e.target.value) })}
                    style={{ padding: '10px', width: '100%', borderRadius: '4px', border: '1px solid #ccc' }}
                  >
                    <option value={5}>5 Stars - Excellent</option>
                    <option value={4}>4 Stars - Good</option>
                    <option value={3}>3 Stars - Average</option>
                    <option value={2}>2 Stars - Poor</option>
                    <option value={1}>1 Star - Terrible</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Your Name</label>
                  <input
                    type="text"
                    placeholder="How you want your name to appear"
                    value={newReview.reviewerName}
                    onChange={e => setNewReview({ ...newReview, reviewerName: e.target.value })}
                    style={{ padding: '10px', width: '100%', borderRadius: '4px', border: '1px solid #ccc' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Review Title</label>
                  <input
                    type="text"
                    required
                    placeholder="Summarize your experience"
                    value={newReview.title}
                    onChange={e => setNewReview({ ...newReview, title: e.target.value })}
                    style={{ padding: '10px', width: '100%', borderRadius: '4px', border: '1px solid #ccc' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Review</label>
                  <textarea
                    required
                    placeholder="What did you like or dislike? What should other shoppers know?"
                    value={newReview.text}
                    onChange={e => setNewReview({ ...newReview, text: e.target.value })}
                    rows={4}
                    style={{ padding: '10px', width: '100%', borderRadius: '4px', border: '1px solid #ccc', resize: 'vertical' }}
                  />
                </div>
                <button type="submit" disabled={submittingReview} style={{
                  padding: '12px 24px',
                  background: '#FF5722',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: submittingReview ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                  alignSelf: 'flex-start'
                }}>
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            </div>
          )}

          <div className="reviews-list">
            {reviews.length > 0 ? reviews.map((review) => (
              <div key={review.id || review.createdAt} className="review-item">
                <div className="review-header">
                  {renderStars(review.rating)}
                  <span className="review-date">
                    {review.createdAt ? new Date(review.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Just now'}
                  </span>
                </div>
                <h4 className="review-title">{review.title}</h4>
                <div className="reviewer-info">
                  <span className="reviewer-name">{review.reviewerName || 'Anonymous'}</span>
                  {review.verifiedBuyer && <span className="verified-buyer"><ShieldCheck size={12} className="verified-icon" /> Verified Buyer</span>}
                </div>
                <p className="review-text">{review.text}</p>

                {/* Display Review Images if present */}
                {review.images && review.images.length > 0 && (
                  <div className="review-images-gallery">
                    {review.images.map((img, index) => (
                      <div key={index} className="review-image-thumbnail">
                        <img
                          src={`${BACKEND_URL}/uploads/reviews/${img}`}
                          alt={`Review image ${index + 1}`}
                          onClick={() => window.open(`${BACKEND_URL}/uploads/reviews/${img}`, '_blank')}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {review.vendorReply && (
                  <div className="vendor-reply-block">
                    <div className="vrb-header">
                      <span className="vrb-title"><CornerDownRight size={14} /> ARTISAN&apos;S RESPONSE</span>
                      <span className="vrb-date">
                        {review.replyDate ? new Date(review.replyDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                      </span>
                    </div>
                    <p className="vrb-text">{review.vendorReply}</p>
                  </div>
                )}

                <div className="review-helpful">
                  <span className="helpful-question">Was this helpful?</span>
                  <button className="helpful-btn"><ThumbsUp size={14} /> {review.helpfulCount || 0}</button>
                  <button className="helpful-btn"><ThumbsDown size={14} /> {review.notHelpfulCount || 0}</button>
                </div>
              </div>
              )) : (
                <p style={{ padding: '2rem 0', color: '#666', fontStyle: 'italic' }}>No reviews yet. Be the first to review this product!</p>
              )}
              
              {reviews.length > 5 && (
                <div className="load-more-container">
                  <button className="load-more-btn">Load More Reviews</button>
                </div>
              )}
            </div>
          </section>
      
      {/* You May Also Like (Cross-sells, fallback to category-related) */}
     {(crossSellProducts.length > 0 || relatedProducts.length > 0) && (
       <section className="related-products-section">
         <h3 className="related-heading">You May Also Like</h3>
         <div className="related-grid">
           {(crossSellProducts.length > 0 ? crossSellProducts : relatedProducts).map(item => (
             <Link href={`/product/${item.id}`} key={item.id} className="related-card">
               <div className="related-image-wrapper">
                 <img
                   src={item.media && item.media.length > 0 ? `${BACKEND_URL}/uploads/products/${item.media.find(m => m.isPrimary)?.fileName || item.media[0].fileName}` : "https://via.placeholder.com/400x400"}
                   alt={item.name}
                 />
               </div>
               <div className="related-info">
                 <h5 className="related-name">{item.name}</h5>
                 <p className="related-price">&#8377;{(item.discountPrice || item.regularPrice).toFixed(2)}</p>
                 <span className="view-product-link">View Product &gt;</span>
               </div>
             </Link>
           ))}
         </div>
       </section>
      )}

        {/* Customer Gallery — UGC Photos */}
        {galleryMedia.length > 0 && (
          <section className="instafeed-section">
            <div className="instafeed-header">
              <div className="instafeed-brand">
                <svg viewBox="0 0 24 24" className="instafeed-logo" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="3"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <path d="M21 15l-5-5L5 21"/>
                </svg>
                <span className="instafeed-title">Customer Photos</span>
              </div>
            </div>

            {galleryLayout === 'slider' ? (
              <div className="instafeed-slider">
                <button className="instafeed-slider-btn instafeed-slider-prev"
                  onClick={() => setSliderIndex(prev => Math.max(0, prev - 3))}
                  style={{ display: galleryMedia.length <= 3 ? 'none' : 'flex' }}>
                  <ChevronLeft size={22} />
                </button>
                <div className="instafeed-slider-track">
                  <div className="instafeed-slider-wrapper" style={{ transform: `translateX(-${sliderIndex * 100}%)` }}>
                    {galleryMedia.map((img, index) => {
                      const imgUrl = getImageUrl(img.fileName);
                      return (
                        <div key={img.id} className="instafeed-slider-card"
                          onClick={() => setLightboxIndex(index)}>
                          <div className="instafeed-card-inner">
                            {imgUrl && (
                              <img src={imgUrl} alt="Customer photo" className="instafeed-thumb" loading="lazy" onError={handleImageError} />
                            )}
                            <div className="instafeed-card-fallback" style={{ display: 'flex' }}>
                              <svg viewBox="0 0 24 24" className="instafeed-card-icon" fill="none" stroke="#999" strokeWidth="1.5">
                                <rect x="3" y="3" width="18" height="18" rx="3"/>
                                <circle cx="8.5" cy="8.5" r="1.5"/>
                                <path d="M21 15l-5-5L5 21"/>
                              </svg>
                            </div>
                            <div className="instafeed-overlay">
                              <span className="instafeed-overlay-text">View Photo</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <button className="instafeed-slider-btn instafeed-slider-next"
                  onClick={() => setSliderIndex(prev => Math.min(prev + 3, Math.max(0, galleryMedia.length - 3)))}
                  style={{ display: galleryMedia.length <= 3 ? 'none' : 'flex' }}>
                  <ChevronRight size={22} />
                </button>
              </div>
            ) : (
              <div className="instafeed-grid">
                {galleryMedia.map((img, index) => {
                  const imgUrl = getImageUrl(img.fileName);
                  return (
                    <div key={img.id} className="instafeed-card"
                      onClick={() => setLightboxIndex(index)}
                      style={{ cursor: 'pointer' }}>
                      <div className="instafeed-card-inner">
                        {imgUrl && (
                          <img src={imgUrl} alt="Customer photo" className="instafeed-thumb" loading="lazy" onError={handleImageError} />
                        )}
                        <div className="instafeed-card-fallback" style={{ display: 'flex' }}>
                          <svg viewBox="0 0 24 24" className="instafeed-card-icon" fill="none" stroke="#999" strokeWidth="1.5">
                            <rect x="3" y="3" width="18" height="18" rx="3"/>
                            <circle cx="8.5" cy="8.5" r="1.5"/>
                            <path d="M21 15l-5-5L5 21"/>
                          </svg>
                        </div>
                        <div className="instafeed-overlay">
                          <span className="instafeed-overlay-text">View Photo</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Slider dots */}
            {galleryLayout === 'slider' && galleryMedia.length > 3 && (
              <div className="instafeed-dots">
                {Array.from({ length: Math.ceil(galleryMedia.length / 3) }, (_, i) => (
                  <button key={i} className={`instafeed-dot ${i * 3 === sliderIndex ? 'active' : ''}`}
                    onClick={() => setSliderIndex(i * 3)} />
                ))}
              </div>
            )}

             {/* Image Lightbox */}
             {lightboxIndex >= 0 && galleryMedia[lightboxIndex] && (
               <div className="instafeed-lightbox-overlay" onClick={() => setLightboxIndex(-1)}>
                 <div className="instafeed-lightbox-content" onClick={(e) => e.stopPropagation()}>
                   <button className="instafeed-lightbox-close" onClick={() => setLightboxIndex(-1)}>&times;</button>
                   <div className="instafeed-lightbox-body">
                     <div className="instafeed-lightbox-embed">
                       <img
                         src={getImageUrl(galleryMedia[lightboxIndex].fileName)}
                         alt="Customer photo"
                         className="instafeed-lightbox-img"
                       />
                     </div>
                     <div className="instafeed-lightbox-info">
                       <a
                         href={galleryMedia[lightboxIndex].fileName}
                         target="_blank"
                         rel="noopener noreferrer"
                         className="instafeed-lightbox-link"
                       >
                         Open in new tab →
                       </a>
                     </div>
                   </div>
                   {galleryMedia.length > 1 && (
                     <div className="instafeed-lightbox-nav">
                       <button className="instafeed-lightbox-nav-btn prev"
                         onClick={() => setLightboxIndex(prev => (prev - 1 + galleryMedia.length) % galleryMedia.length)}>
                         <ChevronLeft size={24} />
                       </button>
                       <div className="instafeed-lightbox-counter">
                         {lightboxIndex + 1} / {galleryMedia.length}
                       </div>
                       <button className="instafeed-lightbox-nav-btn next"
                         onClick={() => setLightboxIndex(prev => (prev + 1) % galleryMedia.length)}>
                         <ChevronRight size={24} />
                       </button>
                     </div>
                   )}
                 </div>
               </div>
             )}
             
             {/* Product Image Lightbox */}
             {productLightboxIndex >= 0 && product.media && product.media[productLightboxIndex] && (
               <div className="product-lightbox-overlay" onClick={() => setProductLightboxIndex(-1)}>
                 <div className="product-lightbox-content" onClick={(e) => e.stopPropagation()}>
                   <button className="product-lightbox-close" onClick={() => setProductLightboxIndex(-1)}>&times;</button>
                   <div className="product-lightbox-body">
                     <div className="product-lightbox-image">
                       <img
                         src={`${BACKEND_URL}/uploads/products/${product.media[productLightboxIndex].fileName}`}
                         alt={product.name}
                         className="product-lightbox-img"
                       />
                     </div>
                     <div className="product-lightbox-details">
                       <h3 className="product-lightbox-title">{product.name}</h3>
                       <div className="product-lightbox-price">
                         {product.discountPrice ? (
                           <>
                             <span className="product-lightbox-price-new">&#8377;{product.discountPrice.toFixed(2)}</span>
                             <span className="product-lightbox-price-old">&#8377;{product.regularPrice.toFixed(2)}</span>
                             {product.regularPrice > product.discountPrice && (
                               <span className="product-lightbox-badge">
                                 -{Math.round(((product.regularPrice - product.discountPrice) / product.regularPrice) * 100)}%
                               </span>
                             )}
                           </>
                         ) : (
                           `&#8377;${product.regularPrice.toFixed(2)}`
                         )}
                       </div>
                       <div className="product-lightbox-rating">
                         {renderStars(Math.round(parseFloat(averageRating)))}
                         <span className="product-lightbox-rating-text">
                           {averageRating} ({reviews.length} reviews)
                         </span>
                       </div>
                       <p className="product-lightbox-description">
                         {product.shortDescription || product.description?.substring(0, 100) + '...'}
                       </p>
                     </div>
                   </div>
                   {product.media.length > 1 && (
                     <div className="product-lightbox-nav">
                       <button className="product-lightbox-nav-btn prev"
                         onClick={() => setProductLightboxIndex(prev => (prev - 1 + product.media.length) % product.media.length)}>
                         <ChevronLeft size={24} />
                       </button>
                       <div className="product-lightbox-counter">
                         {productLightboxIndex + 1} / {product.media.length}
                       </div>
                       <button className="product-lightbox-nav-btn next"
                         onClick={() => setProductLightboxIndex(prev => (prev + 1) % product.media.length)}>
                         <ChevronRight size={24} />
                       </button>
                     </div>
                   )}
                 </div>
               </div>
             )}
           </section>
         )}
        </main>
      </div>
    );
};

export default ProductPageClient;
