import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { ChevronDown, SlidersHorizontal, LayoutGrid, List, X, Loader } from 'lucide-react';
import './ProductListingPage.css';

const ProductListingPage = () => {
    const { category } = useParams();
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('grid');
    const [sortBy, setSortBy] = useState('newest');

    // Mock category data - in a real app this would come from an API
    const categoryData = {
        'living-room': {
            title: 'Living Room Furniture',
            description: 'Transform your space with our curated collection of minimalist essentials, designed for comfort and modern aesthetics.',
            totalItems: 124,
            products: [
                {
                    id: 1,
                    name: 'Nordic Lounge Chair',
                    price: 499,
                    originalPrice: 499,
                    image: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?q=80&w=800&auto=format&fit=crop',
                    tag: 'BESTSELLER',
                    rating: 4.8,
                    reviews: 48,
                    description: 'Sustainable Oak, Gray Linen'
                },
                {
                    id: 2,
                    name: 'Modulo Modular Sofa',
                    price: 1299,
                    originalPrice: 1299,
                    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=800&auto=format&fit=crop',
                    tag: '',
                    rating: 4.9,
                    reviews: 124,
                    description: '3-Seater, Charcoal Weave'
                },
                {
                    id: 3,
                    name: 'Eclipse Coffee Table',
                    price: 380,
                    originalPrice: 450,
                    image: 'https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?q=80&w=800&auto=format&fit=crop',
                    tag: '-15% OFF',
                    rating: 4.7,
                    reviews: 32,
                    description: 'Black Marble & Steel'
                },
                {
                    id: 4,
                    name: 'Arches Side Table',
                    price: 195,
                    originalPrice: 195,
                    image: 'https://images.unsplash.com/photo-1618220179428-22790b461013?q=80&w=800&auto=format&fit=crop', // Reusing hero image for demo purposes
                    tag: '',
                    rating: 4.6,
                    reviews: 19,
                    description: 'Natural Ash Wood'
                },
                {
                    id: 5,
                    name: 'Velvet Pouf Ottoman',
                    price: 145,
                    originalPrice: 145,
                    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=800&auto=format&fit=crop',
                    tag: '',
                    rating: 4.5,
                    reviews: 87,
                    description: 'Emerald Velvet, Gold Base'
                },
                {
                    id: 6,
                    name: 'Solis Media Console',
                    price: 850,
                    originalPrice: 850,
                    image: 'https://images.unsplash.com/photo-1601760562234-9814eea66632?q=80&w=800&auto=format&fit=crop',
                    tag: '',
                    rating: 4.8,
                    reviews: 26,
                    description: 'Walnut Wood, Brass Detail'
                },
                {
                    id: 7,
                    name: 'Bloom Accent Chair',
                    price: 560,
                    originalPrice: 560,
                    image: 'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?q=80&w=800&auto=format&fit=crop',
                    tag: '',
                    rating: 4.9,
                    reviews: 53,
                    description: 'Mustard Tweed, Oak Legs'
                },
                {
                    id: 8,
                    name: 'Horizon Linear Sofa',
                    price: 1550,
                    originalPrice: 1550,
                    image: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?q=80&w=800&auto=format&fit=crop',
                    tag: 'NEW COLLECTION',
                    rating: 5.0,
                    reviews: 12,
                    description: 'Sky Blue Wool Mix'
                },
            ]
        },
        // Fallback or generic data for other categories
        'default': {
            title: category ? category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Collection',
            description: 'Explore our latest arrivals featuring sustainable materials and artisan craftsmanship.',
            totalItems: 42,
            products: Array(8).fill(null).map((_, i) => ({
                id: i + 1,
                name: `Artisan Product ${i + 1}`,
                price: 120 + (i * 20),
                originalPrice: 120 + (i * 20),
                image: `https://source.unsplash.com/random/800x800?furniture&sig=${i}`,
                tag: i === 0 ? 'BESTSELLER' : '',
                rating: 4.5,
                reviews: 10 + i,
                description: 'Handcrafted with care'
            }))
        }
    };

    const currentData = categoryData[category] || categoryData['default'];

    useEffect(() => {
        // Simulate loading
        window.scrollTo(0, 0);
        setLoading(true);
        setTimeout(() => setLoading(false), 800);
    }, [category]);

    if (loading) {
        return (
            <div className="loading-screen">
                <Navbar />
                <div style={{ height: '60vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <Loader size={48} className="spinner" />
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="product-listing-page">
            <Navbar />

            <div className="listing-container">
                {/* Breadcrumbs */}
                <div className="breadcrumbs">
                    <Link to="/">HOME</Link>  &gt;
                    <span className="current-crumb">{category ? category.toUpperCase().replace(/-/g, ' ') : 'SHOP'}</span>
                </div>

                {/* Header */}
                <header className="listing-header">
                    <div>
                        <div className="breadcrumb-small">HOME &gt; SHOP &gt; <span style={{ color: '#FF5722' }}>{category ? category.toUpperCase().replace(/-/g, ' ') : ''}</span></div>
                        <h1 className="category-title">{currentData.title}</h1>
                        <p className="category-description">{currentData.description}</p>
                    </div>
                    <div className="item-count">{currentData.totalItems} items found</div>
                </header>

                {/* Toolbar */}
                <div className="listing-toolbar">
                    <div className="filter-groups">
                        <button className="filter-dropdown">Price Range <ChevronDown size={14} /></button>
                        <button className="filter-dropdown">Material <ChevronDown size={14} /></button>
                        <button className="filter-dropdown">Color <ChevronDown size={14} /></button>

                        {/* Active Filters Demo */}
                        <div className="active-filter-tag">Sofas <X size={12} /></div>
                        <div className="active-filter-tag">Modern <X size={12} /></div>
                    </div>

                    <div className="toolbar-actions">
                        <div className="sort-dropdown">
                            <span>Sort by: </span>
                            <span className="sort-value">Newest Arrivals</span>
                            {/* In a real app, this would be a select or dropdown */}
                        </div>
                        {/* <div className="view-toggles">
                            <button
                                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                                onClick={() => setViewMode('grid')}
                            >
                                <LayoutGrid size={18} />
                            </button>
                            <button
                                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                                onClick={() => setViewMode('list')}
                            >
                                <List size={18} />
                            </button>
                        </div> */}
                    </div>
                </div>

                {/* Product Grid */}
                <div className={`product-grid ${viewMode}`}>
                    {currentData.products.map(product => (
                        <div key={product.id} className="listing-product-card">
                            <div className="lp-image-wrapper">
                                {product.tag && (
                                    <span className={`lp-tag ${product.tag.includes('OFF') ? 'sale' : product.tag === 'NEW COLLECTION' ? 'new' : ''}`}>
                                        {product.tag}
                                    </span>
                                )}
                                <img src={product.image} alt={product.name} />
                            </div>
                            <div className="lp-details">
                                <div className="lp-header">
                                    <h3 className="lp-name">{product.name}</h3>
                                    <div className="lp-price">
                                        {product.price < product.originalPrice && (
                                            <span className="lp-original-price">${product.originalPrice}</span>
                                        )}
                                        <span className={`lp-current-price ${product.price < product.originalPrice ? 'sale-price' : ''}`}>
                                            ${product.price}
                                        </span>
                                    </div>
                                </div>
                                <p className="lp-desc">{product.description}</p>
                                <div className="lp-rating">
                                    {[...Array(5)].map((_, i) => (
                                        <span key={i} style={{ color: i < Math.floor(product.rating) ? '#FF5722' : '#ddd' }}>★</span>
                                    ))}
                                    <span className="lp-review-count">({product.reviews} REVIEWS)</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Load More */}
                <div className="load-more-container">
                    <div className="load-progress">
                        <div className="progress-bar">
                            <div className="progress-fill" style={{ width: '25%' }}></div>
                        </div>
                        <p>SHOWING {currentData.products.length} OF {currentData.totalItems} ITEMS</p>
                    </div>
                    <button className="load-more-btn">LOAD MORE PRODUCTS</button>
                </div>

            </div>
            <Footer />
        </div>
    );
};

export default ProductListingPage;
