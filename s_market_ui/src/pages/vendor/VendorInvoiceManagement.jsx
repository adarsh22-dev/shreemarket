import React, { useState, useEffect } from 'react';
import {
    Download,
    FileText,
    Search,
    Loader2,
    CheckCircle,
    Clock,
    Truck,
    RotateCcw
} from 'lucide-react';
import VendorLayout from '../../components/vendor/VendorLayout';
import './VendorInvoiceManagement.css';
import { getVendorInvoices, downloadVendorInvoice } from '../../api/api';

const VendorInvoiceManagement = () => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchInvoices = async () => {
        try {
            setLoading(true);
            const data = await getVendorInvoices();
            setInvoices(data || []);
        } catch (error) {
            console.error("Failed to fetch invoices:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvoices();
    }, []);

    const filteredInvoices = invoices.filter(inv => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            (inv.orderNumber || '').toLowerCase().includes(q) ||
            (inv.customerName || '').toLowerCase().includes(q)
        );
    });

    const formatDate = (epoch) => {
        if (!epoch) return 'N/A';
        const date = new Date(epoch);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const getStatusIcon = (status) => {
        if (!status) return <Clock size={16} />;
        switch (status.toLowerCase()) {
            case 'delivered': return <CheckCircle size={16} />;
            case 'shipped': return <Truck size={16} />;
            case 'returned': return <RotateCcw size={16} />;
            default: return <Clock size={16} />;
        }
    };

    return (
        <VendorLayout>
            <div className="vendor-invoice-container">
                {/* Header */}
                <div className="invoice-header-row">
                    <div>
                        <h1>Invoice Management</h1>
                        <p>Generate and download invoices for your orders</p>
                    </div>
                    <div className="invoice-header-stats">
                        <div className="invoice-stat-card">
                            <FileText size={20} />
                            <div>
                                <span className="stat-number">{invoices.length}</span>
                                <span className="stat-label">Available Invoices</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="invoice-content-area">
                    {/* Search */}
                    <div className="invoice-control-bar">
                        <div className="invoice-search-wrapper">
                            <Search className="search-icon" size={18} />
                            <input
                                type="text"
                                placeholder="Search by Order ID or Customer..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Table */}
                    <div className="invoice-table-container">
                        {loading ? (
                            <div className="invoice-loading">
                                <Loader2 className="spinning-loader" size={24} />
                                <span>Loading invoices...</span>
                            </div>
                        ) : filteredInvoices.length === 0 ? (
                            <div className="invoice-empty">
                                <FileText size={48} />
                                <h3>No Invoices Available</h3>
                                <p>Invoices are generated for orders that are shipped, delivered, or completed.</p>
                            </div>
                        ) : (
                            <table className="invoice-data-table">
                                <thead>
                                    <tr>
                                        <th>Order ID</th>
                                        <th>Customer</th>
                                        <th>Date</th>
                                        <th>Amount</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredInvoices.map((inv, idx) => (
                                        <tr key={idx}>
                                            <td className="invoice-order-id">{inv.orderNumber}</td>
                                            <td>{inv.customerName}</td>
                                            <td className="invoice-date">{formatDate(inv.datePlaced)}</td>
                                            <td className="invoice-amount">₹{(inv.totalAmount || 0).toFixed(2)}</td>
                                            <td>
                                                <span className={`invoice-status-badge ${(inv.status || '').toLowerCase()}`}>
                                                    {getStatusIcon(inv.status)}
                                                    {inv.status || 'N/A'}
                                                </span>
                                            </td>
                                            <td>
                                                <button
                                                    className="invoice-download-btn"
                                                    onClick={() => downloadVendorInvoice(inv.orderId)}
                                                    title="Download Invoice"
                                                >
                                                    <Download size={16} />
                                                    Download
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </VendorLayout>
    );
};

export default VendorInvoiceManagement;
