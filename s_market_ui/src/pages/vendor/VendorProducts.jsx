import React from 'react';
import {
    Search,
    Plus,
    ChevronDown,
    Filter,
    Trash2,
    RefreshCw,
    Edit2,
    Copy,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import VendorLayout from '../../components/vendor/VendorLayout';
import './VendorProducts.css';

const VendorProducts = () => {
    const navigate = useNavigate();

    // Sample data matching screenshot
    const products = [
        {
            id: 1,
            name: 'EcoRay Monocrystalline Panel',
            desc: '400W High Efficiency',
            sku: 'EH-SP-400-X',
            category: 'Solar Panels',
            price: '₹299.00',
            stock: 42,
            status: 'in',
            image: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=100&q=80'
        },
        {
            id: 2,
            name: 'PowerSafe Home Battery',
            desc: '10kWh Li-ion Storage',
            sku: 'EH-BAT-10K',
            category: 'Home Battery',
            price: '₹4,500.00',
            stock: 3,
            status: 'low',
            image: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=100&q=80'
        },
        {
            id: 3,
            name: 'SmartTemp Pro Hub',
            desc: 'AI Climate Controller',
            sku: 'EH-THM-ST-1',
            category: 'Smart Home',
            price: '₹189.00',
            stock: 0,
            status: 'out',
            image: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=100&q=80'
        },
        {
            id: 4,
            name: 'SolarTile Premium',
            desc: 'Textured Black Series',
            sku: 'EH-TILE-BLK',
            category: 'Solar Roofing',
            price: '₹15.50 / unit',
            stock: 125,
            status: 'in',
            image: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=100&q=80'
        },
        {
            id: 5,
            name: 'EH-Bridge Pro',
            desc: 'Monitoring Gateway',
            sku: 'EH-GTW-B1',
            category: 'Smart Home',
            price: '₹99.00',
            stock: 15,
            status: 'in',
            image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=100&q=80'
        }
    ];

    const getStockBadgeClass = (status) => {
        switch (status) {
            case 'in': return 'stock-in';
            case 'low': return 'stock-low';
            case 'out': return 'stock-out';
            default: return 'stock-in';
        }
    };

    const getStockText = (status, qty) => {
        switch (status) {
            case 'in': return `In Stock (${qty})`;
            case 'low': return `Low Stock (${qty})`;
            case 'out': return `Out of Stock (${qty})`;
            default: return `In Stock (${qty})`;
        }
    };

    return (
        <VendorLayout>
            <div className="vendor-products-container">
                {/* Header Actions */}
                <div className="products-header-row">
                    <div>
                        <h1>Product Management</h1>
                        <p>Manage your inventory, stock levels, and product details.</p>
                    </div>
                    <button className="btn-add-product" onClick={() => navigate('/vendor/products/add')}>
                        <Plus size={18} />
                        Add New Product
                    </button>
                </div>

                {/* Filter Bar */}
                <div className="filter-bar">
                    <div className="search-input-wrapper">
                        <Search size={18} color="#888" />
                        <input type="text" placeholder="Search products by name or SKU..." />
                    </div>
                    <button className="filter-dropdown">
                        All Categories <ChevronDown size={16} color="#666" />
                    </button>
                    <button className="filter-dropdown">
                        All Status <ChevronDown size={16} color="#666" />
                    </button>
                    <button className="btn-more-filters">
                        <Filter size={16} /> More Filters
                    </button>
                </div>

                {/* Bulk Actions */}
                <div className="bulk-actions-bar">
                    <div className="bulk-actions-left">
                        <label className="select-all-wrapper">
                            <input type="checkbox" className="checkbox-custom" />
                            <span style={{ fontStyle: 'italic', color: '#888' }}>Select All</span>
                        </label>
                        <button className="action-text-btn">
                            <Trash2 size={16} /> Delete Selected
                        </button>
                        <button className="action-text-btn">
                            <RefreshCw size={16} /> Change Status
                        </button>
                    </div>
                    <div className="showing-text">
                        Showing 1-5 of 42 products
                    </div>
                </div>

                {/* Data Table Area */}
                <div className="products-table-wrapper">
                    <table className="products-data-table">
                        <thead>
                            <tr>
                                <th style={{ width: '40px' }}></th> {/* Checkbox column */}
                                <th>PRODUCT INFO</th>
                                <th>SKU</th>
                                <th>CATEGORY</th>
                                <th>PRICE</th>
                                <th>STOCK STATUS</th>
                                <th style={{ textAlign: 'right' }}>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((product) => (
                                <tr key={product.id}>
                                    <td>
                                        <input type="checkbox" className="checkbox-custom" />
                                    </td>
                                    <td>
                                        <div className="product-info-cell">
                                            <img src={product.image} alt={product.name} className="product-image" />
                                            <div className="product-details">
                                                <div className="product-name">{product.name}</div>
                                                <div className="product-desc">{product.desc}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="sku-text">{product.sku}</div>
                                    </td>
                                    <td>
                                        <span className="category-badge">{product.category}</span>
                                    </td>
                                    <td>
                                        <div className="price-text">{product.price}</div>
                                    </td>
                                    <td>
                                        <span className={`stock-badge ${getStockBadgeClass(product.status)}`}>
                                            {getStockText(product.status, product.stock)}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="row-actions">
                                            <button className="row-action-btn"><Edit2 size={16} /></button>
                                            <button className="row-action-btn"><Copy size={16} /></button>
                                            <button className="row-action-btn"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    <div className="pagination-row">
                        <div className="pagination-text">
                            Showing <span style={{ fontWeight: 700, color: '#111' }}>1</span> to <span style={{ fontWeight: 700, color: '#111' }}>5</span> of <span style={{ fontWeight: 700, color: '#111' }}>42</span> results
                        </div>
                        <div className="pagination-controls">
                            <button className="page-btn" disabled><ChevronLeft size={16} /></button>
                            <button className="page-btn active">1</button>
                            <button className="page-btn">2</button>
                            <button className="page-btn">3</button>
                            <span className="page-dots">...</span>
                            <button className="page-btn">9</button>
                            <button className="page-btn"><ChevronRight size={16} /></button>
                        </div>
                    </div>
                </div>

            </div>
        </VendorLayout>
    );
};

export default VendorProducts;
