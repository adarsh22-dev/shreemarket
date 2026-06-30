'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogIn, LogOut, Settings, ShoppingBag, X, Package } from 'lucide-react';
import './UserDropdown.css';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';

const UserDropdown = ({ isOpen, onClose }) => {
    const dropdownRef = useRef(null);
    const router = useRouter();
    const { cartCount, toggleCart } = useCart();
    const { user, logout } = useAuth();

    // Handle clicking outside to close
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleNavigation = (path) => {
        onClose();
        router.push(path);
    };

    const handleCartClick = () => {
        onClose();
        router.push('/cart');
    };

    const handleLogout = () => {
        if (logout) {
            logout();
        }
        onClose();
        router.push('/login');
    };

    return (
        <div className="user-dropdown-menu" ref={dropdownRef}>
            <div className="user-dropdown-content">
                {user ? (
                    <>
                        <button className="user-dropdown-item" onClick={handleCartClick}>
                            <ShoppingBag size={18} />
                            <div className="user-dropdown-cart-label">
                                <span>Cart</span>
                                {cartCount > 0 && <span className="user-dropdown-badge">{cartCount}</span>}
                            </div>
                        </button>
                        <button className="user-dropdown-item" onClick={() => handleNavigation('/orders')}>
                            <Package size={18} />
                            <span>Orders</span>
                        </button>
                        <button className="user-dropdown-item" onClick={() => handleNavigation('/settings')}>
                            <Settings size={18} />
                            <span>Settings</span>
                        </button>
                        <div className="user-dropdown-divider"></div>
                        <button className="user-dropdown-item" onClick={handleLogout} style={{ color: 'var(--status-rejected)' }}>
                            <LogOut size={18} />
                            <span>Logout</span>
                        </button>
                    </>
                ) : (
                    <>
                        <button className="user-dropdown-item" onClick={() => handleNavigation('/login')}>
                            <LogIn size={18} />
                            <span>Login</span>
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default UserDropdown;
