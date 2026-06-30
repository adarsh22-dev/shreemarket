import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Minus, Plus, Star, ThumbsUp, ThumbsDown, Package, RotateCcw, ShieldCheck, HeartHandshake, Leaf, MapPin, Heart, Loader2, CornerDownRight, Share2, ArrowLeft, GitCompare, Link as LinkIcon, ChevronLeft, ChevronRight, Play, X, ShoppingBag, IndianRupee, Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useCompare } from '../context/CompareContext';
import { getProduct, getVendorById, getAllProducts, getProductReviews, submitProductReview, searchProducts, getPlatformSettings, BACKEND_URL, PLACEHOLDER_IMG, handleImageError } from '../api/api';
import { ProductSeo, BreadcrumbSeo } from '../components/SeoMeta';
import './ProductPage.css';

const ProductPage = () => {
    const { id } = useParams();
    const [quantity, setQuantity] = useState(1);
    const { cartItems, addToCart, removeFromCart, isProductInCart, recentlyViewed, addToRecentlyViewed } = useCart();
    const { isInWishlist, addToWishlist, removeFromWishlist, isLoggedIn } = useWishlist();
    const { isInCompare, addToCompare, removeFromCompare } = useCompare();

    const [product, setProduct] = useState(null);
    const [vendor, setVendor] = useState(null);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [upsellProducts, setUpsellProducts] = useState([]);
    const [crossSellProducts, setCrossSellProducts] = useState([]);
    const [fbtProducts, setFbtProducts] = useState([]);
    const [selectedFbt, setSelectedFbt] = useState({});
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeImage, setActiveImage] = useState(0);
    const [videoIndex, setVideoIndex] = useState(0);
    const [videoActivated, setVideoActivated] = useState(false);
    const [videoLoading, setVideoLoading] = useState(true);
    const [selectedVariation, setSelectedVariation] = useState(null);

    // Review Form State
    const [isWritingReview, setIsWritingReview] = useState(false);
    const [newReview, setNewReview] = useState({ rating: 5, title: '', text: '', reviewerName: '' });
    const [reviewImages, setReviewImages] = useState([]);
    const [submittingReview, setSubmittingReview] = useState(false);

    // Share Dropdown State
    const [showShareDropdown, setShowShareDropdown] = useState(false);

     // Image Zoom State
    const [isZooming, setIsZooming] = useState(false);
    const [lensPos, setLensPos] = useState({ x: 0, y: 0 });
    const [zoomLevel, setZoomLevel] = useState(3);
    const [bgPos, setBgPos] = useState({ x: 0, y: 0 });
    const LENS_SIZE = 160;
    const imgRef = useRef(null);

    const handleMouseMove = (e) => {
        const rect = imgRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const pctX = x / rect.width;
        const pctY = y / rect.height;
        const bgW = LENS_SIZE * zoomLevel;
        const bgH = LENS_SIZE * zoomLevel;
        setLensPos({ x, y });
        setBgPos({
            x: -(pctX * bgW - LENS_SIZE / 2),
            y: -(pctY * bgH - LENS_SIZE / 2),
        });
    };

    const handleTouchMove = (e) => {
        e.preventDefault(); // Prevent scrolling while zooming
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            const rect = imgRef.current.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            const pctX = x / rect.width;
            const pctY = y / rect.height;
            const bgW = LENS_SIZE * zoomLevel;
            const bgH = LENS_SIZE * zoomLevel;
            setLensPos({ x, y });
            setBgPos({
                x: -(pctX * bgW - LENS_SIZE / 2),
                y: -(pctY * bgH - LENS_SIZE / 2),
            });
        }
    };

    const handleTouchStart = (e) => {
        setIsZooming(true);
        // Prevent default to avoid scroll interference
        e.preventDefault();
    };

    const handleTouchEnd = () => {
        setIsZooming(false);
    };

    const zoomIn = () => setZoomLevel(prev => Math.min(prev + 0.3, 5));
    const zoomOut = () => setZoomLevel(prev => Math.max(prev - 0.3, 1.5));

    // Filter out manufacturer images from main gallery
    const galleryMedia = product?.media?.filter(m => m.mediaType !== 'manufacturer' && m.fileName && m.fileName !== 'null' && m.fileName !== 'undefined' && m.fileType !== 'video-url' && m.fileType !== 'instagram-url') || [];

    const videoMedia = product?.media?.filter(m => (m.fileType === 'video' || m.fileType === 'video-url') && m.fileName && m.fileName !== 'null' && m.fileName !== 'undefined') || [];

    const getYouTubeEmbedUrl = (url) => {
        const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
        return match ? `https://www.youtube.com/embed/${match[1]}` : null;
    };

    const getYouTubeThumbnail = (url) => {
        const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
        return match ? `https://img.youtube.com/vi/${match[1]}/maxresdefault.jpg` : null;
    };

    const extractInstagramShortcode = (url) => {
        if (!url) return null;
        const match = url.match(/(?:instagram\.com\/p\/|instagram\.com\/reel\/)([a-zA-Z0-9_-]+)/);
        return match ? match[1] : null;
    };

    const isInstagramReel = (url) => url && url.includes('/reel/');

    const getInstagramEmbedUrl = (url) => {
        const shortcode = extractInstagramShortcode(url);
        if (!shortcode) return null;
        const base = isInstagramReel(url) ? 'reel' : 'p';
        return `https://www.instagram.com/${base}/${shortcode}/embed/${isInstagramReel(url) ? '?autoplay=1' : ''}`;
    };

    const resolveMediaUrl = (fileName) => {
        if (!fileName || fileName === 'null' || fileName === 'undefined') return null;
        if (fileName.startsWith('http://') || fileName.startsWith('https://')) return fileName;
        return `${BACKEND_URL}/uploads/products/${fileName}`;
    };

    const getStoryThumb = (mediaItem) => {
        if (mediaItem?.customThumbnail) return resolveMediaUrl(mediaItem.customThumbnail) || PLACEHOLDER_IMG;
        const primary = product?.media?.find(m => m.isPrimary && m.fileType !== 'instagram-url' && m.fileType !== 'video-url') || product?.media?.find(m => m.fileType !== 'instagram-url' && m.fileType !== 'video-url');
        return resolveMediaUrl(primary?.fileName) || PLACEHOLDER_IMG;
    };

    const getProductImage = () => {
        const primary = product?.media?.find(m => m.isPrimary && m.fileType !== 'instagram-url' && m.fileType !== 'video-url') || product?.media?.find(m => m.fileType !== 'instagram-url' && m.fileType !== 'video-url');
        return resolveMediaUrl(primary?.fileName) || PLACEHOLDER_IMG;
    };



    // Instagram story modal state
    const [storyMediaIndex, setStoryMediaIndex] = useState(-1);
    const [embedLoaded, setEmbedLoaded] = useState(false);
    const [instaSettings, setInstaSettings] = useState({ productPageEnabled: true, storyShape: 'circle' });

    const instagramMedia = product?.media?.filter(m => m.fileName && m.fileName !== 'null' && m.fileName !== 'undefined' && m.fileType === 'instagram-url') || [];
    const instagramFeedLayout = product?.instagramFeedLayout || 'slider';
    let instagramFeedConfig = {};
    try {
        if (product?.instagramFeedConfig) instagramFeedConfig = JSON.parse(product.instagramFeedConfig);
    } catch (e) {}

    const getLinkedProductName = (url, index) => {
        if (instagramFeedConfig?.links?.[index]) return instagramFeedConfig.links[index];
        if (instagramFeedConfig?.links?.[url]) return instagramFeedConfig.links[url];
        return null;
    };

    // Auto-slide gallery
    useEffect(() => {
        if (!galleryMedia || galleryMedia.length <= 1 || isZooming) return;
        const timer = setInterval(() => {
            setActiveImage(prev => {
                const nextIndex = (prev + 1) % galleryMedia.length;
                return nextIndex;
            });
        }, 3000);
        return () => clearInterval(timer);
    }, [galleryMedia?.length, isZooming]);

    useEffect(() => {
        setVideoLoading(true);
    }, [videoIndex]);

    const goToPrevImage = () => {
        if (!galleryMedia || galleryMedia.length === 0) return;
        setActiveImage(prev => (prev - 1 + galleryMedia.length) % galleryMedia.length);
    };

    const goToNextImage = () => {
        if (!galleryMedia || galleryMedia.length === 0) return;
        setActiveImage(prev => (prev + 1) % galleryMedia.length);
    };

    // Read More State
    const [showFullDescription, setShowFullDescription] = useState(false);

    // FAQ State
    const [openFaqIndex, setOpenFaqIndex] = useState(null);

    // Banner Carousel State
    const [bannerIndex, setBannerIndex] = useState(0);

    const faqData = [
        { question: 'What is the return policy?', answer: 'We offer a 30-day return policy for all unused items in their original packaging. Please contact our support team to initiate a return.' },
        { question: 'How long does shipping take?', answer: 'Standard shipping takes 5-7 business days. Express shipping is available for 2-3 business days delivery.' },
        { question: 'Is this product authentic?', answer: 'Yes, all products on SreeMarket are 100% authentic and sourced directly from verified vendors.' },
        { question: 'Do you offer international shipping?', answer: 'Currently, we ship within India. International shipping will be available soon.' },
        { question: 'How can I track my order?', answer: 'Once your order is shipped, you will receive a tracking number via email and SMS. You can also track it in your Orders section.' },
    ];

    // Close share dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (showShareDropdown && !e.target.closest('.share-btn') && !e.target.closest('.share-dropdown')) {
                setShowShareDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showShareDropdown]);

    useEffect(() => {
        const fetchProductData = async () => {
            setLoading(true);
            try {
                // Fetch Product
                const productData = await getProduct(id);
                setProduct(productData);

                // Add to recently viewed
                addToRecentlyViewed({
                    id: productData.id,
                    name: productData.name,
                    price: productData.discountPrice || productData.regularPrice,
                    image: (() => {
                        const gMedia = (productData.media || []).filter(m => m.mediaType !== 'manufacturer' && m.fileType !== 'video-url' && m.fileType !== 'instagram-url');
                        return gMedia.length > 0
                            ? `${BACKEND_URL}/uploads/products/${gMedia.find(m => m.isPrimary)?.fileName || gMedia[0].fileName}`
                            : PLACEHOLDER_IMG;
                    })(),
                    category: productData.category
                });

                // Fetch Vendor (Artisan)
                if (productData.vendorId) {
                    const vendorData = await getVendorById(productData.vendorId);
                    setVendor(vendorData);
                }

                // Fetch Related Products (same category)
                const allProducts = await getAllProducts();
                const sameCategoryProducts = allProducts
                    .filter(p => p.category === productData.category && p.id !== productData.id);

                // Auto up-sells: 5 cheapest from same category (ascending)
                const autoUpsells = [...sameCategoryProducts]
                    .sort((a, b) => (a.discountPrice || a.regularPrice) - (b.discountPrice || b.regularPrice))
                    .slice(0, 5);

                // Auto cross-sells: 5 most expensive from same category (descending)
                const autoCrossSells = [...sameCategoryProducts]
                    .sort((a, b) => (b.discountPrice || b.regularPrice) - (a.discountPrice || a.regularPrice))
                    .slice(0, 5);

                setUpsellProducts(autoUpsells);
                setCrossSellProducts(autoCrossSells);

                // Also set related products (for other uses, limited to 4)
                setRelatedProducts(sameCategoryProducts.slice(0, 4));

                // Fetch Linked Products (Upsells & Cross-sells) — override defaults if vendor set them
                if (productData.linkedProducts && productData.linkedProducts.length > 0) {
                    const upsellNames = productData.linkedProducts
                        .filter(lp => lp.linkedType === 'UPSELL')
                        .map(lp => lp.linkedProductName);
                    const crossSellNames = productData.linkedProducts
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
                                if (exact && !seen.has(exact.id) && exact.id !== productData.id) {
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

                    // Fetch Frequently Bought Together
                    const fbtNames = productData.linkedProducts
                        .filter(lp => lp.linkedType === 'BOUGHT_TOGETHER')
                        .map(lp => lp.linkedProductName);
                    const loadFbt = (products) => {
                        setFbtProducts(products);
                        const sel = { main: true };
                        products.forEach(p => { sel[p.id] = true; });
                        setSelectedFbt(sel);
                    };
                    if (fbtNames.length > 0) {
                        fetchLinkedByNames(fbtNames).then(loadFbt);
                    }
                }

                // Fetch Reviews
                try {
                    const productReviews = await getProductReviews(id);
                    setReviews(productReviews);
                } catch (reviewErr) {
                    console.error("Failed to fetch reviews:", reviewErr);
                }

                // Fetch Instagram settings
                try {
                    const settings = await getPlatformSettings();
                    if (settings?.instagram) setInstaSettings(settings.instagram);
                } catch (e) {}

                window.scrollTo(0, 0);
            } catch (err) {
                console.error("Failed to fetch product details:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProductData();
    }, [id]);

    // SEO Meta Tags
    useEffect(() => {
        if (product) {
            const description = product.shortDescription || product.description?.substring(0, 160) || `Buy ${product.name} on SreeMarket`;
            const price = product.discountPrice || product.regularPrice;
            const imageUrl = galleryMedia && galleryMedia.length > 0
                ? `${BACKEND_URL}/uploads/products/${galleryMedia[0].fileName}`
                : '';

            // Helper to set or create meta tags
            const setMeta = (attr, attrValue, content) => {
                let tag = document.querySelector(`meta[${attr}="${attrValue}"]`);
                if (tag) {
                    tag.setAttribute('content', content);
                } else {
                    tag = document.createElement('meta');
                    tag.setAttribute(attr, attrValue);
                    tag.setAttribute('content', content);
                    document.head.appendChild(tag);
                }
            };

            // Page title
            document.title = `${product.name} - Buy Online at ₹${price} | SreeMarket`;

            // Standard meta tags
            setMeta('name', 'description', description.substring(0, 160));
            setMeta('name', 'keywords', `${product.name}, ${product.category || ''}, buy online, SreeMarket, ${product.tags?.map(t => t.name).join(', ') || ''}`);
            setMeta('name', 'robots', 'index, follow');
            setMeta('name', 'author', 'SreeMarket');

            // Open Graph tags
            setMeta('property', 'og:title', product.name);
            setMeta('property', 'og:description', description.substring(0, 160));
            setMeta('property', 'og:type', 'product');
            setMeta('property', 'og:url', window.location.href);
            setMeta('property', 'og:site_name', 'SreeMarket');
            if (imageUrl) {
                setMeta('property', 'og:image', imageUrl);
                setMeta('property', 'og:image:alt', `${product.name} product image`);
            }

            // Product-specific OG tags
            if (price) setMeta('property', 'product:price:amount', price.toString());
            setMeta('property', 'product:price:currency', 'INR');
            if (product.category) setMeta('property', 'product:category', product.category);

            // Twitter Card tags
            setMeta('name', 'twitter:card', 'summary_large_image');
            setMeta('name', 'twitter:title', product.name);
            setMeta('name', 'twitter:description', description.substring(0, 160));
            if (imageUrl) setMeta('name', 'twitter:image', imageUrl);

            // Canonical URL
            let canonical = document.querySelector('link[rel="canonical"]');
            if (canonical) {
                canonical.setAttribute('href', window.location.href);
            } else {
                canonical = document.createElement('link');
                canonical.setAttribute('rel', 'canonical');
                canonical.setAttribute('href', window.location.href);
                document.head.appendChild(canonical);
            }

            // Update image alt tags
            setTimeout(() => {
                const images = document.querySelectorAll('.main-image, .thumb-wrapper img, .related-image-wrapper img');
                images.forEach(img => {
                    img.alt = img.alt || `${product.name} - SreeMarket`;
                });
            }, 500);
        }
    }, [product]);

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        setSubmittingReview(true);
        try {
            const formData = new FormData();
            formData.append('review', JSON.stringify({
                ...newReview,
                product: { id },
                reviewerName: newReview.reviewerName || 'Anonymous',
            }));
            reviewImages.forEach(img => formData.append('images', img));
            const savedReview = await submitProductReview(formData);
            setReviews(prev => [savedReview, ...prev]);
            setIsWritingReview(false);
            setNewReview({ rating: 5, title: '', text: '', reviewerName: '' });
            setReviewImages([]);
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
                image: galleryMedia && galleryMedia.length > 0 ? `${BACKEND_URL}/uploads/products/${galleryMedia.find(m => m.isPrimary)?.fileName || galleryMedia[0].fileName}` : PLACEHOLDER_IMG,
                price: product.discountPrice || product.regularPrice || 0
            });
        }
    };

    const handleAddToCart = () => {
        const variationPrice = selectedVariation && !selectedVariation.useMainPricing && selectedVariation.price
            ? selectedVariation.price
            : null;
        addToCart({
            ...product,
            title: selectedVariation ? `${product.name} — ${selectedVariation.name}` : product.name,
            price: variationPrice || product.discountPrice || product.regularPrice || 0,
                image: galleryMedia && galleryMedia.length > 0 ? `${BACKEND_URL}/uploads/products/${galleryMedia.find(m => m.isPrimary)?.fileName || galleryMedia[0].fileName}` : null,
                selectedVariation: selectedVariation || null
        }, quantity, null, true);
    };

    const handleShareClick = (e) => {
        e.preventDefault();
        setShowShareDropdown(!showShareDropdown);
    };

    const shareUrl = window.location.href;
    const shareText = `Check out ${product?.name || 'this product'} on SreeMarket!`;

    const shareToWhatsApp = () => {
        window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`, '_blank');
        setShowShareDropdown(false);
    };

    const shareToFacebook = () => {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
        setShowShareDropdown(false);
    };

    const shareToTwitter = () => {
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
        setShowShareDropdown(false);
    };

    const shareToLinkedIn = () => {
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank');
        setShowShareDropdown(false);
    };

    const copyShareLink = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            toast.success("Link copied to clipboard!");
        } catch {
            toast.error("Failed to copy link");
        }
        setShowShareDropdown(false);
    };

    const getGalleryImage = (item, index = 0) => {
        const gMedia = (item.media || []).filter(m => m.mediaType !== 'manufacturer' && m.fileType !== 'instagram-url');
        if (gMedia.length <= index || !gMedia[index].fileName) return null;
        return `${BACKEND_URL}/uploads/products/${gMedia[index].fileName}`;
    };

    const handleRelatedAddToCart = (e, item) => {
        e.preventDefault();
        e.stopPropagation();
        const displayPrice = item.discountPrice || item.regularPrice || 0;
        addToCart({
            id: item.id,
            name: item.name,
            price: displayPrice,
            image: getGalleryImage(item) || PLACEHOLDER_IMG,
            quantity: 1
        });
        toast.success(`${item.name} added to cart!`);
    };

    const handleRelatedHeartClick = (e, item) => {
        e.preventDefault();
        e.stopPropagation();
        if (isInWishlist(item.id)) {
            removeFromWishlist(item.id);
        } else {
            const imageUrl = getGalleryImage(item) || PLACEHOLDER_IMG;
            addToWishlist({
                ...item,
                image: imageUrl,
                price: item.discountPrice || item.regularPrice || 0
            });
        }
    };

    const [relatedShareProductId, setRelatedShareProductId] = useState(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (relatedShareProductId && !e.target.closest('.pp-related-share-wrapper')) {
                setRelatedShareProductId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [relatedShareProductId]);

    const handleRelatedShareClick = (e, item) => {
        e.preventDefault();
        e.stopPropagation();
        setRelatedShareProductId(relatedShareProductId === item.id ? null : item.id);
    };

    const relatedShareToWhatsApp = (item) => {
        const url = `${window.location.origin}/product/${item.id}`;
        const text = `Check out ${item.name} on SreeMarket!`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
        setRelatedShareProductId(null);
    };

    const relatedShareToFacebook = (item) => {
        const url = `${window.location.origin}/product/${item.id}`;
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        setRelatedShareProductId(null);
    };

    const relatedShareToTwitter = (item) => {
        const url = `${window.location.origin}/product/${item.id}`;
        const text = `Check out ${item.name} on SreeMarket!`;
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
        setRelatedShareProductId(null);
    };

    const relatedShareToLinkedIn = (item) => {
        const url = `${window.location.origin}/product/${item.id}`;
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
        setRelatedShareProductId(null);
    };

    const relatedCopyShareLink = (item) => {
        const url = `${window.location.origin}/product/${item.id}`;
        navigator.clipboard.writeText(url).then(() => {
            toast.success('Link copied to clipboard!');
        }).catch(() => {});
        setRelatedShareProductId(null);
    };

    if (loading) {
        return (
            <div className="product-page-wrapper">
                <Navbar />
                <div className="product-page-loading">
                    <Loader2 size={48} className="animate-spin" color="#C9A87C" />
                    <p>Loading masterpiece...</p>
                </div>
                <Footer />
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="product-page-wrapper">
                <Navbar />
                <div className="product-page-error">
                    <h2>Oops! We couldn't find this product.</h2>
                    <p>{error || "The product you're looking for might have been moved or doesn't exist."}</p>
                    <Link to="/shop" className="back-to-shop-btn">Back to Shop</Link>
                </div>
                <Footer />
            </div>
        );
    }

    const mainImageUrl = selectedVariation?.imageFileName
        ? `${BACKEND_URL}/uploads/products/${selectedVariation.imageFileName}`
        : galleryMedia && galleryMedia.length > 0
            ? `${BACKEND_URL}/uploads/products/${galleryMedia[activeImage]?.fileName}`
            : PLACEHOLDER_IMG;

    const isOutOfStock = selectedVariation
        ? (selectedVariation.stock != null && selectedVariation.stock <= 0)
        : (product.initialStock != null && product.initialStock <= 0);

    const store = vendor?.stores?.[0];

    return (
        <div className="product-page-wrapper">
            <Navbar />
            {product && <ProductSeo product={product} />}
            {product && <BreadcrumbSeo items={[{ name: 'Home', path: '/' }, { name: 'Shop All', path: '/shop' }, { name: product.name, path: `/product/${product.id}` }]} />}

            <main className="product-page-main">
                {/* Breadcrumbs */}
                <div className="breadcrumbs">
                    <Link to="/">Home</Link> <span className="separator">&gt;</span> <Link to="/shop">Shop All</Link> <span className="separator">&gt;</span> <span className="current">{product.name}</span>
                </div>

                {/* Product Page Content: Sticky Left + Scrollable Right */}
                <div className="product-page-layout">
                    <div className="product-gallery">
                        <div className="main-image-wrapper">
                            <div className="gallery-actions-bar">
                                <button className="gallery-action-btn" onClick={handleShareClick} title="Share">
                                    <Share2 size={18} />
                                </button>
                                <button className="gallery-action-btn" onClick={handleHeartClick} title="Wishlist">
                                    <Heart size={18} fill={isLoggedIn && isInWishlist(product.id) ? "#FF5722" : "none"} color={isLoggedIn && isInWishlist(product.id) ? "#FF5722" : "#fff"} />
                                </button>
                                <button className="gallery-action-btn" title={isInCompare(product.id) ? "Remove from Compare" : "Compare"} onClick={(e) => { e.preventDefault(); isInCompare(product.id) ? removeFromCompare(product.id) : addToCompare(product); }}>
                                    <GitCompare size={18} color={isInCompare(product.id) ? "#FF5722" : "#fff"} />
                                </button>
                            </div>
                            {showShareDropdown && (
                                <div className="share-dropdown-popup">
                                    <p className="share-dropdown-title">Share via</p>
                                    <div className="share-icons-row">
                                        <button onClick={shareToWhatsApp} className="share-icon-btn whatsapp" title="WhatsApp">W</button>
                                        <button onClick={shareToFacebook} className="share-icon-btn facebook" title="Facebook">f</button>
                                        <button onClick={shareToTwitter} className="share-icon-btn twitter" title="Twitter">X</button>
                                        <button onClick={shareToLinkedIn} className="share-icon-btn linkedin" title="LinkedIn">in</button>
                                        <button onClick={copyShareLink} className="share-icon-btn copy" title="Copy Link"><LinkIcon size={16} /></button>
                                    </div>
                                </div>
                            )}
                            <div className="zoom-container">
                                 <img
                                     ref={imgRef}
                                     src={mainImageUrl}
                                     alt={product.name}
                                     className="main-image"
                                     onMouseEnter={() => setIsZooming(true)}
                                     onMouseMove={handleMouseMove}
                                     onMouseLeave={() => setIsZooming(false)}
                                     onClick={(e) => {
                                       e.preventDefault();
                                       setIsZooming(!isZooming);
                                     }}
                                     onTouchStart={handleTouchStart}
                                     onTouchMove={handleTouchMove}
                                     onTouchEnd={handleTouchEnd}
                                 />
                                {isZooming && (
                                    <div className="zoom-magnifier" style={{
                                        left: lensPos.x - 80,
                                        top: lensPos.y - 80,
                                    }}>
                                        <div className="zoom-lens-inner" style={{
                                            backgroundImage: `url(${mainImageUrl})`,
                                            backgroundSize: `${zoomLevel * 100}%`,
                                            backgroundPosition: `${bgPos.x}px ${bgPos.y}px`,
                                            backgroundRepeat: 'no-repeat',
                                        }} />
                                        <span className="zoom-lens-label">{zoomLevel.toFixed(1)}x</span>
                                    </div>
                                )}
                                 {!isZooming && (
                                     <div className="zoom-controls" style={{
                                         position: 'absolute',
                                         bottom: '12px',
                                         right: '12px',
                                         display: 'flex',
                                         gap: '6px',
                                         zIndex: 5
                                     }}>
                                     <button
                                         onClick={(e) => { e.preventDefault(); zoomOut(); }}
                                         style={{
                                             width: '36px',
                                             height: '36px',
                                             borderRadius: '10px',
                                             border: 'none',
                                             background: 'rgba(255,255,255,0.95)',
                                             cursor: 'pointer',
                                             fontSize: '1.2rem',
                                             display: 'flex',
                                             alignItems: 'center',
                                             justifyContent: 'center',
                                             boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                             color: '#555',
                                             transition: 'all 0.2s ease',
                                             transform: 'scale(1)'
                                         }}
                                         onMouseEnter={(e) => {
                                             e.currentTarget.style.transform = 'scale(1.1)';
                                             e.currentTarget.style.background = '#FF5722';
                                             e.currentTarget.style.color = 'white';
                                         }}
                                         onMouseLeave={(e) => {
                                             e.currentTarget.style.transform = 'scale(1)';
                                             e.currentTarget.style.background = 'rgba(255,255,255,0.95)';
                                             e.currentTarget.style.color = '#555';
                                         }}
                                     >
                                         −
                                     </button>
                                     <span style={{
                                         padding: '0 12px',
                                         fontSize: '0.85rem',
                                         fontWeight: 600,
                                         color: '#2C2C2C',
                                         background: 'rgba(255,255,255,0.9)',
                                         borderRadius: '10px',
                                         display: 'flex',
                                         alignItems: 'center',
                                         boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                         minWidth: '40px',
                                         textAlign: 'center',
                                         transition: 'all 0.2s ease',
                                         transform: 'scale(1)'
                                     }}
                                     onMouseEnter={(e) => {
                                         e.currentTarget.style.transform = 'scale(1.05)';
                                         e.currentTarget.style.background = 'rgba(255,255,255,0.95)';
                                     }}
                                     onMouseLeave={(e) => {
                                         e.currentTarget.style.transform = 'scale(1)';
                                         e.currentTarget.style.background = 'rgba(255,255,255,0.9)';
                                     }}>
                                         {zoomLevel.toFixed(1)}x
                                     </span>
                                     <button
                                         onClick={(e) => { e.preventDefault(); zoomIn(); }}
                                         style={{
                                             width: '36px',
                                             height: '36px',
                                             borderRadius: '10px',
                                             border: 'none',
                                             background: 'rgba(255,255,255,0.95)',
                                             cursor: 'pointer',
                                             fontSize: '1.2rem',
                                             display: 'flex',
                                             alignItems: 'center',
                                             justifyContent: 'center',
                                             boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                             color: '#555',
                                             transition: 'all 0.2s ease',
                                             transform: 'scale(1)'
                                         }}
                                         onMouseEnter={(e) => {
                                             e.currentTarget.style.transform = 'scale(1.1)';
                                             e.currentTarget.style.background = '#FF5722';
                                             e.currentTarget.style.color = 'white';
                                         }}
                                         onMouseLeave={(e) => {
                                             e.currentTarget.style.transform = 'scale(1)';
                                             e.currentTarget.style.background = 'rgba(255,255,255,0.95)';
                                             e.currentTarget.style.color = '#555';
                                         }}
                                     >
                                         +
                                     </button>
                                     </div>
                                 )}
                                {/* Left/Right Navigation Arrows */}
                                {galleryMedia && galleryMedia.length > 1 && (
                                    <>
                                        <button
                                            className="gallery-nav gallery-nav-prev"
                                            onClick={(e) => { e.preventDefault(); goToPrevImage(); }}
                                            style={{
                                                position: 'absolute',
                                                left: '12px',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                width: '36px',
                                                height: '36px',
                                                borderRadius: '50%',
                                                border: 'none',
                                                background: 'rgba(255,255,255,0.9)',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                                zIndex: 5,
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.background = '#FF5722'; e.currentTarget.style.color = 'white'; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.9)'; e.currentTarget.style.color = 'inherit'; }}
                                        >
                                            <ChevronLeft size={20} />
                                        </button>
                                        <button
                                            className="gallery-nav gallery-nav-next"
                                            onClick={(e) => { e.preventDefault(); goToNextImage(); }}
                                            style={{
                                                position: 'absolute',
                                                right: '12px',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                width: '36px',
                                                height: '36px',
                                                borderRadius: '50%',
                                                border: 'none',
                                                background: 'rgba(255,255,255,0.9)',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                                zIndex: 5,
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.background = '#FF5722'; e.currentTarget.style.color = 'white'; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.9)'; e.currentTarget.style.color = 'inherit'; }}
                                        >
                                            <ChevronRight size={20} />
                                        </button>
                                    </>
                                )}
                            </div>

                        </div>
                        <div className="thumbnails">
                            {galleryMedia && galleryMedia.map((med, index) => (
                                <div
                                    key={med.id}
                                    className={`thumb-wrapper ${!selectedVariation && index === activeImage ? 'active' : ''}`}
                                    onClick={() => { setSelectedVariation(null); setActiveImage(index); }}
                                >
                                    <img src={`${BACKEND_URL}/uploads/products/${med.fileName}`} alt={`Thumbnail ${index + 1}`} />
                                </div>
                            ))}
                            {selectedVariation?.imageFileName && (
                                <div className="thumb-wrapper active">
                                    <img src={`${BACKEND_URL}/uploads/products/${selectedVariation.imageFileName}`} alt={`${selectedVariation.name} variant`} />
                                </div>
                            )}
                        </div>

                        {/* Frequently Bought Together */}
                        {fbtProducts.length > 0 && (
                            <section className="fbt-section">
                                <h2 className="section-heading">Frequently Bought Together</h2>
                                <div className="fbt-container">
                                    <div className="fbt-items">
                                        <div className="fbt-item fbt-current">
                                            <label className="fbt-checkbox">
                                                <input type="checkbox" checked={selectedFbt.main !== false} onChange={() => setSelectedFbt(prev => ({ ...prev, main: !prev.main }))} />
                                            </label>
                                            <div className="fbt-item-image">
                                                <img
                                                    src={galleryMedia.length > 0 ? `${BACKEND_URL}/uploads/products/${galleryMedia.find(m => m.isPrimary)?.fileName || galleryMedia[0].fileName}` : PLACEHOLDER_IMG}
                                                    alt={product.name}
                                                />
                                            </div>
                                            <div className="fbt-item-info">
                                                <p className="fbt-item-name">{product.name}</p>
                                                <p className="fbt-item-price">₹{(product.discountPrice || product.regularPrice).toFixed(2)}</p>
                                            </div>
                                        </div>
                                        {fbtProducts.slice(0, 2).map((item) => (
                                            <div key={item.id} className="fbt-item">
                                                <div className="fbt-plus">+</div>
                                                <label className="fbt-checkbox">
                                                    <input type="checkbox" checked={selectedFbt[item.id] !== false} onChange={() => setSelectedFbt(prev => ({ ...prev, [item.id]: !prev[item.id] }))} />
                                                </label>
                                                <div className="fbt-item-image">
                                                    <img
                                                        src={getGalleryImage(item) || PLACEHOLDER_IMG}
                                                        alt={item.name}
                                                    />
                                                </div>
                                                <div className="fbt-item-info">
                                                    <p className="fbt-item-name">{item.name}</p>
                                                    <p className="fbt-item-price">₹{(item.discountPrice || item.regularPrice).toFixed(2)}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="fbt-total">
                                        <div className="fbt-total-label">Total price:</div>
                                        <div className="fbt-total-price">
                                            {(() => {
                                                const mainPrice = selectedFbt.main !== false ? (product.discountPrice || product.regularPrice || 0) : 0;
                                                const fbtPrice = fbtProducts.slice(0, 2).reduce((sum, item) => {
                                                    return sum + (selectedFbt[item.id] !== false ? (item.discountPrice || item.regularPrice || 0) : 0);
                                                }, 0);
                                                return '₹' + (mainPrice + fbtPrice).toFixed(2);
                                            })()}
                                        </div>
                                        <button
                                            className="add-all-to-cart-btn"
                                            onClick={() => {
                                                const items = [];
                                                if (selectedFbt.main !== false) {
                                                    items.push({
                                                        ...product,
                                                        title: product.name,
                                                        price: product.discountPrice || product.regularPrice || 0,
            image: galleryMedia && galleryMedia.length > 0 ? `${BACKEND_URL}/uploads/products/${galleryMedia.find(m => m.isPrimary)?.fileName || galleryMedia[0].fileName}` : null,
                                                    });
                                                }
                                                fbtProducts.slice(0, 2).forEach(item => {
                                                    if (selectedFbt[item.id] !== false) {
                                                        items.push({
                                                            ...item,
                                                            title: item.name,
                                                            price: item.discountPrice || item.regularPrice || 0,
                                                            image: getGalleryImage(item),
                                                        });
                                                    }
                                                });
                                                items.forEach(item => addToCart(item, 1, null, false));
                                                toast.success(`Added ${items.length} item(s) to cart!`);
                                            }}
                                        >
                                            Add selected to cart
                                        </button>
                                    </div>
                                </div>
                            </section>
                )}

                    </div>

                    <div className="product-page-body" style={{ display: 'contents' }}>
                        <div className="product-details">
                        <div className="tag">{product.category?.toUpperCase()} | {product.status?.toUpperCase() || 'AVAILABLE'}</div>
                        <h1 className="product-title">
                            {product.name}
                            {selectedVariation && <span className="variation-suffix"> — {selectedVariation.name}</span>}
                        </h1>
                        <div className="product-price">
                            {selectedVariation && !selectedVariation.useMainPricing && selectedVariation.price ? (
                                <span className="discount-price">₹{selectedVariation.price.toFixed(2)}</span>
                            ) : product.discountPrice ? (
                                <div className="price-container">
                                    <span className="discount-price">₹{product.discountPrice.toFixed(2)}</span>
                                    <span className="regular-price-strike">₹{product.regularPrice.toFixed(2)}</span>
                                    {product.regularPrice > product.discountPrice && (
                                        <span className="discount-badge-inline">
                                            -{Math.round(((product.regularPrice - product.discountPrice) / product.regularPrice) * 100)}%
                                        </span>
                                    )}
                                </div>
                            ) : (
                                `₹${product.regularPrice.toFixed(2)}`
                            )}
                        </div>

                        <div className="product-rating-summary" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                            {renderStars(Math.round(parseFloat(averageRating)))}
                            <span style={{ fontSize: '0.9rem', color: '#8A7F75' }}>
                                {averageRating} ({reviews.length} reviews)
                            </span>
                        </div>

                        <div className="product-description-wrapper">
                            <p className={`product-description ${showFullDescription ? 'expanded' : ''}`}>
                                {product.shortDescription || product.description || 'No description available.'}
                            </p>
                            {(product.shortDescription || product.description) && (product.shortDescription || product.description).length > 100 && (
                                <button
                                    className="read-more-btn"
                                    onClick={() => setShowFullDescription(!showFullDescription)}
                                >
                                    {showFullDescription ? 'Read Less' : 'Read More'}
                                </button>
                            )}
                        </div>

                        {/* Vendor Store Info */}
                        {vendor && store && (
                            <div className="vendor-store-info" style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '14px 16px',
                                background: '#FFFBF8',
                                borderRadius: '12px',
                                border: '1px solid #E8DDD4',
                                marginBottom: '1.5rem'
                            }}>
                                <div style={{
                                    width: '44px',
                                    height: '44px',
                                    borderRadius: '50%',
                                    background: '#F5EDE6',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1.1rem',
                                    fontWeight: 700,
                                    color: '#C9A87C',
                                    overflow: 'hidden'
                                }}>
                                    {store.storeLogo ? (
                                        <img src={`${BACKEND_URL}${store.storeLogo}`} alt={store.storeName} onError={handleImageError} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        store.storeName?.charAt(0)?.toUpperCase()
                                    )}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '0.72rem', color: '#A0978E', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '2px' }}>Sold by</div>
                                    <Link to={`/vendor/vendor-profile?vendorId=${vendor.id}`} style={{ color: '#2C2C2C', fontWeight: 600, fontSize: '0.95rem', textDecoration: 'none' }}>
                                        {store.storeName || vendor.fullName}
                                    </Link>
                                </div>
                                <Link to={`/vendor/vendor-profile?vendorId=${vendor.id}`} style={{
                                    padding: '8px 16px',
                                    background: 'transparent',
                                    border: '1px solid #C9A87C',
                                    borderRadius: '8px',
                                    color: '#C9A87C',
                                    fontSize: '0.82rem',
                                    fontWeight: 600,
                                    textDecoration: 'none',
                                    transition: 'all 0.2s'
                                }}>
                                    View Store
                                </Link>
                            </div>
                        )}

                        {product.variations && product.variations.length > 0 && (
                            <div className="product-variations-box">
                                <div className="variations-header">
                                    <span className="variations-label">Available Variants:</span>
                                    {selectedVariation && (
                                        <button className="back-to-main-btn" onClick={() => { setSelectedVariation(null); setActiveImage(0); }}>
                                            <ArrowLeft size={14} /> Back to main product
                                        </button>
                                    )}
                                </div>
                                <div className="variations-list">
                                    {product.variations.map(v => (
                                        <button
                                            key={v.id}
                                            className={`variation-chip ${selectedVariation?.id === v.id ? 'active' : ''} ${v.stock != null && v.stock <= 0 ? 'out-of-stock' : ''}`}
                                            onClick={() => {
                                                const isDeselecting = selectedVariation?.id === v.id;
                                                const newVar = isDeselecting ? null : v;
                                                setSelectedVariation(newVar);
                                                if (isDeselecting) {
                                                    setActiveImage(0);
                                                } else if (!v.imageFileName && galleryMedia && galleryMedia.length > 1) {
                                                    // Map variation to media by index as fallback
                                                    const varIndex = product.variations.findIndex(pv => pv.id === v.id);
                                                    const mediaIndex = varIndex < galleryMedia.length ? varIndex : 0;
                                                    setActiveImage(mediaIndex);
                                                } else {
                                                    setActiveImage(0);
                                                }
                                            }}
                                        >
                                            <span className="variation-name">{v.name}</span>
                                            {!v.useMainPricing && v.price && (
                                                <span className="variation-price">₹{v.price.toFixed(2)}</span>
                                            )}
                                            {v.stock != null && v.stock <= 0 && (
                                                <span className="variation-oos-tag">Out of stock</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="product-specs">
                            {product.brand && (
                                <div className="spec-item">
                                    <span className="spec-label">BRAND</span>
                                    <span className="spec-value">{product.brand}</span>
                                </div>
                            )}
                            {(selectedVariation?.sku || product.sku) && (
                                <div className="spec-item">
                                    <span className="spec-label">SKU</span>
                                    <span className="spec-value">{selectedVariation?.sku || product.sku}</span>
                                </div>
                            )}
                            {selectedVariation?.stock != null && (
                                <div className="spec-item">
                                    <span className="spec-label">STOCK</span>
                                    <span className="spec-value">{selectedVariation.stock > 0 ? `${selectedVariation.stock} available` : 'Out of stock'}</span>
                                </div>
                            )}
                            {product.attributes && product.attributes.map(attr => (
                                <div key={attr.id} className="spec-item">
                                    <span className="spec-label">{attr.name?.toUpperCase()}</span>
                                    <span className="spec-value">{attr.value}</span>
                                </div>
                            ))}
                        </div>

                        {isOutOfStock && (
                            <div className="out-of-stock-banner">This item is currently out of stock</div>
                        )}
                        <div className="product-actions">
                            <div className={`quantity-selector ${isOutOfStock ? 'disabled' : ''}`}>
                                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="qty-btn" disabled={isOutOfStock}><Minus size={16} /></button>
                                <span className="qty-value">{quantity}</span>
                                <button onClick={() => setQuantity(quantity + 1)} className="qty-btn" disabled={isOutOfStock}><Plus size={16} /></button>
                            </div>
                            <button className="add-to-cart-btn" onClick={handleAddToCart} disabled={isOutOfStock}>
                                {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                            </button>
                        </div>

                        <div className="product-guarantees">
                            <div className="guarantee">
                                <Package size={14} /> Free Worldwide Shipping
                            </div>
                            <div className="guarantee">
                                <RotateCcw size={14} /> 14-Day Free Returns
                            </div>
                        </div>

                        {(() => {
                            const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
                            const currentUser = userStr ? JSON.parse(userStr) : null;
                            const isWholesaler = currentUser?.roleId === 4;
                            if (!isWholesaler) return null;
                            const wholesalePrice = product.wholesalePrice || 0;
                            const hasWholesaleData = wholesalePrice > 0 || (product.pricingTiers && product.pricingTiers.length > 0);
                            if (!hasWholesaleData) return null;
                            const retailPrice = product.discountPrice || product.regularPrice || 0;
                            const savingsPercent = wholesalePrice && retailPrice > wholesalePrice
                                ? Math.round(((retailPrice - wholesalePrice) / retailPrice) * 100) : 0;
                            return (
                                <div style={{ background: '#fffbeb', borderRadius: '12px', border: '1px solid #fde68a', padding: '1.25rem', marginBottom: '1.25rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                        <span style={{ background: '#d97706', color: '#fff', padding: '0.2rem 0.75rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Wholesale</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                        <span style={{ fontSize: '0.85rem', color: '#92400e', fontWeight: '500' }}>Wholesale Price</span>
                                        <span style={{ fontSize: '1.8rem', fontWeight: '800', color: '#d97706' }}>₹{wholesalePrice.toFixed(2)}</span>
                                        {retailPrice > 0 && (
                                            <span style={{ fontSize: '1rem', color: '#9ca3af', textDecoration: 'line-through' }}>₹{retailPrice.toFixed(2)}</span>
                                        )}
                                        {savingsPercent > 0 && (
                                            <span style={{ background: '#059669', color: '#fff', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600' }}>Save {savingsPercent}%</span>
                                        )}
                                    </div>
                                    {product.minimumWholesaleQuantity && (
                                        <p style={{ margin: '0 0 0.75rem', fontSize: '0.85rem', color: '#92400e' }}>
                                            <Tag size={14} style={{ marginRight: '0.25rem', verticalAlign: 'middle' }} />
                                            Minimum order: <strong>{product.minimumWholesaleQuantity} units</strong>
                                        </p>
                                    )}
                                    {product.pricingTiers && product.pricingTiers.length > 0 && (
                                        <div>
                                            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#92400e', display: 'block', marginBottom: '0.5rem' }}>Volume Pricing Tiers</span>
                                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                {[...product.pricingTiers].sort((a, b) => a.minQuantity - b.minQuantity).map((tier, i) => (
                                                    <div key={i} style={{
                                                        padding: '0.5rem 0.75rem', borderRadius: '8px', background: '#fff',
                                                        color: '#d97706', fontSize: '0.8rem', fontWeight: '600', border: '1px solid #fde68a'
                                                    }}>
                                                        {tier.minQuantity}{tier.maxQuantity ? `-${tier.maxQuantity}` : '+'} units — <IndianRupee size={11} style={{ display: 'inline', verticalAlign: 'middle' }} />{tier.unitPrice}/unit
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}

                        {/* Instagram Story Circles */}
                        {instagramMedia.length > 0 && instaSettings.productPageEnabled !== false && (
                        <section className="pp-insta-stories">
                            <div className="pp-insta-stories-header">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                    <defs><linearGradient id="ppIgGrad" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#833AB4"/><stop offset="50%" stopColor="#E1306C"/><stop offset="100%" stopColor="#F77737"/></linearGradient></defs>
                                    <rect x="2" y="2" width="20" height="20" rx="5" stroke="url(#ppIgGrad)" strokeWidth="1.5" fill="none"/>
                                    <circle cx="12" cy="12" r="5" stroke="url(#ppIgGrad)" strokeWidth="1.5" fill="none"/>
                                    <circle cx="17.5" cy="6.5" r="1.2" fill="url(#ppIgGrad)"/>
                                </svg>
                                <span>See it in real life</span>
                            </div>
                            <div className="pp-insta-stories-scroll">
                                {instagramMedia.map((mediaItem, idx) => (
                                    <div key={mediaItem.id} className="pp-insta-card" onClick={() => { setStoryMediaIndex(idx); setEmbedLoaded(false); }}>
                                        <div className="pp-insta-card-img">
                                            <img
                                                src={getStoryThumb(mediaItem)}
                                                alt="Instagram post"
                                                onError={(e) => { e.target.style.display = 'none'; const fb = e.target.nextElementSibling; if (fb) fb.style.display = 'flex'; }}
                                            />
                                            <div className="pp-insta-card-placeholder" style={{ display: 'none' }}>
                                                <Loader2 size={18} />
                                            </div>
                                            <div className="pp-insta-card-overlay">
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                        )}
                    </div>

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
                            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", marginBottom: '1rem', borderBottom: '1px solid #E8DDD4', paddingBottom: '0.75rem', fontSize: '1.3rem', color: '#2C2C2C', fontWeight: 600 }}>Specifications</h3>
                            <table className="specs-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                                <tbody>
                                    {product.brand && (
                                        <tr style={{ borderBottom: '1px solid #F5EDE6' }}>
                                            <td style={{ padding: '14px 8px', fontWeight: '600', color: '#8A7F75', width: '30%' }}>Brand</td>
                                            <td style={{ padding: '12px 8px' }}>{product.brand}</td>
                                        </tr>
                                    )}
                                    {product.sku && (
                                        <tr style={{ borderBottom: '1px solid #F5EDE6' }}>
                                            <td style={{ padding: '14px 8px', fontWeight: '600', color: '#8A7F75' }}>SKU</td>
                                            <td style={{ padding: '12px 8px' }}>{product.sku}</td>
                                        </tr>
                                    )}
                                    {product.category && (
                                        <tr style={{ borderBottom: '1px solid #F5EDE6' }}>
                                            <td style={{ padding: '14px 8px', fontWeight: '600', color: '#8A7F75' }}>Category</td>
                                            <td style={{ padding: '12px 8px', textTransform: 'capitalize' }}>{product.category}</td>
                                        </tr>
                                    )}
                                    {product.status && (
                                        <tr style={{ borderBottom: '1px solid #F5EDE6' }}>
                                            <td style={{ padding: '14px 8px', fontWeight: '600', color: '#8A7F75' }}>Availability</td>
                                            <td style={{ padding: '12px 8px', textTransform: 'capitalize' }}>
                                                {product.status === 'in' ? 'In Stock' : product.status === 'low' ? 'Low Stock' : product.status === 'out' ? 'Out of Stock' : product.status}
                                            </td>
                                        </tr>
                                    )}
                                    {product.weight > 0 && (
                                        <tr style={{ borderBottom: '1px solid #F5EDE6' }}>
                                            <td style={{ padding: '14px 8px', fontWeight: '600', color: '#8A7F75' }}>Weight</td>
                                            <td style={{ padding: '12px 8px' }}>{product.weight} kg</td>
                                        </tr>
                                    )}
                                    {(product.length > 0 || product.width > 0 || product.height > 0) && (
                                        <tr style={{ borderBottom: '1px solid #F5EDE6' }}>
                                            <td style={{ padding: '14px 8px', fontWeight: '600', color: '#8A7F75' }}>Dimensions</td>
                                            <td style={{ padding: '12px 8px' }}>
                                                {product.length || 0} x {product.width || 0} x {product.height || 0} cm <span style={{ fontSize: '0.8rem', color: '#A0978E' }}>(L x W x H)</span>
                                            </td>
                                        </tr>
                                    )}
                                    {product.shippingClass && (
                                        <tr style={{ borderBottom: '1px solid #F5EDE6' }}>
                                            <td style={{ padding: '14px 8px', fontWeight: '600', color: '#8A7F75' }}>Shipping Class</td>
                                            <td style={{ padding: '12px 8px', textTransform: 'capitalize' }}>{product.shippingClass}</td>
                                        </tr>
                                    )}
                                    {product.taxStatus && product.taxStatus !== 'none' && (
                                        <tr style={{ borderBottom: '1px solid #F5EDE6' }}>
                                            <td style={{ padding: '14px 8px', fontWeight: '600', color: '#8A7F75' }}>Tax Status</td>
                                            <td style={{ padding: '12px 8px', textTransform: 'capitalize' }}>
                                                {product.taxStatus} {product.taxClass && `(${product.taxClass})`}
                                            </td>
                                        </tr>
                                    )}
                                    {product.attributes && product.attributes.map(attr => (
                                        <tr key={attr.id} style={{ borderBottom: '1px solid #F5EDE6' }}>
                                            <td style={{ padding: '14px 8px', fontWeight: '600', color: '#8A7F75' }}>{attr.name?.charAt(0).toUpperCase() + attr.name?.slice(1)}</td>
                                            <td style={{ padding: '12px 8px' }}>{attr.value}</td>
                                        </tr>
                                    ))}
                                    {product.tags && product.tags.length > 0 && (
                                        <tr style={{ borderBottom: '1px solid #F5EDE6' }}>
                                            <td style={{ padding: '14px 8px', fontWeight: '600', color: '#8A7F75' }}>Tags</td>
                                            <td style={{ padding: '12px 8px' }}>
                                                {product.tags.map((tag, index) => (
                                                    <span key={tag.id || index} style={{
                                                        display: 'inline-block',
                                                        background: '#F5EDE6',
                                                        padding: '5px 12px',
                                                        borderRadius: '20px',
                                                        fontSize: '0.82rem',
                                                        marginRight: '8px',
                                                        marginBottom: '4px',
                                                        color: '#8A7F75',
                                                        fontWeight: 500
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

                {/* From the Manufacturer */}
                {(() => {
                    const mfrMedia = product.media && product.media.length > 0
                        ? product.media.filter(m => m.mediaType === 'manufacturer' && m.fileName)
                        : [];
                    const collageMedia = mfrMedia;
                    if (collageMedia.length < 1) return null;
                    const layout = product.manufacturerLayout || 'collage';
                    return (
                        <section className="mfr-section">
                            <h2 className="section-heading">From the Manufacturer</h2>

                            {layout === 'slider' && (
                                <div className="mfr-slider-view">
                                    <div className="mfr-slider-main">
                                        <div className="mfr-slides-wrapper" style={{ aspectRatio: '16/7' }}>
                                            {collageMedia.map((med, index) => (
                                                <div key={med.id || index} className={`mfr-slide ${index === bannerIndex ? 'active' : ''}`}>
                                                    <img src={`${BACKEND_URL}/uploads/products/${med.fileName}`} alt={`${product.name} ${index + 1}`} />
                                                </div>
                                            ))}
                                        </div>
                                        <button className="mfr-nav-btn mfr-prev" onClick={() => setBannerIndex(prev => (prev - 1 + collageMedia.length) % collageMedia.length)}>
                                            <ChevronLeft size={24} />
                                        </button>
                                        <button className="mfr-nav-btn mfr-next" onClick={() => setBannerIndex(prev => (prev + 1) % collageMedia.length)}>
                                            <ChevronRight size={24} />
                                        </button>
                                    </div>
                                    <div className="mfr-slider-thumbs">
                                        {collageMedia.map((med, index) => (
                                            <button key={med.id || index} className={`mfr-thumb ${index === bannerIndex ? 'active' : ''}`} onClick={() => setBannerIndex(index)}>
                                                <img src={`${BACKEND_URL}/uploads/products/${med.fileName}`} alt={`${product.name} thumb ${index + 1}`} />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {layout === 'grid' && (
                                <div className="mfr-grid-view">
                                    {collageMedia.map((med, index) => (
                                        <div key={med.id || index} className="mfr-grid-item">
                                            <img src={`${BACKEND_URL}/uploads/products/${med.fileName}`} alt={`${product.name} - ${index + 1}`} />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {layout === 'masonry' && (
                                <div className="mfr-masonry-view">
                                    {collageMedia.map((med, index) => (
                                        <div key={med.id || index} className={`mfr-masonry-item mfr-masonry-${(index % 3) + 1}`}>
                                            <img src={`${BACKEND_URL}/uploads/products/${med.fileName}`} alt={`${product.name} - ${index + 1}`} />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {(layout === 'collage' || !['slider', 'grid', 'masonry'].includes(layout)) && (
                                <div className="mfr-collage">
                                    {collageMedia.length === 2 && (
                                        <div className="mfr-collage-grid mfr-cols-2">
                                            {collageMedia.map((med, index) => (
                                                <div key={med.id || index} className="mfr-collage-item mfr-large">
                                                    <img src={`${BACKEND_URL}/uploads/products/${med.fileName}`} alt={`${product.name} - ${index + 1}`} />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {collageMedia.length === 3 && (
                                        <div className="mfr-collage-grid mfr-cols-3">
                                            <div className="mfr-collage-item mfr-span-2">
                                                <img src={`${BACKEND_URL}/uploads/products/${collageMedia[0].fileName}`} alt={`${product.name} - 1`} />
                                            </div>
                                            <div className="mfr-collage-item">
                                                <img src={`${BACKEND_URL}/uploads/products/${collageMedia[1].fileName}`} alt={`${product.name} - 2`} />
                                            </div>
                                            <div className="mfr-collage-item mfr-span-2">
                                                <img src={`${BACKEND_URL}/uploads/products/${collageMedia[2].fileName}`} alt={`${product.name} - 3`} />
                                            </div>
                                        </div>
                                    )}
                                    {collageMedia.length >= 4 && (
                                        <div className="mfr-collage-grid mfr-cols-4">
                                            <div className="mfr-collage-item mfr-span-2 mfr-row-span-2">
                                                <img src={`${BACKEND_URL}/uploads/products/${collageMedia[0].fileName}`} alt={`${product.name} - 1`} />
                                            </div>
                                            <div className="mfr-collage-item">
                                                <img src={`${BACKEND_URL}/uploads/products/${collageMedia[1].fileName}`} alt={`${product.name} - 2`} />
                                            </div>
                                            <div className="mfr-collage-item">
                                                <img src={`${BACKEND_URL}/uploads/products/${collageMedia[2].fileName}`} alt={`${product.name} - 3`} />
                                            </div>
                                            <div className="mfr-collage-item">
                                                <img src={`${BACKEND_URL}/uploads/products/${collageMedia[3].fileName}`} alt={`${product.name} - 4`} />
                                            </div>
                                            {collageMedia.length >= 5 && (
                                                <div className="mfr-collage-item">
                                                    <img src={`${BACKEND_URL}/uploads/products/${collageMedia[4].fileName}`} alt={`${product.name} - 5`} />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Mobile slider fallback for all layouts */}
                            <div className="mfr-slider-mobile">
                                <div className="mfr-slides-wrapper">
                                    {collageMedia.map((med, index) => (
                                        <div key={med.id || index} className={`mfr-slide ${index === bannerIndex ? 'active' : ''}`}>
                                            <img src={`${BACKEND_URL}/uploads/products/${med.fileName}`} alt={`${product.name} ${index + 1}`} />
                                        </div>
                                    ))}
                                </div>
                                <button className="mfr-nav-btn mfr-prev" onClick={() => setBannerIndex(prev => (prev - 1 + collageMedia.length) % collageMedia.length)}>
                                    <ChevronLeft size={22} />
                                </button>
                                <button className="mfr-nav-btn mfr-next" onClick={() => setBannerIndex(prev => (prev + 1) % collageMedia.length)}>
                                    <ChevronRight size={22} />
                                </button>
                                <div className="mfr-dots">
                                    {collageMedia.map((_, index) => (
                                        <button key={index} className={`mfr-dot ${index === bannerIndex ? 'active' : ''}`} onClick={() => setBannerIndex(index)} />
                                    ))}
                                </div>
                            </div>
                        </section>
                    );
                })()}

                {/* Video Gallery */}
                {videoMedia.length > 0 && (
                    <section className="video-gallery-section">
                        <h2 className="section-heading">Videos</h2>
                        <div className="video-gallery-layout">
                            <div className="video-gallery-main">
                                {(() => {
                                    const video = videoMedia[videoIndex];
                                    const videoUrl = video.fileType === 'video-url' ? video.fileName : `${BACKEND_URL}/uploads/products/${video.fileName}`;
                                    const youtubeEmbed = getYouTubeEmbedUrl(videoUrl);
                                    const thumbUrl = getYouTubeThumbnail(videoUrl);
                                    if (youtubeEmbed && !videoActivated) {
                                        return (
                                            <div className="video-gallery-player-wrapper" onClick={() => setVideoActivated(true)} style={{ cursor: 'pointer' }}>
                                                {thumbUrl && <img src={thumbUrl} alt="" style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, objectFit: 'cover' }} />}

                                            </div>
                                        );
                                    }
                                    return youtubeEmbed ? (
                                        <div className="video-gallery-player-wrapper" onClick={() => setVideoActivated(false)} style={{ cursor: 'pointer' }}>
                                            {videoLoading && thumbUrl && (
                                                <div style={{ position: 'absolute', inset: 0, zIndex: 3, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <img src={thumbUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }} />
                                                    <div style={{ position: 'absolute', width: 40, height: 40, border: '3px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                                                </div>
                                            )}
                                            <iframe
                                                key={videoIndex}
                                                src={`${youtubeEmbed}?autoplay=1&controls=0&modestbranding=1&rel=0&iv_load_policy=3`}
                                                title="Video"
                                                onLoad={() => setVideoLoading(false)}
                                                style={{ pointerEvents: 'none', position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                            />
                                            <div className="video-custom-pause-btn">
                                                <div style={{ width: 0, height: 20, borderLeft: '3px solid #fff', borderRight: '3px solid #fff', padding: '0 6px' }} />
                                            </div>
                                        </div>
                                    ) : (
                                        <video
                                            key={videoIndex}
                                            src={videoUrl}
                                            className="video-gallery-player"
                                            controls
                                            controlsList="nodownload noremoteplayback"
                                            disablePictureInPicture
                                        />
                                    );
                                })()}
                            </div>
                            <div className="video-gallery-list">
                                {videoMedia.map((v, i) => {
                                    const videoUrl = v.fileType === 'video-url' ? v.fileName : `${BACKEND_URL}/uploads/products/${v.fileName}`;
                                    const thumbUrl = getYouTubeThumbnail(videoUrl);
                                    return (
                                        <button
                                            key={v.id || i}
                                            className={`video-gallery-thumb ${i === videoIndex ? 'active' : ''}`}
                                            onClick={() => { setVideoIndex(i); setVideoActivated(false); }}
                                        >
                                            {thumbUrl ? (
                                                <img src={thumbUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <video src={videoUrl} />
                                            )}
<span className="video-gallery-thumb-overlay">
                                               </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </section>
                )}

                {/* Artisan Section */}
                {store && (
                    <section className="artisan-section">
                        <div className="artisan-card">
                            <div className="artisan-image-wrapper">
                                <img
                                    src={store.storeLogo ? `${BACKEND_URL}${store.storeLogo}` : PLACEHOLDER_IMG}
                                    alt={store.storeName}
                                    onError={handleImageError}
                                />
                                <div className="artisan-location-badge">
                                    <span className="location-label">LOCATION</span>
                                    <strong>{store.city || store.country || 'Global'} 🌏</strong>
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
                                <Link to={`/shop?vendor=${vendor.id}`} className="view-collection-link">View Store Collection &gt;</Link>
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
                            <div className="matter-icon"><HeartHandshake size={24} color="#C9A87C" /></div>
                            <h4>Fair Wages</h4>
                            <p>Artisans set their own prices, ensuring they earn a living wage that supports their families and communities.</p>
                        </div>
                        <div className="matter-card">
                            <div className="matter-icon"><ShieldCheck size={24} color="#C9A87C" /></div>
                            <h4>Cultural Preservation</h4>
                            <p>By prioritizing traditional techniques, we help keep centuries-old crafting traditions alive for future generations.</p>
                        </div>
                        <div className="matter-card">
                            <div className="matter-icon"><Leaf size={24} color="#C9A87C" /></div>
                            <h4>100% Organic</h4>
                            <p>We use only locally sourced natural dyes and sustainable materials that are kind to both the maker and the earth.</p>
                        </div>
                    </div>
                </section>

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
                                <Link to="/login" className="write-review-btn" style={{ textDecoration: 'none', display: 'inline-block', textAlign: 'center' }}>
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
                        <div className="review-form-container" style={{ background: '#FFFBF8', padding: '28px', borderRadius: '16px', marginBottom: '30px', border: '1px solid #E8DDD4' }}>
                            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", marginTop: 0, marginBottom: '20px', fontSize: '1.4rem', fontWeight: 600, color: '#2C2C2C' }}>Write Your Review</h3>
                            <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#8A7F75', fontSize: '0.82rem', letterSpacing: '0.5px' }}>Rating</label>
                                    <select
                                        value={newReview.rating}
                                        onChange={e => setNewReview({ ...newReview, rating: parseInt(e.target.value) })}
                                        style={{ padding: '12px', width: '100%', borderRadius: '10px', border: '1px solid #E8DDD4', background: '#fff', color: '#2C2C2C', fontSize: '0.9rem' }}
                                    >
                                        <option value={5}>5 Stars - Excellent</option>
                                        <option value={4}>4 Stars - Good</option>
                                        <option value={3}>3 Stars - Average</option>
                                        <option value={2}>2 Stars - Poor</option>
                                        <option value={1}>1 Star - Terrible</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#8A7F75', fontSize: '0.82rem', letterSpacing: '0.5px' }}>Your Name</label>
                                    <input
                                        type="text"
                                        placeholder="How you want your name to appear"
                                        value={newReview.reviewerName}
                                        onChange={e => setNewReview({ ...newReview, reviewerName: e.target.value })}
                                        style={{ padding: '12px', width: '100%', borderRadius: '10px', border: '1px solid #E8DDD4', background: '#fff', color: '#2C2C2C', fontSize: '0.9rem' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#8A7F75', fontSize: '0.82rem', letterSpacing: '0.5px' }}>Review Title</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Summarize your experience"
                                        value={newReview.title}
                                        onChange={e => setNewReview({ ...newReview, title: e.target.value })}
                                        style={{ padding: '12px', width: '100%', borderRadius: '10px', border: '1px solid #E8DDD4', background: '#fff', color: '#2C2C2C', fontSize: '0.9rem' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#8A7F75', fontSize: '0.82rem', letterSpacing: '0.5px' }}>Review</label>
                                    <textarea
                                        required
                                        placeholder="What did you like or dislike? What should other shoppers know?"
                                        value={newReview.text}
                                        onChange={e => setNewReview({ ...newReview, text: e.target.value })}
                                        rows={4}
                                        style={{ padding: '12px', width: '100%', borderRadius: '10px', border: '1px solid #E8DDD4', resize: 'vertical', background: '#fff', color: '#2C2C2C', fontSize: '0.9rem' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#8A7F75', fontSize: '0.82rem', letterSpacing: '0.5px' }}>Images (optional)</label>
                                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                                        <input
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            onChange={e => setReviewImages(Array.from(e.target.files || []))}
                                            style={{ fontSize: '0.85rem', color: '#6B635B' }}
                                        />
                                        {reviewImages.map((img, i) => (
                                            <span key={i} style={{ fontSize: '0.8rem', background: '#F5EDE6', padding: '4px 10px', borderRadius: '6px' }}>{img.name}</span>
                                        ))}
                                    </div>
                                </div>
                                <button type="submit" disabled={submittingReview} style={{
                                    padding: '14px 28px',
                                    background: submittingReview ? '#D4CCC4' : 'linear-gradient(135deg, #C9A87C 0%, #B8956A 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '10px',
                                    cursor: submittingReview ? 'not-allowed' : 'pointer',
                                    fontWeight: '600',
                                    fontSize: '0.95rem',
                                    alignSelf: 'flex-start',
                                    boxShadow: submittingReview ? 'none' : '0 4px 16px rgba(201, 168, 124, 0.3)',
                                    transition: 'all 0.3s ease'
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
                                            <span className="vrb-title"><CornerDownRight size={14} /> ARTISAN'S RESPONSE</span>
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
                            <p style={{ padding: '2rem 0', color: '#8A7F75', fontStyle: 'italic' }}>No reviews yet. Be the first to review this product!</p>
                )}

                    </div>
                    {reviews.length > 5 && (
                        <div className="load-more-container">
                            <button className="load-more-btn">Load More Reviews</button>
                        </div>
                    )}
                </section>

                {/* FAQ Section */}
                <section className="faq-section">
                    <h2 className="section-heading-left">Frequently Asked Questions</h2>
                    <div className="faq-list">
                        {faqData.map((faq, index) => (
                            <div key={index} className={`faq-item ${openFaqIndex === index ? 'open' : ''}`}>
                                <button
                                    className="faq-question"
                                    onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                                >
                                    <span>{faq.question}</span>
                                    <span className="faq-toggle">{openFaqIndex === index ? '−' : '+'}</span>
                                </button>
                                {openFaqIndex === index && (
                                    <div className="faq-answer">
                                        <p>{faq.answer}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                {/* Customers Who Viewed Also Viewed */}
                {(() => {
                    const viewedProducts = relatedProducts.filter(p => p.id !== product.id).slice(0, 8);
                    if (viewedProducts.length < 2) return null;
                    return (
                        <section className="related-products-section">
                            <h3 className="related-heading">Customers who viewed this item also viewed</h3>
                            <div className="related-carousel">
                                <button className="carousel-btn carousel-prev" onClick={() => { const el = document.getElementById('viewed-track'); if (el) el.scrollBy({ left: -300, behavior: 'smooth' }); }}>‹</button>
                                <div className="related-carousel-track" id="viewed-track">
                                    {viewedProducts.map(item => (
                                        <div key={item.id} className="related-card">
                                            <Link to={`/product/${item.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                                <div className="related-image-wrapper">
                                                    <img
                                                        src={getGalleryImage(item) || PLACEHOLDER_IMG}
                                                        alt={item.name}
                                                        className="related-img-primary"
                                                    />
                                                    {(item.media || []).filter(m => m.mediaType !== 'manufacturer' && m.fileType !== 'instagram-url').length > 1 && (
                                                        <img
                                                            src={getGalleryImage(item, 1) || PLACEHOLDER_IMG}
                                                            alt={item.name}
                                                            className="related-img-secondary"
                                                        />
                                                    )}
                                                    <div className="related-card-actions">
                                                        <button className="related-action-btn" title="Wishlist" onClick={(e) => handleRelatedHeartClick(e, item)}>
                                                            <Heart size={14} color={isInWishlist(item.id) ? "#D4857F" : "#fff"} fill={isInWishlist(item.id) ? "#D4857F" : "none"} />
                                                        </button>
                                                        <div className="pp-related-share-wrapper">
                                                            <button className="related-action-btn" title="Share" onClick={(e) => handleRelatedShareClick(e, item)}>
                                                                <Share2 size={14} />
                                                            </button>
                                                            {relatedShareProductId === item.id && (
                                                                <div className="pp-related-share-dropdown">
                                                                    <p className="pp-related-share-title">Share via</p>
                                                                    <div className="pp-related-share-icons">
                                                                        <button onClick={(e) => { e.stopPropagation(); relatedShareToWhatsApp(item); }} className="share-icon-btn whatsapp" title="WhatsApp">W</button>
                                                                        <button onClick={(e) => { e.stopPropagation(); relatedShareToFacebook(item); }} className="share-icon-btn facebook" title="Facebook">f</button>
                                                                        <button onClick={(e) => { e.stopPropagation(); relatedShareToTwitter(item); }} className="share-icon-btn twitter" title="Twitter">X</button>
                                                                        <button onClick={(e) => { e.stopPropagation(); relatedShareToLinkedIn(item); }} className="share-icon-btn linkedin" title="LinkedIn">in</button>
                                                                        <button onClick={(e) => { e.stopPropagation(); relatedCopyShareLink(item); }} className="share-icon-btn copy" title="Copy Link"><LinkIcon size={14} /></button>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <button className="related-action-btn" title={isInCompare(item.id) ? "Remove from Compare" : "Compare"} onClick={(e) => { e.preventDefault(); e.stopPropagation(); isInCompare(item.id) ? removeFromCompare(item.id) : addToCompare(item); }}>
                                                            <GitCompare size={14} color={isInCompare(item.id) ? "#FF5722" : "#fff"} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </Link>
                                            <div className="related-info">
                                                <Link to={`/product/${item.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                                    <h5 className="related-name">{item.name}</h5>
                                                </Link>
                                                <p className="related-price">₹{(item.discountPrice || item.regularPrice).toFixed(2)}</p>
                                                <button className="related-add-to-cart-btn" onClick={(e) => handleRelatedAddToCart(e, item)}>
                                                    <ShoppingBag size={14} /> Add to Cart
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <button className="carousel-btn carousel-next" onClick={() => { const el = document.getElementById('viewed-track'); if (el) el.scrollBy({ left: 300, behavior: 'smooth' }); }}>›</button>
                            </div>
                        </section>
                    );
                })()}

                {/* Top Picks (Upsells) */}
                {upsellProducts.length > 0 && (
                    <section className="related-products-section top-picks-section">
                        <h3 className="related-heading">Top Picks</h3>
                        <p className="section-subheading">Recommended alternatives you might love</p>
                        <div className="related-carousel">
                            <button className="carousel-btn carousel-prev" onClick={() => { const el = document.getElementById('top-picks-track'); if (el) el.scrollBy({ left: -300, behavior: 'smooth' }); }}>‹</button>
                            <div className="related-carousel-track" id="top-picks-track">
                                {upsellProducts.map(item => (
                                    <div key={item.id} className="related-card top-pick-card">
                                        <Link to={`/product/${item.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                            <div className="top-pick-badge">Top Pick</div>
                                            <div className="related-image-wrapper">
                                            <img
                                                src={getGalleryImage(item) || PLACEHOLDER_IMG}
                                                alt={item.name}
                                                className="related-img-primary"
                                            />
                                            {item.media && item.media.length > 1 && (
                                                <img
                                                    src={getGalleryImage(item, 1) || PLACEHOLDER_IMG}
                                                    alt={item.name}
                                                    className="related-img-secondary"
                                                />
                                            )}
                                            <div className="related-card-actions">
                                                <button className="related-action-btn" title="Wishlist" onClick={(e) => handleRelatedHeartClick(e, item)}>
                                                    <Heart size={14} color={isInWishlist(item.id) ? "#D4857F" : "#fff"} fill={isInWishlist(item.id) ? "#D4857F" : "none"} />
                                                </button>
                                                <div className="pp-related-share-wrapper">
                                                    <button className="related-action-btn" title="Share" onClick={(e) => handleRelatedShareClick(e, item)}>
                                                        <Share2 size={14} />
                                                    </button>
                                                    {relatedShareProductId === item.id && (
                                                        <div className="pp-related-share-dropdown">
                                                            <p className="pp-related-share-title">Share via</p>
                                                            <div className="pp-related-share-icons">
                                                                <button onClick={(e) => { e.stopPropagation(); relatedShareToWhatsApp(item); }} className="share-icon-btn whatsapp" title="WhatsApp">W</button>
                                                                <button onClick={(e) => { e.stopPropagation(); relatedShareToFacebook(item); }} className="share-icon-btn facebook" title="Facebook">f</button>
                                                                <button onClick={(e) => { e.stopPropagation(); relatedShareToTwitter(item); }} className="share-icon-btn twitter" title="Twitter">X</button>
                                                                <button onClick={(e) => { e.stopPropagation(); relatedShareToLinkedIn(item); }} className="share-icon-btn linkedin" title="LinkedIn">in</button>
                                                                <button onClick={(e) => { e.stopPropagation(); relatedCopyShareLink(item); }} className="share-icon-btn copy" title="Copy Link"><LinkIcon size={14} /></button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                <button className="related-action-btn" title={isInCompare(item.id) ? "Remove from Compare" : "Compare"} onClick={(e) => { e.preventDefault(); e.stopPropagation(); isInCompare(item.id) ? removeFromCompare(item.id) : addToCompare(item); }}>
                                                    <GitCompare size={14} color={isInCompare(item.id) ? "#FF5722" : "#fff"} />
                                                </button>
                                            </div>
                                        </div>
                                        </Link>
                                        <div className="related-info">
                                            <Link to={`/product/${item.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                                <h5 className="related-name">{item.name}</h5>
                                            </Link>
                                            <p className="related-price">₹{(item.discountPrice || item.regularPrice).toFixed(2)}</p>
                                            <button className="related-add-to-cart-btn" onClick={(e) => handleRelatedAddToCart(e, item)}>
                                                <ShoppingBag size={14} /> Add to Cart
                                            </button>
                                        </div>
                                    </div>
                            ))}
                        </div>
                            <button className="carousel-btn carousel-next" onClick={() => { const el = document.getElementById('top-picks-track'); if (el) el.scrollBy({ left: 300, behavior: 'smooth' }); }}>›</button>
                        </div>
                    </section>
                )}

                {/* You May Also Like (Cross-sells, fallback to category-related) */}
                {(crossSellProducts.length > 0 || relatedProducts.length > 0) && (
                    <section className="related-products-section">
                        <h3 className="related-heading">You May Also Like</h3>
                        <div className="related-carousel">
                            <button className="carousel-btn carousel-prev" onClick={() => { const el = document.getElementById('ymal-track'); if (el) el.scrollBy({ left: -300, behavior: 'smooth' }); }}>‹</button>
                            <div className="related-carousel-track" id="ymal-track">
                                {(crossSellProducts.length > 0 ? crossSellProducts : relatedProducts).map(item => (
                                    <div key={item.id} className="related-card">
                                        <Link to={`/product/${item.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                            <div className="related-image-wrapper">
                                                <img
                                                    src={getGalleryImage(item) || PLACEHOLDER_IMG}
                                                    alt={item.name}
                                                    className="related-img-primary"
                                                />
                                                {item.media && item.media.length > 1 && (
                                                    <img
                                                        src={getGalleryImage(item, 1) || PLACEHOLDER_IMG}
                                                        alt={item.name}
                                                        className="related-img-secondary"
                                                    />
                                                )}
                                                <div className="related-card-actions">
                                                    <button className="related-action-btn" title="Wishlist" onClick={(e) => handleRelatedHeartClick(e, item)}>
                                                        <Heart size={14} color={isInWishlist(item.id) ? "#D4857F" : "#fff"} fill={isInWishlist(item.id) ? "#D4857F" : "none"} />
                                                    </button>
                                                    <div className="pp-related-share-wrapper">
                                                        <button className="related-action-btn" title="Share" onClick={(e) => handleRelatedShareClick(e, item)}>
                                                            <Share2 size={14} />
                                                        </button>
                                                        {relatedShareProductId === item.id && (
                                                            <div className="pp-related-share-dropdown">
                                                                <p className="pp-related-share-title">Share via</p>
                                                                <div className="pp-related-share-icons">
                                                                    <button onClick={(e) => { e.stopPropagation(); relatedShareToWhatsApp(item); }} className="share-icon-btn whatsapp" title="WhatsApp">W</button>
                                                                    <button onClick={(e) => { e.stopPropagation(); relatedShareToFacebook(item); }} className="share-icon-btn facebook" title="Facebook">f</button>
                                                                    <button onClick={(e) => { e.stopPropagation(); relatedShareToTwitter(item); }} className="share-icon-btn twitter" title="Twitter">X</button>
                                                                    <button onClick={(e) => { e.stopPropagation(); relatedShareToLinkedIn(item); }} className="share-icon-btn linkedin" title="LinkedIn">in</button>
                                                                    <button onClick={(e) => { e.stopPropagation(); relatedCopyShareLink(item); }} className="share-icon-btn copy" title="Copy Link"><LinkIcon size={14} /></button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <button className="related-action-btn" title={isInCompare(item.id) ? "Remove from Compare" : "Compare"} onClick={(e) => { e.preventDefault(); e.stopPropagation(); isInCompare(item.id) ? removeFromCompare(item.id) : addToCompare(item); }}>
                                                        <GitCompare size={14} color={isInCompare(item.id) ? "#FF5722" : "#fff"} />
                                                    </button>
                                                </div>
                                            </div>
                                        </Link>
                                        <div className="related-info">
                                            <Link to={`/product/${item.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                                <h5 className="related-name">{item.name}</h5>
                                            </Link>
                                            <p className="related-price">₹{(item.discountPrice || item.regularPrice).toFixed(2)}</p>
                                            <button className="related-add-to-cart-btn" onClick={(e) => handleRelatedAddToCart(e, item)}>
                                                <ShoppingBag size={14} /> Add to Cart
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button className="carousel-btn carousel-next" onClick={() => { const el = document.getElementById('ymal-track'); if (el) el.scrollBy({ left: 300, behavior: 'smooth' }); }}>›</button>
                        </div>
                    </section>
                )}

                    </div>
                </div>
            </main>

            {/* Instagram Story Modal */}
            {storyMediaIndex >= 0 && product && (
            <div className="insta-story-overlay" onClick={() => setStoryMediaIndex(-1)}>
                <div className="insta-story-modal" onClick={(e) => e.stopPropagation()}>
                    <button className="insta-story-close" onClick={() => setStoryMediaIndex(-1)}>
                        <X size={20} />
                    </button>
                    <div className="insta-story-body">
                        <div className="insta-story-embed">
                            {!embedLoaded && (
                              <div className="insta-story-embed-placeholder" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                <div className="pp-modal-loader-ring"></div>
                                <img src={getStoryThumb(instagramMedia[storyMediaIndex])} alt={product.name}
                                  style={{ maxWidth: '60%', maxHeight: '60%', objectFit: 'contain', borderRadius: 16, opacity: 0.6 }}
                                  onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }} />
                                <span style={{ fontSize: '.78rem', color: '#94a3b8', fontWeight: 500 }}>Loading Instagram content...</span>
                              </div>
                            )}
                            {instagramMedia[storyMediaIndex]?.fileName ? (
                                <iframe
                                    key={extractInstagramShortcode(instagramMedia[storyMediaIndex].fileName)}
                                    src={getInstagramEmbedUrl(instagramMedia[storyMediaIndex].fileName)}
                                    title="Instagram content"
                                    className="insta-story-iframe"
                                    style={{ display: embedLoaded ? 'block' : 'none' }}
                                    allow="autoplay; encrypted-media"
                                    allowFullScreen
                                    scrolling="no"
                                    onLoad={() => setEmbedLoaded(true)}
                                />
                            ) : null}
                        </div>
                        <div className="insta-story-product">
                            <div className="pp-modal-product-card">
                                <div className="insta-story-product-image-wrapper">
                                    <img src={getProductImage()} alt={product.name} className="insta-story-product-image" onError={(e) => { e.target.onerror = null; e.target.src = PLACEHOLDER_IMG; }} />
                                </div>
                                <div className="pp-modal-product-details">
                                    <h3 className="insta-story-product-name">{product.name}</h3>
                                    {product.brand && (
                                        <p className="insta-story-product-brand">{product.brand}</p>
                                    )}
                                    <div className="pp-modal-price-block">
                                        <span className="insta-story-product-price">
                                            ₹{((product.discountPrice || product.regularPrice) || 0).toFixed(2)}
                                        </span>
                                        {product.discountPrice && product.regularPrice > product.discountPrice && (
                                            <div className="pp-modal-discount-row">
                                                <s className="insta-story-product-old-price">₹{product.regularPrice.toFixed(2)}</s>
                                                <span className="insta-story-discount-badge">
                                                    {Math.round(((product.regularPrice - product.discountPrice) / product.regularPrice) * 100)}% OFF
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    {product.shortDescription && (
                                        <p className="insta-story-product-desc">{product.shortDescription}</p>
                                    )}
                                    {(() => {
                                        const linkedName = getLinkedProductName(
                                            instagramMedia[storyMediaIndex]?.fileName,
                                            storyMediaIndex
                                        );
                                        if (linkedName) {
                                            return <p className="insta-story-linked-product">{linkedName}</p>;
                                        }
                                        return null;
                                    })()}
                                    {product.tags && product.tags.length > 0 && (
                                        <div className="insta-story-product-tags">
                                            {product.tags.slice(0, 4).map((tag, i) => (
                                                <span key={i} className="insta-story-tag">{tag.name || tag}</span>
                                            ))}
                                        </div>
                                    )}
                                    <div className="pp-modal-actions">
                                        <button className="insta-story-shop-btn" onClick={() => window.open(`/product/${product.id}`, '_self')}>
                                            <ShoppingBag size={16} /> Shop Now
                                        </button>
                                        <button className="pp-modal-share-btn" onClick={() => { const url = `${window.location.origin}/product/${product.id}`; navigator.clipboard.writeText(url); toast.success('Link copied!'); }}>
                                            <Share2 size={15} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {instagramMedia.length > 1 && (
                        <div className="insta-story-nav">
                            <button type="button" className="insta-story-nav-btn" onClick={() => { setStoryMediaIndex(prev => (prev - 1 + instagramMedia.length) % instagramMedia.length); setEmbedLoaded(false); }}>
                                <ChevronLeft size={20} />
                            </button>
                            <div className="pp-modal-dots">
                                {instagramMedia.map((_, i) => (
                                    <button type="button" key={i} className={`pp-modal-dot${i === storyMediaIndex ? ' active' : ''}`} onClick={() => { setStoryMediaIndex(i); setEmbedLoaded(false); }} />
                                ))}
                            </div>
                            <button type="button" className="insta-story-nav-btn" onClick={() => { setStoryMediaIndex(prev => (prev + 1) % instagramMedia.length); setEmbedLoaded(false); }}>
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
            )}

            <Footer />
        </div>
    );
};

export default ProductPage;