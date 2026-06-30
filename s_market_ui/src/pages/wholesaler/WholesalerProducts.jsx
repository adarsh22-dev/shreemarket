import React, { useEffect, useState } from 'react';
import { Search, Filter, ShoppingCart, Plus, Minus, Heart, Share2, GitCompare, Eye, ShoppingBag, Link as LinkIcon } from 'lucide-react';
import { getWholesaleProducts } from '../../api/api';
import { useWishlist } from '../../context/WishlistContext';
import { useCompare } from '../../context/CompareContext';
import { useCart } from '../../context/CartContext';
import toast from 'react-hot-toast';

const WholesalerProducts = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');
    const [quantities, setQuantities] = useState({});
    const [shareProductId, setShareProductId] = useState(null);

    const { isInWishlist, addToWishlist, removeFromWishlist, isLoggedIn } = useWishlist();
    const { isInCompare, addToCompare, removeFromCompare } = useCompare();
    const { addToCart } = useCart();

    const handleHeartClick = (e, product) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isLoggedIn) { toast.error('Please login to add to wishlist'); return; }
        isInWishlist(product.id) ? removeFromWishlist(product.id) : addToWishlist(product);
    };

    const handleShareClick = (e, product) => {
        e.preventDefault();
        e.stopPropagation();
        setShareProductId(shareProductId === product.id ? null : product.id);
    };

    const shareToWhatsApp = (product) => {
        const url = `${window.location.origin}/product/${product.id}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(`${product.name} - ${url}`)}`, '_blank');
        setShareProductId(null);
    };

    const shareToFacebook = (product) => {
        const url = `${window.location.origin}/product/${product.id}`;
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        setShareProductId(null);
    };

    const shareToTwitter = (product) => {
        const url = `${window.location.origin}/product/${product.id}`;
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(product.name)}`, '_blank');
        setShareProductId(null);
    };

    const shareToLinkedIn = (product) => {
        const url = `${window.location.origin}/product/${product.id}`;
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
        setShareProductId(null);
    };

    const copyShareLink = (product) => {
        const url = `${window.location.origin}/product/${product.id}`;
        navigator.clipboard.writeText(url);
        toast.success('Link copied!');
        setShareProductId(null);
    };

    useEffect(() => {
        const fetch = async () => {
            try {
                const params = {};
                if (search) params.search = search;
                if (category) params.category = category;
                const data = await getWholesaleProducts(params);
                setProducts(data);
                const q = {};
                data.forEach(p => { q[p.id] = p.minimumWholesaleQuantity || 1; });
                setQuantities(q);
            } catch (err) {
                toast.error('Failed to load products');
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    const filtered = products.filter(p => {
        if (search && !p.name?.toLowerCase().includes(search.toLowerCase())) return false;
        if (category && p.category !== category) return false;
        return true;
    });

    const categories = [...new Set(products.map(p => p.category).filter(Boolean))];

    const getEffectivePrice = (product, qty) => {
        let price = product.wholesalePrice || product.regularPrice || 0;
        if (product.pricingTiers && product.pricingTiers.length > 0) {
            const sorted = [...product.pricingTiers].sort((a, b) => a.minQuantity - b.minQuantity);
            for (const tier of sorted) {
                if (qty >= tier.minQuantity && (!tier.maxQuantity || qty <= tier.maxQuantity)) {
                    price = tier.unitPrice || price;
                }
            }
        }
        return price;
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>Loading products...</div>;

    return (
        <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.25rem' }}>Wholesale Products</h1>
            <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>Browse and order products at wholesale prices</p>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                    <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                    <input placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '0.6rem 0.75rem 0.6rem 2.25rem', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.9rem', outline: 'none' }} />
                </div>
                <select value={category} onChange={e => setCategory(e.target.value)} style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.9rem', background: '#fff', outline: 'none' }}>
                    <option value="">All Categories</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                {filtered.map(product => {
                    const qty = quantities[product.id] || 1;
                    const effectivePrice = getEffectivePrice(product, qty);
                    const savings = product.regularPrice && effectivePrice < product.regularPrice
                        ? Math.round(((product.regularPrice - effectivePrice) / product.regularPrice) * 100)
                        : 0;

                    return (
                        <div key={product.id} style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                            <div style={{ height: '160px', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                                {/* Action Buttons Overlay */}
                                <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', zIndex: 2, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                    {/* Wishlist */}
                                    <button onClick={(e) => handleHeartClick(e, product)} style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.95)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', color: isLoggedIn && isInWishlist(product.id) ? '#FF5722' : '#666' }} title="Add to Wishlist">
                                        <Heart size={16} fill={isLoggedIn && isInWishlist(product.id) ? "#FF5722" : "none"} />
                                    </button>
                                    {/* Compare */}
                                    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); isInCompare(product.id) ? removeFromCompare(product.id) : addToCompare(product); }} style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.95)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', color: isInCompare(product.id) ? '#FF5722' : '#666' }} title="Add to Compare">
                                        <GitCompare size={16} />
                                    </button>
                                    {/* Share */}
                                    <div className="sp-share-wrapper" style={{ position: 'relative' }}>
                                        <button onClick={(e) => handleShareClick(e, product)} style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.95)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', color: '#666' }} title="Share">
                                            <Share2 size={16} />
                                        </button>
                                        {shareProductId === product.id && (
                                            <div className="sp-share-dropdown" style={{ position: 'absolute', top: '100%', right: 0, marginTop: '0.35rem', background: '#fff', borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', padding: '0.75rem', minWidth: '180px', zIndex: 10, border: '1px solid #f3f4f6' }}>
                                                <p className="sp-share-dropdown-title" style={{ margin: '0 0 0.5rem', fontSize: '0.8rem', fontWeight: '600', color: '#374151' }}>Share via</p>
                                                <div className="sp-share-icons-row" style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                    <button onClick={() => shareToWhatsApp(product)} className="share-icon-btn whatsapp" style={{ width: '36px', height: '36px', borderRadius: '50%', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: '700', background: '#25D366', color: '#fff' }} title="WhatsApp">W</button>
                                                    <button onClick={() => shareToFacebook(product)} className="share-icon-btn facebook" style={{ width: '36px', height: '36px', borderRadius: '50%', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: '700', background: '#1877F2', color: '#fff' }} title="Facebook">f</button>
                                                    <button onClick={() => shareToTwitter(product)} className="share-icon-btn twitter" style={{ width: '36px', height: '36px', borderRadius: '50%', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: '700', background: '#000', color: '#fff' }} title="Twitter">X</button>
                                                    <button onClick={() => shareToLinkedIn(product)} className="share-icon-btn linkedin" style={{ width: '36px', height: '36px', borderRadius: '50%', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: '700', background: '#0A66C2', color: '#fff' }} title="LinkedIn">in</button>
                                                    <button onClick={() => copyShareLink(product)} className="share-icon-btn copy" style={{ width: '36px', height: '36px', borderRadius: '50%', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6', color: '#374151' }} title="Copy Link"><LinkIcon size={16} /></button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    {/* Quick View */}
                                    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.open(`/product/${product.id}`, '_blank'); }} style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.95)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', color: '#666' }} title="Quick View">
                                        <Eye size={16} />
                                    </button>
                                </div>

                                {product.media?.length > 0 && product.media[0].fileName ? (
                                    <img src={`/uploads/products/${product.media[0].fileName}`} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <ShoppingCart size={32} color="#d1d5db" />
                                )}
                                {savings > 0 && (
                                    <span style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: '#059669', color: '#fff', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600' }}>{savings}% OFF</span>
                                )}
                            </div>
                            <div style={{ padding: '1rem' }}>
                                <h3 style={{ margin: '0 0 0.25rem', fontSize: '1rem', fontWeight: '600' }}>{product.name}</h3>
                                {product.category && <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{product.category}</span>}

                                <div style={{ marginTop: '0.75rem' }}>
                                    <span style={{ fontSize: '1.25rem', fontWeight: '700', color: '#d97706' }}>₹{effectivePrice}</span>
                                    {product.regularPrice > effectivePrice && (
                                        <span style={{ marginLeft: '0.5rem', fontSize: '0.85rem', color: '#9ca3af', textDecoration: 'line-through' }}>₹{product.regularPrice}</span>
                                    )}
                                </div>

                                {product.minimumWholesaleQuantity && (
                                    <p style={{ margin: '0.25rem 0', fontSize: '0.8rem', color: '#6b7280' }}>Min. qty: {product.minimumWholesaleQuantity}</p>
                                )}

                                {product.pricingTiers?.length > 0 && (
                                    <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                                        {product.pricingTiers.sort((a, b) => a.minQuantity - b.minQuantity).map((tier, i) => (
                                            <span key={i} style={{ padding: '0.15rem 0.4rem', borderRadius: '4px', background: '#fffbeb', color: '#d97706', fontSize: '0.7rem', fontWeight: '500', border: '1px solid #fde68a' }}>
                                                {tier.minQuantity}+ @ ₹{tier.unitPrice}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <button onClick={() => setQuantities(prev => ({ ...prev, [product.id]: Math.max(1, qty - 1) }))} style={{ padding: '0.35rem 0.6rem', borderRadius: '6px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer' }}><Minus size={14} /></button>
                                    <span style={{ fontWeight: '600', minWidth: '2rem', textAlign: 'center' }}>{qty}</span>
                                    <button onClick={() => setQuantities(prev => ({ ...prev, [product.id]: qty + 1 }))} style={{ padding: '0.35rem 0.6rem', borderRadius: '6px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer' }}><Plus size={14} /></button>
                                    <button onClick={() => { addToCart({ ...product, quantity: qty, price: effectivePrice }); toast.success('Added to cart'); }} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', background: '#d97706', color: '#fff', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '500' }}><ShoppingBag size={14} /> Add to Cart</button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {filtered.length === 0 && (
                <div style={{ background: '#fff', borderRadius: '12px', padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
                    <Filter size={40} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                    <p>No wholesale products found</p>
                </div>
            )}
        </div>
    );
};

export default WholesalerProducts;
