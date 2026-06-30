import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './HomePage.css';
import { ArrowRight, ChevronRight, ChevronLeft, Heart, Users, DollarSign, ShoppingBag, Share2, GitCompare, Link as LinkIcon, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import ProductModal from '../components/ProductModal';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useCompare } from '../context/CompareContext';
import { getAllProducts, getCategories, BACKEND_URL, getPrimaryGalleryImage, getGalleryImageUrl, PLACEHOLDER_IMG, PLACEHOLDER_FAILED, getPlatformSettings, getHomepageSections } from '../api/api';
import DynamicSectionRenderer from '../components/DynamicSectionRenderer';
import FeaturedProductSection from '../components/FeaturedProductSection';
import homepageim1 from '../assets/homepgI1.png'
import GroceryGourmentFoodCatImg from '../assets/Grocery_&_Gourmet_Food.svg'
import HealthHouseholdCatImg from '../assets/Health_&_Household.svg'
import HomeKitchenCatImg from '../assets/Home_&_Kitchen.svg'
import BeautyPersonalCareCatImg from '../assets/Beauty_&_Personal_Care.svg'
import ClothingShoesJewelleryCatImg from '../assets/Clothing_Shoes_Jewellery.svg'
import ToysGamesCatImg from '../assets/Toys_&_Games.svg'
import PatioLawnGardenCatImg from '../assets/Patio_Lawn_&_Garden.svg'
import MusicalInstrumentsCatImg from '../assets/Musical_Instruments.svg'
import ArtsCraftsCatImg from '../assets/Arts_Crafts.svg'

const CATEGORY_IMAGE_MAP = {
    'grocery & gourmet food': GroceryGourmentFoodCatImg,
    'grocery': GroceryGourmentFoodCatImg,
    'health & household': HealthHouseholdCatImg,
    'health': HealthHouseholdCatImg,
    'home & kitchen': HomeKitchenCatImg,
    'home': HomeKitchenCatImg,
    'beauty & personal care': BeautyPersonalCareCatImg,
    'beauty': BeautyPersonalCareCatImg,
    'clothing, shoes & jewellery': ClothingShoesJewelleryCatImg,
    'clothing': ClothingShoesJewelleryCatImg,
    'toys & games': ToysGamesCatImg,
    'toys': ToysGamesCatImg,
    'patio, lawn & garden': PatioLawnGardenCatImg,
    'patio': PatioLawnGardenCatImg,
    'musical instruments': MusicalInstrumentsCatImg,
    'musical': MusicalInstrumentsCatImg,
    'arts & crafts': ArtsCraftsCatImg,
    'arts': ArtsCraftsCatImg,
};
import BannerImg1 from '../assets/BannerImg1.svg'
import BannerImg2 from '../assets/BannerImg2.svg'
import BannerImg3 from '../assets/BannerImg3.svg'
import BannerImg4 from '../assets/BannerImg4.svg'
import PromoBannerImg from '../assets/PromoBannerImg.svg'
import PromoBannerImg2 from '../assets/promo_banner_craft.png'
import homepgI2 from '../assets/homepgI2.png'
import homepgI3 from '../assets/Traditional_Potli_Gift.png'
import handcraftcarousel from '../assets/WalnutEdgeBoard.png'
import kanjivaramSaree from '../assets/kanjivaramsaree1.jpeg'
import kanjivaramSaree3 from '../assets/kanjivaram3.jpeg'
import logo from '../assets/smarketlogo.svg';
import Wooaiwidget from '../components/Wooaiwidget';
import TestimonialCarousel from '../components/TestimonialCarousel';
import { WebsiteSeo, OrganizationSeo } from '../components/SeoMeta';

const CategoriesSlider = React.memo(({ categories }) => {
  const [slideIndex, setSlideIndex] = React.useState(0);
  const [itemsPerView, setItemsPerView] = React.useState(6);
  const intervalRef = React.useRef(null);
  const [paused, setPaused] = React.useState(false);
  const totalSlides = Math.max(1, Math.ceil((categories.length || 0) / itemsPerView));

  React.useEffect(() => {
    const calc = () => {
      const w = window.innerWidth;
      if (w < 480) setItemsPerView(2);
      else if (w < 768) setItemsPerView(3);
      else if (w < 1024) setItemsPerView(4);
      else setItemsPerView(6);
    };
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, []);

  React.useEffect(() => { setSlideIndex(0); }, [categories.length]);

  React.useEffect(() => {
    if (categories.length === 0 || totalSlides <= 1 || paused) return;
    intervalRef.current = setInterval(() => setSlideIndex(prev => (prev + 1) % totalSlides), 4000);
    return () => clearInterval(intervalRef.current);
  }, [totalSlides, categories.length, paused]);

  const goTo = (i) => setSlideIndex(((i % totalSlides) + totalSlides) % totalSlides);

  return (
    <div className="cat-slider-container" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <button type="button" className="cat-slider-arrow cat-slider-arrow-left" onClick={() => goTo(slideIndex - 1)} aria-label="Previous categories">
        <ChevronLeft size={22} />
      </button>
      <div className="cat-slider-viewport">
        <div className="cat-slider-track" style={{ transform: `translateX(-${slideIndex * 100}%)` }}>
          {(categories.length > 0 ? categories : []).map(cat => (
            <Link to={`/shop?category=${cat.slug}`} className="cat-slide-item" key={cat.slug || cat.name}>
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
      <button type="button" className="cat-slider-arrow cat-slider-arrow-right" onClick={() => goTo(slideIndex + 1)} aria-label="Next categories">
        <ChevronRight size={22} />
      </button>
      <div className="cat-slider-dots">
        {categories.length > 0 && Array.from({ length: totalSlides }, (_, i) => (
          <button type="button" key={i} className={`cat-slider-dot${i === slideIndex ? ' active' : ''}`} onClick={() => goTo(i)} aria-label={`Go to slide ${i + 1}`} />
        ))}
      </div>
    </div>
  );
});

const useRevealOnScroll = () => {
    const ref = useRef(null);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); } },
            { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);
    return ref;
};

const HomePage = () => {
    const [selectedProduct, setSelectedProduct] = React.useState(null);
    const { cartItems, addToCart } = useCart();
    const { isInWishlist, addToWishlist, removeFromWishlist, isLoggedIn } = useWishlist();
    const { isInCompare, addToCompare, removeFromCompare } = useCompare();
    const [topDeals, setTopDeals] = React.useState([]);
    const [trendingProducts, setTrendingProducts] = React.useState([]);
    const [featuredProducts, setFeaturedProducts] = React.useState([]);
    const [allProducts, setAllProducts] = React.useState([]);
    const [dynamicCategories, setDynamicCategories] = React.useState([]);
    const [cmsSections, setCmsSections] = React.useState(null);

    // Image error handler for broken images
    const handleImageError = (e, productName) => {
        e.target.onerror = null;
        if (!e.target.src.startsWith('data:image/svg+xml')) {
            e.target.src = PLACEHOLDER_FAILED;
        }
        e.target.style.objectFit = 'contain';
        e.target.style.padding = '20px';
    };

    // Instagram story modal state
    const [storyProduct, setStoryProduct] = React.useState(null);
    const [storyPostIndex, setStoryPostIndex] = React.useState(0);
    const [instaEmbedLoaded, setInstaEmbedLoaded] = React.useState(false);
    const [instaSettings, setInstaSettings] = React.useState({ homePageEnabled: true, homePageMaxPosts: 3, homePageTitle: 'Real-Life Looks' });
    const [instaIndex, setInstaIndex] = React.useState(0);

    const extractShortcode = (url) => {
        if (!url) return null;
        const match = url.match(/(?:instagram\.com\/p\/|instagram\.com\/reel\/)([a-zA-Z0-9_-]+)/);
        return match ? match[1] : null;
    };

    const isInstagramReel = (url) => url && url.includes('/reel/');

    const getInstagramEmbedUrl = (url) => {
        const shortcode = extractShortcode(url);
        if (!shortcode) return null;
        const base = isInstagramReel(url) ? 'reel' : 'p';
        return `https://www.instagram.com/${base}/${shortcode}/embed/${isInstagramReel(url) ? '?autoplay=1' : ''}`;
    };

    const getProductPrimaryImage = (product) => {
        if (!product?.media?.length) return PLACEHOLDER_IMG;
        const primary = product.media.find(m => m.isPrimary) || product.media[0];
        if (!primary?.fileName) return PLACEHOLDER_IMG;
        if (primary.fileName.startsWith('http://') || primary.fileName.startsWith('https://')) return primary.fileName;
        return `${BACKEND_URL}/uploads/products/${primary.fileName}`;
    };

    const getInstaThumbnail = (product) => {
        const instaMedia = product?.media?.find(m => m.fileType === 'instagram-url' && m.fileName);
        if (!instaMedia?.fileName) return getProductPrimaryImage(product);
        if (instaMedia.customThumbnail) return `${BACKEND_URL}/uploads/products/${instaMedia.customThumbnail}`;
        return getProductPrimaryImage(product);
    };

     React.useEffect(() => {
         const fetchHomePageProducts = async () => {
             try {
                 const data = await getAllProducts();
                 setAllProducts(data);

                 // Sort products by discount percentage
                 const sortedByDiscount = [...data].sort((a, b) => {
                     const getDiscountPercentage = (p) => {
                         if (!p.regularPrice || !p.discountPrice || p.regularPrice <= p.discountPrice) return 0;
                         return ((p.regularPrice - p.discountPrice) / p.regularPrice) * 100;
                     };
                     return getDiscountPercentage(b) - getDiscountPercentage(a);
                 });

                  // Get top 5 discounted products (slider)
                  setTopDeals(sortedByDiscount.slice(0, 5));

                 // Set trending products (Sort by bookingCount descending, max 12)
                  const trending = [...data]
                      .sort((a, b) => (b.bookingCount || 0) - (a.bookingCount || 0))
                      .slice(0, 12);
                  setTrendingProducts(trending);
                  // Set featured (next 5 products from the sorted list)
                  setFeaturedProducts(sortedByDiscount.length > 7 ? sortedByDiscount.slice(7, 12) : sortedByDiscount.slice(0, 5));

                  // Fetch admin-managed categories
                  try {
                      const cats = await getCategories();
                      const activeCats = (cats || [])
                          .filter(cat => cat.status === 'Active')
                          .map(cat => ({
                              id: cat.id,
                              name: cat.name,
                              slug: cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
                              image: cat.image
                                  ? (cat.image.startsWith('/uploads') ? `${BACKEND_URL}${cat.image}` : cat.image)
                                  : CATEGORY_IMAGE_MAP[cat.name.toLowerCase()] || null,
                          }));
                      // Merge with vendor/product category names not in admin list
                      const productCatNames = [...new Set((data || []).map(p => p.category).filter(Boolean))];
                      const adminCatNames = new Set(activeCats.map(c => c.name.toLowerCase()));
                      const merged = [...activeCats];
                      for (const name of productCatNames) {
                        const lower = name.toLowerCase();
                        if (!adminCatNames.has(lower)) {
                          merged.push({
                            id: null,
                            name,
                            slug: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
                            image: CATEGORY_IMAGE_MAP[lower] || null,
                          });
                        }
                      }
                      setDynamicCategories(merged);
                  } catch (catError) {
                     console.error("Failed to load categories:", catError);
                 }
                 try {
                     const settings = await getPlatformSettings();
                     if (settings?.instagram) setInstaSettings(settings.instagram);
                 } catch (e) {
                     // ignore — use defaults
                 }
             } catch (error) {
                 console.error("Failed to load products for home page:", error);
                 // Set empty arrays as fallback
                 setTopDeals([]);
                 setTrendingProducts([]);
                 setFeaturedProducts([]);
                 setDynamicCategories([]);
             }
         };
         fetchHomePageProducts();
         // Fetch CMS-managed homepage sections (public, visible only)
          getHomepageSections().then(data => {
            if (!Array.isArray(data)) {
              console.warn("[HomePage] getHomepageSections did not return an array:", data);
              return;
            }
            if (data.length === 0) {
              console.warn("[HomePage] getHomepageSections returned empty array");
              return;
            }
            const transformed = [];
            for (const s of data) {
              if (s.visible === false) continue;
              let cfg = {};
              if (s.configJson) {
                try {
                  cfg = typeof s.configJson === 'string' ? JSON.parse(s.configJson) : s.configJson;
                } catch (e) {
                  console.warn("[HomePage] Failed to parse configJson for section", s.id, s.sectionType, e);
                }
              }
              transformed.push({
                id: s.id,
                t: s.sectionType,
                l: s.label || '',
                vis: s.visible !== false,
                cfg,
                sortOrder: s.sortOrder || 0,
              });
            }
            transformed.sort((a, b) => a.sortOrder - b.sortOrder);
            if (transformed.length > 0) {
              setCmsSections(transformed);
            } else {
              console.warn("[HomePage] No visible CMS sections found after filtering");
            }
          }).catch(err => console.error("[HomePage] Failed to load CMS sections:", err));
      }, []);
      const handleHeartClick = (e, product) => {
        e.preventDefault();
        e.stopPropagation();

        if (isInWishlist(product.id)) {
            removeFromWishlist(product.id);
        } else {
            const productImageUrl = product.media && product.media.length > 0
                ? `${BACKEND_URL}/uploads/products/${(product.media.filter(m => m.mediaType !== 'manufacturer')[0] || product.media[0]).fileName}`
                : PLACEHOLDER_IMG;

            addToWishlist({
                ...product,
                image: productImageUrl,
                price: product.price || product.discountPrice || product.regularPrice || 0
            });
        }
    };

    const handleAddToCart = (e, product) => {
        e.preventDefault();
        e.stopPropagation();

        const productImageUrl = product.media && product.media.length > 0
            ? `${BACKEND_URL}/uploads/products/${(product.media.filter(m => m.mediaType !== 'manufacturer')[0] || product.media[0]).fileName}`
            : PLACEHOLDER_IMG;

        addToCart({
            ...product,
            image: productImageUrl,
            price: product.price || product.discountPrice || product.regularPrice || 0
        }, 1, product.variant);
    };

    const isProductInCart = (id) => cartItems.some(item => item.id === id);

    const [shareProductId, setShareProductId] = useState(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (shareProductId && !e.target.closest('.hp-share-wrapper')) {
                setShareProductId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [shareProductId]);

    const handleShareClick = (e, product) => {
        e.stopPropagation();
        setShareProductId(shareProductId === product.id ? null : product.id);
    };

    const shareToWhatsApp = (product) => {
        const url = `${window.location.origin}/product/${product.id}`;
        const text = `Check out ${product.name} on SreeMarket!`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
        setShareProductId(null);
    };

    const shareToFacebook = (product) => {
        const url = `${window.location.origin}/product/${product.id}`;
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        setShareProductId(null);
    };

    const shareToTwitter = (product) => {
        const url = `${window.location.origin}/product/${product.id}`;
        const text = `Check out ${product.name} on SreeMarket!`;
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
        setShareProductId(null);
    };

    const shareToLinkedIn = (product) => {
        const url = `${window.location.origin}/product/${product.id}`;
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
        setShareProductId(null);
    };

    const copyShareLink = (product) => {
        const url = `${window.location.origin}/product/${product.id}`;
        navigator.clipboard.writeText(url).then(() => {
            toast.success('Link copied to clipboard!');
        }).catch(() => {});
        setShareProductId(null);
    };

    const Section = ({ children, className = '', delay = 0, variant = '' }) => {
        const ref = useRevealOnScroll();
        return (
            <div ref={ref} className={`fade-up ${variant} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
                {children}
            </div>
        );
    };

    return (
        <div className="home-page">
            <Navbar />
            <WebsiteSeo />
            <OrganizationSeo />

            {/* CMS Hero Banner — before categories */}
            {cmsSections && cmsSections.length > 0 ? (
              (() => {
                const hero = cmsSections.find(s => s.t === 'hero_banner');
                return hero ? (
                  <DynamicSectionRenderer
                    section={hero}
                    allProducts={allProducts}
                    allCategories={dynamicCategories}
                    topDeals={topDeals}
                    trendingProducts={trendingProducts}
                    featuredProducts={featuredProducts}
                    onProductClick={(p) => setSelectedProduct(p)}
                    handleHeartClick={handleHeartClick}
                    handleAddToCart={handleAddToCart}
                    isInWishlist={isInWishlist}
                    isInCompare={isInCompare}
                    addToCompare={addToCompare}
                    removeFromCompare={removeFromCompare}
                    shareProductId={shareProductId}
                    handleShareClick={handleShareClick}
                    shareToWhatsApp={shareToWhatsApp}
                    shareToFacebook={shareToFacebook}
                    shareToTwitter={shareToTwitter}
                    shareToLinkedIn={shareToLinkedIn}
                    copyShareLink={copyShareLink}
                    handleImageError={handleImageError}
                  />
                ) : null;
              })()
            ) : null}

            {/* Featured Categories — from CMS or fallback */}
            <Section delay={100} variant="section-gradient-warm">
            {(cmsSections && cmsSections.length > 0
              ? (() => {
                    const fc = cmsSections.find(s => s.t === 'featured_cats');
                    if (!fc) return null;
                    const catIds = fc.cfg?.cat_ids || [];
                    const filteredCats = catIds.length > 0 ? dynamicCategories.filter(c => catIds.includes(c.id)) : dynamicCategories;
                  return (
                    <section className="featured-categories-section">
                      <div className="section-header-row">
                        <h2 className="section-heading">{fc.cfg?.heading || 'FEATURED CATEGORIES'}</h2>
                        {fc.cfg?.sa_enabled !== false && <Link to={fc.cfg?.sa_link || '/shop'} className="view-all-link" style={{ background: fc.cfg?.sa_bg, color: fc.cfg?.sa_text }}>{fc.cfg?.sa_label || 'See All'} <ArrowRight size={16} /></Link>}
                      </div>
                      <div className="cat-slider-container">
                        <CategoriesSlider categories={dynamicCategories} />
                      </div>
                    </section>
                  );
                })()
              : null) || (
              /* fallback: always show categories from Product Management */
              <section className="featured-categories-section">
                <div className="section-header-row">
                  <h2 className="section-heading">FEATURED CATEGORIES</h2>
                  <Link to="/shop" className="view-all-link">See All <ArrowRight size={16} /></Link>
                </div>
                <div className="cat-slider-container">
                  <CategoriesSlider categories={dynamicCategories} />
                </div>
              </section>
            )}
            </Section>

            {/* Trust Banners — from CMS or fallback */}
            <Section delay={150}>
            {(cmsSections && cmsSections.length > 0
              ? (() => {
                  const tb = cmsSections.find(s => s.t === 'trust_banners');
                  return tb ? (
                    <DynamicSectionRenderer
                      section={tb}
                      allProducts={allProducts}
                      allCategories={dynamicCategories}
                      topDeals={topDeals}
                      trendingProducts={trendingProducts}
                      featuredProducts={featuredProducts}
                      onProductClick={(p) => setSelectedProduct(p)}
                      handleHeartClick={handleHeartClick}
                      handleAddToCart={handleAddToCart}
                      isInWishlist={isInWishlist}
                      isInCompare={isInCompare}
                      addToCompare={addToCompare}
                      removeFromCompare={removeFromCompare}
                      shareProductId={shareProductId}
                      handleShareClick={handleShareClick}
                      shareToWhatsApp={shareToWhatsApp}
                      shareToFacebook={shareToFacebook}
                      shareToTwitter={shareToTwitter}
                      shareToLinkedIn={shareToLinkedIn}
                      copyShareLink={copyShareLink}
                      handleImageError={handleImageError}
                    />
                  ) : null;
                })()
              : null) || (
              <div className="trust-banners-fullwidth">
                <div className="trust-banners-container">
                  <div className="trust-item">
                    <div className="trust-text"><h4>Easy Payment Options</h4><p>100% Protected</p></div>
                    <div className="trust-icon-img"><img src={BannerImg1} alt="Payment" /></div>
                  </div>
                  <div className="trust-item">
                    <div className="trust-text"><h4>Easy Returns</h4><p>7 Day Return Policy</p></div>
                    <div className="trust-icon-img"><img src={BannerImg2} alt="Returns" /></div>
                  </div>
                  <div className="trust-item">
                    <div className="trust-text"><h4>Verified Artisans</h4><p>Certified & Authenticated</p></div>
                    <div className="trust-icon-img"><img src={BannerImg3} alt="Verified" /></div>
                  </div>
                  <div className="trust-item">
                    <div className="trust-text"><h4>Genuine Products</h4><p>Directly Sourced</p></div>
                    <div className="trust-icon-img"><img src={BannerImg4} alt="Handmade" /></div>
                  </div>
                </div>
              </div>
            )}
            </Section>

            {/* TOP DEALS — always auto-computed */}
            <DynamicSectionRenderer
              section={{ t: 'top_deals', cfg: { heading: 'TOP DEALS' } }}
              allProducts={allProducts}
              allCategories={dynamicCategories}
              topDeals={topDeals}
              trendingProducts={trendingProducts}
              featuredProducts={featuredProducts}
              onProductClick={(p) => setSelectedProduct(p)}
              handleHeartClick={handleHeartClick}
              handleAddToCart={handleAddToCart}
              isInWishlist={isInWishlist}
              isInCompare={isInCompare}
              addToCompare={addToCompare}
              removeFromCompare={removeFromCompare}
              shareProductId={shareProductId}
              handleShareClick={handleShareClick}
              shareToWhatsApp={shareToWhatsApp}
              shareToFacebook={shareToFacebook}
              shareToTwitter={shareToTwitter}
              shareToLinkedIn={shareToLinkedIn}
              copyShareLink={copyShareLink}
              handleImageError={handleImageError}
            />
            {cmsSections && cmsSections.length > 0 ? (
              cmsSections.map((sec, i) => {
                if (sec.t === 'featured_cats') return null;
                if (sec.t === 'hero_banner') return null;
                if (sec.t === 'trust_banners') return null;
                if (sec.t === 'top_deals') return null;
                if (sec.t === 'values_mission') return null;
                if (sec.t === 'handcrafted') return null;
                if (sec.t === 'product_grid' && (sec.cfg?.heading || '').toLowerCase() === 'trending products') return null;
                if (sec.t === 'product_grid' && (sec.cfg?.heading || '').toLowerCase() === 'featured products') return null;
                const sectionVariant = i % 2 === 0 ? 'section-gradient-warm' : '';
                return (
                <Section key={sec.id || i} delay={100} variant={sectionVariant}>
                <DynamicSectionRenderer
                  section={sec}
                  allProducts={allProducts}
                  allCategories={dynamicCategories}
                  topDeals={topDeals}
                  trendingProducts={trendingProducts}
                  featuredProducts={featuredProducts}
                  onProductClick={(p) => setSelectedProduct(p)}
                  handleHeartClick={handleHeartClick}
                  handleAddToCart={handleAddToCart}
                  isInWishlist={isInWishlist}
                  isInCompare={isInCompare}
                  addToCompare={addToCompare}
                  removeFromCompare={removeFromCompare}
                  shareProductId={shareProductId}
                  handleShareClick={handleShareClick}
                  shareToWhatsApp={shareToWhatsApp}
                  shareToFacebook={shareToFacebook}
                  shareToTwitter={shareToTwitter}
                  shareToLinkedIn={shareToLinkedIn}
                  copyShareLink={copyShareLink}
                  handleImageError={handleImageError}
                />
                </Section>
              );})
            ) : null}

            {/* CMS Handcrafted section */}
            {cmsSections && cmsSections.length > 0 ? (
              cmsSections.map((sec, i) => {
                if (sec.t !== 'handcrafted') return null;
                return (
                <Section key={sec.id || i} delay={100} variant="section-gradient">
                <DynamicSectionRenderer
                  section={sec}
                  allProducts={allProducts}
                  allCategories={dynamicCategories}
                  topDeals={topDeals}
                  trendingProducts={trendingProducts}
                  featuredProducts={featuredProducts}
                  onProductClick={(p) => setSelectedProduct(p)}
                  handleHeartClick={handleHeartClick}
                  handleAddToCart={handleAddToCart}
                  isInWishlist={isInWishlist}
                  isInCompare={isInCompare}
                  addToCompare={addToCompare}
                  removeFromCompare={removeFromCompare}
                  shareProductId={shareProductId}
                  handleShareClick={handleShareClick}
                  shareToWhatsApp={shareToWhatsApp}
                  shareToFacebook={shareToFacebook}
                  shareToTwitter={shareToTwitter}
                  shareToLinkedIn={shareToLinkedIn}
                  copyShareLink={copyShareLink}
                  handleImageError={handleImageError}
                />
                </Section>
              );})
            ) : null}

            {/* TRENDING PRODUCTS — CMS version if exists, else auto */}
            {cmsSections && cmsSections.length > 0 ? (
              cmsSections.map((sec, i) => {
                if (sec.t !== 'product_grid' || (sec.cfg?.heading || '').toLowerCase() !== 'trending products') return null;
                return (
                <Section key={sec.id || i} delay={100} variant="section-gradient">
                <DynamicSectionRenderer
                  section={sec}
                  allProducts={allProducts}
                  allCategories={dynamicCategories}
                  topDeals={topDeals}
                  trendingProducts={trendingProducts}
                  featuredProducts={featuredProducts}
                  onProductClick={(p) => setSelectedProduct(p)}
                  handleHeartClick={handleHeartClick}
                  handleAddToCart={handleAddToCart}
                  isInWishlist={isInWishlist}
                  isInCompare={isInCompare}
                  addToCompare={addToCompare}
                  removeFromCompare={removeFromCompare}
                  shareProductId={shareProductId}
                  handleShareClick={handleShareClick}
                  shareToWhatsApp={shareToWhatsApp}
                  shareToFacebook={shareToFacebook}
                  shareToTwitter={shareToTwitter}
                  shareToLinkedIn={shareToLinkedIn}
                  copyShareLink={copyShareLink}
                  handleImageError={handleImageError}
                />
                </Section>
              );})
            ) : null}
            {(!cmsSections || !cmsSections.some(s => s.t === 'product_grid' && (s.cfg?.heading || '').toLowerCase() === 'trending products')) && (
            <Section delay={100} variant="section-gradient">
            <DynamicSectionRenderer
              section={{ t: 'product_grid', cfg: { heading: 'TRENDING PRODUCTS', source: 'trending', limit: 12 } }}
              allProducts={allProducts}
              allCategories={dynamicCategories}
              topDeals={topDeals}
              trendingProducts={trendingProducts}
              featuredProducts={featuredProducts}
              onProductClick={(p) => setSelectedProduct(p)}
              handleHeartClick={handleHeartClick}
              handleAddToCart={handleAddToCart}
              isInWishlist={isInWishlist}
              isInCompare={isInCompare}
              addToCompare={addToCompare}
              removeFromCompare={removeFromCompare}
              shareProductId={shareProductId}
              handleShareClick={handleShareClick}
              shareToWhatsApp={shareToWhatsApp}
              shareToFacebook={shareToFacebook}
              shareToTwitter={shareToTwitter}
              shareToLinkedIn={shareToLinkedIn}
              copyShareLink={copyShareLink}
              handleImageError={handleImageError}
            />
            </Section>
            )}

            {/* Instagram Feed — Shoppable Stories (no CMS equivalent) */}
            {(() => {
              const allInstaProducts = [...new Map([...topDeals, ...trendingProducts, ...featuredProducts].filter(p => p?.media?.some(m => m.fileType === 'instagram-url')).map(p => [p.id, p])).values()];
              const featuredIds = instaSettings.featuredProductIds || [];
              const displayProducts = featuredIds.length > 0
                ? allInstaProducts.filter(p => featuredIds.includes(p.id))
                : allInstaProducts;
              const finalProducts = displayProducts.slice(0, instaSettings.homePageMaxPosts || 3);
              if (instaSettings.homePageEnabled === false || finalProducts.length === 0) return null;
              return (
            <Section delay={200} variant="">
            <section className="home-instagram-section" onMouseEnter={() => {}} onMouseLeave={() => {}}>
              <div className="insta-deco insta-deco-1" />
              <div className="insta-deco insta-deco-2" />
              <div className="insta-deco insta-deco-3" />
              <div className="insta-inner">
              <div className="insta-section-header">
                <span className="insta-badge">Real-Life Looks</span>
                <h2 className="section-heading">{instaSettings.homePageTitle || 'Real-Life Looks'}</h2>
                <p className="insta-tagline">Shop the looks curated by our community</p>
                <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer" className="insta-follow-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
                  Follow Us
                </a>
              </div>
              <div className="insta-card-area">
              {(() => {
                const ip = (instaIndex - 1 + finalProducts.length) % finalProducts.length;
                const inx = (instaIndex + 1) % finalProducts.length;
                const renderInstaCard = (product, onClick) => {
                  if (!product) return null;
                  const instaMedia = product.media?.filter(m => m.fileType === 'instagram-url') || [];
                  const price = product.discountPrice || product.regularPrice || 0;
                  return (
                    <div className="insta-card" onClick={onClick}>
                      <div className="insta-card-img-wrap">
                        <img
                          src={getInstaThumbnail(product)}
                          alt={product.name}
                          className="insta-card-image"
                          onError={(e) => { e.target.style.display = 'none'; const fb = e.target.nextElementSibling; if (fb) fb.style.display = 'flex'; }}
                        />
                        <div className="insta-card-placeholder" style={{ display: 'none' }}>
                          <Loader2 size={24} className="spinner" />
                        </div>
                        <div className="insta-card-overlay">
                          <div className="insta-card-engagement">
                            <span className="insta-eng-item">
                              <Heart size={15} fill="white" />
                              <span>{Math.floor(Math.random() * 900 + 100)}</span>
                            </span>
                            <span className="insta-eng-item">
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="white"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                              <span>{Math.floor(Math.random() * 50 + 5)}</span>
                            </span>
                          </div>
                          <div className="insta-card-shop-pill">
                            <ShoppingBag size={13} />
                            <span>Shop Now</span>
                          </div>
                        </div>
                        {instaMedia.length > 1 && (
                          <div className="insta-multi-badge">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><rect x="2" y="2" width="14" height="14" rx="3" fill="none" stroke="white" strokeWidth="1.5"/><rect x="8" y="8" width="14" height="14" rx="3" fill="none" stroke="white" strokeWidth="1.5"/></svg>
                          </div>
                        )}
                      </div>
                      <div className="insta-card-info">
                        <h3 className="insta-card-name">{product.name}</h3>
                        <div className="insta-card-price-row">
                          <span className="insta-card-price">₹{price.toFixed(0)}</span>
                          {product.discountPrice && product.regularPrice > product.discountPrice && (
                            <span className="insta-card-original">₹{product.regularPrice.toFixed(0)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                };
                const openStory = (p) => () => { setStoryProduct(p); setStoryPostIndex(0); setInstaEmbedLoaded(false); };
                return (
                  <>
                    {finalProducts.length > 1 && (
                      <button type="button" className="insta-carousel-arrow insta-carousel-arrow-left" onClick={(e) => { e.preventDefault(); setInstaIndex(prev => (prev - 1 + finalProducts.length) % finalProducts.length); }} aria-label="Previous">
                        <ChevronLeft size={20} />
                      </button>
                    )}
                    <div className="insta-card-stack">
                      {finalProducts.length > 1 && (
                        <div key={finalProducts[ip].id} className="insta-stack-item insta-stack-prev">
                          {renderInstaCard(finalProducts[ip], openStory(finalProducts[ip]))}
                        </div>
                      )}
                      <div key={finalProducts[instaIndex].id} className="insta-stack-item insta-stack-current">
                        {renderInstaCard(finalProducts[instaIndex], openStory(finalProducts[instaIndex]))}
                      </div>
                      {finalProducts.length > 2 && (
                        <div key={finalProducts[inx].id} className="insta-stack-item insta-stack-next">
                          {renderInstaCard(finalProducts[inx], openStory(finalProducts[inx]))}
                        </div>
                      )}
                    </div>
                    {finalProducts.length > 1 && (
                      <button type="button" className="insta-carousel-arrow insta-carousel-arrow-right" onClick={(e) => { e.preventDefault(); setInstaIndex(prev => (prev + 1) % finalProducts.length); }} aria-label="Next">
                        <ChevronRight size={20} />
                      </button>
                    )}
                  </>
                );
              })()}
              </div>
              </div>
            </section>
            </Section>
            ); })()}

            {/* Instagram Story Modal */}
            {storyProduct && (
              <div className="insta-story-overlay" onClick={() => setStoryProduct(null)}>
                <div className="insta-story-modal" onClick={(e) => e.stopPropagation()}>
                  <button className="insta-story-close" onClick={() => setStoryProduct(null)}>
                    <X size={20} />
                  </button>
                  <div className="insta-story-body">
                    <div className="insta-story-embed">
                      {!instaEmbedLoaded && (
                        <div className="insta-story-embed-placeholder" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          <div className="insta-modal-loader-ring"></div>
                          <img src={getProductPrimaryImage(storyProduct)} alt={storyProduct.name}
                            style={{ maxWidth: '60%', maxHeight: '60%', objectFit: 'contain', borderRadius: 16, opacity: 0.6 }}
                            onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }} />
                          <span style={{ fontSize: '.78rem', color: '#94a3b8', fontWeight: 500 }}>Loading Instagram content...</span>
                        </div>
                      )}
                      {storyProduct.media?.filter(m => m.fileType === 'instagram-url')[storyPostIndex]?.fileName ? (
                        <iframe
                          key={extractShortcode(storyProduct.media.filter(m => m.fileType === 'instagram-url')[storyPostIndex].fileName)}
                          src={getInstagramEmbedUrl(storyProduct.media.filter(m => m.fileType === 'instagram-url')[storyPostIndex].fileName)}
                          title="Instagram content"
                          className="insta-story-iframe"
                          style={{ display: instaEmbedLoaded ? 'block' : 'none' }}
                          allow="autoplay; encrypted-media"
                          allowFullScreen
                          scrolling="no"
                          onLoad={() => setInstaEmbedLoaded(true)}
                        />
                      ) : null}
                    </div>
                    <div className="insta-story-product">
                      <div className="insta-modal-product-card">
                        <div className="insta-story-product-image-wrapper">
                          <img src={getProductPrimaryImage(storyProduct)} alt={storyProduct.name} className="insta-story-product-image" />
                        </div>
                        <div className="insta-modal-product-details">
                          <h3 className="insta-story-product-name">{storyProduct.name}</h3>
                          <div className="insta-modal-price-block">
                            <span className="insta-story-product-price">
                              ₹{((storyProduct.discountPrice || storyProduct.regularPrice) || 0).toFixed(2)}
                            </span>
                            {storyProduct.discountPrice && storyProduct.regularPrice > storyProduct.discountPrice && (
                              <div className="insta-modal-discount-row">
                                <s className="insta-story-product-old-price">₹{storyProduct.regularPrice.toFixed(2)}</s>
                                <span className="insta-story-discount-badge">
                                  {Math.round(((storyProduct.regularPrice - storyProduct.discountPrice) / storyProduct.regularPrice) * 100)}% OFF
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="insta-modal-actions">
                            <button className="insta-story-shop-btn" onClick={() => window.open(`/product/${storyProduct.id}`, '_self')}>
                              <ShoppingBag size={16} /> Shop Now
                            </button>
                            <button className="insta-modal-share-btn" onClick={() => { const url = `${window.location.origin}/product/${storyProduct.id}`; navigator.clipboard.writeText(url); toast.success('Link copied!'); }}>
                              <Share2 size={15} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {storyProduct.media?.filter(m => m.fileType === 'instagram-url').length > 1 && (
                    <div className="insta-story-nav">
                      <button type="button" className="insta-story-nav-btn" onClick={() => { setStoryPostIndex(prev => (prev - 1 + storyProduct.media.filter(m => m.fileType === 'instagram-url').length) % storyProduct.media.filter(m => m.fileType === 'instagram-url').length); setInstaEmbedLoaded(false); }}>
                        <ChevronLeft size={20} />
                      </button>
                      <div className="insta-modal-dots">
                        {storyProduct.media.filter(m => m.fileType === 'instagram-url').map((_, i) => (
                          <button type="button" key={i} className={`insta-modal-dot${i === storyPostIndex ? ' active' : ''}`} onClick={() => { setStoryPostIndex(i); setInstaEmbedLoaded(false); }} />
                        ))}
                      </div>
                      <button type="button" className="insta-story-nav-btn" onClick={() => { setStoryPostIndex(prev => (prev + 1) % storyProduct.media.filter(m => m.fileType === 'instagram-url').length); setInstaEmbedLoaded(false); }}>
                        <ChevronRight size={20} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* FEATURED PRODUCTS — fetched from dedicated /api/products/featured endpoint */}
            <Section delay={100}>
              <FeaturedProductSection
                onAddToCart={handleAddToCart}
                onWishlist={handleHeartClick}
                isInWishlist={isInWishlist}
                isInCompare={isInCompare}
                addToCompare={addToCompare}
                removeFromCompare={removeFromCompare}
                onProductClick={(p) => setSelectedProduct(p)}
                shareProductId={shareProductId}
                onShare={handleShareClick}
                onWhatsApp={shareToWhatsApp}
                onFacebook={shareToFacebook}
                onTwitter={shareToTwitter}
                onLinkedIn={shareToLinkedIn}
                onCopyLink={copyShareLink}
                onImgErr={handleImageError}
              />
            </Section>

            {/* Testimonials */}
            <Section delay={150}>
            <TestimonialCarousel />
            </Section>

            {/* CMS Values & Mission sections */}
            {cmsSections?.some(s => s.t === 'values_mission') && (
            <Section delay={200}>
            {cmsSections.map((sec, i) => {
                if (sec.t !== 'values_mission') return null;
                return (
                <DynamicSectionRenderer
                  key={sec.id || i}
                  section={sec}
                  allProducts={allProducts}
                  allCategories={dynamicCategories}
                  topDeals={topDeals}
                  trendingProducts={trendingProducts}
                  featuredProducts={featuredProducts}
                  onProductClick={(p) => setSelectedProduct(p)}
                  handleHeartClick={handleHeartClick}
                  handleAddToCart={handleAddToCart}
                  isInWishlist={isInWishlist}
                  isInCompare={isInCompare}
                  addToCompare={addToCompare}
                  removeFromCompare={removeFromCompare}
                  shareProductId={shareProductId}
                  handleShareClick={handleShareClick}
                  shareToWhatsApp={shareToWhatsApp}
                  shareToFacebook={shareToFacebook}
                  shareToTwitter={shareToTwitter}
                  shareToLinkedIn={shareToLinkedIn}
                  copyShareLink={copyShareLink}
                  handleImageError={handleImageError}
                />
              );})}
            </Section>
            )}

            <Footer />

            {selectedProduct && (
                <ProductModal
                    product={selectedProduct}
                    onClose={() => setSelectedProduct(null)}
                />
            )}
            <Wooaiwidget />
        </div>
    );
};

export default HomePage;
