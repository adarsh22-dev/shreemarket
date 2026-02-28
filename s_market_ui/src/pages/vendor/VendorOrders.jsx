import React from 'react';
import {
    Download,
    Plus,
    Search,
    Calendar,
    Eye,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import VendorLayout from '../../components/vendor/VendorLayout';
import './VendorOrders.css';

const VendorOrders = () => {
    const orders = [
        {
            id: '#ORD-9021',
            customer: 'Sarah Jenkins',
            date: 'Oct 24,\n2023',
            amount: '₹124.50',
            location: 'Warehouse A',
            delivery: 'Oct 26,\n10:00 AM',
            status: 'Pending'
        },
        {
            id: '#ORD-9018',
            customer: 'Michael Chen',
            date: 'Oct 23,\n2023',
            amount: '₹89.00',
            location: 'Local Hub',
            delivery: 'Oct 24,\n02:30 PM',
            status: 'Shipped'
        },
        {
            id: '#ORD-9015',
            customer: 'Elena Rodriguez',
            date: 'Oct 22,\n2023',
            amount: '₹210.20',
            location: 'Sorting Facility',
            delivery: 'Oct 25,\n11:15 AM',
            status: 'Processing'
        },
        {
            id: '#ORD-9012',
            customer: 'David Smith',
            date: 'Oct 22,\n2023',
            amount: '₹45.15',
            location: 'Delivered',
            delivery: 'Oct 23,\n09:45 AM',
            status: 'Delivered'
        },
        {
            id: '#ORD-9009',
            customer: 'Jessica Wu',
            date: 'Oct 21,\n2023',
            amount: '₹156.00',
            location: 'Warehouse B',
            delivery: 'Oct 24,\n04:00 PM',
            status: 'Pending'
        }
    ];

    const getStatusClass = (status) => {
        switch (status.toLowerCase()) {
            case 'pending': return 'status-pending';
            case 'shipped': return 'status-shipped';
            case 'processing': return 'status-processing';
            case 'delivered': return 'status-delivered';
            default: return '';
        }
    };

    return (
        <VendorLayout>
            <div className="vendor-orders-container">
                {/* Header Section */}
                <div className="orders-header-row">
                    <div>
                        <h1>Order Management</h1>
                        <p>Track and fulfill your customer orders efficiently</p>
                    </div>
                    <div className="header-actions">
                        <button className="btn-export">
                            <Download size={18} />
                            Export Orders
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="orders-content-area">
                    {/* Control Bar */}
                    <div className="orders-control-bar">
                        <div className="order-tabs">
                            <button className="tab-btn active">All Orders</button>
                            <button className="tab-btn">Pending</button>
                            <button className="tab-btn">Processing</button>
                            <button className="tab-btn">Shipped</button>
                        </div>
                        <div className="search-wrapper">
                            <Search className="search-icon" size={18} />
                            <input type="text" placeholder="Search by Order ID or customer name..." />
                        </div>
                    </div>

                    {/* Data Table */}
                    <div className="orders-table-container">
                        <table className="orders-data-table">
                            <thead>
                                <tr>
                                    <th>ORDER ID</th>
                                    <th>CUSTOMER NAME</th>
                                    <th>DATE</th>
                                    <th>TOTAL AMOUNT</th>
                                    <th>CURRENT LOCATION</th>
                                    <th>ESTIMATED DELIVERY</th>
                                    <th>FULFILLMENT STATUS</th>
                                    <th>ACTIONS</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((order, index) => (
                                    <tr key={index}>
                                        <td className="order-id">{order.id}</td>
                                        <td className="customer-name">{order.customer}</td>
                                        <td className="date-cell">
                                            {order.date.split('\n').map((line, i) => (
                                                <div key={i}>{line}</div>
                                            ))}
                                        </td>
                                        <td className="total-amount">{order.amount}</td>
                                        <td className="location-cell">{order.location}</td>
                                        <td className="delivery-cell">
                                            {order.delivery.split('\n').map((line, i) => (
                                                <div key={i}>{line}</div>
                                            ))}
                                        </td>
                                        <td>
                                            <span className={`status-badge ${getStatusClass(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="order-actions">
                                                <button className="icon-action-btn" title="Schedule">
                                                    <Calendar size={18} />
                                                </button>
                                                <button className="icon-action-btn" title="View Details">
                                                    <Eye size={18} />
                                                </button>
                                                <button className="btn-mark-shipped">
                                                    Mark as Shipped
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Pagination Footer */}
                        <div className="orders-pagination-footer">
                            <div className="pagination-text">
                                Showing 1 to 5 of 248 orders
                            </div>
                            <div className="pagination-controls">
                                <button className="page-btn"><ChevronLeft size={16} color="#f0f0f0" /></button>
                                <button className="page-btn active">1</button>
                                <button className="page-btn">2</button>
                                <button className="page-btn">3</button>
                                <button className="page-btn"><ChevronRight size={16} /></button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </VendorLayout>
    );
};

export default VendorOrders;
