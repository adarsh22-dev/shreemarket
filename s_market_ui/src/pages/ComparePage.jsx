import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useCompare } from '../context/CompareContext';
import { X, ShoppingBag, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { BACKEND_URL, getPrimaryGalleryImage, PLACEHOLDER_IMG } from '../api/api';
import './ComparePage.css';

const ITEMS_PER_VIEW = 4;

const ComparePage = () => {
    const { compareItems, removeFromCompare, clearCompare } = useCompare();
    const [scrollIndex, setScrollIndex] = useState(0);

    if (compareItems.length === 0) {
        return (
            <div className="compare-page-wrapper">
                <Navbar />
                <div className="compare-empty">
                    <h2>No Products to Compare</h2>
                    <p>Add products to compare by clicking the compare icon on product cards.</p>
                    <Link to="/shop" className="compare-shop-btn">
                        <ArrowLeft size={18} /> Browse Products
                    </Link>
                </div>
                <Footer />
            </div>
        );
    }

    const canScrollLeft = scrollIndex > 0;
    const canScrollRight = scrollIndex + ITEMS_PER_VIEW < compareItems.length;
    const visibleItems = compareItems.slice(scrollIndex, scrollIndex + ITEMS_PER_VIEW);

    const scrollLeft = () => {
        if (canScrollLeft) setScrollIndex(prev => Math.max(0, prev - 1));
    };

    const scrollRight = () => {
        if (canScrollRight) setScrollIndex(prev => Math.min(compareItems.length - ITEMS_PER_VIEW, prev + 1));
    };

    return (
        <div className="compare-page-wrapper">
            <Navbar />
            <div className="compare-container">
                <div className="compare-header">
                    <h1>Compare Products ({compareItems.length})</h1>
                    <div className="compare-nav-controls">
                        {compareItems.length > ITEMS_PER_VIEW && (
                            <div className="compare-slider-nav">
                                <button className="compare-nav-btn" onClick={scrollLeft} disabled={!canScrollLeft}>
                                    <ChevronLeft size={18} />
                                </button>
                                <span className="compare-nav-info">{scrollIndex + 1}-{Math.min(scrollIndex + ITEMS_PER_VIEW, compareItems.length)} of {compareItems.length}</span>
                                <button className="compare-nav-btn" onClick={scrollRight} disabled={!canScrollRight}>
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        )}
                        <button className="clear-compare-btn" onClick={clearCompare}>Clear All</button>
                    </div>
                </div>
                <div className="compare-table-wrapper">
                    <table className="compare-table">
                        <thead>
                            <tr>
                                <th className="compare-label-col">Product</th>
                                {visibleItems.map(item => (
                                    <th key={item.id} className="compare-product-col">
                                        <button className="remove-compare-btn" onClick={() => removeFromCompare(item.id)}>
                                            <X size={16} />
                                        </button>
                                        <Link to={`/product/${item.id}`}>
                                            <div className="compare-product-img">
                                                <img
                                                    src={getPrimaryGalleryImage(item) || PLACEHOLDER_IMG}
                                                    alt={item.name}
                                                />
                                            </div>
                                            <h3 className="compare-product-name">{item.name}</h3>
                                        </Link>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="compare-label">Price</td>
                                {visibleItems.map(item => (
                                    <td key={item.id} className="compare-value">
                                        <span className="compare-price">₹{(item.discountPrice || item.regularPrice || 0).toFixed(2)}</span>
                                        {item.discountPrice && item.regularPrice > item.discountPrice && (
                                            <span className="compare-original-price">₹{item.regularPrice.toFixed(2)}</span>
                                        )}
                                    </td>
                                ))}
                            </tr>
                            <tr>
                                <td className="compare-label">Category</td>
                                {visibleItems.map(item => (
                                    <td key={item.id} className="compare-value">{item.category || 'N/A'}</td>
                                ))}
                            </tr>
                            <tr>
                                <td className="compare-label">Brand</td>
                                {visibleItems.map(item => (
                                    <td key={item.id} className="compare-value">{item.brand || 'N/A'}</td>
                                ))}
                            </tr>
                            <tr>
                                <td className="compare-label">Rating</td>
                                {visibleItems.map(item => (
                                    <td key={item.id} className="compare-value">
                                        <span className="compare-rating">
                                            {'★'.repeat(Math.round(item.averageRating || 0))}{'☆'.repeat(5 - Math.round(item.averageRating || 0))}
                                            <span className="rating-num">({(item.averageRating || 0).toFixed(1)})</span>
                                        </span>
                                    </td>
                                ))}
                            </tr>
                            <tr>
                                <td className="compare-label">Description</td>
                                {visibleItems.map(item => (
                                    <td key={item.id} className="compare-value compare-desc">
                                        {item.shortDescription || item.description?.substring(0, 100) || 'N/A'}
                                    </td>
                                ))}
                            </tr>
                            <tr>
                                <td className="compare-label">Vendor</td>
                                {visibleItems.map(item => (
                                    <td key={item.id} className="compare-value">
                                        {item.vendor?.storeName || 'SreeMarket'}
                                    </td>
                                ))}
                            </tr>
                            <tr>
                                <td className="compare-label">Action</td>
                                {visibleItems.map(item => (
                                    <td key={item.id} className="compare-value">
                                        <Link to={`/product/${item.id}`} className="compare-view-btn">
                                            <ShoppingBag size={14} /> View Product
                                        </Link>
                                    </td>
                                ))}
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default ComparePage;
