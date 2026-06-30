'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    Search, ShoppingBag, User, Globe, ChevronDown,
    ChevronRight, Loader2, Heart, Menu, X, Package, LogOut
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/context/AuthContext';
import { searchProducts, getCategories } from '@/lib/api/client';
import { BACKEND_URL } from '@/lib/api/shared';
import CartDropdown from '../CartDropdown';
import UserDropdown from '../UserDropdown';
import './Navbar.css';

const DEFAULT_CATEGORIES = [
    { label: 'Grocery & Gourmet Food',      slug: 'grocery'  },
    { label: 'Health & Household',           slug: 'health'   },
    { label: 'Home & Kitchen',               slug: 'home'     },
    { label: 'Beauty & Personal Care',       slug: 'beauty'   },
    { label: 'Clothing, Shoes & Jewellery',  slug: 'clothing' },
    { label: 'Toys & Games',                 slug: 'toys'     },
    { label: 'Patio, Lawn & Garden',         slug: 'patio'    },
    { label: 'Musical Instruments',          slug: 'musical'  },
];

const Navbar = () => {
    const { cartCount, toggleCart, isCartOpen } = useCart();
    const { wishlistCount } = useWishlist();
    const { user, userId, roleId, isLoggedIn, logout } = useAuth();

    const [isLangMenuOpen,      setIsLangMenuOpen]      = useState(false);
    const [isUserMenuOpen,      setIsUserMenuOpen]      = useState(false);
    const [isCategoryMenuOpen,  setIsCategoryMenuOpen]  = useState(false);
    const [isMobileOpen,        setIsMobileOpen]        = useState(false);
    const [isMobileCatOpen,     setIsMobileCatOpen]     = useState(false);
    const [currentLanguage,     setCurrentLanguage]     = useState('EN');
    const [categories,          setCategories]          = useState(DEFAULT_CATEGORIES);

    const pathname = usePathname();
    const router   = useRouter();

    // Search state
    const [searchQuery,    setSearchQuery]    = useState('');
    const [suggestions,    setSuggestions]    = useState([]);
    const [showSuggestions,setShowSuggestions]= useState(false);
    const [isSearching,    setIsSearching]    = useState(false);
    const searchRef = useRef(null);

    // Fetch dynamic categories from admin
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const data = await getCategories();
                const active = (data || [])
                    .filter(cat => cat.status === 'Active')
                    .map(cat => ({
                        label: cat.name,
                        slug: cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
                    }));
                if (active.length > 0) setCategories(active);
            } catch (err) {
                console.error('Failed to fetch categories for navbar:', err);
            }
        };
        fetchCategories();
    }, []);

    // Close mobile drawer on route change
    useEffect(() => { setIsMobileOpen(false); }, [pathname]);

    // Lock body scroll when mobile menu open
    useEffect(() => {
        document.body.style.overflow = isMobileOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [isMobileOpen]);

    // Debounced search suggestions
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.trim().length > 1) {
                setIsSearching(true);
                try {
                    const data = await searchProducts(searchQuery);
                    setSuggestions(data.slice(0, 8));
                    setShowSuggestions(true);
                } catch (err) {
                    console.error('Search failed:', err);
                    setSuggestions([]);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setSuggestions([]);
                setShowSuggestions(false);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Close suggestions on outside click
    useEffect(() => {
        const handler = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target))
                setShowSuggestions(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleSearchSubmit = (e) => {
        if (e) e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
            setShowSuggestions(false);
            setIsMobileOpen(false);
        }
    };

    const handleSuggestionClick = (product) => {
        router.push(`/product/${product.id}`);
        setSearchQuery('');
        setShowSuggestions(false);
        setIsMobileOpen(false);
    };

    const isActive = (path) => pathname === path;

    return (
        <>
        <nav className="navbar-container">

            {/* TOP ROW */}
            <div className="navbar-top">
                <div className="navbar-inner">

                    {/* Logo */}
                    <div className="navbar-logo-container">
                        <Link href="/" className="navbar-logo-link">
                            <img src="/assets/smarketlogo.svg" alt="SreeMarket" className="navbar-logo-image" />
                        </Link>
                    </div>

                    {/* Desktop Search */}
                    <div className="navbar-search-container" ref={searchRef}>
                        <form onSubmit={handleSearchSubmit} className="navbar-search-form">
                            <input
                                type="text"
                                placeholder="What are you looking for"
                                className="navbar-search-input"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => searchQuery.trim().length > 1 && setShowSuggestions(true)}
                            />
                            <button type="submit" className="navbar-search-btn">
                                {isSearching
                                    ? <Loader2 size={18} color="white" className="animate-spin" />
                                    : <Search size={18} color="white" />}
                            </button>
                        </form>

                        {showSuggestions && suggestions.length > 0 && (
                            <div className="search-suggestions-dropdown">
                                {suggestions.map((product) => (
                                    <div
                                        key={product.id}
                                        className="suggestion-item"
                                        onClick={() => handleSuggestionClick(product)}
                                    >
                                        <div className="suggestion-image">
                                            {product.media?.length > 0 ? (
                                                <img
                                                    src={`${BACKEND_URL}/uploads/products/${product.media.find(m => m.isPrimary)?.fileName || product.media[0].fileName}`}
                                                    alt={product.name}
                                                />
                                            ) : (
                                                <div className="suggestion-image-placeholder">
                                                    <Search size={13} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="suggestion-info">
                                            <div className="suggestion-name">{product.name}</div>
                                            <div className="suggestion-category">{product.category}</div>
                                        </div>
                                        <div className="suggestion-price">
                                            ₹{product.discountPrice || product.regularPrice}
                                        </div>
                                    </div>
                                ))}
                                <div className="suggestion-all" onClick={handleSearchSubmit}>
                                    See all results for "{searchQuery}"
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Desktop Right Actions */}
                    <div className="navbar-actions-container">
                        {/* Delivery */}
                        <div className="navbar-delivery-info">
                            <span className="delivery-label">Delivery to</span>
                            <span className="delivery-country">IN</span>
                        </div>

                        {/* Language */}
                        <div className="language-selector">
                            <button
                                className="navbar-action-btn"
                                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                            >
                                <Globe size={18} />
                                <span className="action-text">English</span>
                                <ChevronDown size={13} />
                            </button>
                            {isLangMenuOpen && (
                                <div className="dropdown-menu">
                                    {['EN', 'HI', 'FR'].map(lang => (
                                        <button
                                            key={lang}
                                            className={`dropdown-item ${currentLanguage === lang ? 'active' : ''}`}
                                            onClick={() => { setCurrentLanguage(lang); setIsLangMenuOpen(false); }}
                                        >
                                            {lang === 'EN' ? 'English' : lang === 'HI' ? 'Hindi' : 'French'}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Wishlist */}
                        <div className="wishlist-nav-container">
                            {isLoggedIn && (
                                <Link href="/wishlist" className="navbar-heart-link">
                                    <Heart size={20} />
                                    <span className="action-text">Wishlist</span>
                                    {wishlistCount > 0 && (
                                        <span className="wishlist-badge">{wishlistCount}</span>
                                    )}
                                </Link>
                            )}
                        </div>

                        {/* Cart */}
                        <div className="cart-container">
                            <button className="navbar-action-btn" onClick={toggleCart}>
                                <ShoppingBag size={20} />
                                <span className="action-text">Cart</span>
                                {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                            </button>
                            <CartDropdown />
                        </div>

                        {/* User */}
                        <div className="user-dropdown-container">
                            <button
                                className="navbar-action-btn"
                                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                            >
                                <User size={20} />
                                <span className="action-text">{user ? user.fullName : 'Login'}</span>
                            </button>
                            <UserDropdown
                                isOpen={isUserMenuOpen}
                                onClose={() => setIsUserMenuOpen(false)}
                            />
                        </div>

                        {/* Hamburger — mobile only */}
                        <button
                            className={`navbar-mobile-toggle ${isMobileOpen ? 'open' : ''}`}
                            onClick={() => setIsMobileOpen(v => !v)}
                            aria-label={isMobileOpen ? 'Close menu' : 'Open menu'}
                        >
                            <span className="hamburger-bar" />
                            <span className="hamburger-bar" />
                            <span className="hamburger-bar" />
                        </button>
                    </div>
                </div>
            </div>

            {/* DESKTOP BOTTOM ROW */}
            <div className="navbar-bottom">
                <div className="navbar-inner">
                    {/* Categories dropdown */}
                    <div
                        className="navbar-categories-menu"
                        onMouseEnter={() => setIsCategoryMenuOpen(true)}
                        onMouseLeave={() => setIsCategoryMenuOpen(false)}
                    >
                        <button
                            className="categories-menu-btn"
                            onClick={() => setIsCategoryMenuOpen(!isCategoryMenuOpen)}
                        >
                            <span className="hamburger-icon">≡</span> All Categories
                        </button>
                        {isCategoryMenuOpen && (
                            <div className="categories-dropdown-menu">
                                {categories.map(cat => (
                                    <Link
                                        key={cat.slug}
                                        href={`/shop?category=${cat.slug}`}
                                        className="category-dropdown-item"
                                    >
                                        {cat.label}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Main nav links */}
                    <div className="navbar-main-links">
                        <Link href="/"          className={`nav-link ${isActive('/')          ? 'active' : ''}`}>Home</Link>
                        <Link href="/shop"       className={`nav-link ${isActive('/shop')       ? 'active' : ''}`}>Shop</Link>
                        <Link href="/our-story"  className={`nav-link ${isActive('/our-story')  ? 'active' : ''}`}>Our Story</Link>
                    </div>

                    {/* Wholesale */}
                    <div className="navbar-wholesale-link">
                        <Link href="/wholesale" className="wholesale-action">
                            Go To Wholesale Page <ChevronRight size={15} />
                        </Link>
                    </div>
                </div>
            </div>

            {/* MOBILE DRAWER */}
            <div className={`navbar-mobile-drawer ${isMobileOpen ? 'open' : ''}`}>

                {/* Mobile Search */}
                <div className="navbar-mobile-search">
                    <div className="navbar-search-container" ref={null}>
                        <form onSubmit={handleSearchSubmit} className="navbar-search-form">
                            <input
                                type="text"
                                placeholder="Search products..."
                                className="navbar-search-input"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <button type="submit" className="navbar-search-btn">
                                <Search size={17} color="white" />
                            </button>
                        </form>
                    </div>
                </div>

                {/* Mobile Nav Links */}
                <div className="navbar-mobile-links">

                    {/* Categories accordion */}
                    <div className="navbar-mobile-categories">
                        <button
                            className="navbar-mobile-cat-toggle"
                            onClick={() => setIsMobileCatOpen(v => !v)}
                        >
                            <span>≡ All Categories</span>
                            <ChevronRight
                                size={16}
                                className={`navbar-mobile-cat-chevron ${isMobileCatOpen ? 'open' : ''}`}
                            />
                        </button>
                        <div className={`navbar-mobile-cat-list ${isMobileCatOpen ? 'open' : ''}`}>
                            {categories.map(cat => (
                                <Link
                                    key={cat.slug}
                                    href={`/shop?category=${cat.slug}`}
                                    className="navbar-mobile-link"
                                >
                                    {cat.label}
                                </Link>
                            ))}
                        </div>
                    </div>

                    <Link href="/"         className={`navbar-mobile-link ${isActive('/')         ? 'active' : ''}`}>Home</Link>
                    <Link href="/shop"      className={`navbar-mobile-link ${isActive('/shop')      ? 'active' : ''}`}>Shop</Link>
                    <Link href="/our-story" className={`navbar-mobile-link ${isActive('/our-story') ? 'active' : ''}`}>Our Story</Link>
                    <Link href="/wholesale" className="navbar-mobile-link wholesale">
                        Go To Wholesale Page <ChevronRight size={14} style={{ marginLeft: 4 }} />
                    </Link>
                </div>

                {/* Mobile bottom actions */}
                <div className="navbar-mobile-actions">
                    {/* Cart */}
                    <button className="navbar-mobile-action-btn" onClick={() => { toggleCart(); setIsMobileOpen(false); }}>
                        <div style={{ position: 'relative' }}>
                            <ShoppingBag size={22} />
                            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                        </div>
                        <span>Cart</span>
                    </button>

                    {/* Orders */}
                    {user && (
                        <Link href="/orders" className="navbar-mobile-action-btn" onClick={() => setIsMobileOpen(false)}>
                            <Package size={22} />
                            <span>Orders</span>
                        </Link>
                    )}

                    {/* Wishlist */}
                    {isLoggedIn && (
                        <Link href="/wishlist" className="navbar-mobile-action-btn" onClick={() => setIsMobileOpen(false)}>
                            <div style={{ position: 'relative' }}>
                                <Heart size={22} />
                                {wishlistCount > 0 && <span className="wishlist-badge">{wishlistCount}</span>}
                            </div>
                            <span>Wishlist</span>
                        </Link>
                    )}

                    {/* User / Login */}
                    <Link
                        href={user ? '/settings' : '/login'}
                        className="navbar-mobile-action-btn"
                        onClick={() => setIsMobileOpen(false)}
                    >
                        <User size={22} />
                        <span>{user ? 'Account' : 'Login'}</span>
                    </Link>

                    {/* Language */}
                    <button className="navbar-mobile-action-btn" onClick={() => setIsLangMenuOpen(v => !v)}>
                        <Globe size={22} />
                        <span>{currentLanguage}</span>
                    </button>
                </div>

                {/* Mobile Logout */}
                {user && (
                    <div className="navbar-mobile-logout">
                        <button
                            className="navbar-mobile-logout-btn"
                            onClick={() => {
                                logout();
                                setIsMobileOpen(false);
                                router.push('/login');
                            }}
                        >
                            <LogOut size={18} />
                            <span>Logout</span>
                        </button>
                    </div>
                )}

            </div>
        </nav>
        <div className="navbar-spacer" />
        </>
    );
};

export default Navbar;
