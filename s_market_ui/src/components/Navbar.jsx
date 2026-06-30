import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    Search, ShoppingBag, User, Globe, ChevronDown,
    ChevronRight, Loader2, Heart, Package, LogOut, GitCompare, MapPin
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useCompare } from '../context/CompareContext';
import { searchProducts, getCategories, BACKEND_URL, getPrimaryGalleryImage, logoutUser } from '../api/api';
import CartDropdown from './CartDropdown';
import UserDropdown from './UserDropdown';
import logo from '../assets/smarketlogo.svg';
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
    const { cartCount, toggleCart } = useCart();
    const { wishlistCount, isLoggedIn } = useWishlist();
    const { compareCount } = useCompare();

    const [isLangMenuOpen,     setIsLangMenuOpen]     = useState(false);
    const [isUserMenuOpen,     setIsUserMenuOpen]     = useState(false);
    const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
    const [isMobileOpen,       setIsMobileOpen]       = useState(false);
    const [isMobileCatOpen,    setIsMobileCatOpen]    = useState(false);
    const [currentLanguage,    setCurrentLanguage]    = useState('EN');
    const [user,               setUser]               = useState(null);
    const [categories,         setCategories]         = useState(DEFAULT_CATEGORIES);
    const [userLocation,       setUserLocation]       = useState(null);
    const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
    const [locationInput,       setLocationInput]       = useState('');
    const [isDetecting,         setIsDetecting]         = useState(false);

    const location = useLocation();
    const navigate = useNavigate();

    const [searchQuery,     setSearchQuery]     = useState('');
    const [suggestions,     setSuggestions]     = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isSearching,     setIsSearching]     = useState(false);

    const searchRef       = useRef(null); // desktop
    const mobileSearchRef = useRef(null); // mobile top row

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
                console.error('Failed to fetch categories:', err);
            }
        };
        fetchCategories();
    }, []);

    useEffect(() => { setIsMobileOpen(false); }, [location.pathname]);

    useEffect(() => {
        document.body.style.overflow = isMobileOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [isMobileOpen]);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) setUser(JSON.parse(storedUser));
    }, []);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.trim().length >= 2) {
                setIsSearching(true);
                try {
                    const data = await searchProducts(searchQuery);
                    const products = Array.isArray(data) ? data : data?.content || [];

                    // Also match categories
                    const query = searchQuery.toLowerCase();
                    const matchedCategories = categories
                        .filter(cat => cat.label.toLowerCase().includes(query))
                        .map(cat => ({ isCategory: true, name: cat.label, slug: cat.slug }));

                    // Combine: categories first, then products
                    const combined = [...matchedCategories.slice(0, 3), ...products.slice(0, 6)];
                    setSuggestions(combined);
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
        }, 150); // Faster response
        return () => clearTimeout(timer);
    }, [searchQuery, categories]);

    useEffect(() => {
        const handler = (e) => {
            const inDesktop = searchRef.current?.contains(e.target);
            const inMobile  = mobileSearchRef.current?.contains(e.target);
            if (!inDesktop && !inMobile) setShowSuggestions(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Detect user location
    useEffect(() => {
        const stored = localStorage.getItem('userLocation');
        if (stored) { setUserLocation(stored); return; }

        const fallbackToIP = () => {
            fetch('https://ipapi.co/json/')
                .then(r => r.json())
                .then(data => {
                    if (data.city) {
                        const loc = `${data.city}, ${data.country_name || data.country}`;
                        setUserLocation(loc);
                        localStorage.setItem('userLocation', loc);
                    }
                })
                .catch(() => {});
        };
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const { latitude, longitude } = pos.coords;
                    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=en`)
                        .then(r => r.json())
                        .then(data => {
                            const addr = data.address;
                            const city = addr.city || addr.town || addr.village || addr.county;
                            const state = addr.state;
                            const country = addr.country;
                            if (city) {
                                const loc = `${city}${state ? ', ' + state : ''}`;
                                setUserLocation(loc);
                                localStorage.setItem('userLocation', loc);
                            }
                        })
                        .catch(fallbackToIP);
                },
                fallbackToIP,
                { timeout: 5000 }
            );
        } else {
            fallbackToIP();
        }
    }, []);

    const detectLocation = () => {
        setIsDetecting(true);
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const { latitude, longitude } = pos.coords;
                    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=en`)
                        .then(r => r.json())
                        .then(data => {
                            const addr = data.address;
                            const city = addr.city || addr.town || addr.village || addr.county;
                            const state = addr.state;
                            const country = addr.country;
                            if (city) {
                                const loc = `${city}${state ? ', ' + state : ''}`;
                                setUserLocation(loc);
                                localStorage.setItem('userLocation', loc);
                            }
                            setIsDetecting(false);
                            setIsLocationModalOpen(false);
                        })
                        .catch(() => { setIsDetecting(false); });
                },
                () => { setIsDetecting(false); },
                { timeout: 10000 }
            );
        } else {
            setIsDetecting(false);
        }
    };

    const applyLocation = () => {
        const trimmed = locationInput.trim();
        if (trimmed) {
            setUserLocation(trimmed);
            localStorage.setItem('userLocation', trimmed);
            setIsLocationModalOpen(false);
            setLocationInput('');
        }
    };

    const handleSearchSubmit = (e) => {
        if (e) e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
            setShowSuggestions(false);
            setIsMobileOpen(false);
        }
    };

    const handleSuggestionClick = (item) => {
        if (item.isCategory) {
            navigate(`/shop/${item.slug}`);
        } else {
            navigate(`/product/${item.id}`);
        }
        setSearchQuery('');
        setShowSuggestions(false);
        setIsMobileOpen(false);
    };

    const isActive = (path) => location.pathname === path;

    const SuggestionsDropdown = () => (
        <div className="search-suggestions-dropdown">
            {suggestions.map((item, index) => (
                item.isCategory ? (
                    <div
                        key={`cat-${index}`}
                        className="suggestion-item suggestion-category-item"
                        onClick={() => handleSuggestionClick(item)}
                    >
                        <div className="suggestion-image">
                            <div className="suggestion-image-placeholder" style={{ background: '#F5EDE6' }}>
                                <span style={{ fontSize: '0.75rem', color: '#C9A87C' }}>CAT</span>
                            </div>
                        </div>
                        <div className="suggestion-info">
                            <div className="suggestion-name">{item.name}</div>
                            <div className="suggestion-category" style={{ color: '#C9A87C' }}>Category</div>
                        </div>
                    </div>
                ) : (
                    <div
                        key={item.id}
                        className="suggestion-item"
                        onClick={() => handleSuggestionClick(item)}
                    >
                        <div className="suggestion-image">
                            {(() => {
                                const img = getPrimaryGalleryImage(item);
                                if (img) return <img src={img} alt={item.name} />;
                                return (
                                    <div className="suggestion-image-placeholder">
                                        <Search size={13} />
                                    </div>);
                            })()}
                        </div>
                        <div className="suggestion-info">
                            <div className="suggestion-name">{item.name}</div>
                            <div className="suggestion-category">{item.category}</div>
                        </div>
                        <div className="suggestion-price">
                            ₹{item.discountPrice || item.regularPrice}
                        </div>
                    </div>
                )
            ))}
            <div className="suggestion-all" onClick={handleSearchSubmit}>
                See all results for "{searchQuery}"
            </div>
        </div>
    );

    return (
        <>
        <nav className="navbar-container">

            {/* ══ TOP ROW ══ */}
            <div className="navbar-top">

                {/* Line 1: Logo + Actions */}
                <div className="navbar-inner">

                    <div className="navbar-logo-container">
                        <Link to="/" className="navbar-logo-link">
                            <img src={logo} alt="SreeMarket" className="navbar-logo-image" />
                        </Link>
                    </div>

                    {/* Desktop Search */}
                    <div className="navbar-search-container navbar-search-desktop" ref={searchRef}>
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
                        {showSuggestions && suggestions.length > 0 && <SuggestionsDropdown />}
                    </div>

                    {/* Right Actions */}
                    <div className="navbar-actions-container">

                        <div className="navbar-delivery-info" onClick={() => setIsLocationModalOpen(true)} style={{ cursor: 'pointer' }}>
                            <span className="delivery-label">Deliver to</span>
                            <span className="delivery-country">
                                <MapPin size={13} style={{ marginRight: 3, verticalAlign: 'middle' }} />
                                {userLocation || 'Set location'}
                            </span>
                        </div>

                        <div className="language-selector">
                            <button className="navbar-action-btn" onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}>
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

                        <div className="wishlist-nav-container">
                            <Link to={isLoggedIn ? '/wishlist' : '/login'} className="navbar-heart-link">
                                <Heart size={20} />
                                {wishlistCount > 0 && (
                                    <span className="wishlist-badge">{wishlistCount}</span>
                                )}
                            </Link>
                        </div>

                        <div className="compare-nav-container">
                            <Link to="/compare" className="navbar-compare-link">
                                <GitCompare size={20} />
                                {compareCount > 0 && (
                                    <span className="compare-badge">{compareCount}</span>
                                )}
                            </Link>
                        </div>

                        <div className="cart-container">
                            <button className="navbar-action-btn" onClick={toggleCart}>
                                <ShoppingBag size={20} />
                                <span className="action-text">Cart</span>
                                {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                            </button>
                            <CartDropdown />
                        </div>

                        <div className="user-dropdown-container">
                            <button className="navbar-action-btn" onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}>
                                <User size={20} />
                                <span className="action-text">{user ? user.fullName : 'Login'}</span>
                            </button>
                            <UserDropdown isOpen={isUserMenuOpen} onClose={() => setIsUserMenuOpen(false)} />
                        </div>

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

                {/* Line 2: Mobile Search Row (always visible on mobile, hidden on desktop) */}
                <div className="navbar-mobile-search-row">
                    <div className="navbar-search-container" ref={mobileSearchRef}>
                        <form onSubmit={handleSearchSubmit} className="navbar-search-form">
                            <input
                                type="text"
                                placeholder="Search products..."
                                className="navbar-search-input"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => searchQuery.trim().length > 1 && setShowSuggestions(true)}
                            />
                            <button type="submit" className="navbar-search-btn">
                                {isSearching
                                    ? <Loader2 size={17} color="white" className="animate-spin" />
                                    : <Search size={17} color="white" />}
                            </button>
                        </form>
                        {showSuggestions && suggestions.length > 0 && <SuggestionsDropdown />}
                    </div>
                </div>

            </div>
            {/* END TOP ROW */}

            {/* ══ DESKTOP BOTTOM ROW ══ */}
            <div className="navbar-bottom">
                <div className="navbar-inner">

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
                                        to={`/shop?category=${cat.slug}`}
                                        className="category-dropdown-item"
                                    >
                                        {cat.label}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="navbar-main-links">
                        <Link to="/"         className={`nav-link ${isActive('/')         ? 'active' : ''}`}>Home</Link>
                        <Link to="/shop"      className={`nav-link ${isActive('/shop')      ? 'active' : ''}`}>Shop</Link>
                        <Link to="/our-story" className={`nav-link ${isActive('/our-story') ? 'active' : ''}`}>Our Story</Link>
                    </div>

                    <div className="navbar-wholesale-link">
                        <Link to="/wholesale" className="wholesale-action">
                            Go To Wholesale Page <ChevronRight size={15} />
                        </Link>
                    </div>
                </div>
            </div>

            {/* ══ MOBILE DRAWER ══ */}
            <div className={`navbar-mobile-drawer ${isMobileOpen ? 'open' : ''}`}>

                {/* Nav Links */}
                <div className="navbar-mobile-links">

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
                                    to={`/shop?category=${cat.slug}`}
                                    className="navbar-mobile-link"
                                >
                                    {cat.label}
                                </Link>
                            ))}
                        </div>
                    </div>

                    <Link to="/"         className={`navbar-mobile-link ${isActive('/')         ? 'active' : ''}`}>Home</Link>
                    <Link to="/shop"      className={`navbar-mobile-link ${isActive('/shop')      ? 'active' : ''}`}>Shop</Link>
                    <Link to="/our-story" className={`navbar-mobile-link ${isActive('/our-story') ? 'active' : ''}`}>Our Story</Link>
                    <Link to="/wholesale" className="navbar-mobile-link wholesale">
                        Go To Wholesale Page <ChevronRight size={14} style={{ marginLeft: 4 }} />
                    </Link>
                </div>

                {/* Bottom action icons */}
                <div className="navbar-mobile-actions">

                    <button
                        className="navbar-mobile-action-btn"
                        onClick={() => { toggleCart(); setIsMobileOpen(false); }}
                    >
                        <div style={{ position: 'relative' }}>
                            <ShoppingBag size={22} />
                            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                        </div>
                        <span>Cart</span>
                    </button>

                    {user && (
                        <Link to="/orders" className="navbar-mobile-action-btn" onClick={() => setIsMobileOpen(false)}>
                            <Package size={22} />
                            <span>Orders</span>
                        </Link>
                    )}

                    <Link
                        to={isLoggedIn ? '/wishlist' : '/login'}
                        className="navbar-mobile-action-btn"
                        onClick={() => setIsMobileOpen(false)}
                    >
                        <div style={{ position: 'relative' }}>
                            <Heart size={22} />
                            {isLoggedIn && wishlistCount > 0 && (
                                <span className="wishlist-badge">{wishlistCount}</span>
                            )}
                        </div>
                        <span>Wishlist</span>
                    </Link>

                    <Link
                        to={user ? '/settings' : '/login'}
                        className="navbar-mobile-action-btn"
                        onClick={() => setIsMobileOpen(false)}
                    >
                        <User size={22} />
                        <span>{user ? 'Account' : 'Login'}</span>
                    </Link>

                    <button className="navbar-mobile-action-btn" onClick={() => setIsLangMenuOpen(v => !v)}>
                        <Globe size={22} />
                        <span>{currentLanguage}</span>
                    </button>
                </div>

                {user && (
                    <div className="navbar-mobile-logout">
                        <button
                            className="navbar-mobile-logout-btn"
                            onClick={async () => {
                                try { await logoutUser(); } catch (e) {}
                                localStorage.removeItem('user');
                                setIsMobileOpen(false);
                                window.location.replace('/login');
                            }}
                        >
                            <LogOut size={18} />
                            <span>Logout</span>
                        </button>
                    </div>
                )}
            </div>

        </nav>
        {isLocationModalOpen && (
            <div className="location-overlay" onClick={() => setIsLocationModalOpen(false)}>
                <div className="location-modal" onClick={(e) => e.stopPropagation()}>
                    <button className="location-modal-close" onClick={() => setIsLocationModalOpen(false)}>&times;</button>
                    <h3 className="location-modal-title">Choose your location</h3>
                    <p className="location-modal-desc">Set your delivery location to see product availability and delivery options.</p>

                    <button className="location-detect-btn" onClick={detectLocation} disabled={isDetecting}>
                        {isDetecting ? (
                            <><Loader2 size={18} className="animate-spin" /> Detecting...</>
                        ) : (
                            <><MapPin size={18} /> Use current location</>
                        )}
                    </button>

                    <div className="location-divider"><span>or</span></div>

                    <div className="location-input-group">
                        <input
                            type="text"
                            className="location-input"
                            placeholder="Enter city or pincode"
                            value={locationInput}
                            onChange={(e) => setLocationInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') applyLocation(); }}
                        />
                        <button className="location-apply-btn" onClick={applyLocation}>Apply</button>
                    </div>
                </div>
            </div>
        )}
        <div className="navbar-spacer" />
        </>
    );
};

export default Navbar;