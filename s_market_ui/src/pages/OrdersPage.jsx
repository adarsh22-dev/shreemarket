import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Search, ChevronDown, Leaf, HeartHandshake, Package } from 'lucide-react';
import './OrdersPage.css';

const OrdersPage = () => {
    const [activeTab, setActiveTab] = useState('All Orders');

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const tabs = ['All Orders', 'Processing', 'Shipped', 'Delivered'];

    // Mock data based on the screenshot
    const orders = [
        {
            id: '#EH-92834-22',
            date: 'Oct 24, 2023',
            total: '$184.50',
            status: 'DELIVERED',
            images: [
                'https://images.unsplash.com/photo-1578500494198-246f612d3b3d?auto=format&fit=crop&q=80&w=150',
                'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&q=80&w=150'
            ],
            additionalItems: 1,
            impactIcon: <HeartHandshake size={iconSize} color="#d32f2f" />,
            impactNote: 'This purchase provided 3 days of fair wages for a weaving cooperative in Cusco, Peru, supporting education for 5 local children.',
            actions: [
                { label: 'View Details', type: 'secondary' },
                { label: 'Order Again', type: 'primary' }
            ]
        },
        {
            id: '#EH-94551-09',
            date: 'Jan 12, 2024',
            total: '$65.00',
            status: 'SHIPPED',
            images: [
                'https://images.unsplash.com/photo-1596646549248-6a56f082e6d9?auto=format&fit=crop&q=80&w=150'
            ],
            additionalItems: 0,
            impactIcon: <HeartHandshake size={iconSize} color="#d32f2f" />,
            impactNote: 'Your support funded healthcare workshops for a community of basket weavers in rural Vietnam.',
            actions: [
                { label: 'View Details', type: 'secondary' },
                { label: 'Track Order', type: 'dark' }
            ]
        },
        {
            id: '#EH-95210-88',
            date: 'Today',
            total: '$320.75',
            status: 'PROCESSING',
            images: [
                'https://images.unsplash.com/photo-1601369342730-80410ff1a92a?auto=format&fit=crop&q=80&w=150',
                'https://images.unsplash.com/photo-1592078615290-033ee584e267?auto=format&fit=crop&q=80&w=150'
            ],
            additionalItems: 0,
            impactIcon: <HeartHandshake size={iconSize} color="#d32f2f" />,
            impactNote: 'This high-impact purchase is contributing to a micro-loan fund for 12 new women-led startups in the artisan sector.',
            actions: [
                { label: 'View Details', type: 'secondary' }
            ]
        }
    ];

    return (
        <div className="orders-page-wrapper">
            <Navbar />

            <div className="orders-container">
                <div className="orders-header">
                    <div>
                        <h1>Your Orders</h1>
                        <p>Track your impact and manage your conscious purchases.</p>
                    </div>

                </div>

                <div className="orders-filters-container">
                    <div className="orders-tabs">
                        {tabs.map((tab) => (
                            <button
                                key={tab}
                                className={`orders-tab ${activeTab === tab ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab)}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                    <div className="orders-controls">
                        <div className="search-input-wrapper">
                            <Search size={16} color="#999" />
                            <input type="text" placeholder="Search order ID or product..." />
                        </div>
                        <div className="date-dropdown">
                            <span>Last 3 months</span>
                            <ChevronDown size={14} />
                        </div>
                    </div>
                </div>

                <div className="orders-list">
                    {orders.map((order) => (
                        <div key={order.id} className="order-card">
                            <div className="order-card-header">
                                <div className="order-meta">
                                    <div className="meta-group">
                                        <span className="meta-label">ORDER NUMBER</span>
                                        <span className="meta-value black-heavy">{order.id}</span>
                                    </div>
                                    <div className="meta-group">
                                        <span className="meta-label">DATE PLACED</span>
                                        <span className="meta-value black-heavy">{order.date}</span>
                                    </div>
                                    <div className="meta-group">
                                        <span className="meta-label">TOTAL AMOUNT</span>
                                        <span className="meta-value brand-color">{order.total}</span>
                                    </div>
                                </div>
                                <div className="order-status-container">
                                    <div className={`status-pill ${order.status.toLowerCase()}`}>
                                        {order.status === 'DELIVERED' && <div className="status-dot green"></div>}
                                        {order.status === 'SHIPPED' && <Package size={12} />}
                                        {order.status === 'PROCESSING' && <div className="status-dot orange"></div>}
                                        {order.status}
                                    </div>
                                </div>
                            </div>

                            <div className="order-card-body">
                                <div className="order-products-preview">
                                    {order.images.map((img, index) => (
                                        <div key={index} className="product-thumbnail">
                                            <img src={img} alt="Product Thumbnail" />
                                        </div>
                                    ))}
                                    {order.additionalItems > 0 && (
                                        <div className="product-thumbnail additional-items-indicator">
                                            +{order.additionalItems}
                                        </div>
                                    )}
                                </div>
                                <div className="order-impact-note">
                                    <div className="impact-note-icon">
                                        {order.impactIcon}
                                    </div>
                                    <div className="impact-note-content">
                                        <span className="impact-note-brand">Impact Note:</span> {order.impactNote}
                                    </div>
                                </div>
                            </div>

                            <div className="order-card-actions">
                                {order.actions.map((action, index) => (
                                    <button
                                        key={index}
                                        className={`btn-order-action ${action.type}`}
                                    >
                                        {action.label === 'Order Again' && <span className="action-icon">↺</span>}
                                        {action.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="load-more-container">
                    <button className="btn-load-more">Load older orders <ChevronDown size={14} /></button>
                </div>
            </div>

            <Footer />
        </div>
    );
};

// Extracted purely for scoping reasons.
const iconSize = 18;

export default OrdersPage;
