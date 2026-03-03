import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, User, Globe, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { searchProducts, BACKEND_URL } from '../api/api';
import CartDropdown from './CartDropdown';
import UserDropdown from './UserDropdown';
import Button from './ui/Button';
import logo from '../assets/smarketlogo.svg';
import './Navbar.css';

const Navbar = () => {
    const { cartCount, toggleCart, isCartOpen } = useCart();
    const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
    const [currentLanguage, setCurrentLanguage] = useState('EN');
    const [user, setUser] = useState(null);
    const location = useLocation();
    const navigate = useNavigate();

    // Search Suggestions State
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const searchRef = useRef(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    // Fetch suggestions with debounce
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.trim().length > 1) {
                setIsSearching(true);
                try {
                    const data = await searchProducts(searchQuery);
                    setSuggestions(data.slice(0, 8)); // Limit to 8 suggestions
                    setShowSuggestions(true);
                } catch (err) {
                    console.error("Search failed:", err);
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

    // Click outside handler
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearchSubmit = (e) => {
        if (e) e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
            setShowSuggestions(false);
        }
    };

    const handleSuggestionClick = (product) => {
        navigate(`/product/${product.id}`);
        setSearchQuery('');
        setShowSuggestions(false);
    };

    return (
        <nav className="navbar-container">
            {/* Top Row */}
            <div className="navbar-top">
                <div className="navbar-inner">
                    {/* Left: Logo */}
                    <div className="navbar-logo-container">
                        <Link to="/" className="navbar-logo-link">
                            <img
                                src={logo}
                                alt="SreeMarket"
                                className="navbar-logo-image"
                                style={{ height: '50px', width: 'auto' }}
                            />
                        </Link>
                    </div>

                    {/* Center: Search Bar */}
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
                                {isSearching ? <Loader2 size={20} color="white" className="animate-spin" /> : <Search size={20} color="white" />}
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
                                            {product.media && product.media.length > 0 ? (
                                                <img
                                                    src={`${BACKEND_URL}/uploads/products/${product.media.find(m => m.isPrimary)?.fileName || product.media[0].fileName}`}
                                                    alt={product.name}
                                                />
                                            ) : (
                                                <div className="suggestion-image-placeholder"><Search size={14} /></div>
                                            )}
                                        </div>
                                        <div className="suggestion-info">
                                            <div className="suggestion-name">{product.name}</div>
                                            <div className="suggestion-category">{product.category}</div>
                                        </div>
                                        <div className="suggestion-price">
                                            ${product.discountPrice || product.regularPrice}
                                        </div>
                                    </div>
                                ))}
                                <div className="suggestion-all" onClick={handleSearchSubmit}>
                                    See all results for "{searchQuery}"
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right: Actions */}
                    <div className="navbar-actions-container">
                        <div className="navbar-delivery-info">
                            <span className="delivery-label">Delivery to</span>
                            <span className="delivery-country">🇮🇳 IN</span>
                        </div>

                        <div className="language-selector">
                            <button
                                className="navbar-action-btn"
                                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                            >
                                <span className="action-text">English</span>
                                <ChevronDown size={14} />
                            </button>

                            {isLangMenuOpen && (
                                <div className="dropdown-menu">
                                    {['EN', 'HI', 'FR'].map(lang => (
                                        <button
                                            key={lang}
                                            onClick={() => {
                                                setCurrentLanguage(lang);
                                                setIsLangMenuOpen(false);
                                            }}
                                            className={`dropdown-item ${currentLanguage === lang ? 'active' : ''}`}
                                        >
                                            {lang === 'EN' ? 'English' : lang === 'HI' ? 'Hindi' : 'French'}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="cart-container">
                            <button
                                className="navbar-action-btn"
                                onClick={toggleCart}
                            >
                                <ShoppingBag size={20} />
                                <span className="action-text">Cart</span>
                                {cartCount > 0 && (
                                    <span className="cart-badge">
                                        {cartCount}
                                    </span>
                                )}
                            </button>
                            <CartDropdown />
                        </div>

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
                    </div>
                </div>
            </div>

            {/* Bottom Row */}
            <div className="navbar-bottom">
                <div className="navbar-inner">
                    <div
                        className="navbar-categories-menu"
                        onMouseEnter={() => setIsCategoryMenuOpen(true)}
                        onMouseLeave={() => setIsCategoryMenuOpen(false)}
                    >
                        <button className="categories-menu-btn" onClick={() => setIsCategoryMenuOpen(!isCategoryMenuOpen)}>
                            <span className="hamburger-icon">≡</span> All Categories
                        </button>

                        {isCategoryMenuOpen && (
                            <div className="categories-dropdown-menu">
                                <Link to="/shop?category=grocery" className="category-dropdown-item">Grocery & Gourmet Food</Link>
                                <Link to="/shop?category=health" className="category-dropdown-item">Health & Household</Link>
                                <Link to="/shop?category=home" className="category-dropdown-item">Home & Kitchen</Link>
                                <Link to="/shop?category=beauty" className="category-dropdown-item">Beauty & Personal Care</Link>
                                <Link to="/shop?category=clothing" className="category-dropdown-item">Clothing, Shoes & Jewellery</Link>
                                <Link to="/shop?category=toys" className="category-dropdown-item">Toys & Games</Link>
                                <Link to="/shop?category=patio" className="category-dropdown-item">Patio, Lawn & Garden</Link>
                                <Link to="/shop?category=musical" className="category-dropdown-item">Musical Instruments</Link>
                            </div>
                        )}
                    </div>

                    <div className="navbar-main-links">
                        <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>Home</Link>
                        <Link to="/shop" className={`nav-link ${location.pathname === '/shop' ? 'active' : ''}`}>Shop</Link>
                        <Link to="/our-story" className={`nav-link ${location.pathname === '/our-story' ? 'active' : ''}`}>Our Story</Link>
                    </div>

                    <div className="navbar-wholesale-link">
                        <Link to="/wholesale" className="wholesale-action">
                            Go To Wholesale Page <ChevronRight size={16} />
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
