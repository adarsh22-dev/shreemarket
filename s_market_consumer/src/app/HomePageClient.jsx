'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronRight, ChevronLeft, Heart, ShoppingBag } from 'lucide-react';
import ProductModal from '@/components/ProductModal';
import InstagramFeed from '@/components/InstagramFeed';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { BACKEND_URL } from '@/lib/api/shared';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Wooaiwidget from '@/components/Wooaiwidget';
import { getPlatformSettings } from '@/lib/api/client';
import './HomePage.css';

const DEFAULT_CATEGORIES = [
  { slug: 'grocery', name: 'Grocery & Gourmet Food', image: '/assets/Grocery_&_Gourmet_Food.svg' },
  { slug: 'health', name: 'Health & Household', image: '/assets/Health_&_Household.svg' },
  { slug: 'home', name: 'Home & Kitchen', image: '/assets/Home_&_Kitchen.svg' },
  { slug: 'beauty', name: 'Beauty & Personal Care', image: '/assets/Beauty_&_Personal_Care.svg' },
  { slug: 'clothing', name: 'Clothing, Shoes & Jewellery', image: '/assets/Clothing_Shoes_Jewellery.svg' },
  { slug: 'toys', name: 'Toys & Games', image: '/assets/Toys_&_Games.svg' },
  { slug: 'patio', name: 'Patio, Lawn & Garden', image: '/assets/Patio_Lawn_&_Garden.svg' },
  { slug: 'musical', name: 'Musical Instruments', image: '/assets/Musical_Instruments.svg' },
];

export default function HomePageClient({ topDeals, trendingProducts, featuredProducts, newArrivals = [], dynamicCategories }) {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [instaSettings, setInstaSettings] = useState({ homePageEnabled: true, homePageMaxPosts: 3, homePageTitle: 'Real-Life Looks' });
  const [catSlideIndex, setCatSlideIndex] = useState(0);
  const [catItemsPerView, setCatItemsPerView] = useState(6);
  const [catPaused, setCatPaused] = useState(false);
  const catSlideInterval = useRef(null);
  const catTrackRef = useRef(null);

  const displayProducts = useMemo(() => {
    const allInstaProducts = [...new Map([...topDeals, ...trendingProducts, ...featuredProducts]
      .filter(p => p?.media?.some(m => m.fileType === 'instagram-url'))
      .map(p => [p.id, p])).values()];
    const featuredIds = instaSettings.featuredProductIds || [];
    return featuredIds.length > 0
      ? allInstaProducts.filter(p => featuredIds.includes(p.id))
      : allInstaProducts;
  }, [topDeals, trendingProducts, featuredProducts, instaSettings.featuredProductIds]);

  useEffect(() => {
    getPlatformSettings()
      .then(data => { if (data?.instagram) setInstaSettings(data.instagram); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const calcItemsPerView = () => {
      const w = window.innerWidth;
      if (w < 480) setCatItemsPerView(2);
      else if (w < 768) setCatItemsPerView(3);
      else if (w < 1024) setCatItemsPerView(4);
      else setCatItemsPerView(6);
    };
    calcItemsPerView();
    window.addEventListener('resize', calcItemsPerView);
    return () => window.removeEventListener('resize', calcItemsPerView);
  }, []);

  const effectiveCategories = dynamicCategories.length > 0 ? dynamicCategories : DEFAULT_CATEGORIES;
  const totalCatSlides = Math.max(1, Math.ceil(effectiveCategories.length / catItemsPerView));

  useEffect(() => {
    setCatSlideIndex(0);
  }, [dynamicCategories.length]);

  const goToCatSlide = useCallback((index) => {
    const total = totalCatSlides;
    setCatSlideIndex((((index % total) + total) % total));
  }, [totalCatSlides]);

  const nextCatSlide = useCallback(() => {
    goToCatSlide(catSlideIndex + 1);
  }, [catSlideIndex, goToCatSlide]);

  const prevCatSlide = useCallback(() => {
    goToCatSlide(catSlideIndex - 1);
  }, [catSlideIndex, goToCatSlide]);

  useEffect(() => {
    if (catPaused || totalCatSlides <= 1) return;
    catSlideInterval.current = setInterval(() => {
      setCatSlideIndex(prev => (prev + 1) % totalCatSlides);
    }, 4000);
    return () => clearInterval(catSlideInterval.current);
  }, [totalCatSlides, catPaused]);

  const { cartItems, addToCart } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();

  const getImageUrl = (product) => {
    if (product.media && product.media.length > 0)
      return `${BACKEND_URL}/uploads/products/${product.media[0].fileName}`;
    return 'https://placehold.co/800x800?text=No+Image';
  };

  const handleHeartClick = (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist({ ...product, image: getImageUrl(product), price: product.price || product.discountPrice || product.regularPrice || 0 });
    }
  };

  const handleAddToCart = (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({ ...product, image: getImageUrl(product), price: product.price || product.discountPrice || product.regularPrice || 0 }, 1, product.variant);
  };

  const openProductModal = (product) => {
    setSelectedProduct({ ...product, image: getImageUrl(product), price: product.discountPrice || product.regularPrice || 0, details: product.details || { material: 'Handwoven' } });
  };

  const categories = effectiveCategories;

  const renderProductCard = (product, prefix) => {
    const imageUrl = getImageUrl(product);
    const displayPrice = product.discountPrice || product.regularPrice || 0;
    return (
      <div key={`${prefix}-${product.id}`} className="figma-product-card" onClick={() => openProductModal(product)}>
        <div className="figma-img-wrapper">
          {product.discountPrice && product.regularPrice && product.regularPrice > product.discountPrice && (
            <span className="discount-badge">-{Math.round(((product.regularPrice - product.discountPrice) / product.regularPrice) * 100)}%</span>
          )}
          <button className="heart-btn heart-top-right" onClick={(e) => handleHeartClick(e, product)}>
            <Heart size={18} color={isInWishlist(product.id) ? "red" : "white"} fill={isInWishlist(product.id) ? "red" : "none"} />
          </button>
          <img src={imageUrl} alt={product.name} style={{ objectFit: 'contain', backgroundColor: 'white' }} />
          <div className="inner-rating-badge">{(product.averageRating || 0).toFixed(1)} <span style={{ color: '#FFB800' }}>★</span> ({product.reviewCount || 0})</div>
        </div>
        <div className="figma-info-wrapper">
          <h3 className="figma-product-title">{product.name}</h3>
          <p className="figma-product-subtitle">{product.vendor?.storeName || 'SreeMarket Vendor'}</p>
          <div className="figma-price-row">
            <span className="price-new">₹{parseFloat(displayPrice).toFixed(2)}</span>
            {product.discountPrice && product.regularPrice && product.regularPrice > product.discountPrice && (
              <span className="price-old">₹{parseFloat(product.regularPrice).toFixed(2)}</span>
            )}
            <span className="color-count">1 Color</span>
          </div>
          <button className="card-add-to-cart-btn" onClick={(e) => handleAddToCart(e, product)}><ShoppingBag size={14} /> Add to Cart</button>
        </div>
      </div>
    );
  };

  return (
    <div className="home-page">
      <Navbar />

      {/* Hero Grid Section */}
      <section className="hero-grid-section">
        <div className="hero-main-banner" style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.6)), url(/assets/homepgI1.png)` }}>
          <div className="hero-main-content">
            <h2>online experiences for indian handmade goods</h2>
            <Link href="/shop" className="btn-hero-explore">EXPLORE</Link>
          </div>
        </div>
        <div className="hero-side-banners">
          <div className="hero-side-banner" style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.4)), url(/assets/Traditional_Potli_Gift.png)` }}>
            <div className="hero-side-content">
              <h3>Timeless Traditions</h3>
              <Link href="/shop" className="btn-hero-link">Shop now <ArrowRight size={14} /></Link>
            </div>
          </div>
          <div className="hero-side-banner" style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.4)), url("https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600")' }}>
            <div className="hero-side-content">
              <h3>Premium Quality</h3>
              <Link href="/shop" className="btn-hero-link">Shop now <ArrowRight size={14} /></Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Categories — Image Slider */}
      <section className="featured-categories-section">
        <div className="section-header-row">
          <h2 className="section-heading">FEATURED CATEGORIES</h2>
          <Link href="/shop" className="view-all-link">See All <ArrowRight size={16} /></Link>
        </div>
        <div className="cat-slider-container" onMouseEnter={() => setCatPaused(true)} onMouseLeave={() => setCatPaused(false)}>
          <button className="cat-slider-arrow cat-slider-arrow-left" onClick={prevCatSlide} aria-label="Previous categories">
            <ChevronLeft size={22} />
          </button>
          <div className="cat-slider-viewport" ref={catTrackRef}>
            <div className="cat-slider-track" style={{ transform: `translateX(-${catSlideIndex * 100}%)` }}>
              {categories.map(cat => (
                <Link href={`/shop?category=${cat.slug}`} className="cat-slide-item" key={cat.slug || cat.name}>
                  <div className="cat-slide-img-wrap">
                    {cat.image ? (
                      <img src={cat.image} alt={cat.name} />
                    ) : (
                      <div className="strip-cat-placeholder"><ShoppingBag size={28} color="#999" /></div>
                    )}
                    <span className="cat-slide-name">{cat.name}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
          <button className="cat-slider-arrow cat-slider-arrow-right" onClick={nextCatSlide} aria-label="Next categories">
            <ChevronRight size={22} />
          </button>
        </div>
        <div className="cat-slider-dots">
          {Array.from({ length: totalCatSlides }, (_, i) => (
            <button key={i} className={`cat-slider-dot${i === catSlideIndex ? ' active' : ''}`} onClick={() => goToCatSlide(i)} aria-label={`Go to slide ${i + 1}`} />
          ))}
        </div>
      </section>

      {/* Trust Banners */}
      <div className="trust-banners-fullwidth">
        <div className="trust-banners-container">
          <div className="trust-item">
            <div className="trust-text"><h4>Easy Payment Options</h4><p>100% Protected</p></div>
            <div className="trust-icon-img"><img src="/assets/BannerImg1.svg" alt="Payment" /></div>
          </div>
          <div className="trust-item">
            <div className="trust-text"><h4>Easy Returns</h4><p>7 Day Return Policy</p></div>
            <div className="trust-icon-img"><img src="/assets/BannerImg2.svg" alt="Returns" /></div>
          </div>
          <div className="trust-item">
            <div className="trust-text"><h4>Verified Artisans</h4><p>Certified & Authenticated</p></div>
            <div className="trust-icon-img"><img src="/assets/BannerImg3.svg" alt="Verified" /></div>
          </div>
          <div className="trust-item">
            <div className="trust-text"><h4>Genuine Products</h4><p>Directly Sourced</p></div>
            <div className="trust-icon-img"><img src="/assets/BannerImg4.svg" alt="Handmade" /></div>
          </div>
        </div>
      </div>

      {/* Top Deals Section */}
      <section className="deals-trending-section">
        <div className="section-header-row section-header-centered">
          <h2 className="section-heading">TOP DEALS</h2>
          <Link href="/shop" className="view-all-link">View All <ChevronRight size={16} /></Link>
        </div>
        <div className="top-deals-grid">
          {topDeals.map((product, index) => {
            const imageUrl = getImageUrl(product);
            const isHero = index === 1;
            if (isHero) {
              return (
                <div key={`top-${product.id}`} className="top-deal-hero-card" onClick={() => openProductModal(product)}>
                  <div className="deal-image-wrapper">
                    {product.discountPrice && product.regularPrice && product.regularPrice > product.discountPrice && (
                      <span className="discount-badge">-{Math.round(((product.regularPrice - product.discountPrice) / product.regularPrice) * 100)}%</span>
                    )}
                    <button className="heart-btn heart-top-right" onClick={(e) => handleHeartClick(e, product)}>
                      <Heart size={18} color={isInWishlist(product.id) ? "red" : "white"} fill={isInWishlist(product.id) ? "red" : "none"} />
                    </button>
                    <img src={imageUrl} alt={product.name} />
                    <div className="inner-rating-badge">{(product.averageRating || 0).toFixed(1)} <span style={{ color: '#FFB800' }}>★</span> ({product.reviewCount || 0})</div>
                  </div>
                  <div className="deal-text-content">
                    <h3 className="deal-title">{product.name}</h3>
                    <p className="deal-desc">{product.shortDescription || product.description || 'An elegant pure silk saree crafted with fine zari detailing.'}</p>
                    <span className="deal-shop-link" onClick={(e) => handleAddToCart(e, product)}>Add to Cart</span>
                  </div>
                </div>
              );
            }
            return (
              <div key={`top-${product.id}`} className="figma-product-card" onClick={() => openProductModal(product)}>
                <div className="figma-img-wrapper">
                  {product.discountPrice && product.regularPrice && product.regularPrice > product.discountPrice && (
                    <span className="discount-badge">-{Math.round(((product.regularPrice - product.discountPrice) / product.regularPrice) * 100)}%</span>
                  )}
                  <button className="heart-btn heart-top-right" onClick={(e) => handleHeartClick(e, product)}>
                    <Heart size={18} color={isInWishlist(product.id) ? "red" : "white"} fill={isInWishlist(product.id) ? "red" : "none"} />
                  </button>
                  <img src={imageUrl} alt={product.name} />
                  <div className="inner-rating-badge">{(product.averageRating || 0).toFixed(1)} <span style={{ color: '#FFB800' }}>★</span> ({product.reviewCount || 0})</div>
                </div>
                <div className="figma-info-wrapper">
                  <h3 className="figma-product-title">{product.name}</h3>
                  <p className="figma-product-subtitle">{product.vendor?.storeName || 'Handwoven'}</p>
                  <div className="figma-price-row">
                    <span className="price-new">₹{parseFloat(product.discountPrice || product.regularPrice || 0).toFixed(2)}</span>
                    {product.discountPrice && product.regularPrice && product.regularPrice > product.discountPrice && (
                      <span className="price-old">₹{parseFloat(product.regularPrice).toFixed(2)}</span>
                    )}
                  </div>
                  <button className="card-add-to-cart-btn" onClick={(e) => handleAddToCart(e, product)}><ShoppingBag size={14} /> Add to Cart</button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* New Arrivals Section */}
      {newArrivals.length > 0 && (
        <section className="new-arrivals-section">
          <div className="section-header-row">
            <h2 className="section-heading section-heading-new-arrivals">
              <span className="new-arrivals-badge-dot" /> NEW ARRIVALS
            </h2>
            <Link href="/shop" className="view-all-link">View All <ChevronRight size={16} /></Link>
          </div>
          <div className="four-col-products-grid">
            {newArrivals.slice(0, 8).map(p => renderProductCard(p, 'new'))}
          </div>
        </section>
      )}

      {/* Promo Banner */}
      <div className="promo-banner-fullwidth">
        <div className="promo-banner-container">
          <div className="promo-bg-graphic">% 50</div>
          <div className="promo-banner-content">
            <h2 className="promo-banner-title">Authentic Indian Handmade Products, Delivered to Your Door</h2>
            <p className="promo-banner-desc">Supporting local artisans with quality products at retail and wholesale prices across India.</p>
          </div>
          <div className="promo-banner-image">
            <img src="/assets/PromoBannerImg.svg" alt="Indian Handmade Crafts" />
          </div>
        </div>
      </div>

      {/* Trending Products */}
      <section className="trending-featured-section">
        <div className="section-header-row">
          <h2 className="section-heading">TRENDING PRODUCTS</h2>
          <Link href="/shop" className="view-all-link">View All <ChevronRight size={16} /></Link>
        </div>
        <div className="four-col-products-grid">
          {trendingProducts.length > 0 ? trendingProducts.map(p => renderProductCard(p, 'trend')) : (
            <p style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem 0', color: '#666' }}>No trending products found.</p>
          )}
        </div>
      </section>

      {/* Hand Crafted With Tradition */}
      <section className="handcrafted-section">
        <div className="handcrafted-header">
          <h2 className="section-heading">HAND CRAFTED WITH TRADITION</h2>
          <span className="handcrafted-badge">UP TO 60% OFF</span>
        </div>
        <div className="handcrafted-content">
          <div className="handcrafted-banner">
            <img src="/assets/WalnutEdgeBoard.png" alt="Handcrafted Tradition" />
            <div className="handcrafted-overlay">
              <p className="handcrafted-overlay-text">WOVEN IN <strong>TRADITION</strong> AND ROOTED IN TIMELESS <strong>CRAFT</strong></p>
              <Link href="/shop" className="handcrafted-view-all">View All</Link>
            </div>
          </div>
          <div className="handcrafted-categories">
            <div className="handcrafted-cat-tab"><span className="handcrafted-cat-icon">🏺</span><span className="handcrafted-cat-label">HANDMADE POTTERY</span></div>
            <div className="handcrafted-cat-tab"><span className="handcrafted-cat-icon">🎨</span><span className="handcrafted-cat-label">ART & CRAFT PIECES</span></div>
            <div className="handcrafted-cat-tab"><span className="handcrafted-cat-icon">🧴</span><span className="handcrafted-cat-label">AYURVEDIC HANDMADE SOAPS</span></div>
            <div className="handcrafted-cat-tab"><span className="handcrafted-cat-icon">🔔</span><span className="handcrafted-cat-label">BRASS & WOODEN CRAFTS</span></div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="trending-featured-section">
        <div className="section-header-row">
          <h2 className="section-heading">FEATURED PRODUCTS</h2>
          <Link href="/shop" className="view-all-link">View All <ChevronRight size={16} /></Link>
        </div>
        <div className="four-col-products-grid">
          {featuredProducts.length > 0 ? featuredProducts.map(p => renderProductCard(p, 'feat')) : (
            <p style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem 0', color: '#666' }}>No featured products found.</p>
          )}
        </div>
      </section>

      {/* Instagram Feed — Shoppable Stories */}
      {instaSettings.homePageEnabled !== false && displayProducts.length > 0 && (
        <section className="home-instagram-section">
          <h2 className="section-heading">{instaSettings.homePageTitle || 'Real-Life Looks'}</h2>
          <p className="section-subheading">Discover products styled by our community</p>
          <InstagramFeed products={displayProducts} maxPosts={instaSettings.homePageMaxPosts || 3} storyShape={instaSettings.storyShape} />
        </section>
      )}

      {/* Values/Mission Section */}
      <div className="values-mission-fullwidth">
        <section className="values-mission-section">
          <div className="vm-content">
            <div className="vm-logo">
              <img src="/assets/smarketlogo.svg" alt="SreeMarket" className="vm-logo-image" style={{ height: '60px', width: 'auto', marginBottom: '15px' }} />
            </div>
            <h2 className="vm-title">We believe a home should <br />reflect your values.</h2>
            <p className="vm-desc">Founded on the belief that luxury and social responsibility are not mutually exclusive, SreeMarket works directly with over 45 artisan co-ops across 12 countries.</p>
            <div className="vm-stats-row">
              <div className="vm-stat"><span className="vm-stat-number">45+</span><span className="vm-stat-label">PARTNER CO-OPS</span></div>
              <div className="vm-stat"><span className="vm-stat-number">₹2.4M</span><span className="vm-stat-label">DIRECT ARTISAN INCOME</span></div>
            </div>
          </div>
          <div className="vm-image">
            <img src="/assets/homepgI2.png" alt="Weaver artisan" />
          </div>
        </section>
      </div>

      <Footer />

      {selectedProduct && <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />}
      <Wooaiwidget />
    </div>
  );
}
