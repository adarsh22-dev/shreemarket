import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Search, ChevronDown, Leaf, HeartHandshake, Package } from 'lucide-react';
import './OrdersPage.css';
import { fetchUserOrders, createMockOrder } from '../api/api';
import toast from 'react-hot-toast';

const OrdersPage = () => {
    const [activeTab, setActiveTab] = useState('All Orders');
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState(null);

    const tabs = ['All Orders', 'Processing', 'Shipped', 'Delivered'];

    useEffect(() => {
        window.scrollTo(0, 0);
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUserId(parsedUser.userId);
            loadOrders(parsedUser.userId);
        } else {
            setLoading(false);
            // Optionally redirect to login here
        }
    }, []);

    const loadOrders = async (id) => {
        setLoading(true);
        try {
            const data = await fetchUserOrders(id);
            setOrders(data);
        } catch (error) {
            console.error("Failed to load orders:", error);
            toast.error("Failed to load your orders");
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateMocks = async () => {
        if (!userId) return;
        const toastId = toast.loading("Generating mock orders...");
        try {
            await createMockOrder(userId);
            toast.success("Mock orders generated!", { id: toastId });
            await loadOrders(userId); // Refresh the list
        } catch (error) {
            toast.error("Failed to generate orders", { id: toastId });
        }
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'Unknown Date';
        const date = new Date(timestamp);
        const today = new Date();

        // Check if today
        if (date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear()) {
            return 'Today';
        }

        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Filter orders based on active tab
    const filteredOrders = orders.filter(order => {
        if (activeTab === 'All Orders') return true;
        return order.status.toUpperCase() === activeTab.toUpperCase();
    });

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
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>Loading orders...</div>
                    ) : filteredOrders.length > 0 ? (
                        filteredOrders.map((order) => {
                            // Define actions dynamically based on status
                            const actions = [];
                            actions.push({ label: 'View Details', type: 'secondary' });
                            if (order.status === 'DELIVERED') actions.push({ label: 'Order Again', type: 'primary' });
                            if (order.status === 'SHIPPED') actions.push({ label: 'Track Order', type: 'dark' });

                            return (
                                <div key={order.id} className="order-card">
                                    <div className="order-card-header">
                                        <div className="order-meta">
                                            <div className="meta-group">
                                                <span className="meta-label">ORDER NUMBER</span>
                                                <span className="meta-value black-heavy">{order.orderNumber}</span>
                                            </div>
                                            <div className="meta-group">
                                                <span className="meta-label">DATE PLACED</span>
                                                <span className="meta-value black-heavy">{formatDate(order.datePlaced)}</span>
                                            </div>
                                            <div className="meta-group">
                                                <span className="meta-label">TOTAL AMOUNT</span>
                                                <span className="meta-value brand-color">₹{(order.totalAmount || 0).toFixed(2)}</span>
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
                                            {(order.images || []).map((img, index) => (
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
                                        {order.impactNote && (
                                            <div className="order-impact-note">
                                                <div className="impact-note-icon">
                                                    <HeartHandshake size={iconSize} color="#d32f2f" />
                                                </div>
                                                <div className="impact-note-content">
                                                    <span className="impact-note-brand">Impact Note:</span> {order.impactNote}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="order-card-actions">
                                        {actions.map((action, index) => (
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
                            );
                        })
                    ) : (
                        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'white', borderRadius: '12px', border: '1px solid #ebebeb' }}>
                            <Package size={48} color="#ccc" style={{ marginBottom: '1rem' }} />
                            <h3>No Orders Found</h3>
                            <p style={{ color: '#666', marginBottom: '2rem' }}>You haven't placed any orders yet, or they don't match this filter.</p>
                            {activeTab === 'All Orders' && userId && (
                                <button
                                    className="btn-order-action dark"
                                    onClick={handleGenerateMocks}
                                >
                                    Generate Mock Orders
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {!loading && filteredOrders.length > 0 && (
                    <div className="load-more-container">
                        <button className="btn-load-more">Load older orders <ChevronDown size={14} /></button>
                    </div>
                )}
            </div>

            <Footer />
        </div>
    );
};

// Extracted purely for scoping reasons.
const iconSize = 18;

export default OrdersPage;
