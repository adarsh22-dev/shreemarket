import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ShoppingBag, User, Globe, ChevronDown } from 'lucide-react';
import { useCart } from '../context/CartContext';
import CartDropdown from './CartDropdown';
import UserDropdown from './UserDropdown';
import Button from './ui/Button';

const Navbar = () => {
    const { cartCount, toggleCart, isCartOpen } = useCart();
    const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [currentLanguage, setCurrentLanguage] = useState('EN');
    const [user, setUser] = useState(null);

    React.useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    return (
        <nav style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1.5rem 4rem',
            backgroundColor: '#ffffff',
            position: 'sticky',
            top: 0,
            zIndex: 1000,
            borderBottom: '1px solid #f0f0f0'
        }}>
            {/* Left: Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{
                        width: '24px',
                        height: '24px',
                        backgroundColor: '#FF5722', // Orange color from logo
                        transform: 'rotate(45deg)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '4px'
                    }}>
                        <div style={{ width: '8px', height: '8px', backgroundColor: 'white', borderRadius: '50%' }}></div>
                    </div>
                    <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#333' }}>SreeMarket</span>
                    {/* <img src="/logo.png" alt="SreeMarket" style={{ height: '80px' }} /> */}
                </Link>
            </div>

            {/* Center: Navigation Links */}
            <div style={{ display: 'flex', gap: '2rem' }}>
                <Link to="/" style={{ textDecoration: 'none', color: '#555', fontWeight: '500', fontSize: '0.9rem' }}>HOME</Link>
                <Link to="/shop" style={{ textDecoration: 'none', color: '#555', fontWeight: '500', fontSize: '0.9rem' }}>SHOP</Link>
                <Link to="/impact" style={{ textDecoration: 'none', color: '#555', fontWeight: '500', fontSize: '0.9rem' }}>IMPACT</Link>
                <Link to="/our-story" style={{ textDecoration: 'none', color: '#555', fontWeight: '500', fontSize: '0.9rem' }}>OUR STORY</Link>
                <Link to="/journal" style={{ textDecoration: 'none', color: '#555', fontWeight: '500', fontSize: '0.9rem' }}>JOURNAL</Link>
            </div>

            {/* Right: Icons/Search */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ position: 'relative' }}>
                    <Search size={20} color="#555" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                        type="text"
                        placeholder="Search handcrafted goods..."
                        style={{
                            padding: '0.5rem 1rem 0.5rem 2.5rem',
                            borderRadius: '20px',
                            border: '1px solid #eee',
                            backgroundColor: '#f9f9f9',
                            fontSize: '0.85rem',
                            width: '240px',
                            outline: 'none'
                        }}
                    />
                </div>



                <div className="language-selector" style={{ position: 'relative' }}>
                    <button
                        onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', color: '#333' }}
                    >
                        <Globe size={20} />
                        <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>{currentLanguage}</span>
                        <ChevronDown size={14} />
                    </button>

                    {isLangMenuOpen && (
                        <div style={{
                            position: 'absolute',
                            top: '100%',
                            right: 0,
                            marginTop: '0.5rem',
                            backgroundColor: 'white',
                            border: '1px solid #eee',
                            borderRadius: '6px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            width: '120px',
                            zIndex: 1000
                        }}>
                            {['EN', 'HI', 'FR'].map(lang => (
                                <button
                                    key={lang}
                                    onClick={() => {
                                        setCurrentLanguage(lang);
                                        setIsLangMenuOpen(false);
                                    }}
                                    style={{
                                        display: 'block',
                                        width: '100%',
                                        padding: '0.5rem 1rem',
                                        textAlign: 'left',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: currentLanguage === lang ? '#FF5722' : '#333',
                                        fontWeight: currentLanguage === lang ? '600' : '400',
                                        fontSize: '0.85rem'
                                    }}
                                >
                                    {lang === 'EN' ? 'English' : lang === 'HI' ? 'Hindi' : 'French'}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="cart-container" style={{ position: 'relative', zIndex: isCartOpen ? 1002 : 'auto' }}>
                    <button
                        onClick={toggleCart}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: 0,
                            color: '#333',
                            position: 'relative'
                        }}
                    >
                        <ShoppingBag size={20} />
                        {cartCount > 0 && (
                            <span style={{
                                position: 'absolute',
                                top: '-5px',
                                right: '-5px',
                                backgroundColor: '#FF5722',
                                color: 'white',
                                fontSize: '0.7rem',
                                fontWeight: '700',
                                width: '18px',
                                height: '18px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '2px solid white'
                            }}>
                                {cartCount}
                            </span>
                        )}
                    </button>
                    <CartDropdown />
                </div>
                <div style={{ position: 'relative' }}>
                    <button
                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#333', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <User size={20} />
                        {user && <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>{user.fullName}</span>}
                    </button>
                    <UserDropdown
                        isOpen={isUserMenuOpen}
                        onClose={() => setIsUserMenuOpen(false)}
                    />
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
